import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

export default function MobileCategoryBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);

  // Determine current active category from query search params or path
  const searchParams = new URLSearchParams(location.search);
  const activeCategoryParam = searchParams.get('category') || searchParams.get('categoryId') || '';

  useEffect(() => {
    fetchCategories();
    window.addEventListener('karviyam_categories_updated', fetchCategories);
    return () => window.removeEventListener('karviyam_categories_updated', fetchCategories);
  }, []);

  const fetchCategories = async () => {
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
        const formatted = list.map((cat) => ({
          id: cat.id,
          name: cat.name.toUpperCase(),
          fullName: cat.name,
          query: `category=${encodeURIComponent(cat.name)}`
        }));
        setCategories(formatted);
      } else {
        setCategories([
          { id: 1, name: 'MEN', fullName: 'Men', query: 'category=Men' },
          { id: 2, name: 'WOMEN', fullName: 'Women', query: 'category=Women' },
          { id: 3, name: 'KIDS', fullName: 'Kids', query: 'category=Kids' },
          { id: 4, name: 'ACCESSORIES', fullName: 'Accessories', query: 'category=Accessories' },
          { id: 5, name: 'JEWELLERY', fullName: 'Jewellery', query: 'category=Jewellery' }
        ]);
      }
    } catch (e) {
      console.error('Error fetching mobile nav categories:', e);
    }
  };

  const isAllActive = location.pathname === '/shop' && !activeCategoryParam;

  return (
    <div className="mobile-only w-full bg-white border-b border-slate-200 block md:hidden sticky top-[108px] z-30 shadow-2xs">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x px-3 py-2 whitespace-nowrap flex-nowrap">
        {/* ALL Pill */}
        <button
          onClick={() => navigate('/shop')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
            isAllActive
              ? 'bg-[#B71C1C] text-white shadow-xs scale-105'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
          }`}
        >
          ALL
        </button>

        {/* Dynamic Category Pills */}
        {categories.map((cat) => {
          const isActive =
            activeCategoryParam.toLowerCase() === cat.fullName.toLowerCase() ||
            activeCategoryParam.toLowerCase() === cat.name.toLowerCase() ||
            activeCategoryParam === String(cat.id);

          return (
            <button
              key={cat.id}
              onClick={() => navigate(`/shop?${cat.query}`)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#B71C1C] text-white shadow-xs scale-105'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

