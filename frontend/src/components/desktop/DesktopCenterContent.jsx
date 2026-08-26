import React, { useState, useEffect } from 'react';
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

const HERO_SLIDES = [
  {
    id: 1,
    tag: 'NEW SEASON ARRIVAL',
    title: 'NEW STYLE NEW YOU',
    subtitle: 'Explore our latest collection',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600',
    link: '/shop'
  },
  {
    id: 2,
    tag: 'FESTIVE COLLECTION 2026',
    title: 'ROYAL EMERALD & COUTURE',
    subtitle: 'Handcrafted 925 Silver Jewellery & Apparel',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600',
    link: '/shop?category=Jewellery'
  }
];

const CATEGORIES_DATA = [
  { id: 'men', name: 'MEN', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400', query: 'category=Men' },
  { id: 'women', name: 'WOMEN', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400', query: 'category=Women' },
  { id: 'kids', name: 'KIDS & BABY', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400', query: 'category=Kids' },
  { id: 'unisex', name: 'UNISEX', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400', query: 'category=Unisex' },
  { id: 'accessories', name: 'ACCESSORIES', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400', query: 'category=Accessories' },
  { id: 'kitchen', name: 'KITCHEN & HOME', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400', query: 'category=Kitchen' },
  { id: 'footwear', name: 'FOOTWEAR', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', query: 'category=Footwear' }
];

const DEFAULT_RECOMMENDED = [
  {
    id: 101,
    name: 'Men Solid Polo T-Shirt',
    brand: 'KARVIYAM',
    rating: 4.5,
    reviews: '1.2k',
    price: 699,
    oldPrice: 1299,
    discount: '46% OFF',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600'
  },
  {
    id: 102,
    name: 'Zari Border Silk Saree',
    brand: 'KARVIYAM',
    rating: 4.6,
    reviews: '980',
    price: 1299,
    oldPrice: 2499,
    discount: '48% OFF',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'
  },
  {
    id: 103,
    name: 'Printed Oversized T-Shirt',
    brand: 'KARVIYAM',
    rating: 4.3,
    reviews: '740',
    price: 599,
    oldPrice: 999,
    discount: '40% OFF',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600'
  },
  {
    id: 104,
    name: 'Running Sneakers',
    brand: 'KARVIYAM',
    rating: 4.6,
    reviews: '1.5k',
    price: 1499,
    oldPrice: 2499,
    discount: '40% OFF',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'
  },
  {
    id: 105,
    name: 'Cotton Kurta Set',
    brand: 'KARVIYAM',
    rating: 4.4,
    reviews: '620',
    price: 899,
    oldPrice: 1599,
    discount: '44% OFF',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600'
  },
  {
    id: 106,
    name: 'Kids Printed Shirt',
    brand: 'KARVIYAM',
    rating: 4.5,
    reviews: '310',
    price: 499,
    oldPrice: 799,
    discount: '38% OFF',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600'
  }
];

export default function DesktopCenterContent() {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [currentHero, setCurrentHero] = useState(0);
  const [heroSlides, setHeroSlides] = useState(HERO_SLIDES);
  const [products, setProducts] = useState(DEFAULT_RECOMMENDED);
  const [categories, setCategories] = useState(CATEGORIES_DATA);

  useEffect(() => {
    fetchProductsAndCategories();
    fetchBanners();
    window.addEventListener('karviyam_products_updated', fetchProductsAndCategories);
    window.addEventListener('karviyam_categories_updated', fetchProductsAndCategories);
    window.addEventListener('karviyam_banners_updated', fetchBanners);
    window.addEventListener('storage', fetchProductsAndCategories);
    return () => {
      window.removeEventListener('karviyam_products_updated', fetchProductsAndCategories);
      window.removeEventListener('karviyam_categories_updated', fetchProductsAndCategories);
      window.removeEventListener('karviyam_banners_updated', fetchBanners);
      window.removeEventListener('storage', fetchProductsAndCategories);
    };
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await api.get('/banners').catch(() => null);
      const apiData = res?.data?.data || res?.data || res;
      let list = Array.isArray(apiData) ? apiData : [];

      if (!list || list.length === 0) {
        const saved = localStorage.getItem('karviyam_admin_banners');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
          } catch (eP) {}
        }
      }

      if (list && list.length > 0) {
        const activeBanners = list.filter(b => b.isActive !== false && b.status !== 'inactive');
        if (activeBanners.length > 0) {
          const apiOrigin = process.env.VITE_API_URL ? process.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8080';
          const formatted = activeBanners.map(b => {
            let img = b.imageUrl || b.imagePath || b.image || '';
            if (img.startsWith('/')) {
              img = `${apiOrigin}${img}`;
            }
            return {
              id: b.id,
              tag: 'NEW SEASON ARRIVAL',
              title: b.title || 'NEW STYLE NEW YOU',
              subtitle: b.subtitle || 'Explore our latest collection',
              image: img || HERO_SLIDES[0].image,
              link: b.link || b.buttonLink || '/shop'
            };
          });
          setHeroSlides(formatted);
        }
      }
    } catch (e) {
      console.error('Error fetching hero banners in DesktopCenterContent:', e);
    }
  };

  const fetchProductsAndCategories = async () => {
    try {
      // Fetch Products
      const featRes = await api.get('/products/featured').catch(() => null);
      const featData = featRes?.data?.data || featRes?.data || featRes;
      let list = Array.isArray(featData) ? featData : (Array.isArray(featData?.content) ? featData.content : []);
      
      if (!list || list.length === 0) {
        const fallRes = await api.get('/products?size=10').catch(() => null);
        const fallData = fallRes?.data?.data || fallRes?.data;
        list = Array.isArray(fallData?.content) ? fallData.content : (Array.isArray(fallData) ? fallData : []);
      }

      // Check Admin Saved Products for live updates
      try {
        const savedAdmin = localStorage.getItem('karviyam_admin_products');
        if (savedAdmin) {
          const parsed = JSON.parse(savedAdmin);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const activeAdminProds = parsed.filter(p => p.isActive !== false);
            if (activeAdminProds.length > 0) {
              list = [...activeAdminProds, ...list.filter(p => !activeAdminProds.some(a => String(a.id) === String(p.id)))];
            }
          }
        }
      } catch (eSaved) {}

      if (list && list.length > 0) {
        const formatted = list.filter(p => p.isActive !== false).slice(0, 6).map((p, idx) => {
          const price = p.price || DEFAULT_RECOMMENDED[idx % 6].price;
          const oldPrice = p.oldPrice || Math.round(price * 1.45);
          const disc = Math.round(((oldPrice - price) / oldPrice) * 100);
          return {
            id: p.id,
            name: p.name || DEFAULT_RECOMMENDED[idx % 6].name,
            brand: p.brand || 'KARVIYAM',
            rating: p.rating || 4.5,
            reviews: p.reviewsCount ? `${p.reviewsCount}` : DEFAULT_RECOMMENDED[idx % 6].reviews,
            price: price,
            oldPrice: oldPrice,
            discount: `${disc}% OFF`,
            image: p.imageUrl || (Array.isArray(p.images) && p.images[0]) || DEFAULT_RECOMMENDED[idx % 6].image
          };
        });
        
        // Fill up to 6 items if fewer
        while (formatted.length < 6) {
          const fallback = DEFAULT_RECOMMENDED[formatted.length];
          formatted.push(fallback);
        }
        setProducts(formatted);
      }

      // Fetch Categories
      const catRes = await api.get('/categories/tree').catch(() => null);
      const catData = catRes?.data?.data || catRes?.data;
      let catList = Array.isArray(catData) ? catData : [];

      try {
        const savedCats = localStorage.getItem('karviyam_admin_categories');
        if (savedCats) {
          const parsedCats = JSON.parse(savedCats);
          if (Array.isArray(parsedCats) && parsedCats.length > 0) {
            const adminRoots = parsedCats.filter(c => !c.parentId && (c.isActive === undefined || c.isActive === true || c.is_active === 1));
            if (adminRoots.length > 0) {
              catList = [...adminRoots, ...catList.filter(c => !adminRoots.some(s => String(s.id) === String(c.id)))];
            }
          }
        }
      } catch (eCats) {}

      if (catList.length > 0) {
        const apiOrigin = process.env.VITE_API_URL ? process.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8080';
        const activeRoots = catList
          .filter(c => !c.parentId && c.isActive !== false && c.is_active !== 0 && c.enabled !== false)
          .sort((a, b) => (a.orderIndex || a.order_index || 0) - (b.orderIndex || b.order_index || 0));

        const formattedCats = activeRoots.slice(0, 7).map((c, i) => {
          let img = c.imageUrl || c.iconUrl || CATEGORIES_DATA[i % CATEGORIES_DATA.length].image;
          if (img.startsWith('/')) {
            img = `${apiOrigin}${img}`;
          }
          return {
            id: c.id,
            name: (c.name || CATEGORIES_DATA[i % CATEGORIES_DATA.length].name).toUpperCase(),
            image: img,
            query: `category=${encodeURIComponent(c.name)}`
          };
        });
        setCategories(formattedCats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const slide = heroSlides[currentHero] || heroSlides[0] || HERO_SLIDES[0];

  return (
    <main className="flex-1 min-w-0 flex flex-col gap-3">
      
      {/* 1. Hero Carousel */}
      <div className="w-full h-[270px] xl:h-[290px] rounded-xl overflow-hidden relative shadow-sm bg-slate-950 group">
        
        {/* Slide Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full p-6 xl:p-8 flex flex-col justify-center max-w-xl text-white">
          <span className="inline-block bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-widest w-max mb-2">
            {slide.tag}
          </span>

          <h1 className="font-display font-black text-xl xl:text-3xl leading-tight text-white tracking-tight uppercase drop-shadow-md">
            {slide.title}
          </h1>

          <p className="text-[11px] xl:text-xs text-slate-200 font-medium mt-1.5 mb-4">
            {slide.subtitle}
          </p>

          <button
            onClick={() => navigate(slide.link)}
            className="bg-white text-slate-950 font-extrabold text-[11px] uppercase tracking-wider px-6 py-2.5 rounded-full hover:bg-[#B71C1C] hover:text-white transition-all shadow-md w-max cursor-pointer"
          >
            SHOP NOW
          </button>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => setCurrentHero((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-900 flex items-center justify-center hover:bg-[#B71C1C] hover:text-white transition-colors shadow-md cursor-pointer z-20"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => setCurrentHero((prev) => (prev + 1) % HERO_SLIDES.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-900 flex items-center justify-center hover:bg-[#B71C1C] hover:text-white transition-colors shadow-md cursor-pointer z-20"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Pagination Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentHero(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentHero ? 'w-6 bg-[#B71C1C]' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 2. Offer Strip */}
      <div className="w-full min-h-[64px] bg-white rounded-xl border border-slate-200/90 shadow-xs px-3 xl:px-5 py-2 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2">
        
        {/* Item 1 */}
        <div className="flex-1 flex items-center gap-2.5 border-r border-slate-100 pr-3 xl:pr-5 min-w-[180px]">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-[11px] text-slate-900 uppercase">UNDER ₹499</h4>
            <p className="text-[10px] text-slate-500 font-medium">Best Under Budget Finds</p>
          </div>
        </div>

        {/* Item 2 */}
        <div className="flex-1 flex items-center gap-2.5 border-r border-slate-100 px-3 xl:px-5 min-w-[180px]">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-[11px] text-slate-900 uppercase">DEAL OF THE DAY</h4>
            <p className="text-[10px] text-slate-500 font-medium">New Deals Everyday</p>
          </div>
        </div>

        {/* Item 3 */}
        <div className="flex-1 flex items-center gap-2.5 pl-3 xl:pl-5 min-w-[180px]">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-[11px] text-slate-900 uppercase">WHAT'S NEW</h4>
            <p className="text-[10px] text-slate-500 font-medium">Latest Arrivals</p>
          </div>
        </div>

      </div>

      {/* 3. Top Categories Section */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-black text-sm text-slate-900 tracking-tight">
            Top Categories
          </h2>
          <button
            onClick={() => navigate('/shop')}
            className="text-[11px] font-bold text-[#B71C1C] hover:underline cursor-pointer flex items-center gap-0.5"
          >
            View All →
          </button>
        </div>

        {/* 7 Identical Category Cards (No Image Background Box) */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 xl:gap-2.5 w-full">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigate(`/shop?${cat.query}`)}
              className="h-[115px] xl:h-[125px] bg-white rounded-xl p-1.5 flex flex-col items-center justify-between cursor-pointer transition-all border border-slate-200/80 hover:shadow-xs group"
            >
              <div className="w-full h-[78px] xl:h-[86px] bg-white rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                />
              </div>
              <span className="font-extrabold text-[9px] uppercase tracking-wider text-slate-800 text-center truncate w-full mb-0.5">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Recommended For You Section */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-black text-sm text-slate-900 tracking-tight">
            Recommended For You
          </h2>
          <button
            onClick={() => navigate('/shop')}
            className="text-[11px] font-bold text-[#B71C1C] hover:underline cursor-pointer flex items-center gap-0.5"
          >
            View All →
          </button>
        </div>

        {/* Product Cards Grid (No Image Background Box) */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 xl:gap-2.5 w-full">
          {products.map((prod) => {
            const liked = isInWishlist(prod.id);
            return (
              <div
                key={prod.id}
                onClick={() => navigate(`/product/${prod.id}`)}
                className="h-[215px] xl:h-[230px] bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-1.5 flex flex-col justify-between overflow-hidden cursor-pointer group"
              >
                {/* Product Image Box (Directly on White Card Background) */}
                <div className="relative w-full h-[120px] xl:h-[130px] bg-white rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
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
                  >
                    <Heart className={`w-3 h-3 ${liked ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between pt-1.5 px-0.5">
                  <div>
                    {/* Brand Tag & Rating */}
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="font-extrabold uppercase tracking-wider text-[#B71C1C] truncate max-w-[70px]">
                        {prod.brand}
                      </span>
                      <div className="flex items-center gap-0.5 text-slate-700 font-bold">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>{prod.rating}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-extrabold text-[10px] xl:text-[11px] text-slate-900 leading-snug line-clamp-2 h-[26px] overflow-hidden mt-0.5 group-hover:text-[#B71C1C] transition-colors" title={prod.name}>
                      {prod.name}
                    </h3>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1">
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
          })}
        </div>
      </div>

    </main>
  );
}
