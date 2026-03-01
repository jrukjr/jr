"""
Cliente MQTT para comunicação com a nuvem via Starlink
"""
import json
import time
import paho.mqtt.client as mqtt
from datetime import datetime
from typing import Dict, Callable, Optional

class MQTTClient:
    """
    Cliente MQTT para envio de dados e recebimento de comandos
    """
    
    def __init__(self, config):
        self.config = config
        self.client = None
        self.connected = False
        self.on_command_callback = None
        self.message_count = 0
        self.last_publish_time = None
        
    def on_connect(self, client, userdata, flags, rc):
        """Callback quando conecta ao broker"""
        if rc == 0:
            print(f"✓ Conectado ao broker MQTT: {self.config.MQTT_BROKER}")
            self.connected = True
            
            # Subscreve ao tópico de controle
            self.client.subscribe(self.config.TOPIC_CONTROL)
            print(f"✓ Subscrito ao tópico: {self.config.TOPIC_CONTROL}")
            
            # Publica status online
            self.publish_status({
                'online': True,
                'device_id': self.config.DEVICE_ID,
                'device_name': self.config.DEVICE_NAME,
                'location': self.config.LOCATION,
                'timestamp': datetime.now().isoformat()
            })
        else:
            print(f"✗ Falha na conexão MQTT. Código: {rc}")
            self.connected = False
    
    def on_disconnect(self, client, userdata, rc):
        """Callback quando desconecta do broker"""
        print(f"✗ Desconectado do broker MQTT. Código: {rc}")
        self.connected = False
        
        if rc != 0:
            print("Tentando reconectar...")
    
    def on_message(self, client, userdata, msg):
        """Callback quando recebe mensagem"""
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode())
            
            print(f"← Mensagem recebida [{topic}]: {payload}")
            
            # Processa comandos de controle
            if topic == self.config.TOPIC_CONTROL:
                if self.on_command_callback:
                    self.on_command_callback(payload)
        
        except Exception as e:
            print(f"Erro ao processar mensagem: {e}")
    
    def connect(self):
        """Conecta ao broker MQTT"""
        try:
            self.client = mqtt.Client(client_id=self.config.DEVICE_ID)
            
            # Configura callbacks
            self.client.on_connect = self.on_connect
            self.client.on_disconnect = self.on_disconnect
            self.client.on_message = self.on_message
            
            # Configura autenticação se necessário
            if self.config.MQTT_USERNAME:
                self.client.username_pw_set(
                    self.config.MQTT_USERNAME,
                    self.config.MQTT_PASSWORD
                )
            
            # Configura TLS se necessário
            if self.config.MQTT_USE_TLS:
                self.client.tls_set()
            
            # Configura Last Will (mensagem de desconexão)
            will_payload = json.dumps({
                'online': False,
                'device_id': self.config.DEVICE_ID,
                'timestamp': datetime.now().isoformat()
            })
            self.client.will_set(
                self.config.TOPIC_STATUS,
                will_payload,
                qos=1,
                retain=True
            )
            
            # Conecta ao broker
            print(f"Conectando ao broker MQTT: {self.config.MQTT_BROKER}:{self.config.MQTT_PORT}")
            self.client.connect(
                self.config.MQTT_BROKER,
                self.config.MQTT_PORT,
                keepalive=60
            )
            
            # Inicia loop em thread separada
            self.client.loop_start()
            
            # Aguarda conexão
            timeout = 10
            start_time = time.time()
            while not self.connected and (time.time() - start_time) < timeout:
                time.sleep(0.1)
            
            if not self.connected:
                raise Exception("Timeout na conexão MQTT")
            
            return True
        
        except Exception as e:
            print(f"Erro ao conectar MQTT: {e}")
            return False
    
    def disconnect(self):
        """Desconecta do broker"""
        if self.client:
            # Publica status offline
            self.publish_status({
                'online': False,
                'device_id': self.config.DEVICE_ID,
                'timestamp': datetime.now().isoformat()
            })
            
            self.client.loop_stop()
            self.client.disconnect()
            print("Desconectado do broker MQTT")
    
    def publish_sensor_data(self, sensor_data: Dict) -> bool:
        """
        Publica dados dos sensores
        
        Args:
            sensor_data: Dicionário com dados dos sensores
            
        Returns:
            True se publicado com sucesso
        """
        if not self.connected:
            print("✗ Não conectado ao broker MQTT")
            return False
        
        try:
            payload = {
                'device_id': self.config.DEVICE_ID,
                'timestamp': datetime.now().isoformat(),
                'sensors': sensor_data
            }
            
            result = self.client.publish(
                self.config.TOPIC_SENSOR_DATA,
                json.dumps(payload),
                qos=1
            )
            
            self.message_count += 1
            self.last_publish_time = time.time()
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                return True
            else:
                print(f"✗ Erro ao publicar dados: {result.rc}")
                return False
        
        except Exception as e:
            print(f"Erro ao publicar dados dos sensores: {e}")
            return False
    
    def publish_alarm(self, alarm: Dict) -> bool:
        """
        Publica alarme
        
        Args:
            alarm: Dicionário com dados do alarme
            
        Returns:
            True se publicado com sucesso
        """
        if not self.connected:
            return False
        
        try:
            payload = {
                'device_id': self.config.DEVICE_ID,
                'timestamp': datetime.now().isoformat(),
                'alarm': alarm
            }
            
            result = self.client.publish(
                self.config.TOPIC_ALARMS,
                json.dumps(payload),
                qos=2  # QoS 2 para alarmes (garantia de entrega)
            )
            
            return result.rc == mqtt.MQTT_ERR_SUCCESS
        
        except Exception as e:
            print(f"Erro ao publicar alarme: {e}")
            return False
    
    def publish_status(self, status: Dict) -> bool:
        """
        Publica status do sistema
        
        Args:
            status: Dicionário com status
            
        Returns:
            True se publicado com sucesso
        """
        if not self.client:
            return False
        
        try:
            result = self.client.publish(
                self.config.TOPIC_STATUS,
                json.dumps(status),
                qos=1,
                retain=True  # Retain para último status conhecido
            )
            
            return result.rc == mqtt.MQTT_ERR_SUCCESS
        
        except Exception as e:
            print(f"Erro ao publicar status: {e}")
            return False
    
    def publish_heartbeat(self) -> bool:
        """
        Publica heartbeat (sinal de vida)
        
        Returns:
            True se publicado com sucesso
        """
        if not self.connected:
            return False
        
        try:
            payload = {
                'device_id': self.config.DEVICE_ID,
                'timestamp': datetime.now().isoformat(),
                'uptime': time.time() - (self.last_publish_time or time.time()),
                'message_count': self.message_count
            }
            
            result = self.client.publish(
                self.config.TOPIC_HEARTBEAT,
                json.dumps(payload),
                qos=0
            )
            
            return result.rc == mqtt.MQTT_ERR_SUCCESS
        
        except Exception as e:
            print(f"Erro ao publicar heartbeat: {e}")
            return False
    
    def set_command_callback(self, callback: Callable):
        """
        Define callback para comandos recebidos
        
        Args:
            callback: Função a ser chamada quando receber comando
        """
        self.on_command_callback = callback
    
    def is_connected(self) -> bool:
        """Retorna se está conectado"""
        return self.connected
