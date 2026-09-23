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

  const cleanIsAdmin = isAdmin || user?.role === 'admin' || user?.roles?.includes('ROLE_ADMIN') || user?.email === 'vanakkam@karviyam.com';

  if (!user && !isAuthenticated) {
    return <Navigate to={`/admin/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return cleanIsAdmin ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
