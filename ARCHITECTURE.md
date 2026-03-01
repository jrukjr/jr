# 🏗️ Arquitetura do Sistema

## Visão Geral

O Sistema de Automação de Draga é composto por 4 módulos principais que se comunicam em tempo real:

```
┌─────────────────────────────────────────────────────────────────┐
│                         SISTEMA COMPLETO                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  DRAGA (Físico)  │         │   NUVEM (Cloud)  │
│                  │         │                  │
│  ┌────────────┐  │         │  ┌────────────┐  │
│  │  Sensores  │  │         │  │ PostgreSQL │  │
│  │  4-20mA    │  │         │  └────────────┘  │
│  └────────────┘  │         │                  │
│        │         │         │  ┌────────────┐  │
│        ▼         │         │  │   Backend  │  │
│  ┌────────────┐  │  MQTT   │  │  Node.js   │  │
│  │ Raspberry  │◄─┼────────►│  │  + MQTT    │  │
│  │    Pi      │  │Starlink │  │  + WS      │  │
│  │  (Python)  │  │         │  └────────────┘  │
│  └────────────┘  │         │        │         │
│        │         │         │        ▼         │
│        ▼         │         │  ┌────────────┐  │
│  ┌────────────┐  │         │  │  Frontend  │  │
│  │   Bomba    │  │         │  │   React    │  │
│  │   Relé     │  │         │  └────────────┘  │
│  └────────────┘  │         │                  │
└──────────────────┘         └──────────────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │   App Mobile     │
                             │  React Native    │
                             └──────────────────┘
```

## Componentes

### 1. Sistema Embarcado (Draga)

**Tecnologia**: Python 3.9+  
**Hardware**: Raspberry Pi ou similar  
**Localização**: Na draga (ambiente físico)

**Responsabilidades**:
- Leitura de sensores analógicos (4-20mA)
- Conversão de sinais para valores físicos
- Lógica CLP (intertravamentos de segurança)
- Controle de bomba via relé
- Detecção de alarmes
- Comunicação MQTT com nuvem

**Sensores Monitorados**:
- Sucção: -1.0 a 0 bar
- Pressão: 0 a 15 bar
- RPM da bomba: 0 a 3000 RPM
- Nível de óleo hidráulico: 0 a 100%
- Temperatura do motor: 0 a 150°C
- Pressão de óleo: 0 a 10 bar

**Comunicação**:
- Protocolo: MQTT over TCP
- Transporte: Starlink
- QoS: 1 (dados), 2 (alarmes)
- Tópicos:
  - `draga/{device_id}/sensors` - Dados de sensores
  - `draga/{device_id}/alarms` - Alarmes
  - `draga/{device_id}/status` - Status do PLC
  - `draga/{device_id}/heartbeat` - Sinal de vida

### 2. Backend (Nuvem)

**Tecnologia**: Node.js 22 + TypeScript + Express  
**Banco de Dados**: PostgreSQL 14  
**Localização**: Servidor em nuvem (AWS/Azure/GCP)

**Responsabilidades**:
- API REST para frontend e mobile
- Broker MQTT (recebe dados da draga)
- Armazenamento de dados históricos
- Gerenciamento de alarmes
- Autenticação JWT
- WebSocket para push em tempo real
- Processamento de comandos

**Endpoints Principais**:
- `POST /api/auth/login` - Autenticação
- `GET /api/devices` - Lista dispositivos
- `GET /api/sensors/:deviceId/latest` - Última leitura
- `GET /api/sensors/:deviceId/history` - Histórico
- `GET /api/alarms/:deviceId` - Alarmes
- `POST /api/commands/:deviceId` - Enviar comando

**Banco de Dados**:
- `users` - Usuários do sistema
- `devices` - Dispositivos (dragas)
- `sensor_data` - Dados dos sensores
- `alarms` - Alarmes
- `plc_status` - Status do PLC
- `commands` - Histórico de comandos

### 3. Frontend Web

**Tecnologia**: React 18 + TypeScript + Tailwind CSS  
**Gráficos**: Recharts  
**Localização**: Navegador web

**Responsabilidades**:
- Dashboard em tempo real
- Visualização de sensores
- Gráficos de histórico
- Controle remoto da bomba
- Gerenciamento de alarmes
- Interface responsiva

**Páginas**:
- `/login` - Autenticação
- `/` - Dashboard principal
- `/device/:deviceId` - Detalhes do dispositivo

**Comunicação**:
- HTTP REST para API
- WebSocket para dados em tempo real

### 4. App Mobile

**Tecnologia**: React Native + Expo  
**Plataformas**: iOS e Android  
**Localização**: Smartphone/Tablet

**Responsabilidades**:
- Monitoramento remoto
- Controle da bomba
- Notificações push de alarmes
- Visualização de histórico
- Interface otimizada para mobile

## Fluxo de Dados

### 1. Leitura de Sensores → Nuvem

```
Sensores → ADC → Raspberry Pi → MQTT → Backend → PostgreSQL
                                    ↓
                              WebSocket → Frontend/Mobile
```

1. Sensores enviam sinal 4-20mA
2. ADC (ADS1115) converte para digital
3. Raspberry Pi processa e converte para valores físicos
4. Publica via MQTT para nuvem
5. Backend recebe e armazena no PostgreSQL
6. Backend envia via WebSocket para clientes conectados

### 2. Comando de Controle → Draga

```
Frontend/Mobile → API REST → Backend → MQTT → Raspberry Pi → Relé → Bomba
```

1. Usuário clica em "Ligar bomba"
2. Frontend envia POST para API
3. Backend valida e publica comando via MQTT
4. Raspberry Pi recebe comando
5. CLP valida intertravamentos
6. Se OK, aciona relé da bomba

### 3. Alarme Crítico

```
Sensor → Raspberry Pi → CLP → MQTT → Backend → WebSocket → Frontend
                         ↓                        ↓
                    Auto-shutdown            Notificação Push
```

1. Sensor detecta condição crítica (ex: temperatura alta)
2. CLP avalia intertravamento
3. Executa shutdown automático da bomba
4. Publica alarme via MQTT
5. Backend armazena e notifica clientes
6. Frontend/Mobile exibe alerta

## Segurança

### Camadas de Segurança

1. **Autenticação**
   - JWT tokens
   - Senhas hash com bcrypt
   - Expiração de sessão

2. **Comunicação**
   - MQTT com TLS (produção)
   - HTTPS para API
   - WSS para WebSocket

3. **Autorização**
   - Roles (admin, operator, viewer)
   - Permissões por endpoint

4. **Intertravamentos (CLP)**
   - Validação de condições antes de ligar bomba
   - Shutdown automático em condições críticas
   - Múltiplas camadas de proteção

## Escalabilidade

### Horizontal

- Backend pode rodar em múltiplas instâncias
- Load balancer distribui requisições
- PostgreSQL com replicação
- MQTT broker em cluster

### Vertical

- Otimização de queries SQL
- Índices no banco de dados
- Cache de dados frequentes
- Compressão de dados históricos

## Monitoramento

### Métricas Importantes

1. **Sistema Embarcado**
   - Taxa de leitura de sensores
   - Latência MQTT
   - Uptime
   - Falhas de comunicação

2. **Backend**
   - Requisições por segundo
   - Tempo de resposta
   - Conexões WebSocket ativas
   - Uso de CPU/Memória

3. **Banco de Dados**
   - Tamanho do banco
   - Queries lentas
   - Conexões ativas

## Tolerância a Falhas

### Reconexão Automática

- MQTT com reconnect automático
- WebSocket com reconnect
- Retry de requisições HTTP

### Dados Offline

- Sistema embarcado armazena dados localmente se MQTT falhar
- Sincroniza quando conexão retorna

### Redundância

- Múltiplas instâncias do backend
- Backup automático do banco
- Logs persistentes

## Performance

### Otimizações

1. **Backend**
   - Conexão pool do PostgreSQL
   - Índices em tabelas críticas
   - Paginação de resultados

2. **Frontend**
   - Code splitting
   - Lazy loading
   - Memoização de componentes

3. **MQTT**
   - QoS apropriado por tipo de mensagem
   - Compressão de payload
   - Batch de mensagens

## Manutenção

### Logs

- Sistema embarcado: stdout + arquivo
- Backend: Winston (console + arquivo)
- Nginx: access.log + error.log

### Backup

- PostgreSQL: dump diário
- Configurações: versionadas no Git
- Logs: rotação automática

### Atualizações

- Zero-downtime deployment
- Rollback automático em caso de falha
- Testes antes de deploy

## Tecnologias Utilizadas

| Componente | Tecnologia | Versão |
|------------|-----------|--------|
| Sistema Embarcado | Python | 3.9+ |
| Backend | Node.js | 22+ |
| Frontend | React | 18+ |
| Mobile | React Native | 0.73+ |
| Banco de Dados | PostgreSQL | 14+ |
| MQTT Broker | Mosquitto | 2+ |
| Containerização | Docker | 24+ |
| Orquestração | Docker Compose | 2.x |
| Proxy | Nginx | 1.24+ |

## Próximas Melhorias

- [ ] Machine Learning para predição de falhas
- [ ] Dashboard de analytics avançado
- [ ] Integração com ERP
- [ ] Relatórios automatizados
- [ ] Controle de múltiplas dragas
- [ ] API pública para integrações
