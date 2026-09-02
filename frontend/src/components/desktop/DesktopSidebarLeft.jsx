import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag,
  Clock,
  Award,
  TrendingUp,
  Crown,
  Gift,
  Truck,
  Headphones,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import api from '../../utils/api';
import { resolveImageUrl } from '../../utils/imageUtils';

const MENU_ITEMS = [
  { id: 'offers', label: 'Top Offers', icon: Tag, link: '/shop?filter=offers' },
  { id: 'arrivals', label: 'New Arrivals', icon: Clock, link: '/shop?filter=new' },
  { id: 'bestsellers', label: 'Best Sellers', icon: Award, link: '/shop?filter=bestsellers' },
  { id: 'trending', label: 'Trending Now', icon: TrendingUp, link: '/shop?filter=trending' },
  { id: 'premium', label: 'Premium Store', icon: Crown, link: '/shop?category=Jewellery' },
  { id: 'gifts', label: 'Gift Cards', icon: Gift, link: '/contact' },
  { id: 'track', label: 'Track Order', icon: Truck, link: '/profile' },
  { id: 'support', label: 'Customer Support', icon: Headphones, link: '/contact' }
];

export default function DesktopSidebarLeft() {
  const navigate = useNavigate();
  const [promoCards, setPromoCards] = useState([]);

  useEffect(() => {
    fetchPromoCards();
    window.addEventListener('karviyam_promo_cards_updated', fetchPromoCards);
    window.addEventListener('storage', fetchPromoCards);
    return () => {
      window.removeEventListener('karviyam_promo_cards_updated', fetchPromoCards);
      window.removeEventListener('storage', fetchPromoCards);
    };
  }, []);

  const fetchPromoCards = async () => {
    try {
      const res = await api.get('/promo-cards').catch(() => null);
      const data = res?.data?.data || res?.data;
      let list = Array.isArray(data) ? data : [];

      if (!list || list.length === 0) {
        try {
          const saved = localStorage.getItem('karviyam_admin_promo_cards');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) list = parsed.filter(c => c.isActive !== false);
          }
        } catch (eSaved) {}
      }

      if (list && list.length > 0) {
        setPromoCards(list);
      }
    } catch (e) {
      console.error('Error fetching promo cards:', e);
    }
  };

  return (
    <aside className="w-[210px] xl:w-[230px] flex-shrink-0 flex flex-col gap-3">
      
      {/* 1. Sidebar Navigation Menu Card */}
      <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {MENU_ITEMS.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => navigate(item.link)}
              className={`h-[42px] xl:h-[44px] px-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-slate-50 text-slate-800 group ${
                idx !== MENU_ITEMS.length - 1 ? 'border-b border-slate-100/90' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-red-50 group-hover:text-[#B71C1C] transition-colors">
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] xl:text-xs font-black tracking-tight truncate">{item.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#B71C1C] transition-colors shrink-0" />
            </div>
          );
        })}
      </div>

      {/* 2. Extra 5% OFF Banner */}
      <div 
        onClick={() => navigate('/shop?filter=offers')}
        className="w-full h-[72px] bg-[#FFF0F2] border border-red-200/90 rounded-xl p-3 flex items-center justify-between shadow-2xs overflow-hidden relative cursor-pointer hover:border-[#B71C1C] transition-colors group"
      >
        <div className="flex flex-col justify-center">
          <span className="font-display font-black text-xs xl:text-sm text-[#B71C1C] uppercase tracking-wide group-hover:underline">
            EXTRA 5% OFF
          </span>
          <span className="text-[10px] text-slate-600 font-bold mt-0.5">
            On Prepaid Orders
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-red-100/90 border border-red-200 text-[#B71C1C] flex items-center justify-center font-black text-sm shadow-2xs group-hover:scale-105 transition-transform">
          %
        </div>
      </div>

      {/* 3. Festive Special / Admin-Managed Promo Banner */}
      {promoCards.length > 0 ? (
        promoCards.map((card) => (
          <div
            key={card.id}
            onClick={() => navigate(card.link || '/shop')}
            className="w-full h-[340px] xl:h-[360px] rounded-2xl overflow-hidden relative shadow-sm cursor-pointer border border-slate-200 group bg-slate-950 flex items-center justify-center"
          >
            <img
              src={resolveImageUrl(card.imageUrl)}
              alt={card.title || 'Promotional Banner'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))
      ) : (
        /* Fallback Festive Banner matching reference screenshot */
        <div 
          onClick={() => navigate('/shop')}
          className="w-full h-[340px] xl:h-[360px] rounded-2xl overflow-hidden relative shadow-md text-white p-4 xl:p-5 flex flex-col justify-between bg-gradient-to-b from-[#7A0000] via-[#A30000] to-[#450000] group cursor-pointer border border-red-900/60"
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600')`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-300 bg-black/40 border border-amber-400/60 px-2.5 py-1 rounded-md backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-amber-300" /> FESTIVE SPECIAL
            </span>
            <div className="mt-4">
              <span className="font-display font-black text-xl xl:text-2xl text-white block uppercase tracking-tight drop-shadow-md">
                UP TO
              </span>
              <span className="font-display font-black text-3xl xl:text-4xl text-amber-400 block leading-none tracking-tight drop-shadow-md mt-0.5">
                60% OFF
              </span>
              <span className="text-xs text-slate-100 font-bold block mt-1.5 drop-shadow-xs">
                On Bestsellers
              </span>
            </div>
          </div>

          <div className="relative z-10 w-full">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/shop');
              }}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-black text-xs uppercase tracking-wider py-2.5 rounded-full shadow-lg transition-transform group-hover:scale-102 cursor-pointer text-center"
            >
              SHOP NOW
            </button>
          </div>
        </div>
      )}

    </aside>
  );
}
