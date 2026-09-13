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
  EyeOff,
  Zap,
  BadgePercent,
  Smartphone,
  Grid,
  Palette
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { broadcastSyncEvent } from '../services/api';
import { resolveImageUrl } from '../utils/imageUtils';
import ImageUploadCropperModal from '../components/ImageUploadCropperModal';

const AVAILABLE_ICONS = [
  'Tag', 'Clock', 'Award', 'TrendingUp', 'Crown', 'Gift', 'Truck', 'Headphones',
  'Sparkles', 'Percent', 'Star', 'Shield', 'Flame', 'Heart', 'ShoppingBag', 'User',
  'CheckCircle2', 'Grid', 'Layers', 'Zap'
];

const ACTION_TYPES = [
  { label: 'Shop Catalog (/shop)', value: 'SHOP' },
  { label: 'Category Filter (/shop?category=...)', value: 'PRODUCT_CATEGORY' },
  { label: 'Filter Page (/shop?filter=...)', value: 'PRODUCT_FILTER' },
  { label: 'Specific Product (/product/:id)', value: 'PRODUCT' },
  { label: 'Contact Us (/contact)', value: 'CONTACT' },
  { label: 'Track Order / Profile (/profile)', value: 'TRACK_ORDER' },
  { label: 'External Web Link', value: 'EXTERNAL_URL' }
];

const SECTION_TYPES = [
  { label: 'Quick Navigation List', value: 'NAV_MENU' },
  { label: 'Discount Offer Card (Prepaid/Coupon)', value: 'OFFER_CARD' },
  { label: 'Full Promo Banner Image Card', value: 'PROMO_BANNER' },
  { label: 'Shop By Price Range Pills', value: 'SHOP_BY_PRICE' },
  { label: 'Quick Categories Grid', value: 'CATEGORIES_GRID' },
  { label: 'Why Shop With Karviyam Points', value: 'WHY_KARVIYAM' },
  { label: 'Popular Picks Product Widget', value: 'POPULAR_PICKS' },
  { label: 'Deals Under Price Card', value: 'DEALS_UNDER' },
  { label: 'Checklist Trust Card', value: 'CHECKLIST_CARD' },
  { label: 'Today\'s Special Deal Countdown', value: 'TODAYS_DEAL' },
  { label: 'Quick Deals List', value: 'QUICK_DEALS' },
  { label: 'Unlock Extra Savings Card', value: 'COUPON_SAVINGS' },
  { label: 'Style Inspiration Image Card', value: 'STYLE_INSPIRATION' },
  { label: 'Join Community Newsletter', value: 'COMMUNITY_JOIN' },
  { label: 'Daily Style Tip Card', value: 'STYLE_TIP' },
  { label: 'Need Assistance Support Card', value: 'NEED_ASSISTANCE' },
  { label: 'Generic Custom Card', value: 'CUSTOM_CARD' }
];

export default function AdminSidebarPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('LEFT'); // 'LEFT' | 'RIGHT'

  // Sections State
  const [leftSections, setLeftSections] = useState([]);
  const [rightSections, setRightSections] = useState([]);

  // Modal State for Adding / Editing Section
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    id: '',
    side: 'LEFT',
    sectionType: 'CUSTOM_CARD',
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    icon: 'Sparkles',
    badgeText: '',
    buttonText: 'SHOP NOW',
    actionType: 'SHOP',
    actionValue: '/shop',
    backgroundColor: '#FFFFFF',
    textColor: '#1E293B',
    enabled: true,
    displayOrder: 1,
    configStr: ''
  });

  // Image Cropper Modal State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchSidebarConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/sidebar-config').catch(() => null);
      const data = res?.data?.data || res?.data;

      if (data) {
        if (Array.isArray(data.leftSections)) {
          setLeftSections([...data.leftSections].sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0)));
        }
        if (Array.isArray(data.rightSections)) {
          setRightSections([...data.rightSections].sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0)));
        }
      }
    } catch (e) {
      toast.error('Failed to load sidebar sections from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSidebarConfig();
  }, []);

  const currentSections = activeTab === 'LEFT' ? leftSections : rightSections;

  // Toggle Enable / Disable section
  const handleToggleEnable = async (sec) => {
    const updated = { ...sec, enabled: !sec.enabled };
    try {
      await api.post('/admin/sidebar-config/section', updated);
      toast.success(`Section "${sec.title || sec.id}" ${updated.enabled ? 'enabled' : 'disabled'}!`);
      fetchSidebarConfig();
      broadcastSyncEvent('karviyam_sidebar_config_updated');
    } catch (e) {
      toast.error('Failed to toggle section status.');
    }
  };

  // Move section UP / DOWN
  const handleMoveOrder = async (idx, direction) => {
    const list = [...currentSections];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    const sectionIds = list.map(s => s.id);
    try {
      await api.post('/admin/sidebar-config/reorder', { sectionIds });
      toast.success('Section order updated!');
      fetchSidebarConfig();
      broadcastSyncEvent('karviyam_sidebar_config_updated');
    } catch (e) {
      toast.error('Failed to reorder sections.');
    }
  };

  // Delete section
  const handleDeleteSection = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sidebar section?')) return;
    try {
      await api.delete(`/admin/sidebar-config/section/${id}`);
      toast.success('Section deleted successfully!');
      fetchSidebarConfig();
      broadcastSyncEvent('karviyam_sidebar_config_updated');
    } catch (e) {
      toast.error('Failed to delete section.');
    }
  };

  // Open modal for NEW section
  const handleOpenAddModal = () => {
    setSectionForm({
      id: `sec_${activeTab.toLowerCase()}_${Date.now()}`,
      side: activeTab,
      sectionType: 'CUSTOM_CARD',
      title: '',
      subtitle: '',
      description: '',
      imageUrl: '',
      icon: 'Sparkles',
      badgeText: '',
      buttonText: 'SHOP NOW →',
      actionType: 'SHOP',
      actionValue: '/shop',
      backgroundColor: '#FFFFFF',
      textColor: '#1E293B',
      enabled: true,
      displayOrder: currentSections.length + 1,
      configStr: ''
    });
    setEditModalOpen(true);
  };

  // Open modal to EDIT section
  const handleOpenEditModal = (sec) => {
    setSectionForm({
      id: sec.id,
      side: sec.side || activeTab,
      sectionType: sec.sectionType || 'CUSTOM_CARD',
      title: sec.title || '',
      subtitle: sec.subtitle || '',
      description: sec.description || '',
      imageUrl: sec.imageUrl || '',
      icon: sec.icon || 'Sparkles',
      badgeText: sec.badgeText || '',
      buttonText: sec.buttonText || '',
      actionType: sec.actionType || 'SHOP',
      actionValue: sec.actionValue || '/shop',
      backgroundColor: sec.backgroundColor || '#FFFFFF',
      textColor: sec.textColor || '#1E293B',
      enabled: sec.enabled !== false,
      displayOrder: sec.displayOrder || 1,
      configStr: sec.config ? JSON.stringify(sec.config, null, 2) : ''
    });
    setEditModalOpen(true);
  };

  // Handle Image File Select -> Trigger Cropper
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCropperOpen(true);
    }
  };

  const handleCroppedImage = (base64Url) => {
    setSectionForm(prev => ({ ...prev, imageUrl: base64Url }));
    toast.success('Image processed and attached! Click Save Section to persist.');
  };

  // Save Section in Modal
  const handleSaveSectionForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let parsedConfig = null;
      if (sectionForm.configStr && sectionForm.configStr.trim()) {
        try {
          parsedConfig = JSON.parse(sectionForm.configStr);
        } catch (eParse) {
          toast.error('Invalid JSON configuration syntax. Please fix formatting.');
          setSaving(false);
          return;
        }
      }

      const payload = {
        ...sectionForm,
        config: parsedConfig
      };

      await api.post('/admin/sidebar-config/section', payload);
      toast.success('Sidebar Section saved & synchronized to database! 🎉');
      setEditModalOpen(false);
      fetchSidebarConfig();
      broadcastSyncEvent('karviyam_sidebar_config_updated');
    } catch (err) {
      toast.error('Failed to save sidebar section.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#C91C1C] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Storefront Sidebar Management
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Fully admin-managed, database-synced Left & Right Homepage Sidebars
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSidebarConfig}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#C91C1C] hover:bg-[#A81515] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New {activeTab} Section</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('LEFT')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'LEFT'
              ? 'border-[#C91C1C] text-[#C91C1C] bg-red-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Left Sidebar Sections</span>
          <span className="bg-red-100 text-[#C91C1C] text-[10px] px-2 py-0.5 rounded-full">
            {leftSections.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RIGHT')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'RIGHT'
              ? 'border-[#C91C1C] text-[#C91C1C] bg-red-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Right Sidebar Sections</span>
          <span className="bg-red-100 text-[#C91C1C] text-[10px] px-2 py-0.5 rounded-full">
            {rightSections.length}
          </span>
        </button>
      </div>

      {/* Section List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#C91C1C] mb-2" />
          <p className="text-xs font-bold">Loading sidebar sections from database...</p>
        </div>
      ) : currentSections.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No {activeTab} sidebar sections configured yet</h3>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#C91C1C] text-white text-xs font-bold rounded-xl"
          >
            + Create First Section
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {currentSections.map((sec, idx) => (
            <div
              key={sec.id}
              className={`p-4 bg-white rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                sec.enabled ? 'border-slate-200 shadow-xs' : 'border-slate-200/60 bg-slate-50/50 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveOrder(idx, 'up')}
                    className="p-1 text-slate-400 hover:text-[#C91C1C] disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === currentSections.length - 1}
                    onClick={() => handleMoveOrder(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-[#C91C1C] disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Thumbnail / Icon */}
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {sec.imageUrl ? (
                    <img src={resolveImageUrl(sec.imageUrl)} alt={sec.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-extrabold text-xs text-[#C91C1C]">{sec.icon || '★'}</span>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {sec.sectionType}
                    </span>
                    {sec.badgeText && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-100 text-[#C91C1C]">
                        {sec.badgeText}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400">Order: #{sec.displayOrder}</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 truncate mt-0.5">
                    {sec.title || '(No Title)'}
                  </h4>
                  {sec.subtitle && <p className="text-xs text-slate-500 truncate">{sec.subtitle}</p>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => handleToggleEnable(sec)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                    sec.enabled ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {sec.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{sec.enabled ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditModal(sec)}
                  className="p-2 text-slate-600 hover:text-[#C91C1C] hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Edit Section"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteSection(sec.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Delete Section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Section Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {sectionForm.id ? 'Edit Sidebar Section' : 'Add New Sidebar Section'}
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSectionForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sidebar Target</label>
                  <select
                    value={sectionForm.side}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, side: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="LEFT">LEFT SIDEBAR</option>
                    <option value="RIGHT">RIGHT SIDEBAR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section Component Type</label>
                  <select
                    value={sectionForm.sectionType}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, sectionType: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    {SECTION_TYPES.map(st => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={sectionForm.title}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. FESTIVE SPECIAL"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={sectionForm.subtitle}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="e.g. On Bestsellers"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Details</label>
                <textarea
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional card text description..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              {/* Promotional Image Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Promotional Image</label>
                <div className="flex items-center gap-3">
                  {sectionForm.imageUrl && (
                    <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
                      <img src={resolveImageUrl(sectionForm.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      id="sidebar-img-input"
                    />
                    <label
                      htmlFor="sidebar-img-input"
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                    >
                      <ImageIcon className="w-4 h-4 text-[#C91C1C]" />
                      <span>{sectionForm.imageUrl ? 'Replace Image' : 'Upload Image'}</span>
                    </label>
                    {sectionForm.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setSectionForm(prev => ({ ...prev, imageUrl: '' }))}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={sectionForm.badgeText}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, badgeText: e.target.value }))}
                    placeholder="e.g. INSTANT DISCOUNT"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Button CTA Text</label>
                  <input
                    type="text"
                    value={sectionForm.buttonText}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, buttonText: e.target.value }))}
                    placeholder="e.g. SHOP NOW →"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Button Action Type</label>
                  <select
                    value={sectionForm.actionType}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, actionType: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    {ACTION_TYPES.map(at => (
                      <option key={at.value} value={at.value}>{at.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Link / Destination</label>
                  <input
                    type="text"
                    value={sectionForm.actionValue}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, actionValue: e.target.value }))}
                    placeholder="e.g. /shop?category=Sneakers"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={sectionForm.backgroundColor.startsWith('#') ? sectionForm.backgroundColor : '#FFFFFF'}
                      onChange={(e) => setSectionForm(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={sectionForm.backgroundColor}
                      onChange={(e) => setSectionForm(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      placeholder="#FFF5F5"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={sectionForm.displayOrder}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Sub-Items JSON / Config Editor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sub-Items Configuration (JSON List / Options - Optional)
                </label>
                <textarea
                  value={sectionForm.configStr}
                  onChange={(e) => setSectionForm(prev => ({ ...prev, configStr: e.target.value }))}
                  placeholder={`[\n  { "label": "Under ₹499", "link": "/shop?maxPrice=499" }\n]`}
                  rows={4}
                  className="w-full bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl p-3 border border-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#C91C1C] hover:bg-[#A81515] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Saving Section...' : 'Save Section'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {cropperOpen && selectedFile && (
        <ImageUploadCropperModal
          isOpen={cropperOpen}
          onClose={() => setCropperOpen(false)}
          imageFile={selectedFile}
          onCropComplete={handleCroppedImage}
          aspectRatio={4 / 5}
        />
      )}
    </div>
  );
}
