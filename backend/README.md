# Backend API - Sistema de Draga

API REST em Node.js + TypeScript para gerenciamento do sistema de automação de draga.

## Funcionalidades

- ✅ API REST completa
- ✅ Autenticação JWT
- ✅ Integração MQTT (recebe dados dos dispositivos)
- ✅ WebSocket (push de dados em tempo real)
- ✅ Banco de dados PostgreSQL
- ✅ Histórico de sensores
- ✅ Gerenciamento de alarmes
- ✅ Controle remoto de dispositivos
- ✅ Rate limiting e segurança

## Instalação

```bash
cd backend
npm install
```

## Configuração

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
PORT=3001
DATABASE_URL=postgresql://draga:draga123@localhost:5432/draga_db
JWT_SECRET=your-secret-key
MQTT_BROKER_URL=mqtt://localhost:1883
```

## Banco de Dados

### Criar banco de dados PostgreSQL

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco e usuário
CREATE DATABASE draga_db;
CREATE USER draga WITH PASSWORD 'draga123';
GRANT ALL PRIVILEGES ON DATABASE draga_db TO draga;
```

### Executar migrações

```bash
npm run migrate
```

Isso criará todas as tabelas necessárias:
- `users` - Usuários do sistema
- `devices` - Dispositivos (dragas)
- `sensor_data` - Dados dos sensores
- `alarms` - Alarmes
- `plc_status` - Status do PLC
- `commands` - Histórico de comandos
- `settings` - Configurações

## Execução

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm run build
npm start
```

## API Endpoints

### Autenticação

#### POST /api/auth/login
Login de usuário

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Resposta:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@draga.com",
    "role": "admin"
  }
}
```

#### POST /api/auth/register
Registrar novo usuário

```json
{
  "username": "operador1",
  "email": "operador@draga.com",
  "password": "senha123",
  "role": "operator"
}
```

### Dispositivos

#### GET /api/devices
Lista todos os dispositivos

#### GET /api/devices/:deviceId
Detalhes de um dispositivo

#### POST /api/devices
Criar novo dispositivo

```json
{
  "device_id": "draga-002",
  "device_name": "Draga Secundária",
  "location": "Porto Rio"
}
```

### Sensores

#### GET /api/sensors/:deviceId/latest
Última leitura dos sensores

#### GET /api/sensors/:deviceId/history
Histórico de leituras

Query params:
- `start` - Data/hora inicial (ISO 8601)
- `end` - Data/hora final (ISO 8601)
- `limit` - Limite de registros (padrão: 1000)

Exemplo:
```
GET /api/sensors/draga-001/history?start=2024-01-01T00:00:00Z&limit=500
```

#### GET /api/sensors/:deviceId/stats
Estatísticas dos sensores

Query params:
- `hours` - Número de horas (padrão: 24)

Resposta:
```json
{
  "avg_pressure": 8.5,
  "max_pressure": 12.0,
  "min_pressure": 5.2,
  "avg_temperature": 75.3,
  ...
}
```

### Alarmes

#### GET /api/alarms/:deviceId
Lista alarmes do dispositivo

Query params:
- `resolved` - true/false (padrão: false)
- `limit` - Limite de registros (padrão: 100)

#### POST /api/alarms/:alarmId/acknowledge
Reconhecer alarme

#### POST /api/alarms/:alarmId/resolve
Resolver alarme

### Comandos

#### POST /api/commands/:deviceId
Enviar comando para dispositivo

```json
{
  "command": "start",
  "params": {}
}
```

Comandos disponíveis:
- `start` - Ligar bomba
- `stop` - Desligar bomba
- `emergency_stop` - Parada de emergência
- `enable` - Habilitar bomba
- `disable` - Desabilitar bomba
- `reset_alarms` - Resetar alarmes

#### GET /api/commands/:deviceId/history
Histórico de comandos

### Health Check

#### GET /api/health
Verifica saúde da API

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## WebSocket

### Conectar

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

// Subscrever a um dispositivo
socket.emit('subscribe', 'draga-001');
```

### Eventos

- `sensor_data` - Dados de sensores em tempo real
- `alarm` - Novo alarme
- `status` - Atualização de status
- `heartbeat` - Sinal de vida do dispositivo

```javascript
socket.on('sensor_data', (data) => {
  console.log('Novos dados:', data);
});

socket.on('alarm', (data) => {
  console.log('Alarme:', data);
});
```

## MQTT

O backend se conecta ao broker MQTT e:

### Subscreve aos tópicos:
- `draga/+/sensors` - Dados de sensores
- `draga/+/alarms` - Alarmes
- `draga/+/status` - Status do PLC
- `draga/+/heartbeat` - Heartbeat

### Publica nos tópicos:
- `draga/{deviceId}/control` - Comandos de controle

## Segurança

### Autenticação
Todas as rotas (exceto `/auth/login` e `/auth/register`) requerem token JWT no header:

```
Authorization: Bearer <token>
```

### Rate Limiting
- 100 requisições por 15 minutos por IP
- Configurável via variáveis de ambiente

### Helmet
Proteção contra vulnerabilidades comuns (XSS, clickjacking, etc.)

### CORS
Configurado para aceitar apenas origens permitidas

## Logs

Os logs são exibidos no console. Para produção, configure um sistema de logs:

```bash
npm start > /var/log/draga-backend.log 2>&1
```

## Testes

```bash
npm test
```

## Deploy

### Docker

```bash
docker build -t draga-backend .
docker run -p 3001:3001 --env-file .env draga-backend
```

### PM2

```bash
npm install -g pm2
pm2 start dist/server.js --name draga-backend
pm2 save
pm2 startup
```

## Troubleshooting

### Erro: "Cannot connect to database"
- Verifique se PostgreSQL está rodando
- Verifique credenciais no .env
- Execute as migrações

### Erro: "MQTT connection failed"
- Verifique se broker MQTT está rodando
- Verifique URL e credenciais no .env

### Erro: "Port already in use"
- Mude a porta no .env
- Ou mate o processo: `lsof -ti:3001 | xargs kill`

## Monitoramento

### Métricas importantes
- Taxa de requisições
- Tempo de resposta
- Conexões WebSocket ativas
- Status da conexão MQTT
- Uso de memória/CPU

### Ferramentas recomendadas
- Prometheus + Grafana
- New Relic
- DataDog

## Suporte

Para problemas técnicos, consulte a documentação principal do projeto.
