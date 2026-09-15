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

const DEFAULT_MOBILE_SECTIONS = [
  { id: 'parent_categories', title: 'Quick Categories', subtitle: '', enabled: true, layout: 'horizontal', order: 1 },
  { id: 'hero_banners', title: 'Promotional Banners', subtitle: '', enabled: true, layout: 'horizontal', order: 2 },
  { id: 'trust_badges', title: 'Trust & Delivery Badges', subtitle: '', enabled: true, layout: 'horizontal', order: 3 },
  { id: 'categories_style', title: 'Shop Your Style', subtitle: '', enabled: true, layout: 'horizontal', order: 4 },
  { id: 'flash_picks', title: 'Flash Picks', subtitle: 'Ends in 02 : 41 : 36', enabled: true, layout: 'horizontal', order: 5 },
  { id: 'complete_look', title: 'Complete The Look', subtitle: 'Curated combos for you', enabled: true, layout: 'horizontal', order: 6 },
  { id: 'shop_by_occasion', title: 'Shop by Occasion', subtitle: '', enabled: true, layout: 'horizontal', order: 7 },
  { id: 'find_your_price', title: 'Find Your Price', subtitle: '', enabled: true, layout: 'horizontal', order: 8 },
  { id: 'recommended', title: 'Recommended For You', subtitle: '', enabled: true, layout: 'horizontal', order: 9 },
  { id: 'trending', title: 'Trending Now', subtitle: 'Popular styles customers are loving', enabled: true, layout: 'vertical', order: 10 },
  { id: 'new_arrivals', title: 'New Arrivals', subtitle: 'Explore the latest fashion collections', enabled: true, layout: 'horizontal', order: 11 },
  { id: 'best_sellers', title: 'Best Sellers', subtitle: 'Top rated favorites loved by everyone', enabled: true, layout: 'vertical', order: 12 },
  { id: 'continue_shopping', title: 'Continue Shopping', subtitle: '', enabled: true, layout: 'horizontal', order: 13 }
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
  
  // Product States (Direct from Backend Database)
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  
  // Admin Dynamic Configuration
  const [mobileSectionsList, setMobileSectionsList] = useState(DEFAULT_MOBILE_SECTIONS);
  const [homepageSections, setHomepageSections] = useState([]);
  
  // Touch Swipe Gesture State for Hero Banner
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Real-Time Countdown Deal Timer State
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
    window.addEventListener('karviyam_parent_categories_updated', loadAllMobileData);
    window.addEventListener('karviyam_homepage_sections_updated', loadAllMobileData);
    window.addEventListener('karviyam_mobile_homepage_updated', loadAllMobileData);
    window.addEventListener('karviyam_settings_updated', loadAllMobileData);
    window.addEventListener('focus', handleFocusOrVisible);
    window.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      window.removeEventListener('karviyam_products_updated', loadAllMobileData);
      window.removeEventListener('karviyam_banners_updated', loadAllMobileData);
      window.removeEventListener('karviyam_categories_updated', loadAllMobileData);
      window.removeEventListener('karviyam_parent_categories_updated', loadAllMobileData);
      window.removeEventListener('karviyam_homepage_sections_updated', loadAllMobileData);
      window.removeEventListener('karviyam_mobile_homepage_updated', loadAllMobileData);
      window.removeEventListener('karviyam_settings_updated', loadAllMobileData);
      window.removeEventListener('focus', handleFocusOrVisible);
      window.removeEventListener('visibilitychange', handleFocusOrVisible);
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
      // 1. Fetch Dynamic Admin Mobile Homepage Sections Configuration from MySQL Settings
      try {
        const resSettings = await api.get('/settings').catch(() => null);
        const settingsMap = resSettings?.data?.data || resSettings?.data || {};
        const mobData = settingsMap?.karviyam_mobile_homepage_sections || settingsMap?.mobile_homepage_sections;
        if (mobData) {
          const parsed = typeof mobData === 'string' ? JSON.parse(mobData) : mobData;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const sorted = [...parsed].sort((a, b) => (Number(a.order || a.position) || 0) - (Number(b.order || b.position) || 0));
            setMobileSectionsList(sorted);
          }
        }
      } catch (eSettings) {}

      // 2. Fetch Parent Categories
      try {
        const resCat = await api.get('/parent-categories').catch(() => null);
        const apiCats = resCat?.data?.data || resCat?.data || [];
        let catList = Array.isArray(apiCats) ? apiCats.filter(c => c && c.isActive !== false) : [];

        if (catList && catList.length > 0) {
          const formatted = catList.map(c => ({
            id: c.id,
            name: c.name || '',
            label: c.name || '',
            image: resolveImageUrl(c.imageUrl || c.image_url || c.imagePath || c.image, c.id),
            link: c.link || `/shop?category=${encodeURIComponent(c.name)}`
          }));
          setCategories(formatted);
        } else {
          setCategories([]);
        }
      } catch (eCat) {
        setCategories([]);
      }

      // 3. Fetch Hero Banners
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
          setBanners([]);
        }
      } catch (eBanners) {
        setBanners([]);
      }

      // 4. Fetch Products directly from Production Backend APIs
      try {
        const [featRes, newRes, allRes] = await Promise.all([
          api.get('/products/featured').catch(() => null),
          api.get('/products/new-arrivals').catch(() => null),
          api.get('/products?size=50').catch(() => null)
        ]);

        const featData = featRes?.data?.data || featRes?.data || [];
        const featList = Array.isArray(featData) ? featData : (Array.isArray(featData?.content) ? featData.content : []);

        const newData = newRes?.data?.data || newRes?.data || [];
        const newList = Array.isArray(newData) ? newData : (Array.isArray(newData?.content) ? newData.content : []);

        const allData = allRes?.data?.data || allRes?.data || [];
        const allList = Array.isArray(allData?.content) ? allData.content : (Array.isArray(allData) ? allData : []);

        const formatProductList = (items) => (items || []).filter(p => p && p.isActive !== false).map((p, idx) => {
          const rawImage = p.imageUrl || p.image_url || p.imagePath || p.image || (Array.isArray(p.images) && p.images[0]) || '';
          const price = Number(p.price) || 0;
          const oldPrice = Number(p.oldPrice || p.old_price || p.mrp || Math.round(price * 1.35));
          const disc = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 25;

          return {
            id: p.id,
            name: p.name || 'Karviyam Apparel',
            brand: p.brand || 'KARVIYAM',
            rating: p.rating || 4.5,
            price: price,
            oldPrice: oldPrice,
            discount: `${disc}% OFF`,
            image: resolveImageUrl(rawImage, p.id || idx)
          };
        });

        const formattedFeat = formatProductList(featList.length > 0 ? featList : allList);
        const formattedNew = formatProductList(newList.length > 0 ? newList : allList);
        const formattedAll = formatProductList(allList);

        setRecommendedProducts(formattedFeat);
        setNewArrivals(formattedNew);
        setTrendingProducts(formattedAll.length > 6 ? formattedAll.slice(6) : formattedAll);
        setBestSellers(formattedAll.length > 0 ? formattedAll : formattedFeat);
      } catch (eRec) {
        setRecommendedProducts([]);
        setNewArrivals([]);
        setTrendingProducts([]);
        setBestSellers([]);
      }

      // 5. Fetch Dynamic Admin Homepage Sections Configuration (/homepage-sections)
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
      setCurrentBannerIdx(prev => (prev + 1) % banners.length);
    } else if (touchEndX.current - touchStartX.current > 50) {
      setCurrentBannerIdx(prev => (prev - 1 + banners.length) % banners.length);
    }
  };

  // Render Product Card Item
  const renderProductCard = (prod, idx, isGrid = false) => {
    const isWish = isInWishlist(prod.id);
    const prodImg = resolveImageUrl(prod.image || prod.imageUrl || (Array.isArray(prod.images) ? prod.images[0] : ''), prod.id || idx);

    return (
      <div
        key={prod.id || idx}
        onClick={() => navigate(`/product/${prod.id}`)}
        className={
          isGrid
            ? "w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-2 relative flex flex-col justify-between overflow-hidden cursor-pointer group transition-all"
            : "w-[152px] sm:w-[168px] min-w-[152px] shrink-0 snap-start bg-white rounded-xl border border-slate-200/90 shadow-2xs p-2 relative flex flex-col justify-between overflow-hidden cursor-pointer group transition-all"
        }
      >
        {prod.discount && (
          <span className="absolute top-2 left-2 bg-[#D32F2F] text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tight shadow-2xs z-10">
            {prod.discount}
          </span>
        )}

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

        <div className="w-full h-[130px] rounded-lg overflow-hidden flex items-center justify-center mb-1.5 relative shrink-0 bg-transparent">
          <img
            src={prodImg}
            alt={prod.name}
            onError={(e) => handleImageError(e, prod.id || idx)}
            className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

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

  // Render Product Section Wrapper based on Admin-configured layout and title
  const renderProductSectionWrapper = (secId, title, subtitle, products, layoutMode = 'horizontal') => {
    if (!products || products.length === 0) return null;
    const isGrid = layoutMode === 'vertical' || layoutMode === 'grid';

    return (
      <div key={secId} className="px-3.5 mt-2.5 mb-2.5 space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">{title}</h2>
            {subtitle ? <p className="text-[10px] text-slate-500 font-medium">{subtitle}</p> : null}
          </div>
          <button
            onClick={() => navigate('/shop')}
            className="text-xs font-bold text-[#007185] hover:text-[#C7511F] cursor-pointer flex items-center gap-0.5"
          >
            <span>View All</span>
            <span>&gt;</span>
          </button>
        </div>

        {isGrid ? (
          <div className="grid grid-cols-2 gap-2.5 w-full py-0.5">
            {products.map((prod, idx) => renderProductCard(prod, idx, true))}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 w-full flex-nowrap snap-x snap-mandatory">
            {products.map((prod, idx) => renderProductCard(prod, idx, false))}
          </div>
        )}
      </div>
    );
  };

  // Render Mobile Homepage Section Dynamically in Admin-Configured Order
  const renderMobileSection = (sec) => {
    if (!sec || sec.enabled === false) return null;
    const secId = sec.id;
    const secTitle = sec.title || '';
    const secSubtitle = sec.subtitle || '';
    const layoutMode = sec.layout || 'horizontal';

    switch (secId) {
      case 'parent_categories':
      case 'quick_categories':
        if (categories.length === 0) return null;
        return (
          <div key={secId} className="px-3.5 my-3">
            {secTitle && <h3 className="font-extrabold text-xs text-slate-900 mb-1.5 px-0.5">{secTitle}</h3>}
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1 w-full flex-nowrap snap-x snap-mandatory">
              {categories.map((cat, idx) => {
                const catName = (cat.name || cat.title || 'Category').toUpperCase();
                const catImage = resolveImageUrl(cat.image || cat.imageUrl || (Array.isArray(cat.images) ? cat.images[0] : ''), cat.id || idx);

                return (
                  <div
                    key={cat.id || idx}
                    onClick={() => navigate(cat.link || `/shop?category=${encodeURIComponent(cat.name || cat.title)}`)}
                    className="w-[56px] sm:w-[66px] min-w-[56px] shrink-0 snap-start flex flex-col items-center cursor-pointer active:scale-95 transition-transform group"
                  >
                    <div className="w-[54px] h-[54px] sm:w-[64px] sm:h-[64px] rounded-xl overflow-hidden bg-slate-100 shadow-2xs border border-slate-200/60 shrink-0">
                      <img
                        src={catImage}
                        alt={catName}
                        onError={(e) => handleImageError(e, cat.id || idx)}
                        className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="w-full text-center mt-1 px-0.5">
                      <p className="font-extrabold text-[8.5px] sm:text-[9px] text-slate-800 leading-tight uppercase tracking-tight truncate w-full">
                        {catName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'hero_banners':
      case 'promotional_banners':
        if (banners.length === 0) return null;
        return (
          <div key={secId} className="px-3.5 mt-3 mb-2.5">
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-full h-[190px] sm:h-[220px] rounded-2xl overflow-hidden relative shadow-md bg-slate-900 group"
            >
              <img
                src={banners[currentBannerIdx]?.image}
                alt={banners[currentBannerIdx]?.title || 'Hero Banner'}
                onError={(e) => handleImageError(e, banners[currentBannerIdx]?.id)}
                className="w-full h-full object-cover object-center transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
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
        );

      case 'trust_badges':
        return (
          <div key={secId} className="px-3.5 my-2">
            <div className="grid grid-cols-4 gap-1.5 bg-white rounded-xl p-2 border border-slate-200/80 shadow-2xs text-center">
              <div className="flex flex-col items-center">
                <Truck className="w-4 h-4 text-[#B71C1C] mb-0.5" />
                <span className="text-[8.5px] font-extrabold text-slate-800">FREE SHIPPING</span>
              </div>
              <div className="flex flex-col items-center">
                <RotateCcw className="w-4 h-4 text-[#B71C1C] mb-0.5" />
                <span className="text-[8.5px] font-extrabold text-slate-800">30 DAYS RETURN</span>
              </div>
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-4 h-4 text-[#B71C1C] mb-0.5" />
                <span className="text-[8.5px] font-extrabold text-slate-800">100% AUTHENTIC</span>
              </div>
              <div className="flex flex-col items-center">
                <Gift className="w-4 h-4 text-[#B71C1C] mb-0.5" />
                <span className="text-[8.5px] font-extrabold text-slate-800">SECURE PAY</span>
              </div>
            </div>
          </div>
        );

      case 'categories_style':
        if (categories.length === 0) return null;
        return (
          <div key={secId} className="px-3.5 my-3">
            <h2 className="font-extrabold text-sm text-slate-900 tracking-tight mb-1.5 px-0.5">{secTitle || 'Shop Your Style'}</h2>
            <div className="grid grid-cols-4 gap-2">
              {categories.slice(0, 8).map((cat, idx) => (
                <div
                  key={cat.id || idx}
                  onClick={() => navigate(cat.link || `/shop?category=${encodeURIComponent(cat.name)}`)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-800 mt-1 truncate max-w-full text-center">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'flash_picks':
        return (
          <div key={secId} className="space-y-2">
            <div className="mx-3.5 my-1 bg-[#FFF8EE] border border-[#F5E2C4] rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                <span className="font-black text-xs text-slate-900 uppercase tracking-tight">
                  {secTitle || 'UNREAL DEAL ENDING IN'}
                </span>
              </div>
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
              <button
                type="button"
                onClick={() => navigate('/shop?filter=deals')}
                className="bg-[#8B0000] hover:bg-[#700000] text-white text-[9.5px] font-black px-3 py-1 rounded-full uppercase tracking-wider cursor-pointer shadow-2xs flex items-center gap-0.5 active:scale-95 transition-transform"
              >
                <span>SHOP NOW</span>
                <span>→</span>
              </button>
            </div>
            {renderProductSectionWrapper(secId, secTitle, secSubtitle, recommendedProducts.slice(0, 6), layoutMode)}
          </div>
        );

      case 'complete_look':
        return renderProductSectionWrapper(secId, secTitle || 'Complete The Look', secSubtitle || 'Curated combos for you', newArrivals.slice(0, 6), layoutMode);

      case 'shop_by_occasion':
        return (
          <div key={secId} className="px-3.5 my-3">
            <h2 className="font-extrabold text-sm text-slate-900 tracking-tight mb-1.5 px-0.5">{secTitle || 'Shop by Occasion'}</h2>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {['Casual Everyday', 'Wedding & Festive', 'Party Essentials', 'Workplace Chic'].map((occ, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(`/shop?q=${encodeURIComponent(occ)}`)}
                  className="bg-white border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-800 whitespace-nowrap shadow-2xs hover:border-[#B71C1C] hover:text-[#B71C1C] transition-colors"
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>
        );

      case 'find_your_price':
        return (
          <div key={secId} className="px-3.5 my-3">
            <h2 className="font-extrabold text-sm text-slate-900 tracking-tight mb-1.5 px-0.5">{secTitle || 'Find Your Price'}</h2>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Under ₹299', max: 299 },
                { label: 'Under ₹499', max: 499 },
                { label: 'Under ₹999', max: 999 },
                { label: 'Under ₹1999', max: 1999 }
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(`/shop?maxPrice=${p.max}`)}
                  className="bg-[#B71C1C]/5 border border-[#B71C1C]/20 p-2 rounded-xl text-center active:scale-95 transition-transform"
                >
                  <span className="font-black text-xs text-[#B71C1C] block">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'recommended':
      case 'featured':
        return renderProductSectionWrapper(secId, secTitle || 'Recommended For You', secSubtitle, recommendedProducts, layoutMode);

      case 'trending':
        return renderProductSectionWrapper(secId, secTitle || 'Trending Now', secSubtitle || 'Popular styles customers are loving', trendingProducts, layoutMode);

      case 'new_arrivals':
        return renderProductSectionWrapper(secId, secTitle || 'New Arrivals', secSubtitle || 'Explore the latest fashion collections', newArrivals, layoutMode);

      case 'best_sellers':
        return renderProductSectionWrapper(secId, secTitle || 'Best Sellers', secSubtitle || 'Top rated favorites loved by everyone', bestSellers, layoutMode);

      case 'continue_shopping':
        return renderProductSectionWrapper(secId, secTitle || 'Continue Shopping', secSubtitle, recommendedProducts.slice().reverse(), layoutMode);

      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-[#FAF7F2] text-slate-900 select-none font-sans text-left pb-4">
      {/* Dynamic Admin Mobile Homepage Sections rendered in exact Admin-configured order */}
      {mobileSectionsList.map(sec => renderMobileSection(sec))}

      {/* Additional Custom Admin Homepage Sections (/homepage-sections) */}
      {Array.isArray(homepageSections) && homepageSections.map((sec) => {
        if (!sec || sec.enabled === false || !Array.isArray(sec.products) || sec.products.length === 0) return null;
        
        const mobMaxCount = Number(sec.mobile_product_count) || 6;
        const displayProds = sec.products.slice(0, mobMaxCount);

        return (
          <div key={sec.id || sec.section_key} className="px-3.5 mt-2.5 mb-2.5 space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
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
        );
      })}
    </div>
  );
}
