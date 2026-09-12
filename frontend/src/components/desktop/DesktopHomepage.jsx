import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  Tag,
  Truck,
  RotateCcw,
  ShieldCheck,
  Headphones,
  Sparkles,
  ArrowRight,
  Send,
  Flame,
  Percent,
  CheckCircle2,
  Award,
  Crown,
  TrendingUp,
  ShoppingBag,
  Clock,
  ThumbsUp
} from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import api from '../../utils/api';
import { resolveImageUrl, handleImageError } from '../../utils/imageUtils';
import FindYourPrice from '../FindYourPrice';
import WhyShopWithKarviyam from '../WhyShopWithKarviyam';
import toast from 'react-hot-toast';

export default function DesktopHomepage() {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroBanners, setHeroBanners] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [categories, setCategories] = useState([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  // Category Carousel Ref
  const categoryScrollRef = useRef(null);

  // Fetch Banners
  const fetchBanners = async () => {
    try {
      const res = await api.get('/banners').catch(() => null);
      const data = res?.data?.data || res?.data;
      if (Array.isArray(data)) {
        const active = data.filter(b => b.isActive !== false && String(b.status || 'active').toLowerCase() === 'active');
        const formatted = active.map(b => ({
          id: b.id,
          title: b.title || 'EXPLORE EXCLUSIVE FASHION DROPS',
          subtitle: b.subtitle || 'Discover premium streetwear, ethnic fusion & accessories',
          badge: b.tag || 'SEASONAL HIGHLIGHT',
          image: resolveImageUrl(b.desktopImageUrl || b.imageUrl || b.image_url || b.imagePath || b.image, b.id),
          buttonText: b.buttonText || b.button_text || b.cta || 'SHOP NOW',
          link: b.buttonLink || b.link || '/shop'
        }));
        setHeroBanners(formatted);
      }
    } catch (e) {}
  };

  // Fetch Parent Categories
  const fetchParentCategories = async () => {
    try {
      const res = await api.get('/parent-categories').catch(() => null);
      const data = res?.data?.data || res?.data;
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map(c => ({
          id: c.id,
          name: c.name,
          image: resolveImageUrl(c.imageUrl || c.image_url || c.imagePath || c.image, c.id),
          link: c.link || `/shop?category=${encodeURIComponent(c.name)}`
        }));
        setCategories(formatted);
      }
    } catch (e) {}
  };

  // Fetch Homepage Sections
  const fetchHomepageSections = async () => {
    setLoading(true);
    try {
      const res = await api.get('/homepage-sections').catch(() => null);
      const data = res?.data?.data || res?.data;
      if (Array.isArray(data)) {
        setSections(data.sort((a, b) => (parseInt(a.position) || 0) - (parseInt(b.position) || 0)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchParentCategories();
    fetchHomepageSections();

    const handleUpdate = () => {
      fetchHomepageSections();
      fetchBanners();
      fetchParentCategories();
    };

    window.addEventListener('karviyam_homepage_sections_updated', handleUpdate);
    window.addEventListener('karviyam_banners_updated', handleUpdate);
    window.addEventListener('karviyam_categories_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('karviyam_homepage_sections_updated', handleUpdate);
      window.removeEventListener('karviyam_banners_updated', handleUpdate);
      window.removeEventListener('karviyam_categories_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Hero Carousel Autoplay
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubscribing(true);
    try {
      const res = await api.post('/users/newsletter-subscribe', { email: newsletterEmail });
      if (res.data?.success) {
        toast.success(res.data?.message || 'Subscribed! Use code KARVIYAM10 for 10% off. 🎉');
        setNewsletterEmail('');
      } else {
        toast.error(res.data?.message || 'Subscription failed');
      }
    } catch (err) {
      toast.error('Failed to subscribe. Please try again.');
    } fontinally: {
      setSubscribing(false);
    }
  };

  const renderProductCard = (prod) => {
    const prodImg = resolveImageUrl(prod.image_url || prod.imageUrl || prod.imagePath || prod.image || prod.images?.[0], prod.id);
    const inWish = isInWishlist(prod.id);
    const oldPriceNum = Number(prod.old_price || prod.oldPrice || 0);
    const priceNum = Number(prod.price || 0);
    const discountText = prod.discount || (oldPriceNum > priceNum ? `${Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100)}% OFF` : 'SPECIAL OFFER');

    return (
      <div
        key={prod.id}
        onClick={() => navigate(`/product/${prod.id}`)}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md p-3 relative flex flex-col justify-between overflow-hidden cursor-pointer group transition-all duration-200"
      >
        <div className="relative w-full h-[180px] sm:h-[200px] bg-slate-50/80 rounded-xl overflow-hidden flex items-center justify-center p-2 shrink-0">
          <img
            src={prodImg}
            alt={prod.name}
            onError={(e) => handleImageError(e, prod.id)}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
          />

          <span className="absolute top-2 left-2 bg-[#B71C1C] text-white text-[9.5px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
            KARVIYAM
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(prod);
            }}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs border ${
              inWish ? 'bg-red-50 text-[#B71C1C] border-red-200' : 'bg-white/90 text-slate-600 border-slate-100 hover:text-[#B71C1C]'
            }`}
            title={inWish ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart className={`w-4 h-4 ${inWish ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-between pt-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-500 truncate max-w-[120px]">{prod.brand || 'KARVIYAM'}</span>
            <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md text-[10px]">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-slate-900 font-extrabold">{prod.rating || 4.5}</span>
            </div>
          </div>

          <h3 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 group-hover:text-[#B71C1C] transition-colors" title={prod.name}>
            {prod.name}
          </h3>

          <div className="pt-1 flex items-baseline gap-1.5">
            <span className="font-black text-sm text-slate-900">₹{priceNum}</span>
            {oldPriceNum > priceNum && (
              <span className="text-[10.5px] text-slate-400 line-through">₹{oldPriceNum}</span>
            )}
            <span className="text-[10px] font-black text-emerald-600 ml-auto">{discountText}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSectionContainer = (sec, children) => {
    return (
      <section key={sec.id} className="w-full my-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {(sec.title || sec.subtitle) && (
            <div className="flex items-end justify-between mb-5 border-b border-slate-200/80 pb-3">
              <div>
                <h2 className="font-display font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                  {sec.title}
                </h2>
                {sec.subtitle && (
                  <p className="text-xs font-medium text-slate-500 mt-1">{sec.subtitle}</p>
                )}
              </div>
              {sec.view_all_link && (
                <Link
                  to={sec.view_all_link}
                  className="text-xs font-black text-[#B71C1C] hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>{sec.view_all_text || 'View All →'}</span>
                </Link>
              )}
            </div>
          )}
          {children}
        </div>
      </section>
    );
  };

  // Section Render Map
  const renderSectionContent = (sec) => {
    switch (sec.id) {
      case 'hero_banner':
        if (heroBanners.length === 0) return null;
        const current = heroBanners[heroIndex] || heroBanners[0];
        return (
          <div key={sec.id} className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="w-full bg-slate-900 text-white rounded-3xl overflow-hidden shadow-xl relative border border-slate-800">
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[360px] sm:min-h-[420px]">
                <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center space-y-4 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B71C1C] text-white text-[11px] font-black tracking-wider uppercase w-max shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{current.badge}</span>
                  </span>
                  <h1 className="font-display font-black text-2xl sm:text-4xl xl:text-5xl leading-tight text-white tracking-tight">
                    {current.title}
                  </h1>
                  <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-lg">
                    {current.subtitle}
                  </p>
                  <div className="pt-3">
                    <button
                      onClick={() => navigate(current.link)}
                      className="bg-[#B71C1C] hover:bg-[#900C0C] text-white font-black text-xs sm:text-sm uppercase tracking-wider px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <span>{current.buttonText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="lg:col-span-6 relative min-h-[260px] lg:min-h-full overflow-hidden bg-slate-950 flex items-center justify-center p-4">
                  <img
                    src={current.image}
                    alt={current.title}
                    onError={(e) => handleImageError(e, current.id)}
                    className="w-full h-full object-cover rounded-2xl opacity-90 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent lg:block hidden" />
                </div>
              </div>

              {/* Slider Dots */}
              {heroBanners.length > 1 && (
                <div className="absolute bottom-4 left-8 sm:left-12 flex items-center gap-2 z-20">
                  {heroBanners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setHeroIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === heroIndex ? 'w-8 bg-[#B71C1C]' : 'w-2 bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'quick_categories':
        if (categories.length === 0) return null;
        return (
          <div key={sec.id} className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-black text-base text-slate-900 uppercase tracking-wider">Quick Categories</h3>
              <span className="text-xs text-slate-500 font-medium">Scroll to explore categories</span>
            </div>
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => navigate(cat.link)}
                  className="flex flex-col items-center gap-2 cursor-pointer group shrink-0"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-slate-200 group-hover:border-[#B71C1C] p-1 bg-white shadow-2xs transition-all group-hover:scale-105 overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      onError={(e) => handleImageError(e, cat.id)}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <span className="text-[11.5px] font-bold text-slate-800 group-hover:text-[#B71C1C] transition-colors uppercase tracking-wider text-center max-w-[90px] truncate">
                    {cat.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'recommended':
      case 'most_loved':
      case 'trending':
      case 'new_arrivals':
        const prods = sec.products || [];
        if (prods.length === 0) return null;

        const isGrid = sec.display_type === 'grid';
        return renderSectionContainer(
          sec,
          isGrid ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {prods.map(p => renderProductCard(p))}
            </div>
          ) : (
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2 snap-x snap-mandatory">
              {prods.map(p => (
                <div key={p.id} className="w-[220px] sm:w-[240px] shrink-0 snap-start">
                  {renderProductCard(p)}
                </div>
              ))}
            </div>
          )
        );

      case 'shop_by_collection':
        const collections = sec.items || [
          { id: 'men', title: 'MEN COLLECTION', subtitle: 'Streetwear & Everyday Fits', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800', link: '/shop?category=Men', cta: 'SHOP MEN' },
          { id: 'women', title: 'WOMEN COLLECTION', subtitle: 'Ethnic & Modern Fusion', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800', link: '/shop?category=Women', cta: 'SHOP WOMEN' },
          { id: 'sneakers', title: 'SNEAKERS & KICKS', subtitle: 'Trending Kicks & Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', link: '/shop?category=Sneakers', cta: 'EXPLORE SNEAKERS' },
          { id: 'jewellery', title: 'JEWELLERY & ACCESSORIES', subtitle: 'Bags, Jewels & Styling Addons', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800', link: '/shop?category=Jewels', cta: 'SHOP ACCESSORIES' }
        ];

        return renderSectionContainer(
          sec,
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {collections.map((col) => (
              <div
                key={col.id}
                onClick={() => navigate(col.link)}
                className="group relative h-[360px] rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200"
              >
                <img
                  src={resolveImageUrl(col.image, col.id)}
                  alt={col.title}
                  onError={(e) => handleImageError(e, col.id)}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-6 flex flex-col justify-end text-white">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FED7D7] mb-1">
                    COLLECTION
                  </span>
                  <h3 className="font-display font-black text-xl leading-tight text-white mb-1">
                    {col.title}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium mb-4 line-clamp-1">
                    {col.subtitle}
                  </p>
                  <button className="bg-white text-slate-900 group-hover:bg-[#B71C1C] group-hover:text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl shadow-md transition-all self-start flex items-center gap-1.5 cursor-pointer">
                    <span>{col.cta || 'SHOP NOW'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'find_your_price':
        return renderSectionContainer(
          sec,
          <FindYourPrice />
        );

      case 'full_width_promo':
        const banner = sec.banner || {
          badge: 'FESTIVE SALE',
          title: 'UP TO 60% OFF',
          subtitle: 'Refresh Your Wardrobe With Premium Karviyam Collections',
          ctaText: 'SHOP FESTIVE DROP',
          ctaLink: '/shop?filter=offers',
          bgImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600'
        };

        return (
          <div key={sec.id} className="w-full bg-slate-950 text-white my-10 py-12 px-6 relative overflow-hidden shadow-lg border-y border-slate-800">
            <div className="absolute inset-0 opacity-40">
              <img
                src={banner.bgImage}
                alt="Promotional Banner"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="max-w-[1440px] mx-auto relative z-10 flex flex-col items-center text-center space-y-4">
              <span className="bg-[#B71C1C] text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                {banner.badge}
              </span>
              <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
                {banner.title}
              </h2>
              <p className="text-slate-200 text-sm sm:text-base font-medium max-w-xl">
                {banner.subtitle}
              </p>
              <button
                onClick={() => navigate(banner.ctaLink)}
                className="bg-white hover:bg-slate-100 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 mt-2"
              >
                <span>{banner.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );

      case 'shop_your_style':
        const styles = sec.styles || [
          { id: 'streetwear', name: 'STREETWEAR', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600', link: '/shop?style=Streetwear' },
          { id: 'casual', name: 'CASUAL', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600', link: '/shop?style=Casual' },
          { id: 'formal', name: 'FORMAL', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600', link: '/shop?style=Formal' },
          { id: 'party', name: 'PARTY', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600', link: '/shop?style=Party' },
          { id: 'sports', name: 'SPORTS', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600', link: '/shop?style=Sports' },
          { id: 'everyday', name: 'EVERYDAY', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600', link: '/shop?style=Everyday' }
        ];

        return renderSectionContainer(
          sec,
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {styles.map(st => (
              <div
                key={st.id}
                onClick={() => navigate(st.link)}
                className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer border border-slate-200 shadow-2xs hover:shadow-md transition-all"
              >
                <img
                  src={st.image}
                  alt={st.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-3 text-center justify-center">
                  <span className="font-display font-black text-xs text-white uppercase tracking-widest">
                    {st.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'deals_grid':
        const deals = sec.deals || [
          { id: 'deal1', title: 'UNDER ₹499', subtitle: 'Budget Essentials', discountText: 'STARTING AT ₹199', image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600', cta: 'SHOP UNDER ₹499', link: '/shop?max_price=499' },
          { id: 'deal2', title: 'UNDER ₹999', subtitle: 'Trendy Premium Fits', discountText: 'FLAT 50% OFF', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600', cta: 'SHOP UNDER ₹999', link: '/shop?max_price=999' },
          { id: 'deal3', title: 'UP TO 50% OFF', subtitle: 'Season End Sale', discountText: 'LIMITED STOCK', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', cta: 'VIEW SALE', link: '/shop?filter=offers' },
          { id: 'deal4', title: 'BUY MORE SAVE MORE', subtitle: 'Bundle Discounts', discountText: 'EXTRA 15% OFF', image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600', cta: 'SHOP BUNDLES', link: '/shop?filter=bundles' }
        ];

        return renderSectionContainer(
          sec,
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {deals.map(d => (
              <div
                key={d.id}
                onClick={() => navigate(d.link)}
                className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-100 p-5 flex flex-col justify-between hover:border-red-300 transition-all cursor-pointer shadow-2xs hover:shadow-md"
              >
                <div>
                  <span className="text-[10px] font-black text-[#B71C1C] uppercase tracking-wider bg-red-100/80 px-2 py-0.5 rounded-md">
                    {d.discountText}
                  </span>
                  <h4 className="font-display font-black text-lg text-slate-900 mt-2">{d.title}</h4>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">{d.subtitle}</p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-2 border-t border-red-200/60">
                  <span className="text-xs font-black text-[#B71C1C] group-hover:underline flex items-center gap-1">
                    <span>{d.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'why_shop':
        return renderSectionContainer(
          sec,
          <WhyShopWithKarviyam />
        );

      case 'customer_reviews':
        const revs = sec.reviews || [];
        if (revs.length === 0) return null;

        return renderSectionContainer(
          sec,
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {revs.slice(0, 3).map((r, i) => (
              <div key={r.id || i} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className={`w-4 h-4 ${idx < (r.rating || 5) ? 'fill-current' : 'text-slate-200'}`} />
                    ))}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{r.title || 'Excellent product!'}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-3">
                    "{r.comment || 'Great quality and fast delivery. Very satisfied with my Karviyam order.'}"
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-[#B71C1C] flex items-center justify-center font-bold text-xs">
                      {(r.user_name || 'Customer').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">{r.user_name || 'Verified Customer'}</span>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'style_inspiration':
        const looks = sec.looks || [
          { id: 'look1', title: 'Streetwear Vibe', tag: '#STREETWEAR', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600', link: '/shop?style=Streetwear' },
          { id: 'look2', title: 'Weekend Comfort', tag: '#CASUAL', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600', link: '/shop?style=Casual' },
          { id: 'look3', title: 'Festive Glam', tag: '#ETHNIC', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600', link: '/shop?category=Women' },
          { id: 'look4', title: 'Active Essentials', tag: '#SPORTS', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600', link: '/shop?category=Sneakers' }
        ];

        return renderSectionContainer(
          sec,
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {looks.map(lk => (
              <div
                key={lk.id}
                onClick={() => navigate(lk.link)}
                className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer border border-slate-200 shadow-2xs hover:shadow-lg transition-all"
              >
                <img
                  src={lk.image}
                  alt={lk.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent p-5 flex flex-col justify-end text-white">
                  <span className="text-[10px] font-black text-[#FED7D7] uppercase tracking-wider">{lk.tag}</span>
                  <h4 className="font-display font-black text-lg text-white">{lk.title}</h4>
                </div>
              </div>
            ))}
          </div>
        );

      case 'newsletter_cta':
        return (
          <div key={sec.id} className="w-full my-12 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white py-12 px-6 rounded-3xl max-w-[1440px] mx-auto border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto text-center space-y-4 relative z-10">
              <span className="inline-flex items-center gap-1 bg-[#B71C1C] text-white text-[11px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5" /> EXCLUSIVE OFFER
              </span>
              <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight">
                {sec.title || 'GET 10% OFF YOUR FIRST ORDER'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                {sec.subtitle || 'Join the Karviyam community for new drops, style guides & member deals.'}
              </p>

              <form onSubmit={handleNewsletterSubmit} className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className="flex-1 bg-slate-800/90 border border-slate-700 text-white text-xs px-4 py-3 rounded-xl outline-none focus:border-[#B71C1C]"
                  required
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-600 text-white font-black text-xs uppercase px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer shrink-0 flex items-center justify-center gap-2"
                >
                  <span>{subscribing ? 'SUBSCRIBING...' : 'GET MY OFFER'}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              <p className="text-[10px] text-slate-400 font-medium pt-1">
                New drops • Exclusive offers • Instant coupon KARVIYAM10
              </p>
            </div>
          </div>
        );

      case 'final_cta':
        return (
          <div key={sec.id} className="w-full my-12 bg-slate-900 text-white rounded-3xl overflow-hidden shadow-xl max-w-[1440px] mx-auto border border-slate-800 relative">
            <div className="p-8 sm:p-14 text-center space-y-4 relative z-10 max-w-2xl mx-auto">
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                {sec.title || 'READY TO REFRESH YOUR STYLE?'}
              </h2>
              <p className="text-sm text-slate-300 font-medium">
                {sec.subtitle || 'Discover the latest streetwear & luxury fashion collections from Karviyam.'}
              </p>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => navigate(sec.ctaMenLink || '/shop?category=Men')}
                  className="bg-[#B71C1C] hover:bg-[#900C0C] text-white font-black text-xs sm:text-sm uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>{sec.ctaMenText || 'SHOP MEN'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate(sec.ctaWomenLink || '/shop?category=Women')}
                  className="bg-white hover:bg-slate-100 text-slate-900 font-black text-xs sm:text-sm uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>{sec.ctaWomenText || 'SHOP WOMEN'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && sections.length === 0) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 py-12 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#B71C1C] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Loading Karviyam Storefront...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen pb-16 font-sans">
      <div className="w-full">
        {sections.map(sec => sec.enabled !== false && renderSectionContent(sec))}
      </div>
    </div>
  );
}
