import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const DEFAULT_CONFIG = {
  enabled: true,
  title: 'Find Your Price',
  buttons: [
    { id: '1', label: 'Under ₹499', maxPrice: 499, enabled: true },
    { id: '2', label: 'Under ₹999', maxPrice: 999, enabled: true },
    { id: '3', label: 'Under ₹1499', maxPrice: 1499, enabled: true },
    { id: '4', label: 'Under ₹1999', maxPrice: 1999, enabled: true },
    { id: '5', label: 'Under ₹2999', maxPrice: 2999, enabled: true }
  ]
};

// Curated subtle accent color styles matching KARVIYAM design language
const BUTTON_ACCENTS = [
  'border-rose-200 text-rose-950 bg-rose-50/40 hover:bg-rose-100/60 hover:border-rose-300 hover:text-rose-900',
  'border-amber-200 text-amber-950 bg-amber-50/40 hover:bg-amber-100/60 hover:border-amber-300 hover:text-amber-900',
  'border-emerald-200 text-emerald-950 bg-emerald-50/40 hover:bg-emerald-100/60 hover:border-emerald-300 hover:text-emerald-900',
  'border-purple-200 text-purple-950 bg-purple-50/40 hover:bg-purple-100/60 hover:border-purple-300 hover:text-purple-900',
  'border-blue-200 text-blue-950 bg-blue-50/40 hover:bg-blue-100/60 hover:border-blue-300 hover:text-blue-900'
];

export default function FindYourPrice() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('karviyam_find_your_price_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_CONFIG;
  });

  const fetchConfig = async () => {
    try {
      const res = await api.get('/settings').catch(() => null);
      const apiData = res?.data ? res.data : res;
      const dataMap = apiData?.data || apiData || {};
      const rawCfg = dataMap.karviyam_find_your_price_config || dataMap.findYourPriceConfig;
      if (rawCfg) {
        const parsed = typeof rawCfg === 'string' ? JSON.parse(rawCfg) : rawCfg;
        if (parsed && typeof parsed === 'object') {
          setConfig(parsed);
          try {
            localStorage.setItem('karviyam_find_your_price_config', JSON.stringify(parsed));
          } catch (e) {}
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchConfig();

    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('karviyam_find_your_price_config');
        if (saved) {
          setConfig(JSON.parse(saved));
        } else {
          fetchConfig();
        }
      } catch (e) {
        fetchConfig();
      }
    };

    window.addEventListener('karviyam_find_your_price_updated', handleUpdate);
    window.addEventListener('karviyam_homepage_sections_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('karviyam_find_your_price_updated', handleUpdate);
      window.removeEventListener('karviyam_homepage_sections_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (config.enabled === false) return null;

  const rawButtons = Array.isArray(config.buttons) ? config.buttons : DEFAULT_CONFIG.buttons;
  const activeButtons = rawButtons.filter(b => b && b.enabled !== false);

  if (activeButtons.length === 0) return null;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 my-2.5 transition-all">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-display font-black text-slate-900 text-sm sm:text-base tracking-tight uppercase">
          {config.title || 'Find Your Price'}
        </h2>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-0.5">
        {activeButtons.map((btn, idx) => {
          const accentClass = BUTTON_ACCENTS[idx % BUTTON_ACCENTS.length];
          const maxP = btn.maxPrice !== undefined ? btn.maxPrice : 999;
          const displayLabel = btn.label || `Under ₹${maxP}`;

          return (
            <button
              key={btn.id || idx}
              type="button"
              onClick={() => navigate(`/shop?maxPrice=${maxP}`)}
              className={`rounded-full px-4 sm:px-5 py-2 text-xs font-extrabold shadow-2xs border cursor-pointer shrink-0 transition-all hover:scale-105 hover:shadow-xs active:scale-95 flex items-center justify-center ${accentClass}`}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
