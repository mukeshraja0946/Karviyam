import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  IndianRupee,
  Gift,
  ShoppingBag
} from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import api from '../../utils/api';
import { resolveImageUrl, handleImageError } from '../../utils/imageUtils';
import FindYourPrice from '../FindYourPrice';

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
  { id: 106, name: 'Kids Printed Shirt', brand: 'KARVIYAM', rating: 4.5, reviews: '310', price: 499, oldPrice: 799, discount: '38% OFF', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600' },
  { id: 107, name: 'Casual Denim Jacket', brand: 'KARVIYAM', rating: 4.7, reviews: '1.1k', price: 1799, oldPrice: 2999, discount: '40% OFF', image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600' },
  { id: 108, name: 'Floral Summer Dress', brand: 'KARVIYAM', rating: 4.5, reviews: '850', price: 1099, oldPrice: 1999, discount: '45% OFF', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600' },
  { id: 109, name: 'Leather Crossbody Bag', brand: 'KARVIYAM', rating: 4.8, reviews: '420', price: 1499, oldPrice: 2799, discount: '46% OFF', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600' },
  { id: 110, name: 'Polarized Retro Sunglasses', brand: 'KARVIYAM', rating: 4.4, reviews: '670', price: 799, oldPrice: 1499, discount: '46% OFF', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600' },
  { id: 111, name: 'Unisex Knit Winter Beanie', brand: 'KARVIYAM', rating: 4.6, reviews: '530', price: 499, oldPrice: 899, discount: '44% OFF', image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600' },
  { id: 112, name: 'High-Top Canvas Sneakers', brand: 'KARVIYAM', rating: 4.7, reviews: '1.3k', price: 1899, oldPrice: 3299, discount: '42% OFF', image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600' }
];

export default function DesktopCenterContent() {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [currentHero, setCurrentHero] = useState(0);
  const [heroSlides, setHeroSlides] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [speed, setSpeed] = useState(5000);

  const [categories, setCategories] = useState(CATEGORIES_DATA);
  const [productsRow1, setProductsRow1] = useState([]);
  const [productsRow2, setProductsRow2] = useState([]);
  const [homepageSections, setHomepageSections] = useState([]);

  const fetchHomepageSections = async () => {
    try {
      const res = await api.get('/homepage-sections').catch(() => null);
      const data = res?.data?.data || res?.data;
      if (Array.isArray(data)) {
        setHomepageSections(data);
      }
    } catch (e) {
      console.error('Error fetching homepage sections in DesktopCenterContent:', e);
    }
  };

  // Category carousel ref & state
  const categoryScrollRef = useRef(null);
  const [canCategoryScrollLeft, setCanCategoryScrollLeft] = useState(false);
  const [canCategoryScrollRight, setCanCategoryScrollRight] = useState(true);

  // Recommendation Rows refs & states (Row 1 & Row 2 inside SAME container)
  const row1ScrollRef = useRef(null);
  const row2ScrollRef = useRef(null);
  const [canRow1Left, setCanRow1Left] = useState(false);
  const [canRow1Right, setCanRow1Right] = useState(true);
  const [canRow2Left, setCanRow2Left] = useState(false);
  const [canRow2Right, setCanRow2Right] = useState(true);

  const checkCategoryScrollBoundary = () => {
    const el = categoryScrollRef.current;
    if (el) {
      const isAtLeft = el.scrollLeft <= 5;
      const isAtRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 5;
      setCanCategoryScrollLeft(!isAtLeft);
      setCanCategoryScrollRight(!isAtRight);
    }
  };

  const checkRow1ScrollBoundary = () => {
    const el = row1ScrollRef.current;
    if (el) {
      const isAtLeft = el.scrollLeft <= 5;
      const isAtRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 5;
      setCanRow1Left(!isAtLeft);
      setCanRow1Right(!isAtRight);
    }
  };

  const checkRow2ScrollBoundary = () => {
    const el = row2ScrollRef.current;
    if (el) {
      const isAtLeft = el.scrollLeft <= 5;
      const isAtRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 5;
      setCanRow2Left(!isAtLeft);
      setCanRow2Right(!isAtRight);
    }
  };

  useEffect(() => {
    const catEl = categoryScrollRef.current;
    if (catEl) {
      checkCategoryScrollBoundary();
      catEl.addEventListener('scroll', checkCategoryScrollBoundary);
      window.addEventListener('resize', checkCategoryScrollBoundary);
    }
    const r1El = row1ScrollRef.current;
    if (r1El) {
      checkRow1ScrollBoundary();
      r1El.addEventListener('scroll', checkRow1ScrollBoundary);
      window.addEventListener('resize', checkRow1ScrollBoundary);
    }
    const r2El = row2ScrollRef.current;
    if (r2El) {
      checkRow2ScrollBoundary();
      r2El.addEventListener('scroll', checkRow2ScrollBoundary);
      window.addEventListener('resize', checkRow2ScrollBoundary);
    }
    return () => {
      if (catEl) {
        catEl.removeEventListener('scroll', checkCategoryScrollBoundary);
        window.removeEventListener('resize', checkCategoryScrollBoundary);
      }
      if (r1El) {
        r1El.removeEventListener('scroll', checkRow1ScrollBoundary);
        window.removeEventListener('resize', checkRow1ScrollBoundary);
      }
      if (r2El) {
        r2El.removeEventListener('scroll', checkRow2ScrollBoundary);
        window.removeEventListener('resize', checkRow2ScrollBoundary);
      }
    };
  }, [categories, productsRow1, productsRow2]);

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

  const handleRow1ScrollLeft = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const el = row1ScrollRef.current;
    if (el) {
      el.scrollBy({ left: -360, behavior: 'smooth' });
      setTimeout(checkRow1ScrollBoundary, 350);
    }
  };

  const handleRow1ScrollRight = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const el = row1ScrollRef.current;
    if (el) {
      el.scrollBy({ left: 360, behavior: 'smooth' });
      setTimeout(checkRow1ScrollBoundary, 350);
    }
  };

  const handleRow2ScrollLeft = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const el = row2ScrollRef.current;
    if (el) {
      el.scrollBy({ left: -360, behavior: 'smooth' });
      setTimeout(checkRow2ScrollBoundary, 350);
    }
  };

  const handleRow2ScrollRight = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const el = row2ScrollRef.current;
    if (el) {
      el.scrollBy({ left: 360, behavior: 'smooth' });
      setTimeout(checkRow2ScrollBoundary, 350);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
    fetchBanners();
    fetchHomepageSections();

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchBanners();
        fetchProductsAndCategories();
        fetchHomepageSections();
      }
    };

    const handleStorage = () => {
      fetchBanners();
      fetchProductsAndCategories();
      fetchHomepageSections();
    };

    window.addEventListener('karviyam_products_updated', fetchProductsAndCategories);
    window.addEventListener('karviyam_categories_updated', fetchProductsAndCategories);
    window.addEventListener('karviyam_parent_categories_updated', fetchProductsAndCategories);
    window.addEventListener('karviyam_homepage_sections_updated', fetchHomepageSections);
    window.addEventListener('karviyam_banners_updated', fetchBanners);
    window.addEventListener('focus', handleFocusOrVisible);
    window.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('karviyam_products_updated', fetchProductsAndCategories);
      window.removeEventListener('karviyam_categories_updated', fetchProductsAndCategories);
      window.removeEventListener('karviyam_parent_categories_updated', fetchProductsAndCategories);
      window.removeEventListener('karviyam_homepage_sections_updated', fetchHomepageSections);
      window.removeEventListener('karviyam_banners_updated', fetchBanners);
      window.removeEventListener('focus', handleFocusOrVisible);
      window.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

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

      if (!list || list.length === 0) {
        try {
          const savedBanners = localStorage.getItem('karviyam_admin_banners');
          if (savedBanners) {
            const parsed = JSON.parse(savedBanners);
            if (Array.isArray(parsed)) list = parsed;
          }
        } catch (eLoc) {}
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
      console.error('Error fetching hero banners in DesktopCenterContent:', e);
      setHeroSlides([]);
    }
  };

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

  const fetchProductsAndCategories = async () => {
    try {
      // 1. FETCH PRODUCTS FOR RECOMMENDED FOR YOU (2 ROWS INSIDE SAME CONTAINER)
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
          rating: p.rating || fallback.rating || 4.5,
          reviews: p.reviewsCount ? `${p.reviewsCount}` : fallback.reviews,
          price: price,
          oldPrice: oldPrice,
          discount: `${disc}% OFF`,
          image: resolvedImage
        };
      };

      const activeProducts = rawProductList.filter(p => p && p.isActive !== false);
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

      // Divide products into Row 1 & Row 2 inside the same Recommended For You section
      const halfIndex = Math.max(6, Math.floor(formattedProducts.length / 2));
      const row1 = formattedProducts.slice(0, halfIndex);
      let row2 = formattedProducts.slice(halfIndex);

      if (row2.length < 6) {
        row2 = [...formattedProducts].reverse().slice(0, Math.max(6, row1.length));
      }

      setProductsRow1(row1);
      setProductsRow2(row2);

      // 2. FETCH PARENT CATEGORIES
      const parentRes = await api.get('/parent-categories').catch(() => null);
      const parentData = parentRes?.data?.data || parentRes?.data;
      let parentList = Array.isArray(parentData) ? parentData : [];

      if (!parentList || parentList.length === 0) {
        try {
          const saved = localStorage.getItem('karviyam_admin_parent_categories');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) parentList = parsed.filter(c => c.isActive !== false);
          }
        } catch (eP) {}
      }

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

        if (formattedCats.length < 10) {
          const existingNames = new Set(formattedCats.map(fc => fc.name));
          for (const defCat of CATEGORIES_DATA) {
            if (formattedCats.length >= 10) break;
            if (!existingNames.has(defCat.name)) {
              formattedCats.push(defCat);
              existingNames.add(defCat.name);
            }
          }
        }
        setCategories(formattedCats);
      } else {
        setCategories(CATEGORIES_DATA);
      }
    } catch (e) {
      console.error('Error fetching data in DesktopCenterContent:', e);
      setProductsRow1(DEFAULT_RECOMMENDED.slice(0, 6));
      setProductsRow2(DEFAULT_RECOMMENDED.slice(6, 12));
    }
  };

  const slide = heroSlides[currentHero] || heroSlides[0];

  const renderProductCard = (prod, idx) => {
    const liked = isInWishlist(prod.id);
    return (
      <div
        key={prod.id || idx}
        onClick={() => navigate(`/product/${prod.id}`)}
        className="h-[195px] xl:h-[205px] w-[150px] sm:w-[165px] xl:w-[175px] bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-1.5 flex flex-col overflow-hidden cursor-pointer shrink-0 group gap-1"
      >
        {/* Product Image Box */}
        <div className="relative w-full h-[120px] xl:h-[130px] bg-white rounded-lg overflow-hidden flex items-center justify-center shrink-0">
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
            className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors shadow-2xs ${
              liked ? 'bg-[#B71C1C] text-white' : 'bg-white/90 text-slate-600 hover:text-[#B71C1C]'
            }`}
            title={liked ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-3 h-3 ${liked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Content Box */}
        <div className="flex-1 flex flex-col justify-start pt-0.5 px-0.5 gap-0.5">
          {/* Brand & Rating */}
          <div className="flex items-center justify-between text-[9px]">
            <span className="font-extrabold uppercase tracking-wider text-[#B71C1C] truncate max-w-[70px]">
              {prod.brand}
            </span>
            <div className="flex items-center gap-0.5 text-slate-700 font-bold">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              <span>{prod.rating}</span>
            </div>
          </div>

          {/* Single Line Truncated Title */}
          <h3 className="font-extrabold text-[10px] xl:text-[11px] text-slate-900 leading-tight truncate overflow-hidden group-hover:text-[#B71C1C] transition-colors" title={prod.name}>
            {prod.name}
          </h3>

          {/* Price & Offer Row */}
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-black text-[11px] xl:text-xs text-slate-900">
              ₹{prod.price}
            </span>
            {prod.oldPrice > prod.price && (
              <span className="text-[9px] text-slate-400 line-through">
                ₹{prod.oldPrice}
              </span>
            )}
            <span className="text-[8.5px] font-extrabold text-emerald-700">
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
        <div className="w-full h-[270px] xl:h-[290px] rounded-xl overflow-hidden relative shadow-sm bg-slate-950 group">
          {/* Background Image Layer with HTML img for 100% reliable rendering */}
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

      {/* Find Your Price Section - Placed immediately BELOW main homepage hero banner */}
      <FindYourPrice />



      {/* 3. Shop by Category Section */}
      <div className="w-full bg-white rounded-3xl p-4 flex flex-col gap-3 relative">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-black text-base xl:text-lg text-slate-900 tracking-tight">
              Shop by Category
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Explore top categories and find your favorites
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canCategoryScrollLeft && (
              <button
                type="button"
                onClick={handleCategoryScrollLeft}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Previous Categories"
                aria-label="Previous Categories"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {canCategoryScrollRight && (
              <button
                type="button"
                onClick={handleCategoryScrollRight}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Next Categories"
                aria-label="Next Categories"
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
              className="flex flex-col items-center shrink-0 w-[84px] sm:w-[90px] xl:w-[96px] cursor-pointer group"
            >
              <div className="w-full aspect-square bg-slate-100 rounded-2xl overflow-hidden shadow-2xs group-hover:shadow-md transition-all duration-300">
                <img
                  src={resolveImageUrl(cat.image, cat.id)}
                  alt={cat.name}
                  onError={(e) => handleImageError(e, cat.id)}
                  className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="font-bold text-[11px] text-slate-800 text-center truncate w-full mt-1.5 group-hover:text-[#B71C1C] transition-colors">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SINGLE RECOMMENDED FOR YOU CONTAINER WITH TWO INDEPENDENT HORIZONTAL PRODUCT CAROUSEL ROWS */}
      <div className="w-full bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-4 relative">
        
        {/* Single Header */}
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

        {/* ROW 1 CAROUSEL */}
        <div className="relative group">
          <div
            ref={row1ScrollRef}
            onScroll={checkRow1ScrollBoundary}
            className="flex items-center gap-2.5 xl:gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-1 pt-0.5 w-full flex-nowrap"
          >
            {productsRow1.map((prod, idx) => renderProductCard(prod, idx))}
          </div>
        </div>

        {/* ROW 2 CAROUSEL */}
        <div className="relative group">
          <div
            ref={row2ScrollRef}
            onScroll={checkRow2ScrollBoundary}
            className="flex items-center gap-2.5 xl:gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-1 pt-0.5 w-full flex-nowrap"
          >
            {productsRow2.map((prod, idx) => renderProductCard(prod, idx))}
          </div>
        </div>

      </div>

      {/* 5. DYNAMIC ADMIN-CONTROLLED HOMEPAGE SECTIONS (Trending, Most-Loved Fashion for You, Starting @ ₹199) */}
      {homepageSections.map((sec) => {
        if (!sec || sec.enabled === false || !Array.isArray(sec.products) || sec.products.length === 0) return null;
        const isGrid = sec.display_type === 'grid';

        return (
          <div key={sec.id || sec.section_key} className="w-full bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-4 relative">
            {/* Section Header */}
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

            {/* Products Layout (Grid vs Horizontal Scroll) */}
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

    </main>
  );
}
