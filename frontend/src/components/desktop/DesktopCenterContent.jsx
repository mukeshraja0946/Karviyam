import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  Plus,
  ChevronDown,
  Info
} from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import api from '../../utils/api';
import { resolveImageUrl, handleImageError } from '../../utils/imageUtils';

// 12 Quick Shopping / Service Categories matching reference image
const QUICK_SERVICE_ICONS = [
  { id: 'prime', label: 'Prime', badge: 'JOIN', bg: 'bg-[#F4F1F8]', image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150' },
  { id: 'gift-cards', label: 'Gift cards', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=150' },
  { id: 'mobiles', label: 'Mobiles', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150' },
  { id: 'rewards', label: 'Rewards', icon: '👑', image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=150' },
  { id: 'deals', label: 'Deals', badge: '%', image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=150' },
  { id: 'fashion', label: 'Fashion', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=150' },
  { id: 'electronics', label: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=150' },
  { id: 'shop-live', label: 'Shop Live', badge: '▶ LIVE', bgBadge: 'bg-red-600', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
  { id: 'home', label: 'Home', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=150' },
  { id: 'daily-needs', label: 'Daily Needs', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150' },
  { id: 'beauty', label: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=150' },
  { id: 'travel', label: 'Travel', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=150' }
];

const DEFAULT_PRODUCTS = [
  {
    id: 201,
    name: 'Eco Cotton Canvas Grocery Shopping Bag',
    brand: 'KARVIYAM',
    price: 248,
    oldPrice: 399,
    discount: '-38%',
    boughtCount: '200+ bought in past month',
    image: 'https://images.unsplash.com/photo-1597484661643-2f5f6e71ea16?w=400'
  },
  {
    id: 202,
    name: 'SOFTSPUN Microfiber Cleaning Cloths, 10pc',
    brand: 'KARVIYAM',
    price: 260,
    oldPrice: 599,
    discount: '-57%',
    boughtCount: '8K+ bought in past month',
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400'
  },
  {
    id: 203,
    name: 'Portronics Car Mobile Holder',
    brand: 'KARVIYAM',
    price: 399,
    oldPrice: 999,
    discount: '-60%',
    boughtCount: '5K+ bought in past month',
    image: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400'
  },
  {
    id: 204,
    name: 'MICROKLEAR Car Cleaning Cloth',
    brand: 'KARVIYAM',
    price: 199,
    oldPrice: 399,
    discount: '-50%',
    boughtCount: '3K+ bought in past month',
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400'
  },
  {
    id: 205,
    name: 'Insulated Stainless Steel Water Bottle',
    brand: 'KARVIYAM',
    price: 549,
    oldPrice: 999,
    discount: '-45%',
    boughtCount: '6K+ bought in past month',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400'
  },
  {
    id: 206,
    name: 'BOAT Airdopes 441 Pro Earbuds',
    brand: 'KARVIYAM',
    price: 1499,
    oldPrice: 2499,
    discount: '-40%',
    boughtCount: '2K+ bought in past month',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400'
  }
];

export default function DesktopCenterContent() {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [currentHero, setCurrentHero] = useState(0);
  const [heroSlides, setHeroSlides] = useState([]);
  const [promoCard, setPromoCard] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [speed, setSpeed] = useState(5000);
  
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);

  useEffect(() => {
    fetchBanners();
    fetchProducts();
    fetchCategories();

    const handleUpdates = () => {
      fetchBanners();
      fetchProducts();
      fetchCategories();
    };

    window.addEventListener('karviyam_banners_updated', fetchBanners);
    window.addEventListener('karviyam_products_updated', fetchProducts);
    window.addEventListener('karviyam_categories_updated', fetchCategories);
    window.addEventListener('karviyam_parent_categories_updated', fetchCategories);
    window.addEventListener('focus', handleUpdates);
    return () => {
      window.removeEventListener('karviyam_banners_updated', fetchBanners);
      window.removeEventListener('karviyam_products_updated', fetchProducts);
      window.removeEventListener('karviyam_categories_updated', fetchCategories);
      window.removeEventListener('karviyam_parent_categories_updated', fetchCategories);
      window.removeEventListener('focus', handleUpdates);
    };
  }, []);

  const fetchBanners = async () => {
    try {
      // Append cache-busting timestamp parameter to ensure latest banner is fetched
      const cacheBust = `?t=${Date.now()}`;
      const res = await api.get(`/banners${cacheBust}`).catch(() => null);
      const apiData = res?.data ? res.data : res;
      const rawData = apiData?.data !== undefined ? apiData.data : apiData;

      let list = [];
      let currentAuto = true;
      let currentSpeed = 5000;

      if (Array.isArray(rawData)) {
        list = rawData;
      } else if (rawData && typeof rawData === 'object') {
        if (Array.isArray(rawData.banners)) list = rawData.banners;
        if (rawData.autoScroll !== undefined) currentAuto = Boolean(rawData.autoScroll);
        if (rawData.speed !== undefined) currentSpeed = Number(rawData.speed);
      }

      setAutoScroll(currentAuto);
      setSpeed(currentSpeed);

      if (Array.isArray(list) && list.length > 0) {
        const activeBanners = list.filter(b => b && b.isActive !== false && String(b.status || 'active').toLowerCase() === 'active');
        const formatted = activeBanners.map(b => {
          const rawImg = b.desktopImageUrl || b.imageUrl || b.imagePath || b.image || '';
          const resolvedImg = resolveImageUrl(rawImg);
          // Add cache bust parameter to image URL
          const cacheBustedImg = resolvedImg ? (resolvedImg.includes('?') ? `${resolvedImg}&v=${b.id || Date.now()}` : `${resolvedImg}?v=${b.id || Date.now()}`) : '';
          return {
            id: b.id,
            tag: b.tag || 'SPONSORED',
            title: b.title || 'Decode your perfect cleanse',
            subtitle: b.subtitle || 'Gentle renewing cleanser',
            image: cacheBustedImg,
            link: b.buttonLink || b.link || '/shop',
            buttonText: b.buttonText || b.button_text || 'SHOP NOW >'
          };
        });
        if (formatted.length > 0) setHeroSlides(formatted);
      }
    } catch (e) {
      console.error('Error fetching hero banners:', e);
    }
  };

  useEffect(() => {
    if (heroSlides.length <= 1 || !autoScroll) return;
    const timer = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroSlides.length);
    }, speed);
    return () => clearInterval(timer);
  }, [heroSlides.length, autoScroll, speed]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/parent-categories').catch(() => null);
      const list = res?.data?.data || res?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setCategoriesList(list.map(c => c.name));
      }
    } catch (e) {}
  };

  const fetchProducts = async (filterKey = activeFilter, category = selectedCategory) => {
    try {
      let queryPath = '/products?size=12';
      if (filterKey === 'New arrivals') queryPath = '/products/new-arrivals';
      else if (filterKey === 'Bestsellers') queryPath = '/products/featured';
      else if (category) queryPath = `/products?category=${encodeURIComponent(category)}&size=12`;

      const res = await api.get(queryPath).catch(() => null);
      const apiData = res?.data?.data || res?.data;
      let list = Array.isArray(apiData) ? apiData : (Array.isArray(apiData?.content) ? apiData.content : []);

      if (list && list.length > 0) {
        let filtered = list.filter(p => p.isActive !== false);

        if (filterKey === 'Under ₹299') {
          filtered = filtered.filter(p => p.price <= 299);
        } else if (filterKey === '₹300 - ₹599') {
          filtered = filtered.filter(p => p.price >= 300 && p.price <= 599);
        } else if (filterKey === '₹600 - ₹999') {
          filtered = filtered.filter(p => p.price >= 600 && p.price <= 999);
        } else if (filterKey === '₹1,000 & above') {
          filtered = filtered.filter(p => p.price >= 1000);
        }

        const formatted = filtered.map((p, idx) => {
          const price = p.price || DEFAULT_PRODUCTS[idx % 6].price;
          const oldPrice = p.oldPrice || Math.round(price * 1.55);
          const discPercent = Math.round(((oldPrice - price) / oldPrice) * 100);
          return {
            id: p.id,
            name: p.name,
            brand: p.brand || 'KARVIYAM',
            price: price,
            oldPrice: oldPrice,
            discount: `-${discPercent}%`,
            boughtCount: `${Math.floor(Math.random() * 5 + 1)}K+ bought in past month`,
            image: resolveImageUrl(p.imageUrl || (Array.isArray(p.images) && p.images[0])) || DEFAULT_PRODUCTS[idx % 6].image
          };
        });

        if (formatted.length > 0) {
          setProducts(formatted);
          return;
        }
      }

      setProducts(DEFAULT_PRODUCTS);
    } catch (e) {
      console.error(e);
      setProducts(DEFAULT_PRODUCTS);
    }
  };

  const handleFilterClick = (filterName) => {
    setActiveFilter(filterName);
    setSelectedCategory('');
    fetchProducts(filterName, '');
  };

  const handleCategorySelect = (catName) => {
    setSelectedCategory(catName);
    setActiveFilter(`Category: ${catName}`);
    setCategoriesDropdownOpen(false);
    fetchProducts('Category', catName);
  };

  const slide = heroSlides[currentHero] || {
    title: 'Decode your perfect cleanse',
    subtitle: 'Gentle renewing cleanser',
    tag: 'Sponsored',
    buttonText: 'SHOP NOW >',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1000'
  };

  return (
    <main className="w-full flex flex-col gap-5 py-2">

      {/* ========================================================= */}
      {/* 1. HERO BANNER SECTION (65% Left Carousel + 35% Right Promo Card) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
        
        {/* Left Carousel Banner (65% width / col-span-8) */}
        <div className="lg:col-span-8 h-[290px] xl:h-[320px] rounded-3xl overflow-hidden relative bg-[#FCE4EC] border border-rose-100 shadow-xs group flex items-center justify-between p-6 xl:p-8">
          
          {/* Left Text & CTA Container */}
          <div className="relative z-10 max-w-[280px] xl:max-w-[320px] flex flex-col justify-center">
            <h1 className="font-display font-black text-2xl xl:text-4xl text-slate-900 leading-tight tracking-tight">
              {slide.title}
            </h1>
            <p className="text-xs xl:text-sm text-slate-600 font-medium mt-2 mb-5">
              {slide.subtitle}
            </p>

            <button
              onClick={() => navigate('/shop')}
              className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-full transition-all shadow-md w-max cursor-pointer flex items-center gap-1"
            >
              <span>SHOP NOW</span>
              <span>›</span>
            </button>
          </div>

          {/* Right Product Image Container */}
          <div className="relative h-full w-1/2 flex items-center justify-center">
            <img
              src={slide.image}
              alt={slide.title}
              onError={handleImageError}
              className="max-h-full max-w-full object-contain rounded-2xl group-hover:scale-102 transition-transform duration-500"
            />

            {/* Sponsored Badge */}
            <div className="absolute bottom-1 right-1 bg-white/90 backdrop-blur-md border border-slate-200 px-2 py-0.5 rounded-full text-[10px] text-slate-600 font-bold flex items-center gap-1 shadow-2xs">
              <span>Sponsored</span>
              <Info className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          {/* Navigation Arrows */}
          {heroSlides.length > 1 && (
            <>
              <button
                onClick={() => setCurrentHero((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center hover:bg-[#B71C1C] hover:text-white transition-colors shadow-md cursor-pointer z-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentHero((prev) => (prev + 1) % heroSlides.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center hover:bg-[#B71C1C] hover:text-white transition-colors shadow-md cursor-pointer z-20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Carousel Pagination Dots */}
          {heroSlides.length > 1 && (
            <div className="absolute bottom-3 left-6 flex items-center gap-1.5 z-20">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentHero(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentHero ? 'w-6 bg-[#D32F2F]' : 'w-2 bg-slate-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Feature Promo Card (35% width / col-span-4) */}
        <div className="lg:col-span-4 h-[290px] xl:h-[320px] rounded-3xl overflow-hidden relative bg-[#E8F5E9] border border-emerald-100 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-display font-black text-xl xl:text-2xl text-slate-900 leading-tight">
              Safe on skin.<br />Tough on acne.
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Neem Face Wash with Neem & Turmeric
            </p>
          </div>

          {/* Featured Image */}
          <div className="w-full h-[150px] xl:h-[170px] flex items-center justify-center my-1">
            <img
              src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500"
              alt="Himalaya Neem Face Wash"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <button
            onClick={() => navigate('/shop')}
            className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black text-xs uppercase tracking-wider px-5 py-2 rounded-xl transition-all shadow-sm w-max cursor-pointer"
          >
            SHOP NOW
          </button>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 2. QUICK SHOPPING / SERVICE ICON ROW (12 Items)           */}
      {/* ========================================================= */}
      <div className="w-full overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center justify-between gap-3 min-w-[900px]">
          {QUICK_SERVICE_ICONS.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/shop?category=${encodeURIComponent(item.label)}`)}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
            >
              <div className="w-16 h-16 xl:w-18 xl:h-18 rounded-2xl bg-white border border-slate-200/90 p-1 flex items-center justify-center relative shadow-2xs group-hover:border-[#B71C1C] group-hover:shadow-xs transition-all">
                <img
                  src={item.image}
                  alt={item.label}
                  className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform"
                />

                {item.badge && (
                  <span className={`absolute -top-1.5 left-1/2 -translate-x-1/2 ${item.bgBadge || 'bg-slate-900'} text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow-2xs`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-700 group-hover:text-[#B71C1C] text-center tracking-tight">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. DISCOVER PRODUCTS SECTION                             */}
      {/* ========================================================= */}
      <div className="w-full bg-[#F3F0F7] border border-[#E7E2F0] rounded-3xl p-5 xl:p-6 flex flex-col gap-4 shadow-xs">
        
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <h2 className="font-display font-black text-xl text-slate-900 tracking-tight">
            Discover products for you
          </h2>

          <button
            onClick={() => navigate('/shop')}
            className="text-xs font-extrabold text-[#B71C1C] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>View all</span>
            <span>→</span>
          </button>
        </div>

        {/* Filter Chips Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 relative">
          
          {/* Categories Dropdown Filter Chip */}
          <div className="relative shrink-0">
            <button
              onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
              className="bg-white border border-slate-200 text-slate-800 font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs hover:border-[#B71C1C] cursor-pointer"
            >
              <span>Categories</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {categoriesDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-30">
                {categoriesList.map((cat, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleCategorySelect(cat)}
                    className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-[#B71C1C] cursor-pointer"
                  >
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filter Chips */}
          {['Value picks', 'Bestsellers', 'New arrivals', 'Under ₹299', '₹300 - ₹599', '₹600 - ₹999', '₹1,000 & above'].map((chip) => (
            <button
              key={chip}
              onClick={() => handleFilterClick(chip)}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all shrink-0 cursor-pointer ${
                activeFilter === chip
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200/90 hover:border-[#B71C1C] shadow-2xs'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Product Cards Container with Right Scroll Arrow */}
        <div className="relative w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 w-full">
            {products.map((prod) => (
              <div
                key={prod.id}
                onClick={() => navigate(`/product/${prod.id}`)}
                className="bg-white rounded-2xl p-3 border border-slate-100/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative cursor-pointer group"
              >
                {/* Yellow Plus Button / Wishlist */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(prod, 1);
                  }}
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#FEE100] text-slate-900 font-bold flex items-center justify-center shadow-2xs hover:scale-110 transition-transform z-10"
                  title="Add to Bag"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>

                {/* Product Image Area */}
                <div className="w-full h-[140px] xl:h-[150px] bg-white rounded-xl overflow-hidden flex items-center justify-center p-2 shrink-0">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col justify-between pt-2">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 min-h-[32px]" title={prod.name}>
                      {prod.name}
                    </h3>
                  </div>

                  <div className="mt-2">
                    {/* Price Row: Discount badge, Selling Price, MRP strikethrough */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-rose-100 text-[#C62828] text-[10px] font-black px-1.5 py-0.5 rounded-md">
                        {prod.discount}
                      </span>
                      <span className="font-black text-sm text-slate-900">
                        ₹{prod.price}
                      </span>
                      {prod.oldPrice > prod.price && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ₹{prod.oldPrice}
                        </span>
                      )}
                    </div>

                    {/* Bought count */}
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      {prod.boughtCount}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Scroll Arrow Indicator */}
          <button
            onClick={() => navigate('/shop')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-800 flex items-center justify-center shadow-md hover:bg-[#B71C1C] hover:text-white transition-colors cursor-pointer z-10 hidden lg:flex"
            title="View More Products"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>

    </main>
  );
}
