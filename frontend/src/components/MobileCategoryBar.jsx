import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
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

  const isAllActive = location.pathname === '/' || (location.pathname === '/shop' && !activeCategoryParam);

  return (
    <div className="mobile-only w-full bg-[#FFF3F5] border-b border-[#FCE4E8] block md:hidden sticky top-[138px] z-30 shadow-2xs">
      <div className="flex items-center justify-between px-3 py-1">
        <div className="flex items-center gap-5 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x flex-1 whitespace-nowrap flex-nowrap py-1.5">
          {/* ALL Tab */}
          <button
            onClick={() => navigate('/shop')}
            className={`pb-1 text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
              isAllActive
                ? 'text-[#B71C1C] border-b-2 border-[#B71C1C]'
                : 'text-slate-700 hover:text-[#B71C1C] font-extrabold'
            }`}
          >
            ALL
          </button>

          {/* Dynamic Category Tabs */}
          {categories.map((cat) => {
            const isActive =
              activeCategoryParam.toLowerCase() === cat.fullName.toLowerCase() ||
              activeCategoryParam.toLowerCase() === cat.name.toLowerCase() ||
              activeCategoryParam === String(cat.id);

            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/shop?${cat.query}`)}
                className={`pb-1 text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-[#B71C1C] font-black border-b-2 border-[#B71C1C]'
                    : 'text-slate-700 hover:text-[#B71C1C] font-extrabold'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Far Right Category Grid Icon */}
        <button
          onClick={() => navigate('/shop')}
          className="p-1.5 text-slate-800 hover:text-[#B71C1C] shrink-0 bg-white/90 rounded-lg border border-slate-200 ml-1 cursor-pointer shadow-2xs"
          title="All Categories"
        >
          <LayoutGrid className="w-4 h-4 text-slate-900" />
        </button>
      </div>
    </div>
  );
}

