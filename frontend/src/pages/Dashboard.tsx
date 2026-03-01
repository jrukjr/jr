import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sensorsAPI, commandsAPI, alarmsAPI, devicesAPI } from '../services/api';
import websocketService from '../services/websocket';
import { SensorData, Alarm, Device } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const { deviceId = 'draga-001' } = useParams();
  const [device, setDevice] = useState<Device | null>(null);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<SensorData[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [pumpRunning, setPumpRunning] = useState(false);

  useEffect(() => {
    loadDevice();
    loadLatestData();
    loadHistory();
    loadAlarms();

    websocketService.subscribe(deviceId);

    const handleSensorData = (data: any) => {
      if (data.device_id === deviceId) {
        setSensorData(data);
      }
    };

    const handleStatus = (data: any) => {
      if (data.device_id === deviceId && data.pump_running !== undefined) {
        setPumpRunning(data.pump_running);
      }
    };

    const handleAlarm = (data: any) => {
      if (data.device_id === deviceId) {
        loadAlarms();
      }
    };

    websocketService.on('sensor_data', handleSensorData);
    websocketService.on('status', handleStatus);
    websocketService.on('alarm', handleAlarm);

    return () => {
      websocketService.off('sensor_data', handleSensorData);
      websocketService.off('status', handleStatus);
      websocketService.off('alarm', handleAlarm);
      websocketService.unsubscribe(deviceId);
    };
  }, [deviceId]);

  const loadDevice = async () => {
    try {
      const response = await devicesAPI.getById(deviceId);
      setDevice(response.data);
    } catch (error) {
      console.error('Erro ao carregar dispositivo:', error);
    }
  };

  const loadLatestData = async () => {
    try {
      const response = await sensorsAPI.getLatest(deviceId);
      setSensorData(response.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await sensorsAPI.getHistory(deviceId, { limit: 50 });
      setHistory(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const loadAlarms = async () => {
    try {
      const response = await alarmsAPI.getAll(deviceId, false);
      setAlarms(response.data.alarms || []);
    } catch (error) {
      console.error('Erro ao carregar alarmes:', error);
    }
  };

  const sendCommand = async (command: string) => {
    try {
      await commandsAPI.send(deviceId, command);
      alert(`Comando ${command} enviado com sucesso!`);
    } catch (error: any) {
      alert(`Erro ao enviar comando: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getSensorValue = (key: string) => {
    if (sensorData?.sensors) {
      return sensorData.sensors[key as keyof typeof sensorData.sensors]?.value;
    }
    return sensorData?.[`${key}_value` as keyof SensorData] || 0;
  };

  const chartData = history.slice(0, 20).reverse().map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    pressure: item.pressure_value || 0,
    temperature: item.temperature_value || 0,
    rpm: item.rpm_value || 0,
  }));

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Sistema de Draga - {device?.device_name || deviceId}</h1>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm ${device?.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}>
              {device?.status === 'online' ? '● Online' : '● Offline'}
            </span>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
              Sair
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <SensorCard title="Sucção" value={getSensorValue('suction')} unit="bar" color="blue" />
          <SensorCard title="Pressão" value={getSensorValue('pressure')} unit="bar" color="green" />
          <SensorCard title="RPM" value={getSensorValue('rpm')} unit="RPM" color="purple" />
          <SensorCard title="Nível Óleo" value={getSensorValue('oil_level')} unit="%" color="yellow" />
          <SensorCard title="Temperatura" value={getSensorValue('temperature')} unit="°C" color="red" />
          <SensorCard title="Pressão Óleo" value={getSensorValue('oil_pressure')} unit="bar" color="indigo" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Controle da Bomba</h2>
            <div className="flex flex-col gap-4">
              <div className={`p-4 rounded-lg text-center text-white font-bold text-lg ${pumpRunning ? 'bg-green-500' : 'bg-gray-400'}`}>
                {pumpRunning ? '● BOMBA LIGADA' : '○ BOMBA DESLIGADA'}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => sendCommand('start')} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg">
                  Ligar
                </button>
                <button onClick={() => sendCommand('stop')} className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg">
                  Desligar
                </button>
                <button onClick={() => sendCommand('emergency_stop')} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg col-span-2">
                  PARADA DE EMERGÊNCIA
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Alarmes Ativos ({alarms.length})</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alarms.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum alarme ativo</p>
              ) : (
                alarms.map((alarm) => (
                  <div key={alarm.id} className={`p-3 rounded-lg border-l-4 ${
                    alarm.severity === 'critical' ? 'bg-red-50 border-red-500' :
                    alarm.severity === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-blue-50 border-blue-500'
                  }`}>
                    <div className="font-semibold">{alarm.message}</div>
                    <div className="text-sm text-gray-600">{new Date(alarm.timestamp).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Histórico de Sensores</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="pressure" stroke="#10b981" name="Pressão (bar)" />
              <Line type="monotone" dataKey="temperature" stroke="#ef4444" name="Temperatura (°C)" />
              <Line type="monotone" dataKey="rpm" stroke="#8b5cf6" name="RPM" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const SensorCard: React.FC<{ title: string; value: any; unit: string; color: string }> = ({ title, value, unit, color }) => {
  const colorClasses: any = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} text-white rounded-lg shadow-lg p-6`}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="text-3xl font-bold">
        {value !== null && value !== undefined ? Number(value).toFixed(2) : '--'}
        <span className="text-xl ml-2">{unit}</span>
      </div>
    </div>
  );
};

export default Dashboard;
