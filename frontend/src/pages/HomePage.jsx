import React, { useState, useEffect } from 'react';
import HeroBanner from '../components/HeroBanner';
import CategoryCards from '../components/CategoryCards';
import MobileCategoryBar from '../components/MobileCategoryBar';
import MobileCategoryShortcuts from '../components/MobileCategoryShortcuts';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import api from '../utils/api';
import { Flame, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeProducts();
    window.addEventListener('karviyam_products_updated', fetchHomeProducts);
    return () => window.removeEventListener('karviyam_products_updated', fetchHomeProducts);
  }, []);

  const fetchHomeProducts = async () => {
    setLoading(true);
    try {
      const [featRes, newRes] = await Promise.all([
        api.get('/products/featured').catch(() => null),
        api.get('/products/new-arrivals').catch(() => null)
      ]);

      const featData = featRes?.data ? featRes.data : featRes;
      const featList = Array.isArray(featData?.data) ? featData.data : (Array.isArray(featData) ? featData : []);
      
      const newData = newRes?.data ? newRes.data : newRes;
      const newList = Array.isArray(newData?.data) ? newData.data : (Array.isArray(newData) ? newData : []);

      if (featList.length > 0) {
        setFeaturedProducts(featList);
      } else {
        const fallbackRes = await api.get('/products?size=8').catch(() => null);
        const fbData = fallbackRes?.data ? fallbackRes.data : fallbackRes;
        const pageObj = fbData?.data || fbData;
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

  return (
    <div className="w-full overflow-x-hidden">
      {/* ========================================================= */}
      {/* 1. MOBILE DEDICATED SHOPPING APP HOMEPAGE LAYOUT (< 768px)  */}
      {/* ========================================================= */}
      <div className="mobile-only">
        {/* 1 & 2. Mobile Category Tabs */}
        <MobileCategoryBar />

        {/* 3. Category Shortcut Icons */}
        <MobileCategoryShortcuts />

        {/* 3.5. Coupon Offer Banner (Matches Mockup Image) */}
        <div className="w-full px-3 py-2">
          <div className="bg-gradient-to-r from-red-50 via-pink-50 to-orange-50 border border-red-200/80 rounded-2xl p-2.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="text-left">
                <span className="font-display font-black text-xs text-[#B71C1C] block leading-tight">
                  Get 25% Off <span className="text-[10px] text-slate-700 font-bold">Up To ₹200 Off*</span>
                </span>
                <span className="text-[9px] text-slate-500 font-medium">*On your first order | T&C apply</span>
              </div>
            </div>

            <div className="bg-white border border-dashed border-red-300 px-2 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
              <span className="text-[9px] text-slate-400 font-bold uppercase">COUPON CODE</span>
              <span className="text-[10px] font-black text-[#B71C1C]">KARVIYAM25</span>
              <span className="text-[#B71C1C] font-black text-[11px]">%</span>
            </div>
          </div>
        </div>

        {/* 4. Promotional Mobile Hero Banner */}
        <HeroBanner />

        {/* 5. Top Categories Section (Matches Mockup Image) */}
        <section className="w-full px-3 py-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="font-display font-black text-sm text-slate-900">
              Top Categories
            </h2>
            <a href="/shop" className="text-[10px] font-bold text-[#B71C1C] hover:underline flex items-center gap-0.5">
              View All →
            </a>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x py-1">
            {[
              { label: 'MEN', img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300' },
              { label: 'WOMEN', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300' },
              { label: 'KIDS & BABY', img: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300' },
              { label: 'UNISEX', img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300' },
              { label: 'ACCESSORIES', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300' },
              { label: 'KITCHEN & HOME', img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300' }
            ].map((cat, idx) => (
              <a
                key={idx}
                href={`/shop?category=${encodeURIComponent(cat.label)}`}
                className="flex flex-col items-center shrink-0 cursor-pointer"
              >
                <div className="w-16 h-20 rounded-2xl overflow-hidden bg-slate-100 shadow-2xs border border-slate-200">
                  <img src={cat.img} alt={cat.label} className="w-full h-full object-cover" />
                </div>
                <span className="text-[9px] font-black text-slate-800 mt-1.5 text-center tracking-tight truncate max-w-[68px]">
                  {cat.label}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* 6. Best Deals For You Section (Matches Mockup Image) */}
        <section className="w-full px-3 py-2">
          <h2 className="font-display font-black text-sm text-slate-900 mb-2 px-1">
            Best Deals For You
          </h2>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x py-1">
            <a
              href="/shop?price=499"
              className="px-3.5 py-2 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1.5 shadow-2xs"
            >
              <span>🪙</span> UNDER ₹499
            </a>

            <a
              href="/shop?sort=rating"
              className="px-3.5 py-2 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-900 font-extrabold text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1.5 shadow-2xs"
            >
              <span>🏷️</span> DEAL OF THE DAY
            </a>

            <a
              href="/shop?sort=newest"
              className="px-3.5 py-2 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 font-extrabold text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1.5 shadow-2xs"
            >
              <span>🛍️</span> WHAT'S NEW
            </a>

            <a
              href="/shop"
              className="px-3.5 py-2 rounded-2xl bg-orange-50/80 border border-orange-200 text-orange-900 font-extrabold text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1.5 shadow-2xs"
            >
              <span>🚚</span> EXPRESS DELIVERY
            </a>
          </div>
        </section>

        {/* 7. Recommended For You Product Grid (Matches Mockup Image) */}
        <section className="w-full px-3 py-3">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <div>
              <h2 className="font-display font-black text-base text-slate-900">
                Recommended for You
              </h2>
            </div>
          </div>

          {loading ? (
            <SkeletonLoader count={4} />
          ) : (
            <div className="mobile-product-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ========================================================= */}
      {/* 2. DESKTOP HOMEPAGE LAYOUT (>= 768px) - UNTOUCHED ORIGINAL */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* 2. DESKTOP HOMEPAGE LAYOUT (>= 1280px Blueprint Specification) */}
      {/* ========================================================= */}
      <div className="desktop-only hidden md:block w-full max-w-[1280px] mx-auto px-4 py-5 space-y-[20px]">
        
        {/* ROW 1: EQUAL 360px TOTAL HEIGHT ACROSS ALL 3 COLUMNS */}
        <div className="flex gap-[20px] items-stretch h-[360px]">
          
          {/* LEFT SIDEBAR COLUMN (Fixed 240px Width, Total Height 360px) */}
          <div className="w-[240px] shrink-0 flex flex-col justify-between h-[360px]">
            {/* Category List Sidebar Card (Height 284px) */}
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-3.5 shadow-2xs flex flex-col justify-between h-[284px]">
              <div className="space-y-[4px] text-xs font-extrabold text-slate-700">
                {[
                  { label: 'Top Offers', sub: 'Best deals & discounts', icon: '🏷️', query: 'T-Shirts' },
                  { label: 'New Arrivals', sub: 'Latest collections', icon: '✨', query: 'Sneakers' },
                  { label: 'Best Sellers', sub: 'Most loved products', icon: '⭐', query: 'Kurta Sets' },
                  { label: 'Trending Now', sub: 'Popular right now', icon: '📈', query: 'Men' },
                  { label: 'Premium Store', sub: 'Luxury & premium picks', icon: '💎', query: 'Women' },
                  { label: 'Gift Cards', sub: 'The perfect gift', icon: '🎁', query: 'Kids' },
                  { label: 'Track Order', sub: 'Track your shipment', icon: '🚚', query: 'Unisex' },
                  { label: 'Customer Support', sub: 'Help & support center', icon: '🎧', query: 'Jewellery' }
                ].map((item, idx) => (
                  <a
                    key={idx}
                    href={`/shop?category=${encodeURIComponent(item.query)}`}
                    className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-red-50 group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{item.icon}</span>
                      <div>
                        <p className="text-[11px] font-black text-slate-900 leading-none group-hover:text-[#D32F2F]">{item.label}</p>
                        <p className="text-[8px] text-slate-400 font-medium leading-tight">{item.sub}</p>
                      </div>
                    </div>
                    <span className="text-slate-300 group-hover:text-[#D32F2F] text-[10px]">›</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Red Extra 5% Off Promo Card (Height 60px) */}
            <div className="w-[240px] h-[60px] bg-[#D32F2F] rounded-[16px] p-3 text-white shadow-2xs flex items-center justify-between shrink-0">
              <div>
                <span className="font-display font-black text-xs block leading-none">EXTRA 5% OFF</span>
                <span className="text-[9px] text-white/80 font-medium block mt-0.5">On Prepaid Orders</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black text-xs text-white">
                %
              </div>
            </div>
          </div>

          {/* CENTER CONTENT COLUMN (Fixed 720px Width, Height 360px) */}
          <div className="w-[720px] shrink-0 h-[360px]">
            {/* Main Banner Hero Carousel (Fixed 360px Height) */}
            <div className="w-full h-[360px] rounded-[16px] overflow-hidden shadow-2xs border border-[#E5E7EB] bg-white">
              <HeroBanner />
            </div>
          </div>

          {/* RIGHT SIDEBAR COLUMN (Fixed 300px Width, Total Height 360px) */}
          <div className="w-[300px] shrink-0 flex flex-col justify-between h-[360px]">
            {/* Offer Coupon Card (Height 260px) */}
            <div className="w-[300px] h-[260px] bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 border border-red-200/90 rounded-[16px] p-[20px] shadow-2xs flex flex-col justify-between relative overflow-hidden shrink-0">
              <div className="relative z-10">
                <span className="font-display font-black text-2xl text-[#D32F2F] block leading-tight">
                  Get 25% Off
                </span>
                <span className="font-extrabold text-xs text-slate-800 block mt-1">
                  Up To ₹200 Off*
                </span>
              </div>

              <div className="absolute right-3 top-3 text-[#D32F2F] opacity-20 font-black text-6xl pointer-events-none">
                %
              </div>

              <div className="relative z-10 mt-2">
                <div className="bg-white border border-dashed border-red-300 rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[8px] text-slate-400 font-black block uppercase tracking-wider">COUPON CODE</span>
                    <span className="text-xs font-black text-[#D32F2F]">KARVIYAM25</span>
                  </div>
                  <span className="text-[#D32F2F] font-black text-base">%</span>
                </div>
                <span className="text-[9px] text-slate-500 font-medium block text-center mt-2">*On your first order | T&C apply</span>
              </div>
            </div>

            {/* 3 Trust Badges Strip Card (Height 84px) */}
            <div className="w-[300px] h-[84px] bg-white border border-[#E5E7EB] rounded-[16px] p-2.5 shadow-2xs grid grid-cols-3 gap-1 text-center text-[9px] font-bold text-slate-700 shrink-0">
              <div className="flex flex-col items-center justify-center">
                <span className="text-sm">🚚</span>
                <span className="font-black text-slate-900 mt-0.5">Free Delivery</span>
                <span className="text-[7px] text-slate-400">Above ₹499</span>
              </div>
              <div className="flex flex-col items-center justify-center border-x border-slate-100 px-1">
                <span className="text-sm">🔄</span>
                <span className="font-black text-slate-900 mt-0.5">Easy Returns</span>
                <span className="text-[7px] text-slate-400">14 days return</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-sm">🔒</span>
                <span className="font-black text-slate-900 mt-0.5">100% Secure</span>
                <span className="text-[7px] text-slate-400">Payment</span>
              </div>
            </div>
          </div>

        </div>

        {/* ROW 2: FEATURE STRIP ROW (EQUAL 90px HEIGHT ACROSS CENTER & RIGHT COLUMNS) */}
        <div className="flex gap-[20px] items-stretch h-[90px]">
          {/* Empty spacer for Left Sidebar alignment (Fixed 240px Width) */}
          <div className="w-[240px] shrink-0"></div>

          {/* Center Track: Feature 1, Feature 2, Feature 3 (Fixed 720px Width, Height 90px) */}
          <div className="w-[720px] shrink-0 grid grid-cols-3 gap-[20px] h-[90px]">
            {/* Feature 1: UNDER ₹499 */}
            <a
              href="/shop?price=499"
              className="bg-white border border-[#E5E7EB] rounded-[16px] p-4 flex items-center gap-[12px] hover:shadow-md transition-all cursor-pointer h-full"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-800 flex items-center justify-center text-lg shrink-0">
                🪙
              </div>
              <div>
                <h4 className="font-black text-[12px] text-slate-900 uppercase tracking-wide">UNDER ₹499</h4>
                <p className="text-[9px] text-slate-500 font-medium">Best Under Budget Finds</p>
              </div>
            </a>

            {/* Feature 2: DEAL OF THE DAY */}
            <a
              href="/shop?sort=rating"
              className="bg-white border border-[#E5E7EB] rounded-[16px] p-4 flex items-center gap-[12px] hover:shadow-md transition-all cursor-pointer h-full"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-400/20 text-indigo-800 flex items-center justify-center text-lg shrink-0">
                🏷️
              </div>
              <div>
                <h4 className="font-black text-[12px] text-slate-900 uppercase tracking-wide">DEAL OF THE DAY</h4>
                <p className="text-[9px] text-slate-500 font-medium">New Deals Everyday</p>
              </div>
            </a>

            {/* Feature 3: WHAT'S NEW */}
            <a
              href="/shop?sort=newest"
              className="bg-white border border-[#E5E7EB] rounded-[16px] p-4 flex items-center gap-[12px] hover:shadow-md transition-all cursor-pointer h-full"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-400/20 text-emerald-800 flex items-center justify-center text-lg shrink-0">
                🛍️
              </div>
              <div>
                <h4 className="font-black text-[12px] text-slate-900 uppercase tracking-wide">WHAT'S NEW</h4>
                <p className="text-[9px] text-slate-500 font-medium">Latest Arrivals</p>
              </div>
            </a>
          </div>

          {/* Right Track: Feature 4 - EXPRESS DELIVERY (Fixed 300px Width, Height 90px) */}
          <div className="w-[300px] shrink-0 h-[90px]">
            <a
              href="/shop"
              className="bg-white border border-[#E5E7EB] rounded-[16px] p-4 flex items-center gap-[12px] hover:shadow-md transition-all cursor-pointer h-full"
            >
              <div className="w-9 h-9 rounded-xl bg-orange-400/20 text-orange-800 flex items-center justify-center text-lg shrink-0">
                🚚
              </div>
              <div>
                <h4 className="font-black text-[12px] text-slate-900 uppercase tracking-wide">EXPRESS DELIVERY</h4>
                <p className="text-[9px] text-slate-500 font-medium">Quick & Safe Delivery</p>
              </div>
            </a>
          </div>
        </div>

        {/* ROW 3 & ROW 4: MAIN CONTENT & SIDEBARS */}
        <div className="flex gap-[20px] items-start">
          
          {/* Left Track: Festive Special Tall Banner Poster (Fixed 240px Width, Height 556px) */}
          <div className="w-[240px] h-[556px] bg-gradient-to-b from-purple-950 via-slate-900 to-slate-950 rounded-[16px] p-[20px] text-white shadow-lg border border-purple-950 flex flex-col justify-between overflow-hidden shrink-0 sticky top-28">
            <div className="space-y-1">
              <span className="inline-block bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs">
                FESTIVE SPECIAL
              </span>
              <h3 className="font-display font-black text-2xl text-amber-300 leading-tight">
                UP TO 60% OFF
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">On Bestsellers</p>
            </div>

            <div className="my-3 flex-1 flex items-center justify-center overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600"
                alt="Festive Collection"
                className="w-full h-[280px] object-cover rounded-xl border border-white/20 shadow-md"
              />
            </div>

            <a
              href="/shop"
              className="text-center bg-white text-slate-900 font-black text-[11px] uppercase tracking-wider py-2.5 rounded-full hover:bg-[#D32F2F] hover:text-white transition-all shadow-md block"
            >
              SHOP NOW →
            </a>
          </div>

          {/* Center Track: Top Categories (Row 3: 220px) & Recommended For You (Row 4: 320px) (Fixed 720px Width) */}
          <div className="w-[720px] shrink-0 flex flex-col gap-[20px]">
            
            {/* Row 3: Top Categories (Height 220px) */}
            <div className="w-[720px] h-[220px] bg-white rounded-[16px] border border-[#E5E7EB] p-4 shadow-2xs space-y-3 flex flex-col justify-between shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-[14px] text-slate-900 uppercase tracking-wide">
                  Top Categories
                </h2>
                <a href="/shop" className="text-[11px] font-bold text-[#D32F2F] hover:underline flex items-center gap-1">
                  View All →
                </a>
              </div>

              <div className="grid grid-cols-7 gap-[10px]">
                {[
                  { label: 'MEN', img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300' },
                  { label: 'WOMEN', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300' },
                  { label: 'KIDS & BABY', img: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300' },
                  { label: 'UNISEX', img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300' },
                  { label: 'ACCESSORIES', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300' },
                  { label: 'KITCHEN & HOME', img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300' },
                  { label: 'FOOTWEAR', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300' }
                ].map((cat, idx) => (
                  <a
                    key={idx}
                    href={`/shop?category=${encodeURIComponent(cat.label)}`}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-100 border border-[#E5E7EB] group-hover:border-[#D32F2F] shadow-2xs group-hover:shadow-md transition-all">
                      <img src={cat.img} alt={cat.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <span className="text-[10px] font-black text-slate-800 mt-1 text-center truncate max-w-full">
                      {cat.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Row 4: Recommended For You (Height 320px) */}
            <div className="w-[720px] h-[320px] bg-white rounded-[16px] border border-[#E5E7EB] p-4 shadow-2xs space-y-3 flex flex-col justify-between shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-[14px] text-slate-900 uppercase tracking-wide">
                  Recommended For You
                </h2>
                <a href="/shop" className="text-[11px] font-bold text-[#D32F2F] hover:underline flex items-center gap-1">
                  View All →
                </a>
              </div>

              {loading ? (
                <SkeletonLoader count={6} />
              ) : (
                <div className="grid grid-cols-6 gap-[10px]">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Track: Premium Collection (Row 3: 220px) & Trust Badges (Row 4: 320px) (Fixed 300px Width) */}
          <div className="w-[300px] shrink-0 flex flex-col gap-[20px]">
            
            {/* Row 3: Premium Collection Card (Height 220px) */}
            <div className="w-[300px] h-[220px] bg-white border border-[#E5E7EB] rounded-[16px] p-4 text-center shadow-2xs flex flex-col justify-between shrink-0">
              <div>
                <span className="font-display font-black text-xs tracking-wider text-[#D32F2F] uppercase block">
                  KARVIYAM
                </span>
                <h4 className="font-black text-xs text-slate-900 uppercase mt-0.5">
                  PREMIUM COLLECTION
                </h4>
                <p className="text-[10px] text-slate-500 font-medium mt-[2px]">
                  Timeless styles for every occasion.
                </p>
              </div>

              <div className="my-1">
                <img
                  src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400"
                  alt="Premium Collection"
                  className="w-full h-24 object-cover rounded-xl border border-[#E5E7EB] shadow-2xs"
                />
              </div>

              <a href="/shop" className="text-[10px] font-black text-[#D32F2F] hover:underline uppercase block">
                EXPLORE NOW →
              </a>
            </div>

            {/* Row 4: Trust & Guarantee Badges Card (Height 320px) */}
            <div className="w-[300px] h-[320px] bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-2xs flex flex-col justify-between text-xs shrink-0">
              <div className="flex items-center gap-[12px]">
                <span className="text-xl shrink-0">🛡️</span>
                <div>
                  <h5 className="font-black text-slate-900 text-xs">Best Quality</h5>
                  <p className="text-[10px] text-slate-500 font-medium">100% Original Products</p>
                </div>
              </div>

              <div className="flex items-center gap-[12px] pt-3 border-t border-slate-100">
                <span className="text-xl shrink-0">💰</span>
                <div>
                  <h5 className="font-black text-slate-900 text-xs">Affordable Prices</h5>
                  <p className="text-[10px] text-slate-500 font-medium">Best Prices in India</p>
                </div>
              </div>

              <div className="flex items-center gap-[12px] pt-3 border-t border-slate-100">
                <span className="text-xl shrink-0">🙌</span>
                <div>
                  <h5 className="font-black text-slate-900 text-xs">Trusted by Millions</h5>
                  <p className="text-[10px] text-slate-500 font-medium">Happy Customers</p>
                </div>
              </div>

              <div className="flex items-center gap-[12px] pt-3 border-t border-slate-100">
                <span className="text-xl shrink-0">🔄</span>
                <div>
                  <h5 className="font-black text-slate-900 text-xs">Easy Exchange</h5>
                  <p className="text-[10px] text-slate-500 font-medium">Hassle Free Exchange</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ROW 5: BOTTOM SERVICE BAR (Fixed 70px Height, 5 Equal Boxes Across 1280px) */}
        <div className="grid grid-cols-5 gap-[20px] h-[70px]">
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-3 flex items-center gap-[10px] shadow-2xs h-full">
            <span className="text-lg shrink-0">🛡️</span>
            <div>
              <h5 className="font-black text-[11px] text-slate-900 leading-tight">100% Original Products</h5>
              <p className="text-[9px] text-slate-500 font-medium">Sourced Directly</p>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-3 flex items-center gap-[10px] shadow-2xs h-full">
            <span className="text-lg shrink-0">💳</span>
            <div>
              <h5 className="font-black text-[11px] text-slate-900 leading-tight">Secure Payments</h5>
              <p className="text-[9px] text-slate-500 font-medium">Multiple Payment Options</p>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-3 flex items-center gap-[10px] shadow-2xs h-full">
            <span className="text-lg shrink-0">🔄</span>
            <div>
              <h5 className="font-black text-[11px] text-slate-900 leading-tight">Easy Returns & Refunds</h5>
              <p className="text-[9px] text-slate-500 font-medium">Hassle Free Process</p>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-3 flex items-center gap-[10px] shadow-2xs h-full">
            <span className="text-lg shrink-0">🎧</span>
            <div>
              <h5 className="font-black text-[11px] text-slate-900 leading-tight">Customer Support</h5>
              <p className="text-[9px] text-slate-500 font-medium">24/7 Support</p>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-3 flex items-center gap-[10px] shadow-2xs h-full">
            <span className="text-lg shrink-0">🏷️</span>
            <div>
              <h5 className="font-black text-[11px] text-slate-900 leading-tight">Best Price Guarantee</h5>
              <p className="text-[9px] text-slate-500 font-medium">We Promise The Best</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
