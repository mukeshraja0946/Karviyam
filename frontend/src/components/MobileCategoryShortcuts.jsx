import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Sparkles } from 'lucide-react';

const CATEGORY_IMAGES = {
  'WOMEN': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400',
  'MEN': 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400',
  'KIDS & BABY': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400',
  'KIDS': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400',
  'ACCESSORIES': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
  'JEWELS': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400',
  'JEWELLERY': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400',
  'KITCHEN & HOME': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400',
  'HOME': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400',
  'BEAUTY': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
  'FOOTWEAR': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
  'FASHION': 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400'
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400';

export default function MobileCategoryShortcuts() {
  const navigate = useNavigate();
  const [shortcuts, setShortcuts] = useState([]);

  useEffect(() => {
    fetchShortcuts();
    window.addEventListener('karviyam_categories_updated', fetchShortcuts);
    return () => window.removeEventListener('karviyam_categories_updated', fetchShortcuts);
  }, []);

  const fetchShortcuts = async () => {
    try {
      const res = await api.get('/categories/tree').catch(() => null);
      const apiData = res?.data ? res.data : res;
      let list = Array.isArray(apiData?.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);

      if (list.length === 0) {
        const altRes = await api.get('/categories?activeOnly=true').catch(() => null);
        const altData = altRes?.data ? altRes.data : altRes;
        list = Array.isArray(altData?.data) ? altData.data : (Array.isArray(altData) ? altData : []);
      }

      if (list.length > 0) {
        const formatted = list.map(cat => {
          const key = (cat.name || '').toUpperCase().trim();
          const img = cat.imageUrl || cat.iconUrl || CATEGORY_IMAGES[key] || DEFAULT_IMAGE;
          return {
            id: cat.id,
            name: cat.name,
            image: img
          };
        });
        setShortcuts(formatted);
      } else {
        setShortcuts([
          { id: 1, name: 'Fashion', image: CATEGORY_IMAGES['FASHION'] },
          { id: 2, name: 'Beauty', image: CATEGORY_IMAGES['BEAUTY'] },
          { id: 3, name: 'Jewellery', image: CATEGORY_IMAGES['JEWELLERY'] },
          { id: 4, name: 'Footwear', image: CATEGORY_IMAGES['FOOTWEAR'] },
          { id: 5, name: 'Accessories', image: CATEGORY_IMAGES['ACCESSORIES'] },
          { id: 6, name: 'Home', image: CATEGORY_IMAGES['HOME'] },
          { id: 7, name: 'Kids', image: CATEGORY_IMAGES['KIDS'] }
        ]);
      }
    } catch (e) {
      console.error('Error fetching shortcuts:', e);
    }
  };

  if (shortcuts.length === 0) return null;

  return (
    <div className="mobile-only w-full bg-slate-50/70 py-3 px-3 border-b border-slate-200/80 block md:hidden">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#B71C1C]" /> Category Shortcuts
        </span>
        <button
          onClick={() => navigate('/shop')}
          className="text-[10px] font-bold text-[#B71C1C] hover:underline cursor-pointer"
        >
          View All →
        </button>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x py-1">
        {shortcuts.map((sc) => (
          <button
            key={sc.id}
            onClick={() => navigate(`/shop?category=${encodeURIComponent(sc.name)}`)}
            className="flex flex-col items-center shrink-0 group focus:outline-none cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-200 group-hover:border-[#B71C1C] p-0.5 bg-white shadow-xs group-active:scale-95 transition-all">
              <img
                src={sc.image}
                alt={sc.name}
                className="w-full h-full object-cover rounded-xl"
                loading="lazy"
              />
            </div>
            <span className="text-[10px] font-bold text-slate-800 mt-1.5 text-center truncate max-w-[62px]">
              {sc.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
