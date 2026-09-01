import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  IndianRupee,
  Gift,
  ShoppingBag,
  Truck,
  RotateCcw,
  ShieldCheck,
  Award,
  Zap,
  Sparkles,
  ArrowRight,
  Clock,
  Tag,
  Layers
} from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import api from '../../utils/api';
import { resolveImageUrl, handleImageError } from '../../utils/imageUtils';

const CATEGORIES_DATA = [
  { id: 't-shirts', name: 'T-SHIRTS', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400', query: 'category=T-Shirts' },
  { id: 'sneakers', name: 'SNEAKERS', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', query: 'category=Sneakers' },
  { id: 'kurta-sets', name: 'KURTA SETS', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400', query: 'category=Kurta+Sets' },
  { id: 'women', name: 'WOMEN', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400', query: 'category=Women' },
  { id: 'men', name: 'MEN', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400', query: 'category=Men' },
  { id: 'kids', name: 'KIDS & BABY', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400', query: 'category=Kids' },
  { id: 'unisex', name: 'UNISEX', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400', query: 'category=Unisex' },
  { id: 'jewels', name: 'JEWELS', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400', query: 'category=Jewels' },
  { id: 'accessories', name: 'ACCESSORIES', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400', query: 'category=Accessories' },
  { id: 'kitchen', name: 'KITCHEN & HOME', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400', query: 'category=Kitchen' }
];

const DEFAULT_RECOMMENDED = [
  { id: 101, name: 'Men Solid Polo T-Shirt', brand: 'KARVIYAM', rating: 4.5, reviews: '1.2k', price: 699, oldPrice: 1299, discount: '46% OFF', image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600' },
  { id: 102, name: 'Zari Border Silk Saree', brand: 'KARVIYAM', rating: 4.6, reviews: '980', price: 1299, oldPrice: 2499, discount: '48% OFF', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600' },
  { id: 103, name: 'Printed Oversized T-Shirt', brand: 'KARVIYAM', rating: 4.3, reviews: '740', price: 599, oldPrice: 999, discount: '40% OFF', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600' },
  { id: 104, name: 'Running Sneakers', brand: 'KARVIYAM', rating: 4.6, reviews: '1.5k', price: 1499, oldPrice: 2499, discount: '40% OFF', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600' },
  { id: 105, name: 'Cotton Kurta Set', brand: 'KARVIYAM', rating: 4.4, reviews: '620', price: 899, oldPrice: 1599, discount: '44% OFF', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600' },
  { id: 106, name: 'Kids Printed Shirt', brand: 'KARVIYAM', rating: 4.5, reviews: '310', price: 499, oldPrice: 799, discount: '38% OFF', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600' }
];

export default function DesktopCenterContent() {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // 1. Hero Carousel State
  const [currentHero, setCurrentHero] = useState(0);
  const [heroSlides, setHeroSlides] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [speed, setSpeed] = useState(5000);

  // 2. Data States from Backend API & Settings
  const [categories, setCategories] = useState(CATEGORIES_DATA);
  const [productsRow1, setProductsRow1] = useState([]);
  const [productsRow2, setProductsRow2] = useState([]);
  const [homepageSections, setHomepageSections] = useState([]);
  const [flashProducts, setFlashProducts] = useState([]);
  const [styleCategories, setStyleCategories] = useState([]);
  const [occasionCategories, setOccasionCategories] = useState([]);
  const [priceChips, setPriceChips] = useState([]);

  // Timer State for Flash Picks
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 41, seconds: 36 });

  // Carousel Refs & Scroll Boundary States
  const categoryScrollRef = useRef(null);
  const row1ScrollRef = useRef(null);
  const row2ScrollRef = useRef(null);
  const flashScrollRef = useRef(null);

  const [canCategoryScrollLeft, setCanCategoryScrollLeft] = useState(false);
  const [canCategoryScrollRight, setCanCategoryScrollRight] = useState(true);

  // Flash Picks Countdown Timer
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

  const checkCategoryScrollBoundary = () => {
    const el = categoryScrollRef.current;
    if (el) {
      const isAtLeft = el.scrollLeft <= 5;
      const isAtRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 5;
      setCanCategoryScrollLeft(!isAtLeft);
      setCanCategoryScrollRight(!isAtRight);
    }
  };

  const handleCategoryScrollLeft = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const el = categoryScrollRef.current;
    if (el) {
      el.scrollBy({ left: -320, behavior: 'smooth' });
      setTimeout(checkCategoryScrollBoundary, 350);
    }
  };

  const handleCategoryScrollRight = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const el = categoryScrollRef.current;
    if (el) {
      el.scrollBy({ left: 320, behavior: 'smooth' });
      setTimeout(checkCategoryScrollBoundary, 350);
    }
  };

  // 3. Load All Desktop Data from Unified Backend API
  useEffect(() => {
    fetchAllDesktopData();

    const handleSync = () => {
      fetchAllDesktopData();
    };

    window.addEventListener('karviyam_products_updated', handleSync);
    window.addEventListener('karviyam_categories_updated', handleSync);
    window.addEventListener('karviyam_parent_categories_updated', handleSync);
    window.addEventListener('karviyam_homepage_sections_updated', handleSync);
    window.addEventListener('karviyam_banners_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('karviyam_products_updated', handleSync);
      window.removeEventListener('karviyam_categories_updated', handleSync);
      window.removeEventListener('karviyam_parent_categories_updated', handleSync);
      window.removeEventListener('karviyam_homepage_sections_updated', handleSync);
      window.removeEventListener('karviyam_banners_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const fetchAllDesktopData = async () => {
    fetchBanners();
    fetchHomepageSections();
    fetchProductsAndCategories();
  };

  // Fetch Hero Banners
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
        else if (Array.isArray(rawData.data)) list = rawData.data;

        if (rawData.autoScroll !== undefined) currentAuto = Boolean(rawData.autoScroll);
        if (rawData.speed !== undefined && !isNaN(Number(rawData.speed))) {
          currentSpeed = Number(rawData.speed);
        }
      }

      setAutoScroll(currentAuto);
      setSpeed(currentSpeed);

      if (list && list.length > 0) {
        const activeBanners = list.filter(b => b.isActive !== false);
        const formatted = activeBanners.map(b => {
          const rawImg = b.desktopImageUrl || b.imageUrl || b.image_url || b.imagePath || b.image || '';
          const resolvedImg = resolveImageUrl(rawImg, b.id);
          return {
            id: b.id,
            tag: b.tag || 'OFFICIAL DROP',
            title: b.title || '',
            subtitle: b.subtitle || '',
            image: resolvedImg,
            link: b.buttonLink || b.link || '/shop',
            buttonText: b.buttonText || b.button_text || 'SHOP NOW'
          };
        });
        setHeroSlides(formatted);
      } else {
        setHeroSlides([]);
      }
    } catch (e) {
      setHeroSlides([]);
    }
  };

  // Banner Auto-rotate
  useEffect(() => {
    if (heroSlides.length === 0) {
      setCurrentHero(0);
      return;
    }
    if (currentHero >= heroSlides.length) {
      setCurrentHero(0);
    }
    if (!autoScroll || heroSlides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroSlides.length);
    }, speed);
    return () => clearInterval(timer);
  }, [heroSlides.length, autoScroll, speed, currentHero]);

  // Fetch Dynamic Admin Homepage Sections
  const fetchHomepageSections = async () => {
    try {
      const res = await api.get('/homepage-sections').catch(() => null);
      const data = res?.data?.data || res?.data;
      if (Array.isArray(data)) {
        setHomepageSections(data);
      }
    } catch (e) {}
  };

  // Fetch Products, Parent Categories & Extra Sections Data
  const fetchProductsAndCategories = async () => {
    try {
      // 1. Products
      const allRes = await api.get('/products?size=50').catch(() => null);
      const allData = allRes?.data?.data || allRes?.data;
      let allList = Array.isArray(allData?.content) ? allData.content : (Array.isArray(allData) ? allData : []);

      const formatProductItem = (p, idx) => {
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
          rating: Number(p.rating || fallback.rating || 4.5).toFixed(1),
          reviews: p.reviewsCount ? `${p.reviewsCount}` : fallback.reviews,
          price: price,
          oldPrice: oldPrice,
          discount: `${disc}% OFF`,
          image: resolvedImage
        };
      };

      const activeProducts = allList.filter(p => p && p.isActive !== false);
      let formattedProducts = activeProducts.map((p, idx) => formatProductItem(p, idx));

      if (formattedProducts.length < 12) {
        const existingIds = new Set(formattedProducts.map(p => String(p.id)));
        DEFAULT_RECOMMENDED.forEach((def, idx) => {
          if (!existingIds.has(String(def.id))) {
            formattedProducts.push({
              ...def,
              image: resolveImageUrl(def.image, def.id)
            });
            existingIds.add(String(def.id));
          }
        });
      }

      const halfIndex = Math.max(6, Math.floor(formattedProducts.length / 2));
      setProductsRow1(formattedProducts.slice(0, halfIndex));
      setProductsRow2(formattedProducts.slice(halfIndex));
      setFlashProducts(formattedProducts.slice(0, 8));

      // 2. Parent Categories
      const parentRes = await api.get('/parent-categories').catch(() => null);
      const parentData = parentRes?.data?.data || parentRes?.data;
      let parentList = Array.isArray(parentData) ? parentData : [];

      if (parentList && parentList.length > 0) {
        const formattedCats = parentList.map(c => {
          const rawImg = c.imageUrl || c.image_url || c.imagePath || c.image || '';
          const resolvedImg = resolveImageUrl(rawImg, c.id);
          const linkStr = c.link || `/shop?category=${encodeURIComponent(c.name)}`;
          const queryStr = linkStr.includes('?') ? linkStr.split('?')[1] : `category=${encodeURIComponent(c.name)}`;
          return {
            id: c.id,
            name: String(c.name || '').toUpperCase(),
            image: resolvedImg,
            query: queryStr,
            link: linkStr
          };
        });
        setCategories(formattedCats);
      } else {
        setCategories(CATEGORIES_DATA);
      }

      // 3. Shop Your Style
      setStyleCategories([
        { id: '1', label: 'Casual', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400', link: '/shop?style=Casual' },
        { id: '2', label: 'Formal', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400', link: '/shop?style=Formal' },
        { id: '3', label: 'Festive', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400', link: '/shop?style=Festive' },
        { id: '4', label: 'Streetwear', image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400', link: '/shop?style=Streetwear' },
        { id: '5', label: 'Jewellery', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400', link: '/shop?category=Jewellery' },
        { id: '6', label: 'Kids', image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400', link: '/shop?category=Kids' }
      ]);

      // 4. Shop by Occasion
      setOccasionCategories([
        { id: '1', label: 'Wedding', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400', link: '/shop?occasion=Wedding' },
        { id: '2', label: 'Festival', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400', link: '/shop?occasion=Festival' },
        { id: '3', label: 'Office', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400', link: '/shop?occasion=Office' },
        { id: '4', label: 'Date Night', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400', link: '/shop?occasion=Date+Night' },
        { id: '5', label: 'Vacation', image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400', link: '/shop?occasion=Vacation' },
        { id: '6', label: 'Gifting', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400', link: '/shop?occasion=Gifting' }
      ]);

      // 5. Price Chips
      setPriceChips([
        { id: '1', label: 'Under ₹499', link: '/shop?max_price=499', bgClass: 'bg-[#B71C1C] text-white' },
        { id: '2', label: 'Under ₹999', link: '/shop?max_price=999', bgClass: 'bg-slate-900 text-white' },
        { id: '3', label: 'Under ₹1499', link: '/shop?max_price=1499', bgClass: 'bg-indigo-900 text-white' },
        { id: '4', label: 'Under ₹1999', link: '/shop?max_price=1999', bgClass: 'bg-purple-900 text-white' },
        { id: '5', label: 'Under ₹2999', link: '/shop?max_price=2999', bgClass: 'bg-emerald-900 text-white' }
      ]);

    } catch (e) {}
  };

  const slide = heroSlides[currentHero] || heroSlides[0];

  const renderProductCard = (prod, idx) => {
    const liked = isInWishlist(prod.id);
    return (
      <div
        key={prod.id || idx}
        onClick={() => navigate(`/product/${prod.id}`)}
        className="h-[210px] xl:h-[220px] w-[160px] sm:w-[175px] xl:w-[185px] bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-2 flex flex-col overflow-hidden cursor-pointer shrink-0 group gap-1"
      >
        {/* Product Image Box */}
        <div className="relative w-full h-[125px] xl:h-[135px] bg-white rounded-xl overflow-hidden flex items-center justify-center shrink-0">
          <img
            src={resolveImageUrl(prod.image || prod.imageUrl, prod.id)}
            alt={prod.name}
            onError={(e) => handleImageError(e, prod.id)}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Wishlist Heart Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(prod.id);
            }}
            className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center border shadow-2xs transition-transform active:scale-90 ${
              liked
                ? 'bg-[#B71C1C] text-white border-[#B71C1C]'
                : 'bg-white/90 backdrop-blur-xs text-slate-600 border-slate-200 hover:text-[#B71C1C]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col justify-between pt-0.5 min-w-0">
          <div>
            <div className="flex items-center justify-between gap-1 text-[9.5px]">
              <span className="font-extrabold text-[#B71C1C] truncate uppercase">
                {prod.brand || 'KARVIYAM'}
              </span>
              <span className="flex items-center gap-0.5 font-bold text-slate-700 shrink-0">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>{prod.rating || 4.5}</span>
              </span>
            </div>

            <h3 className="font-bold text-[11.5px] text-slate-900 leading-tight truncate group-hover:text-[#B71C1C] transition-colors mt-0.5">
              {prod.name}
            </h3>
          </div>

          <div className="flex items-baseline gap-1 mt-auto">
            <span className="font-black text-xs text-slate-900">
              ₹{prod.price}
            </span>
            {prod.oldPrice && prod.oldPrice > prod.price && (
              <span className="text-[9px] text-slate-400 line-through">
                ₹{prod.oldPrice}
              </span>
            )}
            <span className="text-[9px] font-extrabold text-emerald-700 ml-auto">
              {prod.discount}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 min-w-0 flex flex-col gap-4">
      
      {/* 1. Hero Carousel */}
      {heroSlides.length > 0 && slide && (
        <div className="w-full h-[270px] xl:h-[290px] rounded-2xl overflow-hidden relative shadow-sm bg-slate-950 group">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src={slide.image}
              alt={slide.title || 'Hero Banner'}
              onError={(e) => handleImageError(e, slide.id)}
              className="w-full h-full object-cover object-center transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent" />
          </div>

          <div className="relative z-10 h-full p-6 xl:p-8 flex flex-col justify-center max-w-xl text-white">
            <span className="inline-block bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-widest w-max mb-2">
              {slide.tag || 'OFFICIAL DROP'}
            </span>

            <h1 className="font-display font-black text-xl xl:text-3xl leading-tight text-white tracking-tight uppercase drop-shadow-md">
              {slide.title}
            </h1>

            {slide.subtitle ? (
              <p className="text-[11px] xl:text-xs text-slate-200 font-medium mt-1.5 mb-4">
                {slide.subtitle}
              </p>
            ) : (
              <div className="mb-4" />
            )}

            <button
              onClick={() => navigate(slide.link || '/shop')}
              className="bg-[#B71C1C] hover:bg-[#900C0C] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl uppercase tracking-wider transition-all shadow-lg hover:shadow-red-900/40 w-max cursor-pointer"
            >
              {slide.buttonText || 'SHOP NOW'}
            </button>
          </div>

          {heroSlides.length > 1 && (
            <>
              <button
                onClick={() => setCurrentHero((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-900 flex items-center justify-center hover:bg-[#B71C1C] hover:text-white transition-colors shadow-md cursor-pointer z-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentHero((prev) => (prev + 1) % heroSlides.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-900 flex items-center justify-center hover:bg-[#B71C1C] hover:text-white transition-colors shadow-md cursor-pointer z-20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {heroSlides.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentHero(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentHero ? 'w-6 bg-[#B71C1C]' : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Trust & Delivery Highlights Bar */}
      <div className="w-full min-h-[64px] bg-white rounded-2xl border border-slate-200/90 shadow-xs px-3 xl:px-5 py-2 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2">
        <div className="flex-1 flex items-center gap-2.5 border-r border-slate-100 pr-3 xl:pr-5 min-w-[180px]">
          <div className="w-8 h-8 rounded-full bg-red-100 text-[#B71C1C] flex items-center justify-center font-bold shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-[11px] text-slate-900 uppercase">Free Delivery</h4>
            <p className="text-[10px] text-slate-500 font-medium">On orders above ₹499</p>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-2.5 border-r border-slate-100 px-3 xl:px-5 min-w-[180px]">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-[11px] text-slate-900 uppercase">Easy Returns</h4>
            <p className="text-[10px] text-slate-500 font-medium">7 Days hassle-free returns</p>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-2.5 border-r border-slate-100 px-3 xl:px-5 min-w-[180px]">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-[11px] text-slate-900 uppercase">100% Secure Payment</h4>
            <p className="text-[10px] text-slate-500 font-medium">UPI & Encrypted Checkout</p>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-2.5 pl-3 xl:pl-5 min-w-[180px]">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-[11px] text-slate-900 uppercase">Best Price Guarantee</h4>
            <p className="text-[10px] text-slate-500 font-medium">Unmatched quality</p>
          </div>
        </div>
      </div>

      {/* 3. Top Categories Carousel */}
      <div className="w-full bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-3 relative">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-black text-base xl:text-lg text-slate-900 tracking-tight">
              Shop by Category
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Explore top categories and find your style
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canCategoryScrollLeft && (
              <button
                type="button"
                onClick={handleCategoryScrollLeft}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {canCategoryScrollRight && (
              <button
                type="button"
                onClick={handleCategoryScrollRight}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="text-xs font-bold text-[#B71C1C] hover:underline cursor-pointer ml-1"
            >
              View All →
            </button>
          </div>
        </div>

        <div
          ref={categoryScrollRef}
          onScroll={checkCategoryScrollBoundary}
          className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-1 pt-0.5 w-full flex-nowrap"
        >
          {categories.map((cat) => (
            <div
              key={cat.id || cat.name}
              onClick={() => navigate(`/shop?${cat.query}`)}
              className="flex flex-col items-center shrink-0 w-[100px] xl:w-[110px] cursor-pointer group"
            >
              <div className="w-full aspect-square bg-[#F0F6FE] hover:bg-[#E2EEFE] transition-colors rounded-2xl p-2 flex items-center justify-center border border-slate-100/80 shadow-2xs overflow-hidden">
                <img
                  src={resolveImageUrl(cat.image, cat.id)}
                  alt={cat.name}
                  onError={(e) => handleImageError(e, cat.id)}
                  className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="font-bold text-[11px] text-slate-800 text-center truncate w-full mt-2 group-hover:text-[#B71C1C] transition-colors">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Flash Picks Section with Countdown Timer */}
      <div className="w-full bg-gradient-to-r from-red-950 via-slate-900 to-red-900 text-white rounded-3xl p-5 shadow-md flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-sm">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="font-display font-black text-base xl:text-lg tracking-tight uppercase flex items-center gap-2">
                <span>Flash Picks</span>
                <span className="text-[10px] bg-red-600/80 px-2 py-0.5 rounded-full font-sans tracking-normal">LIMITED TIME</span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-300 font-mono font-bold mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Ends in {String(timeLeft.hours).padStart(2, '0')} : {String(timeLeft.minutes).padStart(2, '0')} : {String(timeLeft.seconds).padStart(2, '0')}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/shop?filter=flash')}
            className="text-xs font-bold text-amber-300 hover:underline cursor-pointer"
          >
            Explore Deals →
          </button>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-1 pt-0.5 w-full flex-nowrap">
          {flashProducts.map((prod, idx) => renderProductCard(prod, idx))}
        </div>
      </div>

      {/* 5. Shop Your Style Section */}
      <div className="w-full bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-black text-base xl:text-lg text-slate-900 tracking-tight">
              Shop Your Style
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Curated aesthetics tailored for every mood
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {styleCategories.map(st => (
            <div
              key={st.id}
              onClick={() => navigate(st.link || '/shop')}
              className="bg-slate-50 border border-slate-200/80 hover:border-[#B71C1C] rounded-2xl p-2 flex flex-col items-center text-center cursor-pointer transition-all group shadow-2xs"
            >
              <div className="w-full aspect-square bg-white rounded-xl overflow-hidden mb-2">
                <img
                  src={st.image}
                  alt={st.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="font-black text-xs text-slate-900 group-hover:text-[#B71C1C]">{st.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Find Your Price Chips */}
      <div className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#B71C1C]" />
          <span className="font-extrabold text-xs text-slate-900 uppercase">Budget Store:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {priceChips.map(chip => (
            <button
              key={chip.id}
              onClick={() => navigate(chip.link)}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-transform active:scale-95 cursor-pointer shadow-2xs ${chip.bgClass}`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 7. Recommended For You Container */}
      <div className="w-full bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-4 relative">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-black text-base xl:text-lg text-slate-900 tracking-tight">
              Recommended For You
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Handpicked selections based on your style
            </p>
          </div>
          <button
            onClick={() => navigate('/shop')}
            className="text-xs font-bold text-[#B71C1C] hover:underline cursor-pointer flex items-center gap-0.5"
          >
            View All →
          </button>
        </div>

        {/* Row 1 Carousel */}
        <div className="relative group">
          <div
            ref={row1ScrollRef}
            className="flex items-center gap-2.5 xl:gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-1 pt-0.5 w-full flex-nowrap"
          >
            {productsRow1.map((prod, idx) => renderProductCard(prod, idx))}
          </div>
        </div>

        {/* Row 2 Carousel */}
        <div className="relative group">
          <div
            ref={row2ScrollRef}
            className="flex items-center gap-2.5 xl:gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-1 pt-0.5 w-full flex-nowrap"
          >
            {productsRow2.map((prod, idx) => renderProductCard(prod, idx))}
          </div>
        </div>
      </div>

      {/* 8. Dynamic Admin-Controlled Homepage Sections (Trending, Most-Loved Fashion for You, Starting @ ₹199) */}
      {homepageSections.map((sec) => {
        if (!sec || sec.enabled === false || !Array.isArray(sec.products) || sec.products.length === 0) return null;
        const isGrid = sec.display_type === 'grid';

        return (
          <div key={sec.id || sec.section_key} className="w-full bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-black text-base xl:text-lg text-slate-900 tracking-tight">
                  {sec.title}
                </h2>
                {sec.subtitle && (
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {sec.subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate(sec.view_all_link || '/shop')}
                className="text-xs font-bold text-[#B71C1C] hover:underline cursor-pointer flex items-center gap-0.5"
              >
                {sec.view_all_text || 'View All →'}
              </button>
            </div>

            {isGrid ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {sec.products.map((prod, idx) => renderProductCard(prod, idx))}
              </div>
            ) : (
              <div className="flex items-center gap-2.5 xl:gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-1 pt-0.5 w-full flex-nowrap">
                {sec.products.map((prod, idx) => renderProductCard(prod, idx))}
              </div>
            )}
          </div>
        );
      })}

      {/* 9. Shop by Occasion Section */}
      <div className="w-full bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-black text-base xl:text-lg text-slate-900 tracking-tight">
              Shop by Occasion
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Find perfect outfits for every event
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {occasionCategories.map(occ => (
            <div
              key={occ.id}
              onClick={() => navigate(occ.link || '/shop')}
              className="bg-slate-50 border border-slate-200/80 hover:border-[#B71C1C] rounded-2xl p-2 flex flex-col items-center text-center cursor-pointer transition-all group shadow-2xs"
            >
              <div className="w-full aspect-square bg-white rounded-xl overflow-hidden mb-2">
                <img
                  src={occ.image}
                  alt={occ.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="font-black text-xs text-slate-900 group-hover:text-[#B71C1C]">{occ.label}</span>
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}
