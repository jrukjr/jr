import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  
  register: (username: string, email: string, password: string) =>
    api.post('/auth/register', { username, email, password }),
};

export const devicesAPI = {
  getAll: () => api.get('/devices'),
  getById: (deviceId: string) => api.get(`/devices/${deviceId}`),
  create: (data: any) => api.post('/devices', data),
};

export const sensorsAPI = {
  getLatest: (deviceId: string) => api.get(`/sensors/${deviceId}/latest`),
  getHistory: (deviceId: string, params?: any) =>
    api.get(`/sensors/${deviceId}/history`, { params }),
  getStats: (deviceId: string, hours: number = 24) =>
    api.get(`/sensors/${deviceId}/stats`, { params: { hours } }),
};

export const alarmsAPI = {
  getAll: (deviceId: string, resolved: boolean = false) =>
    api.get(`/alarms/${deviceId}`, { params: { resolved } }),
  acknowledge: (alarmId: number) =>
    api.post(`/alarms/${alarmId}/acknowledge`),
  resolve: (alarmId: number) =>
    api.post(`/alarms/${alarmId}/resolve`),
};

export const commandsAPI = {
  send: (deviceId: string, command: string, params?: any) =>
    api.post(`/commands/${deviceId}`, { command, params }),
  getHistory: (deviceId: string, limit: number = 50) =>
    api.get(`/commands/${deviceId}/history`, { params: { limit } }),
};

export default api;
