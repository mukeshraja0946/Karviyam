import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import MaintenancePage from '../pages/MaintenancePage';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function MainLayout() {
  const { isAdmin } = useAuth();
  const location = useLocation();

  const [maintenanceMode, setMaintenanceMode] = useState(() => {
    return localStorage.getItem('karviyam_maintenance_mode') === 'true';
  });

  useEffect(() => {
    fetchSettings();

    const handleUpdate = () => {
      setMaintenanceMode(localStorage.getItem('karviyam_maintenance_mode') === 'true');
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('karviyam_maintenance_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('karviyam_maintenance_updated', handleUpdate);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/maintenance-status').catch(() => api.get('/settings'));
      const data = res.data?.data || res.data || res;
      if (data && typeof data === 'object') {
        const isMaint =
          data.maintenanceMode === true ||
          data.maintenanceMode === 'true' ||
          data.maintenance_mode === 'true' ||
          data.maintenance_mode === '1';

        setMaintenanceMode(isMaint);
        localStorage.setItem('karviyam_maintenance_mode', isMaint ? 'true' : 'false');
      }
    } catch (e) {
      console.error('Failed to fetch settings for maintenance check:', e);
    }
  };

  // When Maintenance Mode is ON for non-admin visitors:
  if (maintenanceMode && !isAdmin) {
    // If on /login, display ONLY the login box without Navbar or Footer!
    if (location.pathname === '/login') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4 py-12">
          <Outlet />
        </div>
      );
    }
    // Otherwise show the Maintenance Page
    return <MaintenancePage />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAFAFA] text-slate-900 transition-colors duration-300 pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
