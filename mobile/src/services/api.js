import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default to Android emulator loopback (10.0.2.2) or local localhost fallback
export const API_BASE_URL = 'http://10.0.2.2:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('karviyam_mobile_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('[Mobile API Interceptor Error]', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMsg = error.response?.data?.message || error.message || 'Network request failed';
    return Promise.reject(new Error(errorMsg));
  }
);

export default api;
