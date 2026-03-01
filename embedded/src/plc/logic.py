"""
Lógica CLP (Controlador Lógico Programável)
Implementa intertravamentos e sequências de segurança
"""
import time
from typing import Dict, List, Optional
from datetime import datetime

class PLCLogic:
    """
    Implementa lógica de controle tipo CLP (Ladder Logic)
    """
    
    def __init__(self, config):
        self.config = config
        self.pump_running = False
        self.pump_enabled = True
        self.emergency_stop = False
        self.alarms = []
        self.interlocks = []
        self.start_sequence_active = False
        self.stop_sequence_active = False
        self.last_sensor_data = {}
        
    def evaluate_interlocks(self, sensor_data: Dict) -> Dict:
        """
        Avalia intertravamentos de segurança
        
        Returns:
            Dict com status dos intertravamentos
        """
        self.last_sensor_data = sensor_data
        interlocks = {
            'pressure_high': False,
            'temperature_high': False,
            'oil_level_low': False,
            'oil_pressure_low': False,
            'suction_fault': False,
            'air_intake': False,
            'sensor_fault': False
        }
        
        # Verifica pressão alta
        pressure = sensor_data.get('pressure', {}).get('value')
        if pressure and pressure > self.config.MAX_PRESSURE:
            interlocks['pressure_high'] = True
        
        # Verifica temperatura alta
        temperature = sensor_data.get('temperature', {}).get('value')
        if temperature and temperature > self.config.MAX_TEMPERATURE:
            interlocks['temperature_high'] = True
        
        # Verifica nível de óleo baixo
        oil_level = sensor_data.get('oil_level', {}).get('value')
        if oil_level and oil_level < self.config.MIN_OIL_LEVEL:
            interlocks['oil_level_low'] = True
        
        # Verifica pressão de óleo baixa
        oil_pressure = sensor_data.get('oil_pressure', {}).get('value')
        if oil_pressure and oil_pressure < self.config.MIN_OIL_PRESSURE:
            interlocks['oil_pressure_low'] = True
        
        # Verifica sucção fora de range
        suction = sensor_data.get('suction', {}).get('value')
        if suction and suction < self.config.MAX_SUCTION:
            interlocks['suction_fault'] = True
        
        # Detecta entrada de ar (variação brusca na sucção)
        if self._detect_air_intake(suction):
            interlocks['air_intake'] = True
        
        # Verifica falha de sensores
        for sensor_name, data in sensor_data.items():
            if data.get('status') != 'ok':
                interlocks['sensor_fault'] = True
                break
        
        self.interlocks = [k for k, v in interlocks.items() if v]
        return interlocks
    
    def _detect_air_intake(self, current_suction: Optional[float]) -> bool:
        """
        Detecta entrada de ar por variação brusca na sucção
        """
        if not hasattr(self, '_suction_history'):
            self._suction_history = []
        
        if current_suction is not None:
            self._suction_history.append(current_suction)
            
            # Mantém apenas últimas 10 leituras
            if len(self._suction_history) > 10:
                self._suction_history.pop(0)
            
            # Detecta variação > 0.3 bar em 1 segundo
            if len(self._suction_history) >= 5:
                variation = max(self._suction_history[-5:]) - min(self._suction_history[-5:])
                if variation > 0.3:
                    return True
        
        return False
    
    def can_start_pump(self, interlocks: Dict) -> tuple[bool, str]:
        """
        Verifica se bomba pode ser ligada
        
        Returns:
            (pode_ligar, motivo)
        """
        if self.emergency_stop:
            return False, "Parada de emergência ativada"
        
        if not self.pump_enabled:
            return False, "Bomba desabilitada"
        
        if self.pump_running:
            return False, "Bomba já está ligada"
        
        # Verifica intertravamentos críticos
        critical_interlocks = [
            'pressure_high',
            'temperature_high',
            'oil_level_low',
            'oil_pressure_low'
        ]
        
        for interlock in critical_interlocks:
            if interlocks.get(interlock):
                return False, f"Intertravamento: {interlock}"
        
        # Verifica condições mínimas
        oil_level = self.last_sensor_data.get('oil_level', {}).get('value', 0)
        if oil_level < 30:
            return False, "Nível de óleo insuficiente para partida"
        
        return True, "OK"
    
    def start_pump_sequence(self) -> List[str]:
        """
        Executa sequência de partida da bomba
        
        Returns:
            Lista de passos executados
        """
        sequence_steps = []
        
        sequence_steps.append("1. Verificando pré-condições")
        time.sleep(0.5)
        
        sequence_steps.append("2. Ativando pré-lubrificação")
        time.sleep(1.0)
        
        sequence_steps.append("3. Verificando pressão de óleo")
        time.sleep(0.5)
        
        sequence_steps.append("4. Energizando motor principal")
        time.sleep(0.5)
        
        sequence_steps.append("5. Rampa de aceleração")
        time.sleep(1.0)
        
        sequence_steps.append("6. Bomba em operação normal")
        self.pump_running = True
        
        return sequence_steps
    
    def stop_pump_sequence(self, emergency: bool = False) -> List[str]:
        """
        Executa sequência de parada da bomba
        
        Args:
            emergency: Se True, parada imediata
            
        Returns:
            Lista de passos executados
        """
        sequence_steps = []
        
        if emergency:
            sequence_steps.append("PARADA DE EMERGÊNCIA")
            self.pump_running = False
            return sequence_steps
        
        sequence_steps.append("1. Iniciando desaceleração")
        time.sleep(1.0)
        
        sequence_steps.append("2. Reduzindo RPM gradualmente")
        time.sleep(1.5)
        
        sequence_steps.append("3. Desenergizando motor")
        time.sleep(0.5)
        
        sequence_steps.append("4. Bomba parada")
        self.pump_running = False
        
        return sequence_steps
    
    def evaluate_auto_shutdown(self, interlocks: Dict) -> tuple[bool, str]:
        """
        Avalia se deve fazer shutdown automático
        
        Returns:
            (deve_desligar, motivo)
        """
        if not self.pump_running:
            return False, ""
        
        # Condições de shutdown automático
        critical_conditions = {
            'pressure_high': "Pressão crítica",
            'temperature_high': "Temperatura crítica",
            'oil_pressure_low': "Pressão de óleo crítica",
            'air_intake': "Entrada de ar detectada"
        }
        
        for condition, message in critical_conditions.items():
            if interlocks.get(condition):
                return True, message
        
        return False, ""
    
    def get_status(self) -> Dict:
        """
        Retorna status completo do CLP
        """
        return {
            'pump_running': self.pump_running,
            'pump_enabled': self.pump_enabled,
            'emergency_stop': self.emergency_stop,
            'active_interlocks': self.interlocks,
            'alarms_count': len(self.alarms),
            'timestamp': datetime.now().isoformat()
        }
    
    def set_pump_command(self, command: str) -> Dict:
        """
        Processa comando de controle da bomba
        
        Args:
            command: 'start', 'stop', 'emergency_stop', 'enable', 'disable'
            
        Returns:
            Resultado do comando
        """
        result = {
            'success': False,
            'message': '',
            'timestamp': datetime.now().isoformat()
        }
        
        if command == 'start':
            interlocks = self.evaluate_interlocks(self.last_sensor_data)
            can_start, reason = self.can_start_pump(interlocks)
            
            if can_start:
                steps = self.start_pump_sequence()
                result['success'] = True
                result['message'] = 'Bomba ligada com sucesso'
                result['steps'] = steps
            else:
                result['message'] = f'Não foi possível ligar: {reason}'
        
        elif command == 'stop':
            if self.pump_running:
                steps = self.stop_pump_sequence(emergency=False)
                result['success'] = True
                result['message'] = 'Bomba desligada com sucesso'
                result['steps'] = steps
            else:
                result['message'] = 'Bomba já está desligada'
        
        elif command == 'emergency_stop':
            self.emergency_stop = True
            steps = self.stop_pump_sequence(emergency=True)
            result['success'] = True
            result['message'] = 'Parada de emergência executada'
            result['steps'] = steps
        
        elif command == 'enable':
            self.pump_enabled = True
            self.emergency_stop = False
            result['success'] = True
            result['message'] = 'Bomba habilitada'
        
        elif command == 'disable':
            self.pump_enabled = False
            if self.pump_running:
                self.stop_pump_sequence(emergency=False)
            result['success'] = True
            result['message'] = 'Bomba desabilitada'
        
        else:
            result['message'] = f'Comando desconhecido: {command}'
        
        return result
