import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  Truck,
  RotateCcw,
  ShieldCheck,
  Award,
  DollarSign,
  Users,
  Repeat,
  ArrowRight,
  IndianRupee,
  Star,
  Heart,
  CheckCircle2,
  Package,
  Lock,
  BadgePercent,
  Headphones,
  Sparkles
} from 'lucide-react';
import api from '../../utils/api';
import { resolveImageUrl } from '../../utils/imageUtils';

const DEFAULT_BENEFITS = [
  { id: '1', title: 'Best Quality', subtitle: '100% Original Products', icon: 'Award' },
  { id: '2', title: 'Affordable Prices', subtitle: 'Best Prices in India', icon: 'IndianRupee' },
  { id: '3', title: 'Trusted by Millions', subtitle: 'Happy Customers', icon: 'Users' },
  { id: '4', title: 'Easy Exchange', subtitle: 'Hassle Free Exchange', icon: 'RotateCcw' }
];

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
  DollarSign,
  Users,
  Repeat,
  BadgePercent,
  Headphones,
  Sparkles
};

const renderIcon = (iconName) => {
  const IconComp = ICON_MAP[iconName] || Award;
  return <IconComp className="w-3.5 h-3.5 text-[#B71C1C]" />;
};

export default function DesktopSidebarRight() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [sidebarBanners, setSidebarBanners] = useState([]);
  const [promoCardConfig, setPromoCardConfig] = useState({
    enabled: true,
    badge: 'NEW ARRIVALS',
    title: 'Fresh Styles',
    description: 'Just Landed!',
    buttonText: 'SHOP NOW',
    link: '/new-arrivals',
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600',
    bgColor: '#434343',
    textColor: '#FFFFFF'
  });

  const [benefits, setBenefits] = useState(() => {
    try {
      const saved = localStorage.getItem('karviyam_why_shop_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.benefits) && parsed.benefits.length > 0) {
          return parsed.benefits.filter(b => b && b.enabled !== false).slice(0, 5);
        }
      }
    } catch (e) {}
    return DEFAULT_BENEFITS;
  });

  const fetchConfig = async () => {
    try {
      const res = await api.get('/settings').catch(() => null);
      const apiData = res?.data ? res.data : res;
      const dataMap = apiData?.data || apiData || {};
      const rawCfg = dataMap.karviyam_why_shop_config || dataMap.whyShopConfig;
      if (rawCfg) {
        const parsed = typeof rawCfg === 'string' ? JSON.parse(rawCfg) : rawCfg;
        if (parsed && Array.isArray(parsed.benefits)) {
          const active = parsed.benefits.filter(b => b && b.enabled !== false).slice(0, 5);
          if (active.length > 0) {
            setBenefits(active);
            try {
              localStorage.setItem('karviyam_why_shop_config', JSON.stringify(parsed));
            } catch (e) {}
          }
        }
      }
    } catch (e) {}
  };

  const fetchRightSidebarBanners = async () => {
    try {
      const res = await api.get('/right-sidebar-banners').catch(() => null);
      const apiData = res?.data ? res.data : res;
      let list = Array.isArray(apiData?.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);
      if (list && list.length > 0) {
        setSidebarBanners(list);
      } else {
        const saved = localStorage.getItem('karviyam_admin_right_sidebar_banners');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setSidebarBanners(parsed.filter(b => b.isActive !== false));
        }
      }
    } catch (e) {}
  };

  const fetchRightSidebarPromoCard = async () => {
    try {
      const res = await api.get('/right-sidebar-promo-card').catch(() => null);
      const apiData = res?.data ? res.data : res;
      const data = apiData?.data || apiData;
      if (data && typeof data === 'object') {
        setPromoCardConfig({
          enabled: data.enabled !== false,
          badge: data.badge || 'NEW ARRIVALS',
          title: data.title || 'Fresh Styles',
          description: data.description || 'Just Landed!',
          buttonText: data.buttonText || 'SHOP NOW',
          link: data.link || '/new-arrivals',
          imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600',
          bgColor: data.bgColor || '#434343',
          textColor: data.textColor || '#FFFFFF'
        });
      } else {
        const saved = localStorage.getItem('karviyam_right_sidebar_promo_card');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') setPromoCardConfig(parsed);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchConfig();
    fetchRightSidebarBanners();
    fetchRightSidebarPromoCard();

    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('karviyam_why_shop_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.benefits)) {
            const active = parsed.benefits.filter(b => b && b.enabled !== false).slice(0, 5);
            if (active.length > 0) setBenefits(active);
          }
        }
      } catch (e) {
        fetchConfig();
      }
      fetchRightSidebarBanners();
      fetchRightSidebarPromoCard();
    };

    window.addEventListener('karviyam_why_shop_updated', handleUpdate);
    window.addEventListener('karviyam_homepage_sections_updated', handleUpdate);
    window.addEventListener('karviyam_right_sidebar_banners_updated', handleUpdate);
    window.addEventListener('karviyam_right_sidebar_promo_card_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('karviyam_why_shop_updated', handleUpdate);
      window.removeEventListener('karviyam_homepage_sections_updated', handleUpdate);
      window.removeEventListener('karviyam_right_sidebar_banners_updated', handleUpdate);
      window.removeEventListener('karviyam_right_sidebar_promo_card_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText('KARVIYAM25');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-[230px] xl:w-[260px] flex-shrink-0 flex flex-col gap-3">
      
      {/* 1. Benefits List Card */}
      <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-xs p-3 flex flex-col justify-between gap-3">
        {benefits.map((item, idx) => (
          <div key={item.id || idx} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              {renderIcon(item.icon)}
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="font-bold text-[11px] text-slate-900 leading-tight truncate" title={item.title}>
                {item.title}
              </h5>
              <p className="text-[9.5px] text-slate-500 font-medium truncate" title={item.subtitle}>
                {item.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 2. NEW RIGHT SIDEBAR PROMOTIONAL CARD (Admin Configurable) */}
      {promoCardConfig.enabled !== false && (
        <div
          onClick={() => navigate(promoCardConfig.link || '/shop')}
          className="w-full h-[165px] xl:h-[180px] rounded-2xl flex items-center relative overflow-hidden shadow-md group cursor-pointer border border-slate-200/40 transition-transform hover:scale-[1.01] bg-slate-900"
        >
          {/* 100% Full Background Cover Image */}
          <img
            src={resolveImageUrl(promoCardConfig.imageUrl)}
            alt={promoCardConfig.title}
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600';
            }}
          />

          {/* Gradient Overlay for Left Text Readability */}
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(to right, ${promoCardConfig.bgColor || '#000000'}F2 0%, ${promoCardConfig.bgColor || '#000000'}A6 50%, transparent 100%)`
            }}
          />

          {/* Left Text Content */}
          <div className="z-20 text-left space-y-1 p-4 w-[65%] xl:w-[62%]" style={{ color: promoCardConfig.textColor || '#FFFFFF' }}>
            <span className="text-[9.5px] font-black uppercase tracking-widest block opacity-95 drop-shadow-sm truncate">
              {promoCardConfig.badge || 'NEW ARRIVALS'}
            </span>
            <h3 className="font-display font-black text-sm xl:text-base leading-tight uppercase line-clamp-2 drop-shadow-sm" title={promoCardConfig.title}>
              {promoCardConfig.title || 'Fresh Styles'}
            </h3>
            <p className="text-[10.5px] opacity-90 font-medium truncate drop-shadow-sm" title={promoCardConfig.description}>
              {promoCardConfig.description || 'Just Landed!'}
            </p>

            <div className="pt-2">
              <span className="inline-block bg-white text-slate-900 font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg shadow-sm group-hover:bg-slate-100 transition-colors">
                {promoCardConfig.buttonText || 'SHOP NOW'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Premium Collection / Dynamic Banners (Placed below Promotional Card) */}
      {sidebarBanners.length > 0 ? (
        sidebarBanners.map((banner) => (
          <div
            key={banner.id}
            onClick={() => navigate(banner.link || '/shop')}
            className="w-full min-h-[155px] bg-white rounded-xl border border-slate-200/90 shadow-xs p-3 flex items-center justify-between gap-2.5 relative overflow-hidden group cursor-pointer hover:border-[#B71C1C] transition-colors"
          >
            <div className="flex-1 z-10 flex flex-col justify-between h-full py-0.5 min-w-0">
              <div>
                <span className="text-[9px] font-black uppercase text-[#B71C1C] tracking-wider block truncate">
                  {banner.badgeText || 'KARVIYAM'}
                </span>
                <h4 className="font-display font-black text-sm xl:text-base text-slate-900 leading-tight uppercase mt-0.5 truncate" title={banner.title}>
                  {banner.title}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium mt-1 line-clamp-2" title={banner.description}>
                  {banner.description || 'Timeless styles for every occasion.'}
                </p>
              </div>

              <button
                type="button"
                className="flex items-center gap-1 text-[11px] font-black text-[#B71C1C] uppercase tracking-wide hover:underline cursor-pointer mt-2"
              >
                <span>{banner.buttonText || 'EXPLORE NOW'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="w-[85px] xl:w-[95px] h-[140px] xl:h-[148px] shrink-0 rounded-lg overflow-hidden shadow-2xs relative bg-slate-50 flex items-center justify-center border border-slate-100">
              <img
                src={resolveImageUrl(banner.imageUrl || banner.imagePath)}
                alt={banner.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600';
                }}
              />
            </div>
          </div>
        ))
      ) : (
        /* Fallback Premium Collection Banner */
        <div 
          onClick={() => navigate('/shop')}
          className="w-full h-[155px] xl:h-[165px] bg-white rounded-xl border border-slate-200/90 shadow-xs p-3 flex items-center justify-between relative overflow-hidden group cursor-pointer"
        >
          <div className="flex-1 z-10 flex flex-col justify-between h-full py-1 min-w-0">
            <div>
              <span className="text-[9px] font-black uppercase text-[#B71C1C] tracking-wider">
                KARVIYAM
              </span>
              <h4 className="font-display font-black text-sm xl:text-base text-slate-900 leading-tight uppercase mt-0.5">
                PREMIUM COLLECTION
              </h4>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                Timeless styles for every occasion.
              </p>
            </div>

            <button
              type="button"
              className="flex items-center gap-1 text-[11px] font-black text-[#B71C1C] uppercase tracking-wide hover:underline cursor-pointer"
            >
              <span>EXPLORE NOW</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="w-[85px] xl:w-[95px] h-[140px] xl:h-[148px] shrink-0 rounded-lg overflow-hidden shadow-2xs bg-slate-50">
            <img
              src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600"
              alt="Premium Collection"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

    </aside>
  );
}
