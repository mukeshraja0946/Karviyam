import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Sparkles, Flame, Shirt, Heart, Package, Home, BookOpen } from 'lucide-react';
import api from '../utils/api';

const DEFAULT_SECTIONS = [
  {
    name: 'WOMEN',
    icon: Sparkles,
    subs: [
      { name: 'Sarees', link: '/shop?category=Sarees' },
      { name: 'Kurtis & Kurtas', link: '/shop?category=Kurtis' },
      { name: 'Lehengas & Cholis', link: '/shop?category=Lehengas' },
      { name: 'Marriage & Party Wear', link: '/shop?category=Party Wear' }
    ]
  },
  {
    name: 'MEN',
    icon: Shirt,
    subs: [
      { name: 'Formal & Casual Shirts', link: '/shop?category=Shirts' },
      { name: 'Jeans & Pants', link: '/shop?category=Pants' },
      { name: 'Dhotis & Traditional Wear', link: '/shop?category=Traditional Wear' },
      { name: "Men's Fabrics", link: '/shop?category=Men\'s Fabrics' }
    ]
  },
  {
    name: 'KIDS & BABY',
    icon: Package,
    subs: [
      { name: 'Baby Clothing', link: '/shop?category=Baby Clothing' },
      { name: 'Baby Essentials', link: '/shop?category=Baby Essentials' },
      { name: 'Soft Toys & Dolls', link: '/shop?category=Toys' },
      { name: 'Cars & Robots', link: '/shop?category=Toys' }
    ]
  },
  {
    name: 'ACCESSORIES',
    icon: Heart,
    subs: [
      { name: "Women's Bags & Jewelry", link: '/shop?category=Women\'s Accessories' },
      { name: "Men's Wallets & Watches", link: '/shop?category=Men\'s Accessories' },
      { name: 'Footwear & Slippers', link: '/shop?category=Shoes' },
      { name: 'Perfumes & Cosmetics', link: '/shop?category=Perfumes' }
    ]
  },
  {
    name: 'KITCHEN & HOME',
    icon: Home,
    subs: [
      { name: 'Brass & Copper Kitchenware', link: '/shop?category=Kitchenware' },
      { name: 'Clay Pots & Racks', link: '/shop?category=Kitchenware' },
      { name: 'Home Essentials & Decor', link: '/shop?category=Home Essentials' },
      { name: 'Night Lamps & Organizers', link: '/shop?category=Home Essentials' }
    ]
  },
  {
    name: 'SCHOOL & OFFICE',
    icon: BookOpen,
    subs: [
      { name: 'School & Lunch Bags', link: '/shop?category=School Bags' },
      { name: 'Water Bottles & Boxes', link: '/shop?category=Water Bottles' },
      { name: 'Stationery & Printers', link: '/shop?category=Stationery' },
      { name: 'Instant Cameras', link: '/shop?category=Instant Cameras' }
    ]
  }
];

export default function MegaMenu({ onClose }) {
  const [tree, setTree] = useState([]);

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    try {
      const res = await api.get('/categories/tree');
      if (res.success && res.data && res.data.length > 0) {
        setTree(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderSections = tree.length > 0 ? tree : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 text-left max-h-[75vh] overflow-y-auto pr-2">
      {renderSections ? (
        renderSections.slice(0, 6).map((cat) => (
          <div key={cat.id} className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-2">
              <Sparkles className="w-4 h-4 text-[#B71C1C]" /> {cat.name}
            </h4>
            <ul className="space-y-1.5 text-xs font-medium text-slate-600">
              {(cat.children || []).slice(0, 5).map((sub) => (
                <li key={sub.id}>
                  <Link
                    to={`/shop?category=${sub.id}`}
                    onClick={onClose}
                    className="hover:text-[#B71C1C] transition-colors truncate block"
                  >
                    {sub.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        DEFAULT_SECTIONS.map((sec, idx) => {
          const IconComp = sec.icon;
          return (
            <div key={idx} className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
              <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-2">
                <IconComp className="w-4 h-4 text-[#B71C1C]" /> {sec.name}
              </h4>
              <ul className="space-y-1.5 text-xs font-medium text-slate-600">
                {sec.subs.map((sub, sIdx) => (
                  <li key={sIdx}>
                    <Link
                      to={sub.link}
                      onClick={onClose}
                      className="hover:text-[#B71C1C] transition-colors truncate block"
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}

      {/* Featured Spotlight Card */}
      <div className="bg-red-50/80 p-5 rounded-2xl text-slate-900 flex flex-col justify-between relative overflow-hidden border border-red-200 col-span-1">
        <div className="z-10">
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-extrabold text-[#B71C1C] mb-2">
            <Flame className="w-3.5 h-3.5" /> Featured Spotlight
          </span>
          <h5 className="font-display font-extrabold text-sm leading-tight mb-1 text-slate-900">Karviyam Premium Inventory</h5>
          <p className="text-[11px] text-slate-600">Explore authentic Sarees, Apparel, Home Essentials & Accessories.</p>
        </div>
        <Link
          to="/shop"
          onClick={onClose}
          className="z-10 inline-block text-[11px] font-bold text-white bg-[#B71C1C] px-3.5 py-1.5 rounded-full self-start hover:bg-[#900C0C] transition-colors shadow-sm mt-3"
        >
          Explore Catalog →
        </Link>
      </div>
    </div>
  );
}

