# App Mobile - Sistema de Draga

App mobile em React Native + Expo para monitoramento e controle da draga.

## Funcionalidades

- ✅ Login e autenticação
- ✅ Dashboard com dados em tempo real
- ✅ Visualização de sensores
- ✅ Controle remoto da bomba
- ✅ Notificações de alarmes
- ✅ Histórico de dados
- ✅ Suporte iOS e Android

## Instalação

```bash
cd mobile
npm install
```

## Configuração

Edite o arquivo `src/config.ts` com a URL da sua API:

```typescript
export const API_URL = 'http://seu-servidor:3001/api';
export const WS_URL = 'http://seu-servidor:3001';
```

## Execução

### Desenvolvimento

```bash
# Iniciar Expo
npm start

# Rodar no Android
npm run android

# Rodar no iOS
npm run ios

# Rodar no navegador
npm run web
```

### Testar no Dispositivo

1. Instale o app Expo Go no seu celular
2. Execute `npm start`
3. Escaneie o QR code com a câmera (iOS) ou Expo Go (Android)

## Build para Produção

### Android (APK)

```bash
expo build:android
```

### iOS (IPA)

```bash
expo build:ios
```

## Estrutura

```
mobile/
├── src/
│   ├── screens/      # Telas do app
│   ├── components/   # Componentes reutilizáveis
│   ├── services/     # API e WebSocket
│   ├── navigation/   # Navegação
│   └── config.ts     # Configurações
├── App.tsx           # Componente principal
└── package.json
```

## Notificações Push

Para habilitar notificações push:

1. Configure Firebase Cloud Messaging (Android)
2. Configure Apple Push Notification Service (iOS)
3. Atualize o backend para enviar notificações

## Recursos

- Material Design (React Native Paper)
- Navegação com React Navigation
- Gráficos em tempo real
- Conexão WebSocket persistente
- Cache de dados offline

## Troubleshooting

### Erro: "Unable to connect to server"
- Verifique se a API está rodando
- Verifique a URL em `src/config.ts`
- Certifique-se de estar na mesma rede (desenvolvimento)

### Erro: "Expo Go not installed"
- Instale o Expo Go na App Store ou Google Play

## Suporte

Para problemas técnicos, consulte a documentação do Expo: https://docs.expo.dev
