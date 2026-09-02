import React, { useState, useEffect } from 'react';
import {
  Award,
  ShieldCheck,
  RotateCcw,
  Truck,
  Star,
  Heart,
  CheckCircle2,
  Package,
  Lock,
  IndianRupee,
  BadgePercent,
  Headphones,
  Sparkles
} from 'lucide-react';
import api from '../utils/api';

const DEFAULT_CONFIG = {
  enabled: true,
  title: 'WHY SHOP WITH KARVIYAM?',
  benefits: [
    { id: '1', title: 'Best Quality', subtitle: '100% Original', icon: 'Award', enabled: true },
    { id: '2', title: 'Secure Payments', subtitle: '100% Protected', icon: 'ShieldCheck', enabled: true },
    { id: '3', title: 'Easy Returns', subtitle: '14 Days Policy', icon: 'RotateCcw', enabled: true },
    { id: '4', title: 'Free Delivery', subtitle: 'Above ₹499', icon: 'Truck', enabled: true },
    { id: '5', title: 'Top Brands', subtitle: 'Original Products', icon: 'Star', enabled: true }
  ]
};

const ICON_MAP = {
  Award,
  ShieldCheck,
  RotateCcw,
  Truck,
  Star,
  Heart,
  CheckCircle: CheckCircle2,
  CheckCircle2,
  Package,
  Lock,
  IndianRupee,
  BadgePercent,
  Headphones,
  Sparkles
};

export const renderBenefitIcon = (iconName, className = "w-4 h-4 xl:w-5 xl:h-5") => {
  const IconComp = ICON_MAP[iconName] || Award;
  return <IconComp className={className} />;
};

export default function WhyShopWithKarviyam() {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('karviyam_why_shop_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_CONFIG;
  });

  const fetchConfig = async () => {
    try {
      const res = await api.get('/settings').catch(() => null);
      const apiData = res?.data ? res.data : res;
      const dataMap = apiData?.data || apiData || {};
      const rawCfg = dataMap.karviyam_why_shop_config || dataMap.whyShopConfig;
      if (rawCfg) {
        const parsed = typeof rawCfg === 'string' ? JSON.parse(rawCfg) : rawCfg;
        if (parsed && typeof parsed === 'object') {
          setConfig(parsed);
          try {
            localStorage.setItem('karviyam_why_shop_config', JSON.stringify(parsed));
          } catch (e) {}
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchConfig();

    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('karviyam_why_shop_config');
        if (saved) {
          setConfig(JSON.parse(saved));
        } else {
          fetchConfig();
        }
      } catch (e) {
        fetchConfig();
      }
    };

    window.addEventListener('karviyam_why_shop_updated', handleUpdate);
    window.addEventListener('karviyam_homepage_sections_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('karviyam_why_shop_updated', handleUpdate);
      window.removeEventListener('karviyam_homepage_sections_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (config.enabled === false) return null;

  const rawBenefits = Array.isArray(config.benefits) ? config.benefits : DEFAULT_CONFIG.benefits;
  const activeBenefits = rawBenefits.filter(b => b && b.enabled !== false);

  if (activeBenefits.length === 0) return null;

  return (
    <div className="w-full h-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-3.5 py-3 xl:px-4 xl:py-3.5 flex flex-col justify-center transition-all">
      {/* Grid of Benefit Cards */}
      <div className="flex items-center justify-between gap-1.5 xl:gap-2 overflow-x-auto no-scrollbar py-0.5 w-full">
        {activeBenefits.map((item, idx) => (
          <div
            key={item.id || idx}
            className="flex-1 min-w-[70px] sm:min-w-[80px] flex flex-col items-center text-center group shrink-0"
          >
            {/* Icon Bubble */}
            <div className="w-7.5 h-7.5 xl:w-8 xl:h-8 rounded-full bg-rose-50 text-[#B71C1C] flex items-center justify-center mb-1 shadow-2xs group-hover:scale-110 transition-transform">
              {renderBenefitIcon(item.icon, "w-3.5 h-3.5 xl:w-4 xl:h-4")}
            </div>

            {/* Benefit Title */}
            <h3 className="font-bold text-[10px] xl:text-[10.5px] text-slate-900 leading-tight truncate w-full" title={item.title}>
              {item.title}
            </h3>

            {/* Subtitle / Description */}
            {item.subtitle && (
              <p className="text-[8.5px] xl:text-[9px] font-medium text-slate-500 truncate w-full mt-0.5" title={item.subtitle}>
                {item.subtitle}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
