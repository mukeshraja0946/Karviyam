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
  Smartphone,
  Copy,
  Check,
  IndianRupee,
  ArrowRight,
  Grid,
  Zap,
  CheckCircle2,
  BadgePercent,
  Layers,
  ShoppingBag
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { resolveImageUrl, handleImageError } from '../../utils/imageUtils';

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
  Smartphone,
  CheckCircle2,
  Grid,
  Layers
};

export default function DesktopSidebarLeft() {
  const navigate = useNavigate();
  const [leftSections, setLeftSections] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [trendingShortProducts, setTrendingShortProducts] = useState([]);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/sidebar-config').catch(() => null);
      const data = res?.data?.data || res?.data;

      if (data && Array.isArray(data.leftSections) && data.leftSections.length > 0) {
        const sorted = [...data.leftSections]
          .filter(s => s && s.enabled !== false)
          .sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
        setLeftSections(sorted);
      }
    } catch (e) {
      console.error('Error fetching left sidebar config:', e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products?limit=4').catch(() => null);
      const list = res?.data?.data?.products || res?.data?.products || res?.data;
      if (Array.isArray(list) && list.length > 0) {
        setPopularProducts(list.slice(0, 2));
        setTrendingShortProducts(list.slice(2, 4));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchConfig();
    fetchProducts();

    const handleUpdate = () => {
      fetchConfig();
      fetchProducts();
    };

    window.addEventListener('karviyam_sidebar_config_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('karviyam_sidebar_config_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleCopyCode = (e, code) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code || 'PREPAID10');
    setCopiedCode(true);
    toast.success(`Coupon code ${code || 'PREPAID10'} copied! 🎉`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const renderIcon = (iconName, fallbackIcon = Tag) => {
    const IconComp = ICON_MAP[iconName] || fallbackIcon;
    return <IconComp className="w-3.5 h-3.5 text-[#C91C1C]" />;
  };

  const handleItemNavigation = (dest, actionType) => {
    if (!dest) dest = '/shop';
    if (actionType === 'EXTERNAL_URL' && dest.startsWith('http')) {
      window.open(dest, '_blank');
      return;
    }
    if (actionType === 'TRACK_ORDER' || dest === '/profile' || dest.includes('/profile')) {
      const token = localStorage.getItem('karviyam_token');
      if (token) {
        navigate('/profile');
      } else {
        toast.error('Please log in to track your live orders! 🔒');
        navigate('/login?redirect=/profile');
      }
      return;
    }
    navigate(dest);
  };

  const handleAction = (sec) => {
    const dest = sec.actionValue || sec.link || '/shop';
    handleItemNavigation(dest, sec.actionType);
  };

  return (
    <aside className="w-[190px] xl:w-[210px] shrink-0 flex flex-col gap-2.5">
      {leftSections.map((sec) => {
        const type = sec.sectionType;

        // 1. NAV MENU
        if (type === 'NAV_MENU') {
          const items = Array.isArray(sec.config) ? sec.config.filter(i => i.enabled !== false) : [];
          if (items.length === 0) return null;
          return (
            <div key={sec.id} className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => {
                    const dest = item.link || (item.id === 'track' ? '/profile' : (item.id === 'support' ? '/contact' : '/shop'));
                    const actType = item.id === 'track' ? 'TRACK_ORDER' : (item.id === 'support' ? 'CONTACT' : null);
                    handleItemNavigation(dest, actType);
                  }}
                  className={`h-[40px] xl:h-[42px] px-3 flex items-center justify-between cursor-pointer transition-all hover:bg-red-50/40 text-slate-800 group ${
                    idx !== items.length - 1 ? 'border-b border-slate-100/90' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-red-50/80 border border-red-100 flex items-center justify-center text-[#C91C1C] shrink-0 group-hover:bg-[#C91C1C] group-hover:text-white transition-colors">
                      {renderIcon(item.icon, Tag)}
                    </div>
                    <span className="text-[11px] xl:text-[11.5px] font-extrabold tracking-tight truncate group-hover:text-[#C91C1C]">
                      {item.label || item.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.badge && (
                      <span className="bg-red-100 text-[#C91C1C] text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#C91C1C] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          );
        }

        // 2. OFFER CARD
        if (type === 'OFFER_CARD') {
          const couponCode = sec.config?.couponCode || 'PREPAID10';
          const discountPercent = sec.config?.discountPercent || '%';
          return (
            <div
              key={sec.id}
              onClick={() => handleAction(sec)}
              className="w-full bg-[#FFF5F5] border border-red-200/90 rounded-xl p-3 flex flex-col gap-2 shadow-2xs overflow-hidden relative cursor-pointer hover:border-[#C91C1C] transition-colors group"
              style={{ backgroundColor: sec.backgroundColor || '#FFF5F5' }}
            >
              <div className="flex items-center justify-between min-w-0">
                <div>
                  <span className="font-display font-black text-xs xl:text-sm text-[#C91C1C] uppercase tracking-wide group-hover:underline truncate block">
                    {sec.title || 'EXTRA 10% OFF'}
                  </span>
                  <span className="text-[9.5px] text-slate-600 font-bold block truncate">
                    {sec.subtitle || 'On Prepaid Orders'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-red-100 text-[#C91C1C] flex items-center justify-center font-black text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  {discountPercent}
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1 border-t border-red-200/60">
                <button
                  type="button"
                  onClick={(e) => handleCopyCode(e, couponCode)}
                  className="flex-1 bg-white hover:bg-slate-50 text-[#C91C1C] border border-red-200 font-black text-[9.5px] py-1 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'COPIED' : 'COPY CODE'}</span>
                </button>
                <button
                  type="button"
                  className="bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[9.5px] py-1 px-2 rounded-lg transition-colors cursor-pointer"
                >
                  {sec.buttonText || 'SHOP NOW'}
                </button>
              </div>
            </div>
          );
        }

        // 3. PROMO BANNER (FESTIVE COVER DESIGN)
        if (type === 'PROMO_BANNER') {
          return (
            <div
              key={sec.id}
              onClick={() => handleAction(sec)}
              className="w-full relative rounded-2xl overflow-hidden shadow-sm group cursor-pointer border border-red-200/50 flex flex-col justify-between p-3.5 transition-all duration-300 hover:shadow-md hover:border-[#C91C1C]"
              style={{ minHeight: '320px' }}
            >
              {sec.imageUrl && (
                <img
                  src={resolveImageUrl(sec.imageUrl)}
                  alt={sec.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={handleImageError}
                />
              )}
              <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#8B0000]/75 via-[#900C0C]/35 to-black/70 pointer-events-none" />

              <div className="relative z-20 space-y-1 text-left pt-1">
                {sec.badgeText && (
                  <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-amber-300 bg-black/45 backdrop-blur-xs border border-amber-400/40 px-2.5 py-1 rounded-full shadow-xs">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{sec.badgeText}</span>
                  </span>
                )}
                <div className="pt-1.5">
                  <span className="font-display font-black text-lg xl:text-xl text-white block uppercase tracking-tight leading-none drop-shadow-md">
                    {sec.title}
                  </span>
                  <span className="text-xs text-white/95 font-bold block mt-1 drop-shadow-sm">
                    {sec.subtitle}
                  </span>
                </div>
              </div>

              <div className="relative z-30 pt-4 flex justify-center w-full">
                <button
                  type="button"
                  className="w-[92%] bg-white hover:bg-slate-50 text-[#B71C1C] font-display font-black text-xs uppercase tracking-wider py-2.5 px-3 rounded-full shadow-md transition-transform group-hover:scale-104 cursor-pointer text-center border border-white/60"
                >
                  {sec.buttonText || 'SHOP NOW'}
                </button>
              </div>
            </div>
          );
        }

        // 4. SHOP BY PRICE
        if (type === 'SHOP_BY_PRICE') {
          const prices = Array.isArray(sec.config) ? sec.config.filter(p => p.enabled !== false) : [];
          if (prices.length === 0) return null;
          return (
            <div key={sec.id} className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
              <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-[#C91C1C]" />
                <span>{sec.title || 'SHOP BY PRICE'}</span>
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {prices.map((p, idx) => (
                  <button
                    key={p.id || idx}
                    type="button"
                    onClick={() => navigate(p.link || '/shop')}
                    className="bg-slate-50 hover:bg-red-50 hover:border-red-200 border border-slate-200/80 rounded-lg py-1.5 px-2 text-[10px] font-black text-slate-800 hover:text-[#C91C1C] transition-colors cursor-pointer text-center truncate"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        // 5. CATEGORIES GRID
        if (type === 'CATEGORIES_GRID') {
          const cats = Array.isArray(sec.config) ? sec.config.filter(c => c.enabled !== false) : [];
          if (cats.length === 0) return null;
          return (
            <div key={sec.id} className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
              <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1">
                <Grid className="w-3.5 h-3.5 text-[#C91C1C]" />
                <span>{sec.title || 'QUICK CATEGORIES'}</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {cats.map((c, idx) => (
                  <button
                    key={c.id || idx}
                    type="button"
                    onClick={() => navigate(c.link || '/shop')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[9.5px] py-1 px-2.5 rounded-full transition-colors cursor-pointer"
                  >
                    {c.name || c.label}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        // 6. WHY KARVIYAM (POINTS)
        if (type === 'WHY_KARVIYAM') {
          const points = Array.isArray(sec.config) ? sec.config.filter(p => p.enabled !== false) : [];
          if (points.length === 0) return null;
          return (
            <div key={sec.id} className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
              <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5">
                {sec.title || 'WHY SHOP WITH KARVIYAM?'}
              </h4>
              <div className="space-y-2">
                {points.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-md bg-red-50 text-[#C91C1C] flex items-center justify-center shrink-0 mt-0.5">
                      {renderIcon(item.icon, Truck)}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-extrabold text-[10.5px] text-slate-900 leading-tight truncate">
                        {item.title}
                      </h5>
                      <p className="text-[9px] text-slate-500 font-medium truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // 7. POPULAR PICKS
        if (type === 'POPULAR_PICKS') {
          if (popularProducts.length === 0) return null;
          return (
            <div key={sec.id} className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide">
                  {sec.title || 'POPULAR PICKS'}
                </h4>
                <span className="text-[9px] font-extrabold text-[#C91C1C] cursor-pointer hover:underline" onClick={() => navigate('/shop')}>
                  View All
                </span>
              </div>
              <div className="space-y-2">
                {popularProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => navigate(`/product/${prod.id}`)}
                    className="flex items-center gap-2 border border-slate-100 rounded-lg p-1.5 hover:border-slate-300 transition-colors cursor-pointer group"
                  >
                    <div className="w-12 h-12 bg-slate-50 rounded-md overflow-hidden flex items-center justify-center shrink-0 p-0.5">
                      <img
                        src={resolveImageUrl(prod.imageUrl || prod.images?.[0])}
                        alt={prod.name}
                        onError={(e) => handleImageError(e, prod.id)}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-extrabold text-[10.5px] text-slate-900 leading-tight truncate group-hover:text-[#C91C1C]">
                        {prod.name}
                      </h5>
                      <span className="font-black text-[11px] text-[#C91C1C] block pt-0.5">
                        ₹{prod.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // 8. DEALS UNDER CARD
        if (type === 'DEALS_UNDER') {
          return (
            <div
              key={sec.id}
              onClick={() => handleAction(sec)}
              className="w-full rounded-xl border border-amber-200/90 shadow-2xs p-3 space-y-2 cursor-pointer hover:border-[#C91C1C] transition-all"
              style={{ backgroundColor: sec.backgroundColor || '#FFFBEB' }}
            >
              {sec.badgeText && (
                <span className="text-[8.5px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full inline-block">
                  {sec.badgeText}
                </span>
              )}
              <div>
                <h4 className="font-display font-black text-sm text-slate-900 uppercase tracking-tight">
                  {sec.title}
                </h4>
                <p className="text-[10px] text-slate-600 font-bold leading-tight mt-0.5">
                  {sec.subtitle || sec.description}
                </p>
              </div>
              <button
                type="button"
                className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[10px] uppercase tracking-wider py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer text-center"
              >
                {sec.buttonText || 'VIEW DEALS →'}
              </button>
            </div>
          );
        }

        // 9. CHECKLIST CARD
        if (type === 'CHECKLIST_CARD') {
          const list = Array.isArray(sec.config) ? sec.config : ['Quality materials', 'Verified shopping', 'Secure checkout', 'Easy returns'];
          return (
            <div
              key={sec.id}
              className="w-full rounded-xl border border-emerald-200/90 shadow-2xs p-3 space-y-2"
              style={{ backgroundColor: sec.backgroundColor || '#F0FDF4' }}
            >
              <h4 className="font-display font-black text-xs text-emerald-900 uppercase tracking-wide border-b border-emerald-200/60 pb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{sec.title || 'WHY KARVIYAM?'}</span>
              </h4>
              <div className="space-y-1">
                {list.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-950">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // 10. TRENDING STYLES
        if (type === 'TRENDING_STYLES') {
          if (trendingShortProducts.length === 0) return null;
          return (
            <div key={sec.id} className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
              <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1">
                <span>{sec.title || 'TRENDING STYLES 🔥'}</span>
              </h4>
              <div className="space-y-2">
                {trendingShortProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => navigate(`/product/${prod.id}`)}
                    className="flex items-center gap-2 border border-slate-100 rounded-lg p-1.5 hover:border-slate-300 transition-colors cursor-pointer group"
                  >
                    <div className="w-12 h-12 bg-slate-50 rounded-md overflow-hidden flex items-center justify-center shrink-0 p-0.5">
                      <img
                        src={resolveImageUrl(prod.imageUrl || prod.images?.[0])}
                        alt={prod.name}
                        onError={(e) => handleImageError(e, prod.id)}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-extrabold text-[10.5px] text-slate-900 leading-tight truncate group-hover:text-[#C91C1C]">
                        {prod.name}
                      </h5>
                      <span className="font-black text-[11px] text-[#C91C1C] block pt-0.5">
                        ₹{prod.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // 11. TOP COLLECTIONS
        if (type === 'TOP_COLLECTIONS') {
          const collections = Array.isArray(sec.config) ? sec.config : [
            { label: 'FESTIVE SILKS', subtitle: 'Handcrafted', link: '/shop?category=Sarees' },
            { label: 'MEN\'S KURTAS', subtitle: 'Royal Edition', link: '/shop?category=Kurtas' }
          ];
          return (
            <div key={sec.id} className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
              <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#C91C1C]" />
                <span>{sec.title || 'TOP COLLECTIONS'}</span>
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {collections.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate(item.link || '/shop')}
                    className="bg-slate-50 hover:bg-red-50 border border-slate-200/80 rounded-lg p-2 cursor-pointer transition-colors group"
                  >
                    <span className="font-black text-[9.5px] text-slate-900 group-hover:text-[#C91C1C] block truncate">
                      {item.label}
                    </span>
                    <span className="text-[8.5px] text-slate-500 font-bold block truncate">
                      {item.subtitle}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // 12. DEFAULT / CUSTOM CARD (GENERAL FALLBACK FOR ALL OTHER ADMIN SECTIONS)
        return (
          <div
            key={sec.id}
            onClick={() => handleAction(sec)}
            className="w-full rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2 cursor-pointer hover:border-[#C91C1C] transition-all group overflow-hidden"
            style={{ backgroundColor: sec.backgroundColor || '#FFFFFF' }}
          >
            {sec.badgeText && (
              <span className="text-[8.5px] font-black uppercase tracking-wider bg-red-100 text-[#C91C1C] px-2 py-0.5 rounded-full inline-block">
                {sec.badgeText}
              </span>
            )}
            {sec.imageUrl && (
              <div className="w-full h-28 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                <img
                  src={resolveImageUrl(sec.imageUrl)}
                  alt={sec.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={handleImageError}
                />
              </div>
            )}
            <div>
              <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-tight group-hover:text-[#C91C1C] transition-colors">
                {sec.title}
              </h4>
              {sec.subtitle && (
                <p className="text-[10px] text-slate-600 font-bold leading-tight mt-0.5">
                  {sec.subtitle}
                </p>
              )}
              {sec.description && (
                <p className="text-[9px] text-slate-500 font-medium leading-tight mt-1 line-clamp-2">
                  {sec.description}
                </p>
              )}
            </div>
            {sec.buttonText && (
              <button
                type="button"
                className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[10px] uppercase tracking-wider py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer text-center"
              >
                {sec.buttonText}
              </button>
            )}
          </div>
        );
      })}
    </aside>
  );
}
