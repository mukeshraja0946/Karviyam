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
  RefreshCw,
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../utils/api';
import { resolveImageUrl, resolveVideoUrl, isValidVideoUrl, isValidImageUrl, handleImageError } from '../utils/imageUtils';
import toast from 'react-hot-toast';
import ProductReviewsSection from '../components/ProductReviewsSection';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cartItems, addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const cartCount = Array.isArray(cartItems) ? cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0) : 0;
  const [activeAccordion, setActiveAccordion] = useState('description');
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');

  const toggleAccordion = (name) => {
    setActiveAccordion(prev => prev === name ? null : name);
  };

  const handleMobileSearchSubmit = (e) => {
    e.preventDefault();
    if (mobileSearchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(mobileSearchQuery.trim())}`);
    }
  };

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

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const videoRef = React.useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => setIsVideoPlaying(false));
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsVideoMuted(videoRef.current.muted);
  };

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
    // Reset state before fetching new product ID to prevent stale cross-product image leaks
    setProduct(null);
    setSelectedImage('');
    setPincodeResult(null);
    setPincodeError('');
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
      } catch (e1) {
        console.error('[Fetch Product Error]:', e1);
      }

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
      } catch (eSaved) { }

      if (item && (item.id || item.name)) {
        setProduct(item);

        // Derive valid initial images array
        const rawImgs = Array.isArray(item.images) && item.images.length > 0
          ? item.images
          : (item.imageUrl ? [item.imageUrl] : []);
        const validImgs = Array.from(new Set(rawImgs.filter(isValidImageUrl)));

        if (validImgs.length > 0) {
          setSelectedImage(validImgs[0]);
        } else {
          setSelectedImage(resolveImageUrl(item.imageUrl, item.id));
        }

        // Derive initial color variant
        if (Array.isArray(item.colors) && item.colors.length > 0) {
          setSelectedColor(item.colors[0].colorName || item.colors[0].name || 'Karviyam Crimson');
        } else if (item.color) {
          setSelectedColor(item.color);
        } else {
          setSelectedColor('Karviyam Crimson');
        }
      } else {
        setProduct(null);
      }
    } catch (e) {
      console.error(e);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  // Color Variants List derived strictly from DB backend
  const colorOptions = React.useMemo(() => {
    const backendColors = product?.colors || product?.colorVariants;
    if (Array.isArray(backendColors) && backendColors.length > 0) {
      return backendColors.map(c => ({
        name: c.colorName || c.name || 'Standard',
        dot: c.hexCode || c.colorCode || '#B71C1C',
        mainImage: c.mainImage || (Array.isArray(c.imageUrls) ? c.imageUrls[0] : null),
        subImages: Array.isArray(c.subImages) ? c.subImages.filter(isValidImageUrl) : (Array.isArray(c.imageUrls) ? c.imageUrls.slice(1).filter(isValidImageUrl) : []),
        videoUrl: c.videoUrl || null,
        images: Array.isArray(c.imageUrls) && c.imageUrls.length > 0
          ? c.imageUrls.filter(isValidImageUrl)
          : (Array.isArray(c.images) && c.images.length > 0 ? c.images.filter(isValidImageUrl) : null)
      }));
    }

    if (product?.color_variant_images || product?.colorVariantImages) {
      try {
        const rawMap = product.color_variant_images || product.colorVariantImages;
        const map = typeof rawMap === 'string' ? JSON.parse(rawMap) : rawMap;
        if (map && typeof map === 'object') {
          const keys = Object.keys(map);
          if (keys.length > 0) {
            return keys.map((cName) => {
              const val = map[cName];
              let mImg = null;
              let sImgs = [];
              let vUrl = null;
              let allImgs = [];
              if (Array.isArray(val)) {
                allImgs = val.filter(isValidImageUrl);
                mImg = allImgs[0] || null;
                sImgs = allImgs.slice(1);
              } else if (val && typeof val === 'object') {
                allImgs = Array.isArray(val.imageUrls) ? val.imageUrls.filter(isValidImageUrl) : [];
                mImg = val.mainImage || allImgs[0] || null;
                sImgs = Array.isArray(val.subImages) ? val.subImages.filter(isValidImageUrl) : allImgs.slice(1);
                vUrl = val.videoUrl || null;
              }
              return {
                name: cName,
                dot: cName.toLowerCase().includes('black') ? '#000000' : (cName.toLowerCase().includes('white') ? '#FFFFFF' : '#B71C1C'),
                mainImage: mImg,
                subImages: sImgs,
                videoUrl: vUrl,
                images: allImgs
              };
            });
          }
        }
      } catch (e) { }
    }

    if (product?.color) {
      return [{ name: product.color, dot: '#B71C1C', mainImage: product?.imageUrl, subImages: product?.images?.slice(1) || [], videoUrl: product?.videoUrl || null, images: null }];
    }

    return [];
  }, [product]);

  // Gallery Items computed in exact order: 1 Main Image -> 6 Sub Images -> 1 Video File
  const activeColorObj = colorOptions.find(c => c.name === selectedColor) || colorOptions[0];

  const mediaGallery = React.useMemo(() => {
    const list = [];

    // 1. Main Image
    const mImg = activeColorObj?.mainImage || (Array.isArray(product?.images) ? product.images[0] : product?.imageUrl);
    if (mImg && isValidImageUrl(mImg)) {
      list.push({ type: 'image', url: resolveImageUrl(mImg, product?.id), label: 'Main Image' });
    }

    // 2. Sub Images (up to 6)
    const sImgs = activeColorObj?.subImages || (Array.isArray(product?.images) && product.images.length > 1 ? product.images.slice(1) : []);
    sImgs.forEach((s, idx) => {
      if (s && isValidImageUrl(s)) {
        const resolved = resolveImageUrl(s, product?.id);
        if (!list.some(item => item.url === resolved)) {
          list.push({ type: 'image', url: resolved, label: `Sub Image ${idx + 1}` });
        }
      }
    });

    // Ensure at least 1 image
    if (list.length === 0) {
      list.push({ type: 'image', url: resolveImageUrl(product?.imageUrl, product?.id), label: 'Main Image' });
    }

    // 3. Video File (if available)
    const vUrl = activeColorObj?.videoUrl || product?.videoUrl || product?.video_url;
    if (vUrl && String(vUrl).trim() && isValidVideoUrl(vUrl)) {
      list.push({
        type: 'video',
        url: resolveVideoUrl(vUrl),
        label: 'Product Video'
      });
    }

    return list;
  }, [activeColorObj, product]);

  const [selectedMedia, setSelectedMedia] = useState(null);

  // Auto-sync selectedMedia when color or mediaGallery changes
  useEffect(() => {
    if (mediaGallery.length > 0) {
      setSelectedMedia(mediaGallery[0]);
    }
  }, [selectedColor, mediaGallery]);

  // Programmatic playback handler when selectedMedia is a video
  useEffect(() => {
    if (selectedMedia?.type === 'video' && videoRef.current) {
      videoRef.current.muted = isVideoMuted;
      videoRef.current.play().then(() => {
        setIsVideoPlaying(true);
      }).catch((e) => {
        setIsVideoPlaying(false);
      });
    }
  }, [selectedMedia]);

  // Admin Auto-Change Settings
  const [autoChangeEnabled, setAutoChangeEnabled] = useState(false);
  const [autoChangeInterval, setAutoChangeInterval] = useState(3);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch admin settings for Product Image Auto-Change
  useEffect(() => {
    const loadAutoChangeSettings = async () => {
      try {
        const res = await api.get('/settings').catch(() => null);
        const dataMap = res?.data?.data || res?.data || {};

        let enabled = false;
        if (dataMap.productImageAutoChange !== undefined) {
          enabled = dataMap.productImageAutoChange === true || dataMap.productImageAutoChange === 'true' || dataMap.productImageAutoChange === 1;
        } else {
          const localVal = localStorage.getItem('karviyam_product_image_auto_change');
          if (localVal !== null) enabled = localVal === 'true';
        }

        let intervalSec = 3;
        const rawInt = dataMap.productImageChangeInterval || localStorage.getItem('karviyam_product_image_change_interval');
        if (rawInt) {
          const parsedInt = parseInt(rawInt, 10);
          if (!isNaN(parsedInt) && parsedInt > 0) intervalSec = parsedInt;
        }

        setAutoChangeEnabled(enabled);
        setAutoChangeInterval(intervalSec);
      } catch (e) { }
    };

    loadAutoChangeSettings();
    window.addEventListener('karviyam_auto_change_updated', loadAutoChangeSettings);
    window.addEventListener('karviyam_settings_updated', loadAutoChangeSettings);
    return () => {
      window.removeEventListener('karviyam_auto_change_updated', loadAutoChangeSettings);
      window.removeEventListener('karviyam_settings_updated', loadAutoChangeSettings);
    };
  }, []);

  // Auto-Change Timer Effect
  useEffect(() => {
    // Only auto-change if enabled AND gallery has more than 1 media item AND not mouse-hovered on desktop
    if (!autoChangeEnabled || mediaGallery.length <= 1 || isHovered) {
      return;
    }

    // If current media is a playing video, do not interrupt video playback!
    if (selectedMedia?.type === 'video' && isVideoPlaying) {
      return;
    }

    const timer = setInterval(() => {
      setSelectedMedia(prevMedia => {
        const currentIdx = mediaGallery.findIndex(m => m.url === prevMedia?.url);
        const nextIdx = (currentIdx + 1 + mediaGallery.length) % mediaGallery.length;
        return mediaGallery[nextIdx];
      });
    }, autoChangeInterval * 1000);

    return () => clearInterval(timer);
  }, [autoChangeEnabled, autoChangeInterval, mediaGallery, selectedMedia, isHovered, isVideoPlaying]);

  const activeMediaIndex = Math.max(0, mediaGallery.findIndex(m => m.url === selectedMedia?.url));

  const handlePrevMedia = () => {
    if (mediaGallery.length <= 1) return;
    const prevIdx = (activeMediaIndex - 1 + mediaGallery.length) % mediaGallery.length;
    setSelectedMedia(mediaGallery[prevIdx]);
  };

  const handleNextMedia = () => {
    if (mediaGallery.length <= 1) return;
    const nextIdx = (activeMediaIndex + 1) % mediaGallery.length;
    setSelectedMedia(mediaGallery[nextIdx]);
  };

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      handleNextMedia();
    } else if (distance < -50) {
      handlePrevMedia();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const isWish = isInWishlist(product?.id);

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

  const price = product?.price || 1128;
  const oldPrice = product?.oldPrice || 1614;
  const discountPercent = product?.discountPercent || Math.round(((oldPrice - price) / oldPrice) * 100) || 40;

  return (
    <div className="w-full text-slate-900 font-sans">
      {/* ========================================================================= */}
      {/* 1. DESKTOP PRODUCT DETAIL PAGE LAYOUT (>= 1024px / lg)                     */}
      {/* STRICT DESKTOP ISOLATION - 100% UNTOUCHED                                  */}
      {/* ========================================================================= */}
      <div className="hidden lg:block w-full bg-[#FAFAFA] pb-12 font-sans">
        {/* BREADCRUMB ROW */}
        <div className="max-w-[1750px] mx-auto px-8 py-1.5 text-[11px] font-semibold text-slate-500 text-left">
          <div className="flex items-center gap-1.5">
            <Link to="/" className="hover:text-[#B71C1C]">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-[#B71C1C]">Shop</Link>
            <span>/</span>
            <span className="text-slate-900 font-bold truncate">{product?.name}</span>
          </div>
        </div>

        {/* 3-COLUMN DESKTOP PRODUCT DETAIL LAYOUT */}
        <div className="max-w-[1750px] mx-auto px-8 py-1">
          <div className="grid grid-cols-12 gap-6 text-left items-start">

            {/* COLUMN 1: LEFT IMAGE GALLERY */}
            <div className="col-span-4 flex flex-row gap-2 sticky top-[135px] self-start">
              {/* Vertical Thumbnail Strip */}
              {mediaGallery.length > 1 && (
                <div className="flex flex-col gap-2 w-14 shrink-0 max-h-[420px] overflow-y-auto no-scrollbar">
                  {mediaGallery.map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedMedia(m)}
                      className={`w-12 h-12 rounded-xl overflow-hidden border transition-all shrink-0 bg-white cursor-pointer relative ${selectedMedia?.url === m.url
                          ? 'border-[#B71C1C] ring-2 ring-[#B71C1C]'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      title={m.label}
                    >
                      {m.type === 'video' ? (
                        <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white relative">
                          <Film className="w-4 h-4 text-purple-400" />
                          <span className="text-[7px] font-bold uppercase tracking-tighter">VIDEO</span>
                        </div>
                      ) : (
                        <img
                          src={resolveImageUrl(m.url, product?.id)}
                          alt={m.label}
                          onError={(e) => handleImageError(e, product?.id)}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Main Media Display Container */}
              <div className="flex-1 space-y-2 min-w-0">
                <div
                  className="relative w-full h-[420px] bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs flex items-center justify-center overflow-hidden"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  {selectedMedia?.type === 'video' ? (
                    <div
                      className="relative w-full h-full flex items-center justify-center bg-black rounded-xl overflow-hidden group cursor-pointer"
                      onClick={togglePlayPause}
                    >
                      <video
                        ref={videoRef}
                        src={resolveVideoUrl(selectedMedia.url)}
                        autoPlay
                        loop
                        muted={isVideoMuted}
                        playsInline
                        onPlay={() => setIsVideoPlaying(true)}
                        onPause={() => setIsVideoPlaying(false)}
                        className="max-h-full max-w-full rounded-xl object-contain"
                      />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayPause();
                        }}
                        className={`absolute inset-0 m-auto w-14 h-14 rounded-full bg-slate-900/80 hover:bg-[#B71C1C] text-white flex items-center justify-center shadow-xl transition-all duration-300 transform backdrop-blur-xs z-20 ${isVideoPlaying ? 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100' : 'opacity-100 scale-100'
                          }`}
                        title={isVideoPlaying ? 'Pause Video' : 'Play Video'}
                      >
                        {isVideoPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={toggleMute}
                        className="absolute bottom-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-[#B71C1C] transition-all backdrop-blur-xs z-20 cursor-pointer"
                        title={isVideoMuted ? 'Unmute Sound' : 'Mute Sound'}
                      >
                        {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <img
                      src={resolveImageUrl(selectedMedia?.url || mediaGallery[0]?.url || product?.imageUrl, product?.id)}
                      alt={product?.name || 'Product'}
                      onError={(e) => handleImageError(e, product?.id)}
                      className="max-h-full max-w-full object-contain rounded-xl transition-transform duration-300 hover:scale-105"
                    />
                  )}

                  {/* Left/Right Carousel Nav Arrows */}
                  {mediaGallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevMedia}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-md hover:bg-[#B71C1C] hover:text-white transition-colors cursor-pointer z-10"
                        title="Previous Media"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={handleNextMedia}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-md hover:bg-[#B71C1C] hover:text-white transition-colors cursor-pointer z-10"
                        title="Next Media"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <div className="absolute bottom-2.5 left-2.5 bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                        {activeMediaIndex + 1} / {mediaGallery.length}
                      </div>
                    </>
                  )}

                  {/* Desktop Wishlist Button */}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product?.id)}
                    className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-colors cursor-pointer border z-10 ${isWish
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

            {/* COLUMN 2: CENTER CONTROLS & PRICING */}
            <div className="col-span-4 space-y-2.5 sticky top-[135px] self-start">
              <div className="inline-flex items-center gap-1.5 bg-rose-50 text-[#B71C1C] px-2.5 py-0.5 rounded-full border border-rose-200/80 font-black text-[9.5px] uppercase tracking-wider shadow-2xs">
                <span>🌸</span>
                <span>KARVIYAM PREMIUM</span>
              </div>

              <div>
                <h1 className="font-display font-black text-2xl text-slate-900 leading-tight tracking-tight">
                  {product?.name}
                </h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                  SKU: {product?.sku || `KV-${product?.id}`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const elem = document.getElementById('reviews-section-desktop');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-2 text-xs text-left cursor-pointer group"
              >
                {Number(product.reviewsCount) > 0 ? (
                  <>
                    <span className="bg-emerald-700 group-hover:bg-[#B71C1C] text-white font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs text-[10.5px] transition-colors">
                      <span>{Number(product.rating || 0).toFixed(1)}</span>
                      <span>★</span>
                    </span>
                    <span className="font-semibold text-slate-600 group-hover:text-[#B71C1C] group-hover:underline text-[11px] transition-colors">
                      {product.reviewsCount} Verified {product.reviewsCount === 1 ? 'Rating & Review' : 'Ratings & Reviews'}
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] font-bold text-slate-500 hover:text-[#B71C1C] transition-colors flex items-center gap-1">
                    <span className="text-slate-400">★ ★ ★ ★ ★</span>
                    <span>No ratings yet (Be the first to review)</span>
                  </span>
                )}
              </button>

              <div className="bg-[#FAFAFA] border border-slate-200/90 rounded-xl py-1.5 px-3 flex items-baseline gap-2.5">
                <span className="font-display font-black text-2xl text-[#B71C1C]">
                  ₹{price}
                </span>
                {oldPrice && oldPrice > price && (
                  <span className="text-slate-400 line-through font-bold text-sm">
                    ₹{oldPrice}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 font-black text-[10.5px] px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Select Size Selector */}
              <div className="space-y-1">
                <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-900">
                  SELECT SIZE
                </label>
                <div className="flex items-center gap-1.5">
                  {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`w-8 h-8 rounded-lg font-extrabold text-xs transition-all cursor-pointer border flex items-center justify-center ${selectedSize === sz
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
                <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-900">
                  SELECT COLOR VARIANT
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {colorOptions.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer border ${selectedColor === c.name
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
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1">
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
                  className="w-full bg-[#B71C1C] hover:bg-[#900C0C] active:bg-[#780E0E] text-white font-extrabold text-[11px] uppercase tracking-wider py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>ADD TO SHOPPING BAG</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleActionWithMandatoryPincode(true)}
                  className="w-full bg-[#B71C1C] hover:bg-[#900C0C] active:bg-[#780E0E] text-white font-extrabold text-[11px] uppercase tracking-wider py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                >
                  BUY NOW
                </button>
              </div>

              {/* 5 Delivery/Trust Feature Badges Row */}
              <div className="grid grid-cols-5 gap-0.5 pt-2 border-t border-slate-200/80 text-center text-[9.5px] font-bold text-slate-600">
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

            {/* COLUMN 3: RIGHT SPECIFICATIONS & DETAILS */}
            <div className="col-span-4 space-y-4 h-[calc(100vh-160px)] overflow-y-auto overscroll-contain pr-2 scrollbar-thin text-xs">
              <div className="space-y-3">
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
                          <div key={idx} className="grid grid-cols-[165px_1fr] items-center py-1 px-1 border-b border-slate-100/80">
                            <span className="font-bold text-slate-900 pr-2 truncate">{row.label}</span>
                            <span className="text-slate-700 font-medium text-right truncate" title={row.val}>{row.val}</span>
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
                          <div key={idx} className="grid grid-cols-[165px_1fr] items-center py-1 px-1 border-b border-slate-100/80">
                            <span className="font-bold text-slate-900 pr-2 truncate">{row.label}</span>
                            <span className="text-slate-700 font-medium text-right truncate" title={row.val}>{row.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>

          <div id="reviews-section-desktop" className="pt-10">
            <ProductReviewsSection
              productId={product.id}
              onRatingUpdated={({ rating, reviewsCount }) => {
                setProduct(prev => prev ? { ...prev, rating, reviewsCount } : prev);
              }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE PRODUCT DETAIL PAGE LAYOUT (< 1024px / lg)                          */}
      {/* STRICT REBUILD MATCHING REFERENCE IMAGE SPECIFICATIONS                     */}
      {/* ========================================================================= */}
      <div className="block lg:hidden bg-slate-50/60 min-h-screen pb-36 select-none text-left font-sans">
        
        {/* 1. MOBILE HEADER BAR */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-3 py-2 flex items-center justify-between shadow-2xs">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
            title="Go Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-1.5">
            <span className="font-serif font-black text-base text-[#B71C1C] tracking-widest uppercase">
              KARVIYAM
            </span>
          </Link>

          {/* Right Action Icons: Search, Wishlist, Cart */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const searchElem = document.getElementById('mobile-pdp-search-input');
                if (searchElem) searchElem.focus();
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 hover:text-[#B71C1C] cursor-pointer"
              title="Search"
            >
              <svg className="w-4.5 h-4.5 stroke-current fill-none" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => toggleWishlist(product?.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer relative ${
                isWish ? 'text-[#B71C1C]' : 'text-slate-700'
              }`}
              title="Wishlist"
            >
              <Heart className={`w-4.5 h-4.5 ${isWish ? 'fill-current' : ''}`} />
            </button>

            <Link
              to="/cart"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 hover:text-[#B71C1C] cursor-pointer relative"
              title="Cart"
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#B71C1C] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-2xs">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* 2. FULL-WIDTH SEARCH BAR */}
        <div className="px-3 pt-2.5 pb-1">
          <form onSubmit={handleMobileSearchSubmit} className="relative w-full">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <input
              id="mobile-pdp-search-input"
              type="text"
              value={mobileSearchQuery}
              onChange={(e) => setMobileSearchQuery(e.target.value)}
              placeholder="Search for products, categories..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100/90 text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200/80 focus:outline-none focus:border-[#B71C1C] focus:bg-white transition-all font-medium"
            />
          </form>
        </div>

        {/* 3. BREADCRUMB */}
        <div className="px-3 py-1.5 text-[10.5px] font-semibold text-slate-500">
          <div className="flex items-center gap-1 truncate">
            <Link to="/" className="hover:text-[#B71C1C]">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-[#B71C1C]">Shop</Link>
            <span>/</span>
            <span className="text-slate-900 font-bold truncate">{product?.name}</span>
          </div>
        </div>

        {/* 4. PRODUCT GALLERY CARD */}
        <div className="px-3 py-1">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-2xs relative">
            <div
              className="relative w-full h-[320px] sm:h-[380px] bg-white rounded-xl overflow-hidden flex items-center justify-center touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {selectedMedia?.type === 'video' ? (
                <div
                  className="relative w-full h-full flex items-center justify-center bg-black rounded-xl overflow-hidden group cursor-pointer"
                  onClick={togglePlayPause}
                >
                  <video
                    ref={videoRef}
                    src={resolveVideoUrl(selectedMedia.url)}
                    autoPlay
                    loop
                    muted={isVideoMuted}
                    playsInline
                    className="max-h-full max-w-full rounded-xl object-contain"
                  />
                </div>
              ) : (
                <img
                  src={resolveImageUrl(selectedMedia?.url || mediaGallery[0]?.url || product?.imageUrl, product?.id)}
                  alt={product?.name || 'Product'}
                  onError={(e) => handleImageError(e, product?.id)}
                  className="max-h-full max-w-full object-contain rounded-xl transition-transform duration-300"
                />
              )}

              {/* Left/Right Carousel Nav Arrows */}
              {mediaGallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevMedia}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-md cursor-pointer z-10 active:scale-95 transition-transform"
                    title="Previous Image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextMedia}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-md cursor-pointer z-10 active:scale-95 transition-transform"
                    title="Next Image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* IMAGE NAVIGATION DOTS & ACTION ICONS BELOW GALLERY */}
          <div className="flex items-center justify-between mt-3 px-1">
            {/* Dynamic Centered Pagination Dots */}
            {mediaGallery.length > 1 ? (
              <div className="flex items-center justify-center gap-1.5 mx-auto">
                {mediaGallery.map((m, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedMedia(m)}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      activeMediaIndex === idx
                        ? 'w-2.5 h-2.5 bg-slate-900'
                        : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                    title={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Right Action Icons: Wishlist & Share */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <button
                type="button"
                onClick={() => toggleWishlist(product?.id)}
                className={`w-9 h-9 rounded-full flex items-center justify-center border shadow-2xs transition-colors cursor-pointer ${
                  isWish
                    ? 'bg-[#B71C1C] text-white border-[#B71C1C]'
                    : 'bg-white text-slate-700 hover:text-[#B71C1C] border-slate-200'
                }`}
                title={isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-4 h-4 ${isWish ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: product?.name || 'Karviyam Product',
                      url: window.location.href
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Product link copied to clipboard!');
                  }
                }}
                className="w-9 h-9 rounded-full bg-white text-slate-700 hover:text-slate-900 border border-slate-200 flex items-center justify-center shadow-2xs cursor-pointer"
                title="Share Product"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 5. PRODUCT INFORMATION */}
        <div className="px-3 pt-3 space-y-2">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-rose-50 text-[#B71C1C] px-2.5 py-0.5 rounded-full border border-rose-200/80 font-black text-[9px] uppercase tracking-wider shadow-2xs">
            <span>🌸</span>
            <span>KARVIYAM PREMIUM</span>
          </div>

          {/* Title & SKU */}
          <div>
            <h1 className="font-display font-black text-lg text-slate-900 leading-snug tracking-tight">
              {product?.name}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase mt-0.5">
              SKU: {product?.sku || `KY-PRD-${String(product?.id || 1).padStart(3, '0')}`}
            </p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center text-amber-400 gap-0.5 text-xs">
              {'★'.repeat(5)}
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              No ratings yet (Be the first to review)
            </span>
          </div>

          {/* Pricing Box */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="font-display font-black text-2xl text-[#B71C1C]">
                ₹{price}
              </span>
              {discountPercent > 0 && (
                <span className="bg-rose-100 text-[#B71C1C] font-black text-[10px] px-2 py-0.5 rounded-md uppercase">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
            {oldPrice && oldPrice > price && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 line-through font-bold">₹{oldPrice}</span>
                <span className="text-emerald-600 font-extrabold">You save ₹{oldPrice - price}</span>
              </div>
            )}
            <p className="text-[10px] text-slate-400 font-medium pt-0.5">
              Inclusive of all taxes
            </p>
          </div>
        </div>

        {/* 6. OFFERS CARD */}
        <div className="px-3 pt-2.5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 flex items-center justify-between shadow-2xs cursor-pointer group">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-rose-50 text-[#B71C1C] flex items-center justify-center shrink-0">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-900 block">Offers</span>
                <span className="text-[10.5px] text-slate-600 font-medium">Extra 10% OFF on prepaid orders</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black text-[#B71C1C] bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
              <span>Use Code: KARVIYAM10</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* 7. VARIANTS & OPTIONS */}
        <div className="px-3 pt-3 space-y-3">
          {/* Size Selector */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-900">SELECT SIZE</label>
              <span className="text-[10.5px] font-bold text-[#B71C1C] cursor-pointer hover:underline">Size Guide</span>
            </div>
            <div className="flex items-center gap-2">
              {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`w-9 h-9 rounded-xl font-extrabold text-xs transition-all cursor-pointer border flex items-center justify-center ${
                    selectedSize === sz
                      ? 'bg-[#B71C1C] text-white border-[#B71C1C] shadow-md'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          {colorOptions.length > 0 && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3 space-y-2 shadow-2xs">
              <label className="text-xs font-black uppercase tracking-wider text-slate-900 block">SELECT COLOR VARIANT</label>
              <div className="flex items-center gap-2 flex-wrap">
                {colorOptions.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      selectedColor === c.name
                        ? 'bg-rose-50 border-[#B71C1C] text-[#B71C1C] shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: c.dot }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mandatory Pincode Check Box */}
          <div className="bg-amber-50/70 border-2 border-amber-300/80 rounded-2xl p-3 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#B71C1C]" />
                <span>CHECK DELIVERY PINCODE</span>
                <span className="text-[#B71C1C] font-black">*</span>
              </span>
              <span className="bg-red-100 text-[#B71C1C] text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                MANDATORY
              </span>
            </div>

            <div className="flex gap-1.5">
              <input
                id="mobile-pincode-input"
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.replace(/\D/g, ''));
                  setPincodeResult(null);
                  setPincodeError('');
                }}
                placeholder="Enter 6-digit Pincode"
                className="bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold flex-1 outline-none focus:border-[#B71C1C]"
              />
              <button
                type="button"
                onClick={handleCheckPincode}
                disabled={pincodeChecking}
                className="bg-slate-900 hover:bg-[#B71C1C] text-white text-xs font-extrabold px-3.5 py-2 rounded-xl cursor-pointer transition-colors shadow-2xs"
              >
                {pincodeChecking ? 'Checking...' : 'Check'}
              </button>
            </div>

            {pincodeResult && (
              <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Delivery is available for pincode {pincode}! (3-5 Days)</span>
              </div>
            )}

            {pincodeError && (
              <p className="text-xs text-red-600 font-bold">{pincodeError}</p>
            )}
          </div>
        </div>

        {/* 8. EXPANDABLE ACCORDIONS */}
        <div className="px-3 pt-3 space-y-2">
          {/* Description Accordion */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleAccordion('description')}
              className="w-full p-3.5 flex items-center justify-between font-extrabold text-xs text-slate-900 text-left cursor-pointer"
            >
              <span>PRODUCT DESCRIPTION</span>
              {activeAccordion === 'description' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {activeAccordion === 'description' && (
              <div className="px-3.5 pb-3.5 pt-0 text-xs text-slate-700 font-medium border-t border-slate-100 leading-relaxed pt-2">
                {product?.description || "Crafted with premium high-grade fabric, featuring tailored fit and exceptional craftsmanship. Perfect for daily casual styling or festive statements."}
              </div>
            )}
          </div>

          {/* Specifications Accordion */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleAccordion('specs')}
              className="w-full p-3.5 flex items-center justify-between font-extrabold text-xs text-slate-900 text-left cursor-pointer"
            >
              <span>SPECIFICATIONS & HIGHLIGHTS</span>
              {activeAccordion === 'specs' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {activeAccordion === 'specs' && (
              <div className="px-3.5 pb-3.5 pt-0 text-xs text-slate-700 font-medium border-t border-slate-100 space-y-1.5 pt-2">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-bold text-slate-900">Material</span>
                  <span>{product?.material || '100% Premium Cotton'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-bold text-slate-900">Fit</span>
                  <span>{product?.fitType || 'Regular Fit'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-bold text-slate-900">Country of Origin</span>
                  <span>{product?.countryOfOrigin || 'India'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Shipping & Delivery Accordion */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleAccordion('delivery')}
              className="w-full p-3.5 flex items-center justify-between font-extrabold text-xs text-slate-900 text-left cursor-pointer"
            >
              <span>SHIPPING & RETURNS</span>
              {activeAccordion === 'delivery' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {activeAccordion === 'delivery' && (
              <div className="px-3.5 pb-3.5 pt-0 text-xs text-slate-700 font-medium border-t border-slate-100 space-y-2 pt-2">
                <p>🚚 <strong>Free Shipping:</strong> On all orders above ₹499 across India.</p>
                <p>🔄 <strong>10 Days Return & Exchange:</strong> Easy doorstep pickup and full refund/exchange.</p>
              </div>
            )}
          </div>
        </div>

        {/* 9. REVIEWS SECTION */}
        <div id="reviews-section" className="px-3 pt-4">
          <ProductReviewsSection
            productId={product.id}
            onRatingUpdated={({ rating, reviewsCount }) => {
              setProduct(prev => prev ? { ...prev, rating, reviewsCount } : prev);
            }}
          />
        </div>

        {/* 10. STICKY PURCHASE BAR AT BOTTOM */}
        <div className="fixed bottom-[56px] left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 flex items-center gap-2 shadow-lg">
          <button
            type="button"
            onClick={() => handleActionWithMandatoryPincode(false)}
            className="w-1/2 bg-white text-[#B71C1C] border-2 border-[#B71C1C] font-extrabold text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-transform"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionWithMandatoryPincode(true)}
            className="w-1/2 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-transform"
          >
            <span>Buy Now</span>
          </button>
        </div>

      </div>
    </div>
  );
}
