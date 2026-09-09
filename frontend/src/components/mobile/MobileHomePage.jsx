import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Heart,
  ShoppingBag,
  Mic,
  Camera,
  Truck,
  RotateCcw,
  ShieldCheck,
  Award,
  ArrowRight,
  ChevronRight,
  Zap,
  Plus,
  X,
  User,
  Layers,
  Tag,
  Star,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import api from '../../utils/api';
import { resolveImageUrl, handleImageError } from '../../utils/imageUtils';
import FindYourPrice from '../FindYourPrice';
import WhyShopWithKarviyam from '../WhyShopWithKarviyam';
import toast from 'react-hot-toast';

const DEFAULT_RECOMMENDED = [
  { id: 101, name: 'Men Solid Polo T-Shirt', brand: 'KARVIYAM', rating: 4.5, reviews: '1.2k', price: 699, oldPrice: 1299, discount: '46% OFF', image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600' },
  { id: 102, name: 'Zari Border Silk Saree', brand: 'KARVIYAM', rating: 4.6, reviews: '980', price: 1299, oldPrice: 2499, discount: '48% OFF', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600' },
  { id: 103, name: 'Printed Oversized T-Shirt', brand: 'KARVIYAM', rating: 4.3, reviews: '740', price: 599, oldPrice: 999, discount: '40% OFF', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600' },
  { id: 104, name: 'Running Sneakers', brand: 'KARVIYAM', rating: 4.6, reviews: '1.5k', price: 1499, oldPrice: 2499, discount: '40% OFF', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600' },
  { id: 105, name: 'Cotton Kurta Set', brand: 'KARVIYAM', rating: 4.4, reviews: '620', price: 899, oldPrice: 1599, discount: '44% OFF', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600' },
  { id: 106, name: 'Kids Printed Shirt', brand: 'KARVIYAM', rating: 4.5, reviews: '310', price: 499, oldPrice: 799, discount: '38% OFF', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600' }
];

export default function MobileHomePage() {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const cartCount = Array.isArray(cartItems)
    ? cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0)
    : 0;

  // Mobile Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Main Data States (Shared with Desktop Source of Truth)
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [speed, setSpeed] = useState(5000);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [homepageSections, setHomepageSections] = useState([]);
  const [promoCards, setPromoCards] = useState([]);
  const [rightSidebarPromoCard, setRightSidebarPromoCard] = useState(null);
  const [rightSidebarBanners, setRightSidebarBanners] = useState([]);
  const [trustBadges, setTrustBadges] = useState([]);

  // Timer State for Banners/Flash Offers
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 41, seconds: 36 });

  // 1. Initial Load & Multi-Event Real-Time Synchronizer
  useEffect(() => {
    loadAllData();

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        loadAllData();
      }
    };

    window.addEventListener('karviyam_products_updated', loadAllData);
    window.addEventListener('karviyam_banners_updated', loadAllData);
    window.addEventListener('karviyam_categories_updated', loadAllData);
    window.addEventListener('karviyam_parent_categories_updated', loadAllData);
    window.addEventListener('karviyam_homepage_sections_updated', loadAllData);
    window.addEventListener('karviyam_promo_cards_updated', loadAllData);
    window.addEventListener('karviyam_right_sidebar_banners_updated', loadAllData);
    window.addEventListener('karviyam_right_sidebar_promo_card_updated', loadAllData);
    window.addEventListener('karviyam_why_shop_updated', loadAllData);
    window.addEventListener('focus', handleFocusOrVisible);
    window.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('storage', loadAllData);

    return () => {
      window.removeEventListener('karviyam_products_updated', loadAllData);
      window.removeEventListener('karviyam_banners_updated', loadAllData);
      window.removeEventListener('karviyam_categories_updated', loadAllData);
      window.removeEventListener('karviyam_parent_categories_updated', loadAllData);
      window.removeEventListener('karviyam_homepage_sections_updated', loadAllData);
      window.removeEventListener('karviyam_promo_cards_updated', loadAllData);
      window.removeEventListener('karviyam_right_sidebar_banners_updated', loadAllData);
      window.removeEventListener('karviyam_right_sidebar_promo_card_updated', loadAllData);
      window.removeEventListener('karviyam_why_shop_updated', loadAllData);
      window.removeEventListener('focus', handleFocusOrVisible);
      window.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('storage', loadAllData);
    };
  }, []);

  // Flash Picks Countdown Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 2, minutes: 41, seconds: 36 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Banner Auto-rotate
  useEffect(() => {
    if (banners.length <= 1) return;
    if (!autoScroll) return;

    const bannerTimer = setInterval(() => {
      setCurrentBannerIdx(prev => (prev + 1) % banners.length);
    }, speed || 5000);
    return () => clearInterval(bannerTimer);
  }, [banners.length, autoScroll, speed]);

  const loadAllData = async () => {
    try {
      // 1. PARENT CATEGORIES (Desktop Source of Truth: /parent-categories)
      try {
        const resCat = await api.get('/parent-categories').catch(() => null);
        const apiCats = resCat?.data?.data || resCat?.data || [];
        let catList = Array.isArray(apiCats) ? apiCats : [];

        if (catList.length === 0) {
          const savedCat = localStorage.getItem('karviyam_admin_parent_categories');
          if (savedCat) {
            const parsed = JSON.parse(savedCat);
            if (Array.isArray(parsed)) catList = parsed.filter(c => c.isActive !== false);
          }
        }

        if (catList && catList.length > 0) {
          const formatted = catList.map(c => ({
            id: c.id,
            name: (c.name || '').toUpperCase(),
            label: (c.name || '').toUpperCase(),
            image: resolveImageUrl(c.imageUrl || c.image_url || c.imagePath || c.image || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300', c.id),
            link: c.link || `/shop?category=${encodeURIComponent(c.name)}`
          }));
          setCategories(formatted);
        } else {
          setCategories([
            { id: '1', name: 'T-SHIRTS', label: 'T-SHIRTS', image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300', link: '/shop?category=T-Shirts' },
            { id: '2', name: 'SNEAKERS', label: 'SNEAKERS', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300', link: '/shop?category=Sneakers' },
            { id: '3', name: 'KURTA SETS', label: 'KURTA SETS', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300', link: '/shop?category=Kurta+Sets' },
            { id: '4', name: 'WOMEN', label: 'WOMEN', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300', link: '/shop?category=Women' },
            { id: '5', name: 'MEN', label: 'MEN', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300', link: '/shop?category=Men' }
          ]);
        }
      } catch (eCat) {}

      // 2. HERO BANNERS (Desktop Source of Truth: /banners)
      try {
        let currentAuto = true;
        let currentSpeed = 5000;

        const resBanners = await api.get('/banners').catch(() => null);
        const apiData = resBanners?.data ? resBanners.data : resBanners;
        const rawData = apiData?.data !== undefined ? apiData.data : apiData;

        let list = [];
        if (Array.isArray(rawData)) {
          list = rawData;
        } else if (rawData && typeof rawData === 'object') {
          if (Array.isArray(rawData.banners)) list = rawData.banners;
          if (rawData.autoScroll !== undefined) currentAuto = Boolean(rawData.autoScroll);
          if (rawData.speed !== undefined) currentSpeed = Number(rawData.speed);
        }

        if (!list || list.length === 0) {
          const saved = localStorage.getItem('karviyam_admin_banners');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) list = parsed;
          }
        }

        setAutoScroll(currentAuto);
        setSpeed(currentSpeed);

        if (list && list.length > 0) {
          const activeBanners = list.filter(b => b && b.isActive !== false && String(b.status || 'active').toLowerCase() === 'active');
          const formatted = activeBanners.map(b => {
            const rawImg = b.mobileImageUrl || b.desktopImageUrl || b.imageUrl || b.image_url || b.imagePath || b.image || '';
            const resolvedImg = resolveImageUrl(rawImg, b.id);
            return {
              id: b.id,
              badge: b.tag || b.badge || 'OFFICIAL DROP',
              title: b.title || '',
              subtitle: b.subtitle || '',
              image: resolvedImg,
              cta: b.buttonText || b.button_text || b.cta || 'SHOP NOW',
              link: b.buttonLink || b.link || '/shop',
              enableTimer: Boolean(b.enableTimer)
            };
          });
          setBanners(formatted);
        } else {
          setBanners([]);
        }
      } catch (eBanners) {}

      // 3. RECOMMENDED FOR YOU PRODUCTS (Desktop Source of Truth: /products/featured & /products)
      try {
        let rawProductList = [];
        const featRes = await api.get('/products/featured').catch(() => null);
        const featData = featRes?.data?.data || featRes?.data || featRes;
        let featList = Array.isArray(featData) ? featData : (Array.isArray(featData?.content) ? featData.content : []);

        const allRes = await api.get('/products?size=50').catch(() => null);
        const allData = allRes?.data?.data || allRes?.data;
        let allList = Array.isArray(allData?.content) ? allData.content : (Array.isArray(allData) ? allData : []);

        rawProductList = [...featList, ...allList.filter(p => !featList.some(f => String(f.id) === String(p.id)))];

        try {
          const savedAdmin = localStorage.getItem('karviyam_admin_products');
          if (savedAdmin) {
            const parsed = JSON.parse(savedAdmin);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const activeAdminProds = parsed.filter(p => p.isActive !== false);
              if (activeAdminProds.length > 0) {
                rawProductList = [...activeAdminProds, ...rawProductList.filter(p => !activeAdminProds.some(a => String(a.id) === String(p.id)))];
              }
            }
          }
        } catch (eSaved) {}

        const activeProducts = rawProductList.filter(p => p && p.isActive !== false);
        const formattedProducts = activeProducts.map((p, idx) => {
          const fallback = DEFAULT_RECOMMENDED[idx % DEFAULT_RECOMMENDED.length];
          const rawImage = p.imageUrl || p.image_url || p.imagePath || p.image || (Array.isArray(p.images) && p.images[0]) || '';
          const resolvedImage = resolveImageUrl(rawImage, p.id || idx);
          const price = Number(p.price) || fallback.price;
          const oldPrice = Number(p.oldPrice || p.mrp || Math.round(price * 1.45));
          const disc = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 30;

          return {
            id: p.id || fallback.id + idx,
            name: p.name || fallback.name,
            brand: p.brand || fallback.brand || 'KARVIYAM',
            rating: p.rating || fallback.rating || 4.5,
            reviewsCount: p.reviewsCount || fallback.reviews,
            price: price,
            oldPrice: oldPrice,
            discount: `${disc}% OFF`,
            image: resolvedImage
          };
        });

        if (formattedProducts.length > 0) {
          setRecommendedProducts(formattedProducts);
        } else {
          setRecommendedProducts(DEFAULT_RECOMMENDED);
        }
      } catch (eRec) {
        setRecommendedProducts(DEFAULT_RECOMMENDED);
      }

      // 4. DYNAMIC HOMEPAGE SECTIONS (Desktop Source of Truth: /homepage-sections)
      try {
        const resSec = await api.get('/homepage-sections').catch(() => null);
        const dataSec = resSec?.data?.data || resSec?.data;
        if (Array.isArray(dataSec)) {
          const sorted = [...dataSec].sort((a, b) => (parseInt(a.position) || 0) - (parseInt(b.position) || 0));
          setHomepageSections(sorted);
        }
      } catch (eSec) {}

      // 5. PROMO CARDS (Desktop Source of Truth: /promo-cards)
      try {
        const resPromo = await api.get('/promo-cards').catch(() => null);
        const promoData = resPromo?.data?.data || resPromo?.data;
        let pList = Array.isArray(promoData) ? promoData : [];
        if (!pList || pList.length === 0) {
          const saved = localStorage.getItem('karviyam_admin_promo_cards');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) pList = parsed.filter(c => c.isActive !== false);
          }
        }
        setPromoCards(pList);
      } catch (ePromo) {}

      // 6. RIGHT SIDEBAR PROMO CARD (Desktop Source of Truth: /right-sidebar-promo-card)
      try {
        const resRsPromo = await api.get('/right-sidebar-promo-card').catch(() => null);
        const rsData = resRsPromo?.data?.data || resRsPromo?.data;
        if (rsData && typeof rsData === 'object' && rsData.enabled !== false) {
          setRightSidebarPromoCard(rsData);
        } else {
          const saved = localStorage.getItem('karviyam_right_sidebar_promo_card');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object' && parsed.enabled !== false) setRightSidebarPromoCard(parsed);
          }
        }
      } catch (eRsPromo) {}

      // 7. RIGHT SIDEBAR BANNERS (Desktop Source of Truth: /right-sidebar-banners)
      try {
        const resRsBanners = await api.get('/right-sidebar-banners').catch(() => null);
        const rsBData = resRsBanners?.data?.data || resRsBanners?.data;
        let rsBList = Array.isArray(rsBData) ? rsBData : [];
        if (!rsBList || rsBList.length === 0) {
          const saved = localStorage.getItem('karviyam_admin_right_sidebar_banners');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) rsBList = parsed.filter(b => b.isActive !== false);
          }
        }
        setRightSidebarBanners(rsBList);
      } catch (eRsBanners) {}

      // 8. TRUST BADGES
      setTrustBadges([
        { id: '1', title: 'Free Delivery', subtext: 'Above ₹499', icon: 'Truck' },
        { id: '2', title: 'Easy Returns', subtext: '14 Days', icon: 'RotateCcw' },
        { id: '3', title: 'Secure Payment', subtext: '100% Safe', icon: 'ShieldCheck' },
        { id: '4', title: 'Best Quality', subtext: 'Premium Products', icon: 'Award' }
      ]);

    } catch (e) {
      console.error('Error loading mobile homepage data:', e);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const renderProductCardItem = (prod, isGrid = false) => {
    const prodImg = resolveImageUrl(prod.image || prod.imageUrl || (Array.isArray(prod.images) ? prod.images[0] : ''), prod.id);
    const isWish = isInWishlist(prod.id);
    const prodPrice = Number(prod.price) || 599;
    const prodOldPrice = Number(prod.oldPrice || prod.old_price || Math.round(prodPrice * 1.4));
    const discountText = prod.discount || (prodOldPrice > prodPrice ? `${Math.round(((prodOldPrice - prodPrice) / prodOldPrice) * 100)}% OFF` : '30% OFF');

    return (
      <div
        key={prod.id}
        onClick={() => navigate(`/product/${prod.id}`)}
        className={
          isGrid
            ? "w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-2 relative flex flex-col justify-between overflow-hidden cursor-pointer group transition-all"
            : "w-[145px] sm:w-[160px] min-w-[145px] max-w-[160px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-2 relative flex flex-col justify-between overflow-hidden cursor-pointer group transition-all"
        }
      >
        <div className="relative w-full h-[120px] bg-slate-50/80 rounded-xl overflow-hidden flex items-center justify-center p-1.5 shrink-0">
          <img
            src={prodImg}
            alt={prod.name}
            onError={(e) => handleImageError(e, prod.id)}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
            loading="lazy"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(prod.id);
            }}
            className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center border shadow-2xs transition-colors ${
              isWish ? 'bg-[#B71C1C] text-white border-[#B71C1C]' : 'bg-white/90 text-slate-700 hover:text-[#B71C1C] border-slate-100'
            }`}
            title={isWish ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 ${isWish ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-between pt-1.5 px-0.5 space-y-1">
          <div className="flex items-center justify-between text-[9.5px]">
            <span className="font-black text-[#B71C1C] uppercase tracking-wider truncate max-w-[70px]">
              {prod.brand || 'KARVIYAM'}
            </span>
            <div className="flex items-center gap-0.5 font-bold text-amber-500">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              <span className="text-slate-800 font-extrabold">{prod.rating || 4.5}</span>
            </div>
          </div>
          <h3 className="font-bold text-[11px] text-slate-900 leading-snug line-clamp-2" title={prod.name}>
            {prod.name}
          </h3>
          <div className="pt-0.5 flex flex-wrap items-baseline gap-1">
            <span className="font-black text-xs text-slate-900">₹{prodPrice}</span>
            {prodOldPrice > prodPrice && (
              <span className="text-[9px] text-slate-400 line-through">₹{prodOldPrice}</span>
            )}
            <span className="text-[9px] font-extrabold text-emerald-600 ml-auto">{discountText}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-[#FAFAFA] pb-16 text-slate-900 select-none font-sans text-left min-h-screen">

      {/* 1. QUICK CATEGORIES / SHOP BY CATEGORY STRIP (Desktop Source of Truth: /parent-categories) */}
      {categories.length > 0 && (
        <div className="w-full bg-white py-2 px-3 border-b border-slate-100 overflow-x-auto no-scrollbar shadow-2xs">
          <div className="flex items-center gap-3.5 whitespace-nowrap">
            {categories.map((cat, idx) => (
              <div
                key={cat.id || idx}
                onClick={() => navigate(cat.link || `/shop?category=${encodeURIComponent(cat.name || cat.label)}`)}
                className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-100 p-0.5 overflow-hidden flex items-center justify-center shadow-2xs group-active:scale-95 transition-transform">
                  <img
                    src={resolveImageUrl(cat.image, cat.id)}
                    alt={cat.label || cat.name}
                    onError={(e) => handleImageError(e, cat.id)}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <span className="text-[9.5px] font-black tracking-tight text-slate-800 uppercase truncate max-w-[66px]">
                  {cat.label || cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. HERO BANNER CAROUSEL (Desktop Source of Truth: /banners) */}
      {banners.length > 0 && (
        <div className="px-3 my-2.5">
          <div className="w-full h-[180px] sm:h-[210px] rounded-2xl overflow-hidden relative shadow-md bg-[#8B0000] group">
            {banners[currentBannerIdx]?.image ? (
              <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                  src={banners[currentBannerIdx].image}
                  alt={banners[currentBannerIdx]?.title || 'Hero Banner'}
                  onError={(e) => handleImageError(e, banners[currentBannerIdx]?.id)}
                  className="w-full h-full object-cover object-center transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#700000] via-[#8B0000]/80 to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-[#700000] via-[#8B0000] to-[#500000]" />
            )}

            <div className="relative z-10 h-full p-4 flex flex-col justify-center max-w-[72%] text-white">
              <span className="inline-block bg-black/30 backdrop-blur-md border border-white/20 text-white text-[8.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest w-max mb-1 shadow-2xs">
                {banners[currentBannerIdx]?.badge || 'OFFICIAL DROP'}
              </span>

              <h2 className="font-display font-black text-base sm:text-lg leading-snug text-white tracking-tight uppercase drop-shadow-sm line-clamp-2">
                {banners[currentBannerIdx]?.title || 'FESTIVE COLLECTION'}
              </h2>

              <p className="text-[10px] text-slate-100 font-medium mt-0.5 mb-2 line-clamp-2 leading-tight">
                {banners[currentBannerIdx]?.subtitle || 'Celebrate traditions in timeless style'}
              </p>

              <button
                type="button"
                onClick={() => navigate(banners[currentBannerIdx]?.link || '/shop')}
                className="bg-white hover:bg-slate-100 text-slate-900 text-[10px] font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider transition-all shadow-md w-max cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
              >
                <span>{banners[currentBannerIdx]?.cta || 'SHOP NOW'}</span>
                <ArrowRight className="w-3 h-3 text-slate-900" />
              </button>
            </div>

            {/* Banner Timer Badge if configured */}
            {banners[currentBannerIdx]?.enableTimer && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-20">
                <span className="text-[9px] font-bold text-rose-100 uppercase tracking-widest drop-shadow-xs">Ends in</span>
                <div className="flex items-center gap-1">
                  <div className="bg-rose-100/90 backdrop-blur-md px-2 py-1 rounded-xl text-xs font-black text-rose-950 font-mono shadow-md border border-white/60">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <span className="font-black text-xs text-white pb-2.5">:</span>
                  <div className="bg-rose-100/90 backdrop-blur-md px-2 py-1 rounded-xl text-xs font-black text-rose-950 font-mono shadow-md border border-white/60">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <span className="font-black text-xs text-white pb-2.5">:</span>
                  <div className="bg-rose-100/90 backdrop-blur-md px-2 py-1 rounded-xl text-xs font-black text-rose-950 font-mono shadow-md border border-white/60">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                </div>
              </div>
            )}

            {/* Banner Pagination Dots */}
            {banners.length > 1 && (
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentBannerIdx(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentBannerIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. PROMOTIONAL CARDS (Desktop Source of Truth: /promo-cards) */}
      {promoCards.length > 0 && (
        <div className="px-3 my-2.5 space-y-2">
          {promoCards.map((card) => (
            <div
              key={card.id}
              onClick={() => navigate(card.link || '/shop')}
              className="w-full h-[140px] sm:h-[160px] rounded-2xl overflow-hidden relative shadow-md cursor-pointer border border-slate-200 group bg-slate-950 flex items-center justify-center"
            >
              <img
                src={resolveImageUrl(card.imageUrl)}
                alt={card.title || 'Promotional Banner'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      )}

      {/* 4. RECOMMENDED FOR YOU SECTION (Desktop Source of Truth: /products/featured & /products) */}
      <div className="px-3 my-2.5">
        <div className="w-full bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-col gap-2 relative">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-black text-sm text-slate-900 tracking-tight">
                Recommended For You
              </h2>
              <p className="text-[10.5px] text-slate-500 font-medium">
                Handpicked selections based on your style
              </p>
            </div>
            <button
              onClick={() => navigate('/shop')}
              className="text-xs font-bold text-[#B71C1C] hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>View All</span>
              <span>→</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 w-full flex-nowrap snap-x snap-mandatory">
            {recommendedProducts.map((prod) => renderProductCardItem(prod, false))}
          </div>
        </div>
      </div>

      {/* 5. SIDE-BY-SIDE RESPONSIVE SECTIONS: FIND YOUR PRICE & WHY SHOP WITH KARVIYAM */}
      <div className="px-3 space-y-2 my-2">
        <FindYourPrice />
        <WhyShopWithKarviyam />
      </div>

      {/* 6. RIGHT SIDEBAR PROMO CARD & BANNERS (Desktop Source of Truth: /right-sidebar-promo-card & /right-sidebar-banners) */}
      {rightSidebarPromoCard && (
        <div className="px-3 my-2.5">
          <div
            onClick={() => navigate(rightSidebarPromoCard.link || '/shop')}
            className="w-full h-[140px] rounded-2xl flex items-center relative overflow-hidden shadow-md group cursor-pointer border border-slate-200/40 transition-transform bg-slate-900"
          >
            <img
              src={resolveImageUrl(rightSidebarPromoCard.imageUrl)}
              alt={rightSidebarPromoCard.title || 'Promo Card'}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600';
              }}
            />
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                background: `linear-gradient(to right, ${rightSidebarPromoCard.bgColor || '#000000'}F2 0%, ${rightSidebarPromoCard.bgColor || '#000000'}A6 50%, transparent 100%)`
              }}
            />
            <div className="z-20 text-left space-y-1 p-3.5 w-[70%]" style={{ color: rightSidebarPromoCard.textColor || '#FFFFFF' }}>
              <span className="text-[9px] font-black uppercase tracking-widest block opacity-95 drop-shadow-sm truncate">
                {rightSidebarPromoCard.badge || 'NEW ARRIVALS'}
              </span>
              <h3 className="font-display font-black text-sm leading-tight uppercase line-clamp-2 drop-shadow-sm" title={rightSidebarPromoCard.title}>
                {rightSidebarPromoCard.title || 'Fresh Styles'}
              </h3>
              <p className="text-[10px] opacity-90 font-medium truncate drop-shadow-sm" title={rightSidebarPromoCard.description}>
                {rightSidebarPromoCard.description || 'Just Landed!'}
              </p>
              <div className="pt-1.5">
                <span className="inline-block bg-white text-slate-900 font-extrabold text-[10px] px-3 py-1 rounded-lg shadow-sm">
                  {rightSidebarPromoCard.buttonText || 'SHOP NOW'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {rightSidebarBanners.length > 0 && (
        <div className="px-3 my-2.5 space-y-2">
          {rightSidebarBanners.map((banner) => (
            <div
              key={banner.id}
              onClick={() => navigate(banner.link || '/shop')}
              className="w-full bg-white rounded-xl border border-slate-200/90 shadow-xs p-3 flex items-center justify-between gap-2.5 relative overflow-hidden group cursor-pointer hover:border-[#B71C1C] transition-colors"
            >
              <div className="flex-1 z-10 flex flex-col justify-between h-full py-0.5 min-w-0">
                <div>
                  <span className="text-[9px] font-black uppercase text-[#B71C1C] tracking-wider block truncate">
                    {banner.badgeText || 'KARVIYAM'}
                  </span>
                  <h4 className="font-display font-black text-sm text-slate-900 leading-tight uppercase mt-0.5 truncate" title={banner.title}>
                    {banner.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 line-clamp-2" title={banner.description}>
                    {banner.description || 'Timeless styles for every occasion.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-[10px] font-black text-[#B71C1C] uppercase tracking-wide hover:underline cursor-pointer mt-2"
                >
                  <span>{banner.buttonText || 'EXPLORE NOW'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="w-[80px] h-[110px] shrink-0 rounded-lg overflow-hidden shadow-2xs relative bg-slate-50 flex items-center justify-center border border-slate-100">
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
          ))}
        </div>
      )}

      {/* 7. DYNAMIC ADMIN-CONTROLLED HOMEPAGE SECTIONS IN EXACT ORDER (Desktop Source of Truth: /homepage-sections) */}
      {homepageSections.map((sec) => {
        if (!sec || sec.enabled === false || !Array.isArray(sec.products) || sec.products.length === 0) return null;
        const isGrid = sec.display_type === 'grid';

        return (
          <div key={sec.id || sec.section_key} className="px-3 my-2.5">
            <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-black text-sm text-slate-900 tracking-tight">{sec.title}</h3>
                  {sec.subtitle && <p className="text-[10.5px] text-slate-500 font-medium">{sec.subtitle}</p>}
                </div>
                <button
                  onClick={() => navigate(sec.view_all_link || '/shop')}
                  className="text-xs font-bold text-[#B71C1C] hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <span>{sec.view_all_text || 'View All →'}</span>
                </button>
              </div>

              {isGrid ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {sec.products.map((prod) => renderProductCardItem(prod, true))}
                </div>
              ) : (
                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 w-full flex-nowrap snap-x snap-mandatory">
                  {sec.products.map((prod) => renderProductCardItem(prod, false))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* TRUST BADGES ROW */}
      <div className="px-3 py-2 bg-white border-y border-slate-100 my-2">
        <div className="grid grid-cols-4 gap-1 text-center">
          {trustBadges.map((badge, idx) => (
            <div key={idx} className="flex flex-col items-center gap-0.5 px-0.5">
              <div className="w-7 h-7 rounded-full bg-rose-50 text-[#B71C1C] flex items-center justify-center shrink-0">
                {badge.icon === 'RotateCcw' ? <RotateCcw className="w-3.5 h-3.5" /> :
                 badge.icon === 'ShieldCheck' ? <ShieldCheck className="w-3.5 h-3.5" /> :
                 badge.icon === 'Award' ? <Award className="w-3.5 h-3.5" /> :
                 <Truck className="w-3.5 h-3.5" />}
              </div>
              <span className="text-[9.5px] font-black text-slate-900 leading-tight block truncate max-w-full">
                {badge.title}
              </span>
              <span className="text-[8.5px] font-semibold text-slate-500 block truncate max-w-full">
                {badge.subtext}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <Link
          to="/"
          className="flex flex-col items-center gap-0.5 text-[#B71C1C] font-extrabold text-[10px]"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </div>
          <span>Home</span>
        </Link>

        <Link
          to="/shop"
          className="flex flex-col items-center gap-0.5 text-slate-600 font-bold text-[10px] hover:text-[#B71C1C]"
        >
          <Layers className="w-5 h-5" />
          <span>Categories</span>
        </Link>

        <Link
          to="/offers"
          className="flex flex-col items-center gap-0.5 text-slate-600 font-bold text-[10px] hover:text-[#B71C1C]"
        >
          <Tag className="w-5 h-5" />
          <span>Offers</span>
        </Link>

        <Link
          to="/cart"
          className="flex flex-col items-center gap-0.5 text-slate-600 font-bold text-[10px] hover:text-[#B71C1C] relative"
        >
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#B71C1C] text-white text-[8.5px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-2xs">
              {cartCount}
            </span>
          )}
          <span>Cart</span>
        </Link>

        <Link
          to="/profile"
          className="flex flex-col items-center gap-0.5 text-slate-600 font-bold text-[10px] hover:text-[#B71C1C]"
        >
          <User className="w-5 h-5" />
          <span>Account</span>
        </Link>
      </div>

    </div>
  );
}
