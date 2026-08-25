import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, ShoppingBag, Truck } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const isLiked = isInWishlist(product?.id);

  if (!product) return null;

  const price = product.price || 899;
  const oldPrice = product.oldPrice || Math.round(price * 1.35);
  const discountPercent = oldPrice > price
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 25;

  const rating = product.rating || 4.5;
  const reviewsCount = product.reviewsCount || (product.id ? (product.id * 17) % 300 + 42 : 128);

  // Badge Logic
  const getBadge = () => {
    if (product.isBestSeller) return { label: 'Best Seller', bg: 'bg-amber-500 text-white' };
    if (product.isTrending) return { label: 'Trending', bg: 'bg-indigo-600 text-white' };
    if (product.isNewArrival) return { label: 'New Arrival', bg: 'bg-slate-900 text-white' };
    if (product.isFeatured) return { label: 'Featured', bg: 'bg-emerald-700 text-white' };
    if (discountPercent >= 20) return { label: `${discountPercent}% OFF`, bg: 'bg-[#B71C1C] text-white' };
    return null;
  };

  const badge = getBadge();

  // Color Swatches Logic (up to 6 swatches, then +N counter)
  const availableColors = product.colors || [
    '#B71C1C', '#0f172a', '#f1f5f9', '#1e3a8a', '#3f6212', '#be123c', '#d97706', '#475569'
  ];
  const maxColors = 6;
  const visibleColors = availableColors.slice(0, maxColors);
  const extraColorsCount = availableColors.length > maxColors ? availableColors.length - maxColors : 0;

  return (
    <>
      {/* ========================================================= */}
      {/* DESKTOP PRODUCT CARD (>= 768px) - 100% UNTOUCHED ORIGINAL */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* DESKTOP PRODUCT CARD (>= 768px) - BLUEPRINT EXACT MATCH   */}
      {/* ========================================================= */}
      <div className="desktop-only hidden md:flex group relative bg-white w-full h-[320px] max-h-[320px] rounded-[16px] border border-[#E5E7EB] shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex-col justify-between overflow-hidden">
        
        {/* 1. Image Container - Fixed 200px Height */}
        <div 
          className="relative w-full h-[200px] max-h-[200px] bg-slate-50 flex items-center justify-center p-2 cursor-pointer shrink-0 overflow-hidden"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Product Badges (Top-Left) */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {badge && (
              <span className={`text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs ${badge.bg}`}>
                {badge.label}
              </span>
            )}
          </div>

          {/* Wishlist Button (Top-Right: 20px Icon) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer ${
              isLiked
                ? 'bg-[#D32F2F] text-white border-[#D32F2F]'
                : 'bg-white/90 text-slate-700 hover:text-[#D32F2F] hover:bg-red-50 border border-slate-200'
            }`}
            title={isLiked ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-[20px] h-[20px] ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* 2. Details Content Box (Fixed Height 120px) */}
        <div className="p-2.5 flex-1 flex flex-col justify-between overflow-hidden">
          
          <div className="space-y-0.5">
            
            {/* Brand Name & Rating */}
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-extrabold uppercase tracking-wider text-[#D32F2F] truncate max-w-[90px]">
                {product.brand || 'KARVIYAM'}
              </span>
              
              <div className="flex items-center gap-0.5 text-slate-800 font-bold shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-[12px] font-bold">{rating}</span>
                <span className="text-[9px] text-slate-400 font-medium">({reviewsCount})</span>
              </div>
            </div>

            {/* Product Name - 14px Font, 1 Line Ellipsis */}
            <h3 
              onClick={() => navigate(`/product/${product.id}`)}
              className="font-display font-extrabold text-slate-900 text-[14px] leading-tight hover:text-[#D32F2F] transition-colors cursor-pointer truncate"
              title={product.name}
            >
              {product.name}
            </h3>

            {/* Price Section: 18px Bold Price, 13px Discount */}
            <div className="flex items-baseline gap-1.5 pt-0.5">
              <span className="font-display font-black text-slate-900 text-[18px]">
                ₹{price}
              </span>
              {oldPrice > price && (
                <>
                  <span className="text-[11px] text-slate-400 line-through font-medium">
                    ₹{oldPrice}
                  </span>
                  <span className="text-[13px] text-emerald-700 font-extrabold">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={() => addToCart(product.id, 1)}
            className="w-full bg-[#D32F2F] hover:bg-[#900C0C] active:bg-[#780E0E] text-white font-extrabold text-[10px] uppercase tracking-wider py-1.5 rounded-lg shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer mt-1"
          >
            <ShoppingBag className="w-3 h-3" />
            <span>Add to Bag</span>
          </button>

        </div>

      </div>

      {/* ========================================================= */}
      {/* MOBILE PRODUCT CARD (< 768px) - 2-COLUMN OPTIMIZED CARD   */}
      {/* ========================================================= */}
      <div className="mobile-only flex md:hidden group relative bg-white w-full h-[320px] min-h-[320px] max-h-[320px] rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex-col justify-between overflow-hidden p-2">
        
        {/* 1. Image Box (Fixed 180px height) */}
        <div
          className="relative w-full h-[180px] max-h-[180px] bg-slate-50/70 rounded-xl flex items-center justify-center p-1 cursor-pointer shrink-0 overflow-hidden"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400'}
            alt={product.name}
            className="w-full h-full object-contain group-active:scale-105 transition-transform"
            loading="lazy"
          />

          {/* Badges (Top-Left) */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10">
            {badge && (
              <span className={`text-[8px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded shadow-2xs ${badge.bg}`}>
                {badge.label}
              </span>
            )}
          </div>

          {/* Wishlist Heart Overlay (Top-Right) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`absolute top-1.5 right-1.5 p-1.5 rounded-full backdrop-blur-md transition-all shadow-2xs cursor-pointer ${
              isLiked
                ? 'bg-[#B71C1C] text-white'
                : 'bg-white/95 text-slate-700 border border-slate-200'
            }`}
            title={isLiked ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* 2. Details Content */}
        <div className="flex-1 flex flex-col justify-between pt-1.5 px-0.5 overflow-hidden">
          <div>
            {/* Brand Logo & Tag */}
            <div className="flex items-center gap-1 text-[10px] font-black text-[#B71C1C] uppercase tracking-wide">
              <span>🪷</span>
              <span className="truncate max-w-[100px]">{product.brand || 'KARVIYAM'}</span>
            </div>

            {/* Product Title */}
            <h3
              onClick={() => navigate(`/product/${product.id}`)}
              className="text-slate-900 font-bold text-xs leading-snug line-clamp-1 truncate cursor-pointer mt-0.5"
              title={product.name}
            >
              {product.name}
            </h3>

            {/* Rating Row */}
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-800 pt-0.5">
              <span className="font-black text-slate-900">{rating}</span>
              <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
              <span className="text-slate-400 font-medium">({reviewsCount > 1000 ? `${(reviewsCount/1000).toFixed(1)}k` : reviewsCount})</span>
            </div>

            {/* Price & Quick Add Button Row */}
            <div className="flex items-center justify-between pt-1 leading-none">
              <div className="flex items-baseline gap-1">
                <span className="font-display font-black text-slate-900 text-sm">
                  ₹{price}
                </span>
                {oldPrice > price && (
                  <span className="text-[10px] text-slate-400 line-through font-medium">
                    ₹{oldPrice}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-[9px] text-emerald-700 font-black uppercase tracking-tight ml-0.5">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Quick Add Shopping Bag Icon */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product.id, 1);
                }}
                className="w-7 h-7 rounded-xl border border-red-200 bg-red-50 text-[#B71C1C] hover:bg-[#B71C1C] hover:text-white flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-2xs"
                title="Add to Bag"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
