import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  ShoppingBag,
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Headphones,
  Tag,
  Award,
  Box,
  RefreshCw
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Karviyam Crimson');
  const [pincode, setPincode] = useState(() => localStorage.getItem('karviyam_user_pincode') || '600001');

  // Pincode Verification State
  const [pincodeResult, setPincodeResult] = useState(null);
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeError, setPincodeError] = useState('');

  useEffect(() => {
    const syncLocationPincode = () => {
      const savedPin = localStorage.getItem('karviyam_user_pincode') || '600001';
      setPincode(savedPin);
      setPincodeResult(null);
      setPincodeError('');
    };
    window.addEventListener('karviyam_location_updated', syncLocationPincode);
    window.addEventListener('storage', syncLocationPincode);
    return () => {
      window.removeEventListener('karviyam_location_updated', syncLocationPincode);
      window.removeEventListener('storage', syncLocationPincode);
    };
  }, []);

  useEffect(() => {
    fetchProduct();
    window.addEventListener('karviyam_products_updated', fetchProduct);
    window.addEventListener('storage', fetchProduct);
    return () => {
      window.removeEventListener('karviyam_products_updated', fetchProduct);
      window.removeEventListener('storage', fetchProduct);
    };
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      let item = null;
      try {
        const res = await api.get(`/products/${id}`);
        const apiData = res.data ? res.data : res;
        item = apiData.data || apiData;
      } catch (e1) {}

      // Always check Admin saved products for real-time Admin edits!
      try {
        const savedAdmin = localStorage.getItem('karviyam_admin_products');
        if (savedAdmin) {
          const parsed = JSON.parse(savedAdmin);
          if (Array.isArray(parsed)) {
            const found = parsed.find(p => String(p.id) === String(id) || String(p.sku) === String(id) || String(p.name) === String(id));
            if (found) {
              item = { ...item, ...found };
            }
          }
        }
      } catch (eSaved) {}

      // Default fallback item if no item exists in database or admin cache
      if (!item || !item.id) {
        item = {
          id: id || 195,
          sku: 'KV-DEM-195',
          name: 'Handcrafted demo Edition 4',
          price: 1212,
          oldPrice: 1564,
          discountPercent: 23,
          rating: 4.5,
          ratingsCount: 128,
          reviewsCount: 45,
          brand: 'KARVIYAM',
          imageUrl: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800',
          images: [
            'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800',
            'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
            'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800',
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'
          ],
          description: 'Premium handcrafted apparel designed with fine attention to detail and traditional couture.'
        };
      }

      setProduct(item);
      setSelectedImage(item.imageUrl || (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800'));
      if (item.color) setSelectedColor(item.color);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isWish = isInWishlist(product?.id);

  const galleryImages = product?.images && product.images.length > 0
    ? product.images
    : [
        product?.imageUrl || 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800',
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
        'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800',
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'
      ];

  const handleCheckPincode = async () => {
    const cleanPin = (pincode || '').trim();
    if (!cleanPin || cleanPin.length !== 6 || !/^\d+$/.test(cleanPin)) {
      setPincodeError('Please enter a valid 6-digit pincode');
      setPincodeResult(null);
      return;
    }

    setPincodeChecking(true);
    setPincodeError('');
    try {
      setTimeout(() => {
        setPincodeResult({
          isDeliveryAvailable: true,
          pincode: cleanPin,
          estimatedDeliveryDays: '3-5 Days',
          isCodAvailable: true,
          message: 'Delivery is available for this location!'
        });
        setPincodeChecking(false);
        toast.success(`Pincode ${cleanPin}: Serviceable for delivery! 🎉`);
      }, 300);
    } catch (e) {
      setPincodeChecking(false);
    }
  };

  const handleActionWithMandatoryPincode = (isBuyNow = false) => {
    if (!pincode || pincode.trim().length !== 6) {
      setPincodeError('⚠️ Delivery Pincode check is mandatory before ordering!');
      toast.error('⚠️ Please enter and check your 6-digit delivery pincode availability first!');
      const inputElem = document.getElementById('pincode-input-field');
      if (inputElem) inputElem.focus();
      return;
    }

    if (!pincodeResult) {
      setPincodeError('⚠️ Please click "Check" to verify pincode availability before adding to bag!');
      toast.error('⚠️ Please click "Check" to verify pincode delivery serviceability first!');
      const inputElem = document.getElementById('pincode-input-field');
      if (inputElem) inputElem.focus();
      return;
    }

    addToCart(product, 1, selectedSize, selectedColor);

    if (isBuyNow) {
      toast.success(`Redirecting to Checkout... 🛒`);
      navigate('/checkout');
    } else {
      toast.success(`Added ${product.name} to Shopping Bag! 🛍️`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-16 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#B71C1C]" />
        <p className="text-xs font-bold text-slate-500 mt-2">Loading product details...</p>
      </div>
    );
  }

  if (!product) return null;

  const price = product.price || 1128;
  const oldPrice = product.oldPrice || 1614;
  const discountPercent = product.discountPercent || Math.round(((oldPrice - price) / oldPrice) * 100) || 40;

  return (
    <div className="w-full bg-[#FAFAFA] text-slate-900 pb-14 sm:pb-8 lg:pb-12 font-sans">
      {/* 1. BREADCRUMB ROW */}
      <div className="max-w-[1750px] mx-auto px-2 sm:px-8 py-1.5 text-[10.5px] sm:text-[11px] font-semibold text-slate-500 text-left">
        <div className="flex items-center gap-1.5">
          <Link to="/" className="hover:text-[#B71C1C]">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-[#B71C1C]">Shop</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate">{product.name}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STRICT 3-COLUMN PRODUCT DETAIL LAYOUT (FULL DESKTOP WIDTH)               */}
      {/* COLUMN 1: IMAGE GALLERY (FIXED) | COLUMN 2: CONTROLS (FIXED) | COLUMN 3: SCROLLABLE DETAILS */}
      {/* ========================================================================= */}
      <div className="max-w-[1750px] mx-auto px-2 sm:px-8 py-1">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-4 lg:gap-6 text-left items-start">
          
          {/* ======================================================= */}
          {/* COLUMN 1: LEFT IMAGE GALLERY (STATIONARY / FIXED)       */}
          {/* ======================================================= */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row gap-2 lg:sticky lg:top-[135px] self-start">
            
            {/* Vertical Thumbnail Strip (Desktop) */}
            <div className="hidden sm:flex flex-col gap-2 w-14 shrink-0">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border transition-all shrink-0 bg-white ${
                    selectedImage === img
                      ? 'border-[#B71C1C] ring-1 ring-[#B71C1C]'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                </button>
              ))}
            </div>

            {/* Main Image Display Container (Compact Mobile Height & Reduced Padding) */}
            <div className="flex-1 space-y-1">
              <div className="relative w-full h-[280px] sm:h-[400px] lg:h-[420px] bg-white rounded-2xl border border-slate-200/80 p-1 sm:p-2 shadow-2xs flex items-center justify-center overflow-hidden">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain rounded-xl transition-transform duration-300 hover:scale-105"
                />

                {/* Wishlist Button (Top-Right Circle) */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-colors cursor-pointer border ${
                    isWish
                      ? 'bg-[#B71C1C] text-white border-[#B71C1C]'
                      : 'bg-white text-slate-700 hover:text-[#B71C1C] border-slate-200'
                  }`}
                  title={isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-3.5 h-3.5 ${isWish ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* COLUMN 2: CENTER CONTROLS & PRICING (STATIONARY / FIXED) */}
          {/* ======================================================= */}
          <div className="lg:col-span-4 space-y-2.5 lg:sticky lg:top-[135px] self-start">
            
            {/* Karviyam Premium Badge */}
            <div className="inline-flex items-center gap-1.5 bg-rose-50 text-[#B71C1C] px-2.5 py-0.5 rounded-full border border-rose-200/80 font-black text-[9px] sm:text-[9.5px] uppercase tracking-wider shadow-2xs">
              <span>🌸</span>
              <span>KARVIYAM PREMIUM</span>
            </div>

            {/* Product Title & SKU */}
            <div>
              <h1 className="font-display font-black text-xl sm:text-2xl text-slate-900 leading-tight tracking-tight">
                {product.name}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono font-bold mt-0.5">
                SKU: {product.sku || 'KV-DEM-195'}
              </p>
            </div>

            {/* Rating & Reviews Line */}
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-emerald-700 text-white font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs text-[10px] sm:text-[10.5px]">
                <span>{product.rating || 4.5}</span>
                <span>★</span>
              </span>
              <span className="font-semibold text-slate-600 text-[10px] sm:text-[11px]">
                {product.ratingsCount || 128} Verified Ratings & {product.reviewsCount || 45} Customer Reviews
              </span>
            </div>

            {/* Price Banner Box */}
            <div className="bg-[#FAFAFA] border border-slate-200/90 rounded-xl py-1.5 px-3 flex items-baseline gap-2.5">
              <span className="font-display font-black text-xl sm:text-2xl text-[#B71C1C]">
                ₹{price}
              </span>
              <span className="text-slate-400 line-through font-bold text-xs sm:text-sm">
                ₹{oldPrice}
              </span>
              <span className="bg-emerald-100 text-emerald-800 font-black text-[9.5px] sm:text-[10.5px] px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                {discountPercent}% OFF
              </span>
            </div>

            {/* Select Size Selector */}
            <div className="space-y-1">
              <label className="block text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-900">
                SELECT SIZE
              </label>
              <div className="flex items-center gap-1.5">
                {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`w-8 h-8 rounded-lg font-extrabold text-xs transition-all cursor-pointer border flex items-center justify-center ${
                      selectedSize === sz
                        ? 'bg-[#B71C1C] text-white border-[#B71C1C] shadow-md'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Color Variant Selector */}
            <div className="space-y-1">
              <label className="block text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-900">
                SELECT COLOR VARIANT
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { name: 'Karviyam Crimson', dot: '#B71C1C' },
                  { name: 'Obsidian Black', dot: '#0F172A' },
                  { name: 'Pure Linen White', dot: '#FFFFFF' }
                ].map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer border ${
                      selectedColor === c.name
                        ? 'bg-rose-50/60 border-[#B71C1C] text-[#B71C1C] shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                      style={{ backgroundColor: c.dot }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mandatory Pincode Serviceability Box */}
            <div className="bg-[#FFFBEB] border-2 border-amber-300 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] sm:text-[10.5px] font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1">
                  <span>CHECK SERVICEABLE PINCODE & DELIVERY AVAILABILITY</span>
                  <span className="text-[#B71C1C] font-black">*</span>
                </span>
                <span className="bg-red-100 text-[#B71C1C] text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                  MANDATORY
                </span>
              </div>

              <div className="flex gap-1.5">
                <input
                  id="pincode-input-field"
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, ''));
                    setPincodeResult(null);
                    setPincodeError('');
                  }}
                  placeholder="Enter 6-digit Pincode"
                  className="bg-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold flex-1 outline-none focus:border-[#B71C1C]"
                />
                <button
                  type="button"
                  onClick={handleCheckPincode}
                  disabled={pincodeChecking}
                  className="bg-slate-900 hover:bg-[#B71C1C] text-white text-xs font-extrabold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-2xs"
                >
                  {pincodeChecking ? 'Checking...' : 'Check'}
                </button>
              </div>

              {pincodeResult && (
                <div className="bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg text-[10.5px] text-emerald-800 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Delivery is available for pincode {pincode}!</span>
                </div>
              )}

              {pincodeError && (
                <p className="text-[10px] text-red-600 font-bold">{pincodeError}</p>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => handleActionWithMandatoryPincode(false)}
                className="w-full bg-[#B71C1C] hover:bg-[#900C0C] active:bg-[#780E0E] text-white font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>ADD TO SHOPPING BAG</span>
              </button>

              <button
                type="button"
                onClick={() => handleActionWithMandatoryPincode(true)}
                className="w-full bg-[#B71C1C] hover:bg-[#900C0C] active:bg-[#780E0E] text-white font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
              >
                BUY NOW
              </button>
            </div>

            {/* 5 Delivery/Trust Feature Badges Row */}
            <div className="grid grid-cols-5 gap-0.5 pt-2 border-t border-slate-200/80 text-center text-[8.5px] sm:text-[9.5px] font-bold text-slate-600">
              <div className="flex flex-col items-center gap-0.5">
                <RotateCcw className="w-3.5 h-3.5 text-[#B71C1C]" />
                <span>10 days Return & Exchange</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B71C1C]" />
                <span>Pay on Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Truck className="w-3.5 h-3.5 text-[#B71C1C]" />
                <span>Free Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Award className="w-3.5 h-3.5 text-[#B71C1C]" />
                <span>Top Brand</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Box className="w-3.5 h-3.5 text-[#B71C1C]" />
                <span>Amazon Delivered</span>
              </div>
            </div>

          </div>

          {/* ======================================================= */}
          {/* COLUMN 3: RIGHT SPECIFICATIONS & DETAILS                */}
          {/* DESKTOP: FIXED SCROLLABLE PANEL | MOBILE: NATURAL CONTINUOUS DOCUMENT SCROLL */}
          {/* ======================================================= */}
          <div className="lg:col-span-4 space-y-2.5 sm:space-y-3.5 lg:space-y-4 lg:h-[calc(100vh-160px)] lg:overflow-y-auto lg:overscroll-contain pr-0 lg:pr-2 scrollbar-thin text-xs overflow-visible h-auto px-3.5 sm:px-6 lg:px-0 max-w-xl mx-auto lg:mx-0 w-full">
            
            <div className="space-y-2.5 sm:space-y-3">
              {/* 1. TOP HIGHLIGHTS */}
              {(() => {
                const items = [
                  { label: 'Material composition', val: product?.material || product?.fabric || 'Cotton Blend' },
                  { label: 'Fit type', val: product?.fitType || 'Regular Fit' },
                  { label: 'Sleeve type', val: product?.sleeveType || 'Long Sleeve' },
                  { label: 'Collar style', val: product?.collarStyle || 'Spread Collar' },
                  { label: 'Neck style', val: product?.neckStyle || 'Collared Neck' },
                  { label: 'Style', val: product?.style || 'Western' },
                  { label: 'Country of Origin', val: product?.countryOfOrigin || 'India' }
                ].filter(i => i.val && String(i.val).trim() !== '');

                if (items.length === 0) return null;

                return (
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-xs text-slate-900 border-b border-slate-200/80 pb-1 px-1">
                      Top highlights
                    </h3>
                    <div className="space-y-0.5 text-[11px]">
                      {items.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-[140px_1fr] lg:grid-cols-[165px_1fr] items-center py-1 px-1 border-b border-slate-100/80">
                          <span className="font-bold text-slate-900 pr-2 truncate">{row.label}</span>
                          <span className="text-slate-700 font-medium text-left lg:text-right truncate" title={row.val}>{row.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* 2. ABOUT THIS ITEM */}
              {(() => {
                let bullets = [];
                if (Array.isArray(product?.aboutThisItem) && product.aboutThisItem.length > 0) {
                  bullets = product.aboutThisItem;
                } else if (product?.description && typeof product.description === 'string') {
                  bullets = product.description.split('\n').map(l => l.trim()).filter(Boolean);
                }

                if (bullets.length === 0) {
                  bullets = [
                    "【Premium Quality】 Handcrafted with premium fabric and precise stitching for maximum comfort.",
                    "【Versatile Design】 Elegant and stylish design suitable for casual, festive, and formal occasions.",
                    "【Easy Care】 Easy to care for with standard washing instructions."
                  ];
                }

                return (
                  <div className="space-y-1.5 pt-1">
                    <h3 className="font-extrabold text-xs text-slate-900 border-b border-slate-200/80 pb-1 px-1">
                      About this item
                    </h3>
                    <ul className="space-y-1.5 text-[10.5px] text-slate-700 font-medium leading-normal px-1">
                      {bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#B71C1C] font-bold shrink-0">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

              {/* 3. ADDITIONAL INFORMATION */}
              {(() => {
                const info = [
                  { label: 'Manufacturer', val: product?.manufacturer || (product?.brand ? `${product.brand}, India` : 'Karviyam Couture, Surat, Gujarat') },
                  { label: 'Packer', val: product?.packer || 'Karviyam Fulfillment, India' },
                  { label: 'Importer', val: product?.importer || 'Karviyam Retail, India' },
                  { label: 'Item Weight', val: product?.weight ? `${product.weight} g` : '230 g' },
                  { label: 'Item Dimensions LxWxH', val: product?.dimensions || '23 x 22 x 1.8 Centimeters' },
                  { label: 'Net Quantity', val: '1.00 Count' },
                  { label: 'Generic Name', val: product?.categoryName || product?.type || 'Apparel' }
                ].filter(i => i.val && String(i.val).trim() !== '');

                if (info.length === 0) return null;

                return (
                  <div className="space-y-1.5 pt-1">
                    <h3 className="font-extrabold text-xs text-slate-900 border-b border-slate-200/80 pb-1 px-1">
                      Additional Information
                    </h3>
                    <div className="space-y-0.5 text-[11px]">
                      {info.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-[140px_1fr] lg:grid-cols-[165px_1fr] items-center py-1 px-1 border-b border-slate-100/80">
                          <span className="font-bold text-slate-900 pr-2 truncate">{row.label}</span>
                          <span className="text-slate-700 font-medium text-left lg:text-right truncate" title={row.val}>{row.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* 4. STYLE SPECIFICATIONS */}
              {(() => {
                const styleList = [
                  { label: 'Brand Name', val: product?.brand || 'Karviyam' },
                  { label: 'Model Name', val: product?.modelName || product?.size || 'Standard' },
                  { label: 'Style Number', val: product?.sku || `KV-SKU-${product?.id || 195}` },
                  { label: 'Unit Count', val: '1.00 Count' },
                  { label: 'Country Of Origin', val: product?.countryOfOrigin || 'India' },
                  { label: 'Item Type Name', val: product?.type || product?.categoryName || 'Fashion' },
                  { label: 'Item Weight', val: product?.weight ? `${product.weight} Grams` : '230 Grams' },
                  { label: 'Manufacturer', val: product?.manufacturer || 'Karviyam' }
                ].filter(i => i.val && String(i.val).trim() !== '');

                if (styleList.length === 0) return null;

                return (
                  <div className="space-y-1.5 pt-1">
                    <h3 className="font-extrabold text-xs text-slate-900 border-b border-slate-200/80 pb-1 px-1">
                      Style
                    </h3>
                    <div className="space-y-0.5 text-[11px]">
                      {styleList.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-[140px_1fr] lg:grid-cols-[165px_1fr] items-center py-1 px-1 border-b border-slate-100/80">
                          <span className="font-bold text-slate-900 pr-2 truncate">{row.label}</span>
                          <span className="text-slate-700 font-medium text-left lg:text-right truncate" title={row.val}>{row.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>

        </div>

      </div>



    </div>
  );
}
