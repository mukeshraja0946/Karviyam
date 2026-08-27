import React, { useState, useEffect } from 'react';
import HeroBanner from '../components/HeroBanner';
import CategoryCards from '../components/CategoryCards';
import MobileCategoryBar from '../components/MobileCategoryBar';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import DesktopSidebarLeft from '../components/desktop/DesktopSidebarLeft';
import DesktopCenterContent from '../components/desktop/DesktopCenterContent';
import DesktopSidebarRight from '../components/desktop/DesktopSidebarRight';
import DesktopTrustBar from '../components/desktop/DesktopTrustBar';
import api from '../utils/api';
import { resolveImageUrl } from '../utils/imageUtils';
import { Flame, Sparkles, Grid, SlidersHorizontal } from 'lucide-react';

const DEFAULT_CATEGORY_IMAGES = {
  'FASHION': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300',
  'MEN': 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300',
  'WOMEN': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300',
  'T-SHIRTS': 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300',
  'SNEAKERS': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300',
  'KURTA SETS': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300',
  'JEWELLERY': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300',
  'JEWELS': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300',
  'ACCESSORIES': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
  'KITCHEN & HOME': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300',
  'UNISEX': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300'
};

const DEFAULT_CATEGORY_PLACEHOLDER = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const getInitialViewMode = () => {
    try {
      const saved = localStorage.getItem('karviyam_section_layouts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.recommended) return parsed.recommended;
      }
    } catch (e) {}
    return 'grid';
  };

  const [mobileViewMode, setMobileViewMode] = useState(getInitialViewMode);
  const [mobileBannerIndex, setMobileBannerIndex] = useState(0);
  const [mobileBanners, setMobileBanners] = useState([]);
  const [homeCategories, setHomeCategories] = useState([]);

  const syncLayoutSettings = () => {
    try {
      const saved = localStorage.getItem('karviyam_section_layouts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.recommended) {
          setMobileViewMode(parsed.recommended);
        }
      }
    } catch (e) {}
  };

  const fetchBanners = async () => {
    try {
      const res = await api.get('/banners').catch(() => null);
      const apiData = res?.data ? res.data : res;
      const rawData = apiData?.data !== undefined ? apiData.data : apiData;

      let list = [];
      if (Array.isArray(rawData)) {
        list = rawData;
      } else if (rawData && typeof rawData === 'object' && Array.isArray(rawData.banners)) {
        list = rawData.banners;
      }

      if (Array.isArray(list)) {
        const activeBanners = list.filter(b => b && b.isActive !== false && String(b.status).toLowerCase() === 'active');
        const formatted = activeBanners.map(b => {
          const rawImg = b.imageUrl || b.imagePath || b.image || '';
          const resolvedImg = resolveImageUrl(rawImg);
          return {
            id: b.id,
            badge: b.tag || 'OFFICIAL DROP',
            title: b.title || '',
            subtitle: b.subtitle || '',
            image: resolvedImg,
            cta: b.buttonText || b.button_text || b.cta || 'SHOP NOW',
            link: b.buttonLink || b.link || '/shop'
          };
        });
        setMobileBanners(formatted);
      } else {
        setMobileBanners([]);
      }
    } catch (e) {
      console.error('Error fetching mobile banners in HomePage:', e);
      setMobileBanners([]);
    }
  };

  const fetchHomeCategories = async () => {
    try {
      const res = await api.get('/parent-categories').catch(() => null);
      const apiData = res?.data?.data || res?.data;
      let list = Array.isArray(apiData) ? apiData : [];

      if (!list || list.length === 0) {
        try {
          const saved = localStorage.getItem('karviyam_admin_parent_categories');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) list = parsed.filter(c => c.isActive !== false);
          }
        } catch (eSaved) {}
      }

      if (list && list.length > 0) {
        const formatted = list.map(c => {
          const resolvedImg = resolveImageUrl(c.imageUrl || c.imagePath);
          const linkStr = c.link || `/shop?category=${encodeURIComponent(c.name)}`;
          const queryStr = linkStr.includes('?') ? linkStr.split('?')[1] : `category=${encodeURIComponent(c.name)}`;
          return {
            id: c.id,
            name: c.name,
            image: resolvedImg,
            query: queryStr,
            link: linkStr
          };
        });
        setHomeCategories(formatted);
      }
    } catch (e) {
      console.error('Error fetching home categories in HomePage:', e);
    }
  };

  useEffect(() => {
    if (mobileBanners.length === 0) {
      setMobileBannerIndex(0);
      return;
    }
    setMobileBannerIndex(0);
    if (mobileBanners.length <= 1) return;

    const timer = setInterval(() => {
      setMobileBannerIndex((prev) => (prev + 1) % mobileBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [mobileBanners.length]);

  useEffect(() => {
    fetchHomeProducts();
    fetchBanners();
    fetchHomeCategories();
    syncLayoutSettings();
    window.addEventListener('karviyam_products_updated', fetchHomeProducts);
    window.addEventListener('karviyam_banners_updated', fetchBanners);
    window.addEventListener('karviyam_categories_updated', fetchHomeCategories);
    window.addEventListener('karviyam_parent_categories_updated', fetchHomeCategories);
    window.addEventListener('karviyam_section_layouts_updated', syncLayoutSettings);
    window.addEventListener('storage', () => {
      fetchHomeProducts();
      fetchHomeCategories();
      syncLayoutSettings();
    });
    return () => {
      window.removeEventListener('karviyam_products_updated', fetchHomeProducts);
      window.removeEventListener('karviyam_banners_updated', fetchBanners);
      window.removeEventListener('karviyam_categories_updated', fetchHomeCategories);
      window.removeEventListener('karviyam_parent_categories_updated', fetchHomeCategories);
      window.removeEventListener('karviyam_section_layouts_updated', syncLayoutSettings);
    };
  }, []);

  const fetchHomeProducts = async () => {
    setLoading(true);
    try {
      const [featRes, newRes] = await Promise.all([
        api.get('/products/featured'),
        api.get('/products/new-arrivals')
      ]);

      const featData = featRes.data ? featRes.data : featRes;
      const featList = Array.isArray(featData.data) ? featData.data : (Array.isArray(featData) ? featData : []);
      
      const newData = newRes.data ? newRes.data : newRes;
      const newList = Array.isArray(newData.data) ? newData.data : (Array.isArray(newData) ? newData : []);

      if (featList.length > 0) {
        setFeaturedProducts(featList);
      } else {
        const fallbackRes = await api.get('/products?size=6');
        const fbData = fallbackRes.data ? fallbackRes.data : fallbackRes;
        const pageObj = fbData.data || fbData;
        const items = Array.isArray(pageObj?.content) ? pageObj.content : (Array.isArray(pageObj) ? pageObj : []);
        setFeaturedProducts(items);
      }

      if (newList.length > 0) {
        setNewArrivals(newList);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Ensure fallback list has exactly 6 products max
  const DEFAULT_REC_PRODUCTS = [
    { id: 1, name: 'Men Solid Polo T-Shirt', brand: 'KARVIYAM', price: 699, oldPrice: 1299, discount: '46% OFF', rating: 4.5, reviewsCount: 1200, imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400' },
    { id: 2, name: 'Zari Border Silk Saree', brand: 'KARVIYAM', price: 1299, oldPrice: 2499, discount: '48% OFF', rating: 4.6, reviewsCount: 980, imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400' },
    { id: 3, name: 'Printed Oversized T-Shirt', brand: 'KARVIYAM', price: 599, oldPrice: 999, discount: '40% OFF', rating: 4.3, reviewsCount: 750, imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400' },
    { id: 4, name: 'Running Sneakers', brand: 'KARVIYAM', price: 1499, oldPrice: 2499, discount: '40% OFF', rating: 4.6, reviewsCount: 1100, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
    { id: 5, name: 'Cotton Kurta Set', brand: 'KARVIYAM', price: 899, oldPrice: 1599, discount: '44% OFF', rating: 4.4, reviewsCount: 620, imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400' },
    { id: 6, name: 'Kids Printed Shirt', brand: 'KARVIYAM', price: 499, oldPrice: 799, discount: '38% OFF', rating: 4.5, reviewsCount: 430, imageUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400' }
  ];

  const displayRecommendedProducts = (
    featuredProducts.length >= 6
      ? featuredProducts.slice(0, 6)
      : [...featuredProducts, ...DEFAULT_REC_PRODUCTS.slice(featuredProducts.length)].slice(0, 6)
  );

  return (
    <div>
      {/* ========================================================= */}
      {/* DESKTOP HOMEPAGE LAYOUT (>= 1024px / lg)                   */}
      {/* MATCHES REFERENCE SPECIFICATION EXACTLY                    */}
      {/* ========================================================= */}
      <div className="hidden lg:block py-3 bg-[#FAFAFA] min-h-screen">
        <div className="max-w-[1560px] w-full mx-auto px-3 sm:px-4 flex justify-center items-start gap-3 xl:gap-4">
          {/* Column 1: Left Sidebar */}
          <DesktopSidebarLeft />

          {/* Column 2: Center Content */}
          <DesktopCenterContent />

          {/* Column 3: Right Column */}
          <DesktopSidebarRight />
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE HOMEPAGE LAYOUT (< 1024px / lg)                     */}
      {/* STRICT REBUILD MATCHING REFERENCE IMAGE SPECIFICATIONS     */}
      {/* ========================================================= */}
      <div className="block lg:hidden bg-slate-50/60 pb-3">
        
        {/* 1. CATEGORY SHORTCUTS (Horizontal Squircle Cards) */}
        <div className="w-full bg-white py-3 px-3.5 border-b border-slate-100 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3.5 whitespace-nowrap">
            {(homeCategories.length > 0 ? homeCategories : [
              { id: 'fashion', name: 'Fashion', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300', query: 'category=Women' },
              { id: 'tshirts', name: 'T-Shirts', query: 'category=Men', image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300' },
              { id: 'sneakers', name: 'Sneakers', query: 'category=Unisex', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300' },
              { id: 'kurta', name: 'Kurta Sets', query: 'category=Women', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300' },
              { id: 'jewels', name: 'Jewellery', query: 'category=Jewellery', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300' }
            ]).map((cat, idx) => (
              <div
                key={cat.id || idx}
                onClick={() => window.location.href = `/shop${cat.query ? `?${cat.query}` : ''}`}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-100 border border-slate-200/80 p-0.5 overflow-hidden flex items-center justify-center shadow-2xs group-active:scale-95 transition-transform">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <span className={`text-[10px] font-bold tracking-tight truncate max-w-[72px] ${idx === 0 ? 'text-[#B71C1C] font-extrabold' : 'text-slate-700'}`}>
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. COUPON BANNER */}
        <div className="mx-3.5 my-3 rounded-2xl bg-gradient-to-r from-pink-100 via-rose-50 to-pink-100 border border-pink-200/90 p-3.5 shadow-2xs flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <div>
              <h3 className="font-display font-black text-lg text-rose-700 leading-tight">
                Get 25% Off
              </h3>
              <p className="text-xs font-extrabold text-slate-800">
                Up To ₹200 Off*
              </p>
            </div>

            {/* Coupon Code Pill */}
            <div className="flex items-center gap-2">
              <div className="bg-white/90 border border-dashed border-rose-300 rounded-xl px-2.5 py-1 text-[10px] font-black text-slate-800 shadow-2xs flex items-center gap-1">
                <span className="text-slate-400 font-medium">COUPON CODE</span>
                <span className="text-slate-900 font-extrabold">KARVIYAM25</span>
              </div>
              <div className="w-9 h-9 rounded-2xl bg-rose-200/80 border border-rose-300 text-rose-700 flex items-center justify-center font-black text-sm shadow-2xs">
                %
              </div>
            </div>
          </div>

          <p className="text-[9px] text-slate-500 font-medium z-10">
            *On your first order | T&C apply
          </p>
        </div>

        {/* 3. HERO BANNER & CAROUSEL INDICATORS */}
        {mobileBanners.length > 0 && (
          <div className="mx-3.5 my-2.5">
            <div className="w-full rounded-2xl overflow-hidden relative shadow-md bg-slate-950 h-[180px] sm:h-[220px] text-white p-5 flex flex-col justify-center transition-all duration-700">
              {/* Model Image Overlay with smooth fade */}
              <div
                key={mobileBanners[mobileBannerIndex]?.id || mobileBannerIndex}
                className="absolute inset-0 bg-cover bg-center opacity-65 transition-all duration-700"
                style={{
                  backgroundImage: `url("${resolveImageUrl(mobileBanners[mobileBannerIndex]?.image, mobileBanners[mobileBannerIndex]?.id)}")`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent" />
              </div>

              <div className="relative z-10 max-w-[220px]">
                <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
                  {mobileBanners[mobileBannerIndex]?.badge || 'OFFICIAL DROP'}
                </span>
                <h2 className="font-display font-black text-xl sm:text-2xl leading-tight text-white tracking-tight mt-1.5 drop-shadow-sm whitespace-pre-line">
                  {mobileBanners[mobileBannerIndex]?.title}
                </h2>
                <p className="text-[10px] text-slate-200 font-medium mt-1">
                  {mobileBanners[mobileBannerIndex]?.subtitle}
                </p>
                <button
                  onClick={() => window.location.href = mobileBanners[mobileBannerIndex]?.link || '/shop'}
                  className="mt-2.5 bg-white text-slate-900 font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-full hover:bg-amber-300 transition-colors shadow-md cursor-pointer"
                >
                  {mobileBanners[mobileBannerIndex]?.cta || 'SHOP NOW'}
                </button>
              </div>
            </div>

            {/* Interactive Carousel Indicator Dots Directly Below */}
            {mobileBanners.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-2.5 mb-3">
                {mobileBanners.map((banner, idx) => (
                  <button
                    key={banner.id || idx}
                    onClick={() => setMobileBannerIndex(idx)}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      idx === mobileBannerIndex
                        ? 'w-6 h-1.5 bg-[#B71C1C]'
                        : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                    title={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. BEST DEALS FOR YOU */}
        <div className="w-full my-3">
          <div className="px-3.5 mb-2">
            <h2 className="font-display font-black text-sm text-slate-900 tracking-tight">
              Best Deals For You
            </h2>
          </div>

          {/* Horizontal Scrolling Deal Pills */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar px-3.5 py-1">
            <div
              onClick={() => window.location.href = '/shop'}
              className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 rounded-full px-3 py-1.5 text-xs font-bold text-slate-900 shrink-0 cursor-pointer shadow-2xs"
            >
              <span>🟡</span> <span>UNDER ₹499</span>
            </div>

            <div
              onClick={() => window.location.href = '/shop'}
              className="flex items-center gap-1.5 bg-purple-50 border border-purple-200/80 rounded-full px-3 py-1.5 text-xs font-bold text-slate-900 shrink-0 cursor-pointer shadow-2xs"
            >
              <span>💜</span> <span>DEAL OF THE DAY</span>
            </div>

            <div
              onClick={() => window.location.href = '/shop'}
              className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 rounded-full px-3 py-1.5 text-xs font-bold text-slate-900 shrink-0 cursor-pointer shadow-2xs"
            >
              <span>🟢</span> <span>WHAT'S NEW</span>
            </div>

            <div
              onClick={() => window.location.href = '/shop'}
              className="flex items-center gap-1.5 bg-orange-50 border border-orange-200/80 rounded-full px-3 py-1.5 text-xs font-bold text-slate-900 shrink-0 cursor-pointer shadow-2xs"
            >
              <span>🧡</span> <span>EXPRESS DELIVERY</span>
            </div>
          </div>
        </div>

        {/* 5. RECOMMENDED PRODUCTS (MAX 6 PRODUCTS, HORIZONTAL & VERTICAL SWIPE, COMPACT SIZE, ADMIN SYNCED) */}
        <div className="w-full my-3 px-3.5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-black text-sm text-slate-900 tracking-tight">
              Recommended for You
            </h2>

            {/* View Mode Toggle Controls (Grid vs Horizontal Swipe) */}
            <div className="flex items-center gap-1.5 bg-slate-200/60 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setMobileViewMode('grid')}
                className={`p-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                  mobileViewMode === 'grid'
                    ? 'bg-white text-[#B71C1C] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="2-Column Grid (Vertical Scroll)"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setMobileViewMode('carousel')}
                className={`p-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                  mobileViewMode === 'carousel'
                    ? 'bg-white text-[#B71C1C] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Horizontal Swipe Carousel"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {loading ? (
            <SkeletonLoader count={4} />
          ) : (
            <div
              className={
                mobileViewMode === 'grid'
                  ? 'grid grid-cols-2 gap-2.5 w-full'
                  : 'flex items-center gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory py-1 w-full'
              }
            >
              {displayRecommendedProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => window.location.href = `/product/${prod.id}`}
                  className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs p-1.5 flex flex-col justify-between overflow-hidden relative cursor-pointer group transition-all ${
                    mobileViewMode === 'carousel'
                      ? 'w-[155px] min-w-[155px] max-w-[155px] h-[215px] min-h-[215px] max-h-[215px] shrink-0 snap-start'
                      : 'w-full h-[215px] min-h-[215px] max-h-[215px]'
                  }`}
                >
                  {/* Product Image Area - Pure White (No Grey Box) */}
                  <div className="relative w-full h-[120px] bg-white rounded-lg overflow-hidden flex items-center justify-center p-1.5 shrink-0">
                    <img
                      src={prod.imageUrl || prod.image}
                      alt={prod.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />

                    {/* Wishlist Heart Overlay */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/95 text-slate-700 hover:text-[#B71C1C] flex items-center justify-center shadow-2xs border border-slate-200/60"
                    >
                      <svg className="w-3 h-3 stroke-current fill-none" viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  {/* Content Area - Tight Compact Spacing */}
                  <div className="flex-1 flex flex-col justify-between pt-1 px-0.5">
                    <div>
                      {/* Mini Brand Tag */}
                      <span className="text-[8px] font-extrabold uppercase tracking-wider text-[#B71C1C] block">
                        🌸 KARVIYAM
                      </span>

                      {/* Product Title */}
                      <h3 className="font-bold text-[11px] text-slate-900 leading-snug truncate mt-0.5 group-hover:text-[#B71C1C] transition-colors" title={prod.name}>
                        {prod.name}
                      </h3>

                      {/* Rating & Reviews */}
                      <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold mt-0.5">
                        <span className="text-slate-900 font-black">{prod.rating || 4.5}</span>
                        <span className="text-amber-400">★</span>
                        <span className="text-slate-400">({prod.reviewsCount || '1.2k'})</span>
                      </div>
                    </div>

                    {/* Price & Add to Bag Row */}
                    <div className="flex items-end justify-between pt-0.5">
                      <div className="flex items-baseline gap-1">
                        <span className="font-black text-[11px] text-slate-900">
                          ₹{prod.price}
                        </span>
                        {(prod.oldPrice || 1299) > prod.price && (
                          <span className="text-[8.5px] text-slate-400 line-through">
                            ₹{prod.oldPrice || 1299}
                          </span>
                        )}
                        <span className="text-[8px] font-extrabold text-emerald-700">
                          {prod.discount || '46% OFF'}
                        </span>
                      </div>

                      {/* Add to Bag Icon Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="w-6 h-6 rounded-lg border border-red-200 text-[#B71C1C] bg-red-50/60 hover:bg-[#B71C1C] hover:text-white flex items-center justify-center transition-colors shadow-2xs shrink-0"
                      >
                        <svg className="w-3 h-3 stroke-current fill-none" viewBox="0 0 24 24">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round" />
                          <path d="M16 10a4 4 0 0 1-8 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
