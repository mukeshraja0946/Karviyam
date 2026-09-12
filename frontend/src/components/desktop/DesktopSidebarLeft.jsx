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
  Grid
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
  badge: '✨ FESTIVE SPECIAL',
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

const DEFAULT_APP_CARD = {
  enabled: true,
  title: 'DOWNLOAD KARVIYAM APP',
  subtitle: 'Shop Anytime, Anywhere',
  playStoreUrl: 'https://play.google.com',
  appStoreUrl: 'https://apple.com'
};

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
  const [appCard, setAppCard] = useState(DEFAULT_APP_CARD);
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
        if (data.appCard) setAppCard(data.appCard);
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
      const res = await api.get('/products?size=2').catch(() => null);
      const dataObj = res?.data?.data || res?.data;
      const list = Array.isArray(dataObj?.content) ? dataObj.content : (Array.isArray(dataObj) ? dataObj : []);
      if (list && list.length > 0) {
        setPopularProducts(list.slice(0, 2));
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
    return <IconComp className="w-3.5 h-3.5" />;
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

      {/* 2. SMALL COUPON CARD */}
      {offerCard && offerCard.enabled !== false && (
        <div
          onClick={() => navigate(offerCard.link || '/shop?filter=offers')}
          className="w-full bg-[#FFF5F5] border border-red-200/90 rounded-xl p-3 flex flex-col gap-2 shadow-2xs overflow-hidden relative cursor-pointer hover:border-[#B71C1C] transition-colors group"
        >
          <div className="flex items-center justify-between min-w-0">
            <div>
              <span className="font-display font-black text-xs xl:text-sm text-[#B71C1C] uppercase tracking-wide group-hover:underline truncate block">
                {offerCard.heading || 'EXTRA 10% OFF'}
              </span>
              <span className="text-[9.5px] text-slate-600 font-bold block truncate">
                {offerCard.subtitle || 'On Prepaid Orders'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-red-100 text-[#B71C1C] flex items-center justify-center font-black text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              {offerCard.discountPercent || '%'}
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1 border-t border-red-200/60">
            <button
              type="button"
              onClick={(e) => handleCopyCode(e, offerCard.couponCode)}
              className="flex-1 bg-white hover:bg-slate-50 text-[#B71C1C] border border-red-200 font-black text-[9.5px] py-1 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'COPIED' : 'COPY CODE'}</span>
            </button>
            <button
              type="button"
              className="bg-[#B71C1C] hover:bg-[#8E0000] text-white font-black text-[9.5px] py-1 px-2 rounded-lg transition-colors cursor-pointer"
            >
              SHOP NOW
            </button>
          </div>
        </div>
      )}

      {/* 3. LARGE FESTIVE AD */}
      {promoCard && promoCard.enabled !== false && (
        <div
          onClick={() => navigate(promoCard.link || '/shop')}
          className="w-full h-[310px] xl:h-[330px] rounded-2xl overflow-hidden relative shadow-md text-white p-4 flex flex-col justify-between bg-gradient-to-b from-[#8B0000] via-[#B71C1C] to-[#5C0000] group cursor-pointer border border-red-900/60"
        >
          <img
            src={resolveImageUrl(promoCard.imageUrl)}
            alt={promoCard.title || 'Festive Ad'}
            className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

          <div className="relative z-10 space-y-2">
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

      {/* 4. SHOP BY PRICE */}
      {shopByPrice.length > 0 && (
        <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
          <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5 text-[#B71C1C]" />
            <span>SHOP BY PRICE</span>
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {shopByPrice.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(p.link || '/shop')}
                className="bg-slate-50 hover:bg-red-50 hover:border-red-200 border border-slate-200/80 rounded-lg py-1.5 px-2 text-[10px] font-black text-slate-800 hover:text-[#B71C1C] transition-colors cursor-pointer text-center truncate"
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
            <Grid className="w-3.5 h-3.5 text-[#B71C1C]" />
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
              <div className="w-5 h-5 rounded-md bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0 mt-0.5">
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
            <span className="text-[9px] font-extrabold text-[#B71C1C] cursor-pointer hover:underline" onClick={() => navigate('/shop')}>
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
                  <h5 className="font-bold text-[10.5px] text-slate-900 leading-tight truncate group-hover:text-[#B71C1C]">
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

      {/* 8. DOWNLOAD KARVIYAM APP */}
      {appCard && appCard.enabled !== false && (
        <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2 text-center">
          <div className="flex items-center justify-center gap-1 text-[#B71C1C]">
            <Smartphone className="w-4 h-4" />
            <h4 className="font-display font-black text-xs uppercase tracking-wide text-slate-900">
              {appCard.title || 'DOWNLOAD KARVIYAM APP'}
            </h4>
          </div>
          <p className="text-[9.5px] text-slate-500 font-medium">
            {appCard.subtitle || 'Shop Anytime, Anywhere'}
          </p>

          <div className="flex flex-col gap-1 pt-0.5">
            <a
              href={appCard.playStoreUrl || 'https://play.google.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900 hover:bg-slate-800 text-white text-[9.5px] font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <span>GET IT ON</span>
              <span className="font-black">Google Play</span>
            </a>
            <a
              href={appCard.appStoreUrl || 'https://apple.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900 hover:bg-slate-800 text-white text-[9.5px] font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <span>Download on the</span>
              <span className="font-black">App Store</span>
            </a>
          </div>
        </div>
      )}

      {/* 9. BRAND / TRUST CARD (WHY KARVIYAM?) */}
      {brandTrust && brandTrust.enabled !== false && (
        <div className="w-full bg-slate-900 text-white rounded-xl shadow-2xs p-3 space-y-2 border border-slate-800">
          <h4 className="font-display font-black text-xs uppercase tracking-wide text-amber-300 border-b border-slate-800 pb-1.5">
            {brandTrust.title || 'WHY KARVIYAM?'}
          </h4>
          <ul className="space-y-1 text-[9.5px] text-slate-300 font-medium">
            {(brandTrust.points || ['Quality Fashion', 'Trusted Shopping', 'Secure Checkout', 'Easy Returns']).map((pt, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 10. FINAL LEFT PROMOTION */}
      {finalLeftPromo && finalLeftPromo.enabled !== false && (
        <div
          onClick={() => navigate(finalLeftPromo.link || '/shop')}
          className="w-full bg-gradient-to-br from-red-500 to-[#B71C1C] text-white rounded-xl p-3 space-y-1.5 cursor-pointer hover:shadow-md transition-shadow group"
        >
          <span className="text-[8.5px] font-black uppercase text-amber-200 tracking-wider block">
            {finalLeftPromo.badge || 'EXPLORE STYLES'}
          </span>
          <h4 className="font-display font-black text-xs leading-tight uppercase">
            {finalLeftPromo.title || 'SHOP MORE. SAVE MORE.'}
          </h4>
          <p className="text-[9.5px] opacity-90 font-medium">
            {finalLeftPromo.subtitle || 'Discover everyday fashion styles.'}
          </p>
          <button
            type="button"
            className="w-full bg-white text-slate-900 font-black text-[9.5px] uppercase tracking-wider py-1.5 rounded-lg shadow-2xs transition-colors mt-1"
          >
            {finalLeftPromo.buttonText || 'EXPLORE NOW →'}
          </button>
        </div>
      )}

    </aside>
  );
}
