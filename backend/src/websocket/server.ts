import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import mqttBroker from '../mqtt/broker';

class WebSocketServer {
  private io: SocketIOServer | null = null;

  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`✓ Cliente WebSocket conectado: ${socket.id}`);

      socket.on('subscribe', (deviceId: string) => {
        socket.join(`device:${deviceId}`);
        console.log(`Cliente ${socket.id} subscrito ao device: ${deviceId}`);
      });

      socket.on('unsubscribe', (deviceId: string) => {
        socket.leave(`device:${deviceId}`);
        console.log(`Cliente ${socket.id} removido do device: ${deviceId}`);
      });

      socket.on('disconnect', () => {
        console.log(`✗ Cliente WebSocket desconectado: ${socket.id}`);
      });
    });

    // Encaminha eventos MQTT para WebSocket
    mqttBroker.on('sensor_data', (data) => {
      this.broadcast('sensor_data', data);
    });

    mqttBroker.on('alarm', (data) => {
      this.broadcast('alarm', data);
    });

    mqttBroker.on('status', (data) => {
      this.broadcast('status', data);
    });

    mqttBroker.on('heartbeat', (data) => {
      this.broadcast('heartbeat', data);
    });

    console.log('✓ WebSocket Server inicializado');
  }

  private broadcast(event: string, data: any): void {
    if (!this.io) return;

    const deviceId = data.device_id;
    
    if (deviceId) {
      // Envia para clientes subscritos ao dispositivo específico
      this.io.to(`device:${deviceId}`).emit(event, data);
    }
    
    // Envia para todos os clientes
    this.io.emit(event, data);
  }

  emit(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  emitToDevice(deviceId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(`device:${deviceId}`).emit(event, data);
    }
  }
}

export default new WebSocketServer();
