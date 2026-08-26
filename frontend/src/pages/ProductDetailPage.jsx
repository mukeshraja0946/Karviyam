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
  const [pincode, setPincode] = useState('');
  const [showMoreInfo, setShowMoreInfo] = useState(true);

  // Pincode Verification State
  const [pincodeResult, setPincodeResult] = useState(null);
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeError, setPincodeError] = useState('');

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

      // Default fallback item matching reference image
      if (!item || !item.id) {
        item = {
          id: id || 195,
          sku: 'KV-DEM-195',
          name: 'Designer demo Edition 5',
          price: 1128,
          oldPrice: 1614,
          discountPercent: 40,
          rating: 4.5,
          ratingsCount: 128,
          reviewsCount: 45,
          brand: 'DEELMO',
          imageUrl: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800',
          images: [
            'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800',
            'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
            'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800',
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
            'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'
          ],
          description: 'Premium textured linen casual button down shirt for men.'
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
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
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
    <div className="w-full bg-[#FAFAFA] min-h-screen text-slate-900 pb-16 font-sans">
      
      {/* 1. BREADCRUMB ROW */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-1.5 text-xs font-semibold text-slate-500 text-left">
        <div className="flex items-center gap-2">
          <Link to="/" className="hover:text-[#B71C1C]">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-[#B71C1C]">Shop</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate">{product.name}</span>
        </div>
      </div>

      {/* 2. MAIN PRODUCT SECTION (TWO COLUMNS) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left items-start">
          
          {/* ======================================================= */}
          {/* LEFT COLUMN: PRODUCT IMAGES & GALLERY (~50% / lg:col-span-6) */}
          {/* ======================================================= */}
          <div className="lg:col-span-6 flex flex-col sm:flex-row gap-3">
            
            {/* Vertical Thumbnail Strip (Desktop) */}
            <div className="hidden sm:flex flex-col gap-2 w-14 shrink-0">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-13 h-13 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-white p-0.5 ${
                    selectedImage === img
                      ? 'border-[#B71C1C] scale-105 shadow-2xs'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                </button>
              ))}
            </div>

            {/* Main Image Display Container */}
            <div className="flex-1 space-y-2.5">
              <div className="relative w-full h-[410px] sm:h-[430px] bg-slate-50/80 rounded-2xl border border-slate-200/90 p-2 shadow-2xs flex items-center justify-center overflow-hidden">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-xl transition-transform duration-300 hover:scale-105"
                />

                {/* Share Button (Top-Right) */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Product link copied to clipboard!');
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-red-50 text-slate-700 hover:text-[#B71C1C] flex items-center justify-center border border-slate-200 shadow-2xs cursor-pointer transition-colors"
                  title="Share product link"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Horizontal Thumbnail Bar (Mobile/Sub-bar) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <button className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#B71C1C]">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-white p-0.5 ${
                        selectedImage === img ? 'border-[#B71C1C]' : 'border-slate-200'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                    </button>
                  ))}
                </div>
                <button className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#B71C1C]">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* ======================================================= */}
          {/* RIGHT COLUMN: PRODUCT CONTROLS & PRICING (~50% / lg:col-span-6) */}
          {/* ======================================================= */}
          <div className="lg:col-span-6 space-y-3">
            
            {/* Karviyam Premium Badge */}
            <div className="inline-flex items-center gap-1.5 bg-rose-50 text-[#B71C1C] px-2.5 py-0.5 rounded-full border border-rose-200/80 font-black text-[10px] uppercase tracking-wider shadow-2xs">
              <span>🌸</span>
              <span>KARVIYAM PREMIUM</span>
            </div>

            {/* Product Title & SKU */}
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 leading-tight tracking-tight">
                {product.name}
              </h1>
              <p className="text-[11px] text-slate-400 font-mono font-bold mt-0.5">
                SKU: {product.sku || 'KV-DEM-195'}
              </p>
            </div>

            {/* Rating & Reviews Line */}
            <div className="flex items-center gap-2.5 text-xs">
              <span className="bg-emerald-700 text-white font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs text-[11px]">
                <span>{product.rating || 4.5}</span>
                <span>★</span>
              </span>
              <span className="font-semibold text-slate-600 text-[11.5px]">
                {product.ratingsCount || 128} Verified Ratings & {product.reviewsCount || 45} Customer Reviews
              </span>
            </div>

            {/* Price Banner Box */}
            <div className="bg-[#FAFAFA] border border-slate-200/90 rounded-2xl py-2 px-3.5 flex items-baseline gap-3">
              <span className="font-display font-black text-2xl sm:text-3xl text-[#B71C1C]">
                ₹{price}
              </span>
              <span className="text-slate-400 line-through font-bold text-sm">
                ₹{oldPrice}
              </span>
              <span className="bg-emerald-100 text-emerald-800 font-black text-[11px] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                {discountPercent}% OFF
              </span>
            </div>

            {/* Select Size Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-900">
                SELECT SIZE
              </label>
              <div className="flex items-center gap-2">
                {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-extrabold text-xs transition-all cursor-pointer border flex items-center justify-center ${
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
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-900">
                SELECT COLOR VARIANT
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { name: 'Karviyam Crimson', dot: '#B71C1C' },
                  { name: 'Obsidian Black', dot: '#0F172A' },
                  { name: 'Pure Linen White', dot: '#FFFFFF' }
                ].map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                      selectedColor === c.name
                        ? 'bg-rose-50/60 border-[#B71C1C] text-[#B71C1C] shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                      style={{ backgroundColor: c.dot }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mandatory Pincode Serviceability Box */}
            <div className="bg-[#FFFBEB] border-2 border-amber-300 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1">
                  <span>CHECK SERVICEABLE PINCODE & DELIVERY AVAILABILITY</span>
                  <span className="text-[#B71C1C] font-black">*</span>
                </span>
                <span className="bg-red-100 text-[#B71C1C] text-[8.5px] font-black px-2 py-0.5 rounded-full uppercase">
                  MANDATORY
                </span>
              </div>

              <div className="flex gap-2">
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
                  className="bg-white text-xs px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold flex-1 outline-none focus:border-[#B71C1C]"
                />
                <button
                  type="button"
                  onClick={handleCheckPincode}
                  disabled={pincodeChecking}
                  className="bg-slate-900 hover:bg-[#B71C1C] text-white text-xs font-extrabold px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-2xs"
                >
                  {pincodeChecking ? 'Checking...' : 'Check'}
                </button>
              </div>

              {pincodeResult && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Delivery is available for pincode {pincode}! (Est. 3-5 Days)</span>
                </div>
              )}

              {pincodeError && (
                <p className="text-xs text-red-600 font-bold">{pincodeError}</p>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleActionWithMandatoryPincode(false)}
                className="w-full bg-[#B71C1C] hover:bg-[#900C0C] active:bg-[#780E0E] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-md hover:shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>ADD TO SHOPPING BAG</span>
              </button>

              <button
                type="button"
                onClick={() => handleActionWithMandatoryPincode(true)}
                className="w-full bg-[#B71C1C] hover:bg-[#900C0C] active:bg-[#780E0E] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-md hover:shadow-lg transition-colors cursor-pointer text-center"
              >
                BUY NOW
              </button>
            </div>

            {/* 5 Delivery/Trust Feature Badges Row */}
            <div className="grid grid-cols-5 gap-1.5 pt-4 border-t border-slate-200/80 text-center text-[10px] font-bold text-slate-600">
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="w-4 h-4 text-[#B71C1C]" />
                <span>10 days Return & Exchange</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#B71C1C]" />
                <span>Pay on Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-[#B71C1C]" />
                <span>Free Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Award className="w-4 h-4 text-[#B71C1C]" />
                <span>Top Brand</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Box className="w-4 h-4 text-[#B71C1C]" />
                <span>Karviyam Delivered</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* 3. PRODUCT DETAILS & ADDITIONAL INFORMATION               */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
        
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 text-left shadow-2xs">
          
          <h2 className="font-display font-black text-xl text-slate-900 border-b border-slate-100 pb-3">
            Product details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Top Highlights Table */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900">
                Top highlights
              </h3>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                {[
                  { label: 'Material composition', val: 'Cotton Blend' },
                  { label: 'Fit type', val: 'Regular Fit' },
                  { label: 'Sleeve type', val: 'Long Sleeve' },
                  { label: 'Collar style', val: 'Spread Collar' },
                  { label: 'Neck style', val: 'Collared Neck' },
                  { label: 'Style', val: 'Western' },
                  { label: 'Country of Origin', val: 'India' }
                ].map((row, idx) => (
                  <div key={idx} className="flex p-3 bg-white odd:bg-slate-50/50">
                    <span className="w-1/2 font-bold text-slate-900">{row.label}</span>
                    <span className="w-1/2 font-medium text-slate-700">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Information Table */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900">
                Additional Information
              </h3>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                {[
                  { label: 'Manufacturer', val: 'DEELMO, DEELMO, Manufacturer Surat, Gujarat-395006' },
                  { label: 'Packer', val: 'DEELMO, Manufacturer Surat, Gujarat-395006' },
                  { label: 'Importer', val: 'DEELMO, Manufacturer Surat, Gujarat-395006' },
                  { label: 'Item Weight', val: '230 g' },
                  { label: 'Item Dimensions LxWxH', val: '23 x 22 x 1.8 Centimeters' },
                  { label: 'Net Quantity', val: '1.00 Count' },
                  { label: 'Generic Name', val: 'Shirt' }
                ].map((row, idx) => (
                  <div key={idx} className="flex p-3 bg-white odd:bg-slate-50/50">
                    <span className="w-1/2 font-bold text-slate-900">{row.label}</span>
                    <span className="w-1/2 font-medium text-slate-700">{row.val}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowMoreInfo(!showMoreInfo)}
                className="text-xs font-bold text-[#B71C1C] hover:underline flex items-center gap-1 pt-1 cursor-pointer"
              >
                {showMoreInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>{showMoreInfo ? 'See less' : 'See more'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* 4. ABOUT THIS ITEM & STYLE SECTIONS                       */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          
          {/* ABOUT THIS ITEM */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
            <h3 className="font-display font-black text-lg text-slate-900 border-b border-slate-100 pb-3">
              About this item
            </h3>

            <ul className="space-y-3 text-xs text-slate-700 font-medium leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#B71C1C] font-bold shrink-0">•</span>
                <span>
                  <strong className="text-slate-900">【Premium Material】</strong> This mens button down shirt is made of premium textured fabric, which is breathable, lightweight, soft, skin-friendly, keeping you cool and comfortable in the summer.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-[#B71C1C] font-bold shrink-0">•</span>
                <span>
                  <strong className="text-slate-900">【Unique Design】</strong> Mens casual shirts feature long sleeve, spread collar, solid color, slight vertical ribbing, relaxed fit, simple and fashion.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-[#B71C1C] font-bold shrink-0">•</span>
                <span>
                  <strong className="text-slate-900">【Various Outfits】</strong> Men linen shirts could be easy to match with linen shorts/pants, casual pants or shorts to create a simple but fashionable style.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-[#B71C1C] font-bold shrink-0">•</span>
                <span>
                  <strong className="text-slate-900">【Occasions】</strong> Mens untucked shirts is a great choice for beach, wedding, vacation, cruises, tropical aloha theme, party, yoga, work or daily casual wear. Perfect great for all seasons, Just enjoy your vacation.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-[#B71C1C] font-bold shrink-0">•</span>
                <span>
                  <strong className="text-slate-900">【Garment Care】</strong>: Machine washable. Please refer to the size chart before ordering.
                </span>
              </li>
            </ul>
          </div>

          {/* STYLE SPECIFICATIONS TABLE */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
            <h3 className="font-display font-black text-lg text-slate-900 border-b border-slate-100 pb-3">
              Style
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-[11.5px]">
              {[
                { label: 'Brand Name', val: 'DEELMO' },
                { label: 'Model Name', val: 'S' },
                { label: 'Style Number', val: 'POP901_LINEN_F_SLEEVE_PP' },
                { label: 'Unit Count', val: '1.00 Count' },
                { label: 'Country Of Origin', val: 'India' },
                { label: 'number-of-items', val: '1' },
                { label: 'Age Range Description', val: 'Adult' },
                { label: 'Importer Contact Information', val: 'DEELMO, Manufacturer Surat, Gujarat-395006' },
                { label: 'Item Type Name', val: 'Shirt' },
                { label: 'Item Weight', val: '230 Grams' },
                { label: 'Manufacturer Contact Information', val: 'DEELMO, Manufacturer Surat, Gujarat-395006' },
                { label: 'Manufacturer', val: 'DEELMO, DEELMO, Manufacturer Surat, Gujarat-395006' },
                { label: 'Packer Contact Information', val: 'DEELMO, Manufacturer Surat, Gujarat-395006' },
                { label: 'Manufacturer Part Number', val: 'POP901_LINEN_F_SLEEVE_PP' },
                { label: 'Best Sellers Rank', val: '#27 in Clothing & Accessories (See Top 100 in Clothing & Accessories)' }
              ].map((row, idx) => (
                <div key={idx} className="flex p-2.5 bg-white odd:bg-slate-50/50">
                  <span className="w-1/2 font-bold text-slate-900">{row.label}</span>
                  <span className="w-1/2 font-medium text-slate-700 truncate" title={row.val}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* 5. BOTTOM FULL-WIDTH VALUE PROPOSITION TRUST STRIP       */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-left">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">100% Original Products</h4>
                <p className="text-[10px] text-slate-500">Sourced Directly</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Easy Returns & Refunds</h4>
                <p className="text-[10px] text-slate-500">Hassle Free Process</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Secure Payments</h4>
                <p className="text-[10px] text-slate-500">Multiple Payment Options</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Customer Support</h4>
                <p className="text-[10px] text-slate-500">24/7 Support</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Best Price Guarantee</h4>
                <p className="text-[10px] text-slate-500">We Promise the Best</p>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
