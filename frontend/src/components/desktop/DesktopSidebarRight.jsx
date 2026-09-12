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
  Sparkle,
  Percent
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
  Percent
};

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

const DEFAULT_QUICK_DEALS = [
  { id: 'qd1', icon: '🔥', title: 'Sneakers', tag: 'Up to 50% OFF', link: '/shop?category=Sneakers', enabled: true },
  { id: 'qd2', icon: '👕', title: 'T-Shirts', tag: 'From ₹499', link: '/shop?category=T-Shirts', enabled: true },
  { id: 'qd3', icon: '👗', title: "Women's Wear", tag: 'Up to 60% OFF', link: '/shop?category=Women', enabled: true },
  { id: 'qd4', icon: '🎒', title: 'Bags & Accessories', tag: 'Starting ₹399', link: '/shop?category=Accessories', enabled: true }
];

const DEFAULT_COUPON_SAVINGS = {
  enabled: true,
  badge: 'EXTRA SAVINGS',
  title: 'UNLOCK EXTRA SAVINGS',
  subtitle: 'Use available coupons and promo codes at checkout.',
  buttonText: 'VIEW OFFERS →',
  link: '/shop?filter=offers'
};

const DEFAULT_SHOP_BY_CATEGORY_RIGHT = [
  { id: 'rc1', name: 'Men', link: '/shop?category=Men', enabled: true },
  { id: 'rc2', name: 'Women', link: '/shop?category=Women', enabled: true },
  { id: 'rc3', name: 'Kids', link: '/shop?category=Kids', enabled: true },
  { id: 'rc4', name: 'Sneakers', link: '/shop?category=Sneakers', enabled: true },
  { id: 'rc5', name: 'Jewellery', link: '/shop?category=Jewellery', enabled: true },
  { id: 'rc6', name: 'Accessories', link: '/shop?category=Accessories', enabled: true },
  { id: 'rc7', name: 'Kitchen & Home', link: '/shop?category=Kitchen', enabled: true },
  { id: 'rc8', name: 'School & Office', link: '/shop?category=School', enabled: true }
];

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

const DEFAULT_FINAL_RIGHT_PROMO = {
  enabled: true,
  badge: 'NEW COLLECTION',
  title: 'DISCOVER YOUR STYLE',
  subtitle: 'New drops. Fresh looks. Better prices.',
  buttonText: 'SHOP NOW →',
  link: '/shop'
};

export default function DesktopSidebarRight() {
  const navigate = useNavigate();
  const [todaySpecial, setTodaySpecial] = useState(DEFAULT_TODAY_SPECIAL);
  const [quickDeals, setQuickDeals] = useState(DEFAULT_QUICK_DEALS);
  const [couponSavings, setCouponSavings] = useState(DEFAULT_COUPON_SAVINGS);
  const [categoryRight, setCategoryRight] = useState(DEFAULT_SHOP_BY_CATEGORY_RIGHT);
  const [styleInspiration, setStyleInspiration] = useState(DEFAULT_STYLE_INSPIRATION);
  const [finalRightPromo, setFinalRightPromo] = useState(DEFAULT_FINAL_RIGHT_PROMO);
  
  // Dynamic Product Datasets
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [currentProductIdx, setCurrentProductIdx] = useState(0);

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
        if (Array.isArray(data.quickDeals) && data.quickDeals.length > 0) setQuickDeals(data.quickDeals);
        if (data.couponSavings) setCouponSavings(data.couponSavings);
        if (Array.isArray(data.shopByCategoryRight) && data.shopByCategoryRight.length > 0) setCategoryRight(data.shopByCategoryRight);
        if (data.styleInspiration) setStyleInspiration(data.styleInspiration);
        if (data.finalRightPromo) setFinalRightPromo(data.finalRightPromo);
      }
    } catch (e) {
      console.error('Error fetching right sidebar config:', e);
    }
  };

  const fetchProducts = async () => {
    try {
      const [trendRes, newRes] = await Promise.all([
        api.get('/products?limit=8').catch(() => null),
        api.get('/products/new-arrivals').catch(() => null)
      ]);

      const trendList = trendRes?.data?.data?.products || trendRes?.data?.products || trendRes?.data;
      if (Array.isArray(trendList) && trendList.length > 0) {
        setTrendingProducts(trendList.slice(0, 8));
      }

      const newList = newRes?.data?.data || newRes?.data;
      if (Array.isArray(newList) && newList.length > 0) {
        setNewArrivals(newList.slice(0, 2));
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
    fetchProducts();
    fetchReviews();

    const handleUpdate = () => {
      fetchConfig();
      fetchProducts();
      fetchReviews();
    };

    window.addEventListener('karviyam_sidebar_config_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('karviyam_sidebar_config_updated', handleUpdate);
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

  const activeQuickDeals = quickDeals.filter(d => d.enabled !== false);
  const activeCategories = categoryRight.filter(c => c.enabled !== false);

  return (
    <aside className="w-[200px] xl:w-[220px] shrink-0 flex flex-col gap-3">

      {/* 1. TODAY'S SPECIAL DEAL (LIGHT SOFT RED CARD + WHITE TIMER BOXES) */}
      {todaySpecial && todaySpecial.enabled !== false && (
        <div className="w-full bg-[#FFF5F5] rounded-xl border border-red-200/90 shadow-2xs p-3 space-y-2.5 overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-[#C91C1C] tracking-wider">
                {todaySpecial.badge || "TODAY'S SPECIAL DEAL"}
              </span>
              <span className="text-[8.5px] font-bold text-slate-500">
                {todaySpecial.subtitle || 'Limited Time Only'}
              </span>
            </div>

            {/* Countdown Boxes (LIGHT THEME) */}
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

          {/* Deal Product Preview */}
          <div
            onClick={() => navigate(todaySpecial.link || '/shop')}
            className="group cursor-pointer space-y-2"
          >
            <div className="w-full h-[120px] xl:h-[130px] bg-white rounded-xl border border-slate-200/80 overflow-hidden relative p-1 flex items-center justify-center">
              <img
                src={resolveImageUrl(todaySpecial.imageUrl)}
                alt={todaySpecial.productName}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                onError={handleImageError}
              />
              {todaySpecial.discountText && (
                <span className="absolute top-1.5 left-1.5 bg-[#C91C1C] text-white text-[8.5px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                  {todaySpecial.discountText}
                </span>
              )}
            </div>

            <div>
              <h4 className="font-extrabold text-xs text-slate-900 leading-snug truncate group-hover:text-[#C91C1C]">
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
              className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[10px] uppercase tracking-wider py-2 rounded-lg shadow-2xs transition-colors cursor-pointer text-center"
            >
              {todaySpecial.buttonText || 'SHOP NOW →'}
            </button>
          </div>
        </div>
      )}

      {/* 2. QUICK DEALS LIST */}
      {activeQuickDeals.length > 0 && (
        <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1">
              <span>QUICK DEALS</span>
              <span className="text-amber-500">⚡</span>
            </h4>
          </div>
          <div className="space-y-1.5">
            {activeQuickDeals.map((deal) => (
              <div
                key={deal.id}
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
      )}

      {/* 3. MINI PRODUCT CAROUSEL / TRENDING PRODUCTS */}
      {trendingProducts.length > 0 && (
        <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1">
              <span>POPULAR PICKS</span>
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
                  {p.discount && (
                    <span className="absolute top-1 left-1 bg-amber-500 text-white text-[8px] font-black px-1 py-0.5 rounded">
                      {p.discount}% OFF
                    </span>
                  )}
                </div>
                <div>
                  <h5 className="font-extrabold text-[11px] text-slate-900 truncate group-hover:text-[#C91C1C]">
                    {p.name}
                  </h5>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="font-black text-xs text-[#C91C1C]">
                      ₹{p.sale_price || p.price}
                    </span>
                    {p.regular_price > (p.sale_price || p.price) && (
                      <span className="text-[9.5px] text-slate-400 line-through">
                        ₹{p.regular_price}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 4. COUPON / SAVINGS CARD (LIGHT YELLOW THEME) */}
      {couponSavings && couponSavings.enabled !== false && (
        <div
          onClick={() => navigate(couponSavings.link || '/shop?filter=offers')}
          className="w-full bg-[#FFF9E8] border border-amber-300/90 text-slate-900 rounded-xl shadow-2xs p-3 space-y-1.5 cursor-pointer hover:border-[#C91C1C] transition-all relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
              {couponSavings.badge || 'EXTRA SAVINGS'}
            </span>
            <BadgePercent className="w-4 h-4 text-amber-700" />
          </div>
          <h4 className="font-display font-black text-xs uppercase leading-tight pt-1 text-slate-900">
            {couponSavings.title || 'UNLOCK EXTRA SAVINGS'}
          </h4>
          <p className="text-[9.5px] text-slate-600 font-medium leading-snug">
            {couponSavings.subtitle || 'Use available coupons and promo codes at checkout.'}
          </p>
          <button
            type="button"
            className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[9.5px] uppercase tracking-wider py-1.5 rounded-lg shadow-2xs transition-colors text-center"
          >
            {couponSavings.buttonText || 'VIEW OFFERS →'}
          </button>
        </div>
      )}

      {/* 5. SHOP BY CATEGORY RIGHT */}
      {activeCategories.length > 0 && (
        <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
          <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center justify-between">
            <span>SHOP BY CATEGORY</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate(cat.link || `/shop?category=${encodeURIComponent(cat.name)}`)}
                className="w-full text-left bg-slate-50 hover:bg-red-50 hover:border-red-200 border border-slate-100 rounded-lg p-1.5 transition-colors cursor-pointer group"
              >
                <span className="font-bold text-[10px] text-slate-700 group-hover:text-[#C91C1C] block truncate">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. CUSTOMER LOVE (REAL REVIEWS FROM DATABASE) */}
      {reviews.length > 0 && (
        <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1">
              <span>CUSTOMER LOVE</span>
              <span className="text-[#C91C1C]">❤️</span>
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

      {/* 7. STYLE INSPIRATION CARD (LIGHT CREAM THEME) */}
      {styleInspiration && styleInspiration.enabled !== false && (
        <div
          onClick={() => navigate(styleInspiration.link || '/shop')}
          className="w-full bg-[#FFF9F0] border border-amber-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between gap-3 group cursor-pointer hover:border-[#C91C1C] transition-all text-slate-900"
        >
          <div className="space-y-1.5">
            <span className="text-[8.5px] font-black uppercase tracking-widest text-amber-900 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded">
              {styleInspiration.badge || 'STYLE INSPIRATION'}
            </span>
            <h4 className="font-display font-black text-sm xl:text-base leading-tight uppercase pt-1 text-slate-900">
              {styleInspiration.title || 'Look Good.'}
              <br />
              <span className="text-[#C91C1C]">{styleInspiration.subtitle || 'Feel Confident.'}</span>
            </h4>
          </div>

          <div className="w-full h-[120px] bg-white rounded-xl border border-amber-100 p-1 flex items-center justify-center overflow-hidden">
            <img
              src={resolveImageUrl(styleInspiration.imageUrl)}
              alt={styleInspiration.title || 'Style Inspiration'}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
              onError={handleImageError}
            />
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-700 block">
                {styleInspiration.tag || 'CASUAL LOOKS'}
              </span>
              <span className="text-[8.5px] text-slate-500 font-bold block">
                {styleInspiration.tagSub || 'For Everyday'}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(styleInspiration.link || '/shop');
              }}
              className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[10px] uppercase tracking-wider py-2 rounded-xl shadow-xs transition-transform group-hover:scale-102 cursor-pointer text-center"
            >
              {styleInspiration.buttonText || 'EXPLORE NOW →'}
            </button>
          </div>
        </div>
      )}

      {/* 8. JOIN OUR COMMUNITY (LIGHT PINK NEWSLETTER SIGNUP) */}
      <div className="w-full bg-[#FFF1F2] border border-red-200/90 text-slate-900 rounded-xl shadow-2xs p-3 space-y-2">
        <h4 className="font-display font-black text-xs uppercase tracking-wide text-[#C91C1C]">
          JOIN OUR COMMUNITY
        </h4>
        <p className="text-[9.5px] text-slate-600 font-medium leading-tight">
          Get exclusive offers, new arrivals and style inspiration.
        </p>

        {subscribed ? (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold p-2 rounded-lg text-center flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Subscribed to Karviyam!</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-1.5 pt-0.5">
            <input
              type="email"
              placeholder="Enter your email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full bg-white border border-red-200 text-xs px-2.5 py-1.5 rounded-lg text-slate-900 outline-none focus:border-[#C91C1C] font-medium placeholder:text-slate-400"
              required
            />
            <button
              type="submit"
              className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[10px] uppercase tracking-wider py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <span>SUBSCRIBE</span>
              <Send className="w-2.5 h-2.5" />
            </button>
          </form>
        )}
      </div>

      {/* 9. NEW ARRIVALS MINI SHOWCASE */}
      {newArrivals.length > 0 && (
        <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1">
              <span>NEW ARRIVALS</span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </h4>
          </div>
          <div className="space-y-2">
            {newArrivals.map((prod) => (
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
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-[10.5px] text-slate-900 leading-tight truncate group-hover:text-[#C91C1C]">
                    {prod.name}
                  </h5>
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className="font-black text-[11px] text-slate-900">₹{prod.price}</span>
                    <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-1 rounded ml-auto">NEW</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. EXCLUSIVE OFFER / INSTANT DISCOUNT (LIGHT SOFT RED THEME) */}
      <div className="w-full bg-[#FFF5F5] border border-red-200/90 text-slate-900 rounded-xl p-3 space-y-1.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[8.5px] font-black uppercase text-[#C91C1C] bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
            INSTANT DISCOUNT
          </span>
          <Percent className="w-3.5 h-3.5 text-[#C91C1C]" />
        </div>
        <h4 className="font-display font-black text-xs uppercase leading-tight pt-1 text-slate-900">
          5% OFF ON UPI PAYMENTS
        </h4>
        <p className="text-[9.5px] text-slate-600 font-medium">
          Instant automatic discount applied at checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[9.5px] uppercase tracking-wider py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer text-center"
        >
          APPLY AT CHECKOUT →
        </button>
      </div>

      {/* 11. LOW BUDGET PICKS STORE */}
      <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
        <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center justify-between">
          <span>BUDGET SHOPPING</span>
          <Zap className="w-3.5 h-3.5 text-amber-500" />
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => navigate('/shop?maxPrice=299')}
            className="text-left bg-slate-50 hover:bg-red-50 border border-slate-100 rounded-lg p-1.5 transition-colors cursor-pointer"
          >
            <span className="font-bold text-[10px] text-slate-800 block truncate">Under ₹299</span>
            <span className="text-[8.5px] text-slate-500 block font-medium">Super Value</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/shop?maxPrice=499')}
            className="text-left bg-slate-50 hover:bg-red-50 border border-slate-100 rounded-lg p-1.5 transition-colors cursor-pointer"
          >
            <span className="font-bold text-[10px] text-slate-800 block truncate">Under ₹499</span>
            <span className="text-[8.5px] text-slate-500 block font-medium">Best Deals</span>
          </button>
        </div>
      </div>

      {/* 12. FASHION TIP & STYLE GUIDE CARD (LIGHT YELLOW THEME) */}
      <div className="w-full bg-[#FFF9E8] border border-amber-300/80 text-slate-900 rounded-xl shadow-2xs p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-amber-900">
          <Lightbulb className="w-4 h-4 text-amber-600" />
          <h4 className="font-display font-black text-xs uppercase tracking-wide">
            FASHION STYLE TIP
          </h4>
        </div>
        <p className="text-[9.5px] text-slate-700 font-medium leading-snug italic">
          "Pair oversized printed tees with chunky white sneakers for an effortless casual look."
        </p>
        <span className="block text-[8px] font-bold text-slate-500 uppercase pt-0.5">
          — KARVIYAM STYLE TEAM
        </span>
      </div>

      {/* 13. CUSTOMER SUPPORT & ASSISTANCE CARD */}
      <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-[#C91C1C]">
          <Headphones className="w-4 h-4" />
          <h4 className="font-display font-black text-xs uppercase tracking-wide text-slate-900">
            NEED ASSISTANCE?
          </h4>
        </div>
        <p className="text-[9.5px] text-slate-500 font-medium leading-tight">
          24/7 Live order tracking & dedicated support.
        </p>
        <button
          type="button"
          onClick={() => navigate('/contact')}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-[9.5px] uppercase tracking-wider py-1.5 rounded-lg transition-colors cursor-pointer text-center"
        >
          CONTACT SUPPORT →
        </button>
      </div>

      {/* 14. PREMIUM STORE SHOWCASE (LIGHT BLUE THEME) */}
      <div className="w-full bg-[#EFF7FF] border border-blue-200/90 text-slate-900 rounded-xl p-3 space-y-1.5 shadow-2xs">
        <span className="text-[8px] font-black uppercase text-blue-900 bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded">
          PREMIUM STORE
        </span>
        <h4 className="font-display font-black text-xs uppercase leading-tight text-slate-900">
          925 SILVER JEWELLERY
        </h4>
        <p className="text-[9.5px] text-slate-600 font-medium">
          Handcrafted hallmark silver rings & pendants.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop?category=Jewellery')}
          className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[9.5px] uppercase tracking-wider py-1.5 rounded-lg shadow-2xs transition-colors mt-0.5 cursor-pointer text-center"
        >
          VISIT STORE →
        </button>
      </div>

      {/* 15. FINAL RIGHT PROMOTION (LIGHT PEACH THEME) */}
      {finalRightPromo && finalRightPromo.enabled !== false && (
        <div
          onClick={() => navigate(finalRightPromo.link || '/shop')}
          className="w-full bg-[#FFF4EC] border border-orange-200/90 text-slate-900 rounded-xl shadow-2xs p-3.5 space-y-2 cursor-pointer hover:border-[#C91C1C] transition-all group overflow-hidden"
        >
          <span className="text-[8.5px] font-black uppercase tracking-wider text-orange-900 bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded">
            {finalRightPromo.badge || 'NEW COLLECTION'}
          </span>
          <h4 className="font-display font-black text-xs uppercase leading-tight pt-1 text-slate-900">
            {finalRightPromo.title || 'DISCOVER YOUR STYLE'}
          </h4>
          <p className="text-[9.5px] text-slate-600 font-medium leading-snug">
            {finalRightPromo.subtitle || 'New drops. Fresh looks. Better prices.'}
          </p>
          <button
            type="button"
            className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[10px] uppercase tracking-wider py-1.5 rounded-lg shadow-2xs transition-transform group-hover:scale-102 cursor-pointer text-center"
          >
            {finalRightPromo.buttonText || 'SHOP NOW →'}
          </button>
        </div>
      )}

    </aside>
  );
}
