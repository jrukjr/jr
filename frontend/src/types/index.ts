export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface Device {
  id: number;
  device_id: string;
  device_name: string;
  location: string;
  status: 'online' | 'offline';
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface SensorReading {
  value: number | null;
  current_ma?: number;
  unit: string;
  status: 'ok' | 'fault' | 'disconnected';
}

export interface SensorData {
  id?: number;
  device_id: string;
  timestamp: string;
  suction_value?: number;
  suction_current?: number;
  pressure_value?: number;
  pressure_current?: number;
  rpm_value?: number;
  oil_level_value?: number;
  oil_level_current?: number;
  temperature_value?: number;
  temperature_current?: number;
  oil_pressure_value?: number;
  oil_pressure_current?: number;
  sensors?: {
    suction: SensorReading;
    pressure: SensorReading;
    rpm: SensorReading;
    oil_level: SensorReading;
    temperature: SensorReading;
    oil_pressure: SensorReading;
  };
}

export interface Alarm {
  id: number;
  device_id: string;
  timestamp: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  acknowledged: boolean;
  acknowledged_by?: number;
  acknowledged_at?: string;
  resolved: boolean;
  resolved_at?: string;
  metadata?: any;
  created_at: string;
}

export interface PLCStatus {
  pump_running: boolean;
  pump_enabled: boolean;
  emergency_stop: boolean;
  active_interlocks: string[];
  alarms_count: number;
  timestamp: string;
}

export interface Command {
  id: number;
  device_id: string;
  command: string;
  params?: any;
  issued_by: number;
  issued_at: string;
  executed: boolean;
  executed_at?: string;
  result?: any;
  username?: string;
}

export interface SensorStats {
  avg_suction: number;
  max_suction: number;
  min_suction: number;
  avg_pressure: number;
  max_pressure: number;
  min_pressure: number;
  avg_rpm: number;
  max_rpm: number;
  min_rpm: number;
  avg_oil_level: number;
  min_oil_level: number;
  avg_temperature: number;
  max_temperature: number;
  min_temperature: number;
  avg_oil_pressure: number;
  min_oil_pressure: number;
}
