import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const DEFAULT_PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800";

const CATEGORY_TYPE_IMAGES = {
  'WOMEN': "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
  'MEN': "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
  'KIDS & BABY': "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
  'ACCESSORIES': "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800",
  'JEWELS': "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800",
  'KITCHEN & HOME': "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800",
  'SCHOOL & OFFICE': "https://images.unsplash.com/photo-1588072432836-e10032774350?w=800",
  'UNISEX': "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"
};

export default function CategoryCards() {
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
      let list = Array.isArray(apiData.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);

      if (list.length === 0) {
        const altRes = await api.get('/categories?activeOnly=true');
        const altData = altRes.data ? altRes.data : altRes;
        const allCats = Array.isArray(altData.data) ? altData.data : (Array.isArray(altData) ? altData : []);
        list = allCats.filter(c => !c.parentId && (c.isActive === undefined || c.isActive === true));
      }

      if (list.length > 0) {
        const formatted = list.map((cat) => {
          const catType = (cat.type || cat.name || '').toUpperCase();
          const fallbackImg = CATEGORY_TYPE_IMAGES[catType] || DEFAULT_PLACEHOLDER_IMAGE;
          const subCount = cat.subcategories ? cat.subcategories.length : 0;
          const countText = cat.description && cat.description.length < 40
            ? cat.description
            : (subCount > 0 ? `${subCount} Collections` : 'Exclusive Collection');

          return {
            id: cat.id,
            name: cat.name,
            count: countText,
            image: cat.imageUrl || cat.iconUrl || fallbackImg,
            query: `category=${encodeURIComponent(cat.name)}`
          };
        });
        setCategories(formatted);
      } else {
        setCategories([]);
      }
    } catch (e) {
      console.error('[CategoryCards] Error fetching categories:', e);
      setCategories([]);
    }
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="desktop-only w-full px-4 sm:px-8 lg:px-12 pt-6 pb-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#B71C1C]">CURATED SELECTIONS</span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 mt-1">Shop by Category</h2>
        </div>
        <button
          onClick={() => navigate('/shop')}
          className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-[#B71C1C] transition-colors cursor-pointer"
        >
          View All Categories →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigate(`/shop?${cat.query}`)}
            className="group relative h-72 rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1"
          >
            <img
              src={cat.image}
              alt={cat.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="text-[10px] uppercase font-bold tracking-widest text-karviyam-primary bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                {cat.count}
              </span>
              <h3 className="font-display font-extrabold text-xl mt-2 group-hover:text-karviyam-primary transition-colors">
                {cat.name}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
