import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Save,
  ArrowUp,
  ArrowDown,
  Loader2,
  Sparkles,
  RefreshCw,
  Search,
  Grid,
  MoveHorizontal,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { broadcastSyncEvent } from '../services/api';
import AdminFindYourPricePage from './AdminFindYourPricePage';
import AdminWhyShopPage from './AdminWhyShopPage';

const DEFAULT_PRODUCT_SECTIONS = [
  { id: 'recommended', section_key: 'recommended', title: 'Recommended For You', subtitle: 'Handpicked selections based on your style', enabled: true, position: 1, desktop_layout: 'carousel_2_rows', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'View All →', view_all_link: '/shop' },
  { id: 'new_arrivals', section_key: 'new_arrivals', title: 'New Arrivals', subtitle: 'Explore the latest fashion drops & arrivals', enabled: true, position: 2, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'View All →', view_all_link: '/shop?filter=new' },
  { id: 'featured', section_key: 'featured', title: 'Featured Products', subtitle: 'Curated premium items handpicked for you', enabled: true, position: 3, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'View All →', view_all_link: '/shop?filter=featured' },
  { id: 'trending', section_key: 'trending', title: 'Trending Now', subtitle: 'Popular styles customers are loving right now', enabled: true, position: 4, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'grid_2_col', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'View All →', view_all_link: '/shop?filter=trending' },
  { id: 'most_loved', section_key: 'most_loved', title: 'Most-Loved Fashion for You', subtitle: 'Top-rated favorites handpicked for your style', enabled: true, position: 5, desktop_layout: 'grid', desktop_product_count: 8, desktop_max_products: 16, mobile_layout: 'grid_2_col', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'View All →', view_all_link: '/shop?filter=loved' },
  { id: 'starting_199', section_key: 'starting_199', title: 'Starting @ ₹199', subtitle: 'Unbeatable value on budget-friendly fashion & essentials', enabled: true, position: 6, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'Explore Under ₹199 →', view_all_link: '/shop?maxPrice=399' },
  { id: 'best_sellers', section_key: 'best_sellers', title: 'Best Sellers', subtitle: 'Customer favorite picks & top-rated items', enabled: true, position: 7, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'grid_2_col', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'View All →', view_all_link: '/shop?filter=bestsellers' },
  { id: 'flash_picks', section_key: 'flash_picks', title: 'Flash Picks', subtitle: 'Limited-time deals on trending products', enabled: true, position: 8, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'View All Deals →', view_all_link: '/shop?filter=offers' },
  { id: 'complete_look', section_key: 'complete_look', title: 'Complete The Look', subtitle: 'Curated style combos matched for you', enabled: true, position: 9, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'View Combos →', view_all_link: '/shop?filter=combos' },
  { id: 'popular_picks', section_key: 'popular_picks', title: 'Popular Products', subtitle: 'Most viewed & saved items this week', enabled: true, position: 10, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'View All →', view_all_link: '/shop?filter=popular' },
  { id: 'top_offers', section_key: 'top_offers', title: 'Top Offers & Discounts', subtitle: 'Steal deals with up to 60% off', enabled: true, position: 11, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'Shop Offers →', view_all_link: '/shop?filter=offers' },
  { id: 'todays_deal', section_key: 'todays_deal', title: "Today's Special Deal", subtitle: 'Exclusive 24-hour price drop on selected items', enabled: true, position: 12, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: "Today's Deals →", view_all_link: '/shop?filter=offers' },
  { id: 'shop_by_occasion', section_key: 'shop_by_occasion', title: 'Shop by Occasion', subtitle: 'Outfits & accessories for every event', enabled: true, position: 13, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'Explore Occasions →', view_all_link: '/shop' },
  { id: 'find_your_price', section_key: 'find_your_price', title: 'Find Your Price Range', subtitle: 'Shop products grouped by budget', enabled: true, position: 14, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'All Price Ranges →', view_all_link: '/shop' },
  { id: 'premium_collection', section_key: 'premium_collection', title: 'Premium Store & 925 Silver', subtitle: 'Luxury high-end fashion & hallmarked silver', enabled: true, position: 15, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'Explore Premium →', view_all_link: '/shop?category=Jewellery' },
  { id: 'mens_collection', section_key: 'mens_collection', title: "Men's Collection", subtitle: 'T-Shirts, Shirts, Sneakers & Casual Wear for Men', enabled: false, position: 16, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: "Shop Men's →", view_all_link: '/shop?category=Men' },
  { id: 'womens_collection', section_key: 'womens_collection', title: "Women's Collection", subtitle: 'Ethic wear, Kurtas, Sarees & Western outfits', enabled: false, position: 17, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: "Shop Women's →", view_all_link: '/shop?category=Women' },
  { id: 'kids_collection', section_key: 'kids_collection', title: 'Kids & Baby Collection', subtitle: 'Cute prints & comfortable clothing for kids', enabled: false, position: 18, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'Shop Kids →', view_all_link: '/shop?category=Kids' },
  { id: 'unisex_collection', section_key: 'unisex_collection', title: 'Unisex Collection', subtitle: 'Streetwear & oversized fits designed for everyone', enabled: true, position: 19, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'Shop Unisex →', view_all_link: '/shop?category=Unisex' },
  { id: 'jewellery_collection', section_key: 'jewellery_collection', title: 'Jewellery & Jewels', subtitle: '925 Sterling Silver rings, pendants & accessories', enabled: true, position: 20, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'Shop Jewellery →', view_all_link: '/shop?category=Jewellery' },
  { id: 'accessories_collection', section_key: 'accessories_collection', title: 'Accessories Collection', subtitle: 'Bags, Sunglasses, Caps & Lifestyle Essentials', enabled: false, position: 21, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'Shop Accessories →', view_all_link: '/shop?category=Accessories' },
  { id: 'fresh_summer', section_key: 'fresh_summer', title: 'Fresh Summer Looks', subtitle: 'Lightweight linen & vibrant summer apparel', enabled: true, position: 22, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'Shop Summer →', view_all_link: '/shop?filter=summer' },
  { id: 'recently_viewed', section_key: 'recently_viewed', title: 'Recently Viewed', subtitle: 'Pick up right where you left off', enabled: true, position: 23, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'View All →', view_all_link: '/shop' },
  { id: 'related_products', section_key: 'related_products', title: 'Related & Similar Products', subtitle: 'Matches based on items you explored', enabled: true, position: 24, desktop_layout: 'carousel', desktop_product_count: 6, desktop_max_products: 12, mobile_layout: 'carousel', mobile_product_count: 6, mobile_max_products: 12, show_view_all: true, view_all_text: 'View All →', view_all_link: '/shop' }
];

export default function AdminHomepageSectionsPage() {
  const [activeTab, setActiveTab] = useState('sections');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState(DEFAULT_PRODUCT_SECTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableProducts, setAvailableProducts] = useState([]);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await api.get('/homepage-sections/admin').catch(() => null)
        || await api.get('/admin/homepage-sections').catch(() => null);

      const data = res?.data?.data || res?.data;

      if (data) {
        const rawList = Array.isArray(data.sections) ? data.sections : (Array.isArray(data) ? data : null);
        if (Array.isArray(rawList) && rawList.length > 0) {
          setSections(rawList.sort((a, b) => (parseInt(a.position || a.display_order) || 0) - (parseInt(b.position || b.display_order) || 0)));
        }
        if (Array.isArray(data.availableProducts)) {
          setAvailableProducts(data.availableProducts);
        }
      }
    } catch (e) {
      toast.error('Failed to load homepage section configurations.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnable = (idx) => {
    setSections(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
      return updated;
    });
  };

  const handleChangeField = (idx, field, val) => {
    setSections(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const handleMoveOrder = (idx, direction) => {
    if ((direction === -1 && idx === 0) || (direction === 1 && idx === sections.length - 1)) return;
    
    setSections(prev => {
      const updated = [...prev];
      const targetIdx = idx + direction;
      
      const temp = updated[idx];
      updated[idx] = updated[targetIdx];
      updated[targetIdx] = temp;

      return updated.map((sec, i) => ({
        ...sec,
        position: i + 1,
        display_order: i + 1
      }));
    });
  };

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    toast.loading('Saving homepage section configurations...', { id: 'admin-sec-toast' });

    try {
      const reordered = sections.map((sec, i) => ({
        ...sec,
        position: i + 1,
        display_order: i + 1
      }));

      const res = await api.post('/homepage-sections/admin', { sections: reordered })
        .catch(() => api.put('/admin/homepage-sections', { sections: reordered }));

      if (res?.data?.success || res?.status === 200) {
        toast.success('Homepage section configurations saved successfully! 🎉', { id: 'admin-sec-toast' });
        window.dispatchEvent(new window.Event('karviyam_homepage_sections_updated'));
        broadcastSyncEvent('karviyam_homepage_sections_updated');
        await fetchSections();
      } else {
        toast.error(res?.data?.message || 'Failed to save configurations.', { id: 'admin-sec-toast' });
      }
    } catch (err) {
      toast.error('Error saving section configurations.', { id: 'admin-sec-toast' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setSections(DEFAULT_PRODUCT_SECTIONS);
    try {
      await api.post('/homepage-sections/admin', { sections: DEFAULT_PRODUCT_SECTIONS });
      toast.success('Reset all sections to default configuration!');
      window.dispatchEvent(new window.Event('karviyam_homepage_sections_updated'));
      broadcastSyncEvent('karviyam_homepage_sections_updated');
    } catch (e) {}
  };

  const filteredSections = searchQuery.trim()
    ? sections.filter(s =>
        (s.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.section_key || s.id || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sections;

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 font-sans">
        <Loader2 className="w-10 h-10 text-[#B71C1C] animate-spin mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Homepage Section Control Center...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-[#B71C1C]" />
            <span>Homepage Product Sections Management</span>
          </h1>
          <p className="text-xs text-slate-500">
            Configure independent Desktop & Mobile layouts, product counts, visibility, and section ordering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-bold"
            title="Reset to Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={fetchSections}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Configurations</span>
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'sections'
              ? 'bg-[#B71C1C] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Featured Product Sections ({sections.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('find_your_price')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'find_your_price'
              ? 'bg-[#B71C1C] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Find Your Price Section
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('why_shop')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'why_shop'
              ? 'bg-[#B71C1C] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Why Shop With Karviyam?
        </button>
      </div>

      {activeTab === 'find_your_price' ? (
        <AdminFindYourPricePage isEmbedded={true} />
      ) : activeTab === 'why_shop' ? (
        <AdminWhyShopPage isEmbedded={true} />
      ) : (
        <>
          {/* Info & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 text-red-950 flex-1">
              <Sparkles className="w-5 h-5 text-[#B71C1C] shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-slate-900">Database Single Source of Truth</p>
                <p className="text-slate-600 font-medium">
                  Configured settings (Title, Visibility, Desktop/Mobile Layouts, Item Limits, and Section Order) sync live to database and customer storefronts.
                </p>
              </div>
            </div>

            {/* Live Search Bar */}
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Product Sections (e.g. Trending, Price)..."
                className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 font-medium text-xs text-slate-800 outline-none focus:border-[#B71C1C] shadow-2xs"
              />
            </div>
          </div>

          {/* Section List Cards */}
          <div className="space-y-5">
            {filteredSections.map((sec, idx) => {
              const originalIdx = sections.findIndex(s => (s.id || s.section_key) === (sec.id || sec.section_key));
              const currentIdx = originalIdx >= 0 ? originalIdx : idx;

              return (
                <div
                  key={sec.id || sec.section_key || idx}
                  className={`bg-white border rounded-3xl p-6 shadow-xs space-y-5 transition-all ${
                    sec.enabled !== false ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
                  }`}
                >
                  {/* Header / Position & Toggle Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xs shadow-sm">
                        #{currentIdx + 1}
                      </span>

                      <div>
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{sec.title}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase">
                            key: {sec.id || sec.section_key}
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-500">{sec.subtitle || 'Homepage product row'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Reorder Buttons */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(currentIdx, -1)}
                          disabled={currentIdx === 0}
                          className="p-1.5 hover:bg-white text-slate-700 disabled:opacity-30 rounded-lg cursor-pointer transition-colors"
                          title="Move Section Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(currentIdx, 1)}
                          disabled={currentIdx === sections.length - 1}
                          className="p-1.5 hover:bg-white text-slate-700 disabled:opacity-30 rounded-lg cursor-pointer transition-colors"
                          title="Move Section Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Enable / Disable Toggle */}
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
                        <span className={`text-[10.5px] font-extrabold uppercase ${!sec.enabled ? 'text-rose-600' : 'text-slate-400'}`}>
                          DISABLED [OFF]
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sec.enabled !== false}
                            onChange={() => handleToggleEnable(currentIdx)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#B71C1C]" />
                        </label>
                        <span className={`text-[10.5px] font-extrabold uppercase ${sec.enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                          ENABLED [ON]
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Section Title */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Display Title</label>
                      <input
                        type="text"
                        value={sec.title || ''}
                        onChange={(e) => handleChangeField(currentIdx, 'title', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl font-bold text-xs outline-none focus:border-[#B71C1C]"
                      />
                    </div>

                    {/* Subtitle */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Display Subtitle</label>
                      <input
                        type="text"
                        value={sec.subtitle || ''}
                        onChange={(e) => handleChangeField(currentIdx, 'subtitle', e.target.value)}
                        placeholder="Tagline description under section title"
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#B71C1C]"
                      />
                    </div>
                  </div>

                  {/* Layout Controls: Desktop vs Mobile */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                    
                    {/* Desktop Controls */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-extrabold text-[#B71C1C] flex items-center gap-1.5">
                          <Grid className="w-4 h-4" />
                          <span>DESKTOP PRODUCT LAYOUT CONTROLS (&gt;1024PX)</span>
                        </span>
                      </div>

                      <div className="space-y-2">
                        <label className="block font-bold text-slate-700 text-[11px]">Layout Format</label>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                            <input
                              type="radio"
                              name={`desktop_layout_${sec.id || currentIdx}`}
                              checked={sec.desktop_layout === 'carousel' || !sec.desktop_layout}
                              onChange={() => handleChangeField(currentIdx, 'desktop_layout', 'carousel')}
                              className="accent-[#B71C1C]"
                            />
                            <span>Horizontal Carousel (1 Row)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                            <input
                              type="radio"
                              name={`desktop_layout_${sec.id || currentIdx}`}
                              checked={sec.desktop_layout === 'carousel_2_rows'}
                              onChange={() => handleChangeField(currentIdx, 'desktop_layout', 'carousel_2_rows')}
                              className="accent-[#B71C1C]"
                            />
                            <span>Horizontal Carousel (2 Rows)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                            <input
                              type="radio"
                              name={`desktop_layout_${sec.id || currentIdx}`}
                              checked={sec.desktop_layout === 'grid'}
                              onChange={() => handleChangeField(currentIdx, 'desktop_layout', 'grid')}
                              className="accent-[#B71C1C]"
                            />
                            <span>Vertical Grid</span>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block font-bold text-slate-700 text-[10.5px] mb-1">Products Visible</label>
                          <input
                            type="number"
                            value={sec.desktop_product_count || 6}
                            onChange={(e) => handleChangeField(currentIdx, 'desktop_product_count', parseInt(e.target.value) || 6)}
                            className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-xs outline-none focus:border-[#B71C1C]"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 text-[10.5px] mb-1">Max Loaded Products</label>
                          <input
                            type="number"
                            value={sec.desktop_max_products || 12}
                            onChange={(e) => handleChangeField(currentIdx, 'desktop_max_products', parseInt(e.target.value) || 12)}
                            className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-xs outline-none focus:border-[#B71C1C]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mobile Controls */}
                    <div className="bg-rose-50/50 border border-rose-200/80 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-rose-200/80 pb-2">
                        <span className="font-extrabold text-[#B71C1C] flex items-center gap-1.5">
                          <MoveHorizontal className="w-4 h-4" />
                          <span>MOBILE PRODUCT LAYOUT CONTROLS (&lt;1024PX)</span>
                        </span>
                      </div>

                      <div className="space-y-2">
                        <label className="block font-bold text-slate-700 text-[11px]">Layout Format</label>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                            <input
                              type="radio"
                              name={`mobile_layout_${sec.id || currentIdx}`}
                              checked={sec.mobile_layout === 'carousel' || !sec.mobile_layout}
                              onChange={() => handleChangeField(currentIdx, 'mobile_layout', 'carousel')}
                              className="accent-[#B71C1C]"
                            />
                            <span>Horizontal Carousel / Swipe</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                            <input
                              type="radio"
                              name={`mobile_layout_${sec.id || currentIdx}`}
                              checked={sec.mobile_layout === 'grid_2_col'}
                              onChange={() => handleChangeField(currentIdx, 'mobile_layout', 'grid_2_col')}
                              className="accent-[#B71C1C]"
                            />
                            <span>Vertical 2-Column Grid</span>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block font-bold text-slate-700 text-[10.5px] mb-1">Products Visible</label>
                          <input
                            type="number"
                            value={sec.mobile_product_count || 6}
                            onChange={(e) => handleChangeField(currentIdx, 'mobile_product_count', parseInt(e.target.value) || 6)}
                            className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-xs outline-none focus:border-[#B71C1C]"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 text-[10.5px] mb-1">Max Loaded Products</label>
                          <input
                            type="number"
                            value={sec.mobile_max_products || 12}
                            onChange={(e) => handleChangeField(currentIdx, 'mobile_max_products', parseInt(e.target.value) || 12)}
                            className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-xs outline-none focus:border-[#B71C1C]"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* View All Button Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 pt-5">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sec.show_view_all !== false}
                          onChange={(e) => handleChangeField(currentIdx, 'show_view_all', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#B71C1C]" />
                      </label>
                      <span className="font-bold text-slate-900 text-xs">Show "View All" Link</span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">"View All" Button Text</label>
                      <input
                        type="text"
                        value={sec.view_all_text || ''}
                        onChange={(e) => handleChangeField(currentIdx, 'view_all_text', e.target.value)}
                        placeholder="View All →"
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">"View All" Destination Link</label>
                      <input
                        type="text"
                        value={sec.view_all_link || ''}
                        onChange={(e) => handleChangeField(currentIdx, 'view_all_link', e.target.value)}
                        placeholder="/shop"
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono outline-none focus:border-[#B71C1C]"
                      />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Save Button Bar */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-bold px-8 py-3 rounded-2xl shadow-lg cursor-pointer transition-all flex items-center gap-2 uppercase tracking-wider text-xs"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save All Homepage Section Configurations</span>
            </button>
          </div>
        </>
      )}

    </div>
  );
}
