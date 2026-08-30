import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  ChevronDown,
  Menu,
  X,
  Shield,
  Sparkles,
  MapPin,
  Mic,
  ArrowRight,
  Grid,
  Bell,
  Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import MegaMenu from './MegaMenu';
import VoiceSearchModal from './VoiceSearchModal';
import DeliveryLocationModal from './DeliveryLocationModal';
import api from '../utils/api';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { wishlist, wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const activeCatParam = searchParams.get('category') || searchParams.get('categoryId') || '';

  const isCategoryActive = (catKey, path = '/shop') => {
    if (path === '/contact') {
      return location.pathname === '/contact';
    }
    if (location.pathname !== '/shop' && location.pathname !== '/') {
      return false;
    }
    if (!catKey || catKey === 'ALL') {
      return !activeCatParam && !location.search.includes('category=');
    }
    return activeCatParam.toLowerCase() === catKey.toLowerCase();
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  // Customer Notifications System
  const defaultCustomerNotifs = [
    {
      id: 1,
      title: "Order Confirmed! 🛍️",
      description: "Your order #ORD-9821 has been placed successfully. Track your shipment live.",
      time: "10m ago",
      read: false,
      link: "/cart",
      type: "order"
    },
    {
      id: 2,
      title: "Festive Sale Live! 🎉",
      description: "Up to 60% OFF on High-Street Wear & Fine Jewellery. Use code KARVIYAM25.",
      time: "2h ago",
      read: false,
      link: "/shop",
      type: "offer"
    },
    {
      id: 3,
      title: "Customer Support Reply 🎧",
      description: "Karviyam Support Team has replied to your inquiry.",
      time: "1d ago",
      read: false,
      link: "/contact",
      type: "support"
    }
  ];

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('karviyam_customer_notifications');
      return saved ? JSON.parse(saved) : defaultCustomerNotifs;
    } catch (e) {
      return defaultCustomerNotifs;
    }
  });

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const markAllNotifsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('karviyam_customer_notifications', JSON.stringify(updated));
  };

  const markNotifRead = (id, link) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem('karviyam_customer_notifications', JSON.stringify(updated));
    setNotifOpen(false);
    if (link) navigate(link);
  };

  const clearAllNotifs = () => {
    setNotifications([]);
    localStorage.setItem('karviyam_customer_notifications', JSON.stringify([]));
  };

  const [customLogo, setCustomLogo] = useState(() => localStorage.getItem('karviyam_logo') || '');

  // Category Navigation Setting & Dynamic Categories
  const [navEnabled, setNavEnabled] = useState(true);
  const [navCategories, setNavCategories] = useState([]);

  const fetchNavSettingsAndCategories = async () => {
    try {
      const setRes = await api.get('/settings').catch(() => null);
      const setPayload = setRes?.data?.data || setRes?.data || {};
      const cnVal = setPayload.categoryNavigationEnabled !== undefined 
        ? setPayload.categoryNavigationEnabled 
        : setPayload.category_navigation_enabled;
      const isEnabled = cnVal === undefined ? true : (cnVal === true || cnVal === 'true' || cnVal === 1 || cnVal === '1');
      setNavEnabled(isEnabled);

      const catRes = await api.get('/categories/tree').catch(() => null);
      const catPayload = catRes?.data?.data || catRes?.data || [];
      let activeList = Array.isArray(catPayload) ? catPayload : [];

      if (activeList.length === 0) {
        const altRes = await api.get('/categories?activeOnly=true').catch(() => null);
        const altPayload = altRes?.data?.data || altRes?.data || [];
        activeList = Array.isArray(altPayload) ? altPayload : [];
      }

      const isCategoryActive = (c) => {
        if (!c) return false;
        const val = c.isActive !== undefined ? c.isActive : (c.is_active !== undefined ? c.is_active : c.enabled);
        if (val === undefined || val === null) return true;
        if (typeof val === 'boolean') return val;
        if (typeof val === 'number') return val === 1;
        if (typeof val === 'string') return val.toLowerCase() === 'true' || val === '1';
        if (typeof val === 'object' && val !== null && val.type === 'Buffer' && Array.isArray(val.data)) {
          return val.data[0] === 1 || val.data[0] === 0x01;
        }
        return Boolean(val);
      };

      const isTopLevelParent = (c) => {
        if (!c) return false;
        const pId = c.parentId !== undefined ? c.parentId : c.parent_id;
        return pId === null || pId === undefined || pId === '' || pId === 0 || pId === '0';
      };

      const topActive = activeList.filter(c => isTopLevelParent(c) && isCategoryActive(c));
      setNavCategories(topActive);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNavSettingsAndCategories();
    const handleStorageChange = () => {
      setCustomLogo(localStorage.getItem('karviyam_logo') || '');
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('karviyam_logo_updated', handleStorageChange);
    window.addEventListener('karviyam_settings_updated', fetchNavSettingsAndCategories);
    window.addEventListener('karviyam_category_nav_updated', fetchNavSettingsAndCategories);
    window.addEventListener('karviyam_categories_updated', fetchNavSettingsAndCategories);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('karviyam_logo_updated', handleStorageChange);
      window.removeEventListener('karviyam_settings_updated', fetchNavSettingsAndCategories);
      window.removeEventListener('karviyam_category_nav_updated', fetchNavSettingsAndCategories);
      window.removeEventListener('karviyam_categories_updated', fetchNavSettingsAndCategories);
    };
  }, []);

  // Delivery Location Modal State
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationPincode, setLocationPincode] = useState(() => localStorage.getItem('karviyam_user_pincode') || '');
  const [locationCity, setLocationCity] = useState(() => localStorage.getItem('karviyam_user_city') || '');

  useEffect(() => {
    const syncLocation = () => {
      const savedPin = localStorage.getItem('karviyam_user_pincode') || '';
      const savedCity = localStorage.getItem('karviyam_user_city') || '';
      setLocationPincode(savedPin);
      setLocationCity(savedCity);
    };

    window.addEventListener('karviyam_location_updated', syncLocation);
    window.addEventListener('storage', syncLocation);
    return () => {
      window.removeEventListener('karviyam_location_updated', syncLocation);
      window.removeEventListener('storage', syncLocation);
    };
  }, []);

  // Voice Search Modal State
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const delay = setTimeout(async () => {
        try {
          const res = await api.get(`/products?keyword=${encodeURIComponent(searchQuery)}&size=5`);
          const payload = res.data;
          if (payload && payload.success) {
            setSearchResults(payload.data.content || []);
            setShowSearchDrop(true);
          }
        } catch (e) {
          console.error(e);
        }
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
      setShowSearchDrop(false);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDrop(false);
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs">
      
      {/* ========================================================= */}
      {/* MOBILE HEADER (< 1024px / lg)                             */}
      {/* MATCHES REFERENCE SPECIFICATION EXACTLY                    */}
      {/* ========================================================= */}
      <div className="block lg:hidden bg-white border-b border-slate-200">
        
        {/* Row 1: Delivery Location & Cashback Chip */}
        <div className="px-3.5 pt-2.5 pb-1 flex items-center justify-between gap-2">
          {/* Location Delivery Selector */}
          <button
            onClick={() => setLocationModalOpen(true)}
            className="flex items-center gap-1 text-xs font-bold text-slate-800 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-[#B71C1C] shrink-0" />
            <span className="text-slate-600 font-medium">Deliver to</span>
            <span className="font-extrabold text-slate-900 truncate max-w-[140px]">
              {locationPincode ? `${locationCity} ${locationPincode}` : 'Select Location'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </button>

          {/* Cashback / Offer Chip */}
          <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-emerald-800 shadow-2xs shrink-0">
            <span>upto ₹100</span>
            <span className="text-xs">💸</span>
          </div>
        </div>

        {/* Row 2: Brand Logo & Right Action Icons (Wishlist, Bell, Account) */}
        <div className="px-3.5 py-1.5 flex items-center justify-between gap-2">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5">
            {customLogo ? (
              <img src={customLogo} alt="Karviyam" className="h-7 w-auto object-contain max-w-[120px]" />
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#D32F2F] to-[#B71C1C] text-white flex items-center justify-center shadow-2xs">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6zm-4 9.5c0-2 4-3.1 4-3.1s4 1.1 4 3.1V16H8v-0.5z"/>
                  </svg>
                </div>
                <span className="font-display font-black text-lg tracking-tight text-[#B71C1C] leading-none">
                  KARVIYAM
                </span>
              </div>
            )}
          </Link>

          {/* Action Icon: Notification Only */}
          <div className="flex items-center text-slate-700 relative">
            {/* Notification */}
            <div 
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-1 hover:text-[#B71C1C] cursor-pointer" 
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-700" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#B71C1C] text-white text-[8px] font-black rounded-full h-3.5 min-w-[14px] px-1 flex items-center justify-center animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </div>

            {/* Mobile Notifications Dropdown Modal */}
            {notifOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-28px)] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 text-left"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-extrabold text-sm text-slate-900">Notifications</h4>
                    {unreadNotifCount > 0 && (
                      <span className="bg-[#B71C1C] text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                        {unreadNotifCount} NEW
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button 
                      onClick={markAllNotifsRead}
                      className="text-[11px] font-bold text-[#B71C1C] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                    🔔 No new notifications right now.
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotifRead(n.id, n.link)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          n.read ? 'bg-slate-50/60 border-slate-100 opacity-75' : 'bg-rose-50/40 border-rose-100 shadow-2xs'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-red-100 text-[#B71C1C] flex items-center justify-center shrink-0 text-sm font-bold mt-0.5">
                          {n.type === 'order' ? '🛍️' : n.type === 'offer' ? '🎉' : '🎧'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-slate-900 truncate">{n.title}</h5>
                            <span className="text-[9.5px] text-slate-400 font-medium shrink-0 ml-2">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug mt-0.5">{n.description}</p>
                        </div>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#B71C1C] shrink-0 mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {notifications.length > 0 && (
                  <div className="border-t border-slate-100 pt-2.5 mt-2 flex items-center justify-between text-[11px]">
                    <button 
                      onClick={clearAllNotifs}
                      className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                    >
                      Clear all
                    </button>
                    <span className="text-slate-400 font-medium">Karviyam Support</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Rounded Pill Search Bar */}
        <div className="px-3.5 py-1.5 relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for T-Shirts, Sneakers, Kurtas..."
              className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 pl-9 pr-16 py-2.5 rounded-full border border-slate-200 focus:border-[#B71C1C] focus:bg-white text-xs outline-none shadow-2xs transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            
            <button
              type="button"
              onClick={() => setVoiceModalOpen(true)}
              className="absolute right-9 p-1 text-slate-400 hover:text-[#B71C1C]"
              title="Voice Search"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="absolute right-3 p-1 text-slate-400 hover:text-[#B71C1C]"
              title="Image Search"
            >
              <Camera className="w-4 h-4" />
            </button>
          </form>

          {/* Search suggestions dropdown */}
          {showSearchDrop && searchResults.length > 0 && (
            <div className="absolute left-3.5 right-3.5 top-full mt-1 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setShowSearchDrop(false);
                    setSearchQuery('');
                    navigate(`/product/${item.id}`);
                  }}
                  className="flex items-center gap-2.5 p-2.5 hover:bg-red-50/50 cursor-pointer border-b border-slate-100 last:border-0"
                >
                  <img src={item.imageUrl} alt={item.name} className="w-8 h-8 object-cover rounded-md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-[#B71C1C] font-black">₹{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ========================================================= */}
      {/* DESKTOP HEADER (>= 1024px / lg) - 100% UNTOUCHED ORIGINAL   */}
      {/* ========================================================= */}
      <div className="hidden lg:block">
        
        {/* Top Banner Announcement */}
        <div className="bg-[#B71C1C] text-white text-xs py-1.5 px-4 text-center font-bold tracking-wide flex justify-center items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>FESTIVE SALE IS LIVE! UP TO 60% OFF ON HIGH-STREET WEAR & FINE JEWELLERY.</span>
          <button
            onClick={() => navigate('/shop')}
            className="bg-white text-[#B71C1C] px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider hover:bg-amber-100 transition-colors ml-2 cursor-pointer shadow-2xs"
          >
            SHOP NOW
          </button>
        </div>

        {/* Main Navbar Row */}
        <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="max-w-[1560px] w-full mx-auto flex items-center justify-between gap-6">
            
            {/* Logo & Deliver to Location */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 group">
                {customLogo ? (
                  <img src={customLogo} alt="Karviyam" className="h-9 w-auto object-contain max-w-[180px]" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-[#B71C1C] text-white font-black text-xl flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6zm-4 9.5c0-2 4-3.1 4-3.1s4 1.1 4 3.1V16H8v-0.5z"/>
                      </svg>
                    </div>
                    <span className="font-display font-black text-2xl tracking-tight text-[#B71C1C] leading-none">
                      KARVIYAM
                    </span>
                  </div>
                )}
              </Link>

              {/* Deliver to Location Button */}
              <button
                onClick={() => setLocationModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-red-50/60 border border-slate-200 text-left cursor-pointer transition-colors"
              >
                <MapPin className="w-4 h-4 text-[#B71C1C]" />
                <div className="text-xs">
                  <span className="text-[10px] text-slate-400 font-semibold block leading-none">Deliver to</span>
                  <div className="flex items-center gap-1 font-bold text-slate-800 text-xs">
                    <span>{locationPincode ? `${locationCity} ${locationPincode}` : 'Select Location'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </div>
                </div>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-xl">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for T-Shirts, Sneakers, Kurtas..."
                  className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 pl-4 pr-24 py-2.5 rounded-xl border border-slate-200 focus:border-[#B71C1C] focus:bg-white text-xs outline-none transition-all"
                />
                
                {/* Voice Search Icon */}
                <button
                  type="button"
                  onClick={() => setVoiceModalOpen(true)}
                  className="absolute right-14 p-1.5 text-slate-400 hover:text-[#B71C1C] transition-colors"
                  title="Voice Search"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Camera / Image Search Icon */}
                <button
                  type="button"
                  onClick={() => navigate('/shop')}
                  className="absolute right-8 p-1.5 text-slate-400 hover:text-[#B71C1C] transition-colors"
                  title="Image Search"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Red Search Submit Button */}
                <button
                  type="submit"
                  className="absolute right-1 w-7 h-7 bg-[#B71C1C] hover:bg-[#900C0C] text-white rounded-lg flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Suggestions Dropdown */}
              {showSearchDrop && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setShowSearchDrop(false);
                        setSearchQuery('');
                        navigate(`/product/${item.id}`);
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-red-50/50 cursor-pointer border-b border-slate-100 last:border-0"
                    >
                      <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-[#B71C1C] font-extrabold">₹{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Header Action Icons */}
            <div className="flex items-center gap-6">
              
              {/* 1. Bag */}
              <Link to="/cart" className="flex flex-col items-center group relative cursor-pointer">
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 text-slate-700 group-hover:text-[#B71C1C] transition-colors" />
                  <span className="absolute -top-1.5 -right-2 bg-[#B71C1C] text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                    {itemCount || 2}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-[#B71C1C] mt-0.5">
                  Bag
                </span>
              </Link>

              {/* 2. Wishlist */}
              <Link to="/wishlist" className="flex flex-col items-center group relative cursor-pointer">
                <div className="relative">
                  <Heart className="w-5 h-5 text-slate-700 group-hover:text-[#B71C1C] transition-colors" />
                  {(wishlistCount || wishlist.length) > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#B71C1C] text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                      {wishlistCount || wishlist.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-[#B71C1C] mt-0.5">
                  Wishlist
                </span>
              </Link>

              {/* 3. Notifications */}
              <div className="relative">
                <div 
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="flex flex-col items-center group cursor-pointer"
                  title="Notifications"
                >
                  <div className="relative">
                    <Bell className="w-5 h-5 text-slate-700 group-hover:text-[#B71C1C] transition-colors" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-[#B71C1C] text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                        {unreadNotifCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-[#B71C1C] mt-0.5">
                    Notifications
                  </span>
                </div>

                {/* Notifications Popover Dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in-80 zoom-in-95 duration-150 text-left">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#B71C1C]" />
                        <h4 className="font-extrabold text-sm text-slate-900">Notifications</h4>
                        {unreadNotifCount > 0 && (
                          <span className="bg-red-100 text-[#B71C1C] text-[10px] font-black px-2 py-0.5 rounded-full">
                            {unreadNotifCount} New
                          </span>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <button 
                          onClick={markAllNotifsRead}
                          className="text-[11px] font-bold text-[#B71C1C] hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                        🔔 No new notifications right now.
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markNotifRead(n.id, n.link)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                              n.read ? 'bg-slate-50/60 border-slate-100 opacity-75' : 'bg-rose-50/40 border-rose-100 shadow-2xs'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-red-100 text-[#B71C1C] flex items-center justify-center shrink-0 text-sm font-bold mt-0.5">
                              {n.type === 'order' ? '🛍️' : n.type === 'offer' ? '🎉' : '🎧'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-bold text-slate-900 truncate">{n.title}</h5>
                                <span className="text-[9.5px] text-slate-400 font-medium shrink-0 ml-2">{n.time}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-snug mt-0.5">{n.description}</p>
                            </div>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-[#B71C1C] shrink-0 mt-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {notifications.length > 0 && (
                      <div className="border-t border-slate-100 pt-2.5 mt-2 flex items-center justify-between text-[11px]">
                        <button 
                          onClick={clearAllNotifs}
                          className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                        >
                          Clear all
                        </button>
                        <span className="text-slate-400 font-medium">Karviyam Support</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Account */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <User className="w-5 h-5 text-slate-700 group-hover:text-[#B71C1C] transition-colors" />
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-[#B71C1C] mt-0.5 max-w-[70px] truncate">
                      {user.fullName ? user.fullName.split(' ')[0] : 'Account'}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div 
                      className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                      </div>

                      <Link to="/profile" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-[#B71C1C]">
                        My Dashboard & Orders
                      </Link>
                      <Link to="/wishlist" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-[#B71C1C]">
                        My Wishlist
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#B71C1C] hover:bg-red-50 border-t border-slate-100">
                          <Shield className="w-4 h-4" /> Admin Control
                        </Link>
                      )}
                      <button onClick={() => { setUserDropdownOpen(false); logout(); }} className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border-t border-slate-100 mt-1">
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="flex flex-col items-center group cursor-pointer">
                  <User className="w-5 h-5 text-slate-700 group-hover:text-[#B71C1C] transition-colors" />
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-[#B71C1C] mt-0.5">
                    Account
                  </span>
                </Link>
              )}

            </div>

          </div>
        </div>

        {/* Sub-Header Categories Menu Row */}
        {navEnabled && (
          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-1.5">
            <div className="max-w-[1560px] w-full mx-auto flex items-center justify-between gap-6 text-xs font-bold text-slate-800">
              
              {/* All Categories Dropdown Trigger */}
              <div
                className="relative"
                onMouseEnter={() => setMegaMenuOpen(true)}
                onMouseLeave={() => setMegaMenuOpen(false)}
              >
                <button className="flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-[#B71C1C] cursor-pointer py-1">
                  <Grid className="w-4 h-4 text-slate-700" />
                  <span>ALL CATEGORIES</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {megaMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-[880px] max-w-[90vw] bg-white border border-slate-200 shadow-2xl z-50 p-6 rounded-2xl">
                    <MegaMenu onClose={() => setMegaMenuOpen(false)} />
                  </div>
                )}
              </div>

              {/* Category Nav Links - Dynamic Red Underline Active State */}
              <div className="flex items-center gap-4 xl:gap-5 overflow-x-auto no-scrollbar py-1 ml-auto">
                <Link
                  to="/shop"
                  className={isCategoryActive('ALL') ? "text-[#B71C1C] font-extrabold border-b-2 border-[#B71C1C] pb-1 uppercase whitespace-nowrap" : "hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase pb-1 text-slate-700 font-bold"}
                >
                  ALL
                </Link>

                <Link
                  to="/shop?category=Men"
                  className={isCategoryActive('Men') ? "text-[#B71C1C] font-extrabold border-b-2 border-[#B71C1C] pb-1 uppercase whitespace-nowrap" : "hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase pb-1 text-slate-700 font-bold"}
                >
                  MEN
                </Link>
                
                <Link
                  to="/shop?category=Women"
                  className={isCategoryActive('Women') ? "text-[#B71C1C] font-extrabold border-b-2 border-[#B71C1C] pb-1 uppercase whitespace-nowrap" : "hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase pb-1 text-slate-700 font-bold"}
                >
                  WOMEN
                </Link>

                <Link
                  to="/shop?category=Kids"
                  className={isCategoryActive('Kids') ? "text-[#B71C1C] font-extrabold border-b-2 border-[#B71C1C] pb-1 uppercase whitespace-nowrap" : "hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase pb-1 text-slate-700 font-bold"}
                >
                  KIDS
                </Link>

                <Link
                  to="/shop?category=Unisex"
                  className={isCategoryActive('Unisex') ? "text-[#B71C1C] font-extrabold border-b-2 border-[#B71C1C] pb-1 uppercase whitespace-nowrap" : "hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase pb-1 text-slate-700 font-bold"}
                >
                  UNISEX
                </Link>

                <Link
                  to="/shop?category=Jewellery"
                  className={isCategoryActive('Jewellery') ? "text-[#B71C1C] font-extrabold border-b-2 border-[#B71C1C] pb-1 uppercase whitespace-nowrap" : "hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase pb-1 text-slate-700 font-bold"}
                >
                  JEWELS
                </Link>

                <Link
                  to="/shop?category=Kitchen"
                  className={isCategoryActive('Kitchen') ? "text-[#B71C1C] font-extrabold border-b-2 border-[#B71C1C] pb-1 uppercase whitespace-nowrap" : "hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase pb-1 text-slate-700 font-bold"}
                >
                  KITCHEN & HOME
                </Link>

                <Link
                  to="/shop?category=School"
                  className={isCategoryActive('School') ? "text-[#B71C1C] font-extrabold border-b-2 border-[#B71C1C] pb-1 uppercase whitespace-nowrap" : "hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase pb-1 text-slate-700 font-bold"}
                >
                  SCHOOL & OFFICE
                </Link>

                <Link
                  to="/contact"
                  className={isCategoryActive('', '/contact') ? "text-[#B71C1C] font-extrabold border-b-2 border-[#B71C1C] pb-1 uppercase whitespace-nowrap" : "hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase pb-1 text-slate-700 font-bold"}
                >
                  CONTACT US
                </Link>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Delivery Location Modal */}
      <DeliveryLocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        currentPincode={locationPincode}
        onSelectLocation={(pin, city) => {
          setLocationPincode(pin);
          setLocationCity(city);
        }}
      />

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
      />
    </header>
  );
}
