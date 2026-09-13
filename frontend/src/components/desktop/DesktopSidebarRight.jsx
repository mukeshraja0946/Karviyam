import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  ShieldCheck,
  RotateCcw,
  Truck,
  Star,
  Heart,
  Headphones,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  Lock,
  BadgePercent,
  Flame,
  ArrowRight,
  Gift,
  Tag,
  Clock,
  Layers,
  Zap,
  ShoppingBag,
  HelpCircle,
  Lightbulb,
  Percent,
  Crown,
  Grid
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { resolveImageUrl, handleImageError } from '../../utils/imageUtils';

const ICON_MAP = {
  Award,
  ShieldCheck,
  RotateCcw,
  Truck,
  Star,
  Heart,
  Headphones,
  Sparkles,
  BadgePercent,
  Lock,
  Flame,
  Zap,
  Tag,
  Percent,
  Crown,
  Grid,
  Gift
};

export default function DesktopSidebarRight() {
  const navigate = useNavigate();
  const [rightSections, setRightSections] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [currentProductIdx, setCurrentProductIdx] = useState(0);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 26, seconds: 45 });

  const fetchConfig = async () => {
    try {
      const res = await api.get('/sidebar-config').catch(() => null);
      const data = res?.data?.data || res?.data;

      if (data && Array.isArray(data.rightSections) && data.rightSections.length > 0) {
        const sorted = [...data.rightSections]
          .filter(s => s && s.enabled !== false)
          .sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
        setRightSections(sorted);
      }
    } catch (e) {
      console.error('Error fetching right sidebar config:', e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products?limit=8').catch(() => null);
      const trendList = res?.data?.data?.products || res?.data?.products || res?.data;
      if (Array.isArray(trendList) && trendList.length > 0) {
        setTrendingProducts(trendList.slice(0, 8));
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

  // Countdown timer for Today's Deal
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 8, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      await api.post('/email-marketing/subscribe', { email: emailInput }).catch(() => null);
      setSubscribed(true);
      toast.success('Thank you for subscribing to Karviyam! 🎉');
      setEmailInput('');
    } catch (e) {
      toast.success('Subscribed successfully!');
      setSubscribed(true);
    }
  };

  const formatNumber = (num) => String(num).padStart(2, '0');

  const handleAction = (sec) => {
    const dest = sec.actionValue || sec.link || '/shop';
    if (sec.actionType === 'EXTERNAL_URL' && dest.startsWith('http')) {
      window.open(dest, '_blank');
    } else {
      navigate(dest);
    }
  };

  return (
    <aside className="w-[200px] xl:w-[220px] shrink-0 flex flex-col gap-3">
      {rightSections.map((sec) => {
        const type = sec.sectionType;

        // 1. TODAY'S SPECIAL DEAL
        if (type === 'TODAYS_DEAL') {
          const productName = sec.config?.productName || 'Sports Sneakers';
          const price = sec.config?.price || 1499;
          const originalPrice = sec.config?.originalPrice || 2499;
          const discountText = sec.config?.discountText || '40% OFF';
          return (
            <div
              key={sec.id}
              className="w-full rounded-xl border border-red-200/90 shadow-2xs p-3 space-y-2.5 overflow-hidden"
              style={{ backgroundColor: sec.backgroundColor || '#FFF5F5' }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-[#C91C1C] tracking-wider">
                    {sec.badgeText || sec.title || "TODAY'S SPECIAL DEAL"}
                  </span>
                  <span className="text-[8.5px] font-bold text-slate-500">
                    {sec.subtitle || 'Limited Time Only'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2 text-center">
                  <div className="bg-white text-slate-900 border border-red-200 rounded-lg py-1 px-1 shadow-2xs">
                    <span className="font-mono font-black text-xs block leading-none text-[#C91C1C]">
                      {formatNumber(timeLeft.hours)}
                    </span>
                    <span className="text-[7.5px] font-bold text-slate-500 uppercase block mt-0.5">
                      Hrs
                    </span>
                  </div>
                  <div className="bg-white text-slate-900 border border-red-200 rounded-lg py-1 px-1 shadow-2xs">
                    <span className="font-mono font-black text-xs block leading-none text-[#C91C1C]">
                      {formatNumber(timeLeft.minutes)}
                    </span>
                    <span className="text-[7.5px] font-bold text-slate-500 uppercase block mt-0.5">
                      Mins
                    </span>
                  </div>
                  <div className="bg-white text-slate-900 border border-red-200 rounded-lg py-1 px-1 shadow-2xs">
                    <span className="font-mono font-black text-xs block leading-none text-[#C91C1C]">
                      {formatNumber(timeLeft.seconds)}
                    </span>
                    <span className="text-[7.5px] font-bold text-slate-500 uppercase block mt-0.5">
                      Secs
                    </span>
                  </div>
                </div>
              </div>

              <div onClick={() => handleAction(sec)} className="group cursor-pointer space-y-2">
                {sec.imageUrl && (
                  <div className="w-full h-[120px] xl:h-[130px] bg-white rounded-xl border border-slate-200/80 overflow-hidden relative p-1 flex items-center justify-center">
                    <img
                      src={resolveImageUrl(sec.imageUrl)}
                      alt={productName}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                      onError={handleImageError}
                    />
                    {discountText && (
                      <span className="absolute top-1.5 left-1.5 bg-[#C91C1C] text-white text-[8.5px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                        {discountText}
                      </span>
                    )}
                  </div>
                )}

                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 leading-snug truncate group-hover:text-[#C91C1C]">
                    {productName}
                  </h4>
                  <p className="text-[9.5px] text-slate-500 font-medium truncate">
                    {sec.description || sec.subtitle}
                  </p>
                  <div className="flex items-baseline gap-1.5 pt-1">
                    <span className="font-black text-xs text-slate-900">₹{price}</span>
                    {originalPrice > price && (
                      <span className="text-[9.5px] text-slate-400 line-through">₹{originalPrice}</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[10px] uppercase tracking-wider py-2 rounded-lg shadow-2xs transition-colors cursor-pointer text-center"
                >
                  {sec.buttonText || 'SHOP NOW →'}
                </button>
              </div>
            </div>
          );
        }

        // 2. QUICK DEALS
        if (type === 'QUICK_DEALS') {
          const deals = Array.isArray(sec.config) ? sec.config.filter(d => d.enabled !== false) : [];
          if (deals.length === 0) return null;
          return (
            <div key={sec.id} className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1">
                  <span>{sec.title || 'QUICK DEALS'}</span>
                  <span className="text-amber-500">⚡</span>
                </h4>
              </div>
              <div className="space-y-1.5">
                {deals.map((deal, idx) => (
                  <div
                    key={deal.id || idx}
                    onClick={() => navigate(deal.link || '/shop')}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 hover:bg-red-50/70 border border-slate-100 hover:border-red-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs shrink-0">{deal.icon || '🔥'}</span>
                      <span className="font-bold text-[11px] text-slate-800 group-hover:text-[#C91C1C] truncate">
                        {deal.title}
                      </span>
                    </div>
                    <span className="text-[9px] font-black text-[#C91C1C] bg-red-100/80 px-1.5 py-0.5 rounded shrink-0">
                      {deal.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // 3. POPULAR PICKS CAROUSEL
        if (type === 'POPULAR_PICKS') {
          if (trendingProducts.length === 0) return null;
          return (
            <div key={sec.id} className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1">
                  <span>{sec.title || 'POPULAR PICKS'}</span>
                  <span className="text-[#C91C1C]">🔥</span>
                </h4>
                {trendingProducts.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentProductIdx((prev) => (prev === 0 ? trendingProducts.length - 1 : prev - 1))}
                      className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentProductIdx((prev) => (prev + 1) % trendingProducts.length)}
                      className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {(() => {
                const p = trendingProducts[currentProductIdx];
                if (!p) return null;
                const img = resolveImageUrl(p.image_url || p.imageUrl || p.images?.[0]);
                return (
                  <div
                    onClick={() => navigate(`/product/${p.id || p.slug}`)}
                    className="group cursor-pointer space-y-1.5"
                  >
                    <div className="w-full h-[120px] bg-slate-50 rounded-lg border border-slate-100 overflow-hidden p-1 flex items-center justify-center relative">
                      <img
                        src={img}
                        alt={p.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        onError={handleImageError}
                      />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-[11px] text-slate-900 truncate group-hover:text-[#C91C1C]">
                        {p.name}
                      </h5>
                      <span className="font-black text-xs text-[#C91C1C]">
                        ₹{p.price}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        }

        // 4. COUPON SAVINGS CARD
        if (type === 'COUPON_SAVINGS') {
          return (
            <div
              key={sec.id}
              onClick={() => handleAction(sec)}
              className="w-full border border-amber-300/90 text-slate-900 rounded-xl shadow-2xs p-3 space-y-1.5 cursor-pointer hover:border-[#C91C1C] transition-all relative overflow-hidden group"
              style={{ backgroundColor: sec.backgroundColor || '#FFF9E8' }}
            >
              {sec.badgeText && (
                <span className="text-[8.5px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded inline-block">
                  {sec.badgeText}
                </span>
              )}
              <h4 className="font-display font-black text-xs uppercase tracking-wide group-hover:text-[#C91C1C]">
                {sec.title}
              </h4>
              <p className="text-[9.5px] font-semibold text-slate-600 leading-tight">
                {sec.subtitle || sec.description}
              </p>
              <button
                type="button"
                className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[10px] uppercase tracking-wider py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer text-center mt-1"
              >
                {sec.buttonText || 'VIEW OFFERS →'}
              </button>
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
                <span>{sec.title || 'SHOP BY CATEGORY'}</span>
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {cats.map((c, idx) => (
                  <button
                    key={c.id || idx}
                    type="button"
                    onClick={() => navigate(c.link || '/shop')}
                    className="bg-slate-50 hover:bg-red-50 hover:border-red-200 border border-slate-200/80 rounded-lg py-1.5 px-2 text-[10px] font-bold text-slate-800 hover:text-[#C91C1C] transition-colors cursor-pointer text-center truncate"
                  >
                    {c.name || c.label}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        // 6. STYLE INSPIRATION (IMAGE CARD)
        if (type === 'STYLE_INSPIRATION') {
          return (
            <div
              key={sec.id}
              onClick={() => handleAction(sec)}
              className="w-full border border-amber-200/90 rounded-xl shadow-2xs p-3 space-y-2 cursor-pointer hover:border-[#C91C1C] transition-all group overflow-hidden"
              style={{ backgroundColor: sec.backgroundColor || '#FFFBEB' }}
            >
              {sec.badgeText && (
                <span className="text-[8.5px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full inline-block">
                  {sec.badgeText}
                </span>
              )}
              <div>
                <h4 className="font-display font-black text-sm text-slate-900 uppercase tracking-tight group-hover:text-[#C91C1C]">
                  {sec.title}
                </h4>
                {sec.subtitle && (
                  <p className="text-[10px] text-slate-600 font-bold leading-tight">
                    {sec.subtitle}
                  </p>
                )}
              </div>

              {sec.imageUrl && (
                <div className="w-full h-[120px] bg-white rounded-lg border border-amber-200/60 overflow-hidden relative p-1 flex items-center justify-center">
                  <img
                    src={resolveImageUrl(sec.imageUrl)}
                    alt={sec.title}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    onError={handleImageError}
                  />
                </div>
              )}

              <button
                type="button"
                className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[10px] uppercase tracking-wider py-2 rounded-lg shadow-2xs transition-colors cursor-pointer text-center"
              >
                {sec.buttonText || 'EXPLORE NOW →'}
              </button>
            </div>
          );
        }

        // 7. COMMUNITY JOIN (NEWSLETTER)
        if (type === 'COMMUNITY_JOIN') {
          return (
            <div
              key={sec.id}
              className="w-full border border-red-200/90 rounded-xl shadow-2xs p-3 space-y-2 overflow-hidden"
              style={{ backgroundColor: sec.backgroundColor || '#FFF5F5' }}
            >
              <h4 className="font-display font-black text-xs uppercase tracking-wide text-[#C91C1C]">
                {sec.title || 'JOIN OUR COMMUNITY'}
              </h4>
              <p className="text-[9.5px] font-semibold text-slate-600 leading-tight">
                {sec.subtitle || 'Get exclusive offers, new arrivals and style inspiration.'}
              </p>

              {subscribed ? (
                <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-lg text-center text-emerald-800 text-[10px] font-bold">
                  ✓ Subscribed successfully!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-1.5">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#C91C1C]"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[10px] uppercase tracking-wider py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer text-center"
                  >
                    {sec.buttonText || 'SUBSCRIBE 🚀'}
                  </button>
                </form>
              )}
            </div>
          );
        }

        // 8. DEFAULT / CUSTOM CARD (FALLBACK FOR ALL OTHER SECTIONS)
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
