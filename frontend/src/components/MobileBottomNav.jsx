import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Tag, ShoppingBag, Grid } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

export default function MobileBottomNav() {
  const location = useLocation();
  const { itemCount } = useCart();
  const { wishlistCount, wishlist } = useWishlist();
  const { user } = useAuth();

  const totalWishlistCount = wishlistCount || (Array.isArray(wishlist) ? wishlist.length : 0);

  const navItems = [
    {
      label: 'Home',
      path: '/',
      icon: Home
    },
    {
      label: 'Categories',
      path: '/shop',
      icon: Grid
    },
    {
      label: 'Offers',
      path: '/offers',
      icon: Tag
    },
    {
      label: 'Cart',
      path: '/cart',
      icon: ShoppingBag,
      badge: itemCount
    },
    {
      label: user ? 'Account' : 'Login',
      path: user ? '/profile' : '/login',
      icon: User
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] block lg:hidden">
      <div className="flex items-center justify-around h-14 px-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

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
                  <span className="absolute -top-1.5 -right-2 bg-[#B71C1C] text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border border-white shadow-2xs">
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
