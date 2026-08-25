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

        {/* 4. Promotional Mobile Banner */}
        <HeroBanner />

        {/* 5. Promotional Section Callout */}
        <section className="w-full px-3 my-3">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-4 text-white shadow-lg border border-slate-800">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 mb-2">
                <Sparkles className="w-3 h-3 text-amber-400" /> LUXURY CRAFTSMANSHIP
              </span>
              <h3 className="font-display font-black text-lg leading-tight mb-1 text-white">
                925 Sterling Silver Royal Emerald Pendant
              </h3>
              <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
                Handcrafted by master artisans with pure sterling silver finish.
              </p>
              <a
                href="/product/4"
                className="inline-block bg-[#B71C1C] text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-full shadow-md"
              >
                CLAIM YOUR PIECE →
              </a>
            </div>
          </div>
        </section>

        {/* 6. Product Grid - STRICTLY 2 PRODUCTS PER ROW ON MOBILE */}
        <section className="w-full px-3 py-2">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <div>
              <span className="flex items-center gap-1 text-[10px] font-black tracking-widest text-[#B71C1C] uppercase">
                <Flame className="w-3 h-3 fill-[#B71C1C]" /> HOT DROPS
              </span>
              <h2 className="font-display font-black text-base text-slate-900 mt-0.5">
                Trending Releases
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
