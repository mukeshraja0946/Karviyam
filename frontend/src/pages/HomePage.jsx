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
        
        {/* MAIN 3-COLUMN FLEX LAYOUT: Left (240px) + Gap (20px) + Center (720px) + Gap (20px) + Right (300px) = 1280px */}
        <div className="flex gap-[20px] items-start">
          
          {/* LEFT SIDEBAR COLUMN (Fixed 240px Width) */}
          <div className="w-[240px] shrink-0 flex flex-col gap-[20px]">
            {/* Category List Sidebar Card */}
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-[20px] shadow-2xs flex flex-col justify-between">
              <div className="space-y-[6px] text-xs font-extrabold text-slate-700">
                {[
                  { label: 'T-Shirts', icon: '👕', query: 'T-Shirts' },
                  { label: 'Sneakers', icon: '👟', query: 'Sneakers' },
                  { label: 'Kurta Sets', icon: '👘', query: 'Kurta Sets' },
                  { label: 'Men', icon: '👔', query: 'Men' },
                  { label: 'Women', icon: '👗', query: 'Women' },
                  { label: 'Kids & Baby', icon: '🧒', query: 'Kids' },
                  { label: 'Unisex', icon: '⚧', query: 'Unisex' },
                  { label: 'Jewels', icon: '💍', query: 'Jewellery' },
                  { label: 'Accessories', icon: '🎒', query: 'Accessories' },
                  { label: 'Kitchen & Home', icon: '🏠', query: 'Home' },
                  { label: 'School & Office', icon: '🎒', query: 'School' }
                ].map((item, idx) => (
                  <a
                    key={idx}
                    href={`/shop?category=${encodeURIComponent(item.query)}`}
                    className="flex items-center gap-[12px] px-2 py-1.5 rounded-xl hover:bg-red-50 hover:text-[#D32F2F] transition-colors"
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span className="truncate text-[13px] font-extrabold text-slate-800">{item.label}</span>
                  </a>
                ))}
              </div>

              <a href="/shop" className="text-[12px] font-black text-[#D32F2F] hover:underline flex items-center justify-between px-2 pt-3 border-t border-slate-100 mt-2">
                <span>View All Categories</span>
                <span>›</span>
              </a>
            </div>

            {/* Festive Special Tall Banner Poster (Fixed 320px Height) */}
            <div className="w-[240px] h-[320px] rounded-[16px] border border-purple-950 bg-gradient-to-b from-purple-950 via-slate-900 to-slate-950 p-[20px] text-white shadow-lg flex flex-col justify-between overflow-hidden shrink-0">
              <div className="space-y-1">
                <span className="inline-block bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs">
                  FESTIVE SPECIAL
                </span>
                <h3 className="font-display font-black text-xl text-amber-300 leading-tight">
                  UP TO 60% OFF
                </h3>
                <p className="text-[11px] text-slate-300 font-medium">On Bestsellers</p>
              </div>

              <div className="my-2 flex-1 flex items-center justify-center overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600"
                  alt="Festive Collection"
                  className="w-full h-[140px] object-cover rounded-xl border border-white/20 shadow-md"
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

          {/* CENTER CONTENT COLUMN (Fixed 720px Width) */}
          <div className="w-[720px] shrink-0 flex flex-col gap-[20px]">
            
            {/* Main Banner Hero Carousel (Fixed 360px Height) */}
            <div className="w-full h-[360px] rounded-[16px] overflow-hidden shadow-2xs border border-[#E5E7EB] bg-white shrink-0">
              <HeroBanner />
            </div>

            {/* Feature Strip Row: 3 equal cards in 720px track (Fixed 100px Height) */}
            <div className="grid grid-cols-3 gap-[20px] h-[100px]">
              {/* Feature 1: UNDER ₹499 */}
              <a
                href="/shop?price=499"
                className="bg-white border border-[#E5E7EB] rounded-[16px] p-[20px] flex items-center gap-[12px] hover:shadow-md transition-all cursor-pointer h-full"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-800 flex items-center justify-center text-xl shrink-0">
                  🪙
                </div>
                <div>
                  <h4 className="font-black text-[13px] text-slate-900 uppercase tracking-wide">UNDER ₹499</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Best Under Budget Finds</p>
                </div>
              </a>

              {/* Feature 2: DEAL OF THE DAY */}
              <a
                href="/shop?sort=rating"
                className="bg-white border border-[#E5E7EB] rounded-[16px] p-[20px] flex items-center gap-[12px] hover:shadow-md transition-all cursor-pointer h-full"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-400/20 text-indigo-800 flex items-center justify-center text-xl shrink-0">
                  🏷️
                </div>
                <div>
                  <h4 className="font-black text-[13px] text-slate-900 uppercase tracking-wide">DEAL OF THE DAY</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">New Deals Everyday</p>
                </div>
              </a>

              {/* Feature 3: WHAT'S NEW */}
              <a
                href="/shop?sort=newest"
                className="bg-white border border-[#E5E7EB] rounded-[16px] p-[20px] flex items-center gap-[12px] hover:shadow-md transition-all cursor-pointer h-full"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-800 flex items-center justify-center text-xl shrink-0">
                  🛍️
                </div>
                <div>
                  <h4 className="font-black text-[13px] text-slate-900 uppercase tracking-wide">WHAT'S NEW</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Latest Arrivals</p>
                </div>
              </a>
            </div>

            {/* Top Categories Row */}
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-[20px] shadow-2xs space-y-[16px]">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-[16px] text-slate-900 uppercase tracking-wide">
                  Top Categories
                </h2>
                <a href="/shop" className="text-[12px] font-bold text-[#D32F2F] hover:underline flex items-center gap-1">
                  View All →
                </a>
              </div>

              <div className="grid grid-cols-7 gap-[12px]">
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
                    <div className="w-full h-20 rounded-xl overflow-hidden bg-slate-100 border border-[#E5E7EB] group-hover:border-[#D32F2F] shadow-2xs group-hover:shadow-md transition-all">
                      <img src={cat.img} alt={cat.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <span className="text-[10px] font-black text-slate-800 mt-1.5 text-center truncate max-w-full">
                      {cat.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Recommended For You Grid */}
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-[20px] shadow-2xs space-y-[16px]">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-[16px] text-slate-900 uppercase tracking-wide">
                  Recommended For You
                </h2>
                <a href="/shop" className="text-[12px] font-bold text-[#D32F2F] hover:underline flex items-center gap-1">
                  View All →
                </a>
              </div>

              {loading ? (
                <SkeletonLoader count={6} />
              ) : (
                <div className="grid grid-cols-6 gap-[12px]">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT SIDEBAR COLUMN (Fixed 300px Width) */}
          <div className="w-[300px] shrink-0 flex flex-col gap-[20px]">
            
            {/* Offer Card: Coupon Offer Banner (Fixed 220px Height) */}
            <div className="w-[300px] h-[220px] bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 border border-red-200/90 rounded-[16px] p-[20px] shadow-2xs flex flex-col justify-between relative overflow-hidden shrink-0">
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
                <div className="bg-white border border-dashed border-red-300 rounded-xl p-2 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[8px] text-slate-400 font-black block uppercase tracking-wider">COUPON CODE</span>
                    <span className="text-xs font-black text-[#D32F2F]">KARVIYAM25</span>
                  </div>
                  <span className="text-[#D32F2F] font-black text-base">%</span>
                </div>
                <span className="text-[9px] text-slate-500 font-medium block text-center mt-1.5">*On your first order | T&C apply</span>
              </div>
            </div>

            {/* Feature 4: EXPRESS DELIVERY (Fixed 100px Height) */}
            <div className="w-[300px] h-[100px] bg-white border border-[#E5E7EB] rounded-[16px] p-[20px] flex items-center gap-[12px] shadow-2xs shrink-0">
              <a
                href="/shop"
                className="flex items-center gap-[12px] hover:shadow-md transition-all cursor-pointer w-full h-full"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-400/20 text-orange-800 flex items-center justify-center text-xl shrink-0">
                  🚚
                </div>
                <div>
                  <h4 className="font-black text-[13px] text-slate-900 uppercase tracking-wide">EXPRESS DELIVERY</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Quick & Safe Delivery</p>
                </div>
              </a>
            </div>

            {/* Premium Collection Card (Fixed 220px Height) */}
            <div className="w-[300px] h-[220px] bg-white border border-[#E5E7EB] rounded-[16px] p-[20px] text-center shadow-2xs flex flex-col justify-between shrink-0">
              <div>
                <span className="font-display font-black text-xs tracking-wider text-[#D32F2F] uppercase block">
                  KARVIYAM
                </span>
                <h4 className="font-black text-xs text-slate-900 uppercase mt-0.5">
                  PREMIUM COLLECTION
                </h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
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

            {/* Trust Badges Card (Fixed 200px Height) */}
            <div className="w-[300px] h-[200px] bg-white border border-[#E5E7EB] rounded-[16px] p-[20px] shadow-2xs flex flex-col justify-between text-xs shrink-0">
              <div className="flex items-center gap-[12px]">
                <span className="text-base shrink-0">🛡️</span>
                <div>
                  <h5 className="font-black text-slate-900 text-[11px]">Best Quality</h5>
                  <p className="text-[9px] text-slate-500 font-medium">100% Original Products</p>
                </div>
              </div>

              <div className="flex items-center gap-[12px] pt-2 border-t border-slate-100">
                <span className="text-base shrink-0">💰</span>
                <div>
                  <h5 className="font-black text-slate-900 text-[11px]">Affordable Prices</h5>
                  <p className="text-[9px] text-slate-500 font-medium">Best Prices in India</p>
                </div>
              </div>

              <div className="flex items-center gap-[12px] pt-2 border-t border-slate-100">
                <span className="text-base shrink-0">🙌</span>
                <div>
                  <h5 className="font-black text-slate-900 text-[11px]">Trusted by Millions</h5>
                  <p className="text-[9px] text-slate-500 font-medium">Happy Customers</p>
                </div>
              </div>

              <div className="flex items-center gap-[12px] pt-2 border-t border-slate-100">
                <span className="text-base shrink-0">🔄</span>
                <div>
                  <h5 className="font-black text-slate-900 text-[11px]">Easy Exchange</h5>
                  <p className="text-[9px] text-slate-500 font-medium">Hassle Free Exchange</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM SERVICE BAR (Fixed 80px Height, 5 Equal Boxes Across 1280px) */}
        <div className="grid grid-cols-5 gap-[20px] h-[80px]">
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-[20px] flex items-center gap-[12px] shadow-2xs h-full">
            <span className="text-xl shrink-0">🛡️</span>
            <div>
              <h5 className="font-black text-xs text-slate-900 leading-tight">100% Original Products</h5>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Sourced Directly</p>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-[20px] flex items-center gap-[12px] shadow-2xs h-full">
            <span className="text-xl shrink-0">💳</span>
            <div>
              <h5 className="font-black text-xs text-slate-900 leading-tight">Secure Payments</h5>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Multiple Payment Options</p>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-[20px] flex items-center gap-[12px] shadow-2xs h-full">
            <span className="text-xl shrink-0">🔄</span>
            <div>
              <h5 className="font-black text-xs text-slate-900 leading-tight">Easy Returns & Refunds</h5>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Hassle Free Process</p>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-[20px] flex items-center gap-[12px] shadow-2xs h-full">
            <span className="text-xl shrink-0">🎧</span>
            <div>
              <h5 className="font-black text-xs text-slate-900 leading-tight">Customer Support</h5>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">24/7 Support</p>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-[20px] flex items-center gap-[12px] shadow-2xs h-full">
            <span className="text-xl shrink-0">🏷️</span>
            <div>
              <h5 className="font-black text-xs text-slate-900 leading-tight">Best Price Guarantee</h5>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">We Promise The Best</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
