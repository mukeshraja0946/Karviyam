import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
        {/* Mobile Announcement Bar */}
        <div className="bg-gradient-to-r from-[#D32F2F] via-[#B71C1C] to-[#8E0000] text-white text-[10px] py-1 px-3 text-center font-bold tracking-wide flex justify-center items-center gap-1">
          <Sparkles className="w-3 h-3 animate-pulse shrink-0" />
          <span className="truncate">FESTIVE SALE LIVE! UP TO 60% OFF</span>
        </div>

        {/* Mobile Header Top Row: Hamburger, Logo, Location, Icons */}
        <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-slate-100">
          
          {/* Hamburger Menu Icon */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-slate-700 hover:text-[#B71C1C] cursor-pointer shrink-0"
            title="Menu Drawer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 shrink-0">
            {customLogo ? (
              <img src={customLogo} alt="Karviyam" className="h-7 w-auto object-contain max-w-[110px]" />
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

          {/* Location Delivery Chip */}
          <button
            onClick={() => setLocationModalOpen(true)}
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] text-slate-800 font-bold shrink truncate max-w-[120px]"
          >
            <MapPin className="w-3 h-3 text-[#B71C1C] shrink-0" />
            <span className="truncate">{locationCity}</span>
          </button>

          {/* Right Icons: Wishlist, Cart, User */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Wishlist */}
            <Link to="/wishlist" className="relative p-1.5 text-slate-700 hover:text-[#B71C1C]" title="Wishlist">
              <Heart className="w-5 h-5" />
              {(wishlistCount || wishlist.length) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#B71C1C] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {wishlistCount || wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative p-1.5 text-slate-700 hover:text-[#B71C1C]" title="Cart">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#B71C1C] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User */}
            <Link to={user ? "/profile" : "/login"} className="p-1.5 text-slate-700 hover:text-[#B71C1C]" title="Account">
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Mobile Full-Width Search Input */}
        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Oversized Tees, Silver Jewellery, Sarees..."
              className="w-full bg-white text-slate-900 placeholder-slate-400 pl-8 pr-16 py-1.5 rounded-xl border border-slate-200 focus:border-[#B71C1C] text-xs outline-none shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            
            <button
              type="button"
              onClick={() => setVoiceModalOpen(true)}
              className="absolute right-9 p-1 text-slate-400 hover:text-[#B71C1C]"
              title="Voice Search"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>

            <button
              type="submit"
              className="absolute right-1 px-2 py-0.5 bg-[#B71C1C] text-white text-[10px] font-bold rounded-lg"
            >
              Search
            </button>
          </form>

          {/* Search suggestions dropdown */}
          {showSearchDrop && searchResults.length > 0 && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
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
                    <span>{locationCity} {locationPincode}</span>
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
              
              {/* Wishlist */}
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

              {/* Notifications */}
              <div className="flex flex-col items-center group relative cursor-pointer">
                <div className="relative">
                  <Bell className="w-5 h-5 text-slate-700 group-hover:text-[#B71C1C] transition-colors" />
                  <span className="absolute -top-1.5 -right-2 bg-[#B71C1C] text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                    3
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-[#B71C1C] mt-0.5">
                  Notifications
                </span>
              </div>

              {/* Account */}
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

              {/* Bag */}
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

            </div>

          </div>
        </div>

        {/* Sub-Header Categories Menu Row */}
        {navEnabled && (
          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-1.5">
            <div className="max-w-[1560px] w-full mx-auto flex items-center gap-8 text-xs font-bold text-slate-800">
              
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

              {/* Category Nav Links */}
              <div className="flex items-center gap-7 overflow-x-auto no-scrollbar py-1">
                {/* Active Tab ALL */}
                <Link
                  to="/shop"
                  className="text-[#B71C1C] font-extrabold border-b-2 border-[#B71C1C] pb-1 uppercase whitespace-nowrap"
                >
                  ALL
                </Link>

                <Link to="/shop?category=Men" className="hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase">
                  MEN
                </Link>
                <Link to="/shop?category=Women" className="hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase">
                  WOMEN
                </Link>
                <Link to="/shop?category=Kids" className="hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase">
                  KIDS
                </Link>
                <Link to="/shop?category=Unisex" className="hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase">
                  UNISEX
                </Link>
                <Link to="/shop?category=Jewellery" className="hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase">
                  JEWELS
                </Link>
                <Link to="/shop?category=Kitchen" className="hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase">
                  KITCHEN & HOME
                </Link>
                <Link to="/shop?category=School" className="hover:text-[#B71C1C] transition-colors whitespace-nowrap uppercase">
                  SCHOOL & OFFICE
                </Link>
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
