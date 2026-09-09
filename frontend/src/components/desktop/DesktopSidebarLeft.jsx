import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag,
  Clock,
  Award,
  TrendingUp,
  Crown,
  Gift,
  Truck,
  Headphones,
  Sparkles,
  Percent,
  Star,
  Shield,
  Flame,
  Heart,
  ShoppingBag,
  User,
  ChevronRight
} from 'lucide-react';
import api from '../../utils/api';
import { resolveImageUrl } from '../../utils/imageUtils';

const ICON_MAP = {
  Tag,
  Clock,
  Award,
  TrendingUp,
  Crown,
  Gift,
  Truck,
  Headphones,
  Sparkles,
  Percent,
  Star,
  Shield,
  Flame,
  Heart,
  ShoppingBag,
  User
};

const DEFAULT_NAV_ITEMS = [
  { id: 'offers', label: 'Top Offers', icon: 'Tag', link: '/shop?filter=offers' },
  { id: 'arrivals', label: 'New Arrivals', icon: 'Clock', link: '/shop?filter=new' },
  { id: 'bestsellers', label: 'Best Sellers', icon: 'Award', link: '/shop?filter=bestsellers' },
  { id: 'trending', label: 'Trending Now', icon: 'TrendingUp', link: '/shop?filter=trending' },
  { id: 'premium', label: 'Premium Store', icon: 'Crown', link: '/shop?category=Jewellery' },
  { id: 'gifts', label: 'Gift Cards', icon: 'Gift', link: '/contact' },
  { id: 'track', label: 'Track Order', icon: 'Truck', link: '/profile' },
  { id: 'support', label: 'Customer Support', icon: 'Headphones', link: '/contact' }
];

const DEFAULT_OFFER_CARD = {
  enabled: true,
  heading: 'EXTRA 5% OFF',
  subtitle: 'On Prepaid Orders',
  discountPercent: '5%',
  link: '/shop?filter=offers'
};

const DEFAULT_PROMO_CARD = {
  enabled: true,
  badge: 'FESTIVE SPECIAL',
  title: 'UP TO 60% OFF',
  subtitle: 'On Bestsellers',
  buttonText: 'SHOP NOW',
  link: '/shop',
  imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'
};

export default function DesktopSidebarLeft() {
  const navigate = useNavigate();
  const [navItems, setNavItems] = useState(DEFAULT_NAV_ITEMS);
  const [offerCard, setOfferCard] = useState(DEFAULT_OFFER_CARD);
  const [promoCard, setPromoCard] = useState(DEFAULT_PROMO_CARD);

  useEffect(() => {
    fetchSidebarConfig();

    const handleUpdate = () => {
      fetchSidebarConfig();
    };

    window.addEventListener('karviyam_sidebar_config_updated', handleUpdate);
    window.addEventListener('karviyam_promo_cards_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('karviyam_sidebar_config_updated', handleUpdate);
      window.removeEventListener('karviyam_promo_cards_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const fetchSidebarConfig = async () => {
    try {
      const res = await api.get('/sidebar-config').catch(() => null);
      const data = res?.data?.data || res?.data;

      if (data) {
        if (Array.isArray(data.navItems) && data.navItems.length > 0) {
          const activeNav = data.navItems.filter(i => i.enabled !== false);
          setNavItems(activeNav);
        }
        if (data.offerCard && typeof data.offerCard === 'object') {
          setOfferCard(data.offerCard);
        }
        if (data.promoCard && typeof data.promoCard === 'object') {
          setPromoCard(data.promoCard);
        }
      } else {
        const saved = localStorage.getItem('karviyam_sidebar_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.navItems)) setNavItems(parsed.navItems.filter(i => i.enabled !== false));
          if (parsed.offerCard) setOfferCard(parsed.offerCard);
          if (parsed.promoCard) setPromoCard(parsed.promoCard);
        }
      }
    } catch (e) {
      console.error('Error loading sidebar configuration:', e);
    }
  };

  const renderIcon = (iconName) => {
    const IconComp = ICON_MAP[iconName] || Tag;
    return <IconComp className="w-3.5 h-3.5" />;
  };

  return (
    <aside className="w-[210px] xl:w-[230px] flex-shrink-0 flex flex-col gap-3">
      
      {/* 1. Sidebar Navigation Menu Card */}
      {navItems.length > 0 && (
        <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {navItems.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => navigate(item.link || '/shop')}
              className={`h-[42px] xl:h-[44px] px-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-slate-50 text-slate-800 group ${
                idx !== navItems.length - 1 ? 'border-b border-slate-100/90' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-red-50 group-hover:text-[#B71C1C] transition-colors">
                  {renderIcon(item.icon)}
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <span className="text-[11px] xl:text-xs font-black tracking-tight truncate">
                    {item.label || item.title}
                  </span>
                  {item.subtitle && (
                    <span className="text-[9px] text-slate-400 font-medium truncate">
                      {item.subtitle}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {item.badge && (
                  <span className="bg-red-100 text-[#B71C1C] text-[8.5px] font-black px-1.5 py-0.5 rounded-md uppercase">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#B71C1C] transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Extra 5% OFF / Prepaid Discount Banner */}
      {offerCard && offerCard.enabled !== false && (
        <div 
          onClick={() => navigate(offerCard.link || '/shop?filter=offers')}
          className="w-full h-[72px] bg-[#FFF0F2] border border-red-200/90 rounded-xl p-3 flex items-center justify-between shadow-2xs overflow-hidden relative cursor-pointer hover:border-[#B71C1C] transition-colors group"
        >
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-display font-black text-xs xl:text-sm text-[#B71C1C] uppercase tracking-wide group-hover:underline truncate">
              {offerCard.heading || 'EXTRA 5% OFF'}
            </span>
            <span className="text-[10px] text-slate-600 font-bold mt-0.5 truncate">
              {offerCard.subtitle || 'On Prepaid Orders'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-red-100/90 border border-red-200 text-[#B71C1C] flex items-center justify-center font-black text-xs shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            {offerCard.discountPercent || '%'}
          </div>
        </div>
      )}

      {/* 3. Festive Special / Admin-Managed Promo Banner */}
      {promoCard && promoCard.enabled !== false && (
        <div 
          onClick={() => navigate(promoCard.link || '/shop')}
          className="w-full h-[340px] xl:h-[360px] rounded-2xl overflow-hidden relative shadow-md text-white p-4 xl:p-5 flex flex-col justify-between bg-gradient-to-b from-[#7A0000] via-[#A30000] to-[#450000] group cursor-pointer border border-red-900/60"
        >
          <img
            src={resolveImageUrl(promoCard.imageUrl)}
            alt={promoCard.title || 'Promotional Banner'}
            className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

          <div className="relative z-10 space-y-3">
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-300 bg-black/40 border border-amber-400/60 px-2.5 py-1 rounded-md backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-amber-300" /> {promoCard.badge || 'FESTIVE SPECIAL'}
            </span>
            <div>
              <span className="font-display font-black text-xl xl:text-2xl text-white block uppercase tracking-tight drop-shadow-md">
                {promoCard.title || 'UP TO 60% OFF'}
              </span>
              <span className="text-xs text-slate-100 font-bold block mt-1 drop-shadow-xs">
                {promoCard.subtitle || 'On Bestsellers'}
              </span>
            </div>
          </div>

          <div className="relative z-10 w-full">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(promoCard.link || '/shop');
              }}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-black text-xs uppercase tracking-wider py-2.5 rounded-full shadow-lg transition-transform group-hover:scale-102 cursor-pointer text-center"
            >
              {promoCard.buttonText || 'SHOP NOW'}
            </button>
          </div>
        </div>
      )}

    </aside>
  );
}
