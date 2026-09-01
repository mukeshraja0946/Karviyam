import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, ShoppingBag, Truck } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const wishlistCtx = useWishlist() || {};
  const cartCtx = useCart() || {};
  const isInWishlist = wishlistCtx.isInWishlist || (() => false);
  const toggleWishlist = wishlistCtx.toggleWishlist || (() => {});
  const addToCart = cartCtx.addToCart || (() => {});

  if (!product) return null;
  const isLiked = typeof isInWishlist === 'function' ? isInWishlist(product?.id) : false;

  const price = product.price || 361;
  const oldPrice = product.oldPrice || Math.round(price * 4.2);
  const discountPercent = oldPrice > price
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 82;

  const rating = Number(product.rating || 0);
  const reviewsCount = Number(product.reviewsCount || product.ratingsCount || 0);
  const boughtCount = (product.id ? (product.id * 230) % 800 + 100 : 700);

  const brandName = product.brand || (
    product.id % 4 === 1 ? 'DEELMO' :
    product.id % 4 === 2 ? 'Noble Monk' :
    product.id % 4 === 3 ? 'AUSK' : 'CB-COLEBROOK'
  );

  // Swatches
  const availableColors = product.colors || [
    '#6B21A8', '#1E293B', '#451A03', '#15803D', '#BE123C', '#0369A1'
  ];
  const visibleColors = availableColors.slice(0, 5);
  const extraColorsCount = (product.id ? (product.id * 3) % 15 + 4 : 9);

  return (
    <>
      {/* ========================================================= */}
      {/* DESKTOP PRODUCT CARD (>= 768px) - AMAZON-STYLE KARVIYAM    */}
      {/* STRICT EQUAL HEIGHT (515px) & BOTTOM ALIGNED ADD TO CART   */}
      {/* ========================================================= */}
      <div className="hidden md:flex group relative bg-white w-full h-[465px] min-h-[465px] max-h-[465px] rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex-col justify-between overflow-hidden p-3 text-left">
        
        {/* 1. Image Container (Fixed 230px Height) */}
        <div 
          className="relative w-full h-[230px] min-h-[230px] max-h-[230px] bg-white rounded-lg overflow-hidden flex items-center justify-center cursor-pointer shrink-0"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          <img
            src={resolveImageUrl(product?.imageUrl || product?.image || (Array.isArray(product?.images) && product?.images[0]), product?.id, product?.updatedAt || product?.updated_at)}
            alt={product?.name || 'Product'}
            onError={(e) => handleImageError(e, product?.id)}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Top-Left Karviyam's Choice Badge */}
          {product.id % 2 === 1 && (
            <div className="absolute top-2 left-0 bg-slate-900 text-white text-[9.5px] font-bold px-2 py-0.5 rounded-r-md flex items-center gap-1 shadow-xs z-10">
              <span>Karviyam's</span>
              <span className="text-amber-400 font-extrabold">Choice</span>
            </div>
          )}

          {/* Wishlist Button (Top-Right) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all shadow-xs cursor-pointer ${
              isLiked
                ? 'bg-[#B71C1C] text-white border-[#B71C1C]'
                : 'bg-white/95 text-slate-600 hover:text-[#B71C1C] hover:bg-red-50 border border-slate-200'
            }`}
            title={isLiked ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* 2. Color Swatches Row */}
        <div className="flex items-center gap-1.5 pt-2">
          {visibleColors.map((color, idx) => (
            <span
              key={idx}
              className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0 cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="text-[10px] font-bold text-slate-500 hover:text-[#B71C1C] cursor-pointer">
            +{extraColorsCount}
          </span>
        </div>

        {/* 3. Product Info Content Box */}
        <div className="flex-1 flex flex-col justify-between pt-1 overflow-hidden space-y-1">
          
          <div className="space-y-1">
            {/* Brand Header */}
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#B71C1C] uppercase tracking-wider">
              <span>{brandName}</span>
              <span className="text-[9px]">🌸</span>
            </div>

            {/* Product Title (Single Line Truncated) */}
            <h3 
              onClick={() => navigate(`/product/${product.id}`)}
              className="font-sans font-bold text-slate-900 text-xs leading-snug hover:text-[#B71C1C] transition-colors cursor-pointer truncate h-[18px] overflow-hidden"
              title={product.name}
            >
              {product.name}
            </h3>

            {/* Rating Score & Social Proof */}
            <div className="space-y-0.5">
              {reviewsCount > 0 ? (
                <div 
                  onClick={() => navigate(`/product/${product.id}#reviews-section`)}
                  className="flex items-center gap-1 text-xs cursor-pointer group"
                >
                  <span className="font-extrabold text-slate-900 text-[11px] group-hover:text-[#B71C1C] transition-colors">{rating.toFixed(1)}</span>
                  <div className="flex text-amber-400 text-xs">
                    {'★'.repeat(Math.min(5, Math.floor(rating)))}
                    {'☆'.repeat(Math.max(0, 5 - Math.floor(rating)))}
                  </div>
                  <span className="text-[10px] text-sky-600 font-semibold group-hover:underline">({reviewsCount > 999 ? `${(reviewsCount/1000).toFixed(1)}K` : reviewsCount})</span>
                </div>
              ) : (
                <div 
                  onClick={() => navigate(`/product/${product.id}#reviews-section`)}
                  className="text-[10px] font-semibold text-slate-400 italic cursor-pointer hover:text-[#B71C1C] transition-colors"
                >
                  No ratings yet
                </div>
              )}
            </div>

            {/* Price & Offer Row */}
            <div className="pt-0.5 space-y-0.5">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-700">₹</span>
                <span className="font-sans font-black text-slate-900 text-lg leading-none">
                  {price}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">M.R.P.</span>
                <span className="text-[10px] text-slate-400 line-through font-medium">
                  ₹{oldPrice}
                </span>
                <span className="text-[10px] text-slate-700 font-bold">
                  ({discountPercent}% off)
                </span>
              </div>
              <p className="text-[9.5px] text-slate-600 font-medium truncate">
                Up to 5% back with Karviyam Pay ICCI
              </p>
            </div>

            {/* Delivery Info */}
            <div className="text-[10px] space-y-0.5 pt-0.5 text-slate-700">
              <p className="font-medium truncate">
                <span className="font-bold text-slate-900">FREE delivery </span>
                <span className="font-bold text-slate-900">Thu, 27 Aug </span>
                <span>on first order</span>
              </p>
              <p className="text-slate-600 font-medium truncate">
                Or fastest delivery <span className="font-bold text-slate-900">Tomorrow 8 am – 12 pm</span>
              </p>
            </div>

          </div>

          {/* 4. Full-Width Add to Cart Button (Aligned at the exact bottom of every card) */}
          <button
            type="button"
            onClick={() => addToCart(product.id, 1)}
            className="w-full bg-[#B71C1C] hover:bg-[#900C0C] active:bg-[#780E0E] text-white font-extrabold text-xs py-2 rounded-lg shadow-2xs hover:shadow-md transition-colors cursor-pointer text-center mt-2"
          >
            Add to cart
          </button>

        </div>

      </div>

      {/* ========================================================= */}
      {/* MOBILE PRODUCT CARD (< 768px)                             */}
      {/* ========================================================= */}
      <div className="flex md:hidden group relative bg-white w-full h-[240px] min-h-[240px] max-h-[240px] rounded-xl border border-slate-200/80 shadow-2xs flex-col justify-between overflow-hidden p-1.5">
        <div
          className="relative w-full h-[105px] max-h-[105px] bg-white rounded-lg flex items-center justify-center cursor-pointer shrink-0 overflow-hidden"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          <img
            src={resolveImageUrl(product.imageUrl || product.image, product.id)}
            alt={product.name}
            onError={(e) => handleImageError(e, product.id)}
            className="w-full h-full object-contain"
            loading="lazy"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`absolute top-1 right-1 p-1 rounded-full backdrop-blur-md transition-all shadow-xs cursor-pointer ${
              isLiked ? 'bg-[#B71C1C] text-white' : 'bg-white/95 text-slate-600 border border-slate-200'
            }`}
          >
            <Heart className={`w-2.5 h-2.5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-between pt-1 px-0.5 overflow-hidden">
          <div>
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold leading-none mb-0.5">
              <span className="uppercase text-[#B71C1C] tracking-tight truncate max-w-[60px]">{brandName}</span>
              {reviewsCount > 0 ? (
                <div 
                  onClick={() => navigate(`/product/${product.id}#reviews-section`)}
                  className="flex items-center gap-0.5 text-slate-700 font-extrabold shrink-0 cursor-pointer"
                >
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span>{rating.toFixed(1)}</span>
                  <span className="text-[8px] text-slate-400">({reviewsCount})</span>
                </div>
              ) : (
                <span className="text-[8.5px] font-medium text-slate-400 italic">No ratings</span>
              )}
            </div>
            <h3
              onClick={() => navigate(`/product/${product.id}`)}
              className="font-bold text-slate-900 text-[10px] leading-tight truncate h-[14px] overflow-hidden cursor-pointer"
              title={product.name}
            >
              {product.name}
            </h3>
            <div className="flex items-baseline gap-1 pt-0.5">
              <span className="font-black text-slate-900 text-xs">₹{price}</span>
              {oldPrice > price && (
                <span className="text-[9px] text-slate-400 line-through">₹{oldPrice}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => addToCart(product.id, 1)}
            className="w-full bg-[#B71C1C] text-white font-extrabold text-[9px] py-1.5 rounded-md text-center mt-1 cursor-pointer"
          >
            Add to cart
          </button>
        </div>
      </div>
    </>
  );
}
