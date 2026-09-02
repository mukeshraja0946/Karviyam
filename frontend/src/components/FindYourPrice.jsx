import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const DEFAULT_CONFIG = {
  enabled: true,
  title: 'FIND YOUR PRICE',
  buttons: [
    { id: '1', label: 'Under ₹499', maxPrice: 499, enabled: true },
    { id: '2', label: 'Under ₹999', maxPrice: 999, enabled: true },
    { id: '3', label: 'Under ₹1499', maxPrice: 1499, enabled: true },
    { id: '4', label: 'Under ₹1999', maxPrice: 1999, enabled: true },
    { id: '5', label: 'Under ₹2999', maxPrice: 2999, enabled: true },
    { id: '6', label: 'Under ₹3999', maxPrice: 3999, enabled: true }
  ]
};

// Distinct pill colors matching the reference design image
const BUTTON_ACCENTS = [
  'border-rose-300 text-rose-800 bg-white hover:bg-rose-50 hover:border-rose-400',
  'border-amber-300 text-amber-800 bg-white hover:bg-amber-50 hover:border-amber-400',
  'border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50 hover:border-emerald-400',
  'border-purple-300 text-purple-800 bg-white hover:bg-purple-50 hover:border-purple-400',
  'border-blue-300 text-blue-800 bg-white hover:bg-blue-50 hover:border-blue-400',
  'border-pink-300 text-pink-800 bg-white hover:bg-pink-50 hover:border-pink-400'
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
    <div className="w-full h-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-3.5 py-3 xl:px-4 xl:py-3.5 flex flex-col justify-center transition-all">
      {/* STRICT SINGLE HORIZONTAL LINE (NO WRAP) */}
      <div className="flex items-center gap-2 xl:gap-2.5 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap flex-nowrap w-full">
        {activeButtons.map((btn, idx) => {
          const accentClass = BUTTON_ACCENTS[idx % BUTTON_ACCENTS.length];
          const maxP = btn.maxPrice !== undefined ? btn.maxPrice : 999;
          const displayLabel = btn.label || `Under ₹${maxP}`;

          return (
            <button
              key={btn.id || idx}
              type="button"
              onClick={() => navigate(`/shop?maxPrice=${maxP}`)}
              className={`rounded-full px-3.5 xl:px-4 py-2 text-[11px] xl:text-xs font-extrabold shadow-2xs border cursor-pointer shrink-0 transition-all hover:scale-105 hover:shadow-xs active:scale-95 flex items-center justify-center ${accentClass}`}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
