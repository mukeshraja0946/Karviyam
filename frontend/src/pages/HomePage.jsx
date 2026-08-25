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

        {/* 3.5. Coupon Offer Banner (Matches Reference Image 1) */}
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
              <span className="text-[10px] font-black text-[#B71C1C]">KARVIYAMSAVE</span>
              <span className="text-[#B71C1C] font-black text-[11px]">%</span>
            </div>
          </div>
        </div>

        {/* 4. Promotional Mobile Hero Banner */}
        <HeroBanner />

        {/* 4.5. Bank Cashback Callout (Matches Reference Image 1) */}
        <div className="w-full px-3 py-2">
          <div className="bg-slate-900 text-white rounded-2xl p-2.5 flex items-center justify-between border border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#B71C1C] flex items-center justify-center font-black text-xs shrink-0">
                7.5%
              </div>
              <div>
                <p className="text-xs font-black text-white">Get 7.5%* Cashback On Karviyam</p>
                <p className="text-[9px] text-slate-300 font-medium">With HDFC & AXIS Credit Card & UPI Payments</p>
              </div>
            </div>
            <a href="/shop" className="text-[10px] font-black text-amber-400 uppercase tracking-wide underline shrink-0">
              APPLY →
            </a>
          </div>
        </div>

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
