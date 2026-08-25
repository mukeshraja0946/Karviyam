import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Tag, Crown, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function MobileBottomNav() {
  const location = useLocation();
  const { itemCount } = useCart();

  const searchParams = new URLSearchParams(location.search);
  const currentMaxPrice = searchParams.get('maxPrice');
  const currentCategory = searchParams.get('category');

  const navItems = [
    {
      label: 'Home',
      path: '/',
      icon: Home,
      isActive: location.pathname === '/'
    },
    {
      label: 'Under ₹999',
      path: '/shop?maxPrice=999',
      icon: Tag,
      isActive: location.pathname.startsWith('/shop') && currentMaxPrice === '999'
    },
    {
      label: 'Luxury',
      path: '/shop?category=Jewellery',
      icon: Crown,
      isActive: location.pathname.startsWith('/shop') && (currentCategory === 'Jewellery' || currentCategory === 'Jewelry')
    },
    {
      label: 'Bag',
      path: '/cart',
      icon: ShoppingBag,
      badge: itemCount,
      isActive: location.pathname.startsWith('/cart')
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] block md:hidden">
      <div className="flex items-center justify-around h-14 px-1 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? 'text-[#B71C1C]' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2 bg-[#B71C1C] text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border border-white shadow-xs">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold mt-0.5 tracking-tight ${isActive ? 'font-black' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
