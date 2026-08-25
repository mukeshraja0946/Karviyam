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
      <div className="desktop-only">
        <HeroBanner />
        <CategoryCards />

        <section className="w-full px-8 lg:px-12 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="flex items-center gap-1 text-xs font-extrabold tracking-widest text-[#B71C1C] uppercase">
                <Flame className="w-4 h-4 fill-[#B71C1C]" /> HOT DROPS
              </span>
              <h2 className="font-display font-black text-3xl text-slate-900 mt-1">
                Trending Featured Releases
              </h2>
            </div>
          </div>

          {loading ? (
            <SkeletonLoader count={6} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        <section className="w-full px-8 lg:px-12 my-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-karviyam-dark via-slate-900 to-slate-950 p-14 text-white shadow-2xl border border-slate-800">
            <div className="relative z-10 max-w-xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 mb-4">
                <Sparkles className="w-3.5 h-3.5" /> LUXURY CRAFTSMANSHIP
              </span>
              <h3 className="font-display font-black text-5xl leading-tight mb-4">
                925 Sterling Silver Royal Emerald Pendant
              </h3>
              <p className="text-sm text-slate-300 mb-8 leading-relaxed">
                Handcrafted by master artisans with lab-grown emerald crystals and pure sterling silver finish.
              </p>
              <a
                href="/product/4"
                className="inline-block bg-karviyam-primary text-white font-extrabold text-xs uppercase tracking-wider px-8 py-4 rounded-full hover:bg-karviyam-hover transition-colors shadow-lg shadow-karviyam-primary/30"
              >
                CLAIM YOUR PIECE →
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
