import React, { useState, useEffect } from 'react';
import {
  Globe,
  Save,
  RefreshCw,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  MoveUp,
  MoveDown,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Shield,
  Phone,
  Mail,
  MapPin,
  Info,
  Layers,
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight,
  Eye,
  Check,
  X
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { resolveImageUrl, isValidImageUrl } from '../utils/imageUtils';

export default function AdminFooterPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    footerEnabled: true,
    brandName: 'KARVIYAM',
    about: 'Karviyam is a premium marketplace destination for high-street streetwear, 925 sterling silver jewellery, luxury kicks, and lifestyle products.',
    address: 'Tamil Nadu, Salem, Attur, Gangavalli - 636105',
    phone: '+91 93443 30782',
    email: 'vanakkam@karviyam.com',
    logoUrl: '',
    copyright: '© 2026 Karviyam E-Commerce Platform. All Rights Reserved. Built for Enterprise Performance.',
    stayUpdatedTitle: 'STAY UPDATED',
    stayUpdatedDescription: 'Subscribe to get special drop alerts, VIP coupons & discounts.',
    newsletterEnabled: true,
    socialLinks: {
      instagram: 'https://instagram.com/karviyam',
      facebook: 'https://facebook.com/karviyam',
      youtube: 'https://youtube.com/karviyam',
      whatsapp: 'https://wa.me/919344330782',
      twitter: 'https://twitter.com/karviyam'
    },
    columns: [
      {
        id: 'col_categories',
        title: 'CATEGORIES',
        enabled: true,
        order: 1,
        links: [
          { id: 'l1', title: 'Oversized T-Shirts', destinationType: 'Category', destination: '/shop?category=Clothing', openNewTab: false, enabled: true, order: 1 },
          { id: 'l2', title: 'Casual Linen Shirts', destinationType: 'Category', destination: '/shop?category=Clothing', openNewTab: false, enabled: true, order: 2 },
          { id: 'l3', title: 'Apex Stealth Sneakers', destinationType: 'Category', destination: '/shop?category=Footwear', openNewTab: false, enabled: true, order: 3 },
          { id: 'l4', title: '925 Silver Jewellery', destinationType: 'Category', destination: '/shop?category=Jewellery', openNewTab: false, enabled: true, order: 4 },
          { id: 'l5', title: 'Anime Graphic Hoodies', destinationType: 'Category', destination: '/shop?category=Clothing', openNewTab: false, enabled: true, order: 5 }
        ]
      },
      {
        id: 'col_customercare',
        title: 'CUSTOMER CARE',
        enabled: true,
        order: 2,
        links: [
          { id: 'l6', title: 'Track My Order', destinationType: 'Page', destination: '/profile', openNewTab: false, enabled: true, order: 1 },
          { id: 'l7', title: 'Help Center & FAQ', destinationType: 'Page', destination: '/contact', openNewTab: false, enabled: true, order: 2 },
          { id: 'l8', title: 'Return Policy', destinationType: 'Page', destination: '/contact', openNewTab: false, enabled: true, order: 3 },
          { id: 'l9', title: 'Terms of Service', destinationType: 'Page', destination: '/contact', openNewTab: false, enabled: true, order: 4 },
          { id: 'l10', title: 'Privacy Policy', destinationType: 'Page', destination: '/contact', openNewTab: false, enabled: true, order: 5 }
        ]
      },
      {
        id: 'col_quicklinks',
        title: 'QUICK LINKS',
        enabled: true,
        order: 3,
        links: [
          { id: 'l11', title: 'About Us', destinationType: 'Page', destination: '/contact', openNewTab: false, enabled: true, order: 1 },
          { id: 'l12', title: 'Shop Catalog', destinationType: 'Page', destination: '/shop', openNewTab: false, enabled: true, order: 2 },
          { id: 'l13', title: 'New Arrivals', destinationType: 'Page', destination: '/shop?filter=new', openNewTab: false, enabled: true, order: 3 },
          { id: 'l14', title: 'Best Sellers', destinationType: 'Page', destination: '/shop?filter=bestsellers', openNewTab: false, enabled: true, order: 4 },
          { id: 'l15', title: 'Contact Us', destinationType: 'Page', destination: '/contact', openNewTab: false, enabled: true, order: 5 }
        ]
      }
    ]
  });

  // Active Selected Column Index for Link Editing
  const [selectedColIdx, setSelectedColIdx] = useState(0);

  // Link Modal State
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editingLinkIndex, setEditingLinkIndex] = useState(-1);
  const [linkForm, setLinkForm] = useState({
    title: '',
    destinationType: 'Page',
    destination: '',
    openNewTab: false,
    enabled: true,
    order: 1
  });

  // New Column Modal / Inline State
  const [newColTitle, setNewColTitle] = useState('');
  const [showAddColInput, setShowAddColInput] = useState(false);

  const fetchFooterData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/footer-settings');
      const data = res.data?.data || res.data || {};
      if (data && typeof data === 'object') {
        setFormData(prev => ({
          ...prev,
          footerEnabled: data.footerEnabled !== undefined ? Boolean(data.footerEnabled) : prev.footerEnabled,
          brandName: data.brandName || prev.brandName,
          about: data.about || data.footerAbout || prev.about,
          address: data.address || data.registeredAddress || prev.address,
          phone: data.phone || data.supportPhone || prev.phone,
          email: data.email || data.supportEmail || prev.email,
          logoUrl: data.logoUrl || prev.logoUrl,
          copyright: data.copyright || data.copyrightText || prev.copyright,
          stayUpdatedTitle: data.stayUpdatedTitle || prev.stayUpdatedTitle,
          stayUpdatedDescription: data.stayUpdatedDescription || prev.stayUpdatedDescription,
          newsletterEnabled: data.newsletterEnabled !== undefined ? Boolean(data.newsletterEnabled) : prev.newsletterEnabled,
          socialLinks: (data.socialLinks && typeof data.socialLinks === 'object') ? data.socialLinks : prev.socialLinks,
          columns: Array.isArray(data.columns) && data.columns.length > 0 ? data.columns : prev.columns
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load footer settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFooterData();
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, SVG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, logoUrl: reader.result }));
      toast.success('Logo uploaded successfully. Remember to click Save Changes!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const res = await api.post('/admin/footer-settings', formData).catch(() => api.post('/footer-settings', formData));

      if (res?.data?.success || res?.status === 200) {
        toast.success('Footer management settings saved & updated live!');
        if (formData.logoUrl) {
          localStorage.setItem('karviyam_logo', formData.logoUrl);
        } else {
          localStorage.removeItem('karviyam_logo');
        }
        window.dispatchEvent(new Event('karviyam_footer_updated'));
        window.dispatchEvent(new Event('karviyam_logo_updated'));
        window.dispatchEvent(new Event('storage'));
      } else {
        toast.error(res?.data?.message || 'Failed to save footer settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Unable to save footer settings to database');
    } finally {
      setSaving(false);
    }
  };

  // Column Actions
  const handleAddColumn = () => {
    if (!newColTitle.trim()) {
      toast.error('Please enter a column title');
      return;
    }
    const newCol = {
      id: `col_${Date.now()}`,
      title: newColTitle.trim().toUpperCase(),
      enabled: true,
      order: formData.columns.length + 1,
      links: []
    };
    setFormData(prev => ({ ...prev, columns: [...prev.columns, newCol] }));
    setNewColTitle('');
    setShowAddColInput(false);
    setSelectedColIdx(formData.columns.length);
    toast.success(`Column '${newCol.title}' added!`);
  };

  const handleDeleteColumn = (idx) => {
    if (formData.columns.length <= 1) {
      toast.error('At least one column is required');
      return;
    }
    const colName = formData.columns[idx]?.title;
    if (window.confirm(`Delete column "${colName}" and all its links?`)) {
      setFormData(prev => {
        const cols = [...prev.columns];
        cols.splice(idx, 1);
        return { ...prev, columns: cols };
      });
      setSelectedColIdx(0);
      toast.success(`Column '${colName}' deleted`);
    }
  };

  const handleToggleColumn = (idx) => {
    setFormData(prev => {
      const cols = [...prev.columns];
      cols[idx].enabled = !cols[idx].enabled;
      return { ...prev, columns: cols };
    });
  };

  const handleMoveColumn = (idx, direction) => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= formData.columns.length) return;

    setFormData(prev => {
      const cols = [...prev.columns];
      const temp = cols[idx];
      cols[idx] = cols[targetIdx];
      cols[targetIdx] = temp;
      cols.forEach((c, i) => c.order = i + 1);
      return { ...prev, columns: cols };
    });
    setSelectedColIdx(targetIdx);
  };

  // Link Actions
  const handleOpenAddLinkModal = () => {
    const currentCol = formData.columns[selectedColIdx];
    if (!currentCol) return;
    setEditingLinkIndex(-1);
    setLinkForm({
      title: '',
      destinationType: 'Category',
      destination: '/shop?category=Clothing',
      openNewTab: false,
      enabled: true,
      order: (currentCol.links || []).length + 1
    });
    setLinkModalOpen(true);
  };

  const handleOpenEditLinkModal = (linkIdx) => {
    const currentCol = formData.columns[selectedColIdx];
    if (!currentCol || !currentCol.links[linkIdx]) return;
    const l = currentCol.links[linkIdx];
    setEditingLinkIndex(linkIdx);
    setLinkForm({
      title: l.title || '',
      destinationType: l.destinationType || 'Page',
      destination: l.destination || '',
      openNewTab: Boolean(l.openNewTab),
      enabled: l.enabled !== false,
      order: l.order || linkIdx + 1
    });
    setLinkModalOpen(true);
  };

  const handleSaveLinkModal = (e) => {
    e.preventDefault();
    if (!linkForm.title.trim()) {
      toast.error('Please enter a link title');
      return;
    }
    if (!linkForm.destination.trim()) {
      toast.error('Please enter a destination URL or route');
      return;
    }

    setFormData(prev => {
      const cols = [...prev.columns];
      const currentCol = cols[selectedColIdx];
      if (!currentCol) return prev;

      const links = [...(currentCol.links || [])];
      const newLinkItem = {
        id: editingLinkIndex >= 0 ? links[editingLinkIndex].id : `l_${Date.now()}`,
        title: linkForm.title.trim(),
        destinationType: linkForm.destinationType,
        destination: linkForm.destination.trim(),
        openNewTab: linkForm.openNewTab,
        enabled: linkForm.enabled,
        order: Number(linkForm.order) || (editingLinkIndex >= 0 ? links[editingLinkIndex].order : links.length + 1)
      };

      if (editingLinkIndex >= 0) {
        links[editingLinkIndex] = newLinkItem;
      } else {
        links.push(newLinkItem);
      }

      currentCol.links = links;
      return { ...prev, columns: cols };
    });

    setLinkModalOpen(false);
    toast.success(editingLinkIndex >= 0 ? 'Link updated!' : 'Link added!');
  };

  const handleDeleteLink = (linkIdx) => {
    setFormData(prev => {
      const cols = [...prev.columns];
      const currentCol = cols[selectedColIdx];
      if (!currentCol) return prev;
      currentCol.links.splice(linkIdx, 1);
      return { ...prev, columns: cols };
    });
    toast.success('Link deleted');
  };

  const handleToggleLink = (linkIdx) => {
    setFormData(prev => {
      const cols = [...prev.columns];
      const currentCol = cols[selectedColIdx];
      if (!currentCol) return prev;
      currentCol.links[linkIdx].enabled = !currentCol.links[linkIdx].enabled;
      return { ...prev, columns: cols };
    });
  };

  const handleMoveLink = (linkIdx, direction) => {
    const currentCol = formData.columns[selectedColIdx];
    if (!currentCol) return;
    const targetIdx = direction === 'up' ? linkIdx - 1 : linkIdx + 1;
    if (targetIdx < 0 || targetIdx >= currentCol.links.length) return;

    setFormData(prev => {
      const cols = [...prev.columns];
      const links = [...cols[selectedColIdx].links];
      const temp = links[linkIdx];
      links[linkIdx] = links[targetIdx];
      links[targetIdx] = temp;
      links.forEach((l, i) => l.order = i + 1);
      cols[selectedColIdx].links = links;
      return { ...prev, columns: cols };
    });
  };

  const activeColObj = formData.columns[selectedColIdx] || formData.columns[0];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 text-slate-800 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-[#B71C1C] tracking-widest bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
              STOREFRONT CONFIGURATION
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 flex items-center gap-2.5 mt-1">
            <Globe className="w-6 h-6 text-[#B71C1C]" />
            <span>Footer Management</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage your storefront footer logo, brand story, contact details, dynamic column links, newsletter subscription, social media handles & legal copyright.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'SAVE CHANGES'}</span>
        </button>
      </div>

      {/* 1. FOOTER STATUS BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${formData.footerEnabled ? 'bg-emerald-600' : 'bg-slate-400'}`}>
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-900">
              Footer Display Status: <span className={formData.footerEnabled ? 'text-emerald-600 font-extrabold' : 'text-slate-500'}>{formData.footerEnabled ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Toggle to show or hide the storefront footer component across all pages.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, footerEnabled: !prev.footerEnabled }))}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black cursor-pointer transition-all ${
            formData.footerEnabled
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {formData.footerEnabled ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
          <span>{formData.footerEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* 2. BRAND INFORMATION & LOGO MANAGEMENT */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <h3 className="font-display font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-[#B71C1C]" />
          <span>Brand Information & Logo Management</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Logo Section */}
          <div className="md:col-span-4 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-800">Storefront Footer Logo</label>
            
            {/* Logo Preview */}
            <div className="w-full h-24 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-2 shadow-2xs relative overflow-hidden">
              {formData.logoUrl && isValidImageUrl(formData.logoUrl) ? (
                <img
                  src={resolveImageUrl(formData.logoUrl)}
                  alt="Karviyam Logo"
                  className="max-h-full max-w-full object-contain"
                  onError={() => toast.error('Uploaded logo URL failed to load')}
                />
              ) : (
                <div className="flex items-center gap-2 text-[#B71C1C]">
                  <div className="w-8 h-8 rounded-lg bg-[#B71C1C] text-white flex items-center justify-center font-black text-base shadow-xs">
                    K
                  </div>
                  <span className="font-display font-black text-lg tracking-tight text-[#B71C1C]">
                    {formData.brandName || 'KARVIYAM'}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-600">Logo Image URL</label>
              <input
                type="text"
                value={formData.logoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                placeholder="e.g. /uploads/logo.png or https://..."
                className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-[#B71C1C]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <label className="flex-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs py-2 px-3 rounded-xl cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-[#B71C1C]" />
                <span>Upload File</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>

              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                  className="bg-red-50 text-[#B71C1C] hover:bg-red-100 font-bold text-xs px-3 py-2 rounded-xl border border-red-200 cursor-pointer"
                  title="Reset to Default Logo"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Brand Details */}
          <div className="md:col-span-8 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Brand Display Name</label>
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) => setFormData(prev => ({ ...prev, brandName: e.target.value }))}
                placeholder="KARVIYAM"
                className="w-full bg-slate-50 border border-slate-200 text-xs px-4 py-2.5 rounded-xl font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Brand Story & Footer Description</label>
              <textarea
                rows={4}
                value={formData.about}
                onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                placeholder="Karviyam is a premium marketplace destination..."
                className="w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-xl font-medium outline-none focus:border-[#B71C1C] focus:bg-white leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONTACT INFORMATION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-display font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Phone className="w-5 h-5 text-[#B71C1C]" />
          <span>Contact Information</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#B71C1C]" />
              <span>Registered Address</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Tamil Nadu, Salem, Attur, Gangavalli - 636105"
              className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl font-medium outline-none focus:border-[#B71C1C] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#B71C1C]" />
              <span>Support Phone</span>
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+91 93443 30782"
              className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl font-medium outline-none focus:border-[#B71C1C] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#B71C1C]" />
              <span>Support Email</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="vanakkam@karviyam.com"
              className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl font-medium outline-none focus:border-[#B71C1C] focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* 4. FOOTER COLUMNS & LINKS MANAGEMENT */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#B71C1C]" />
              <span>Footer Column & Link Management</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Add, edit, reorder columns and links for Categories, Customer Care, Quick Links, etc.
            </p>
          </div>

          {/* Add Column Button */}
          {!showAddColInput ? (
            <button
              type="button"
              onClick={() => setShowAddColInput(true)}
              className="bg-red-50 hover:bg-red-100 text-[#B71C1C] font-extrabold text-xs px-4 py-2 rounded-xl border border-red-200 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ ADD COLUMN</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                placeholder="Column Title (e.g. QUICK LINKS)"
                className="bg-slate-50 border border-slate-300 text-xs px-3 py-2 rounded-xl outline-none focus:border-[#B71C1C]"
              />
              <button
                type="button"
                onClick={handleAddColumn}
                className="bg-[#B71C1C] text-white font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowAddColInput(false)}
                className="bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Columns Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 pb-2">
          {formData.columns.map((col, idx) => (
            <button
              key={col.id || idx}
              type="button"
              onClick={() => setSelectedColIdx(idx)}
              className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                selectedColIdx === idx
                  ? 'bg-[#B71C1C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{col.title}</span>
              {!col.enabled && <span className="text-[10px] opacity-70">(Disabled)</span>}
              <span className="bg-white/20 text-xs px-1.5 py-0.2 rounded-full font-bold">
                {(col.links || []).length}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Column Controls & Links Table */}
        {activeColObj && (
          <div className="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80">
            {/* Column Control Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={activeColObj.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => {
                      const cols = [...prev.columns];
                      cols[selectedColIdx].title = val;
                      return { ...prev, columns: cols };
                    });
                  }}
                  className="font-display font-black text-sm text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg outline-none focus:border-[#B71C1C] uppercase"
                />

                <button
                  type="button"
                  onClick={() => handleToggleColumn(selectedColIdx)}
                  className={`text-xs font-extrabold px-3 py-1 rounded-lg border cursor-pointer ${
                    activeColObj.enabled !== false
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-slate-100 border-slate-300 text-slate-600'
                  }`}
                >
                  {activeColObj.enabled !== false ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMoveColumn(selectedColIdx, 'up')}
                  disabled={selectedColIdx === 0}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg cursor-pointer"
                  title="Move Column Left / Up"
                >
                  <MoveUp className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleMoveColumn(selectedColIdx, 'down')}
                  disabled={selectedColIdx === formData.columns.length - 1}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg cursor-pointer"
                  title="Move Column Right / Down"
                >
                  <MoveDown className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteColumn(selectedColIdx)}
                  className="p-1.5 bg-red-50 hover:bg-red-100 text-[#B71C1C] rounded-lg border border-red-200 cursor-pointer"
                  title="Delete Column"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddLinkModal}
                  className="bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer ml-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ ADD LINK</span>
                </button>
              </div>
            </div>

            {/* Links Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10.5px] tracking-wider border-b border-slate-200">
                    <th className="p-3">Order</th>
                    <th className="p-3">Link Title</th>
                    <th className="p-3">Destination Type</th>
                    <th className="p-3">Destination Path / URL</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(!activeColObj.links || activeColObj.links.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                        No links in this column yet. Click "+ ADD LINK" to add destination links.
                      </td>
                    </tr>
                  ) : (
                    activeColObj.links.map((link, lIdx) => (
                      <tr key={link.id || lIdx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-400">{lIdx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">{link.title}</td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            {link.destinationType || 'Page'}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-sky-700 truncate max-w-[200px]" title={link.destination}>
                          {link.destination}
                        </td>
                        <td className="p-3 text-[11px]">
                          {link.openNewTab ? (
                            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">New Tab</span>
                          ) : (
                            <span className="text-slate-500 font-medium">Same Window</span>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleToggleLink(lIdx)}
                            className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                              link.enabled !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {link.enabled !== false ? 'ON' : 'OFF'}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveLink(lIdx, 'up')}
                              disabled={lIdx === 0}
                              className="p-1 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-600 cursor-pointer"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveLink(lIdx, 'down')}
                              disabled={lIdx === activeColObj.links.length - 1}
                              className="p-1 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-600 cursor-pointer"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditLinkModal(lIdx)}
                              className="p-1 hover:bg-sky-50 text-sky-600 rounded cursor-pointer"
                              title="Edit Link"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLink(lIdx)}
                              className="p-1 hover:bg-red-50 text-[#B71C1C] rounded cursor-pointer"
                              title="Delete Link"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 5. STAY UPDATED / NEWSLETTER CONFIGURATION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#B71C1C]" />
            <span>Stay Updated / Newsletter Configuration</span>
          </h3>

          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, newsletterEnabled: !prev.newsletterEnabled }))}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black cursor-pointer ${
              formData.newsletterEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span>Newsletter Block: {formData.newsletterEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Section Title</label>
            <input
              type="text"
              value={formData.stayUpdatedTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, stayUpdatedTitle: e.target.value }))}
              placeholder="STAY UPDATED"
              className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-[#B71C1C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Section Subtitle / Description</label>
            <input
              type="text"
              value={formData.stayUpdatedDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, stayUpdatedDescription: e.target.value }))}
              placeholder="Subscribe to get special drop alerts, VIP coupons & discounts."
              className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl font-medium outline-none focus:border-[#B71C1C]"
            />
          </div>
        </div>
      </div>

      {/* 6. SOCIAL MEDIA HANDLES */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-display font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-[#B71C1C]" />
          <span>Social Media Links</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Instagram URL</label>
            <input
              type="text"
              value={formData.socialLinks?.instagram || ''}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, instagram: val } }));
              }}
              placeholder="https://instagram.com/karviyam"
              className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 rounded-xl outline-none focus:border-[#B71C1C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Facebook URL</label>
            <input
              type="text"
              value={formData.socialLinks?.facebook || ''}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, facebook: val } }));
              }}
              placeholder="https://facebook.com/karviyam"
              className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 rounded-xl outline-none focus:border-[#B71C1C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">YouTube URL</label>
            <input
              type="text"
              value={formData.socialLinks?.youtube || ''}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, youtube: val } }));
              }}
              placeholder="https://youtube.com/karviyam"
              className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 rounded-xl outline-none focus:border-[#B71C1C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">WhatsApp Chat URL</label>
            <input
              type="text"
              value={formData.socialLinks?.whatsapp || ''}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, whatsapp: val } }));
              }}
              placeholder="https://wa.me/919344330782"
              className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 rounded-xl outline-none focus:border-[#B71C1C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">X / Twitter URL</label>
            <input
              type="text"
              value={formData.socialLinks?.twitter || ''}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: val } }));
              }}
              placeholder="https://twitter.com/karviyam"
              className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 rounded-xl outline-none focus:border-[#B71C1C]"
            />
          </div>
        </div>
      </div>

      {/* 7. BOTTOM FOOTER COPYRIGHT BAR */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-display font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#B71C1C]" />
          <span>Bottom Footer Copyright Bar</span>
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">Copyright Text</label>
          <input
            type="text"
            value={formData.copyright}
            onChange={(e) => setFormData(prev => ({ ...prev, copyright: e.target.value }))}
            placeholder="© 2026 Karviyam E-Commerce Platform. All Rights Reserved."
            className="w-full bg-slate-50 border border-slate-200 text-xs px-4 py-2.5 rounded-xl font-medium outline-none focus:border-[#B71C1C]"
          />
        </div>
      </div>

      {/* SAVE BUTTON AT BOTTOM */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-extrabold text-xs uppercase tracking-wider px-8 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving Changes...' : 'SAVE ALL CHANGES'}</span>
        </button>
      </div>

      {/* EDIT LINK MODAL */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-base text-slate-900">
                {editingLinkIndex >= 0 ? 'Edit Footer Link' : 'Add New Footer Link'}
              </h3>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLinkModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Link Title</label>
                <input
                  type="text"
                  value={linkForm.title}
                  onChange={(e) => setLinkForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Oversized T-Shirts"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-[#B71C1C]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Destination Type</label>
                <select
                  value={linkForm.destinationType}
                  onChange={(e) => {
                    const type = e.target.value;
                    let defaultDest = '/shop';
                    if (type === 'Category') defaultDest = '/shop?category=Clothing';
                    else if (type === 'Product') defaultDest = '/product/1';
                    else if (type === 'Page') defaultDest = '/contact';
                    else if (type === 'Custom URL') defaultDest = 'https://';

                    setLinkForm(prev => ({
                      ...prev,
                      destinationType: type,
                      destination: defaultDest
                    }));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-[#B71C1C] cursor-pointer"
                >
                  <option value="Category">Category</option>
                  <option value="Product">Product</option>
                  <option value="Page">Page / System Route</option>
                  <option value="Custom URL">Custom URL</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Destination Route / URL</label>
                <input
                  type="text"
                  value={linkForm.destination}
                  onChange={(e) => setLinkForm(prev => ({ ...prev, destination: e.target.value }))}
                  placeholder="/shop?category=Clothing or https://..."
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono text-[11px] outline-none focus:border-[#B71C1C]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={linkForm.openNewTab}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, openNewTab: e.target.checked }))}
                    className="accent-[#B71C1C] w-4 h-4 rounded"
                  />
                  <span>Open in New Tab</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={linkForm.enabled}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="accent-[#B71C1C] w-4 h-4 rounded"
                  />
                  <span>Enabled</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold rounded-xl shadow-xs"
                >
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
