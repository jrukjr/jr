import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';

import routes from './routes';
import mqttBroker from './mqtt/broker';
import websocketServer from './websocket/server';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
});

app.use('/api', limiter);

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    name: 'Draga Automation API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

mqttBroker.connect();

websocketServer.initialize(httpServer);

httpServer.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('DRAGA AUTOMATION BACKEND');
  console.log('='.repeat(60));
  console.log(`✓ Servidor HTTP rodando na porta ${PORT}`);
  console.log(`✓ API disponível em: http://localhost:${PORT}/api`);
  console.log(`✓ WebSocket disponível em: ws://localhost:${PORT}`);
  console.log('='.repeat(60));
});

process.on('SIGTERM', () => {
  console.log('\nRecebido SIGTERM, encerrando servidor...');
  mqttBroker.disconnect();
  httpServer.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nRecebido SIGINT, encerrando servidor...');
  mqttBroker.disconnect();
  httpServer.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});

export default app;
