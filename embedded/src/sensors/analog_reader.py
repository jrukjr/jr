"""
Leitor de sensores analógicos 4-20mA
Converte sinal de corrente para valores físicos
"""
import time
import random
from typing import Dict, Optional

class AnalogReader:
    """
    Classe para leitura de sensores analógicos 4-20mA
    Em produção, usar ADC real (ADS1115 ou similar)
    """
    
    def __init__(self, use_simulation: bool = True):
        self.use_simulation = use_simulation
        self.last_values = {}
        
        if not use_simulation:
            try:
                import board
                import busio
                import adafruit_ads1x15.ads1115 as ADS
                from adafruit_ads1x15.analog_in import AnalogIn
                
                i2c = busio.I2C(board.SCL, board.SDA)
                self.ads = ADS.ADS1115(i2c)
                self.channels = {
                    'suction': AnalogIn(self.ads, ADS.P0),
                    'pressure': AnalogIn(self.ads, ADS.P1),
                    'oil_level': AnalogIn(self.ads, ADS.P2),
                    'temperature': AnalogIn(self.ads, ADS.P3)
                }
            except Exception as e:
                print(f"Erro ao inicializar ADC, usando simulação: {e}")
                self.use_simulation = True
    
    def current_to_value(self, current_ma: float, min_val: float, max_val: float) -> float:
        """
        Converte corrente 4-20mA para valor físico
        
        Args:
            current_ma: Corrente em miliamperes (4-20)
            min_val: Valor mínimo da escala
            max_val: Valor máximo da escala
            
        Returns:
            Valor físico convertido
        """
        if current_ma < 4.0:
            return None  # Sensor desconectado ou com falha
        
        # Normaliza 4-20mA para 0-1
        normalized = (current_ma - 4.0) / 16.0
        
        # Converte para valor físico
        value = min_val + (normalized * (max_val - min_val))
        return round(value, 2)
    
    def voltage_to_current(self, voltage: float, r_shunt: float = 250.0) -> float:
        """
        Converte tensão lida no ADC para corrente
        
        Args:
            voltage: Tensão em volts
            r_shunt: Resistor shunt em ohms (padrão 250Ω para 4-20mA)
            
        Returns:
            Corrente em miliamperes
        """
        current_ma = (voltage / r_shunt) * 1000
        return current_ma
    
    def read_channel(self, channel_name: str) -> Optional[float]:
        """
        Lê um canal analógico
        
        Args:
            channel_name: Nome do canal
            
        Returns:
            Corrente em mA ou None se erro
        """
        if self.use_simulation:
            return self._simulate_current(channel_name)
        
        try:
            channel = self.channels.get(channel_name)
            if channel:
                voltage = channel.voltage
                current = self.voltage_to_current(voltage)
                return current
        except Exception as e:
            print(f"Erro ao ler canal {channel_name}: {e}")
            return None
    
    def _simulate_current(self, channel_name: str) -> float:
        """
        Simula leitura de corrente para testes
        """
        # Valores base de simulação
        base_values = {
            'suction': 12.0,      # ~-0.5 bar
            'pressure': 10.0,     # ~5.6 bar
            'oil_level': 16.0,    # ~75%
            'temperature': 14.0,  # ~93°C
            'oil_pressure': 12.0  # ~5 bar
        }
        
        base = base_values.get(channel_name, 12.0)
        
        # Adiciona variação aleatória
        noise = random.uniform(-0.5, 0.5)
        current = base + noise
        
        # Limita entre 4-20mA
        current = max(4.0, min(20.0, current))
        
        return round(current, 2)
    
    def read_all_sensors(self, sensor_ranges: Dict) -> Dict:
        """
        Lê todos os sensores e converte para valores físicos
        
        Args:
            sensor_ranges: Dicionário com ranges dos sensores
            
        Returns:
            Dicionário com valores dos sensores
        """
        readings = {}
        
        for sensor_name, config in sensor_ranges.items():
            if sensor_name == 'rpm':
                # RPM é lido de forma diferente (pulsos ou Modbus)
                readings[sensor_name] = self._read_rpm()
                continue
            
            current = self.read_channel(sensor_name)
            
            if current is not None:
                value = self.current_to_value(
                    current,
                    config['min'],
                    config['max']
                )
                readings[sensor_name] = {
                    'value': value,
                    'current_ma': current,
                    'unit': config['unit'],
                    'status': 'ok' if value is not None else 'fault'
                }
            else:
                readings[sensor_name] = {
                    'value': None,
                    'current_ma': None,
                    'unit': config['unit'],
                    'status': 'disconnected'
                }
        
        self.last_values = readings
        return readings
    
    def _read_rpm(self) -> Dict:
        """
        Lê RPM da bomba (simulado ou via encoder/Modbus)
        """
        if self.use_simulation:
            rpm = random.randint(1200, 1800)
        else:
            # Implementar leitura real via encoder ou Modbus
            rpm = 0
        
        return {
            'value': rpm,
            'unit': 'RPM',
            'status': 'ok'
        }
    
    def check_sensor_health(self) -> Dict:
        """
        Verifica saúde dos sensores
        """
        health = {}
        
        for sensor_name, data in self.last_values.items():
            status = data.get('status', 'unknown')
            current = data.get('current_ma')
            
            if status == 'disconnected':
                health[sensor_name] = 'disconnected'
            elif current and (current < 3.5 or current > 20.5):
                health[sensor_name] = 'out_of_range'
            else:
                health[sensor_name] = 'ok'
        
        return health
