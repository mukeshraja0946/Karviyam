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
      <div className="hidden md:flex group relative bg-white w-full h-[360px] max-h-[360px] rounded-[12px] border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex-col justify-between overflow-hidden">
        
        {/* 1. Image Container - Square Aspect Ratio */}
        <div 
          className="relative w-full h-[200px] max-h-[200px] aspect-square bg-slate-50 flex items-center justify-center p-2.5 cursor-pointer shrink-0 overflow-hidden"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Product Badges (Top-Left) */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {badge && (
              <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs ${badge.bg}`}>
                {badge.label}
              </span>
            )}
          </div>

          {/* Wishlist Button (Top-Right) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer ${
              isLiked
                ? 'bg-[#B71C1C] text-white border-[#B71C1C]'
                : 'bg-white/90 text-slate-700 hover:text-[#B71C1C] hover:bg-red-50 border border-slate-200'
            }`}
            title={isLiked ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* 2. Details Content Box - Tight Space Above Button */}
        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-1.5 overflow-hidden">
          
          <div className="space-y-1.5">
            
            {/* Brand Name & Rating */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-extrabold uppercase tracking-wider text-[#B71C1C] truncate max-w-[120px]">
                {product.brand || 'KARVIYAM'}
              </span>
              
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 text-slate-800 font-bold shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{rating}</span>
                <span className="text-[10px] text-slate-400 font-medium">({reviewsCount})</span>
              </div>
            </div>

            {/* Product Name - Strictly 2 Lines Ellipsis (34px Fixed Height) */}
            <h3 
              onClick={() => navigate(`/product/${product.id}`)}
              className="font-display font-extrabold text-slate-900 text-xs leading-snug hover:text-[#B71C1C] transition-colors cursor-pointer line-clamp-2 h-[34px] overflow-hidden"
              title={product.name}
            >
              {product.name}
            </h3>

            {/* Price Section */}
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="font-display font-black text-slate-900 text-base">
                ₹{price}
              </span>
              {oldPrice > price && (
                <>
                  <span className="text-xs text-slate-400 line-through font-medium">
                    ₹{oldPrice}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-extrabold">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Color Variants (Up to 6 swatches + Counter) */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {visibleColors.map((color, idx) => (
                <span
                  key={idx}
                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                  style={{ backgroundColor: color }}
                  title={`Color option ${idx + 1}`}
                />
              ))}
              {extraColorsCount > 0 && (
                <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200">
                  +{extraColorsCount}
                </span>
              )}
            </div>

            {/* Free Delivery Tag */}
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 pt-0.5">
              <Truck className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Free Delivery • Est. 2-4 Days</span>
            </div>

          </div>

          {/* 3. Full-Width Add to Cart Button (Compact Top Margin) */}
          <button
            type="button"
            onClick={() => addToCart(product.id, 1)}
            className="w-full bg-[#B71C1C] hover:bg-[#900C0C] active:bg-[#780E0E] text-white font-extrabold text-[11px] uppercase tracking-wider py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Bag</span>
          </button>

        </div>

      </div>

      {/* ========================================================= */}
      {/* MOBILE PRODUCT CARD (< 768px) - STRICT 3-COL EQUAL HEIGHT */}
      {/* ========================================================= */}
      <div className="flex md:hidden group relative bg-white w-full h-[240px] min-h-[240px] max-h-[240px] rounded-xl border border-slate-200/80 shadow-2xs flex-col justify-between overflow-hidden p-1.5">
        
        {/* 1. Image Box (Fixed 105px height) */}
        <div
          className="relative w-full h-[105px] max-h-[105px] bg-slate-50/80 rounded-lg flex items-center justify-center p-1 cursor-pointer shrink-0 overflow-hidden"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400'}
            alt={product.name}
            className="w-full h-full object-contain"
            loading="lazy"
          />

          {/* Discount Badge */}
          {discountPercent >= 15 && (
            <span className="absolute top-1 left-1 bg-[#B71C1C] text-white text-[8px] font-black uppercase tracking-tight px-1 py-0.5 rounded shadow-2xs z-10 leading-none">
              {discountPercent}% OFF
            </span>
          )}

          {/* Wishlist Heart Overlay */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`absolute top-1 right-1 p-1 rounded-full backdrop-blur-md transition-all shadow-xs cursor-pointer ${
              isLiked
                ? 'bg-[#B71C1C] text-white'
                : 'bg-white/95 text-slate-600 border border-slate-200'
            }`}
          >
            <Heart className={`w-2.5 h-2.5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* 2. Details Content (Strict line-clamping & fixed spacing) */}
        <div className="flex-1 flex flex-col justify-between pt-1 px-0.5 overflow-hidden">
          <div>
            {/* Rating / Brand Header */}
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold leading-none mb-0.5">
              <span className="uppercase text-[#B71C1C] tracking-tight truncate max-w-[55px]">
                {product.brand || 'KARVIYAM'}
              </span>
              <div className="flex items-center gap-0.5 text-slate-700 font-extrabold shrink-0">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>{rating}</span>
              </div>
            </div>

            {/* Product Name (Strict line-clamp-2 with 26px fixed height) */}
            <h3
              onClick={() => navigate(`/product/${product.id}`)}
              className="font-display font-bold text-slate-900 text-[10px] leading-tight line-clamp-2 h-[26px] max-h-[26px] overflow-hidden cursor-pointer"
              title={product.name}
            >
              {product.name}
            </h3>

            {/* Price Section */}
            <div className="flex items-baseline gap-1 pt-1 leading-none">
              <span className="font-display font-black text-slate-900 text-xs">
                ₹{price}
              </span>
              {oldPrice > price && (
                <span className="text-[9px] text-slate-400 line-through font-medium">
                  ₹{oldPrice}
                </span>
              )}
            </div>
          </div>

          {/* 3. Add to Cart Button (Bottom of card) */}
          <button
            type="button"
            onClick={() => addToCart(product.id, 1)}
            className="w-full bg-[#B71C1C] active:bg-[#900C0C] text-white font-extrabold text-[9px] uppercase tracking-wider py-1.5 rounded-md flex items-center justify-center gap-1 shadow-2xs mt-1 cursor-pointer"
          >
            <ShoppingBag className="w-2.5 h-2.5" />
            <span>Add</span>
          </button>
        </div>

      </div>
    </>
  );
}
