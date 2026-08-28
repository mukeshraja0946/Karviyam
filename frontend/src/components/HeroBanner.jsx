import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import { resolveImageUrl } from '../utils/imageUtils';

export default function HeroBanner() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [speed, setSpeed] = useState(5000);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadBanners();
    window.addEventListener('karviyam_banners_updated', loadBanners);
    return () => window.removeEventListener('karviyam_banners_updated', loadBanners);
  }, []);

  const loadBanners = async () => {
    try {
      let currentAuto = true;
      let currentSpeed = 5000;

      const res = await api.get('/banners').catch(() => null);
      const apiData = res?.data ? res.data : res;
      const rawData = apiData?.data !== undefined ? apiData.data : apiData;

      let list = [];
      if (Array.isArray(rawData)) {
        list = rawData;
      } else if (rawData && typeof rawData === 'object') {
        if (Array.isArray(rawData.banners)) list = rawData.banners;
        if (rawData.autoScroll !== undefined) currentAuto = Boolean(rawData.autoScroll);
        if (rawData.speed !== undefined) currentSpeed = Number(rawData.speed);
      }

      setAutoScroll(currentAuto);
      setSpeed(currentSpeed);

      if (Array.isArray(list)) {
        const activeList = list.filter(b => {
          if (!b) return false;
          const isAct = b.isActive !== false && String(b.status || 'active').toLowerCase() !== 'inactive';
          return isAct;
        });
        const formatted = activeList.map(b => {
          const rawImg = b.imageUrl || b.imagePath || b.image || '';
          const resolvedImg = resolveImageUrl(rawImg);
          return {
            id: b.id,
            title: b.title || '',
            subtitle: b.subtitle || '',
            image: resolvedImg,
            cta: b.buttonText || b.button_text || b.cta || 'Shop Now',
            link: b.buttonLink || b.link || '/shop'
          };
        });
        setBanners(formatted);
        setImageError(false);
      } else {
        setBanners([]);
      }
    } catch (e) {
      console.error('[HeroBanner] Error loading banners:', e);
      setBanners([]);
    }
  };

  useEffect(() => {
    if (!autoScroll || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, speed);
    return () => clearInterval(timer);
  }, [banners.length, autoScroll, speed]);

  if (!banners || banners.length === 0) return null;
  const current = banners[currentIndex] || banners[0];

  return (
    <div className="relative w-full h-[450px] sm:h-[550px] bg-slate-900 overflow-hidden">
      {/* Background Image with Fallback */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
        style={{ backgroundImage: `url(${imageError ? DEFAULT_BANNERS[0].image : current.image})` }}
      >
        {/* Hidden img to test load error */}
        <img
          src={current.image}
          alt=""
          className="hidden"
          onError={() => {
            console.warn(`[HeroBanner Image Load Warning] Failed to load banner image: ${current.image}`);
            setImageError(true);
          }}
          onLoad={() => setImageError(false)}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto h-full px-6 sm:px-12 flex flex-col justify-center text-white">
        <div className="max-w-2xl animate-in fade-in slide-in-from-left-6 duration-700">
          <span className="inline-block bg-[#B71C1C] text-white text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-4 shadow-lg shadow-[#B71C1C]/40">
            NEW SEASON ARRIVAL
          </span>
          <h1 className="font-display font-black text-4xl sm:text-6xl tracking-tight leading-none mb-4 text-white drop-shadow-md">
            {current.title}
          </h1>
          <p className="text-sm sm:text-lg text-slate-200 font-light mb-8 max-w-xl">
            {current.subtitle}
          </p>
          <button
            onClick={() => navigate(current.link)}
            className="inline-flex items-center gap-3 bg-white text-slate-900 font-extrabold text-xs uppercase tracking-wider px-8 py-4 rounded-full hover:bg-[#B71C1C] hover:text-white transition-all shadow-xl hover:scale-105"
          >
            <span>{current.cta}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <button
        onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-[#B71C1C] text-slate-800 hover:text-white rounded-full transition-colors shadow-md backdrop-blur-md cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-[#B71C1C] text-slate-800 hover:text-white rounded-full transition-colors shadow-md backdrop-blur-md cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-3 h-3 rounded-full transition-all cursor-pointer ${idx === currentIndex ? 'bg-[#B71C1C] w-8' : 'bg-white/60'}`}
          />
        ))}
      </div>
    </div>
  );
}
