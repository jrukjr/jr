import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3001';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✓ WebSocket conectado');
    });

    this.socket.on('disconnect', () => {
      console.log('✗ WebSocket desconectado');
    });

    this.socket.on('sensor_data', (data) => {
      this.emit('sensor_data', data);
    });

    this.socket.on('alarm', (data) => {
      this.emit('alarm', data);
    });

    this.socket.on('status', (data) => {
      this.emit('status', data);
    });

    this.socket.on('heartbeat', (data) => {
      this.emit('heartbeat', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribe(deviceId: string): void {
    if (this.socket) {
      this.socket.emit('subscribe', deviceId);
    }
  }

  unsubscribe(deviceId: string): void {
    if (this.socket) {
      this.socket.emit('unsubscribe', deviceId);
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((callback) => {
      callback(data);
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new WebSocketService();
