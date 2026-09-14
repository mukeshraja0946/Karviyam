import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Heart,
  ShoppingBag,
  Zap,
  Star,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Clock,
  Gift
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import api from '../../utils/api';
import { resolveImageUrl, handleImageError } from '../../utils/imageUtils';

// Fallback Sample Products if API is loading or offline
const DEFAULT_RECOMMENDED = [
  { id: 101, name: 'Pure Silk Saree', brand: 'KARVIYAM', rating: 4.8, price: 2399, oldPrice: 2999, discount: '20% OFF', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600' },
  { id: 102, name: "Men's Casual Shirt", brand: 'KARVIYAM', rating: 4.5, price: 799, oldPrice: 1199, discount: '33% OFF', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600' },
  { id: 103, name: 'Premium Handbag', brand: 'KARVIYAM', rating: 4.7, price: 1499, oldPrice: 2499, discount: '40% OFF', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600' },
  { id: 104, name: 'Designer Kurta Set', brand: 'KARVIYAM', rating: 4.6, price: 1299, oldPrice: 1999, discount: '35% OFF', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600' },
  { id: 105, name: 'Pure Cotton T-Shirt', brand: 'KARVIYAM', rating: 4.4, price: 599, oldPrice: 899, discount: '33% OFF', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600' },
  { id: 106, name: 'Classic Leather Loafers', brand: 'KARVIYAM', rating: 4.6, price: 1799, oldPrice: 2799, discount: '35% OFF', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600' }
];

export default function MobileHomePage() {
  const navigate = useNavigate();
  const { cartItems, itemCount } = useCart();
  const { toggleWishlist, isInWishlist, wishlistCount, wishlist } = useWishlist();

  // Unified Badge Counts
  const activeCartCount = itemCount != null ? itemCount : (Array.isArray(cartItems) ? cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0) : 0);
  const activeWishlistCount = wishlistCount != null ? wishlistCount : (Array.isArray(wishlist) ? wishlist.length : 0);

  // Component States
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [speed, setSpeed] = useState(5000);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [homepageSections, setHomepageSections] = useState([]);
  const [promoCards, setPromoCards] = useState([]);
  
  // Touch Swipe Gesture State for Hero Banner
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Real-Time Countdown Deal Timer State (10 m 38 s live countdown)
  const [timeLeft, setTimeLeft] = useState({ minutes: 10, seconds: 38 });

  useEffect(() => {
    loadAllMobileData();

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        loadAllMobileData();
      }
    };

    window.addEventListener('karviyam_products_updated', loadAllMobileData);
    window.addEventListener('karviyam_banners_updated', loadAllMobileData);
    window.addEventListener('karviyam_categories_updated', loadAllMobileData);
    window.addEventListener('karviyam_homepage_sections_updated', loadAllMobileData);
    window.addEventListener('karviyam_promo_cards_updated', loadAllMobileData);
    window.addEventListener('focus', handleFocusOrVisible);
    window.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('storage', loadAllMobileData);

    return () => {
      window.removeEventListener('karviyam_products_updated', loadAllMobileData);
      window.removeEventListener('karviyam_banners_updated', loadAllMobileData);
      window.removeEventListener('karviyam_categories_updated', loadAllMobileData);
      window.removeEventListener('karviyam_homepage_sections_updated', loadAllMobileData);
      window.removeEventListener('karviyam_promo_cards_updated', loadAllMobileData);
      window.removeEventListener('focus', handleFocusOrVisible);
      window.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('storage', loadAllMobileData);
    };
  }, []);

  // Live Deal Timer Decrement
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
        return { minutes: 10, seconds: 38 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Banner Auto-rotation
  useEffect(() => {
    if (banners.length <= 1 || !autoScroll) return;
    const bannerTimer = setInterval(() => {
      setCurrentBannerIdx(prev => (prev + 1) % banners.length);
    }, speed || 5000);
    return () => clearInterval(bannerTimer);
  }, [banners.length, autoScroll, speed]);

  const loadAllMobileData = async () => {
    try {
      // 1. Fetch Categories / Parent Categories
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
            name: c.name || '',
            label: c.name || '',
            image: resolveImageUrl(c.imageUrl || c.image_url || c.imagePath || c.image, c.id),
            link: c.link || `/shop?category=${encodeURIComponent(c.name)}`
          }));
          setCategories(formatted);
        }
      } catch (eCat) {}

      // 2. Fetch Hero Banners
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
            return {
              id: b.id,
              badge: b.tag || b.badge || 'OFFICIAL DROP',
              title: b.title || 'Timeless Traditions Modern You',
              subtitle: b.subtitle || 'ETHNIC WEAR FOR EVERY STORY',
              image: resolveImageUrl(rawImg, b.id),
              cta: b.buttonText || b.button_text || b.cta || 'SHOP NOW',
              link: b.buttonLink || b.link || '/shop'
            };
          });
          setBanners(formatted);
        } else {
          // Default Reference-style Banner if no active banner is configured
          setBanners([
            {
              id: 1,
              title: 'Timeless Traditions Modern You',
              subtitle: 'ETHNIC WEAR FOR EVERY STORY',
              image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000',
              cta: 'SHOP NOW',
              link: '/shop?category=Ethnic'
            }
          ]);
        }
      } catch (eBanners) {}

      // 3. Fetch Featured / Recommended Products
      try {
        let rawProductList = [];
        const featRes = await api.get('/products/featured').catch(() => null);
        const featData = featRes?.data?.data || featRes?.data || featRes;
        let featList = Array.isArray(featData) ? featData : (Array.isArray(featData?.content) ? featData.content : []);

        const allRes = await api.get('/products?size=50').catch(() => null);
        const allData = allRes?.data?.data || allRes?.data;
        let allList = Array.isArray(allData?.content) ? allData.content : (Array.isArray(allData) ? allData : []);

        rawProductList = [...featList, ...allList.filter(p => !featList.some(f => String(f.id) === String(p.id)))];
        const activeProducts = rawProductList.filter(p => p && p.isActive !== false);

        const formattedProducts = activeProducts.map((p, idx) => {
          const fallback = DEFAULT_RECOMMENDED[idx % DEFAULT_RECOMMENDED.length];
          const rawImage = p.imageUrl || p.image_url || p.imagePath || p.image || (Array.isArray(p.images) && p.images[0]) || '';
          const price = Number(p.price) || fallback.price;
          const oldPrice = Number(p.oldPrice || p.old_price || p.mrp || Math.round(price * 1.35));
          const disc = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 25;

          return {
            id: p.id || fallback.id + idx,
            name: p.name || fallback.name,
            brand: p.brand || fallback.brand || 'KARVIYAM',
            rating: p.rating || fallback.rating || 4.5,
            price: price,
            oldPrice: oldPrice,
            discount: `${disc}% OFF`,
            image: resolveImageUrl(rawImage, p.id || idx)
          };
        });

        setRecommendedProducts(formattedProducts.length > 0 ? formattedProducts : DEFAULT_RECOMMENDED);
      } catch (eRec) {
        setRecommendedProducts(DEFAULT_RECOMMENDED);
      }

      // 4. Fetch Dynamic Homepage Sections Configuration
      try {
        const resSec = await api.get('/homepage-sections').catch(() => null);
        const dataSec = resSec?.data?.data || resSec?.data;
        if (Array.isArray(dataSec)) {
          const sorted = [...dataSec].sort((a, b) => (parseInt(a.position) || 0) - (parseInt(b.position) || 0));
          setHomepageSections(sorted);
        }
      } catch (eSec) {}

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

  // Touch Swipe Handlers for Hero Banner Carousel
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (banners.length <= 1) return;
    if (touchStartX.current - touchEndX.current > 50) {
      // Swipe Left -> Next Banner
      setCurrentBannerIdx(prev => (prev + 1) % banners.length);
    } else if (touchEndX.current - touchStartX.current > 50) {
      // Swipe Right -> Prev Banner
      setCurrentBannerIdx(prev => (prev - 1 + banners.length) % banners.length);
    }
  };

  // Render Product Card Item (Reference UI Style)
  const renderProductCard = (prod, idx) => {
    const isWish = isInWishlist(prod.id);
    const prodImg = resolveImageUrl(prod.image || prod.imageUrl || (Array.isArray(prod.images) ? prod.images[0] : ''), prod.id || idx);

    return (
      <div
        key={prod.id || idx}
        onClick={() => navigate(`/product/${prod.id}`)}
        className="w-[152px] sm:w-[168px] min-w-[152px] shrink-0 snap-start bg-white rounded-xl border border-slate-200/90 shadow-2xs p-2 relative flex flex-col justify-between overflow-hidden cursor-pointer group transition-all"
      >
        {/* Top Left Discount Tag */}
        {prod.discount && (
          <span className="absolute top-2 left-2 bg-[#D32F2F] text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tight shadow-2xs z-10">
            {prod.discount}
          </span>
        )}

        {/* Top Right Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(prod.id);
          }}
          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center border shadow-2xs transition-colors z-10 ${
            isWish ? 'bg-[#B71C1C] text-white border-[#B71C1C]' : 'bg-white/90 text-slate-700 hover:text-[#B71C1C] border-slate-200'
          }`}
          title={isWish ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart className={`w-3.5 h-3.5 ${isWish ? 'fill-current' : ''}`} />
        </button>

        {/* Product Image Box */}
        <div className="w-full h-[130px] bg-[#F8F8F8] rounded-lg overflow-hidden flex items-center justify-center p-1.5 mb-1.5 relative shrink-0">
          <img
            src={prodImg}
            alt={prod.name}
            onError={(e) => handleImageError(e, prod.id || idx)}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        {/* Product Details */}
        <div className="space-y-0.5 px-0.5">
          <h3 className="font-bold text-[11px] text-slate-900 leading-snug line-clamp-1" title={prod.name}>
            {prod.name}
          </h3>
          <div className="flex items-baseline gap-1 pt-0.5">
            <span className="font-black text-xs text-slate-900">₹{Number(prod.price).toLocaleString('en-IN')}</span>
            {prod.oldPrice > prod.price && (
              <span className="text-[9.5px] text-slate-400 line-through font-medium">₹{Number(prod.oldPrice).toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-[#FAF7F2] pb-24 text-slate-900 select-none font-sans text-left min-h-screen">
      


      {/* ========================================================= */}
      {/* 2. HERO BANNER CAROUSEL (Rounded Cards + Full Image)       */}
      {/* ========================================================= */}
      {banners.length > 0 && (
        <div className="px-3.5 mt-3 mb-2.5">
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full h-[190px] sm:h-[220px] rounded-2xl overflow-hidden relative shadow-md bg-slate-900 group"
          >
            {/* Banner Image */}
            <img
              src={banners[currentBannerIdx]?.image}
              alt={banners[currentBannerIdx]?.title || 'Hero Banner'}
              onError={(e) => handleImageError(e, banners[currentBannerIdx]?.id)}
              className="w-full h-full object-cover object-center transition-all duration-700"
            />

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />

            {/* Overlay Banner Text Content */}
            <div className="absolute inset-0 z-10 p-5 flex flex-col justify-center max-w-[70%] text-white space-y-1">
              <h2 className="font-serif font-bold text-base sm:text-xl leading-snug text-white drop-shadow-md">
                {banners[currentBannerIdx]?.title || 'Timeless Traditions Modern You'}
              </h2>

              <p className="text-[9.5px] text-amber-200/90 font-bold uppercase tracking-wider drop-shadow-sm">
                {banners[currentBannerIdx]?.subtitle || 'ETHNIC WEAR FOR EVERY STORY'}
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate(banners[currentBannerIdx]?.link || '/shop')}
                  className="bg-[#B71C1C] hover:bg-[#900C0C] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm cursor-pointer flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <span>{banners[currentBannerIdx]?.cta || 'SHOP NOW'}</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Left / Right Arrow Navigation */}
            {banners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentBannerIdx(prev => (prev - 1 + banners.length) % banners.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-80 hover:opacity-100 z-20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentBannerIdx(prev => (prev + 1) % banners.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-80 hover:opacity-100 z-20"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Pagination Dots */}
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



      {/* ========================================================= */}
      {/* 4. QUICK SHOPPING CARDS (2-Row Grid matching reference)   */}
      {/* ========================================================= */}
      <div className="px-3.5 my-3 space-y-2">
        {/* Row 1 */}
        <div className="grid grid-cols-5 gap-2">
          {/* 1. NEW BRANDS */}
          <div
            onClick={() => navigate('/shop?filter=new')}
            className="bg-gradient-to-b from-[#EED3B0] via-[#E7C498] to-[#DAAF7C] rounded-xl p-1 text-center flex flex-col items-center justify-center border border-[#CBA06B] shadow-2xs h-[74px] cursor-pointer active:scale-95 transition-transform"
          >
            <span className="font-serif font-black text-[9.5px] text-[#5C1D13] leading-tight uppercase">NEW<br/>BRANDS</span>
            <span className="text-[7px] text-slate-700 font-bold mt-0.5 whitespace-nowrap">Just Launched</span>
          </div>

          {/* 2. BEST SELLERS */}
          <div
            onClick={() => navigate('/shop?sellingType=best-sellers')}
            className="bg-gradient-to-b from-[#EED3B0] via-[#E7C498] to-[#DAAF7C] rounded-xl p-1 text-center flex flex-col items-center justify-center border border-[#CBA06B] shadow-2xs h-[74px] cursor-pointer active:scale-95 transition-transform"
          >
            <span className="font-serif font-black text-[9.5px] text-[#5C1D13] leading-tight uppercase">BEST<br/>SELLERS</span>
            <span className="text-[7px] text-slate-700 font-bold mt-0.5 whitespace-nowrap">Popular Picks</span>
          </div>

          {/* 3. FRESH DROPS */}
          <div
            onClick={() => navigate('/shop?sellingType=new-arrivals')}
            className="bg-gradient-to-b from-[#EED3B0] via-[#E7C498] to-[#DAAF7C] rounded-xl p-1 text-center flex flex-col items-center justify-center border border-[#CBA06B] shadow-2xs h-[74px] cursor-pointer active:scale-95 transition-transform"
          >
            <span className="font-serif font-black text-[9.5px] text-[#5C1D13] leading-tight uppercase">FRESH<br/>DROPS</span>
            <span className="text-[7px] text-slate-700 font-bold mt-0.5 whitespace-nowrap">New Collection</span>
          </div>

          {/* 4. Exclusive */}
          <div
            onClick={() => navigate('/shop?category=Exclusive')}
            className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xs h-[74px] relative flex flex-col items-center justify-between p-1 cursor-pointer active:scale-95 transition-transform"
          >
            <img 
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300" 
              alt="Exclusive" 
              className="w-full h-10 object-cover rounded-md"
            />
            <span className="text-[8.5px] font-bold text-slate-800 truncate w-full text-center">Exclusive</span>
          </div>

          {/* 5. Bags & Accessories */}
          <div
            onClick={() => navigate('/shop?category=Accessories')}
            className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xs h-[74px] relative flex flex-col items-center justify-between p-1 cursor-pointer active:scale-95 transition-transform"
          >
            <img 
              src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300" 
              alt="Bags" 
              className="w-full h-10 object-cover rounded-md"
            />
            <span className="text-[8px] font-bold text-slate-800 truncate w-full text-center">Bags & Acc.</span>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-5 gap-2">
          {/* 1. KARVIYAM TREND */}
          <div
            onClick={() => navigate('/shop?filter=trending')}
            className="bg-gradient-to-b from-[#EED3B0] via-[#E7C498] to-[#DAAF7C] rounded-xl p-1 text-center flex flex-col items-center justify-center border border-[#CBA06B] shadow-2xs h-[74px] cursor-pointer active:scale-95 transition-transform"
          >
            <span className="text-[7.5px] font-black text-[#B71C1C] uppercase tracking-wider">KARVIYAM</span>
            <span className="font-serif font-black text-[10px] text-slate-900 leading-tight uppercase">TREND</span>
            <span className="text-[7px] text-slate-700 font-bold mt-0.5">Karviyam Trend</span>
          </div>

          {/* 2. Fandom */}
          <div
            onClick={() => navigate('/shop?category=Ethnic')}
            className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xs h-[74px] relative flex flex-col items-center justify-between p-1 cursor-pointer active:scale-95 transition-transform"
          >
            <img 
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300" 
              alt="Fandom" 
              className="w-full h-10 object-cover rounded-md"
            />
            <span className="text-[8.5px] font-bold text-slate-800 truncate w-full text-center">Fandom</span>
          </div>

          {/* 3. FINAL CALL / CLEARANCE */}
          <div
            onClick={() => navigate('/shop?filter=clearance')}
            className="bg-gradient-to-b from-[#EED3B0] via-[#E7C498] to-[#DAAF7C] rounded-xl p-1 text-center flex flex-col items-center justify-center border border-[#CBA06B] shadow-2xs h-[74px] relative cursor-pointer active:scale-95 transition-transform overflow-hidden"
          >
            <div className="bg-[#B71C1C] text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter mb-0.5">
              CLEARANCE SALE
            </div>
            <span className="text-[7px] text-slate-800 font-bold">Final Call</span>
          </div>

          {/* 4. Top Brands */}
          <div
            onClick={() => navigate('/shop?filter=top-brands')}
            className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xs h-[74px] relative flex flex-col items-center justify-between p-1 cursor-pointer active:scale-95 transition-transform"
          >
            <img 
              src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300" 
              alt="Top Brands" 
              className="w-full h-10 object-cover rounded-md"
            />
            <span className="text-[8.5px] font-bold text-slate-800 truncate w-full text-center">Top Brands</span>
          </div>

          {/* 5. Home & Living */}
          <div
            onClick={() => navigate('/shop?category=Home')}
            className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xs h-[74px] relative flex flex-col items-center justify-between p-1 cursor-pointer active:scale-95 transition-transform"
          >
            <img 
              src="https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=300" 
              alt="Home & Living" 
              className="w-full h-10 object-cover rounded-md"
            />
            <span className="text-[8px] font-bold text-slate-800 truncate w-full text-center">Home & Living</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. UNREAL DEAL / COUNTDOWN STRIP (Reference Style)        */}
      {/* ========================================================= */}
      <div className="mx-3.5 my-2.5 bg-[#FFF8EE] border border-[#F5E2C4] rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
          <span className="font-black text-xs text-slate-900 uppercase tracking-tight">
            UNREAL DEAL ENDING IN
          </span>
        </div>

        {/* Timer Box */}
        <div className="flex items-center gap-1 font-mono">
          <div className="bg-[#D32F2F] text-white font-black text-xs px-1.5 py-0.5 rounded shadow-2xs">
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <span className="text-[10px] font-bold text-slate-700">m</span>
          <div className="bg-[#D32F2F] text-white font-black text-xs px-1.5 py-0.5 rounded shadow-2xs">
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <span className="text-[10px] font-bold text-slate-700">s</span>
        </div>

        {/* Shop Now Button */}
        <button
          type="button"
          onClick={() => navigate('/shop?filter=deals')}
          className="bg-[#8B0000] hover:bg-[#700000] text-white text-[9.5px] font-black px-3 py-1 rounded-full uppercase tracking-wider cursor-pointer shadow-2xs flex items-center gap-0.5 active:scale-95 transition-transform"
        >
          <span>SHOP NOW</span>
          <span>→</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 6. FEATURED FOR YOU PRODUCT SECTION (Reference Style)     */}
      {/* ========================================================= */}
      <div className="px-3.5 my-3">
        <div className="w-full bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">
              Featured For You
            </h2>
            <button
              onClick={() => navigate('/shop')}
              className="text-xs font-bold text-[#007185] hover:text-[#C7511F] cursor-pointer flex items-center gap-0.5"
            >
              <span>View All</span>
              <span>&gt;</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 w-full flex-nowrap snap-x snap-mandatory">
            {recommendedProducts.map((prod, idx) => renderProductCard(prod, idx))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. BEST SELLERS PRODUCT SECTION (Reference Style)          */}
      {/* ========================================================= */}
      <div className="px-3.5 my-3">
        <div className="w-full bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">
              Best Sellers
            </h2>
            <button
              onClick={() => navigate('/shop?sellingType=best-sellers')}
              className="text-xs font-bold text-[#007185] hover:text-[#C7511F] cursor-pointer flex items-center gap-0.5"
            >
              <span>View All</span>
              <span>&gt;</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 w-full flex-nowrap snap-x snap-mandatory">
            {recommendedProducts.slice().reverse().map((prod, idx) => renderProductCard(prod, idx + 100))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 8. DYNAMIC ADMIN HOMEPAGE SECTIONS IN CONFIG ORDER         */}
      {/* ========================================================= */}
      {Array.isArray(homepageSections) && homepageSections.map((sec) => {
        if (!sec || sec.enabled === false || !Array.isArray(sec.products) || sec.products.length === 0) return null;
        
        const mobMaxCount = Number(sec.mobile_product_count) || 6;
        const displayProds = sec.products.slice(0, mobMaxCount);

        return (
          <div key={sec.id || sec.section_key} className="px-3.5 my-3">
            <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">{sec.title}</h3>
                  {sec.subtitle && <p className="text-[10px] text-slate-500 font-medium">{sec.subtitle}</p>}
                </div>
                {sec.show_view_all !== false && (
                  <button
                    type="button"
                    onClick={() => navigate(sec.view_all_link || '/shop')}
                    className="text-xs font-bold text-[#007185] hover:text-[#C7511F] cursor-pointer flex items-center gap-0.5"
                  >
                    <span>{sec.view_all_text || 'View All >'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 w-full flex-nowrap snap-x snap-mandatory">
                {displayProds.map((prod, idx) => renderProductCard(prod, idx))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Bottom padding ensures content scrolls cleanly above fixed bottom navigation bar */}
      <div className="h-8" />
    </div>
  );
}
