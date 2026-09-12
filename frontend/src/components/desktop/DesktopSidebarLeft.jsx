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
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Smartphone
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
  ShieldCheck,
  RotateCcw,
  Smartphone
};

const DEFAULT_NAV_ITEMS = [
  { id: 'offers', label: 'Top Offers', subtitle: 'Best discounts on site', icon: 'Flame', link: '/shop?filter=offers', badge: 'HOT', enabled: true },
  { id: 'arrivals', label: 'New Arrivals', subtitle: 'Fresh drops & collections', icon: 'Sparkles', link: '/shop?filter=new', badge: 'NEW', enabled: true },
  { id: 'bestsellers', label: 'Best Sellers', subtitle: 'Customer favorite picks', icon: 'Star', link: '/shop?filter=bestsellers', badge: 'HOT', enabled: true },
  { id: 'trending', label: 'Trending Now', subtitle: 'Popular style trends', icon: 'TrendingUp', link: '/shop?filter=trending', badge: '', enabled: true },
  { id: 'premium', label: 'Premium Store', subtitle: '925 Silver & Luxury', icon: 'Crown', link: '/shop?category=Jewellery', badge: 'NEW', enabled: true },
  { id: 'gifts', label: 'Gift Cards', subtitle: 'Surprise your loved ones', icon: 'Gift', link: '/contact', badge: '', enabled: true },
  { id: 'track', label: 'Track Order', subtitle: 'Live order tracking', icon: 'Truck', link: '/profile', badge: '', enabled: true },
  { id: 'support', label: 'Customer Support', subtitle: '24/7 dedicated help', icon: 'Headphones', link: '/contact', badge: '', enabled: true }
];

const DEFAULT_OFFER_CARD = {
  enabled: true,
  heading: 'EXTRA 10% OFF',
  subtitle: 'On Prepaid Orders',
  discountPercent: '%',
  link: '/shop?filter=offers'
};

const DEFAULT_PROMO_CARD = {
  enabled: true,
  badge: '✨ FESTIVE SPECIAL',
  title: 'UP TO 60% OFF',
  subtitle: 'On Bestsellers',
  buttonText: 'SHOP NOW',
  link: '/shop',
  imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'
};

const DEFAULT_APP_CARD = {
  enabled: true,
  title: 'DOWNLOAD KARVIYAM APP',
  subtitle: 'Shop Anytime, Anywhere',
  playStoreUrl: 'https://play.google.com/store',
  appStoreUrl: 'https://apps.apple.com'
};

const DEFAULT_INDIA_CARD = {
  enabled: true,
  badge: 'MADE IN INDIA',
  title: 'Supporting Local',
  subtitle: 'Artisans & Brands',
  buttonText: 'SHOP INDIAN →',
  link: '/shop?filter=local'
};

const DEFAULT_WHY_SHOP = [
  { id: '1', title: 'Free Delivery', subtitle: 'On orders above ₹499', icon: 'Truck' },
  { id: '2', title: 'Secure Payments', subtitle: '100% safe & secure', icon: 'ShieldCheck' },
  { id: '3', title: 'Easy Returns', subtitle: '30 days return policy', icon: 'RotateCcw' },
  { id: '4', title: 'Best Price Guarantee', subtitle: 'Unbeatable value', icon: 'Heart' },
  { id: '5', title: '24/7 Support', subtitle: 'Dedicated assistance', icon: 'Headphones' }
];

export default function DesktopSidebarLeft() {
  const navigate = useNavigate();
  const [navItems, setNavItems] = useState(DEFAULT_NAV_ITEMS);
  const [offerCard, setOfferCard] = useState(DEFAULT_OFFER_CARD);
  const [promoCard, setPromoCard] = useState(DEFAULT_PROMO_CARD);
  const [appCard, setAppCard] = useState(DEFAULT_APP_CARD);
  const [indiaCard, setIndiaCard] = useState(DEFAULT_INDIA_CARD);
  const [whyShopItems, setWhyShopItems] = useState(DEFAULT_WHY_SHOP);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/sidebar-config').catch(() => null);
      const data = res?.data?.data || res?.data;

      if (data) {
        if (Array.isArray(data.navItems) && data.navItems.length > 0) {
          setNavItems(data.navItems.filter(i => i.enabled !== false));
        }
        if (data.offerCard) setOfferCard(data.offerCard);
        if (data.promoCard) setPromoCard(data.promoCard);
        if (data.appCard) setAppCard(data.appCard);
        if (data.indiaCard) setIndiaCard(data.indiaCard);
      }
    } catch (e) {
      console.error('Error fetching sidebar config:', e);
    }
  };

  const fetchWhyShopConfig = async () => {
    try {
      const res = await api.get('/settings').catch(() => null);
      const dataMap = res?.data?.data || res?.data || {};
      const rawCfg = dataMap.karviyam_why_shop_config || dataMap.whyShopConfig;
      if (rawCfg) {
        const parsed = typeof rawCfg === 'string' ? JSON.parse(rawCfg) : rawCfg;
        if (parsed && Array.isArray(parsed.benefits) && parsed.benefits.length > 0) {
          setWhyShopItems(parsed.benefits.filter(b => b && b.enabled !== false).slice(0, 5));
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchConfig();
    fetchWhyShopConfig();

    const handleUpdate = () => {
      fetchConfig();
      fetchWhyShopConfig();
    };

    window.addEventListener('karviyam_sidebar_config_updated', handleUpdate);
    window.addEventListener('karviyam_why_shop_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('karviyam_sidebar_config_updated', handleUpdate);
      window.removeEventListener('karviyam_why_shop_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const renderIcon = (iconName, fallbackIcon = Tag) => {
    const IconComp = ICON_MAP[iconName] || fallbackIcon;
    return <IconComp className="w-3.5 h-3.5" />;
  };

  return (
    <aside className="w-[200px] xl:w-[220px] shrink-0 flex flex-col gap-3">
      
      {/* 1. QUICK SHOP Navigation Card */}
      {navItems.length > 0 && (
        <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {navItems.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => navigate(item.link || '/shop')}
              className={`h-[40px] xl:h-[42px] px-3 flex items-center justify-between cursor-pointer transition-all hover:bg-red-50/40 text-slate-800 group ${
                idx !== navItems.length - 1 ? 'border-b border-slate-100/90' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0 group-hover:bg-red-50 group-hover:text-[#B71C1C] transition-colors">
                  {renderIcon(item.icon, Tag)}
                </div>
                <span className="text-[11px] xl:text-[11.5px] font-extrabold tracking-tight truncate group-hover:text-[#B71C1C]">
                  {item.label || item.title}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {item.badge && (
                  <span className="bg-red-100 text-[#B71C1C] text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#B71C1C] transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. SMALL OFFER CARD */}
      {offerCard && offerCard.enabled !== false && (
        <div
          onClick={() => navigate(offerCard.link || '/shop?filter=offers')}
          className="w-full bg-[#FFF5F5] border border-red-200/90 rounded-xl p-3 flex items-center justify-between shadow-2xs overflow-hidden relative cursor-pointer hover:border-[#B71C1C] transition-colors group"
        >
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-display font-black text-xs xl:text-sm text-[#B71C1C] uppercase tracking-wide group-hover:underline truncate">
              {offerCard.heading || 'EXTRA 10% OFF'}
            </span>
            <span className="text-[10px] text-slate-600 font-bold mt-0.5 truncate">
              {offerCard.subtitle || 'On Prepaid Orders'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-red-100 text-[#B71C1C] flex items-center justify-center font-black text-xs shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
            {offerCard.discountPercent || '%'}
          </div>
        </div>
      )}

      {/* 3. LARGE FESTIVE AD */}
      {promoCard && promoCard.enabled !== false && (
        <div
          onClick={() => navigate(promoCard.link || '/shop')}
          className="w-full h-[320px] xl:h-[340px] rounded-2xl overflow-hidden relative shadow-md text-white p-4 flex flex-col justify-between bg-gradient-to-b from-[#8B0000] via-[#B71C1C] to-[#5C0000] group cursor-pointer border border-red-900/60"
        >
          <img
            src={resolveImageUrl(promoCard.imageUrl)}
            alt={promoCard.title || 'Festive Ad'}
            className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

          <div className="relative z-10 space-y-2.5">
            <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-widest text-amber-300 bg-black/40 border border-amber-400/60 px-2 py-0.5 rounded backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-amber-300" /> {promoCard.badge || '✨ FESTIVE SPECIAL'}
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

      {/* 4. WHY SHOP WITH KARVIYAM */}
      <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2.5">
        <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
          WHY SHOP WITH KARVIYAM?
        </h4>
        <div className="space-y-2">
          {whyShopItems.map((item, idx) => (
            <div key={item.id || idx} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-md bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0 mt-0.5">
                {renderIcon(item.icon, Truck)}
              </div>
              <div className="min-w-0">
                <h5 className="font-extrabold text-[11px] text-slate-900 leading-tight truncate">
                  {item.title}
                </h5>
                <p className="text-[9.5px] text-slate-500 font-medium truncate">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. APP DOWNLOAD CARD */}
      {appCard && appCard.enabled !== false && (
        <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2 text-center">
          <div className="flex items-center justify-center gap-1 text-[#B71C1C]">
            <Smartphone className="w-4 h-4" />
            <h4 className="font-display font-black text-xs uppercase tracking-wide text-slate-900">
              {appCard.title || 'DOWNLOAD KARVIYAM APP'}
            </h4>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            {appCard.subtitle || 'Shop Anytime, Anywhere'}
          </p>

          <div className="flex flex-col gap-1.5 pt-1">
            <a
              href={appCard.playStoreUrl || 'https://play.google.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>GET IT ON</span>
              <span className="font-black">Google Play</span>
            </a>
            <a
              href={appCard.appStoreUrl || 'https://apple.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Download on the</span>
              <span className="font-black">App Store</span>
            </a>
          </div>
        </div>
      )}

      {/* 6. MADE IN INDIA / BRAND CARD */}
      {indiaCard && indiaCard.enabled !== false && (
        <div
          onClick={() => navigate(indiaCard.link || '/shop?filter=local')}
          className="w-full bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-amber-100/60 border border-amber-200 rounded-xl p-3 space-y-2 cursor-pointer hover:border-amber-400 transition-colors group relative overflow-hidden shadow-2xs"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-base">🇮🇳</span>
            <span className="text-[9.5px] font-black uppercase text-amber-900 tracking-wider">
              {indiaCard.badge || 'MADE IN INDIA'}
            </span>
          </div>

          <div>
            <h4 className="font-display font-black text-xs text-slate-900 leading-tight">
              {indiaCard.title || 'Supporting Local'}
            </h4>
            <p className="text-[10px] text-slate-600 font-medium">
              {indiaCard.subtitle || 'Artisans & Brands'}
            </p>
          </div>

          <button
            type="button"
            className="w-full bg-[#B71C1C] hover:bg-[#8E0000] text-white font-black text-[10px] uppercase tracking-wider py-1.5 rounded-lg shadow-2xs transition-colors"
          >
            {indiaCard.buttonText || 'SHOP INDIAN →'}
          </button>
        </div>
      )}

    </aside>
  );
}
