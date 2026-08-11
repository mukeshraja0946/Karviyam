import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('karviyam_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to parse saved user:', e);
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('karviyam_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      fetchCurrentUser();
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      const payload = res.data;
      if (payload && payload.success) {
        setUser(payload.data);
        localStorage.setItem('karviyam_user', JSON.stringify(payload.data));
      }
    } catch (err) {
      logout();
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const payload = res.data;
      if (payload && payload.success) {
        const { token, ...userData } = payload.data;
        setToken(token);
        setUser(userData);
        localStorage.setItem('karviyam_token', token);
        localStorage.setItem('karviyam_user', JSON.stringify(userData));
        toast.success(`Welcome back, ${userData.fullName || 'User'}!`);
        return true;
      } else {
        toast.error(payload?.message || 'Login failed');
        return false;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      toast.error(msg);
      return false;
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
        toast.success('Registration successful! Please login.');
        return true;
      } else {
        toast.error(payload?.message || 'Registration failed');
        return false;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      return false;
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
        toast.success(`Welcome back, ${userData.fullName || 'User'}!`);
        return true;
      } else {
        toast.error(payload?.message || 'Google Login failed');
        return false;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Google Authentication failed';
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('karviyam_token');
    localStorage.removeItem('karviyam_user');
    toast.success('Logged out successfully');
  };

  const isAdmin = Boolean(user && user.roles && (user.roles.includes('ROLE_ADMIN') || user.roles.includes('ROLE_MANAGER')));

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, googleLogin, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
