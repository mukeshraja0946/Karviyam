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
  
  const getSectionLayoutConfig = () => {
    try {
      const saved = localStorage.getItem('karviyam_section_layouts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  };

  const DEFAULT_MOBILE_SECTIONS_FALLBACK = [
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

  const getMobileSectionsConfig = () => {
    try {
      const saved = localStorage.getItem('karviyam_mobile_homepage_sections');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_MOBILE_SECTIONS_FALLBACK;
  };

  const [sectionLayouts, setSectionLayouts] = useState(getSectionLayoutConfig);
  const [mobileSectionsList, setMobileSectionsList] = useState(getMobileSectionsConfig);
  const [mobileBannerIndex, setMobileBannerIndex] = useState(0);
  const [mobileBanners, setMobileBanners] = useState([]);
  const [mobileBannerSpeed, setMobileBannerSpeed] = useState(5000);
  const [mobileAutoScroll, setMobileAutoScroll] = useState(true);
  const [homeCategories, setHomeCategories] = useState([]);

  const syncLayoutSettings = () => {
    setSectionLayouts(getSectionLayoutConfig());
    setMobileSectionsList(getMobileSectionsConfig());
  };

  const fetchBanners = async () => {
    try {
      let currentAuto = true;
      let currentSpeed = 5000;

      const res = await api.get(`/banners?_t=${Date.now()}`).catch(() => null);
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
          const rawImg = b.mobileImageUrl || b.desktopImageUrl || b.imageUrl || b.image_url || b.imagePath || b.image || '';
          const resolvedImg = resolveImageUrl(rawImg, b.id);
          return {
            id: b.id,
            tag: b.tag || 'OFFICIAL DROP',
            badge: b.tag || 'OFFICIAL DROP',
            title: b.title || '',
            subtitle: b.subtitle || '',
            image: resolvedImg,
            buttonText: b.buttonText || b.button_text || b.cta || 'SHOP NOW',
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

  const fetchLayoutSettings = async () => {
    try {
      const res = await api.get('/settings').catch(() => null);
      const apiData = res?.data ? res.data : (res || {});
      const dataMap = apiData.data || apiData;
      const layoutsData = dataMap?.karviyam_section_layouts || dataMap?.sectionLayouts;
      if (layoutsData) {
        const parsed = typeof layoutsData === 'string' ? JSON.parse(layoutsData) : layoutsData;
        setSectionLayouts(parsed);
        try {
          localStorage.setItem('karviyam_section_layouts', JSON.stringify(parsed));
        } catch (e) {}
      }

      const mobData = dataMap?.karviyam_mobile_homepage_sections || dataMap?.mobile_homepage_sections;
      if (mobData) {
        const parsedMob = typeof mobData === 'string' ? JSON.parse(mobData) : mobData;
        if (Array.isArray(parsedMob) && parsedMob.length > 0) {
          setMobileSectionsList(parsedMob);
          try {
            localStorage.setItem('karviyam_mobile_homepage_sections', JSON.stringify(parsedMob));
          } catch (e) {}
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLayoutSettings();
    fetchHomeProducts();
    fetchBanners();
    fetchHomeCategories();
    syncLayoutSettings();

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchBanners();
        fetchHomeProducts();
        fetchLayoutSettings();
      }
    };

    const handleStorageChange = () => {
      fetchBanners();
      fetchHomeProducts();
      fetchHomeCategories();
      syncLayoutSettings();
    };

    window.addEventListener('karviyam_products_updated', fetchHomeProducts);
    window.addEventListener('karviyam_banners_updated', fetchBanners);
    window.addEventListener('karviyam_categories_updated', fetchHomeCategories);
    window.addEventListener('karviyam_parent_categories_updated', fetchHomeCategories);
    window.addEventListener('karviyam_section_layouts_updated', syncLayoutSettings);
    window.addEventListener('karviyam_mobile_homepage_updated', syncLayoutSettings);
    window.addEventListener('focus', handleFocusOrVisible);
    window.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('karviyam_products_updated', fetchHomeProducts);
      window.removeEventListener('karviyam_banners_updated', fetchBanners);
      window.removeEventListener('karviyam_categories_updated', fetchHomeCategories);
      window.removeEventListener('karviyam_parent_categories_updated', fetchHomeCategories);
      window.removeEventListener('karviyam_section_layouts_updated', syncLayoutSettings);
      window.removeEventListener('karviyam_mobile_homepage_updated', syncLayoutSettings);
      window.removeEventListener('focus', handleFocusOrVisible);
      window.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('storage', handleStorageChange);
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

  // Ensure fallback list has 12 products for 2 rows
  const DEFAULT_REC_PRODUCTS = [
    { id: 1, name: 'Men Solid Polo T-Shirt', brand: 'KARVIYAM', price: 699, oldPrice: 1299, discount: '46% OFF', rating: 4.5, reviewsCount: 1200, imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400' },
    { id: 2, name: 'Zari Border Silk Saree', brand: 'KARVIYAM', price: 1299, oldPrice: 2499, discount: '48% OFF', rating: 4.6, reviewsCount: 980, imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400' },
    { id: 3, name: 'Printed Oversized T-Shirt', brand: 'KARVIYAM', price: 599, oldPrice: 999, discount: '40% OFF', rating: 4.3, reviewsCount: 750, imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400' },
    { id: 4, name: 'Running Sneakers', brand: 'KARVIYAM', price: 1499, oldPrice: 2499, discount: '40% OFF', rating: 4.6, reviewsCount: 1100, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
    { id: 5, name: 'Cotton Kurta Set', brand: 'KARVIYAM', price: 899, oldPrice: 1599, discount: '44% OFF', rating: 4.4, reviewsCount: 620, imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400' },
    { id: 6, name: 'Kids Printed Shirt', brand: 'KARVIYAM', price: 499, oldPrice: 799, discount: '38% OFF', rating: 4.5, reviewsCount: 430, imageUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400' },
    { id: 7, name: 'Casual Denim Jacket', brand: 'KARVIYAM', price: 1799, oldPrice: 2999, discount: '40% OFF', rating: 4.7, reviewsCount: 1100, imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400' },
    { id: 8, name: 'Floral Summer Dress', brand: 'KARVIYAM', price: 1099, oldPrice: 1999, discount: '45% OFF', rating: 4.5, reviewsCount: 850, imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400' },
    { id: 9, name: 'Polarized Retro Round Sunglasses', brand: 'KARVIYAM', price: 1399, oldPrice: 1999, discount: '30% OFF', rating: 4.5, reviewsCount: 670, imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400' },
    { id: 10, name: 'Unisex Knit Winter Beanie', brand: 'KARVIYAM', price: 499, oldPrice: 799, discount: '38% OFF', rating: 4.6, reviewsCount: 530, imageUrl: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=400' },
    { id: 11, name: 'Minimalist Crossbody Bag', brand: 'KARVIYAM', price: 1299, oldPrice: 1899, discount: '32% OFF', rating: 4.4, reviewsCount: 420, imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400' },
    { id: 12, name: 'High-Top Canvas Sneakers', brand: 'KARVIYAM', price: 2299, oldPrice: 3499, discount: '34% OFF', rating: 4.4, reviewsCount: 1300, imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400' }
  ];

  const safeFeaturedProducts = Array.isArray(featuredProducts) ? featuredProducts : [];
  const displayRecommendedProducts = (
    safeFeaturedProducts.length >= 6
      ? safeFeaturedProducts.slice(0, 6)
      : [...safeFeaturedProducts, ...DEFAULT_REC_PRODUCTS.slice(safeFeaturedProducts.length)].slice(0, 6)
  );

  const displayTrendingProducts = (
    safeFeaturedProducts.length >= 12
      ? safeFeaturedProducts.slice(6, 12)
      : [...safeFeaturedProducts.slice(6), ...DEFAULT_REC_PRODUCTS.slice(Math.max(6, safeFeaturedProducts.length))].slice(0, 6)
  );

  const safeNewArrivals = Array.isArray(newArrivals) ? newArrivals : [];
  const displayNewArrivalsProducts = (
    safeNewArrivals.length >= 6
      ? safeNewArrivals.slice(0, 6)
      : [...safeNewArrivals, ...DEFAULT_REC_PRODUCTS.slice(3, 9)].slice(0, 6)
  );

  const displayBestSellersProducts = (
    safeFeaturedProducts.length >= 6
      ? safeFeaturedProducts.slice(0, 6)
      : DEFAULT_REC_PRODUCTS.slice(6, 12)
  );

  const mobileRecommendedMode = sectionLayouts?.mobile?.recommended || sectionLayouts?.recommended || 'horizontal';
  const mobileTrendingMode = sectionLayouts?.mobile?.trending || sectionLayouts?.trending || 'vertical';
  const mobileNewArrivalsMode = sectionLayouts?.mobile?.newArrivals || sectionLayouts?.newArrivals || 'horizontal';
  const mobileBestSellersMode = sectionLayouts?.mobile?.bestSellers || 'vertical';

  const renderProductCardItem = (prod, isGrid = false) => {
    const prodImg = resolveImageUrl(prod.imageUrl || prod.image_url || prod.imagePath || prod.image || prod.images?.[0], prod.id);
    return (
      <div
        key={prod.id}
        onClick={() => window.location.href = `/product/${prod.id}`}
        className={
          isGrid
            ? "w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-2 relative flex flex-col justify-between overflow-hidden cursor-pointer group transition-all"
            : "w-[140px] sm:w-[155px] min-w-[140px] max-w-[155px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-2 relative flex flex-col justify-between overflow-hidden cursor-pointer group transition-all"
        }
      >
        <div className="relative w-full h-[120px] bg-slate-50/80 rounded-xl overflow-hidden flex items-center justify-center p-1.5 shrink-0">
          <img
            src={prodImg}
            alt={prod.name}
            onError={(e) => handleImageError(e, prod.id)}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); }}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-slate-700 hover:text-[#B71C1C] flex items-center justify-center shadow-2xs border border-slate-100"
            title="Add to Wishlist"
          >
            <svg className="w-3.5 h-3.5 stroke-current fill-none" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-between pt-1.5 px-0.5 space-y-1">
          <div className="flex items-center justify-between text-[9.5px]">
            <span className="font-black text-[#B71C1C] uppercase tracking-wider">KARVIYAM</span>
            <div className="flex items-center gap-0.5 font-bold text-amber-500">
              <span>★</span>
              <span className="text-slate-800 font-extrabold">{prod.rating || 4.5}</span>
            </div>
          </div>
          <h3 className="font-bold text-[11px] text-slate-900 leading-snug line-clamp-2" title={prod.name}>
            {prod.name}
          </h3>
          <div className="pt-0.5 flex flex-wrap items-baseline gap-1">
            <span className="font-black text-xs text-slate-900">₹{prod.price}</span>
            {(prod.oldPrice || 1999) > prod.price && (
              <span className="text-[9px] text-slate-400 line-through">₹{prod.oldPrice || 1999}</span>
            )}
            <span className="text-[9px] font-extrabold text-emerald-600 ml-auto">{prod.discount || '30% OFF'}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderProductSection = (sec, products, viewAllLink) => {
    const isVertical = sec.layout === 'vertical' || sec.layout === 'grid';
    const sectionTitle = sec.title || 'Products';
    const sectionSubtitle = sec.subtitle || '';

    return (
      <div key={sec.id} className="w-full my-2.5 px-3">
        <div className="flex items-center justify-between mb-1.5">
          <div>
            <h2 className="font-display font-black text-base text-[#0F172A] tracking-tight">
              {sectionTitle}
            </h2>
            {sectionSubtitle ? (
              <p className="text-[10.5px] font-medium text-slate-500">{sectionSubtitle}</p>
            ) : null}
          </div>
          <Link to={viewAllLink} className="text-xs font-extrabold text-[#B71C1C] hover:underline flex items-center gap-0.5">
            <span>View All</span>
            <span>→</span>
          </Link>
        </div>

        {loading ? (
          <SkeletonLoader count={4} />
        ) : isVertical ? (
          <div className="grid grid-cols-2 gap-2.5 w-full">
            {products.map((prod) => renderProductCardItem(prod, true))}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory py-0.5 w-full">
            {products.map((prod) => renderProductCardItem(prod, false))}
          </div>
        )}
      </div>
    );
  };

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
      {/* DYNAMIC RENDERER CONTROLLED BY ADMIN HOMEPAGE SETTINGS      */}
      {/* ========================================================= */}
      <div className="block lg:hidden bg-slate-50/60 pb-2 select-none">
        {mobileSectionsList
          .filter(s => s.enabled !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((sec) => {
            switch (sec.id) {
              case 'parent_categories':
                return (
                  <div key={sec.id} className="w-full bg-white py-2 px-3 border-b border-slate-100 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-3.5 whitespace-nowrap">
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
                          className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                        >
                          <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-100 p-0.5 overflow-hidden flex items-center justify-center shadow-2xs group-active:scale-95 transition-transform">
                            <img
                              src={resolveImageUrl(cat.image, cat.id)}
                              alt={cat.name}
                              onError={(e) => handleImageError(e, cat.id)}
                              className="w-full h-full object-cover rounded-full"
                            />
                          </div>
                          <span className="text-[9.5px] font-black tracking-tight text-slate-800 uppercase truncate max-w-[62px]">
                            {cat.name}
                          </span>
                        </div>
                      ))}

                      <div
                        onClick={() => window.location.href = '/shop'}
                        className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                      >
                        <div className="w-14 h-14 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs group-active:scale-95 transition-transform">
                          <Plus className="w-5 h-5 text-slate-700" />
                        </div>
                        <span className="text-[9.5px] font-black tracking-tight text-slate-800 uppercase">
                          MORE
                        </span>
                      </div>
                    </div>
                  </div>
                );

              case 'hero_banners':
                return mobileBanners && mobileBanners.length > 0 ? (
                  <div key={sec.id} className="mx-3 my-2">
                    <div className="w-full h-[180px] sm:h-[210px] rounded-2xl overflow-hidden relative shadow-md bg-slate-950 group">
                      {mobileBanners[mobileBannerIndex]?.image ? (
                        <div className="absolute inset-0 z-0 overflow-hidden">
                          <img
                            src={mobileBanners[mobileBannerIndex].image}
                            alt={mobileBanners[mobileBannerIndex]?.title || 'Hero Banner'}
                            onError={(e) => handleImageError(e, mobileBanners[mobileBannerIndex]?.id)}
                            className="w-full h-full object-cover object-center transition-all duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/30" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950" />
                      )}

                      <div className="relative z-10 h-full p-4 sm:p-5 flex flex-col justify-center max-w-[88%] text-white">
                        <span className="inline-block bg-white/15 backdrop-blur-md border border-white/25 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-widest w-max mb-1.5 shadow-2xs">
                          {mobileBanners[mobileBannerIndex]?.tag || mobileBanners[mobileBannerIndex]?.badge || 'OFFICIAL DROP'}
                        </span>

                        {mobileBanners[mobileBannerIndex]?.title ? (
                          <h2 className="font-display font-black text-base sm:text-lg leading-tight text-white tracking-tight uppercase drop-shadow-md line-clamp-2">
                            {mobileBanners[mobileBannerIndex].title}
                          </h2>
                        ) : null}

                        {mobileBanners[mobileBannerIndex]?.subtitle ? (
                          <p className="text-[10.5px] sm:text-xs text-slate-200 font-medium mt-1 mb-2.5 line-clamp-2">
                            {mobileBanners[mobileBannerIndex].subtitle}
                          </p>
                        ) : (
                          <div className="mb-2" />
                        )}

                        <button
                          type="button"
                          onClick={() => window.location.href = mobileBanners[mobileBannerIndex]?.link || '/shop'}
                          className="bg-[#B71C1C] hover:bg-[#900C0C] text-white text-[10.5px] sm:text-xs font-extrabold px-4 py-2 rounded-xl uppercase tracking-wider transition-all shadow-md w-max cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          <span>{mobileBanners[mobileBannerIndex]?.buttonText || mobileBanners[mobileBannerIndex]?.cta || 'SHOP NOW'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {mobileBanners.length > 1 && (
                        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                          {mobileBanners.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setMobileBannerIndex(idx)}
                              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                idx === mobileBannerIndex ? 'w-5 bg-[#B71C1C]' : 'w-1.5 bg-white/60'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;

              case 'categories_style':
                return (
                  <div key={sec.id} className="mx-3 my-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                    {sec.title ? (
                      <h3 className="font-extrabold text-xs text-slate-900 mb-2 uppercase tracking-wider">{sec.title}</h3>
                    ) : null}
                    <div className="grid grid-cols-6 gap-y-2.5 gap-x-1.5">
                      {[
                        { id: 't-shirts', title: 'T-Shirts', query: 'category=T-Shirts', fallbackImage: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300' },
                        { id: 'shirts', title: 'Shirts', query: 'category=Shirts', fallbackImage: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300' },
                        { id: 'jeans', title: 'Jeans', query: 'category=Jeans', fallbackImage: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300' },
                        { id: 'trousers', title: 'Trousers', query: 'category=Trousers', fallbackImage: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300' },
                        { id: 'kurta-sets', title: 'Kurta Sets', query: 'category=Kurta+Sets', fallbackImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300' },
                        { id: 'sarees', title: 'Sarees', query: 'category=Sarees', fallbackImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300' },
                        { id: 'dresses', title: 'Dresses', query: 'category=Dresses', fallbackImage: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300' },
                        { id: 'tops', title: 'Tops', query: 'category=Tops', fallbackImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300' },
                        { id: 'blazers', title: 'Blazers', query: 'category=Blazers', fallbackImage: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300' },
                        { id: 'suits', title: 'Suits', query: 'category=Suits', fallbackImage: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300' },
                        { id: 'sneakers', title: 'Sneakers', query: 'category=Sneakers', fallbackImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300' },
                        { id: 'kids-baby', title: 'Kids & Baby', query: 'category=Kids', fallbackImage: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=300' }
                      ].map((defItem) => {
                        const matched = (Array.isArray(homeCategories) ? homeCategories : []).find(
                          c => c.name && (
                            c.name.toLowerCase() === defItem.title.toLowerCase() ||
                            c.name.toLowerCase().includes(defItem.title.toLowerCase()) ||
                            defItem.title.toLowerCase().includes(c.name.toLowerCase())
                          )
                        );
                        const catId = matched?.id || defItem.id;
                        const catTitle = matched?.name || defItem.title;
                        const catImg = matched?.image || resolveImageUrl(defItem.fallbackImage, defItem.id);
                        const catQuery = matched?.query || defItem.query;
                        return (
                          <div
                            key={catId}
                            onClick={() => window.location.href = `/shop?${catQuery}`}
                            className="flex flex-col items-center gap-1 cursor-pointer group"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/80 p-0.5 overflow-hidden flex items-center justify-center shadow-2xs group-active:scale-95 transition-transform">
                              <img
                                src={catImg}
                                alt={catTitle}
                                onError={(e) => handleImageError(e, catId)}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-800 text-center tracking-tight leading-none truncate max-w-full" title={catTitle}>
                              {catTitle}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );

              case 'recommended':
                return renderProductSection(sec, displayRecommendedProducts, '/shop');

              case 'trending':
                return renderProductSection(sec, displayTrendingProducts, '/shop?sort=popular');

              case 'new_arrivals':
                return renderProductSection(sec, displayNewArrivalsProducts, '/shop?sort=newest');

              case 'best_sellers':
                return renderProductSection(sec, displayBestSellersProducts, '/shop?sort=rating');

              case 'flash_picks':
                return renderProductSection(sec, displayRecommendedProducts.slice(0, 4), '/shop?sort=popular');

              case 'continue_shopping':
                return renderProductSection(sec, displayRecommendedProducts.slice(0, 4), '/shop');

              default:
                return null;
            }
          })}
      </div>
    </div>
  );
}
