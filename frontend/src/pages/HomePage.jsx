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
      {/* 2. DESKTOP HOMEPAGE LAYOUT (>= 1024px Exact Specification) */}
      {/* ========================================================= */}
      <div className="desktop-only hidden md:block w-full max-w-[1752px] mx-auto px-4 py-5 space-y-[16px]">
        
        {/* MAIN 3-COLUMN FLEX LAYOUT: Left (260px) + Gap (16px) + Center (1140px) + Gap (16px) + Right (320px) = 1752px */}
        <div className="flex gap-[16px] items-start">
          
          {/* LEFT SIDEBAR COLUMN (Fixed 260px Width) */}
          <div className="w-[260px] shrink-0 flex flex-col gap-[16px]">
            {/* Top Category List Sidebar Card (Fixed 260px Width, 8 Items at 64px Each = 512px Height) */}
            <div className="w-[260px] h-[512px] bg-white rounded-[16px] border border-[#E5E7EB] p-3 shadow-2xs flex flex-col justify-between shrink-0">
              <div className="space-y-[4px]">
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
                    className="flex items-center justify-between px-2.5 h-[56px] rounded-xl hover:bg-red-50 group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <div>
                        <p className="text-[12px] font-black text-slate-900 leading-none group-hover:text-[#D32F2F]">{item.label}</p>
                        <p className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5">{item.sub}</p>
                      </div>
                    </div>
                    <span className="text-slate-300 group-hover:text-[#D32F2F] text-[12px]">›</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Left Extra-Offer Card (Exact 260 × 88px) */}
            <div className="w-[260px] h-[88px] bg-gradient-to-r from-[#D32F2F] to-[#B71C1C] rounded-[16px] p-4 text-white shadow-2xs flex items-center justify-between shrink-0">
              <div>
                <span className="font-display font-black text-sm block leading-none">EXTRA 5% OFF</span>
                <span className="text-[10px] text-white/80 font-medium block mt-1">On Prepaid Orders</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black text-sm text-white">
                %
              </div>
            </div>

            {/* Left Festive Banner Poster (Exact 260 × 360px) */}
            <div className="w-[260px] h-[360px] bg-gradient-to-b from-purple-950 via-slate-900 to-slate-950 rounded-[16px] p-4 text-white shadow-lg border border-purple-950 flex flex-col justify-between overflow-hidden shrink-0">
              <div className="space-y-1">
                <span className="inline-block bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs">
                  FESTIVE SPECIAL
                </span>
                <h3 className="font-display font-black text-2xl text-amber-300 leading-tight">
                  UP TO 60% OFF
                </h3>
                <p className="text-[11px] text-slate-300 font-medium">On Bestsellers</p>
              </div>

              <div className="my-2 flex-1 flex items-center justify-center overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600"
                  alt="Festive Collection"
                  className="w-full h-[170px] object-cover rounded-xl border border-white/20 shadow-md"
                />
              </div>

              <a
                href="/shop"
                className="text-center bg-white text-slate-900 font-black text-[11px] uppercase tracking-wider py-2.5 rounded-full hover:bg-[#D32F2F] hover:text-white transition-all shadow-md block"
              >
                SHOP NOW →
              </a>
            </div>

          </div>

          {/* MAIN CONTENT COLUMN (Fixed 1140px Width) */}
          <div className="w-[1140px] shrink-0 flex flex-col gap-[16px]">
            
            {/* Main Hero Banner Carousel (Exact 1140 × 360px) */}
            <div className="w-[1140px] h-[360px] rounded-[16px] overflow-hidden shadow-2xs border border-[#E5E7EB] bg-white shrink-0">
              <HeroBanner />
            </div>

            {/* Offer Strip Row (Exact 1140 × 80px, 3 Features inside Center Track) */}
            <div className="w-[1140px] h-[80px] grid grid-cols-3 gap-[16px] shrink-0">
              {/* Feature 1: UNDER ₹499 */}
              <a
                href="/shop?price=499"
                className="bg-white border border-[#E5E7EB] rounded-[16px] px-4 py-3 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer h-full"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-800 flex items-center justify-center text-xl shrink-0">
                  🪙
                </div>
                <div>
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wide">UNDER ₹499</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Best Under Budget Finds</p>
                </div>
              </a>

              {/* Feature 2: DEAL OF THE DAY */}
              <a
                href="/shop?sort=rating"
                className="bg-white border border-[#E5E7EB] rounded-[16px] px-4 py-3 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer h-full"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-400/20 text-indigo-800 flex items-center justify-center text-xl shrink-0">
                  🏷️
                </div>
                <div>
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wide">DEAL OF THE DAY</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">New Deals Everyday</p>
                </div>
              </a>

              {/* Feature 3: WHAT'S NEW */}
              <a
                href="/shop?sort=newest"
                className="bg-white border border-[#E5E7EB] rounded-[16px] px-4 py-3 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer h-full"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-800 flex items-center justify-center text-xl shrink-0">
                  🛍️
                </div>
                <div>
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wide">WHAT'S NEW</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Latest Arrivals</p>
                </div>
              </a>
            </div>

            {/* Top Categories Row (Exact 1140px Width, Equal 186px Height) */}
            <div className="w-[1140px] h-[186px] bg-white rounded-[16px] border border-[#E5E7EB] p-4 shadow-2xs flex flex-col justify-between shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-[15px] text-slate-900 uppercase tracking-wide">
                  Top Categories
                </h2>
                <a href="/shop" className="text-xs font-bold text-[#D32F2F] hover:underline flex items-center gap-1">
                  View All →
                </a>
              </div>

              <div className="grid grid-cols-7 gap-3">
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

            {/* Recommended For You Product Cards Grid (Exact 1140px Width, Equal 362px Height) */}
            <div className="w-[1140px] h-[362px] bg-white rounded-[16px] border border-[#E5E7EB] p-4 shadow-2xs flex flex-col justify-between shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-[15px] text-slate-900 uppercase tracking-wide">
                  Recommended For You
                </h2>
                <a href="/shop" className="text-xs font-bold text-[#D32F2F] hover:underline flex items-center gap-1">
                  View All →
                </a>
              </div>

              {loading ? (
                <SkeletonLoader count={6} />
              ) : (
                <div className="grid grid-cols-6 gap-3">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT SIDEBAR COLUMN (Fixed 320px Width) */}
          <div className="w-[320px] shrink-0 flex flex-col gap-[16px]">
            
            {/* Right Coupon Card (Exact 320 × 164px) */}
            <div className="w-[320px] h-[164px] bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 border border-red-200/90 rounded-[16px] p-4 shadow-2xs flex flex-col justify-between relative overflow-hidden shrink-0">
              <div className="relative z-10">
                <span className="font-display font-black text-xl text-[#D32F2F] block leading-tight">
                  Get 25% Off
                </span>
                <span className="font-extrabold text-xs text-slate-800 block mt-0.5">
                  Up To ₹200 Off*
                </span>
              </div>

              <div className="absolute right-3 top-2 text-[#D32F2F] opacity-20 font-black text-5xl pointer-events-none">
                %
              </div>

              <div className="relative z-10 mt-1">
                <div className="bg-white border border-dashed border-red-300 rounded-xl p-2 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[8px] text-slate-400 font-black block uppercase tracking-wider">COUPON CODE</span>
                    <span className="text-xs font-black text-[#D32F2F]">KARVIYAM25</span>
                  </div>
                  <span className="text-[#D32F2F] font-black text-sm">%</span>
                </div>
                <span className="text-[8px] text-slate-500 font-medium block text-center mt-1">*On your first order | T&C apply</span>
              </div>
            </div>

            {/* Delivery Card / Feature 4 EXPRESS DELIVERY (Exact 320 × 72px) */}
            <div className="w-[320px] h-[72px] bg-white border border-[#E5E7EB] rounded-[16px] px-3.5 py-2.5 flex items-center gap-3 shadow-2xs shrink-0">
              <a
                href="/shop"
                className="flex items-center gap-3 hover:shadow-md transition-all cursor-pointer w-full h-full"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-400/20 text-orange-800 flex items-center justify-center text-lg shrink-0">
                  🚚
                </div>
                <div>
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wide">EXPRESS DELIVERY</h4>
                  <p className="text-[9px] text-slate-500 font-medium mt-0.5">Quick & Safe Delivery</p>
                </div>
              </a>
            </div>

            {/* Premium Collection Card (Exact 320 × 208px) */}
            <div className="w-[320px] h-[208px] bg-white border border-[#E5E7EB] rounded-[16px] p-3 text-center shadow-2xs flex flex-col justify-between shrink-0">
              <div>
                <span className="font-display font-black text-[11px] tracking-wider text-[#D32F2F] uppercase block">
                  KARVIYAM
                </span>
                <h4 className="font-black text-xs text-slate-900 uppercase mt-0.5">
                  PREMIUM COLLECTION
                </h4>
                <p className="text-[9px] text-slate-500 font-medium mt-[1px]">
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

              <a href="/shop" className="text-[9px] font-black text-[#D32F2F] hover:underline uppercase block">
                EXPLORE NOW →
              </a>
            </div>

            {/* Trust / Benefits Card (Exact 320 × 240px) */}
            <div className="w-[320px] h-[240px] bg-white border border-[#E5E7EB] rounded-[16px] p-4 shadow-2xs flex flex-col justify-between text-xs shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-lg shrink-0">🛡️</span>
                <div>
                  <h5 className="font-black text-slate-900 text-xs">Best Quality</h5>
                  <p className="text-[9px] text-slate-500 font-medium">100% Original Products</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <span className="text-lg shrink-0">💰</span>
                <div>
                  <h5 className="font-black text-slate-900 text-xs">Affordable Prices</h5>
                  <p className="text-[9px] text-slate-500 font-medium">Best Prices in India</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <span className="text-lg shrink-0">🙌</span>
                <div>
                  <h5 className="font-black text-slate-900 text-xs">Trusted by Millions</h5>
                  <p className="text-[9px] text-slate-500 font-medium">Happy Customers</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <span className="text-lg shrink-0">🔄</span>
                <div>
                  <h5 className="font-black text-slate-900 text-xs">Easy Exchange</h5>
                  <p className="text-[9px] text-slate-500 font-medium">Hassle Free Exchange</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM SERVICE BAR (Fixed 70px Height, 5 Equal Boxes Across Bottom) */}
        <div className="grid grid-cols-5 gap-[16px] h-[70px]">
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
