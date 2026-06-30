import create from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  isLoggedIn: false,
  isLoading: true,
  user: null,
  token: null,
  error: null,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const userDataStr = await AsyncStorage.getItem('userData');

      if (token && userDataStr) {
        const userData = JSON.parse(userDataStr);
        set({
          isLoggedIn: true,
          user: userData,
          token
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true });
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      await SecureStore.setItemAsync('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      set({
        isLoggedIn: true,
        user,
        token,
        error: null
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password, name) => {
    try {
      set({ isLoading: true });
      const response = await api.post('/auth/register', { email, password, name });
      const { token, user } = response.data;

      await SecureStore.setItemAsync('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      set({
        isLoggedIn: true,
        user,
        token,
        error: null
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await AsyncStorage.removeItem('userData');
      set({
        isLoggedIn: false,
        user: null,
        token: null
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  clearError: () => set({ error: null })
}));

export default useAuthStore;
