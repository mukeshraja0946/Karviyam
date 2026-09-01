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
  Star
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import api from '../../utils/api';
import { resolveImageUrl, handleImageError } from '../../utils/imageUtils';
import toast from 'react-hot-toast';

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

  // Config & Section State from Admin / API
  const [mobileConfig, setMobileConfig] = useState(null);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [flashProducts, setFlashProducts] = useState([]);
  const [styleCategories, setStyleCategories] = useState([]);
  const [occasionCategories, setOccasionCategories] = useState([]);
  const [priceChips, setPriceChips] = useState([]);
  const [completeLook, setCompleteLook] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [trustBadges, setTrustBadges] = useState([]);

  // Timer State for Flash Picks
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 41, seconds: 36 });

  // 1. Fetch Config & Master Settings
  useEffect(() => {
    loadAllMobileData();

    window.addEventListener('karviyam_mobile_homepage_updated', loadAllMobileData);
    window.addEventListener('karviyam_products_updated', loadAllMobileData);
    window.addEventListener('karviyam_banners_updated', loadAllMobileData);
    window.addEventListener('storage', loadAllMobileData);

    return () => {
      window.removeEventListener('karviyam_mobile_homepage_updated', loadAllMobileData);
      window.removeEventListener('karviyam_products_updated', loadAllMobileData);
      window.removeEventListener('karviyam_banners_updated', loadAllMobileData);
      window.removeEventListener('storage', loadAllMobileData);
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
    const bannerTimer = setInterval(() => {
      setCurrentBannerIdx(prev => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(bannerTimer);
  }, [banners.length]);

  const loadAllMobileData = async () => {
    try {
      // 1. Load Admin Config
      let adminConfig = null;
      try {
        const saved = localStorage.getItem('karviyam_mobile_homepage_config');
        if (saved) adminConfig = JSON.parse(saved);
      } catch (e) {}

      // Try server settings
      try {
        const resSettings = await api.get('/settings').catch(() => null);
        const settingsData = resSettings?.data?.data || resSettings?.data || {};
        if (settingsData.karviyam_mobile_homepage_config) {
          adminConfig = typeof settingsData.karviyam_mobile_homepage_config === 'string'
            ? JSON.parse(settingsData.karviyam_mobile_homepage_config)
            : settingsData.karviyam_mobile_homepage_config;
        }
      } catch (eSettings) {}

      // 2. Fetch Categories for Category Strip
      try {
        const resCat = await api.get('/parent-categories').catch(() => null);
        const apiCats = resCat?.data?.data || resCat?.data || [];
        let catList = Array.isArray(apiCats) ? apiCats : [];

        if (catList.length === 0) {
          const savedCat = localStorage.getItem('karviyam_admin_parent_categories');
          if (savedCat) catList = JSON.parse(savedCat);
        }

        if (adminConfig?.categoryStrip && Array.isArray(adminConfig.categoryStrip)) {
          setCategories(adminConfig.categoryStrip.filter(c => c.active !== false));
        } else if (catList.length > 0) {
          setCategories(catList.map(c => ({
            id: c.id,
            name: (c.name || '').toUpperCase(),
            label: (c.name || '').toUpperCase(),
            image: resolveImageUrl(c.imageUrl || c.image || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300', c.id),
            link: `/shop?category=${encodeURIComponent(c.name)}`
          })));
        } else {
          // Default Reference Categories
          setCategories([
            { id: '1', name: 'T-SHIRTS', label: 'T-SHIRTS', image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300', link: '/shop?category=T-Shirts' },
            { id: '2', name: 'SNEAKERS', label: 'SNEAKERS', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300', link: '/shop?category=Sneakers' },
            { id: '3', name: 'KURTA SETS', label: 'KURTA SETS', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300', link: '/shop?category=Kurta+Sets' },
            { id: '4', name: 'WOMEN', label: 'WOMEN', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300', link: '/shop?category=Women' },
            { id: '5', name: 'MEN', label: 'MEN', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300', link: '/shop?category=Men' },
            { id: '6', name: 'JEANS', label: 'JEANS', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300', link: '/shop?category=Jeans' }
          ]);
        }
      } catch (eCat) {}

      // 3. Fetch Hero Banners
      try {
        const resBanners = await api.get('/banners').catch(() => null);
        const apiBanners = resBanners?.data?.data || resBanners?.data || [];
        let bList = Array.isArray(apiBanners) ? apiBanners : [];

        if (adminConfig?.heroBanners && Array.isArray(adminConfig.heroBanners)) {
          setBanners(adminConfig.heroBanners.filter(b => b.active !== false));
        } else if (bList.length > 0) {
          setBanners(bList.filter(b => b.isActive !== false).map(b => ({
            id: b.id,
            badge: b.tag || b.badge || 'FLASH SALE',
            title: b.title || 'UP TO 60% OFF',
            subtitle: b.subtitle || 'Limited time only!',
            image: resolveImageUrl(b.mobileImageUrl || b.imageUrl || b.imagePath || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600', b.id),
            cta: b.buttonText || b.cta || 'SHOP NOW',
            link: b.buttonLink || b.link || '/shop',
            enableTimer: b.enableTimer !== undefined ? Boolean(b.enableTimer) : false,
            timerHours: b.timerHours !== undefined ? Number(b.timerHours) : 2,
            timerMinutes: b.timerMinutes !== undefined ? Number(b.timerMinutes) : 41,
            timerSeconds: b.timerSeconds !== undefined ? Number(b.timerSeconds) : 36
          })));
        } else {
          setBanners([
            {
              id: 'b1',
              badge: 'FLASH SALE',
              title: 'UP TO 60% OFF',
              subtitle: 'Limited time only!',
              image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
              cta: 'SHOP NOW',
              link: '/shop',
              enableTimer: true,
              timerHours: 2,
              timerMinutes: 41,
              timerSeconds: 36
            }
          ]);
        }
      } catch (eBanners) {}

      // 4. Trust Badges
      if (adminConfig?.trustBadges && Array.isArray(adminConfig.trustBadges)) {
        setTrustBadges(adminConfig.trustBadges.filter(t => t.active !== false));
      } else {
        setTrustBadges([
          { id: '1', title: 'Free Delivery', subtext: 'Above ₹499', icon: 'Truck' },
          { id: '2', title: 'Easy Returns', subtext: '14 Days', icon: 'RotateCcw' },
          { id: '3', title: 'Secure Payment', subtext: '100% Safe', icon: 'ShieldCheck' },
          { id: '4', title: 'Best Quality', subtext: 'Premium Products', icon: 'Award' }
        ]);
      }

      // 5. Shop Your Style
      if (adminConfig?.shopYourStyle && Array.isArray(adminConfig.shopYourStyle)) {
        setStyleCategories(adminConfig.shopYourStyle.filter(s => s.active !== false));
      } else {
        setStyleCategories([
          { id: '1', label: 'Casual', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300', link: '/shop?style=Casual' },
          { id: '2', label: 'Formal', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300', link: '/shop?style=Formal' },
          { id: '3', label: 'Festive', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300', link: '/shop?style=Festive' },
          { id: '4', label: 'Streetwear', image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=300', link: '/shop?style=Streetwear' },
          { id: '5', label: 'Jewellery', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300', link: '/shop?category=Jewellery' },
          { id: '6', label: 'Kids', image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=300', link: '/shop?category=Kids' }
        ]);
      }

      // 6. Flash Picks Products
      try {
        const resProd = await api.get('/products').catch(() => null);
        const apiProds = resProd?.data?.data || resProd?.data || [];
        let pList = Array.isArray(apiProds) ? apiProds : [];

        if (pList.length === 0) {
          const savedP = localStorage.getItem('karviyam_admin_products');
          if (savedP) pList = JSON.parse(savedP);
        }

        if (pList && pList.length > 0) {
          const formatted = pList.map(p => {
            const pr = Number(p.price || p.regularPrice || 599);
            const oldPr = Number(p.oldPrice || p.mrp || Math.round(pr * 1.5));
            const disc = p.discountPercent || Math.round(((oldPr - pr) / oldPr) * 100);
            return {
              id: p.id,
              name: p.name || 'Karviyam Product',
              image: resolveImageUrl(p.imageUrl || p.image || (Array.isArray(p.images) ? p.images[0] : ''), p.id),
              price: pr,
              oldPrice: oldPr,
              discount: `${disc}% OFF`,
              rating: Number(p.rating || 4.2).toFixed(1)
            };
          });
          setFlashProducts(formatted);
        } else {
          // Default Flash Picks Reference Data
          setFlashProducts([
            { id: 101, name: 'Men Black Printed T-shirt', image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300', price: 399, oldPrice: 699, discount: '43% OFF', rating: '4.2' },
            { id: 102, name: 'Red Running Sneakers', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300', price: 1299, oldPrice: 2499, discount: '48% OFF', rating: '4.4' },
            { id: 103, name: 'Women Kurta Set with Dupatta', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300', price: 999, oldPrice: 1999, discount: '50% OFF', rating: '4.3' },
            { id: 104, name: 'Men Cotton Casual Shirt', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300', price: 599, oldPrice: 1199, discount: '50% OFF', rating: '4.1' },
            { id: 105, name: 'Men Slim Fit Jeans', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300', price: 799, oldPrice: 1499, discount: '46% OFF', rating: '4.2' }
          ]);
        }
      } catch (eProds) {}

      // 7. Complete The Look
      if (adminConfig?.completeLook) {
        setCompleteLook(adminConfig.completeLook);
      } else {
        setCompleteLook({
          title: 'Complete The Look',
          subtitle: 'Curated combos for you',
          ctaText: 'SHOP THE LOOK',
          ctaLink: '/shop?combo=festive',
          items: [
            { label: 'Shirt', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200', link: '/shop?category=Shirts' },
            { label: 'Jeans', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200', link: '/shop?category=Jeans' },
            { label: 'Sneakers', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200', link: '/shop?category=Sneakers' }
          ]
        });
      }

      // 8. Shop by Occasion
      if (adminConfig?.shopByOccasion && Array.isArray(adminConfig.shopByOccasion)) {
        setOccasionCategories(adminConfig.shopByOccasion.filter(o => o.active !== false));
      } else {
        setOccasionCategories([
          { id: '1', label: 'Wedding', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300', link: '/shop?occasion=Wedding' },
          { id: '2', label: 'Festival', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300', link: '/shop?occasion=Festival' },
          { id: '3', label: 'Office', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300', link: '/shop?occasion=Office' },
          { id: '4', label: 'Date Night', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300', link: '/shop?occasion=Date+Night' },
          { id: '5', label: 'Vacation', image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=300', link: '/shop?occasion=Vacation' },
          { id: '6', label: 'Gifting', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300', link: '/shop?occasion=Gifting' }
        ]);
      }

      // 9. Find Your Price Chips
      if (adminConfig?.findYourPrice && Array.isArray(adminConfig.findYourPrice)) {
        setPriceChips(adminConfig.findYourPrice.filter(p => p.active !== false));
      } else {
        setPriceChips([
          { id: '1', label: 'Under ₹499', link: '/shop?maxPrice=499', bgClass: 'bg-white text-rose-900 border-rose-200' },
          { id: '2', label: 'Under ₹999', link: '/shop?maxPrice=999', bgClass: 'bg-white text-amber-900 border-amber-200' },
          { id: '3', label: 'Under ₹1499', link: '/shop?maxPrice=1499', bgClass: 'bg-white text-emerald-900 border-emerald-200' },
          { id: '4', label: 'Under ₹1999', link: '/shop?maxPrice=1999', bgClass: 'bg-white text-purple-900 border-purple-200' },
          { id: '5', label: 'Under ₹2999', link: '/shop?maxPrice=2999', bgClass: 'bg-white text-blue-900 border-blue-200' }
        ]);
      }

      // 10. Recently Viewed / Continue Shopping
      try {
        const localRV = localStorage.getItem('karviyam_recently_viewed');
        if (localRV) {
          const parsed = JSON.parse(localRV);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecentlyViewed(parsed);
          }
        }
      } catch (eRV) {}

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

  return (
    <div className="w-full bg-[#FAFAFA] pb-16 text-slate-900 select-none font-sans text-left">

      {/* 1. MOBILE HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-3 py-2 flex items-center justify-between shadow-2xs">
        {/* Left: Hamburger Menu Icon */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 cursor-pointer active:scale-95 transition-transform"
          title="Open Menu"
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Center: Brand Logo */}
        <Link to="/" className="flex items-center gap-1.5">
          <span className="font-serif font-black text-lg text-[#B71C1C] tracking-widest uppercase flex items-center gap-1">
            <span className="text-[#B71C1C]">🌸</span>
            <span>KARVIYAM</span>
          </span>
        </Link>

        {/* Right Action Icons: Wishlist, Cart */}
        <div className="flex items-center gap-1.5">

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 hover:text-[#B71C1C] cursor-pointer"
            title="Wishlist"
          >
            <Heart className="w-4.5 h-4.5" />
          </button>

          <Link
            to="/cart"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 hover:text-[#B71C1C] cursor-pointer relative"
            title="Cart"
          >
            <ShoppingBag className="w-4.5 h-4.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#B71C1C] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-2xs">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* 2. FULL-WIDTH ROUNDED SEARCH BAR */}
      <div className="px-3 pt-2.5 pb-1">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="mobile-homepage-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for products, categories, brands..."
            className="w-full pl-9 pr-16 py-2 text-xs bg-slate-100/90 text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200/80 focus:outline-none focus:border-[#B71C1C] focus:bg-white transition-all font-medium"
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-2 text-slate-400">
            <button
              type="button"
              onClick={() => toast('Voice search available soon! 🎤')}
              className="hover:text-[#B71C1C] transition-colors"
              title="Voice Search"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => toast('Visual image search coming soon! 📷')}
              className="hover:text-[#B71C1C] transition-colors"
              title="Visual Search"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* 3. CATEGORY STRIP (HORIZONTAL SCROLL CIRCULAR AVATARS) */}
      <div className="w-full bg-white py-2 px-3 border-b border-slate-100 overflow-x-auto no-scrollbar">
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
              <span className="text-[9.5px] font-black tracking-tight text-slate-800 uppercase truncate max-w-[64px]">
                {cat.label || cat.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. HERO BANNER CAROUSEL */}
      {banners.length > 0 && (
        <div className="px-3 my-2.5">
          <div className="w-full h-[180px] sm:h-[210px] rounded-2xl overflow-hidden relative shadow-md bg-[#8B0000] group">
            {banners[currentBannerIdx]?.image ? (
              <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                  src={banners[currentBannerIdx].image}
                  alt={banners[currentBannerIdx]?.title || 'Hero Banner'}
                  onError={(e) => handleImageError(e, banners[currentBannerIdx]?.id)}
                  className="w-full h-full object-cover object-right transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#700000] via-[#8B0000]/80 to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-[#700000] via-[#8B0000] to-[#500000]" />
            )}

            <div className="relative z-10 h-full p-4 flex flex-col justify-center max-w-[70%] text-white">
              <span className="inline-block bg-black/30 backdrop-blur-md border border-white/20 text-white text-[8.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest w-max mb-1 shadow-2xs">
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

            {/* Banner Live Countdown Timer (Shown ONLY if enableTimer is ON for current banner) */}
            {banners[currentBannerIdx]?.enableTimer && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-20">
                <span className="text-[9px] font-bold text-rose-100 uppercase tracking-widest drop-shadow-xs">Ends in</span>
                <div className="flex items-center gap-1">
                  {/* Hours Box */}
                  <div className="flex flex-col items-center">
                    <div className="bg-rose-100/90 backdrop-blur-md px-2 py-1 rounded-xl text-xs font-black text-rose-950 font-mono shadow-md border border-white/60">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </div>
                    <span className="text-[7.5px] font-black text-rose-100 uppercase mt-0.5 tracking-wider">HRS</span>
                  </div>

                  <span className="font-black text-xs text-white pb-2.5">:</span>

                  {/* Minutes Box */}
                  <div className="flex flex-col items-center">
                    <div className="bg-rose-100/90 backdrop-blur-md px-2 py-1 rounded-xl text-xs font-black text-rose-950 font-mono shadow-md border border-white/60">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </div>
                    <span className="text-[7.5px] font-black text-rose-100 uppercase mt-0.5 tracking-wider">MINS</span>
                  </div>

                  <span className="font-black text-xs text-white pb-2.5">:</span>

                  {/* Seconds Box */}
                  <div className="flex flex-col items-center">
                    <div className="bg-rose-100/90 backdrop-blur-md px-2 py-1 rounded-xl text-xs font-black text-rose-950 font-mono shadow-md border border-white/60">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </div>
                    <span className="text-[7.5px] font-black text-rose-100 uppercase mt-0.5 tracking-wider">SECS</span>
                  </div>
                </div>
              </div>
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

      {/* 5. TRUST BADGES ROW */}
      <div className="px-3 py-2 bg-white border-y border-slate-100 my-1">
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

      {/* 6. "SHOP YOUR STYLE" SECTION */}
      <div className="px-3 py-2 mt-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-black text-base text-slate-900 tracking-tight">
            Shop Your Style
          </h3>
          <Link to="/shop" className="text-xs font-extrabold text-[#B71C1C] hover:underline flex items-center gap-0.5">
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
          {styleCategories.map((card) => (
            <div
              key={card.id}
              onClick={() => navigate(card.link || '/shop')}
              className="w-28 h-36 rounded-2xl relative overflow-hidden shrink-0 shadow-2xs cursor-pointer group active:scale-98 transition-transform"
            >
              <img
                src={resolveImageUrl(card.image, card.id)}
                alt={card.label}
                onError={(e) => handleImageError(e, card.id)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex items-end justify-center p-2">
                <span className="text-xs font-black text-white tracking-wide uppercase drop-shadow-sm">
                  {card.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. "FLASH PICKS" SECTION WITH TIMER */}
      <div className="px-3 py-3 my-1 bg-white border-y border-slate-100">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-black text-base text-slate-900 tracking-tight flex items-center gap-1">
              <Zap className="w-4 h-4 text-[#B71C1C] fill-current" />
              <span>Flash Picks</span>
            </h3>
            <span className="bg-rose-50 text-[#B71C1C] border border-rose-200 text-[9.5px] font-black px-2 py-0.5 rounded-full font-mono">
              Ends in {String(timeLeft.hours).padStart(2, '0')} : {String(timeLeft.minutes).padStart(2, '0')} : {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
          <Link to="/shop?sort=popular" className="text-xs font-extrabold text-[#B71C1C] hover:underline flex items-center gap-0.5">
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Product Cards Horizontal Scroll */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
          {(flashProducts.length > 0 ? flashProducts : [1, 2, 3, 4]).map((prod) => {
            const isWish = isInWishlist(prod.id);
            return (
              <div
                key={prod.id}
                onClick={() => navigate(`/product/${prod.id}`)}
                className="w-36 shrink-0 bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs cursor-pointer group text-left"
              >
                <div className="relative w-full h-36 bg-slate-50 rounded-xl overflow-hidden mb-2 flex items-center justify-center">
                  <img
                    src={resolveImageUrl(prod.image, prod.id)}
                    alt={prod.name}
                    onError={(e) => handleImageError(e, prod.id)}
                    className="max-h-full max-w-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(prod.id);
                    }}
                    className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center border shadow-2xs ${
                      isWish ? 'bg-[#B71C1C] text-white border-[#B71C1C]' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWish ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <h4 className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight">
                  {prod.name}
                </h4>

                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-extrabold text-xs text-slate-900">₹{prod.price}</span>
                  {prod.oldPrice && prod.oldPrice > prod.price && (
                    <span className="text-[9px] text-slate-400 line-through">₹{prod.oldPrice}</span>
                  )}
                  {prod.discount && (
                    <span className="text-[9px] font-black text-emerald-600 ml-auto">{prod.discount}</span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-1">
                  <span>★</span>
                  <span className="text-slate-700">{prod.rating || '4.2'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. "COMPLETE THE LOOK" BANNER CARD */}
      {completeLook && (
        <div className="px-3 my-2.5">
          <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
            <div className="space-y-1 max-w-[45%]">
              <h3 className="font-display font-black text-sm text-slate-900 leading-tight">
                {completeLook.title || 'Complete The Look'}
              </h3>
              <p className="text-[10px] text-slate-600 font-medium">
                {completeLook.subtitle || 'Curated combos for you'}
              </p>
              <button
                type="button"
                onClick={() => navigate(completeLook.ctaLink || '/shop')}
                className="bg-[#B71C1C] hover:bg-[#900C0C] text-white text-[9.5px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider transition-all shadow-2xs flex items-center gap-1 mt-2 cursor-pointer"
              >
                <span>{completeLook.ctaText || 'SHOP THE LOOK'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 3 Thumbnails with Plus Signs */}
            <div className="flex items-center gap-1">
              {(completeLook.items || []).map((item, idx) => (
                <React.Fragment key={idx}>
                  <div
                    onClick={() => navigate(item.link || '/shop')}
                    className="flex flex-col items-center gap-0.5 cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white border border-rose-200 p-0.5 overflow-hidden flex items-center justify-center shadow-2xs group-active:scale-95 transition-transform">
                      <img
                        src={resolveImageUrl(item.image, idx)}
                        alt={item.label}
                        onError={(e) => handleImageError(e, idx)}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <span className="text-[8.5px] font-extrabold text-slate-800 truncate max-w-[46px]">
                      {item.label}
                    </span>
                  </div>
                  {idx < (completeLook.items || []).length - 1 && (
                    <span className="text-slate-400 font-black text-xs shrink-0">+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 9. "SHOP BY OCCASION" SECTION */}
      <div className="px-3 py-2 mt-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-black text-base text-slate-900 tracking-tight">
            Shop by Occasion
          </h3>
          <Link to="/shop" className="text-xs font-extrabold text-[#B71C1C] hover:underline flex items-center gap-0.5">
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
          {occasionCategories.map((card) => (
            <div
              key={card.id}
              onClick={() => navigate(card.link || '/shop')}
              className="w-28 h-28 rounded-2xl relative overflow-hidden shrink-0 shadow-2xs cursor-pointer group active:scale-98 transition-transform"
            >
              <img
                src={resolveImageUrl(card.image, card.id)}
                alt={card.label}
                onError={(e) => handleImageError(e, card.id)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex items-end justify-center p-2">
                <span className="text-xs font-black text-white tracking-wide uppercase drop-shadow-sm">
                  {card.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 10. "FIND YOUR PRICE" SECTION */}
      <div className="px-3 py-3 my-1 bg-white border-y border-slate-100">
        <h3 className="font-display font-black text-base text-slate-900 tracking-tight mb-2.5">
          Find Your Price
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {priceChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => navigate(chip.link || `/shop?maxPrice=${chip.maxPrice || 999}`)}
              className={`px-4 py-2 rounded-full text-xs font-black tracking-wide shrink-0 border cursor-pointer active:scale-95 transition-all shadow-2xs bg-white ${
                chip.bgClass ? chip.bgClass.replace(/bg-[^\s]+/, '') : 'text-rose-900 border-rose-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 11. "CONTINUE SHOPPING" SECTION */}
      <div className="px-3 py-2 mt-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-black text-base text-slate-900 tracking-tight">
            Continue Shopping
          </h3>
          <Link to="/shop" className="text-xs font-extrabold text-[#B71C1C] hover:underline flex items-center gap-0.5">
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
          {(recentlyViewed.length > 0 ? recentlyViewed : flashProducts.slice(0, 5)).map((prod, idx) => {
            const isWish = isInWishlist(prod.id);
            return (
              <div
                key={prod.id || idx}
                onClick={() => navigate(`/product/${prod.id}`)}
                className="w-36 shrink-0 bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs cursor-pointer group text-left"
              >
                <div className="relative w-full h-36 bg-slate-50 rounded-xl overflow-hidden mb-2 flex items-center justify-center">
                  <img
                    src={resolveImageUrl(prod.image || prod.imageUrl, prod.id || idx)}
                    alt={prod.name}
                    onError={(e) => handleImageError(e, prod.id || idx)}
                    className="max-h-full max-w-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(prod.id);
                    }}
                    className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center border shadow-2xs ${
                      isWish ? 'bg-[#B71C1C] text-white border-[#B71C1C]' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWish ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <h4 className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight">
                  {prod.name}
                </h4>

                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-extrabold text-xs text-slate-900">₹{prod.price}</span>
                  {prod.oldPrice && prod.oldPrice > prod.price && (
                    <span className="text-[9px] text-slate-400 line-through">₹{prod.oldPrice}</span>
                  )}
                  {prod.discountPercent && (
                    <span className="text-[9px] font-extrabold text-emerald-600 ml-auto">
                      {prod.discountPercent}% OFF
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-700 mt-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{prod.rating || 4.2}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 12. FIXED BOTTOM NAVIGATION BAR */}
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
          to="/shop?filter=offers"
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
          <span>Login</span>
        </Link>
      </div>

      {/* MOBILE DRAWER MODAL */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="relative w-[80%] max-w-[320px] bg-white h-full shadow-2xl flex flex-col z-10 text-left">
            <div className="p-4 bg-[#B71C1C] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌸</span>
                <span className="font-serif font-black text-lg tracking-widest">KARVIYAM</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1 text-slate-800 text-xs font-bold">
              <Link
                to="/"
                onClick={() => setIsDrawerOpen(false)}
                className="block py-2 px-3 rounded-lg hover:bg-rose-50 hover:text-[#B71C1C]"
              >
                Home
              </Link>
              <Link
                to="/shop"
                onClick={() => setIsDrawerOpen(false)}
                className="block py-2 px-3 rounded-lg hover:bg-rose-50 hover:text-[#B71C1C]"
              >
                All Products
              </Link>
              <Link
                to="/shop?category=Men"
                onClick={() => setIsDrawerOpen(false)}
                className="block py-2 px-3 rounded-lg hover:bg-rose-50 hover:text-[#B71C1C]"
              >
                Men's Collection
              </Link>
              <Link
                to="/shop?category=Women"
                onClick={() => setIsDrawerOpen(false)}
                className="block py-2 px-3 rounded-lg hover:bg-rose-50 hover:text-[#B71C1C]"
              >
                Women's Collection
              </Link>
              <Link
                to="/cart"
                onClick={() => setIsDrawerOpen(false)}
                className="block py-2 px-3 rounded-lg hover:bg-rose-50 hover:text-[#B71C1C]"
              >
                Shopping Cart ({cartCount})
              </Link>
              <Link
                to="/profile"
                onClick={() => setIsDrawerOpen(false)}
                className="block py-2 px-3 rounded-lg hover:bg-rose-50 hover:text-[#B71C1C]"
              >
                My Account
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
