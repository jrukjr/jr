"""
Configuração do sistema embarcado
"""
import os
from dotenv import load_dotenv

load_dotenv()

# MQTT Configuration
MQTT_BROKER = os.getenv('MQTT_BROKER', 'localhost')
MQTT_PORT = int(os.getenv('MQTT_PORT', 1883))
MQTT_USERNAME = os.getenv('MQTT_USERNAME', '')
MQTT_PASSWORD = os.getenv('MQTT_PASSWORD', '')
MQTT_USE_TLS = os.getenv('MQTT_USE_TLS', 'false').lower() == 'true'

# Device Configuration
DEVICE_ID = os.getenv('DEVICE_ID', 'draga-001')
DEVICE_NAME = os.getenv('DEVICE_NAME', 'Draga Principal')
LOCATION = os.getenv('LOCATION', 'Porto')

# Sensor Configuration
SAMPLE_RATE = float(os.getenv('SAMPLE_RATE', 1.0))
ALARM_CHECK_INTERVAL = float(os.getenv('ALARM_CHECK_INTERVAL', 0.5))

# Safety Limits
MAX_PRESSURE = float(os.getenv('MAX_PRESSURE', 12.0))
MAX_TEMPERATURE = float(os.getenv('MAX_TEMPERATURE', 90.0))
MIN_OIL_LEVEL = float(os.getenv('MIN_OIL_LEVEL', 20.0))
MIN_OIL_PRESSURE = float(os.getenv('MIN_OIL_PRESSURE', 2.0))
MAX_SUCTION = float(os.getenv('MAX_SUCTION', -0.8))

# GPIO Pins
PUMP_RELAY_PIN = int(os.getenv('PUMP_RELAY_PIN', 17))
ALARM_LED_PIN = int(os.getenv('ALARM_LED_PIN', 27))
STATUS_LED_PIN = int(os.getenv('STATUS_LED_PIN', 22))

# Serial/Modbus Configuration
MODBUS_PORT = os.getenv('MODBUS_PORT', '/dev/ttyUSB0')
MODBUS_BAUDRATE = int(os.getenv('MODBUS_BAUDRATE', 9600))
MODBUS_SLAVE_ID = int(os.getenv('MODBUS_SLAVE_ID', 1))

# MQTT Topics
TOPIC_SENSOR_DATA = f"draga/{DEVICE_ID}/sensors"
TOPIC_ALARMS = f"draga/{DEVICE_ID}/alarms"
TOPIC_STATUS = f"draga/{DEVICE_ID}/status"
TOPIC_CONTROL = f"draga/{DEVICE_ID}/control"
TOPIC_HEARTBEAT = f"draga/{DEVICE_ID}/heartbeat"

# Sensor Ranges (for 4-20mA conversion)
SENSOR_RANGES = {
    'suction': {'min': -1.0, 'max': 0.0, 'unit': 'bar'},
    'pressure': {'min': 0.0, 'max': 15.0, 'unit': 'bar'},
    'rpm': {'min': 0, 'max': 3000, 'unit': 'RPM'},
    'oil_level': {'min': 0, 'max': 100, 'unit': '%'},
    'temperature': {'min': 0, 'max': 150, 'unit': '°C'},
    'oil_pressure': {'min': 0, 'max': 10, 'unit': 'bar'}
}
