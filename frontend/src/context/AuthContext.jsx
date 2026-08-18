import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('karviyam_token') || null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('karviyam_token');
      const storedUser = localStorage.getItem('karviyam_user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
        } catch (e) {
          console.error('Failed to parse cached user data:', e);
          localStorage.removeItem('karviyam_user');
        }
      }
      setInitializing(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const payload = res.data;

      if (typeof payload === 'string' && (payload.toLowerCase().includes('<!doctype') || payload.toLowerCase().includes('<html'))) {
        toast.error('API endpoint returned HTML instead of JSON. Backend server may be offline or misconfigured.');
        return { success: false };
      }

      if (payload && payload.success) {
        const { token, ...userData } = payload.data;
        setToken(token);
        setUser(userData);
        localStorage.setItem('karviyam_token', token);
        localStorage.setItem('karviyam_user', JSON.stringify(userData));

        const userIsAdmin = userData?.roles?.includes('ROLE_ADMIN') || userData?.role === 'admin' || userData?.email?.endsWith('@karviyam.com');

        toast.success(`Welcome back, ${userData.fullName || 'User'}!`);
        return { success: true, isAdmin: userIsAdmin, user: userData };
      } else {
        toast.error(payload?.message || 'Invalid email or password');
        return { success: false };
      }
    } catch (err) {
      let msg = 'Invalid email or password';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Connection timed out. Please verify backend server status.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }
      toast.error(msg);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', formData);
      const payload = res.data;
      if (payload && payload.success) {
        toast.success(payload.message || 'Registration successful! Please sign in.');
        return { success: true };
      } else {
        toast.error(payload?.message || 'Registration failed');
        return { success: false };
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      toast.error(msg);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (googleData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/google', googleData);
      const payload = res.data;
      if (payload && payload.success) {
        const { token, ...userData } = payload.data;
        setToken(token);
        setUser(userData);
        localStorage.setItem('karviyam_token', token);
        localStorage.setItem('karviyam_user', JSON.stringify(userData));

        const userIsAdmin = userData?.roles?.includes('ROLE_ADMIN') || userData?.role === 'admin' || userData?.email?.endsWith('@karviyam.com');

        toast.success(`Google Sign-In successful! Welcome, ${userData.fullName || 'User'}`);
        return { success: true, isAdmin: userIsAdmin, user: userData };
      } else {
        toast.error(payload?.message || 'Google Sign-In failed');
        return { success: false };
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Google authentication failed';
      toast.error(msg);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('karviyam_token');
    localStorage.removeItem('karviyam_user');
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    token,
    loading,
    initializing,
    isAuthenticated: !!token,
    isAdmin: user?.roles?.includes('ROLE_ADMIN') || user?.role === 'admin' || user?.email?.endsWith('@karviyam.com'),
    login,
    register,
    googleLogin,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
