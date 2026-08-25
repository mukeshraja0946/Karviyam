import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

const DEFAULT_MOBILE_PLACEHOLDER = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400";

const GENDER_TABS = [
  { id: 'ALL', label: 'ALL', query: '' },
  { id: 'MEN', label: 'MEN', query: 'gender=Men' },
  { id: 'WOMEN', label: 'WOMEN', query: 'gender=Women' },
  { id: 'KIDS', label: 'KIDS', query: 'gender=Kids' },
  { id: 'LUXURY', label: 'LUXURY', query: 'category=Jewellery' }
];

export default function MobileCategoryBar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('ALL');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
    window.addEventListener('karviyam_categories_updated', fetchCategories);
    return () => window.removeEventListener('karviyam_categories_updated', fetchCategories);
  }, []);

  useEffect(() => {
    const currentGender = searchParams.get('gender')?.toUpperCase();
    const currentCat = searchParams.get('category')?.toUpperCase();
    if (currentGender && GENDER_TABS.some(t => t.id === currentGender)) {
      setActiveTab(currentGender);
    } else if (currentCat === 'JEWELLERY') {
      setActiveTab('LUXURY');
    } else {
      setActiveTab('ALL');
    }
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/tree');
      const apiData = res.data ? res.data : res;
      const list = Array.isArray(apiData.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);

      if (list.length > 0) {
        const formatted = list.map((cat) => ({
          id: cat.id,
          name: cat.name,
          image: cat.imageUrl || cat.iconUrl || DEFAULT_MOBILE_PLACEHOLDER,
          query: `category=${encodeURIComponent(cat.name)}`
        }));
        setCategories(formatted);
      } else {
        // Fallback default circular categories if DB is empty
        setCategories([
          { id: 1, name: 'Fashion', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300', query: 'category=Fashion' },
          { id: 2, name: 'Beauty', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300', query: 'category=Beauty' },
          { id: 3, name: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300', query: 'category=Footwear' },
          { id: 4, name: 'Jewellery', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300', query: 'category=Jewellery' },
          { id: 5, name: 'Accessories', image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=300', query: 'category=Accessories' }
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    if (tab.query) {
      navigate(`/shop?${tab.query}`);
    } else {
      navigate('/shop');
    }
  };

  return (
    <div className="w-full bg-white block md:hidden border-b border-slate-200">
      
      {/* 1. TOP HORIZONTAL SCROLLABLE TAB ROW ("ALL / MEN / WOMEN / KIDS") WITH ACTIVE UNDERLINE INDICATOR */}
      <div className="flex items-center gap-6 px-4 overflow-x-auto no-scrollbar border-b border-slate-100 scroll-smooth">
        {GENDER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`py-2.5 text-xs font-black tracking-wider uppercase shrink-0 transition-all relative ${
                isActive ? 'text-[#B71C1C]' : 'text-slate-600 hover:text-slate-900 font-bold'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B71C1C] rounded-full animate-in fade-in duration-200" />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. BOTTOM HORIZONTALLY SCROLLABLE ROW OF CIRCULAR CATEGORY ICONS WITH LABELS UNDERNEATH */}
      <div className="py-2.5 px-3">
        <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar scroll-smooth">
          {/* Explore All Category Circle */}
          <button
            onClick={() => navigate('/shop')}
            className="flex flex-col items-center shrink-0 group focus:outline-none"
          >
            <div className="w-13 h-13 rounded-full bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 flex items-center justify-center text-[#B71C1C] font-black text-xs shadow-2xs group-active:scale-95 transition-transform">
              ALL
            </div>
            <span className="text-[10px] font-extrabold text-slate-800 mt-1 text-center truncate max-w-[60px]">
              Explore
            </span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/shop?${cat.query}`)}
              className="flex flex-col items-center shrink-0 group focus:outline-none"
            >
              <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-100 p-0.5 shadow-2xs group-hover:border-[#B71C1C] group-active:scale-95 transition-all">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] font-extrabold text-slate-700 mt-1 text-center truncate max-w-[62px]" title={cat.name}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
