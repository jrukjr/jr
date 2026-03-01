import pool from '../config/database';

const migrations = `
-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'operator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de dispositivos (dragas)
CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) UNIQUE NOT NULL,
  device_name VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  status VARCHAR(20) DEFAULT 'offline',
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de dados de sensores
CREATE TABLE IF NOT EXISTS sensor_data (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  suction_value DECIMAL(10, 2),
  suction_current DECIMAL(10, 2),
  pressure_value DECIMAL(10, 2),
  pressure_current DECIMAL(10, 2),
  rpm_value INTEGER,
  oil_level_value DECIMAL(10, 2),
  oil_level_current DECIMAL(10, 2),
  temperature_value DECIMAL(10, 2),
  temperature_current DECIMAL(10, 2),
  oil_pressure_value DECIMAL(10, 2),
  oil_pressure_current DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

-- Índice para consultas rápidas por device_id e timestamp
CREATE INDEX IF NOT EXISTS idx_sensor_data_device_timestamp 
ON sensor_data(device_id, timestamp DESC);

-- Tabela de alarmes
CREATE TABLE IF NOT EXISTS alarms (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by INTEGER,
  acknowledged_at TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
  FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Índice para alarmes não resolvidos
CREATE INDEX IF NOT EXISTS idx_alarms_unresolved 
ON alarms(device_id, resolved, timestamp DESC);

-- Tabela de status do PLC
CREATE TABLE IF NOT EXISTS plc_status (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  pump_running BOOLEAN NOT NULL,
  pump_enabled BOOLEAN NOT NULL,
  emergency_stop BOOLEAN NOT NULL,
  active_interlocks JSONB,
  alarms_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

-- Índice para status do PLC
CREATE INDEX IF NOT EXISTS idx_plc_status_device_timestamp 
ON plc_status(device_id, timestamp DESC);

-- Tabela de comandos
CREATE TABLE IF NOT EXISTS commands (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,
  command VARCHAR(50) NOT NULL,
  params JSONB,
  issued_by INTEGER NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  executed BOOLEAN DEFAULT FALSE,
  executed_at TIMESTAMP,
  result JSONB,
  FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  updated_by INTEGER,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(device_id, key)
);

-- Inserir usuário admin padrão (senha: admin123)
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@draga.com', '$2a$10$XQqP5K3rZ8YvZ8YvZ8YvZeN8YvZ8YvZ8YvZ8YvZ8YvZ8YvZ8YvZ8Y', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Inserir dispositivo de exemplo
INSERT INTO devices (device_id, device_name, location, status)
VALUES ('draga-001', 'Draga Principal', 'Porto Santos', 'offline')
ON CONFLICT (device_id) DO NOTHING;
`;

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('Executando migrações...');
    await client.query(migrations);
    console.log('✓ Migrações executadas com sucesso!');
  } catch (error) {
    console.error('✗ Erro ao executar migrações:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Banco de dados inicializado!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

export default runMigrations;
