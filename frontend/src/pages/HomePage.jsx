import React, { useState, useEffect } from 'react';
import HeroBanner from '../components/HeroBanner';
import CategoryCards from '../components/CategoryCards';
import MobileCategoryBar from '../components/MobileCategoryBar';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import DesktopSidebarLeft from '../components/desktop/DesktopSidebarLeft';
import DesktopCenterContent from '../components/desktop/DesktopCenterContent';
import DesktopSidebarRight from '../components/desktop/DesktopSidebarRight';
import DesktopTrustBar from '../components/desktop/DesktopTrustBar';
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
        api.get('/products/featured'),
        api.get('/products/new-arrivals')
      ]);

      const featData = featRes.data ? featRes.data : featRes;
      const featList = Array.isArray(featData.data) ? featData.data : (Array.isArray(featData) ? featData : []);
      
      const newData = newRes.data ? newRes.data : newRes;
      const newList = Array.isArray(newData.data) ? newData.data : (Array.isArray(newData) ? newData : []);

      if (featList.length > 0) {
        setFeaturedProducts(featList);
      } else {
        const fallbackRes = await api.get('/products?size=8');
        const fbData = fallbackRes.data ? fallbackRes.data : fallbackRes;
        const pageObj = fbData.data || fbData;
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
    <div>
      {/* ========================================================= */}
      {/* DESKTOP HOMEPAGE LAYOUT (>= 1024px / lg)                   */}
      {/* MATCHES REFERENCE SPECIFICATION EXACTLY                    */}
      {/* ========================================================= */}
      <div className="hidden lg:block py-3 bg-[#FAFAFA] min-h-screen">
        <div className="max-w-[1560px] w-full mx-auto px-3 sm:px-4 flex justify-center items-start gap-3 xl:gap-4">
          {/* Column 1: Left Sidebar */}
          <DesktopSidebarLeft />

          {/* Column 2: Center Content */}
          <DesktopCenterContent />

          {/* Column 3: Right Column */}
          <DesktopSidebarRight />
        </div>

        {/* Bottom Trust Strip */}
        <DesktopTrustBar />
      </div>

      {/* ========================================================= */}
      {/* MOBILE / TABLET HOMEPAGE LAYOUT (< 1024px)                 */}
      {/* UNTOUCHED EXISTING MOBILE UI                               */}
      {/* ========================================================= */}
      <div className="block lg:hidden">
        {/* Mobile Category Quick Scroll Bar */}
        <MobileCategoryBar />

        <HeroBanner />
        
        {/* Category Cards */}
        <div className="hidden sm:block">
          <CategoryCards />
        </div>

        {/* Featured Drop Section */}
        <section className="w-full px-2 sm:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4 px-1 sm:px-0">
            <div>
              <span className="flex items-center gap-1 text-[10px] sm:text-xs font-extrabold tracking-widest text-[#B71C1C] uppercase">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#B71C1C]" /> HOT DROPS
              </span>
              <h2 className="font-display font-black text-lg sm:text-3xl text-slate-900 mt-0.5 sm:mt-1">
                Trending Featured Releases
              </h2>
            </div>
          </div>

          {loading ? (
            <SkeletonLoader count={6} />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-2 gap-1.5 sm:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Banner Callout */}
        <section className="w-full px-2 sm:px-8 my-4 sm:my-6">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-karviyam-dark via-slate-900 to-slate-950 p-5 sm:p-14 text-white shadow-2xl border border-slate-800">
            <div className="relative z-10 max-w-xl">
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-amber-400/20 mb-3 sm:mb-4">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> LUXURY CRAFTSMANSHIP
              </span>
              <h3 className="font-display font-black text-xl sm:text-5xl leading-tight mb-2 sm:mb-4">
                925 Sterling Silver Royal Emerald Pendant
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mb-5 sm:mb-8 leading-relaxed">
                Handcrafted by master artisans with lab-grown emerald crystals and pure sterling silver finish.
              </p>
              <a
                href="/product/4"
                className="inline-block bg-karviyam-primary text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-wider px-5 py-3 sm:px-8 sm:py-4 rounded-full hover:bg-karviyam-hover transition-colors shadow-lg shadow-karviyam-primary/30"
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
