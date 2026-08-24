import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import api from '../utils/api';

export default function MaintenancePage() {
  const [maintenanceLogo, setMaintenanceLogo] = useState(() => localStorage.getItem('karviyam_maintenance_logo') || '');
  const [title, setTitle] = useState("We'll Be Right Back!");
  const [subtitle, setSubtitle] = useState("SYSTEM UNDER MAINTENANCE");
  const [message, setMessage] = useState(() => localStorage.getItem('karviyam_maintenance_message') || 'Karviyam is currently undergoing scheduled platform maintenance to bring you exciting new drops! We will be back online shortly.');
  const [estimatedTime, setEstimatedTime] = useState("Estimated Uptime: Back Online Soon");

  useEffect(() => {
    fetchLiveMaintenanceSettings();
    const handleUpdate = () => {
      setMaintenanceLogo(localStorage.getItem('karviyam_maintenance_logo') || '');
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
      const dataObj = res.data?.data || res.data || res;
      
      if (dataObj && typeof dataObj === 'object') {
        const dataMap = Array.isArray(dataObj)
          ? dataObj.reduce((acc, s) => { if (s.settingKey) acc[s.settingKey] = s.settingValue; return acc; }, {})
          : dataObj;

        const logo = dataMap.maintenanceLogoUrl || dataMap.maintenance_logo_url;
        const t = dataMap.maintenanceTitle || dataMap.maintenance_title;
        const sub = dataMap.maintenanceSubtitle || dataMap.maintenance_subtitle;
        const msg = dataMap.maintenanceMessage || dataMap.maintenance_message;
        const est = dataMap.maintenanceEstimatedTime || dataMap.maintenance_estimated_time;

        if (logo) {
          setMaintenanceLogo(logo);
          localStorage.setItem('karviyam_maintenance_logo', logo);
        }
        if (t) setTitle(t);
        if (sub) setSubtitle(sub);
        if (msg) setMessage(msg);
        if (est) setEstimatedTime(est);
      }
    } catch (e) {
      console.error('[MaintenancePage] Settings fetch error:', e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-8 sm:py-12 select-none">
      <div className="w-full max-w-[460px] bg-white p-7 sm:p-11 rounded-[36px] border border-gray-100/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] text-center space-y-6 mx-auto">
        
        {/* Logo Container Box (No stroke/border as requested) */}
        <div className="flex justify-center pt-1">
          <div className="flex items-center justify-center min-h-[140px] bg-white w-full max-w-[320px] p-2">
            {maintenanceLogo ? (
              <img src={maintenanceLogo} alt="Maintenance Logo" className="max-h-28 w-auto object-contain max-w-full" />
            ) : (
              <img src="/brand-mark-gold.png" alt="Karviyam Logo" className="max-h-28 w-auto object-contain max-w-full" onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/brand_logo.png';
              }} />
            )}
          </div>
        </div>

        {/* System Under Maintenance Badge */}
        <div>
          <span className="inline-block px-5 py-1.5 bg-[#FEF3D6] text-[#9A5B00] text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-full">
            {subtitle}
          </span>
        </div>

        {/* Heading & Description */}
        <div className="space-y-2 pt-1">
          <h1 className="text-3xl sm:text-[32px] font-black text-[#0F172A] tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-[13px] text-gray-500 leading-relaxed max-w-sm mx-auto font-medium pt-1">
            {message}
          </p>
        </div>

        {/* Estimated Uptime Box */}
        <div className="pt-1">
          <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-full py-3 px-6 flex items-center justify-center gap-2.5 text-xs font-bold text-[#334155] shadow-2xs">
            <Clock className="w-4 h-4 text-[#B91C1C] shrink-0" />
            <span>{estimatedTime}</span>
          </div>
        </div>

        {/* Bottom Red Status Pill */}
        <div className="pt-1">
          <div className="w-full bg-[#FFF1F2] border border-[#FFE4E6] rounded-full py-2.5 px-3 sm:px-4 flex items-center justify-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11.5px] font-semibold text-[#991B1B] whitespace-nowrap shadow-2xs">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E11D48] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E11D48]"></span>
            </span>
            <span className="whitespace-nowrap">Store will be back online shortly. Please check again soon.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
