import create from 'zustand';
import api from '../services/api';

const useHealthStore = create((set, get) => ({
  sensorData: null,
  healthHistory: [],
  stressAnalysis: null,
  alerts: [],
  isLoading: false,
  error: null,

  fetchLatestData: async (deviceId) => {
    try {
      set({ isLoading: true });
      const response = await api.get('/health/latest', { params: { deviceId } });
      set({ sensorData: response.data.data, error: null });
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch data';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchHealthHistory: async (deviceId, limit = 100) => {
    try {
      set({ isLoading: true });
      const response = await api.get('/health/history', {
        params: { deviceId, limit }
      });
      set({ healthHistory: response.data.data, error: null });
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch history';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStressAnalysis: async (deviceId) => {
    try {
      set({ isLoading: true });
      const response = await api.get('/analysis/stress-level', { params: { deviceId } });
      set({ stressAnalysis: response.data.data, error: null });
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch analysis';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAlerts: async (limit = 50) => {
    try {
      const response = await api.get('/alerts', { params: { limit } });
      set({ alerts: response.data.alerts, error: null });
      return response.data.alerts;
    } catch (error) {
      console.error('Fetch alerts error:', error);
      set({ error: 'Failed to fetch alerts' });
    }
  },

  markAlertAsRead: async (alertId) => {
    try {
      await api.put(`/alerts/${alertId}/read`);
      const alerts = get().alerts.map(a =>
        a.id === alertId ? { ...a, read: true } : a
      );
      set({ alerts });
    } catch (error) {
      console.error('Mark alert error:', error);
    }
  },

  clearError: () => set({ error: null })
}));

export default useHealthStore;
