import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { user, isAuthenticated, initializing } = useAuth();
  const location = useLocation();
  if (initializing) return null;
  return (user || isAuthenticated)
    ? <Outlet />
    : <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
}

export function AdminRoute() {
  const { user, isAdmin, isAuthenticated, initializing } = useAuth();
  const location = useLocation();
  if (initializing) return null;

  if (!user && !isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}
