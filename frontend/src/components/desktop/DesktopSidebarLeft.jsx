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
      
      {/* 1. Sidebar Menu Card */}
      <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {MENU_ITEMS.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => navigate(item.link)}
              className={`h-[44px] xl:h-[46px] px-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-red-50/60 hover:text-[#B71C1C] text-slate-700 ${
                idx !== MENU_ITEMS.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-[#B71C1C]">
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] xl:text-xs font-extrabold tracking-tight">{item.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
          );
        })}
      </div>

      {/* 2. Extra Offer Banner */}
      <div 
        onClick={() => navigate('/shop?filter=offers')}
        className="w-full h-[72px] bg-[#FFF0F2] border border-red-200/90 rounded-xl p-3 flex items-center justify-between shadow-xs overflow-hidden relative cursor-pointer hover:border-[#B71C1C] transition-colors group"
      >
        <div className="flex flex-col justify-center">
          <span className="font-display font-black text-xs xl:text-sm text-[#B71C1C] uppercase tracking-wide group-hover:underline">
            EXTRA 5% OFF
          </span>
          <span className="text-[10px] text-slate-600 font-bold mt-0.5">
            On Prepaid Orders
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-red-100/80 border border-red-200 text-[#B71C1C] flex items-center justify-center font-black text-sm shadow-2xs group-hover:scale-105 transition-transform">
          %
        </div>
      </div>

      {/* 3. Dynamic Admin-Managed Promotional Cards */}
      {promoCards.length > 0 ? (
        promoCards.map((card) => (
          <div
            key={card.id}
            onClick={() => navigate(card.link || '/shop')}
            className="w-full h-[330px] xl:h-[350px] rounded-xl overflow-hidden relative shadow-sm cursor-pointer border border-slate-200 group bg-slate-950 flex items-center justify-center"
          >
            <img
              src={resolveImageUrl(card.imageUrl)}
              alt={card.title || 'Promotional Banner'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))
      ) : (
        /* Fallback Festive Banner */
        <div className="w-full h-[330px] xl:h-[350px] rounded-xl overflow-hidden relative shadow-sm text-white p-4 xl:p-5 flex flex-col justify-between bg-gradient-to-b from-[#6D0000] via-[#8E0000] to-[#3D0000]">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600')`
            }}
          />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
              <Sparkles className="w-3 h-3 text-amber-300" /> FESTIVE SPECIAL
            </span>
            <h3 className="font-display font-black text-2xl xl:text-3xl leading-none text-white tracking-tight mt-3.5 drop-shadow-md">
              UP TO<br />
              <span className="text-amber-300 text-3xl xl:text-4xl">60%</span><br />
              OFF
            </h3>
            <p className="text-[11px] xl:text-xs text-amber-100/90 font-semibold mt-2">
              On Bestsellers
            </p>
          </div>
          <div className="relative z-10">
            <button
              onClick={() => navigate('/shop')}
              className="w-full bg-white text-slate-900 font-extrabold text-[11px] xl:text-xs uppercase tracking-wider py-2.5 xl:py-3 rounded-full hover:bg-amber-300 transition-colors shadow-md cursor-pointer"
            >
              SHOP NOW
            </button>
          </div>
        </div>
      )}

    </aside>
  );
}
