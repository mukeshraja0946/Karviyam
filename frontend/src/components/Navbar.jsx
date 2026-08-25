import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

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
  const [locationPincode, setLocationPincode] = useState('600001');
  const [locationCity, setLocationCity] = useState('Chennai');

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
      {/* MOBILE HEADER (< 768px) - COMPACT MOBILE APP HEADER        */}
      {/* ========================================================= */}
      <div className="block md:hidden bg-white border-b border-slate-200">
        {/* Mobile Header Top Section: Delivery / Location & Reward Badge */}
        <div className="bg-slate-50 px-3 py-1.5 flex items-center justify-between border-b border-slate-100 text-xs font-bold">
          <button
            onClick={() => setLocationModalOpen(true)}
            className="flex items-center gap-1 text-slate-800 hover:text-[#B71C1C] transition-colors cursor-pointer text-[11px] truncate max-w-[210px]"
          >
            <MapPin className="w-3.5 h-3.5 text-[#B71C1C] shrink-0" />
            <span className="truncate">Deliver to <strong className="text-slate-900">{locationCity}</strong> ({locationPincode})</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide shrink-0 shadow-2xs">
            <Sparkles className="w-2.5 h-2.5 fill-white animate-pulse" />
            <span>10% OFF REWARD</span>
          </div>
        </div>

        {/* Mobile Header Second Row: Logo, Action Icons & Large Rounded Search Bar */}
        <div className="px-3 py-2 bg-white space-y-2">
          <div className="flex items-center justify-between gap-2">
            
            {/* Hamburger Menu & Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1 text-slate-700 hover:text-[#B71C1C] cursor-pointer shrink-0"
                title="Menu Drawer"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link to="/" className="flex items-center gap-1 shrink-0">
                {customLogo ? (
                  <img src={customLogo} alt="Karviyam" className="h-7 w-auto object-contain max-w-[100px]" />
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#D32F2F] to-[#B71C1C] text-white font-black text-base flex items-center justify-center shadow-xs">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6zm-4 9.5c0-2 4-3.1 4-3.1s4 1.1 4 3.1V16H8v-0.5z"/>
                      </svg>
                    </div>
                    <span className="font-display font-black text-base tracking-tight text-[#B71C1C] leading-none">
                      KARVIYAM
                    </span>
                  </div>
                )}
              </Link>
            </div>

            {/* Right Icons: Notification Bell, Wishlist, User Profile */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Notification Bell */}
              <button
                type="button"
                onClick={() => toast.success('Festive offer: Extra 10% off automatically applied!')}
                className="relative p-1.5 text-slate-700 hover:text-[#B71C1C] cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#B71C1C] rounded-full animate-ping" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#B71C1C] rounded-full" />
              </button>

              {/* Wishlist */}
              <Link to="/wishlist" className="relative p-1.5 text-slate-700 hover:text-[#B71C1C]" title="Wishlist">
                <Heart className="w-5 h-5" />
                {(wishlistCount || wishlist.length) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#B71C1C] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {wishlistCount || wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart Bag */}
              <Link to="/cart" className="relative p-1.5 text-slate-700 hover:text-[#B71C1C]" title="Cart">
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#B71C1C] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Account / Profile */}
              <Link to={user ? "/profile" : "/login"} className="p-1.5 text-slate-700 hover:text-[#B71C1C]" title="Account">
                <User className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Large Rounded Search Bar with Microphone & Camera Search Icons */}
          <div className="relative pt-0.5">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Tees, Jewellery, Ethnic Wear..."
                className="w-full bg-slate-100 text-slate-900 placeholder-slate-400 pl-9 pr-20 py-2 rounded-full border border-slate-200 focus:border-[#B71C1C] focus:bg-white text-xs outline-none shadow-2xs transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />

              <div className="absolute right-2 flex items-center gap-1.5">
                {/* Voice Search Icon */}
                <button
                  type="button"
                  onClick={() => setVoiceModalOpen(true)}
                  className="p-1 text-slate-400 hover:text-[#B71C1C] cursor-pointer"
                  title="Voice Search"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Camera / Image Search Icon */}
                <button
                  type="button"
                  onClick={() => toast('Image search ready! Upload photo to search.', { icon: '📷' })}
                  className="p-1 text-slate-400 hover:text-[#B71C1C] cursor-pointer"
                  title="Search by Image"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  className="p-1.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white rounded-full shadow-2xs cursor-pointer"
                  title="Search"
                >
                  <Search className="w-3 h-3" />
                </button>
              </div>
            </form>

            {/* Search suggestions dropdown */}
            {showSearchDrop && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
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

        {/* Mobile Slide-Over Menu Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-xs">
            <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl p-5 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-display font-black text-lg text-[#B71C1C]">KARVIYAM MENU</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-500 hover:text-slate-900">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1 font-bold text-slate-800 text-sm">
                  <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block p-2 hover:bg-red-50 hover:text-[#B71C1C] rounded-lg">Home</Link>
                  <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="block p-2 hover:bg-red-50 hover:text-[#B71C1C] rounded-lg">All Shop Products</Link>
                  {navEnabled && navCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/shop?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block p-2 hover:bg-red-50 hover:text-[#B71C1C] rounded-lg uppercase"
                    >
                      {cat.name}
                    </Link>
                  ))}
                  <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="block p-2 hover:bg-red-50 hover:text-[#B71C1C] rounded-lg">Contact Us</Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block p-2 text-[#B71C1C] hover:bg-red-50 rounded-lg">Admin Dashboard</Link>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                <button
                  onClick={() => { setMobileMenuOpen(false); setLocationModalOpen(true); }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                >
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#B71C1C]" /> Deliver to {locationCity}</span>
                  <span className="text-[#B71C1C] text-[10px] uppercase">Change</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* DESKTOP HEADER (>= 768px) - 100% UNTOUCHED ORIGINAL         */}
      {/* ========================================================= */}
      <div className="hidden md:block">
        {/* Top Banner Announcement */}
        <div className="bg-gradient-to-r from-[#D32F2F] via-[#B71C1C] to-[#8E0000] text-white text-xs py-2 px-4 text-center font-bold tracking-wide flex justify-center items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>FESTIVE SALE IS LIVE! UP TO 60% OFF ON HIGH-STREET WEAR & FINE JEWELLERY.</span>
          <button
            onClick={() => navigate('/shop')}
            className="font-black underline cursor-pointer ml-1 hover:text-amber-200 transition-colors uppercase"
          >
            SHOP NOW
          </button>
        </div>

        {/* Main Navbar Bar */}
        <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 lg:px-12 py-3">
          <div className="w-full flex items-center justify-between gap-4">
            
            {/* Logo & Mobile Menu & Delivery Location Trigger */}
            <div className="flex items-center gap-4 sm:gap-6">
              <button 
                className="lg:hidden p-2 text-slate-700 hover:text-[#B71C1C] cursor-pointer"
                onClick={() => {
                  if (window.location.pathname === '/shop') {
                    window.dispatchEvent(new Event('karviyam_open_filter_drawer'));
                  } else {
                    navigate('/shop?openFilter=true');
                  }
                }}
                title="Filter Catalogue"
              >
                <Menu className="w-6 h-6 text-slate-800" />
              </button>
              
              <Link to="/" className="flex items-center gap-2.5 group">
                {/* Dynamic Custom Logo / Default Shield Logo */}
                {customLogo ? (
                  <img src={customLogo} alt="Karviyam" className="h-10 w-auto object-contain max-w-[200px]" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D32F2F] to-[#B71C1C] text-white font-black text-2xl flex items-center justify-center shadow-md shadow-[#B71C1C]/25 group-hover:scale-105 transition-transform">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6zm-4 9.5c0-2 4-3.1 4-3.1s4 1.1 4 3.1V16H8v-0.5z"/>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-display font-black text-2xl tracking-tight text-[#B71C1C] leading-none">
                        KARVIYAM
                      </span>
                      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">
                        Quality you can trust
                      </span>
                    </div>
                  </div>
                )}
              </Link>

              {/* Delivery Location Trigger Button (Next to Logo) */}
              <button
                onClick={() => setLocationModalOpen(true)}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-red-50/60 border border-slate-200 hover:border-red-200 transition-colors text-left cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#B71C1C]" />
                <div className="text-xs">
                  <span className="text-[10px] text-slate-400 font-medium block leading-none">Deliver to</span>
                  <span className="font-bold text-slate-800 leading-tight block">{locationCity} {locationPincode}</span>
                </div>
              </button>
            </div>

            {/* Large Search Bar with Live Suggestions & Voice Search */}
            <div className="relative flex-1 max-w-2xl hidden md:block">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for Oversized Tees, Sneakers, 925 Silver Jewellery..."
                  className="w-full bg-slate-100 text-slate-900 placeholder-slate-400 pl-4 pr-20 py-2.5 rounded-full border border-slate-200 focus:border-[#B71C1C] focus:bg-white text-xs outline-none transition-all shadow-xs"
                />
                
                {/* Voice Search Button Icon */}
                <button
                  type="button"
                  onClick={() => setVoiceModalOpen(true)}
                  className="absolute right-10 p-1.5 text-slate-400 hover:text-[#B71C1C] transition-colors"
                  title="Voice Search"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Submit Search Button */}
                <button
                  type="submit"
                  className="absolute right-1.5 p-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white rounded-full font-bold transition-colors shadow-xs"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>

              {/* Dropdown search suggestions */}
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

            {/* Right Action Icons */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Wishlist Icon */}
              <Link
                to="/wishlist"
                className="relative p-2.5 text-slate-700 hover:text-[#B71C1C] rounded-full hover:bg-red-50 transition-colors"
                title="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {(wishlistCount || wishlist.length) > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#B71C1C] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                    {wishlistCount || wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <Link
                to="/cart"
                className="relative p-2.5 text-slate-700 hover:text-[#B71C1C] rounded-full hover:bg-red-50 transition-colors"
                title="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-[#B71C1C] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs animate-bounce">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* User Account / Login */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#B71C1C] text-white font-bold text-xs flex items-center justify-center">
                      {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-bold max-w-[90px] truncate hidden sm:inline text-slate-800">
                      {user.fullName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
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

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-[#B71C1C]"
                      >
                        My Dashboard & Orders
                      </Link>

                      <Link
                        to="/wishlist"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-[#B71C1C]"
                      >
                        My Wishlist
                      </Link>

                      <Link
                        to="/settings?tab=addresses"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-[#B71C1C]"
                      >
                        My Addresses
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-[#B71C1C]"
                      >
                        My Settings
                      </Link>

                      <Link
                        to="/settings?tab=security"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-[#B71C1C]"
                      >
                        Change Password
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#B71C1C] hover:bg-red-50 border-t border-slate-100"
                        >
                          <Shield className="w-4 h-4" /> Admin Control
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border-t border-slate-100 mt-1"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Category Links Navigation Bar with Hoverable Wide MegaMenu */}
        {navEnabled && (
          <div className="hidden lg:block bg-slate-50 border-b border-slate-200 px-2 sm:px-4 lg:px-6 py-2 relative">
            <div className="w-full flex items-center justify-between text-xs font-bold text-slate-700">
              
              <div className="flex items-center gap-3 shrink-0">
                {/* Hover / Click Mega Menu Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setMegaMenuOpen(true)}
                  onMouseLeave={() => setMegaMenuOpen(false)}
                >
                  <button className="flex items-center gap-2 text-xs font-bold text-[#B71C1C] py-1.5 px-3.5 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                    <Grid className="w-4 h-4" />
                    <span>ALL CATEGORIES</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {megaMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-[880px] max-w-[90vw] bg-white border border-[#E5E7EB] shadow-2xl z-50 p-6 rounded-2xl">
                      <MegaMenu onClose={() => setMegaMenuOpen(false)} />
                    </div>
                  )}
                </div>

                {/* Left Side Filter Button right after ALL CATEGORIES */}
                <button
                  onClick={() => {
                    if (window.location.pathname === '/shop') {
                      window.dispatchEvent(new Event('karviyam_open_filter_drawer'));
                    } else {
                      navigate('/shop?openFilter=true');
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 py-1.5 px-3.5 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="Open Product Catalogue Filter Drawer"
                >
                  <Menu className="w-4 h-4 text-[#B71C1C]" />
                  <span>FILTER</span>
                </button>
              </div>

              <div className="flex items-center gap-5 overflow-x-auto py-1 no-scrollbar">
                {navCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/shop?category=${encodeURIComponent(cat.name)}`}
                    className="hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase"
                  >
                    {cat.name}
                  </Link>
                ))}
                <Link to="/contact" className="hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase">
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
