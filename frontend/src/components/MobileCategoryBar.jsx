import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const DEFAULT_MOBILE_PLACEHOLDER = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400";

export default function MobileCategoryBar() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
    window.addEventListener('karviyam_categories_updated', fetchCategories);
    return () => window.removeEventListener('karviyam_categories_updated', fetchCategories);
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/tree');
      const apiData = res.data ? res.data : res;
      const list = Array.isArray(apiData.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);

      if (list.length > 0) {
        const apiOrigin = process.env.VITE_API_URL ? process.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8080';
        const formatted = list.map((cat) => {
          let img = cat.imageUrl || cat.iconUrl || DEFAULT_MOBILE_PLACEHOLDER;
          if (img.startsWith('/')) {
            img = `${apiOrigin}${img}`;
          }
          return {
            id: cat.id,
            name: cat.name.split(' ')[0], // Compact first word
            fullName: cat.name,
            image: img,
            query: `category=${encodeURIComponent(cat.name)}`
          };
        });
        setCategories(formatted);
      } else {
        setCategories([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full bg-white py-2.5 px-3 border-b border-slate-100 block md:hidden overflow-hidden">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
        {/* All Products Quick Pill */}
        <button
          onClick={() => navigate('/shop')}
          className="flex flex-col items-center shrink-0 group focus:outline-none"
        >
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-[#B71C1C] font-black text-xs shadow-2xs group-active:scale-95 transition-transform">
            ALL
          </div>
          <span className="text-[10px] font-bold text-slate-700 mt-1 text-center truncate max-w-[56px]">
            Explore
          </span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/shop?${cat.query}`)}
            className="flex flex-col items-center shrink-0 group focus:outline-none"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-slate-100 p-0.5 shadow-2xs group-active:scale-95 transition-transform">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover rounded-full"
                loading="lazy"
              />
            </div>
            <span className="text-[10px] font-bold text-slate-700 mt-1 text-center truncate max-w-[58px]" title={cat.fullName || cat.name}>
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
