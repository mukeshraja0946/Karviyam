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
  couponCode: 'PREPAID10',
  discountPercent: '%',
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

const DEFAULT_SHOP_BY_PRICE = [
  { id: 'p1', label: 'Under ₹499', link: '/shop?maxPrice=499', enabled: true },
  { id: 'p2', label: 'Under ₹999', link: '/shop?maxPrice=999', enabled: true },
  { id: 'p3', label: 'Under ₹1499', link: '/shop?maxPrice=1499', enabled: true },
  { id: 'p4', label: 'Under ₹1999', link: '/shop?maxPrice=1999', enabled: true },
  { id: 'p5', label: 'Under ₹2999', link: '/shop?maxPrice=2999', enabled: true },
  { id: 'p6', label: 'Under ₹3999', link: '/shop?maxPrice=3999', enabled: true }
];

const DEFAULT_QUICK_CATEGORIES = [
  { id: 'qc1', name: 'T-Shirts', link: '/shop?category=T-Shirts', enabled: true },
  { id: 'qc2', name: 'Sneakers', link: '/shop?category=Sneakers', enabled: true },
  { id: 'qc3', name: 'Kurta Sets', link: '/shop?category=Kurta+Sets', enabled: true },
  { id: 'qc4', name: 'Men', link: '/shop?category=Men', enabled: true },
  { id: 'qc5', name: 'Women', link: '/shop?category=Women', enabled: true },
  { id: 'qc6', name: 'Kids', link: '/shop?category=Kids', enabled: true },
  { id: 'qc7', name: 'Accessories', link: '/shop?category=Accessories', enabled: true },
  { id: 'qc8', name: 'Jewellery', link: '/shop?category=Jewellery', enabled: true }
];

const DEFAULT_WHY_SHOP = [
  { id: '1', title: 'Free Delivery', subtitle: 'On orders above ₹499', icon: 'Truck' },
  { id: '2', title: 'Secure Payments', subtitle: '100% safe & secure', icon: 'ShieldCheck' },
  { id: '3', title: 'Easy Returns', subtitle: '30 days return policy', icon: 'RotateCcw' },
  { id: '4', title: 'Best Price Guarantee', subtitle: 'Unbeatable value', icon: 'Heart' },
  { id: '5', title: '24/7 Support', subtitle: 'Dedicated assistance', icon: 'Headphones' }
];

const DEFAULT_BRAND_TRUST = {
  enabled: true,
  title: 'WHY KARVIYAM?',
  subtitle: 'Trusted E-Commerce Experience',
  points: ['Quality Fashion', 'Trusted Shopping', 'Secure Checkout', 'Easy Returns']
};

const DEFAULT_FINAL_LEFT_PROMO = {
  enabled: true,
  badge: 'EXPLORE STYLES',
  title: 'SHOP MORE. SAVE MORE.',
  subtitle: 'Discover everyday fashion styles.',
  buttonText: 'EXPLORE NOW →',
  link: '/shop'
};

export default function DesktopSidebarLeft() {
  const navigate = useNavigate();
  const [navItems, setNavItems] = useState(DEFAULT_NAV_ITEMS);
  const [offerCard, setOfferCard] = useState(DEFAULT_OFFER_CARD);
  const [promoCard, setPromoCard] = useState(DEFAULT_PROMO_CARD);
  const [shopByPrice, setShopByPrice] = useState(DEFAULT_SHOP_BY_PRICE);
  const [quickCategories, setQuickCategories] = useState(DEFAULT_QUICK_CATEGORIES);
  const [whyShopItems, setWhyShopItems] = useState(DEFAULT_WHY_SHOP);
  const [popularProducts, setPopularProducts] = useState([]);
  const [trendingShortProducts, setTrendingShortProducts] = useState([]);
  const [brandTrust, setBrandTrust] = useState(DEFAULT_BRAND_TRUST);
  const [finalLeftPromo, setFinalLeftPromo] = useState(DEFAULT_FINAL_LEFT_PROMO);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/sidebar-config').catch(() => null);
      const data = res?.data?.data || res?.data;

      if (data) {
        if (Array.isArray(data.navItems) && data.navItems.length > 0) setNavItems(data.navItems.filter(i => i.enabled !== false));
        if (data.offerCard) setOfferCard(data.offerCard);
        if (data.promoCard) setPromoCard(data.promoCard);
        if (Array.isArray(data.shopByPrice) && data.shopByPrice.length > 0) setShopByPrice(data.shopByPrice.filter(p => p.enabled !== false));
        if (Array.isArray(data.quickCategories) && data.quickCategories.length > 0) setQuickCategories(data.quickCategories.filter(c => c.enabled !== false));
        if (data.brandTrust) setBrandTrust(data.brandTrust);
        if (data.finalLeftPromo) setFinalLeftPromo(data.finalLeftPromo);
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

  const fetchPopularProducts = async () => {
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
    fetchWhyShopConfig();
    fetchPopularProducts();

    const handleUpdate = () => {
      fetchConfig();
      fetchWhyShopConfig();
      fetchPopularProducts();
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

  return (
    <aside className="w-[190px] xl:w-[210px] shrink-0 flex flex-col gap-2.5">
      
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
      )}

      {/* 2. SMALL COUPON CARD */}
      {offerCard && offerCard.enabled !== false && (
        <div
          onClick={() => navigate(offerCard.link || '/shop?filter=offers')}
          className="w-full bg-[#FFF5F5] border border-red-200/90 rounded-xl p-3 flex flex-col gap-2 shadow-2xs overflow-hidden relative cursor-pointer hover:border-[#C91C1C] transition-colors group"
        >
          <div className="flex items-center justify-between min-w-0">
            <div>
              <span className="font-display font-black text-xs xl:text-sm text-[#C91C1C] uppercase tracking-wide group-hover:underline truncate block">
                {offerCard.heading || 'EXTRA 10% OFF'}
              </span>
              <span className="text-[9.5px] text-slate-600 font-bold block truncate">
                {offerCard.subtitle || 'On Prepaid Orders'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-red-100 text-[#C91C1C] flex items-center justify-center font-black text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              {offerCard.discountPercent || '%'}
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1 border-t border-red-200/60">
            <button
              type="button"
              onClick={(e) => handleCopyCode(e, offerCard.couponCode)}
              className="flex-1 bg-white hover:bg-slate-50 text-[#C91C1C] border border-red-200 font-black text-[9.5px] py-1 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'COPIED' : 'COPY CODE'}</span>
            </button>
            <button
              type="button"
              className="bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[9.5px] py-1 px-2 rounded-lg transition-colors cursor-pointer"
            >
              SHOP NOW
            </button>
          </div>
        </div>
      )}

      {/* 3. FESTIVE SPECIAL AD BANNER (LIGHT CREAM / RED) */}
      {promoCard && promoCard.enabled !== false && (
        <div
          onClick={() => navigate(promoCard.link || '/shop')}
          className="w-full bg-[#FFF5F0] border border-orange-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between gap-3 group cursor-pointer hover:border-[#C91C1C] transition-all"
        >
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-widest text-orange-900 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded">
              <Sparkles className="w-3 h-3 text-[#C91C1C]" /> {promoCard.badge || 'FESTIVE SPECIAL'}
            </span>
            <div>
              <span className="font-display font-black text-lg xl:text-xl text-[#C91C1C] block uppercase tracking-tight">
                {promoCard.title || 'UP TO 60% OFF'}
              </span>
              <span className="text-xs text-slate-700 font-bold block mt-0.5">
                {promoCard.subtitle || 'On Bestsellers'}
              </span>
            </div>
          </div>

          <div className="w-full h-[120px] rounded-xl overflow-hidden border border-orange-100 bg-white p-1 flex items-center justify-center">
            <img
              src={resolveImageUrl(promoCard.imageUrl)}
              alt={promoCard.title || 'Festive Ad'}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
              onError={handleImageError}
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(promoCard.link || '/shop');
            }}
            className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-xs uppercase tracking-wider py-2 rounded-xl shadow-xs transition-transform group-hover:scale-102 cursor-pointer text-center"
          >
            {promoCard.buttonText || 'SHOP NOW'}
          </button>
        </div>
      )}

      {/* 4. SHOP BY PRICE */}
      {shopByPrice.length > 0 && (
        <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
          <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5 text-[#C91C1C]" />
            <span>SHOP BY PRICE</span>
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {shopByPrice.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(p.link || '/shop')}
                className="bg-slate-50 hover:bg-red-50 hover:border-red-200 border border-slate-200/80 rounded-lg py-1.5 px-2 text-[10px] font-black text-slate-800 hover:text-[#C91C1C] transition-colors cursor-pointer text-center truncate"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. QUICK CATEGORY LINKS */}
      {quickCategories.length > 0 && (
        <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
          <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1">
            <Grid className="w-3.5 h-3.5 text-[#C91C1C]" />
            <span>QUICK CATEGORIES</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {quickCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate(c.link || '/shop')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[9.5px] py-1 px-2.5 rounded-full transition-colors cursor-pointer"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. WHY SHOP WITH KARVIYAM */}
      <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
        <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5">
          WHY SHOP WITH KARVIYAM?
        </h4>
        <div className="space-y-2">
          {whyShopItems.map((item, idx) => (
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

      {/* 7. MINI PRODUCT WIDGET (POPULAR PICKS) */}
      {popularProducts.length > 0 && (
        <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide">
              POPULAR PICKS
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
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-[10.5px] text-slate-900 leading-tight truncate group-hover:text-[#C91C1C]">
                    {prod.name}
                  </h5>
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className="font-black text-[11px] text-slate-900">₹{prod.price}</span>
                    <span className="text-[8.5px] font-bold text-amber-500 ml-auto">★ {prod.rating || 4.5}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. BUDGET DEALS UNDER ₹499 */}
      <div className="w-full bg-[#FFF9E8] border border-amber-300/60 rounded-xl p-3 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[8.5px] font-black uppercase text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
            BUDGET STORE
          </span>
          <Zap className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <div>
          <h4 className="font-display font-black text-xs text-slate-900 uppercase leading-tight">
            DEALS UNDER ₹499
          </h4>
          <p className="text-[9.5px] text-slate-600 font-medium pt-0.5">
            Unbeatable budget fashion picks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/shop?maxPrice=499')}
          className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[9.5px] uppercase tracking-wider py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer text-center"
        >
          GRAB DEALS →
        </button>
      </div>

      {/* 9. BRAND TRUST BADGES (LIGHT GREEN THEME) */}
      {brandTrust && brandTrust.enabled !== false && (
        <div className="w-full bg-[#EEF9F2] border border-emerald-200/90 rounded-xl shadow-2xs p-3 space-y-2 text-slate-900">
          <h4 className="font-display font-black text-xs uppercase tracking-wide text-emerald-900 border-b border-emerald-200/80 pb-1.5">
            {brandTrust.title || 'WHY KARVIYAM?'}
          </h4>
          <ul className="space-y-1 text-[9.5px] text-slate-700 font-medium">
            {(brandTrust.points || ['Quality Fashion', 'Trusted Shopping', 'Secure Checkout', 'Easy Returns']).map((pt, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="text-emerald-700 font-bold">✓</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 10. TRENDING SHORT PICKS */}
      {trendingShortProducts.length > 0 && (
        <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1">
              <span>TRENDING STYLES</span>
              <Flame className="w-3 h-3 text-[#C91C1C]" />
            </h4>
          </div>
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
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-[10.5px] text-slate-900 leading-tight truncate group-hover:text-[#C91C1C]">
                    {prod.name}
                  </h5>
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className="font-black text-[11px] text-[#C91C1C]">₹{prod.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 11. TOP COLLECTIONS SHOWCASE GRID */}
      <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
        <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center justify-between">
          <span>TOP COLLECTIONS</span>
          <Layers className="w-3.5 h-3.5 text-slate-400" />
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => navigate('/shop?category=T-Shirts')}
            className="text-left bg-slate-50 hover:bg-red-50 border border-slate-100 rounded-lg p-1.5 transition-colors cursor-pointer"
          >
            <span className="font-bold text-[10px] text-slate-800 block truncate">Oversized Tees</span>
            <span className="text-[8.5px] text-slate-500 block font-medium">From ₹499</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/shop?category=Kurta+Sets')}
            className="text-left bg-slate-50 hover:bg-red-50 border border-slate-100 rounded-lg p-1.5 transition-colors cursor-pointer"
          >
            <span className="font-bold text-[10px] text-slate-800 block truncate">Kurta Sets</span>
            <span className="text-[8.5px] text-slate-500 block font-medium">Up to 50%</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/shop?category=Sneakers')}
            className="text-left bg-slate-50 hover:bg-red-50 border border-slate-100 rounded-lg p-1.5 transition-colors cursor-pointer"
          >
            <span className="font-bold text-[10px] text-slate-800 block truncate">Casual Kicks</span>
            <span className="text-[8.5px] text-slate-500 block font-medium">Starting ₹999</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/shop?category=Jewellery')}
            className="text-left bg-slate-50 hover:bg-red-50 border border-slate-100 rounded-lg p-1.5 transition-colors cursor-pointer"
          >
            <span className="font-bold text-[10px] text-slate-800 block truncate">925 Silver</span>
            <span className="text-[8.5px] text-slate-500 block font-medium">New Store</span>
          </button>
        </div>
      </div>

      {/* 12. SEASONAL STYLE BANNER (LIGHT BLUE THEME) */}
      <div
        onClick={() => navigate('/shop')}
        className="w-full bg-[#EFF7FF] border border-blue-200/90 rounded-xl p-3.5 shadow-2xs space-y-2 text-slate-900 cursor-pointer group hover:border-[#C91C1C] transition-all"
      >
        <div className="space-y-1">
          <span className="text-[8px] font-black uppercase text-blue-900 bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded">
            SEASONAL DROP
          </span>
          <h4 className="font-display font-black text-xs uppercase leading-tight pt-1 text-slate-900">
            FRESH SUMMER LOOKS
          </h4>
          <p className="text-[9px] text-slate-600 font-medium leading-tight">
            Lightweight fabrics & modern relaxed fits.
          </p>
        </div>
        <button
          type="button"
          className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[9.5px] uppercase tracking-wider py-1.5 rounded-lg shadow-2xs transition-transform group-hover:scale-102 cursor-pointer text-center"
        >
          SHOP COLLECTION →
        </button>
      </div>

      {/* 13. KARVIYAM QUALITY ASSURED BADGE CARD */}
      <div className="w-full bg-[#EEF9F2] border border-emerald-200/90 rounded-xl p-3 space-y-1.5 shadow-2xs text-slate-900">
        <div className="flex items-center gap-1.5 text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <h4 className="font-display font-black text-xs uppercase tracking-wide">
            100% ORIGINAL
          </h4>
        </div>
        <p className="text-[9.5px] text-slate-600 font-medium leading-snug">
          Verified authentic fashion directly from top manufacturers.
        </p>
        <span className="inline-block text-[8.5px] font-black text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
          ✓ QUALITY ASSURED
        </span>
      </div>

      {/* 14. FINAL LEFT PROMOTION (LIGHT PEACH/ORANGE THEME) */}
      {finalLeftPromo && finalLeftPromo.enabled !== false && (
        <div
          onClick={() => navigate(finalLeftPromo.link || '/shop')}
          className="w-full bg-[#FFF4EC] border border-orange-200/90 rounded-xl p-3 space-y-1.5 cursor-pointer hover:border-[#C91C1C] transition-all group"
        >
          <span className="text-[8.5px] font-black uppercase text-[#C91C1C] tracking-wider block">
            {finalLeftPromo.badge || 'EXPLORE STYLES'}
          </span>
          <h4 className="font-display font-black text-xs leading-tight uppercase text-slate-900">
            {finalLeftPromo.title || 'SHOP MORE. SAVE MORE.'}
          </h4>
          <p className="text-[9.5px] text-slate-600 font-medium">
            {finalLeftPromo.subtitle || 'Discover everyday fashion styles.'}
          </p>
          <button
            type="button"
            className="w-full bg-[#C91C1C] hover:bg-[#A81515] text-white font-black text-[9.5px] uppercase tracking-wider py-1.5 rounded-lg shadow-2xs transition-colors mt-1"
          >
            {finalLeftPromo.buttonText || 'EXPLORE NOW →'}
          </button>
        </div>
      )}

    </aside>
  );
}
