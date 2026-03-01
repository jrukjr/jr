# Sistema de Automação de Draga

Sistema completo de automação e monitoramento para draga de sucção de lama, com controle em tempo real, histórico de dados e sistema de alarmes.

## 🚀 Características

### Monitoramento em Tempo Real
- **Sucção**: -1.0 bar (sinal 4-20mA)
- **Pressão**: 0-15 bar
- **RPM da Bomba**: 0-3000 RPM
- **Nível de Óleo Hidráulico**: 0-100%
- **Temperatura do Motor**: 0-150°C
- **Pressão do Óleo**: 0-10 bar

### Funcionalidades
- ✅ Leitura de sensores em tempo real
- ✅ Lógica CLP (Controlador Lógico Programável)
- ✅ Controle remoto de bomba (Liga/Desliga)
- ✅ Sistema de alarmes e segurança
- ✅ Histórico de dados com gráficos
- ✅ Comunicação via Starlink (MQTT)
- ✅ Interface Web responsiva
- ✅ App Mobile (iOS/Android)
- ✅ Exportação de relatórios

## 📁 Estrutura do Projeto

```
draga-automation-system/
├── embedded/          # Sistema embarcado (Python)
│   ├── src/
│   │   ├── sensors/   # Leitura de sensores
│   │   ├── plc/       # Lógica CLP
│   │   ├── mqtt/      # Cliente MQTT
│   │   └── main.py    # Aplicação principal
│   └── requirements.txt
│
├── backend/           # API em nuvem (Node.js + TypeScript)
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── mqtt/
│   │   └── websocket/
│   └── package.json
│
├── frontend/          # Interface Web (React + Tailwind)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
│
├── mobile/            # App Mobile (React Native + Expo)
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   └── App.tsx
│   └── package.json
│
└── docker-compose.yml # Orquestração de containers
```

## 🛠️ Tecnologias

### Sistema Embarcado
- Python 3.9+
- Paho MQTT
- Modbus/Serial communication
- GPIO para controle

### Backend
- Node.js 22+
- TypeScript
- Express.js
- PostgreSQL
- MQTT Broker (Mosquitto)
- WebSocket (Socket.io)
- JWT Authentication

### Frontend
- React 18+
- TypeScript
- Tailwind CSS
- Recharts (gráficos)
- Socket.io Client
- Axios

### Mobile
- React Native
- Expo
- TypeScript
- React Navigation

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 22+
- Python 3.9+
- Docker & Docker Compose
- PostgreSQL 14+

### 1. Instalação

```bash
# Instalar dependências
npm run install:all
```

### 2. Configuração

Crie arquivos `.env` em cada módulo:

**backend/.env**
```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/draga
MQTT_BROKER_URL=mqtt://localhost:1883
JWT_SECRET=your-secret-key
```

**frontend/.env**
```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:3000
```

**embedded/.env**
```env
MQTT_BROKER=your-starlink-ip
MQTT_PORT=1883
DEVICE_ID=draga-001
```

### 3. Executar com Docker

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### 4. Executar em Desenvolvimento

```bash
# Backend
npm run dev:backend

# Frontend
npm run dev:frontend

# Mobile
npm run dev:mobile

# Sistema Embarcado
cd embedded && python src/main.py
```

## 📊 Acesso ao Sistema

- **Frontend Web**: http://localhost:3000
- **API Backend**: http://localhost:3001
- **MQTT Broker**: mqtt://localhost:1883
- **PostgreSQL**: localhost:5432

### Credenciais Padrão
- **Usuário**: admin
- **Senha**: admin123

## 🔔 Sistema de Alarmes

### Alarmes Críticos
- ⚠️ Pressão alta (>12 bar)
- ⚠️ Temperatura alta (>90°C)
- ⚠️ Nível óleo baixo (<20%)
- ⚠️ Pressão óleo baixa (<2 bar)
- ⚠️ Falha por entrada de ar
- ⚠️ Falha de comunicação

### Ações Automáticas
- Desligamento automático da bomba em condições críticas
- Notificações push no app mobile
- Registro de eventos no histórico
- Alertas visuais e sonoros

## 🔒 Segurança

- Autenticação JWT
- Comunicação MQTT com TLS
- Validação de dados de sensores
- Intertravamentos de segurança (CLP)
- Logs de auditoria

## 📱 App Mobile

### Instalação
```bash
cd mobile
npm install
npx expo start
```

### Build para Produção
```bash
# Android
npx expo build:android

# iOS
npx expo build:ios
```

## 🐳 Deploy em Produção

### AWS/Azure/GCP
1. Configure PostgreSQL gerenciado
2. Deploy do backend em container
3. Deploy do frontend em CDN
4. Configure MQTT broker com TLS
5. Configure domínio e SSL

### Variáveis de Ambiente
Atualize as URLs para produção em todos os `.env` files.

## 📈 Monitoramento

- Logs centralizados
- Métricas de performance
- Uptime monitoring
- Alertas de sistema

## 🤝 Suporte

Para suporte técnico, entre em contato com a equipe de desenvolvimento.

## 📄 Licença

MIT License - veja LICENSE para detalhes.
