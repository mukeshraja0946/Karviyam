import React, { useState, useEffect } from 'react';
import {
  Layers,
  Save,
  Plus,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Sparkles,
  Tag,
  Clock,
  Award,
  TrendingUp,
  Crown,
  Gift,
  Truck,
  Headphones,
  Percent,
  Star,
  Shield,
  Flame,
  Heart,
  ShoppingBag,
  User,
  Image as ImageIcon,
  Link2,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { broadcastSyncEvent } from '../services/api';
import { resolveImageUrl } from '../utils/imageUtils';
import ImageUploadCropperModal from '../components/ImageUploadCropperModal';

const AVAILABLE_ICONS = [
  { name: 'Tag', icon: Tag },
  { name: 'Clock', icon: Clock },
  { name: 'Award', icon: Award },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Crown', icon: Crown },
  { name: 'Gift', icon: Gift },
  { name: 'Truck', icon: Truck },
  { name: 'Headphones', icon: Headphones },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Percent', icon: Percent },
  { name: 'Star', icon: Star },
  { name: 'Shield', icon: Shield },
  { name: 'Flame', icon: Flame },
  { name: 'Heart', icon: Heart },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'User', icon: User }
];

export default function AdminSidebarPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('items');

  // Sidebar Data States
  const [navItems, setNavItems] = useState([]);
  const [offerCard, setOfferCard] = useState({
    enabled: true,
    heading: 'EXTRA 5% OFF',
    subtitle: 'On Prepaid Orders',
    discountPercent: '5%',
    badgeText: 'INSTANT DISCOUNT',
    link: '/shop?filter=offers',
    icon: 'Percent'
  });
  const [promoCard, setPromoCard] = useState({
    enabled: true,
    badge: 'FESTIVE SPECIAL',
    title: 'UP TO 60% OFF',
    subtitle: 'On Bestsellers',
    description: 'Limited time festive drops & trending styles.',
    buttonText: 'SHOP NOW',
    link: '/shop',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'
  });

  // Modal State for Adding/Editing Item
  const [editItemModal, setEditItemModal] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState(-1);
  const [itemForm, setItemForm] = useState({
    id: '',
    label: '',
    subtitle: '',
    icon: 'Tag',
    link: '/shop',
    badge: '',
    enabled: true,
    order: 1,
    pages: ['home', 'shop', 'category', 'search']
  });

  // Image Cropper Modal State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchSidebarConfig();
  }, []);

  const fetchSidebarConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sidebar-config').catch(() => null);
      const data = res?.data?.data || res?.data;

      if (data) {
        if (Array.isArray(data.navItems)) {
          setNavItems(data.navItems.sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0)));
        }
        if (data.offerCard) setOfferCard(data.offerCard);
        if (data.promoCard) setPromoCard(data.promoCard);
      }
    } catch (e) {
      toast.error('Failed to load sidebar configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItemIdx(-1);
    setItemForm({
      id: `item_${Date.now()}`,
      label: '',
      subtitle: '',
      icon: 'Tag',
      link: '/shop',
      badge: '',
      enabled: true,
      order: navItems.length + 1,
      pages: ['home', 'shop', 'category', 'search']
    });
    setEditItemModal(true);
  };

  const handleOpenEditModal = (idx) => {
    setEditingItemIdx(idx);
    const item = navItems[idx];
    setItemForm({
      id: item.id || `item_${Date.now()}`,
      label: item.label || item.title || '',
      subtitle: item.subtitle || '',
      icon: item.icon || 'Tag',
      link: item.link || '/shop',
      badge: item.badge || '',
      enabled: item.enabled !== false,
      order: item.order || idx + 1,
      pages: Array.isArray(item.pages) ? item.pages : ['home', 'shop', 'category', 'search']
    });
    setEditItemModal(true);
  };

  const handleSaveItemModal = (e) => {
    e.preventDefault();
    if (!itemForm.label.trim()) {
      toast.error('Please enter an item title');
      return;
    }

    setNavItems(prev => {
      const updated = [...prev];
      if (editingItemIdx >= 0) {
        updated[editingItemIdx] = { ...itemForm };
      } else {
        updated.push({ ...itemForm });
      }
      return updated.map((it, i) => ({ ...it, order: i + 1 }));
    });

    setEditItemModal(false);
    toast.success(editingItemIdx >= 0 ? 'Item updated!' : 'New sidebar item added!');
  };

  const handleDeleteItem = (idx) => {
    if (window.confirm('Are you sure you want to delete this sidebar item?')) {
      setNavItems(prev => {
        const updated = prev.filter((_, i) => i !== idx);
        return updated.map((it, i) => ({ ...it, order: i + 1 }));
      });
      toast.success('Sidebar item removed.');
    }
  };

  const handleToggleItemStatus = (idx) => {
    setNavItems(prev => {
      const updated = [...prev];
      updated[idx].enabled = !updated[idx].enabled;
      return updated;
    });
  };

  const handleMoveItem = (idx, direction) => {
    if ((direction === -1 && idx === 0) || (direction === 1 && idx === navItems.length - 1)) return;
    setNavItems(prev => {
      const updated = [...prev];
      const targetIdx = idx + direction;
      const temp = updated[idx];
      updated[idx] = updated[targetIdx];
      updated[targetIdx] = temp;
      return updated.map((it, i) => ({ ...it, order: i + 1 }));
    });
  };

  const handleImageFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setCropperOpen(true);
    }
  };

  const handleConfirmCropImage = (croppedUrl) => {
    setPromoCard(prev => ({ ...prev, imageUrl: croppedUrl }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    toast.loading('Saving sidebar configuration...', { id: 'admin-sidebar-toast' });

    try {
      const payload = {
        navItems,
        offerCard,
        promoCard
      };

      const res = await api.put('/admin/sidebar-config', payload);

      if (res?.data?.success) {
        toast.success('Sidebar configuration saved & published live! 🎉', { id: 'admin-sidebar-toast' });
        broadcastSyncEvent('karviyam_sidebar_config_updated');
        localStorage.setItem('karviyam_sidebar_config', JSON.stringify(res.data.data));
        fetchSidebarConfig();
      } else {
        toast.error(res?.data?.message || 'Failed to save configuration', { id: 'admin-sidebar-toast' });
      }
    } catch (err) {
      toast.error('Error saving sidebar configuration', { id: 'admin-sidebar-toast' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 font-sans">
        <Loader2 className="w-10 h-10 text-[#B71C1C] animate-spin mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sidebar Management System...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs font-sans text-left">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#B71C1C]" />
            <span>Storefront Sidebar Management</span>
          </h1>
          <p className="text-xs text-slate-500">
            Single source of truth control center for customer navigation items, discount cards, and promotional banners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSidebarConfig}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
            title="Refresh Config"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save & Publish Sidebar</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'items'
              ? 'bg-[#B71C1C] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Navigation Menu Items ({navItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('offer')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'offer'
              ? 'bg-[#B71C1C] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Offer / Discount Card
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('promo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'promo'
              ? 'bg-[#B71C1C] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Promotional Banner Card
        </button>
      </div>

      {/* TAB 1: NAVIGATION MENU ITEMS */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Customer Sidebar Navigation Links</h3>
              <p className="text-slate-500 text-[11px]">Reorder, enable/disable, or add new links to the sidebar menu.</p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Sidebar Item</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="divide-y divide-slate-100">
              {navItems.map((item, idx) => {
                const IconObj = AVAILABLE_ICONS.find(i => i.name === item.icon)?.icon || Tag;
                return (
                  <div
                    key={item.id || idx}
                    className={`p-3.5 flex items-center justify-between gap-4 transition-colors ${
                      item.enabled !== false ? 'hover:bg-slate-50/80' : 'bg-slate-50/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 font-mono font-bold text-slate-600 text-[11px] flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>

                      <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 text-[#B71C1C] flex items-center justify-center shrink-0">
                        <IconObj className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-xs truncate">{item.label}</h4>
                          {item.badge && (
                            <span className="bg-red-100 text-[#B71C1C] text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{item.link}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Reorder Buttons */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleMoveItem(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 hover:bg-white text-slate-700 disabled:opacity-30 rounded-lg cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveItem(idx, 1)}
                          disabled={idx === navItems.length - 1}
                          className="p-1 hover:bg-white text-slate-700 disabled:opacity-30 rounded-lg cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Enable/Disable Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleItemStatus(idx)}
                        className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase cursor-pointer border ${
                          item.enabled !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {item.enabled !== false ? 'ON' : 'OFF'}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(idx)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(idx)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OFFER / DISCOUNT CARD */}
      {activeTab === 'offer' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4 max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Discount / Prepaid Offer Card</h3>
              <p className="text-slate-500 text-[11px]">Configure the highlighted offer box in the customer sidebar.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
              <span>Status:</span>
              <input
                type="checkbox"
                checked={offerCard.enabled !== false}
                onChange={(e) => setOfferCard({ ...offerCard, enabled: e.target.checked })}
                className="accent-[#B71C1C] w-4 h-4"
              />
              <span className={offerCard.enabled !== false ? 'text-emerald-700' : 'text-slate-400'}>
                {offerCard.enabled !== false ? 'Active' : 'Disabled'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Offer Heading</label>
              <input
                type="text"
                value={offerCard.heading || ''}
                onChange={(e) => setOfferCard({ ...offerCard, heading: e.target.value })}
                placeholder="EXTRA 5% OFF"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Subtitle / Description</label>
              <input
                type="text"
                value={offerCard.subtitle || ''}
                onChange={(e) => setOfferCard({ ...offerCard, subtitle: e.target.value })}
                placeholder="On Prepaid Orders"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-[#B71C1C]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Discount Badge Text</label>
              <input
                type="text"
                value={offerCard.discountPercent || ''}
                onChange={(e) => setOfferCard({ ...offerCard, discountPercent: e.target.value })}
                placeholder="5%"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Destination URL / Link</label>
              <input
                type="text"
                value={offerCard.link || ''}
                onChange={(e) => setOfferCard({ ...offerCard, link: e.target.value })}
                placeholder="/shop?filter=offers"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono outline-none focus:border-[#B71C1C]"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="pt-3">
            <span className="block font-bold text-slate-700 mb-2 text-xs">Customer Sidebar Live Preview:</span>
            <div className="w-[220px] h-[72px] bg-[#FFF0F2] border border-red-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
              <div className="flex flex-col justify-center">
                <span className="font-display font-black text-xs text-[#B71C1C] uppercase tracking-wide">
                  {offerCard.heading || 'EXTRA 5% OFF'}
                </span>
                <span className="text-[10px] text-slate-600 font-bold mt-0.5">
                  {offerCard.subtitle || 'On Prepaid Orders'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-red-100 text-[#B71C1C] flex items-center justify-center font-black text-sm border border-red-200">
                {offerCard.discountPercent || '%'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROMOTIONAL BANNER CARD */}
      {activeTab === 'promo' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4 max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Promotional Banner Card</h3>
              <p className="text-slate-500 text-[11px]">Manage the primary festive/seasonal promotional card inside the sidebar.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
              <span>Status:</span>
              <input
                type="checkbox"
                checked={promoCard.enabled !== false}
                onChange={(e) => setPromoCard({ ...promoCard, enabled: e.target.checked })}
                className="accent-[#B71C1C] w-4 h-4"
              />
              <span className={promoCard.enabled !== false ? 'text-emerald-700' : 'text-slate-400'}>
                {promoCard.enabled !== false ? 'Active' : 'Disabled'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Badge Tag</label>
              <input
                type="text"
                value={promoCard.badge || ''}
                onChange={(e) => setPromoCard({ ...promoCard, badge: e.target.value })}
                placeholder="FESTIVE SPECIAL"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold uppercase outline-none focus:border-[#B71C1C]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Card Title</label>
              <input
                type="text"
                value={promoCard.title || ''}
                onChange={(e) => setPromoCard({ ...promoCard, title: e.target.value })}
                placeholder="UP TO 60% OFF"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={promoCard.subtitle || ''}
                onChange={(e) => setPromoCard({ ...promoCard, subtitle: e.target.value })}
                placeholder="On Bestsellers"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-[#B71C1C]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">CTA Button Text</label>
              <input
                type="text"
                value={promoCard.buttonText || ''}
                onChange={(e) => setPromoCard({ ...promoCard, buttonText: e.target.value })}
                placeholder="SHOP NOW"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold uppercase outline-none focus:border-[#B71C1C]"
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Destination URL Link</label>
              <input
                type="text"
                value={promoCard.link || ''}
                onChange={(e) => setPromoCard({ ...promoCard, link: e.target.value })}
                placeholder="/shop"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono outline-none focus:border-[#B71C1C]"
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Promotional Graphic Image</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={promoCard.imageUrl || ''}
                  onChange={(e) => setPromoCard({ ...promoCard, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono outline-none focus:border-[#B71C1C]"
                />
                <label className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shrink-0 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Upload & Crop</span>
                  <input type="file" accept="image/*" onChange={handleImageFileSelect} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="pt-3">
            <span className="block font-bold text-slate-700 mb-2 text-xs">Customer Sidebar Card Live Preview:</span>
            <div className="w-[220px] h-[340px] rounded-2xl overflow-hidden relative shadow-md text-white p-4 flex flex-col justify-between bg-gradient-to-b from-[#7A0000] via-[#A30000] to-[#450000] border border-red-900">
              <img
                src={resolveImageUrl(promoCard.imageUrl)}
                alt={promoCard.title}
                className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay"
              />
              <div className="relative z-10 space-y-2">
                <span className="inline-block bg-black/40 border border-amber-400/60 text-amber-300 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                  {promoCard.badge || 'FESTIVE SPECIAL'}
                </span>
                <h4 className="font-display font-black text-xl leading-tight uppercase drop-shadow-md">
                  {promoCard.title || 'UP TO 60% OFF'}
                </h4>
                <p className="text-xs text-slate-100 font-bold drop-shadow-xs">
                  {promoCard.subtitle || 'On Bestsellers'}
                </p>
              </div>

              <div className="relative z-10 w-full">
                <button
                  type="button"
                  className="w-full bg-white text-slate-900 font-black text-xs uppercase py-2.5 rounded-full shadow-lg text-center"
                >
                  {promoCard.buttonText || 'SHOP NOW'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / ADD MODAL */}
      {editItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingItemIdx >= 0 ? 'Edit Sidebar Item' : 'Add New Sidebar Item'}
              </h3>
              <button
                type="button"
                onClick={() => setEditItemModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItemModal} className="p-4 space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Title *</label>
                <input
                  type="text"
                  value={itemForm.label}
                  onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })}
                  placeholder="e.g. Top Offers"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle / Tagline</label>
                <input
                  type="text"
                  value={itemForm.subtitle}
                  onChange={(e) => setItemForm({ ...itemForm, subtitle: e.target.value })}
                  placeholder="e.g. Best discounts on site"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-[#B71C1C]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Icon</label>
                <select
                  value={itemForm.icon}
                  onChange={(e) => setItemForm({ ...itemForm, icon: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C]"
                >
                  {AVAILABLE_ICONS.map((i) => (
                    <option key={i.name} value={i.name}>
                      {i.name} Icon
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Destination Link URL *</label>
                <input
                  type="text"
                  value={itemForm.link}
                  onChange={(e) => setItemForm({ ...itemForm, link: e.target.value })}
                  placeholder="e.g. /shop?filter=offers"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono outline-none focus:border-[#B71C1C]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Badge Text (Optional)</label>
                <input
                  type="text"
                  value={itemForm.badge}
                  onChange={(e) => setItemForm({ ...itemForm, badge: e.target.value })}
                  placeholder="e.g. 5% OFF or NEW"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditItemModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      <ImageUploadCropperModal
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageFile={selectedFile}
        configType="sidebarBanner"
        onConfirmCrop={handleConfirmCropImage}
      />
    </div>
  );
}
