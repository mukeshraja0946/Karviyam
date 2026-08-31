import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';
import { Flame, Sparkles, Grid, SlidersHorizontal, Plus, ArrowRight } from 'lucide-react';

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
  const [mobileBannerSpeed, setMobileBannerSpeed] = useState(5000);
  const [mobileAutoScroll, setMobileAutoScroll] = useState(true);
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
      let currentAuto = true;
      let currentSpeed = 5000;

      const res = await api.get('/banners').catch(() => null);
      const apiData = res?.data ? res.data : res;
      const rawData = apiData?.data !== undefined ? apiData.data : apiData;

      let list = [];
      if (Array.isArray(rawData)) {
        list = rawData;
      } else if (rawData && typeof rawData === 'object') {
        if (Array.isArray(rawData.banners)) list = rawData.banners;
        if (rawData.autoScroll !== undefined) currentAuto = Boolean(rawData.autoScroll);
        if (rawData.speed !== undefined) currentSpeed = Number(rawData.speed);
      }

      setMobileAutoScroll(currentAuto);
      setMobileBannerSpeed(currentSpeed);

      if (Array.isArray(list)) {
        const activeBanners = list.filter(b => b && b.isActive !== false && String(b.status || 'active').toLowerCase() === 'active');
        const formatted = activeBanners.map(b => {
          const rawImg = b.mobileImageUrl || b.imageUrl || b.imagePath || b.image || '';
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
          const rawImg = c.imageUrl || c.image_url || c.imagePath || c.image || '';
          const resolvedImg = resolveImageUrl(rawImg, c.id);
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
    if (mobileBannerIndex >= mobileBanners.length) {
      setMobileBannerIndex(0);
    }
    if (!mobileAutoScroll || mobileBanners.length <= 1) return;

    const timer = setInterval(() => {
      setMobileBannerIndex((prev) => (prev + 1) % mobileBanners.length);
    }, mobileBannerSpeed);
    return () => clearInterval(timer);
  }, [mobileBanners.length, mobileAutoScroll, mobileBannerSpeed, mobileBannerIndex]);

  useEffect(() => {
    fetchHomeProducts();
    fetchBanners();
    fetchHomeCategories();
    syncLayoutSettings();

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchBanners();
        fetchHomeProducts();
      }
    };

    window.addEventListener('karviyam_products_updated', fetchHomeProducts);
    window.addEventListener('karviyam_banners_updated', fetchBanners);
    window.addEventListener('karviyam_categories_updated', fetchHomeCategories);
    window.addEventListener('karviyam_parent_categories_updated', fetchHomeCategories);
    window.addEventListener('karviyam_section_layouts_updated', syncLayoutSettings);
    window.addEventListener('focus', handleFocusOrVisible);
    window.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('storage', () => {
      fetchBanners();
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
      window.removeEventListener('focus', handleFocusOrVisible);
      window.removeEventListener('visibilitychange', handleFocusOrVisible);
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

  const safeFeaturedProducts = Array.isArray(featuredProducts) ? featuredProducts : [];
  const displayRecommendedProducts = (
    safeFeaturedProducts.length >= 6
      ? safeFeaturedProducts.slice(0, 6)
      : [...safeFeaturedProducts, ...DEFAULT_REC_PRODUCTS.slice(safeFeaturedProducts.length)].slice(0, 6)
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
      <div className="block lg:hidden bg-slate-50/60 pb-20 select-none">
        
        {/* 1. PARENT CATEGORY SWIPEABLE ROW (Circular Cards + MORE Card) */}
        <div className="w-full bg-white py-3 px-3.5 border-b border-slate-100 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-4 whitespace-nowrap">
            {(homeCategories.length > 0 ? homeCategories.slice(0, 5) : [
              { id: 'tshirts', name: 'T-SHIRTS', query: 'category=Men', image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300' },
              { id: 'sneakers', name: 'SNEAKERS', query: 'category=Unisex', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300' },
              { id: 'kurta', name: 'KURTA SETS', query: 'category=Women', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300' },
              { id: 'women', name: 'WOMEN', query: 'category=Women', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300' },
              { id: 'men', name: 'MEN', query: 'category=Men', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300' }
            ]).map((cat, idx) => (
              <div
                key={cat.id || idx}
                onClick={() => window.location.href = `/shop${cat.query ? `?${cat.query}` : ''}`}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-100 p-0.5 overflow-hidden flex items-center justify-center shadow-2xs group-active:scale-95 transition-transform">
                  <img
                    src={resolveImageUrl(cat.image, cat.id)}
                    alt={cat.name}
                    onError={(e) => handleImageError(e, cat.id)}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <span className="text-[10px] font-black tracking-tight text-slate-800 uppercase truncate max-w-[68px]">
                  {cat.name}
                </span>
              </div>
            ))}

            {/* MORE Card */}
            <div
              onClick={() => window.location.href = '/shop'}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs group-active:scale-95 transition-transform">
                <Plus className="w-6 h-6 text-slate-700" />
              </div>
              <span className="text-[10px] font-black tracking-tight text-slate-800 uppercase">
                MORE
              </span>
            </div>
          </div>
        </div>

        {/* 2. PROMOTIONAL BANNER CAROUSEL */}
        <div className="mx-3.5 my-3">
          <div className="w-full rounded-2xl overflow-hidden relative shadow-sm bg-gradient-to-r from-pink-200 via-rose-100 to-pink-200 border border-pink-200/80 p-4 sm:p-5 flex items-center justify-between min-h-[140px]">
            {/* Banner Left Copy */}
            <div className="max-w-[210px] space-y-1 z-10">
              <h3 className="font-display font-black text-lg sm:text-xl text-rose-950 leading-tight tracking-tight">
                {mobileBanners[mobileBannerIndex]?.title || 'Decode your perfect cleanse'}
              </h3>
              <p className="text-[11px] text-rose-800 font-semibold leading-snug">
                {mobileBanners[mobileBannerIndex]?.subtitle || 'Gentle renewing cleanser'}
              </p>
              <button
                onClick={() => window.location.href = mobileBanners[mobileBannerIndex]?.link || '/shop'}
                className="mt-2.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full transition-all shadow-sm cursor-pointer flex items-center gap-1"
              >
                <span>{mobileBanners[mobileBannerIndex]?.cta || 'Shop Now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Banner Right Image */}
            <div className="w-28 h-28 shrink-0 relative flex items-center justify-center z-10">
              <img
                src={resolveImageUrl(mobileBanners[mobileBannerIndex]?.image || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', mobileBannerIndex)}
                alt="Promo Banner"
                onError={(e) => handleImageError(e, mobileBannerIndex)}
                className="max-h-full max-w-full object-contain rounded-xl drop-shadow-md"
              />
            </div>
          </div>

          {/* Carousel Indicator Dots */}
          {mobileBanners.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {mobileBanners.map((banner, idx) => (
                <button
                  key={banner.id || idx}
                  onClick={() => setMobileBannerIndex(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    idx === mobileBannerIndex
                      ? 'w-5 h-1.5 bg-[#B71C1C]'
                      : 'w-1.5 h-1.5 bg-slate-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* 3. QUICK ACCESS CATEGORY GRID (12 Quick-Nav Items) */}
        <div className="mx-3.5 my-3 bg-white p-3.5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="grid grid-cols-6 gap-y-3.5 gap-x-2">
            {[
              { id: 1, title: 'Prime', color: 'bg-amber-100/90 text-amber-900', icon: '👑' },
              { id: 2, title: 'Gift Cards', color: 'bg-orange-100/90 text-orange-900', icon: '🎁' },
              { id: 3, title: 'Mobiles', color: 'bg-purple-100/90 text-purple-900', icon: '📱' },
              { id: 4, title: 'Rewards', color: 'bg-amber-50 text-amber-900', icon: '👑' },
              { id: 5, title: 'Deals', color: 'bg-red-100/90 text-red-900', icon: '🏷️' },
              { id: 6, title: 'Fashion', color: 'bg-pink-100/90 text-pink-900', icon: '👗' },
              { id: 7, title: 'Electronics', color: 'bg-sky-100/90 text-sky-900', icon: '💻' },
              { id: 8, title: 'Shop Live', color: 'bg-rose-100/90 text-rose-900', icon: '▶️' },
              { id: 9, title: 'Home', color: 'bg-amber-100/80 text-amber-900', icon: '🏠' },
              { id: 10, title: 'Daily Needs', color: 'bg-emerald-100/90 text-emerald-900', icon: '🛍️' },
              { id: 11, title: 'Beauty', color: 'bg-purple-200/80 text-purple-900', icon: '💄' },
              { id: 12, title: 'Travel', color: 'bg-cyan-100/90 text-cyan-900', icon: '✈️' },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => window.location.href = '/shop'}
                className="flex flex-col items-center gap-1 cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-xl shadow-2xs group-active:scale-95 transition-transform`}>
                  <span>{item.icon}</span>
                </div>
                <span className="text-[10.5px] font-bold text-slate-800 text-center tracking-tight leading-none truncate max-w-full">
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. RECOMMENDED FOR YOU SECTION (Horizontal Scroll Carousel Displaying 3 Cards Per View) */}
        <div className="w-full my-4 px-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h2 className="font-display font-black text-base text-[#0F172A] tracking-tight">
                Recommended For You
              </h2>
            </div>
            <Link to="/shop" className="text-xs font-extrabold text-[#B71C1C] hover:underline flex items-center gap-0.5">
              <span>View All</span>
              <span>→</span>
            </Link>
          </div>

          {loading ? (
            <SkeletonLoader count={3} />
          ) : (
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory py-1 w-full">
              {displayRecommendedProducts.map((prod) => {
                const prodImg = resolveImageUrl(prod.imageUrl || prod.image_url || prod.imagePath || prod.image || prod.images?.[0], prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => window.location.href = `/product/${prod.id}`}
                    className="w-[140px] sm:w-[155px] min-w-[140px] max-w-[155px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-2 relative flex flex-col justify-between overflow-hidden cursor-pointer group transition-all"
                  >
                    {/* Image Area */}
                    <div className="relative w-full h-[120px] bg-slate-50/80 rounded-xl overflow-hidden flex items-center justify-center p-1.5 shrink-0">
                      <img
                        src={prodImg}
                        alt={prod.name}
                        onError={(e) => handleImageError(e, prod.id)}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                      />

                      {/* Top-Right Wishlist Badge */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-slate-700 hover:text-[#B71C1C] flex items-center justify-center shadow-2xs border border-slate-100"
                        title="Add to Wishlist"
                      >
                        <svg className="w-3.5 h-3.5 stroke-current fill-none" viewBox="0 0 24 24">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>

                    {/* Card Content Area */}
                    <div className="flex-1 flex flex-col justify-between pt-1.5 px-0.5 space-y-1">
                      {/* Brand & Rating Row */}
                      <div className="flex items-center justify-between text-[9.5px]">
                        <span className="font-black text-[#B71C1C] uppercase tracking-wider">
                          KARVIYAM
                        </span>
                        <div className="flex items-center gap-0.5 font-bold text-amber-500">
                          <span>★</span>
                          <span className="text-slate-800 font-extrabold">{prod.rating || 4.5}</span>
                        </div>
                      </div>

                      {/* Product Title */}
                      <h3 className="font-bold text-[11px] text-slate-900 leading-snug line-clamp-2" title={prod.name}>
                        {prod.name}
                      </h3>

                      {/* Price Row */}
                      <div className="pt-0.5 flex flex-wrap items-baseline gap-1">
                        <span className="font-black text-xs text-slate-900">
                          ₹{prod.price}
                        </span>
                        {(prod.oldPrice || 1999) > prod.price && (
                          <span className="text-[9px] text-slate-400 line-through">
                            ₹{prod.oldPrice || 1999}
                          </span>
                        )}
                        <span className="text-[9px] font-extrabold text-emerald-600 ml-auto">
                          {prod.discount || '30% OFF'}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
