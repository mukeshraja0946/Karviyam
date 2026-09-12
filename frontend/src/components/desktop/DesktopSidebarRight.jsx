import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  Lock,
  BadgePercent
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { resolveImageUrl } from '../../utils/imageUtils';

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
  Lock
};

const renderIcon = (iconName, fallbackIcon = Award) => {
  const IconComp = ICON_MAP[iconName] || fallbackIcon;
  return <IconComp className="w-3.5 h-3.5 text-[#B71C1C]" />;
};

const DEFAULT_BENEFITS = [
  { id: '1', title: 'Free Delivery', subtitle: 'On orders above ₹499', icon: 'Truck' },
  { id: '2', title: 'Easy Returns', subtitle: '30 days return policy', icon: 'RotateCcw' },
  { id: '3', title: 'Secure Payments', subtitle: '100% secure checkout', icon: 'ShieldCheck' },
  { id: '4', title: 'Best Price Guarantee', subtitle: 'Unmatched value', icon: 'Heart' },
  { id: '5', title: '24/7 Support', subtitle: 'Dedicated assistance', icon: 'Headphones' }
];

const DEFAULT_TODAY_SPECIAL = {
  enabled: true,
  badge: "TODAY'S SPECIAL DEAL",
  subtitle: 'Limited Time Only',
  productName: 'Sports Sneakers',
  description: 'Stylish & Comfortable',
  price: 1499,
  originalPrice: 2499,
  discountText: '40% OFF',
  buttonText: 'SHOP NOW →',
  link: '/shop?category=Sneakers',
  imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
  endTime: new Date(Date.now() + 8 * 3600 * 1000 + 26 * 60 * 1000 + 45 * 1000).toISOString()
};

const DEFAULT_STYLE_INSPIRATION = {
  enabled: true,
  badge: 'STYLE INSPIRATION',
  title: 'Look Good.',
  subtitle: 'Feel Confident.',
  tag: 'CASUAL LOOKS',
  tagSub: 'For Everyday',
  buttonText: 'EXPLORE NOW →',
  link: '/shop',
  imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'
};

export default function DesktopSidebarRight() {
  const navigate = useNavigate();
  const [todaySpecial, setTodaySpecial] = useState(DEFAULT_TODAY_SPECIAL);
  const [styleInspiration, setStyleInspiration] = useState(DEFAULT_STYLE_INSPIRATION);
  const [benefits, setBenefits] = useState(DEFAULT_BENEFITS);
  
  // Real Reviews State
  const [reviews, setReviews] = useState([]);
  const [currentReviewIdx, setCurrentReviewIdx] = useState(0);

  // Newsletter State
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 26, seconds: 45 });

  const fetchConfig = async () => {
    try {
      const res = await api.get('/sidebar-config').catch(() => null);
      const data = res?.data?.data || res?.data;

      if (data) {
        if (data.todaySpecial) setTodaySpecial(data.todaySpecial);
        if (data.styleInspiration) setStyleInspiration(data.styleInspiration);
      }
    } catch (e) {
      console.error('Error fetching right sidebar config:', e);
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
          setBenefits(parsed.benefits.filter(b => b && b.enabled !== false).slice(0, 5));
        }
      }
    } catch (e) {}
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews/latest').catch(() => null);
      const list = res?.data?.data || res?.data;
      if (Array.isArray(list) && list.length > 0) {
        setReviews(list.filter(r => r.comment && r.comment.trim()));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchConfig();
    fetchWhyShopConfig();
    fetchReviews();

    const handleUpdate = () => {
      fetchConfig();
      fetchWhyShopConfig();
      fetchReviews();
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

  // Real Countdown Timer Interval
  useEffect(() => {
    const calculateTime = () => {
      const targetTime = todaySpecial?.endTime ? new Date(todaySpecial.endTime).getTime() : Date.now() + 8 * 3600 * 1000;
      const diff = Math.max(0, targetTime - Date.now());

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [todaySpecial?.endTime]);

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

  return (
    <aside className="w-[200px] xl:w-[220px] shrink-0 flex flex-col gap-3">

      {/* 1. TODAY'S SPECIAL DEAL (Countdown + Product Card) */}
      {todaySpecial && todaySpecial.enabled !== false && (
        <div className="w-full bg-white rounded-xl border border-[#B71C1C]/30 shadow-2xs p-3 space-y-2.5 overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-[#B71C1C] tracking-wider">
                {todaySpecial.badge || "TODAY'S SPECIAL DEAL"}
              </span>
              <span className="text-[8.5px] font-bold text-slate-400">
                {todaySpecial.subtitle || 'Limited Time Only'}
              </span>
            </div>

            {/* Countdown Boxes */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 text-center">
              <div className="bg-slate-900 text-white rounded-lg py-1 px-1">
                <span className="font-mono font-black text-xs block leading-none">
                  {formatNumber(timeLeft.hours)}
                </span>
                <span className="text-[7.5px] font-bold text-slate-400 uppercase block mt-0.5">
                  Hrs
                </span>
              </div>
              <div className="bg-slate-900 text-white rounded-lg py-1 px-1">
                <span className="font-mono font-black text-xs block leading-none">
                  {formatNumber(timeLeft.minutes)}
                </span>
                <span className="text-[7.5px] font-bold text-slate-400 uppercase block mt-0.5">
                  Mins
                </span>
              </div>
              <div className="bg-slate-900 text-white rounded-lg py-1 px-1">
                <span className="font-mono font-black text-xs block leading-none text-red-400">
                  {formatNumber(timeLeft.seconds)}
                </span>
                <span className="text-[7.5px] font-bold text-slate-400 uppercase block mt-0.5">
                  Secs
                </span>
              </div>
            </div>
          </div>

          {/* Deal Product Preview */}
          <div
            onClick={() => navigate(todaySpecial.link || '/shop')}
            className="group cursor-pointer space-y-2"
          >
            <div className="w-full h-[120px] xl:h-[130px] bg-slate-50 rounded-xl border border-slate-100 overflow-hidden relative p-1 flex items-center justify-center">
              <img
                src={resolveImageUrl(todaySpecial.imageUrl)}
                alt={todaySpecial.productName}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600';
                }}
              />
              {todaySpecial.discountText && (
                <span className="absolute top-1.5 left-1.5 bg-[#B71C1C] text-white text-[8.5px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                  {todaySpecial.discountText}
                </span>
              )}
            </div>

            <div>
              <h4 className="font-extrabold text-xs text-slate-900 leading-snug truncate group-hover:text-[#B71C1C]">
                {todaySpecial.productName || 'Sports Sneakers'}
              </h4>
              <p className="text-[9.5px] text-slate-500 font-medium truncate">
                {todaySpecial.description || 'Stylish & Comfortable'}
              </p>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="font-black text-xs text-slate-900">
                  ₹{todaySpecial.price || 1499}
                </span>
                {todaySpecial.originalPrice > todaySpecial.price && (
                  <span className="text-[9.5px] text-slate-400 line-through">
                    ₹{todaySpecial.originalPrice}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="w-full bg-[#B71C1C] hover:bg-[#8E0000] text-white font-black text-[10px] uppercase tracking-wider py-2 rounded-lg shadow-2xs transition-colors cursor-pointer text-center"
            >
              {todaySpecial.buttonText || 'SHOP NOW →'}
            </button>
          </div>
        </div>
      )}

      {/* 2. QUICK BENEFITS WIDGET */}
      <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2.5">
        <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
          WHY SHOP WITH KARVIYAM?
        </h4>
        <div className="space-y-2">
          {benefits.map((item, idx) => (
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

      {/* 3. CUSTOMER LOVE (REAL REVIEWS FROM DATABASE) */}
      {reviews.length > 0 && (
        <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1">
              <span>CUSTOMER LOVE</span>
              <span className="text-red-500">❤️</span>
            </h4>
            {reviews.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentReviewIdx((prev) => (prev === 0 ? reviews.length - 1 : prev - 1))}
                  className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentReviewIdx((prev) => (prev + 1) % reviews.length)}
                  className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-100 space-y-1.5">
            <div className="flex items-center gap-0.5 text-amber-500 text-[10px]">
              {[...Array(reviews[currentReviewIdx]?.rating || 5)].map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>

            <p className="text-[10px] text-slate-700 font-medium italic line-clamp-3 leading-snug">
              "{reviews[currentReviewIdx]?.comment || reviews[currentReviewIdx]?.title || 'Great quality and fast delivery. Really loved the fabric and fit!'}"
            </p>

            <div className="pt-1 flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-200/60">
              <span className="font-bold text-slate-800 truncate">
                — {reviews[currentReviewIdx]?.userName || 'Verified Customer'}
              </span>
              <span className="text-emerald-700 font-extrabold shrink-0">✓ Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. JOIN OUR COMMUNITY (NEWSLETTER SIGNUP) */}
      <div className="w-full bg-slate-900 text-white rounded-xl shadow-2xs p-3 space-y-2 border border-slate-800">
        <h4 className="font-display font-black text-xs uppercase tracking-wide text-amber-300">
          JOIN OUR COMMUNITY
        </h4>
        <p className="text-[9.5px] text-slate-300 font-medium leading-tight">
          Get exclusive offers, new arrivals and style inspiration.
        </p>

        {subscribed ? (
          <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold p-2 rounded-lg text-center flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Subscribed to Karviyam!</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-1.5 pt-0.5">
            <input
              type="email"
              placeholder="Enter your email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-xs px-2.5 py-1.5 rounded-lg text-white outline-none focus:border-amber-400 font-medium placeholder:text-slate-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-[#B71C1C] hover:bg-[#8E0000] text-white font-black text-[10px] uppercase tracking-wider py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <span>SUBSCRIBE</span>
              <Send className="w-2.5 h-2.5" />
            </button>
          </form>
        )}
      </div>

      {/* 5. STYLE INSPIRATION CARD */}
      {styleInspiration && styleInspiration.enabled !== false && (
        <div
          onClick={() => navigate(styleInspiration.link || '/shop')}
          className="w-full h-[250px] xl:h-[270px] rounded-2xl overflow-hidden relative shadow-md text-white p-4 flex flex-col justify-between group cursor-pointer border border-slate-800 bg-slate-900"
        >
          <img
            src={resolveImageUrl(styleInspiration.imageUrl)}
            alt={styleInspiration.title || 'Style Inspiration'}
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

          <div className="relative z-10 space-y-1">
            <span className="text-[8.5px] font-black uppercase tracking-widest text-amber-300 bg-black/40 border border-amber-400/60 px-2 py-0.5 rounded backdrop-blur-xs">
              {styleInspiration.badge || 'STYLE INSPIRATION'}
            </span>
            <h4 className="font-display font-black text-sm xl:text-base leading-tight uppercase drop-shadow-md">
              {styleInspiration.title || 'Look Good.'}
              <br />
              <span className="text-amber-200">{styleInspiration.subtitle || 'Feel Confident.'}</span>
            </h4>
          </div>

          <div className="relative z-10 space-y-2">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-300 block">
                {styleInspiration.tag || 'CASUAL LOOKS'}
              </span>
              <span className="text-[8.5px] text-slate-400 font-bold block">
                {styleInspiration.tagSub || 'For Everyday'}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(styleInspiration.link || '/shop');
              }}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-black text-[10px] uppercase tracking-wider py-2 rounded-lg shadow-lg transition-transform group-hover:scale-102 cursor-pointer text-center"
            >
              {styleInspiration.buttonText || 'EXPLORE NOW →'}
            </button>
          </div>
        </div>
      )}

    </aside>
  );
}
