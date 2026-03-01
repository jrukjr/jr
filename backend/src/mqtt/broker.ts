import mqtt from 'mqtt';
import { EventEmitter } from 'events';
import pool from '../config/database';

interface SensorData {
  device_id: string;
  timestamp: string;
  sensors: {
    [key: string]: {
      value: number;
      current_ma?: number;
      unit: string;
      status: string;
    };
  };
}

interface AlarmData {
  device_id: string;
  timestamp: string;
  alarm: {
    type: string;
    severity: string;
    message: string;
    [key: string]: any;
  };
}

interface StatusData {
  device_id?: string;
  pump_running?: boolean;
  pump_enabled?: boolean;
  emergency_stop?: boolean;
  active_interlocks?: string[];
  alarms_count?: number;
  timestamp?: string;
  online?: boolean;
}

class MQTTBroker extends EventEmitter {
  private client: mqtt.MqttClient | null = null;
  private connected: boolean = false;

  constructor() {
    super();
  }

  connect(): void {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    
    console.log(`Conectando ao broker MQTT: ${brokerUrl}`);
    
    this.client = mqtt.connect(brokerUrl, {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      clientId: 'draga-backend-' + Math.random().toString(16).substr(2, 8),
      clean: true,
      reconnectPeriod: 5000,
    });

    this.client.on('connect', () => {
      console.log('✓ Conectado ao broker MQTT');
      this.connected = true;
      
      // Subscreve aos tópicos
      this.client?.subscribe('draga/+/sensors', (err) => {
        if (err) console.error('Erro ao subscrever sensors:', err);
        else console.log('✓ Subscrito: draga/+/sensors');
      });
      
      this.client?.subscribe('draga/+/alarms', (err) => {
        if (err) console.error('Erro ao subscrever alarms:', err);
        else console.log('✓ Subscrito: draga/+/alarms');
      });
      
      this.client?.subscribe('draga/+/status', (err) => {
        if (err) console.error('Erro ao subscrever status:', err);
        else console.log('✓ Subscrito: draga/+/status');
      });
      
      this.client?.subscribe('draga/+/heartbeat', (err) => {
        if (err) console.error('Erro ao subscrever heartbeat:', err);
        else console.log('✓ Subscrito: draga/+/heartbeat');
      });
    });

    this.client.on('message', async (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        await this.handleMessage(topic, data);
      } catch (error) {
        console.error('Erro ao processar mensagem MQTT:', error);
      }
    });

    this.client.on('error', (error) => {
      console.error('Erro MQTT:', error);
    });

    this.client.on('offline', () => {
      console.log('✗ MQTT offline');
      this.connected = false;
    });

    this.client.on('reconnect', () => {
      console.log('Reconectando ao MQTT...');
    });
  }

  private async handleMessage(topic: string, data: any): Promise<void> {
    const parts = topic.split('/');
    const messageType = parts[2];

    switch (messageType) {
      case 'sensors':
        await this.handleSensorData(data as SensorData);
        this.emit('sensor_data', data);
        break;
      
      case 'alarms':
        await this.handleAlarmData(data as AlarmData);
        this.emit('alarm', data);
        break;
      
      case 'status':
        await this.handleStatusData(data as StatusData);
        this.emit('status', data);
        break;
      
      case 'heartbeat':
        await this.handleHeartbeat(data);
        this.emit('heartbeat', data);
        break;
    }
  }

  private async handleSensorData(data: SensorData): Promise<void> {
    try {
      const { device_id, timestamp, sensors } = data;
      
      const query = `
        INSERT INTO sensor_data (
          device_id, timestamp,
          suction_value, suction_current,
          pressure_value, pressure_current,
          rpm_value,
          oil_level_value, oil_level_current,
          temperature_value, temperature_current,
          oil_pressure_value, oil_pressure_current
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `;
      
      const values = [
        device_id,
        timestamp,
        sensors.suction?.value || null,
        sensors.suction?.current_ma || null,
        sensors.pressure?.value || null,
        sensors.pressure?.current_ma || null,
        sensors.rpm?.value || null,
        sensors.oil_level?.value || null,
        sensors.oil_level?.current_ma || null,
        sensors.temperature?.value || null,
        sensors.temperature?.current_ma || null,
        sensors.oil_pressure?.value || null,
        sensors.oil_pressure?.current_ma || null,
      ];
      
      await pool.query(query, values);
    } catch (error) {
      console.error('Erro ao salvar dados de sensores:', error);
    }
  }

  private async handleAlarmData(data: AlarmData): Promise<void> {
    try {
      const { device_id, timestamp, alarm } = data;
      
      const query = `
        INSERT INTO alarms (
          device_id, timestamp, type, severity, message, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      const values = [
        device_id,
        timestamp,
        alarm.type,
        alarm.severity,
        alarm.message,
        JSON.stringify(alarm),
      ];
      
      await pool.query(query, values);
    } catch (error) {
      console.error('Erro ao salvar alarme:', error);
    }
  }

  private async handleStatusData(data: StatusData): Promise<void> {
    try {
      const { device_id } = data;
      
      if (!device_id) return;
      
      // Atualiza status do dispositivo
      if (data.online !== undefined) {
        const updateDevice = `
          UPDATE devices 
          SET status = $1, last_seen = CURRENT_TIMESTAMP
          WHERE device_id = $2
        `;
        await pool.query(updateDevice, [
          data.online ? 'online' : 'offline',
          device_id
        ]);
      }
      
      // Salva status do PLC
      if (data.pump_running !== undefined) {
        const query = `
          INSERT INTO plc_status (
            device_id, timestamp, pump_running, pump_enabled,
            emergency_stop, active_interlocks, alarms_count
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        const values = [
          device_id,
          data.timestamp || new Date().toISOString(),
          data.pump_running,
          data.pump_enabled,
          data.emergency_stop,
          JSON.stringify(data.active_interlocks || []),
          data.alarms_count || 0,
        ];
        
        await pool.query(query, values);
      }
    } catch (error) {
      console.error('Erro ao salvar status:', error);
    }
  }

  private async handleHeartbeat(data: any): Promise<void> {
    try {
      const { device_id } = data;
      
      if (device_id) {
        await pool.query(
          'UPDATE devices SET last_seen = CURRENT_TIMESTAMP WHERE device_id = $1',
          [device_id]
        );
      }
    } catch (error) {
      console.error('Erro ao processar heartbeat:', error);
    }
  }

  publishCommand(deviceId: string, command: string, params: any = {}): boolean {
    if (!this.connected || !this.client) {
      console.error('MQTT não conectado');
      return false;
    }

    const topic = `draga/${deviceId}/control`;
    const payload = JSON.stringify({ command, params });
    
    this.client.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error('Erro ao publicar comando:', err);
      } else {
        console.log(`✓ Comando publicado: ${command} para ${deviceId}`);
      }
    });

    return true;
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.connected = false;
      console.log('Desconectado do broker MQTT');
    }
  }
}

export default new MQTTBroker();
