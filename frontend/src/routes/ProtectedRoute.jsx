import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { user, initializing } = useAuth();
  if (initializing) return null;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function AdminRoute() {
  const { isAdmin, initializing } = useAuth();
  if (initializing) return null;
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}
