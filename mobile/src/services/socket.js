import io from 'socket.io-client';
import { useHealthStore } from '../store/healthStore';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initializeSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('sensor-data-update', (data) => {
      console.log('Sensor data update:', data);
      // Update store
    });

    socket.on('stress-alert', (alert) => {
      console.log('Stress alert received:', alert);
      // Handle alert
    });

    socket.on('anomaly-detected', (anomaly) => {
      console.log('Anomaly detected:', anomaly);
      // Handle anomaly
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  return socket;
};

export const subscribeToDevice = (deviceId) => {
  if (socket) {
    socket.emit('subscribe-device', deviceId);
  }
};

export const unsubscribeFromDevice = (deviceId) => {
  if (socket) {
    socket.emit('unsubscribe-device', deviceId);
  }
};

export const getSocket = () => socket;
