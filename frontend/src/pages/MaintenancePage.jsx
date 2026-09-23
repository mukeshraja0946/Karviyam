import React, { useState, useEffect } from 'react';
import { Clock, Mail } from 'lucide-react';
import api from '../utils/api';
import { resolveImageUrl } from '../utils/imageUtils';

export default function MaintenancePage({ previewMode = false, previewSettings = null }) {
  const [maintenanceLogo, setMaintenanceLogo] = useState('');
  const [logoFailed, setLogoFailed] = useState(false);
  const [title, setTitle] = useState("We'll Be Right Back!");
  const [subtitle, setSubtitle] = useState("SYSTEM UNDER MAINTENANCE");
  const [message, setMessage] = useState('Karviyam is currently undergoing scheduled platform maintenance to bring you exciting new drops! We will be back online shortly.');
  const [estimatedTime, setEstimatedTime] = useState("Estimated Uptime: Back Online Soon");
  const [supportEmail, setSupportEmail] = useState("vanakkam@karviyam.com");
  const [showTimer, setShowTimer] = useState(true);

  // Maintenance Page Developed By state
  const [developerEnabled, setDeveloperEnabled] = useState(true);
  const [developerLogoUrl, setDeveloperLogoUrl] = useState('');
  const [developerName, setDeveloperName] = useState('CraftLoop');
  const [developerLink, setDeveloperLink] = useState('');
  const [devLogoFailed, setDevLogoFailed] = useState(false);

  useEffect(() => {
    if (previewMode) return;
    fetchLiveMaintenanceSettings();
    const handleUpdate = () => {
      fetchLiveMaintenanceSettings();
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('karviyam_maintenance_updated', handleUpdate);
    window.addEventListener('karviyam_logo_updated', handleUpdate);
    window.addEventListener('karviyam_settings_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    window.addEventListener('visibilitychange', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('karviyam_maintenance_updated', handleUpdate);
      window.removeEventListener('karviyam_logo_updated', handleUpdate);
      window.removeEventListener('karviyam_settings_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      window.removeEventListener('visibilitychange', handleUpdate);
    };
  }, [previewMode]);

  const fetchLiveMaintenanceSettings = async () => {
    try {
      const res = await api.get('/settings');
      const dataObj = res.data?.data || res.data || res;
      
      let dataMap = {};
      if (Array.isArray(dataObj)) {
        dataObj.forEach(s => {
          const k = s.settingKey || s.setting_key || s.key;
          const v = s.settingValue !== undefined ? s.settingValue : (s.setting_value !== undefined ? s.setting_value : s.value);
          if (k) dataMap[k] = v;
        });
      } else {
        dataMap = dataObj;
      }

      const logo = dataMap.maintenanceLogoUrl || dataMap.maintenance_logo_url || dataMap.logoUrl || dataMap.logo_url;
      const t = dataMap.maintenanceTitle || dataMap.maintenance_title;
      const sub = dataMap.maintenanceSubtitle || dataMap.maintenance_subtitle;
      const msg = dataMap.maintenanceMessage || dataMap.maintenance_message;
      const est = dataMap.maintenanceEstimatedTime || dataMap.maintenance_estimated_time;
      const email = dataMap.supportEmail || dataMap.support_email;
      const timer = dataMap.maintenanceShowTimer !== false && dataMap.maintenance_show_timer !== false && dataMap.maintenanceShowTimer !== 'false';

      // Developer settings
      const devEnabledVal = dataMap.maintenanceDeveloperEnabled !== undefined ? dataMap.maintenanceDeveloperEnabled : dataMap.maintenance_developer_enabled;
      const isDevEnabled = devEnabledVal === undefined ? true : (devEnabledVal === true || devEnabledVal === 'true' || devEnabledVal === 1 || devEnabledVal === '1');
      setDeveloperEnabled(isDevEnabled);

      const devLogo = dataMap.maintenanceDeveloperLogoUrl || dataMap.maintenance_developer_logo_url || '';
      setDeveloperLogoUrl(devLogo);
      setDevLogoFailed(false);

      const devName = dataMap.maintenanceDeveloperName || dataMap.maintenance_developer_name || 'CraftLoop';
      setDeveloperName(devName);

      const devLink = dataMap.maintenanceDeveloperLink || dataMap.maintenance_developer_link || '';
      setDeveloperLink(devLink);

      // Safe logging (Requirement 14)
      console.log('[MAINTENANCE SETTINGS]', {
        developer_enabled: isDevEnabled,
        developer_name: devName,
        developer_logo_url: devLogo
      });

      if (logo) {
        setMaintenanceLogo(logo);
        setLogoFailed(false);
      }
      if (t) setTitle(t);
      if (sub) setSubtitle(sub);
      if (msg) setMessage(msg);
      if (est) setEstimatedTime(est);
      if (email) setSupportEmail(email);
      setShowTimer(timer);
    } catch (e) {
      console.error('[MaintenancePage] Settings fetch error:', e);
    }
  };

  const effectiveLogo = previewMode
    ? (previewSettings?.maintenanceLogoUrl || previewSettings?.logoUrl || '')
    : maintenanceLogo;

  const effectiveTitle = previewMode
    ? (previewSettings?.maintenanceTitle !== undefined ? previewSettings.maintenanceTitle : "We'll Be Right Back!")
    : title;

  const effectiveSubtitle = previewMode
    ? (previewSettings?.maintenanceSubtitle !== undefined ? previewSettings.maintenanceSubtitle : "SYSTEM UNDER MAINTENANCE")
    : subtitle;

  const effectiveMessage = previewMode
    ? (previewSettings?.maintenanceMessage !== undefined ? previewSettings.maintenanceMessage : 'Karviyam is currently undergoing scheduled platform maintenance to bring you exciting new drops! We will be back online shortly.')
    : message;

  const effectiveEstimatedTime = previewMode
    ? (previewSettings?.maintenanceEstimatedTime !== undefined ? previewSettings.maintenanceEstimatedTime : "Estimated Uptime: Back Online Soon")
    : estimatedTime;

  const effectiveSupportEmail = previewMode
    ? (previewSettings?.supportEmail || 'vanakkam@karviyam.com')
    : (supportEmail || 'vanakkam@karviyam.com');

  const effectiveShowTimer = previewMode
    ? (previewSettings?.maintenanceShowTimer !== false)
    : showTimer;

  const effectiveDeveloperEnabled = previewMode
    ? (previewSettings?.maintenanceDeveloperEnabled !== undefined 
        ? (previewSettings.maintenanceDeveloperEnabled === true || previewSettings.maintenanceDeveloperEnabled === 'true' || previewSettings.maintenanceDeveloperEnabled === 1 || previewSettings.maintenanceDeveloperEnabled === '1')
        : true)
    : developerEnabled;

  const effectiveDeveloperLogoUrl = previewMode
    ? (previewSettings?.maintenanceDeveloperLogoUrl || previewSettings?.maintenance_developer_logo_url || '')
    : developerLogoUrl;

  const effectiveDeveloperName = previewMode
    ? (previewSettings?.maintenanceDeveloperName || previewSettings?.maintenance_developer_name || 'CraftLoop')
    : (developerName || 'CraftLoop');

  const effectiveDeveloperLink = previewMode
    ? (previewSettings?.maintenanceDeveloperLink || previewSettings?.maintenance_developer_link || '')
    : developerLink;

  // Reset logo failure state when effective logo changes
  useEffect(() => {
    setLogoFailed(false);
  }, [effectiveLogo]);

  useEffect(() => {
    setDevLogoFailed(false);
  }, [effectiveDeveloperLogoUrl]);

  const resolvedLogoUrl = effectiveLogo ? resolveImageUrl(effectiveLogo) : '';
  const resolvedDevLogoUrl = effectiveDeveloperLogoUrl ? resolveImageUrl(effectiveDeveloperLogoUrl) : '';

  return (
    <div className={`w-full flex flex-col items-center justify-center bg-[#F8FAFC] px-3 sm:px-4 select-none relative ${previewMode ? 'min-h-full flex-1 py-2 sm:py-6' : 'min-h-[100dvh] py-6 sm:py-12'}`}>
      <div className="w-full max-w-[460px] bg-white p-4 sm:p-11 rounded-[28px] sm:rounded-[36px] border border-gray-100/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] text-center space-y-3.5 sm:space-y-6 mx-auto relative shrink-0">
        
        {previewMode && (
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest rounded-full shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              PREVIEW MODE
            </span>
          </div>
        )}

        {/* Logo Container Box */}
        <div className="flex justify-center">
          <div className="flex items-center justify-center min-h-[85px] sm:min-h-[100px] bg-white w-full max-w-[360px] p-1 sm:p-2">
            {resolvedLogoUrl && !logoFailed ? (
              <img 
                src={resolvedLogoUrl} 
                alt="Karviyam Logo" 
                className="h-28 sm:h-36 max-h-44 w-auto object-contain max-w-full transition-all" 
                onError={(e) => {
                  console.error('[MaintenancePage] Maintenance logo failed to load:', resolvedLogoUrl, e);
                  setLogoFailed(true);
                }}
              />
            ) : (
              <div className="flex items-center gap-3 bg-red-50/70 px-4 sm:px-6 py-3 sm:py-4 rounded-3xl border border-red-100/80 shadow-2xs">
                <div className="w-9 sm:w-12 h-9 sm:h-12 rounded-2xl bg-[#B71C1C] text-white flex items-center justify-center font-black text-lg sm:text-2xl shadow-md shrink-0">
                  <svg className="w-5 sm:w-7 h-5 sm:h-7 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6zm-4 9.5c0-2 4-3.1 4-3.1s4 1.1 4 3.1V16H8v-0.5z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <span className="font-display font-black text-lg sm:text-2xl tracking-tight text-[#B71C1C] leading-none block">
                    KARVIYAM
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-slate-400 block mt-0.5">
                    Exclusive Fashion
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* System Under Maintenance Badge */}
        {effectiveSubtitle && (
          <div>
            <span className="inline-block px-4 sm:px-5 py-1.5 bg-[#FEF3D6] text-[#9A5B00] text-[10.5px] sm:text-xs font-black uppercase tracking-wider rounded-full">
              {effectiveSubtitle}
            </span>
          </div>
        )}

        {/* Heading & Description */}
        <div className="space-y-2 pt-1">
          {effectiveTitle && (
            <h1 className="text-2xl sm:text-[32px] font-black text-[#0F172A] tracking-tight leading-tight">
              {effectiveTitle}
            </h1>
          )}
          {effectiveMessage && (
            <p className="text-xs sm:text-[13px] text-gray-500 leading-relaxed max-w-sm mx-auto font-medium pt-1">
              {effectiveMessage}
            </p>
          )}
        </div>

        {/* Estimated Uptime Box */}
        {effectiveShowTimer && effectiveEstimatedTime && (
          <div className="pt-1">
            <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-full py-2.5 sm:py-3 px-4 sm:px-6 flex items-center justify-center gap-2.5 text-xs font-bold text-[#334155] shadow-2xs">
              <Clock className="w-4 h-4 text-[#B91C1C] shrink-0" />
              <span>{effectiveEstimatedTime}</span>
            </div>
          </div>
        )}

        {/* Bottom Red Status Pill */}
        <div className="pt-1">
          <div className="w-full bg-[#FFF1F2] border border-[#FFE4E6] rounded-2xl sm:rounded-full py-2.5 px-3 sm:px-4 flex items-center justify-center gap-2 text-[10.5px] sm:text-[11.5px] font-semibold text-[#991B1B] shadow-2xs">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E11D48] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E11D48]"></span>
            </span>
            <span className="text-center leading-snug">Store will be back online shortly. Please check again soon.</span>
          </div>
        </div>


        {/* Support Contact Details */}
        {effectiveSupportEmail && (
          <div className="pt-1 text-slate-500 text-xs font-medium flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>Need help? <a href={`mailto:${effectiveSupportEmail}`} className="text-[#B91C1C] font-bold hover:underline">{effectiveSupportEmail}</a></span>
          </div>
        )}

      </div>

      {/* Developed By Branding (Positioned at bottom-right corner of entire page outside maintenance card) */}
      {effectiveDeveloperEnabled && (
        <div className={`${previewMode ? 'absolute bottom-1.5 right-4 sm:bottom-2.5 sm:right-6' : 'fixed bottom-1.5 right-4 sm:bottom-2.5 sm:right-7'} z-50 pointer-events-auto flex items-center`}>
          {effectiveDeveloperLink ? (
            <a
              href={effectiveDeveloperLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 sm:gap-2.5 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="text-slate-500 font-medium text-xs sm:text-[13px] tracking-tight">Developed by</span>
              {resolvedDevLogoUrl && !devLogoFailed && (
                <img
                  src={resolvedDevLogoUrl}
                  alt={effectiveDeveloperName}
                  className="h-7 sm:h-9 max-h-9 w-auto object-contain shrink-0"
                  onError={() => {
                    console.warn('[MaintenancePage] Developer logo image failed to load:', resolvedDevLogoUrl);
                    setDevLogoFailed(true);
                  }}
                />
              )}
              <span className="text-slate-800 font-bold text-xs sm:text-[14px] tracking-tight">{effectiveDeveloperName}</span>
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 sm:gap-2.5">
              <span className="text-slate-500 font-medium text-xs sm:text-[13px] tracking-tight">Developed by</span>
              {resolvedDevLogoUrl && !devLogoFailed && (
                <img
                  src={resolvedDevLogoUrl}
                  alt={effectiveDeveloperName}
                  className="h-7 sm:h-9 max-h-9 w-auto object-contain shrink-0"
                  onError={() => {
                    console.warn('[MaintenancePage] Developer logo image failed to load:', resolvedDevLogoUrl);
                    setDevLogoFailed(true);
                  }}
                />
              )}
              <span className="text-slate-800 font-bold text-xs sm:text-[14px] tracking-tight">{effectiveDeveloperName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


