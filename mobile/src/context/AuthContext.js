import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('karviyam_mobile_token');
      const storedUser = await AsyncStorage.getItem('karviyam_mobile_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('[AuthContext] Load error', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data) {
      const { token: jwtToken, ...userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      await AsyncStorage.setItem('karviyam_mobile_token', jwtToken);
      await AsyncStorage.setItem('karviyam_mobile_user', JSON.stringify(userData));
      return res;
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { fullName: name, email, password });
    if (res.success && res.data) {
      const { token: jwtToken, ...userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      await AsyncStorage.setItem('karviyam_mobile_token', jwtToken);
      await AsyncStorage.setItem('karviyam_mobile_user', JSON.stringify(userData));
      return res;
    } else {
      throw new Error(res.message || 'Registration failed');
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('karviyam_mobile_token');
    await AsyncStorage.removeItem('karviyam_mobile_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
