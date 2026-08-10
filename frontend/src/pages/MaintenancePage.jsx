import React, { useState, useEffect } from 'react';
import { Wrench, Clock } from 'lucide-react';
import api from '../utils/api';

export default function MaintenancePage() {
  const [customLogo, setCustomLogo] = useState(() => localStorage.getItem('karviyam_logo') || '');
  const [title, setTitle] = useState("We'll Be Right Back!");
  const [subtitle, setSubtitle] = useState("SYSTEM UNDER MAINTENANCE");
  const [message, setMessage] = useState(() => localStorage.getItem('karviyam_maintenance_message') || 'Karviyam is currently undergoing scheduled platform maintenance to bring you exciting new drops! We will be back online shortly.');
  const [estimatedTime, setEstimatedTime] = useState("Estimated Uptime: Back Online Soon");

  useEffect(() => {
    fetchLiveMaintenanceSettings();
    const handleUpdate = () => {
      setCustomLogo(localStorage.getItem('karviyam_logo') || '');
      setMessage(localStorage.getItem('karviyam_maintenance_message') || 'Karviyam is currently undergoing scheduled platform maintenance to bring you exciting new drops! We will be back online shortly.');
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('karviyam_maintenance_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('karviyam_maintenance_updated', handleUpdate);
    };
  }, []);

  const fetchLiveMaintenanceSettings = async () => {
    try {
      const res = await api.get('/settings');
      const apiData = res.data ? res.data : res;
      if (Array.isArray(apiData)) {
        const dataMap = {};
        apiData.forEach((s) => {
          if (s.settingKey) dataMap[s.settingKey] = s.settingValue;
        });

        if (dataMap.logoUrl) setCustomLogo(dataMap.logoUrl);
        if (dataMap.maintenanceTitle) setTitle(dataMap.maintenanceTitle);
        if (dataMap.maintenanceSubtitle) setSubtitle(dataMap.maintenanceSubtitle);
        if (dataMap.maintenanceMessage) setMessage(dataMap.maintenanceMessage);
        if (dataMap.maintenanceEstimatedTime) setEstimatedTime(dataMap.maintenanceEstimatedTime);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4 py-12">
      <div className="w-full max-w-lg bg-white p-8 md:p-12 rounded-3xl border border-[#E5E7EB] shadow-2xl text-center space-y-6">
        
        {/* Logo */}
        <div className="flex justify-center">
          {customLogo ? (
            <img src={customLogo} alt="Karviyam Logo" className="h-14 w-auto object-contain max-w-[220px]" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#D32F2F] to-[#B71C1C] text-white font-black text-3xl flex items-center justify-center shadow-md">
              <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6zm-4 9.5c0-2 4-3.1 4-3.1s4 1.1 4 3.1V16H8v-0.5z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Maintenance Animated Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 text-[#B71C1C] border border-red-100 shadow-inner mx-auto">
          <Wrench className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-widest rounded-full">
            {subtitle}
          </span>
          <h1 className="font-display font-black text-3xl text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto pt-2 font-medium">
            {message}
          </p>
        </div>

        {/* Info Box */}
        <div className="flex justify-center text-xs">
          <div className="bg-slate-50 p-3.5 px-6 rounded-2xl border border-slate-200 text-slate-700 font-bold flex items-center justify-center gap-2 text-center shadow-2xs">
            <Clock className="w-4 h-4 text-[#B71C1C] shrink-0" />
            <span className="leading-tight">{estimatedTime}</span>
          </div>
        </div>

        {/* Informative Status Section (Replaces Login Button) */}
        <div className="pt-2 flex justify-center">
          <div className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-red-50/80 border border-red-100/80 text-xs font-semibold text-slate-700 shadow-2xs">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B71C1C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B71C1C]"></span>
            </span>
            <span>Store will be back online shortly. Please check again soon.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
