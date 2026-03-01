#!/usr/bin/env python3
"""
Sistema Embarcado de Controle de Draga
Aplicação principal que coordena sensores, CLP e comunicação MQTT
"""
import sys
import time
import signal
from datetime import datetime
from typing import Dict

# Importa módulos do sistema
import config
from sensors.analog_reader import AnalogReader
from plc.logic import PLCLogic
from mqtt.client import MQTTClient

class DragaController:
    """
    Controlador principal do sistema embarcado
    """
    
    def __init__(self):
        print("=" * 60)
        print("SISTEMA DE CONTROLE DE DRAGA")
        print(f"Device ID: {config.DEVICE_ID}")
        print(f"Device Name: {config.DEVICE_NAME}")
        print(f"Location: {config.LOCATION}")
        print("=" * 60)
        
        # Inicializa componentes
        self.sensor_reader = AnalogReader(use_simulation=True)
        self.plc = PLCLogic(config)
        self.mqtt_client = MQTTClient(config)
        
        self.running = False
        self.cycle_count = 0
        self.last_heartbeat = time.time()
        
        # Configura handler de sinais
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
    
    def signal_handler(self, signum, frame):
        """Handler para sinais de sistema (Ctrl+C, etc)"""
        print("\n\nRecebido sinal de parada...")
        self.stop()
    
    def start(self):
        """Inicia o sistema"""
        print("\n[INICIALIZAÇÃO]")
        
        # Conecta ao MQTT
        print("Conectando ao broker MQTT...")
        if not self.mqtt_client.connect():
            print("✗ Falha ao conectar ao MQTT. Sistema não pode iniciar.")
            return False
        
        # Configura callback de comandos
        self.mqtt_client.set_command_callback(self.handle_command)
        
        print("✓ Sistema inicializado com sucesso\n")
        self.running = True
        
        # Loop principal
        self.main_loop()
        
        return True
    
    def stop(self):
        """Para o sistema"""
        print("\n[DESLIGAMENTO]")
        self.running = False
        
        # Para bomba se estiver ligada
        if self.plc.pump_running:
            print("Parando bomba...")
            self.plc.stop_pump_sequence(emergency=False)
        
        # Desconecta MQTT
        print("Desconectando MQTT...")
        self.mqtt_client.disconnect()
        
        print("✓ Sistema desligado\n")
        sys.exit(0)
    
    def main_loop(self):
        """Loop principal de controle"""
        print("[LOOP PRINCIPAL INICIADO]")
        print(f"Taxa de amostragem: {config.SAMPLE_RATE}s\n")
        
        while self.running:
            try:
                cycle_start = time.time()
                self.cycle_count += 1
                
                # 1. Lê sensores
                sensor_data = self.sensor_reader.read_all_sensors(config.SENSOR_RANGES)
                
                # 2. Avalia intertravamentos
                interlocks = self.plc.evaluate_interlocks(sensor_data)
                
                # 3. Verifica se precisa desligar automaticamente
                should_shutdown, reason = self.plc.evaluate_auto_shutdown(interlocks)
                if should_shutdown:
                    print(f"\n⚠️  SHUTDOWN AUTOMÁTICO: {reason}")
                    self.plc.stop_pump_sequence(emergency=True)
                    self.publish_alarm({
                        'type': 'auto_shutdown',
                        'severity': 'critical',
                        'message': reason,
                        'interlocks': list(interlocks.keys())
                    })
                
                # 4. Publica dados via MQTT
                self.mqtt_client.publish_sensor_data(sensor_data)
                
                # 5. Publica status do PLC
                plc_status = self.plc.get_status()
                self.mqtt_client.publish_status(plc_status)
                
                # 6. Publica alarmes ativos
                if self.plc.interlocks:
                    for interlock in self.plc.interlocks:
                        self.publish_alarm({
                            'type': 'interlock',
                            'severity': 'warning',
                            'message': f'Intertravamento ativo: {interlock}',
                            'interlock': interlock
                        })
                
                # 7. Heartbeat a cada 30 segundos
                if time.time() - self.last_heartbeat > 30:
                    self.mqtt_client.publish_heartbeat()
                    self.last_heartbeat = time.time()
                
                # 8. Exibe status no console (a cada 10 ciclos)
                if self.cycle_count % 10 == 0:
                    self.print_status(sensor_data, plc_status)
                
                # 9. Aguarda próximo ciclo
                cycle_time = time.time() - cycle_start
                sleep_time = max(0, config.SAMPLE_RATE - cycle_time)
                time.sleep(sleep_time)
            
            except Exception as e:
                print(f"\n✗ Erro no loop principal: {e}")
                import traceback
                traceback.print_exc()
                time.sleep(1)
    
    def print_status(self, sensor_data: Dict, plc_status: Dict):
        """Imprime status no console"""
        print("\n" + "=" * 60)
        print(f"CICLO #{self.cycle_count} - {datetime.now().strftime('%H:%M:%S')}")
        print("-" * 60)
        
        # Sensores
        print("SENSORES:")
        for sensor_name, data in sensor_data.items():
            value = data.get('value')
            unit = data.get('unit', '')
            status = data.get('status', 'unknown')
            
            status_icon = "✓" if status == 'ok' else "✗"
            print(f"  {status_icon} {sensor_name:15s}: {value:8} {unit:5s} [{status}]")
        
        # Status PLC
        print("\nSTATUS PLC:")
        pump_status = "LIGADA" if plc_status['pump_running'] else "DESLIGADA"
        print(f"  Bomba: {pump_status}")
        print(f"  Habilitada: {plc_status['pump_enabled']}")
        print(f"  Emergência: {plc_status['emergency_stop']}")
        
        if plc_status['active_interlocks']:
            print(f"  ⚠️  Intertravamentos: {', '.join(plc_status['active_interlocks'])}")
        
        # Conexão
        mqtt_status = "CONECTADO" if self.mqtt_client.is_connected() else "DESCONECTADO"
        print(f"\nMQTT: {mqtt_status}")
        print("=" * 60)
    
    def handle_command(self, command_data: Dict):
        """
        Processa comandos recebidos via MQTT
        
        Args:
            command_data: Dados do comando
        """
        try:
            command = command_data.get('command')
            params = command_data.get('params', {})
            
            print(f"\n→ Comando recebido: {command}")
            
            # Comandos de controle da bomba
            if command in ['start', 'stop', 'emergency_stop', 'enable', 'disable']:
                result = self.plc.set_pump_command(command)
                
                # Publica resultado
                self.mqtt_client.publish_status({
                    'command_result': result,
                    'plc_status': self.plc.get_status()
                })
                
                print(f"  Resultado: {result['message']}")
                
                if result.get('steps'):
                    for step in result['steps']:
                        print(f"    {step}")
            
            # Comando de reset de alarmes
            elif command == 'reset_alarms':
                self.plc.alarms = []
                print("  Alarmes resetados")
            
            # Comando de configuração
            elif command == 'set_config':
                # Implementar atualização de configuração
                print(f"  Configuração atualizada: {params}")
            
            else:
                print(f"  ✗ Comando desconhecido: {command}")
        
        except Exception as e:
            print(f"✗ Erro ao processar comando: {e}")
    
    def publish_alarm(self, alarm: Dict):
        """Publica alarme"""
        alarm['timestamp'] = datetime.now().isoformat()
        self.mqtt_client.publish_alarm(alarm)
        
        # Adiciona ao histórico local
        self.plc.alarms.append(alarm)
        
        # Mantém apenas últimos 100 alarmes
        if len(self.plc.alarms) > 100:
            self.plc.alarms = self.plc.alarms[-100:]

def main():
    """Função principal"""
    controller = DragaController()
    
    try:
        controller.start()
    except Exception as e:
        print(f"\n✗ Erro fatal: {e}")
        import traceback
        traceback.print_exc()
        controller.stop()

if __name__ == "__main__":
    main()
