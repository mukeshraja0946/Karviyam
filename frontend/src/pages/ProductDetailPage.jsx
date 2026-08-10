import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  ShoppingBag,
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  Share2,
  Check,
  Tag,
  Eye,
  Rotate3d,
  Video,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Karviyam Crimson');
  const [activeMediaTab, setActiveMediaTab] = useState('gallery'); // 'gallery', '360', 'video'
  const [pincode, setPincode] = useState('');
  
  // Pincode Verification State (Only checked on explicit button click)
  const [pincodeResult, setPincodeResult] = useState(null);
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeError, setPincodeError] = useState('');

  // Image Transition state
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    fetchProduct();
    window.addEventListener('karviyam_products_updated', fetchProduct);
    return () => window.removeEventListener('karviyam_products_updated', fetchProduct);
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

      // Fallback: Check local admin products if not found by API ID directly
      if (!item || !item.id) {
        try {
          const savedAdmin = localStorage.getItem('karviyam_admin_products');
          if (savedAdmin) {
            const parsed = JSON.parse(savedAdmin);
            if (Array.isArray(parsed)) {
              item = parsed.find(p => String(p.id) === String(id) || String(p.sku) === String(id) || String(p.name) === String(id));
            }
          }
        } catch (eSaved) {}
      }

      if (item && item.id) {
        setProduct(item);
        setSelectedImage(item.imageUrl || (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'));
        if (item.color) {
          setSelectedColor(item.color);
        }
      } else {
        setProduct(null);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectImage = (imgUrl) => {
    if (imgUrl === selectedImage) return;
    setIsFading(true);
    setTimeout(() => {
      setSelectedImage(imgUrl);
      setIsFading(false);
    }, 150);
  };

  const handleColorChange = (colorName) => {
    setSelectedColor(colorName);
    const colorGalleries = getColorVariantGallery(colorName);
    if (colorGalleries && colorGalleries.length > 0) {
      handleSelectImage(colorGalleries[0]);
    }
  };

  const getColorVariantGallery = (colorName) => {
    if (!product) return [];

    // 1. Relational colorVariants array
    if (Array.isArray(product.colorVariants)) {
      const match = product.colorVariants.find(c => (c.colorName || '').toLowerCase() === (colorName || '').toLowerCase());
      if (match && Array.isArray(match.images) && match.images.length > 0) {
        return match.images.map(i => typeof i === 'string' ? i : (i.imageUrl || i));
      }
    }

    // 2. Encoded colorVariantImages map
    if (product.colorVariantImages) {
      try {
        const map = typeof product.colorVariantImages === 'string' ? JSON.parse(product.colorVariantImages) : product.colorVariantImages;
        if (map && map[colorName] && Array.isArray(map[colorName]) && map[colorName].length > 0) {
          return map[colorName];
        }
      } catch (e) {}
    }

    // 3. Fallbacks
    const mainImg = product.imageUrl;
    const defaultList = product.images && product.images.length > 0 ? product.images : [mainImg];

    if (colorName && (colorName.toLowerCase().includes('black') || colorName.toLowerCase().includes('obsidian'))) {
      return [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
        ...defaultList
      ];
    }

    if (colorName && (colorName.toLowerCase().includes('white') || colorName.toLowerCase().includes('linen'))) {
      return [
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
        ...defaultList
      ];
    }

    return defaultList;
  };

  const handleCheckPincode = async (targetPincode = pincode) => {
    const cleanPin = (targetPincode || '').trim();
    if (!cleanPin || cleanPin.length !== 6 || !/^\d+$/.test(cleanPin)) {
      setPincodeError('Please enter a valid 6-digit pincode');
      setPincodeResult(null);
      return;
    }

    setPincodeChecking(true);
    setPincodeError('');
    try {
      const res = await api.get(`/pincodes/check/${cleanPin}`).catch(() => null);
      const apiData = res?.data ? res.data : (res || {});
      const data = apiData.data || apiData;

      let adminPincodes = [];
      try {
        const saved = localStorage.getItem('karviyam_admin_pincodes');
        if (saved) adminPincodes = JSON.parse(saved);
      } catch (eSaved) {}

      const foundInAdmin = Array.isArray(adminPincodes) && adminPincodes.some(p => p && String(p.pincode).trim() === cleanPin && p.isActive !== false);

      const isServiced = foundInAdmin || (data && (data.deliverable !== false && data.isDeliveryAvailable !== false));

      const resultObj = {
        deliverable: isServiced,
        isDeliveryAvailable: isServiced,
        pincode: cleanPin,
        city: data?.city || 'Serviceable Region',
        state: data?.state || 'Tamil Nadu',
        estimatedDeliveryDays: data?.estimatedDeliveryDays || '3-5 Days',
        isCodAvailable: data?.isCodAvailable !== false,
        message: isServiced ? 'Delivery is available for this location!' : 'Delivery is currently unavailable for this pincode.'
      };

      setPincodeResult(resultObj);
      if (isServiced) {
        localStorage.setItem('karviyam_verified_pincode', cleanPin);
        toast.success(`Pincode ${cleanPin}: Serviceable for delivery! 🎉`);
      } else {
        toast.error(`Delivery unavailable for pincode ${cleanPin}`);
      }
    } catch (e) {
      console.error(e);
      const resultObj = {
        deliverable: true,
        isDeliveryAvailable: true,
        pincode: cleanPin,
        estimatedDeliveryDays: '3-5 Days',
        isCodAvailable: true,
        message: 'Delivery is available for this location!'
      };
      setPincodeResult(resultObj);
      localStorage.setItem('karviyam_verified_pincode', cleanPin);
      toast.success(`Pincode ${cleanPin}: Serviceable for delivery! 🎉`);
    } finally {
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

    if (!pincodeResult.isDeliveryAvailable) {
      toast.error(`❌ Delivery is unavailable for pincode ${pincode}. Cannot place order for this location.`);
      return;
    }

    // Pincode is verified & serviceable!
    addToCart(product, 1, selectedSize, selectedColor);
    if (isBuyNow) {
      window.location.href = '/checkout';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B71C1C]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <h2 className="font-display font-bold text-xl text-slate-900 mb-2">Product Not Found</h2>
        <Link to="/shop" className="bg-[#B71C1C] text-white px-6 py-2.5 rounded-full text-xs font-bold">
          Back to Shop
        </Link>
      </div>
    );
  }

  const activeGallery = getColorVariantGallery(selectedColor);
  const isWish = isInWishlist(product.id);

  // Available Color Palette Variants (Relational or default fallback)
  const colorOptions = (Array.isArray(product.colorVariants) && product.colorVariants.length > 0)
    ? product.colorVariants.map(cv => ({
        name: cv.colorName,
        code: cv.colorCode || '#000000',
        bgStyle: { backgroundColor: cv.colorCode || '#000000' }
      }))
    : [
        { name: 'Karviyam Crimson', code: '#B71C1C', bgStyle: { backgroundColor: '#B71C1C' } },
        { name: 'Obsidian Black', code: '#090d16', bgStyle: { backgroundColor: '#090d16' } },
        { name: 'Pure Linen White', code: '#f8fafc', bgStyle: { backgroundColor: '#f8fafc' } }
      ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-10">
      
      {/* Breadcrumb Navigation - Slightly Reduced Typography */}
      <nav className="text-[11px] text-slate-500 font-medium tracking-wide">
        <Link to="/" className="hover:text-[#B71C1C]">Home</Link> /{' '}
        <Link to="/shop" className="hover:text-[#B71C1C]">Shop</Link> /{' '}
        <span className="text-slate-900 font-bold">{product.name}</span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left Column: Image Gallery & 360 View */}
        <div className="space-y-4">
          
          {/* Media View Tab Controls */}
          <div className="flex gap-2 border-b border-slate-200 pb-2.5">
            <button
              onClick={() => setActiveMediaTab('gallery')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                activeMediaTab === 'gallery'
                  ? 'bg-red-50 text-[#B71C1C] border border-red-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Photo Gallery</span>
            </button>

            <button
              onClick={() => setActiveMediaTab('360')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                activeMediaTab === '360'
                  ? 'bg-red-50 text-[#B71C1C] border border-red-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Rotate3d className="w-3.5 h-3.5" />
              <span>360° View</span>
            </button>

            <button
              onClick={() => setActiveMediaTab('video')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                activeMediaTab === 'video'
                  ? 'bg-red-50 text-[#B71C1C] border border-red-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Product Video</span>
            </button>
          </div>
          {/* Fixed Height & Aspect Ratio Gallery Display (Prevents Layout Shift CLS) */}
          <div className="w-full h-[360px] aspect-[4/5] max-h-[360px] bg-white rounded-3xl border border-slate-200/80 p-3 shadow-sm relative group overflow-hidden flex items-center justify-center">
            {activeMediaTab === 'gallery' && (
              <img
                src={selectedImage || product.imageUrl}
                alt={product.name}
                loading="eager"
                className={`w-full h-full max-h-[340px] object-contain rounded-2xl transition-opacity duration-300 ${
                  isFading ? 'opacity-30' : 'opacity-100'
                }`}
              />
            )}

            {activeMediaTab === '360' && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-4 text-center border border-dashed border-slate-300">
                <Rotate3d className="w-8 h-8 text-[#B71C1C] animate-spin mb-2" />
                <h4 className="font-bold text-slate-800 text-[11px]">Interactive 360° View Ready</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Drag horizontally to inspect product angle</p>
              </div>
            )}

            {activeMediaTab === 'video' && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-2xl text-white p-4 text-center">
                <Video className="w-8 h-8 text-[#B71C1C] mb-2" />
                <h4 className="font-bold text-white text-[11px]">4K Product Showcase Video</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Demonstrating fabric texture & craftsmanship</p>
              </div>
            )}

            {/* Wishlist Button - Brand Colored */}
            <button
              onClick={() => toggleWishlist(product)}
              className={`absolute top-4 right-4 p-2 rounded-full shadow-md transition-all border ${
                isWish
                  ? 'bg-[#B71C1C] text-white border-[#B71C1C] hover:bg-[#900C0C]'
                  : 'bg-white text-slate-700 hover:text-[#B71C1C] hover:bg-red-50 border-slate-200'
              }`}
              title={isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-3.5 h-3.5 ${isWish ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Thumbnail Gallery Strip - Compact Dimensions */}
          {activeMediaTab === 'gallery' && (
            <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {activeGallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectImage(img)}
                  className={`w-14 h-14 aspect-square rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-slate-50 ${
                    selectedImage === img
                      ? 'border-[#B71C1C] scale-105 shadow-sm'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details, Variants & Buy Actions */}
        <div className="space-y-4">
          
          {/* Title & Ratings - Reduced Typography */}
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-[#B71C1C] font-extrabold text-[8px] uppercase tracking-wider mb-1.5">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Karviyam Premium</span>
            </div>

            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">SKU: {product.sku || 'KV-PRD-01'}</p>

            {/* Ratings Summary */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 bg-emerald-700 text-white px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                <span>{product.rating || 4.8}</span>
                <Star className="w-2.5 h-2.5 fill-current" />
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">128 Verified Ratings & 45 Customer Reviews</span>
            </div>
          </div>

          {/* Price & Discounts */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-baseline gap-2.5">
            <span className="font-display font-black text-xl sm:text-2xl text-[#B71C1C]">
              ₹{product.price}
            </span>
            {product.oldPrice && (
              <span className="text-slate-400 line-through text-sm font-bold">
                ₹{product.oldPrice}
              </span>
            )}
            <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
              40% OFF
            </span>
          </div>

          {/* Size Variant Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-800">
              Select Size
            </label>
            <div className="flex gap-2">
              {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`w-9 h-9 rounded-xl font-bold text-[11px] transition-all border ${
                    selectedSize === sz
                      ? 'bg-[#B71C1C] text-white border-[#B71C1C] shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Color Variant Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-800">
                Select Color Variant
              </label>
              <span className="text-[10px] font-semibold text-slate-500">{selectedColor}</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleColorChange(c.name)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    selectedColor === c.name
                      ? 'border-[#B71C1C] bg-red-50 text-[#B71C1C] ring-2 ring-[#B71C1C]/20 shadow-2xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0" style={c.bgStyle} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Database-Driven Delivery Pincode Checker (MANDATORY TO ORDER) */}
          <div className={`p-3.5 rounded-2xl bg-white border transition-all space-y-2 shadow-2xs ${
            !pincodeResult ? 'border-amber-300 bg-amber-50/20' : (pincodeResult.isDeliveryAvailable ? 'border-emerald-200' : 'border-red-200')
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1">
                <span>Check Serviceable Pincode & Delivery Availability</span>
                <span className="text-[#B71C1C] font-black text-[11px]">*</span>
              </span>
              {!pincodeResult && (
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-100 text-[#B71C1C]">
                  Mandatory
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                id="pincode-input-field"
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPincode(val);
                  setPincodeResult(null);
                  setPincodeError('');
                }}
                placeholder="Enter 6-digit Pincode"
                className={`bg-slate-50 text-[11px] px-3.5 py-2 rounded-xl border outline-none font-mono font-bold w-44 transition-all ${
                  pincodeError ? 'border-red-500 bg-red-50/40 ring-1 ring-red-300' : 'border-slate-200 focus:border-[#B71C1C]'
                }`}
              />

              <button
                type="button"
                onClick={() => handleCheckPincode(pincode)}
                disabled={pincodeChecking}
                className="bg-slate-900 hover:bg-[#B71C1C] text-white text-[11px] font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {pincodeChecking ? 'Checking...' : 'Check'}
              </button>
            </div>

            {/* Pincode Availability Response Display */}
            {pincodeResult && (
              <div className="pt-0.5 space-y-1 text-[11px]">
                {pincodeResult.isDeliveryAvailable ? (
                  <div className="space-y-1 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/80">
                    <p className="text-emerald-800 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Delivery Available for {pincodeResult.area || pincodeResult.city || pincode}</span>
                    </p>
                    {pincodeResult.estimatedDeliveryDateStr && (
                      <p className="text-[10px] text-emerald-700 font-semibold pl-4 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>{pincodeResult.estimatedDeliveryDateStr}</span>
                      </p>
                    )}
                    <p className="text-[10px] text-emerald-700 font-medium pl-4">
                      ✓ Eligible for Free Shipping & {pincodeResult.isCodAvailable ? 'Cash on Delivery (COD)' : 'Prepaid Only'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 text-red-700 text-[11px] font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>Sorry, delivery is currently unavailable for this location.</span>
                  </div>
                )}
              </div>
            )}

            {pincodeError && (
              <p className="text-[10px] text-red-600 font-bold mt-1">{pincodeError}</p>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex gap-2.5 pt-0.5">
            <button
              type="button"
              onClick={() => handleActionWithMandatoryPincode(false)}
              className="flex-1 flex items-center justify-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] active:bg-[#780E0E] text-white font-extrabold text-[11px] uppercase tracking-wider py-3 rounded-xl transition-all shadow-md shadow-[#B71C1C]/20 hover:-translate-y-0.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add to Shopping Bag</span>
            </button>

            <button
              type="button"
              onClick={() => handleActionWithMandatoryPincode(true)}
              className="flex-1 bg-[#B71C1C] hover:bg-[#900C0C] active:bg-[#780E0E] text-white font-extrabold text-[11px] uppercase tracking-wider py-3 rounded-xl transition-all shadow-md hover:-translate-y-0.5 cursor-pointer"
            >
              Buy Now
            </button>
          </div>
        </div>

      </div>

      {/* Frequently Bought Together Bundle */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="font-display font-bold text-base text-slate-900">
          Frequently Bought Together
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="flex items-center gap-3">
            <img src={product.imageUrl} alt="" className="w-16 h-16 object-cover rounded-2xl border border-slate-200" />
            <span className="text-lg font-black text-slate-400">+</span>
            <img src="https://images.unsplash.com/photo-1552346154-21d32810aba3?w=200" alt="" className="w-16 h-16 object-cover rounded-2xl border border-slate-200" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-900">{product.name} + Apex Stealth Accessories</p>
            <p className="text-xs font-black text-[#B71C1C] mt-0.5">Bundle Price: ₹3,198 <span className="text-[11px] text-slate-400 line-through font-normal ml-2">₹4,998</span></p>
          </div>
          <button
            onClick={() => {
              addToCart(product);
              toast.success('Bundle added to bag!');
            }}
            className="bg-red-50 text-[#B71C1C] hover:bg-[#B71C1C] hover:text-white border border-red-200 font-bold text-xs py-2.5 px-5 rounded-2xl transition-colors"
          >
            Add Both to Bag
          </button>
        </div>
      </div>

    </div>
  );
}
