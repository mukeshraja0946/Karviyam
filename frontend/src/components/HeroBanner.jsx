import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';

const DEFAULT_BANNERS = [
  {
    id: 1,
    title: "GALAXY OF ELEGANCE",
    subtitle: "Discover the 2026 High-Fashion & Streetwear Collection",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600",
    cta: "SHOP COLLECTION",
    link: "/shop"
  },
  {
    id: 2,
    title: "ROYAL EMERALD JEWELLERY",
    subtitle: "925 Sterling Silver Handcrafted Couture",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600",
    cta: "EXPLORE JEWELLERY",
    link: "/shop?category=Jewellery"
  }
];

export default function HeroBanner() {
  const [banners, setBanners] = useState(DEFAULT_BANNERS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [speed, setSpeed] = useState(5000);
  const navigate = useNavigate();

  useEffect(() => {
    loadBanners();
    window.addEventListener('karviyam_banners_updated', loadBanners);
    return () => window.removeEventListener('karviyam_banners_updated', loadBanners);
  }, []);

  const loadBanners = async () => {
    try {
      const savedAuto = localStorage.getItem('karviyam_banner_autoscroll');
      setAutoScroll(savedAuto !== null ? JSON.parse(savedAuto) : true);

      const savedSpeed = localStorage.getItem('karviyam_banner_speed');
      setSpeed(savedSpeed ? Number(savedSpeed) : 5000);

      const res = await api.get('/banners');
      const apiData = res.data ? res.data : res;
      const list = Array.isArray(apiData.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);
      
      if (list.length > 0) {
        const formatted = list.map(b => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          image: b.imagePath || b.imageUrl || b.image,
          cta: 'EXPLORE COLLECTION',
          link: b.link || '/shop'
        }));
        setBanners(formatted);
      } else {
        const saved = localStorage.getItem('karviyam_admin_banners');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBanners(parsed.map(b => ({
              id: b.id,
              title: b.title,
              subtitle: b.subtitle,
              image: b.imagePath || b.imageUrl || b.image,
              cta: 'EXPLORE COLLECTION',
              link: b.link || '/shop'
            })));
            return;
          }
        }
        setBanners(DEFAULT_BANNERS);
      }
    } catch (e) {
      console.error(e);
      const saved = localStorage.getItem('karviyam_admin_banners');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBanners(parsed.map(b => ({
              id: b.id,
              title: b.title,
              subtitle: b.subtitle,
              image: b.imagePath || b.imageUrl || b.image,
              cta: 'EXPLORE COLLECTION',
              link: b.link || '/shop'
            })));
            return;
          }
        } catch (errSaved) {}
      }
      setBanners(DEFAULT_BANNERS);
    }
  };

  useEffect(() => {
    if (!autoScroll || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, speed);
    return () => clearInterval(timer);
  }, [banners.length, autoScroll, speed]);

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > 50) {
      // Swipe Left -> Next
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    } else if (distance < -50) {
      // Swipe Right -> Prev
      setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }
    setTouchStartX(0);
    setTouchEndX(0);
  };

  const current = banners[currentIndex] || DEFAULT_BANNERS[0];

  return (
    <div className="w-full px-3 sm:px-0 py-2 sm:py-0">
      <div
        className="relative w-full h-[220px] sm:h-[480px] lg:h-[550px] bg-slate-900 rounded-2xl sm:rounded-none overflow-hidden shadow-md"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-105"
          style={{ backgroundImage: `url(${current.image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-12 flex flex-col justify-center text-white z-10">
          <div className="max-w-xl animate-in fade-in slide-in-from-left-4 duration-500">
            <span className="inline-block bg-[#B71C1C] text-white text-[9px] sm:text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full mb-2 sm:mb-4 shadow-md">
              NEW SEASON ARRIVAL
            </span>
            <h1 className="font-display font-black text-xl sm:text-5xl tracking-tight leading-tight mb-1.5 sm:mb-4 text-white drop-shadow-md line-clamp-2">
              {current.title}
            </h1>
            <p className="text-xs sm:text-base text-slate-200 font-light mb-4 sm:mb-8 max-w-lg line-clamp-2">
              {current.subtitle}
            </p>
            <button
              onClick={() => navigate(current.link)}
              className="inline-flex items-center gap-2 bg-white text-slate-900 font-black text-[10px] sm:text-xs uppercase tracking-wider px-4 py-2 sm:px-8 sm:py-4 rounded-full hover:bg-[#B71C1C] hover:text-white transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <span>{current.cta}</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Controls (hidden on mobile) */}
        <button
          onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-[#B71C1C] text-slate-800 hover:text-white rounded-full transition-colors shadow-md backdrop-blur-md cursor-pointer z-20"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-[#B71C1C] text-slate-800 hover:text-white rounded-full transition-colors shadow-md backdrop-blur-md cursor-pointer z-20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? 'bg-[#B71C1C] w-6' : 'bg-white/60 w-2'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
