import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  X,
  Upload,
  Link as LinkIcon,
  Power,
  ArrowUp,
  ArrowDown,
  Loader2,
  Sparkles,
  ExternalLink,
  Tag,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { resolveImageUrl } from '../utils/imageUtils';
import ImageUploadCropperModal from '../components/ImageUploadCropperModal';
import ClearAllModal from '../components/ClearAllModal';
import BulkActionBar from '../components/BulkActionBar';

export default function AdminRightSidebarBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [cropperFile, setCropperFile] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    badgeText: 'LIMITED OFFER',
    title: '',
    description: '',
    imageUrl: '',
    buttonText: 'SHOP NOW',
    link: '/shop',
    displayOrder: 1,
    isActive: true
  });
  const [useUrlMode, setUseUrlMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [clearAllOpen, setClearAllOpen] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      let list = [];
      const res = await api.get('/right-sidebar-banners/admin').catch(() => null);
      const apiData = res?.data ? res.data : res;
      list = Array.isArray(apiData?.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);

      if (list && list.length > 0) {
        setBanners(list);
        try {
          localStorage.setItem('karviyam_admin_right_sidebar_banners', JSON.stringify(list));
        } catch (e) {}
      } else {
        const saved = localStorage.getItem('karviyam_admin_right_sidebar_banners');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setBanners(parsed);
        }
      }
    } catch (e) {
      toast.error('Failed to load right sidebar banners');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        badgeText: banner.badgeText || 'LIMITED OFFER',
        title: banner.title || '',
        description: banner.description || '',
        imageUrl: banner.imageUrl || banner.imagePath || '',
        buttonText: banner.buttonText || 'SHOP NOW',
        link: banner.link || '/shop',
        displayOrder: banner.displayOrder || 1,
        isActive: banner.isActive !== false
      });
      setUseUrlMode(banner.imageUrl && banner.imageUrl.startsWith('http'));
    } else {
      setEditingBanner(null);
      setFormData({
        badgeText: 'LIMITED OFFER',
        title: '',
        description: '',
        imageUrl: '',
        buttonText: 'SHOP NOW',
        link: '/shop',
        displayOrder: banners.length + 1,
        isActive: true
      });
      setUseUrlMode(false);
    }
    setModalOpen(true);
  };

  const handleImageFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCropperFile(file);
      e.target.value = '';
    }
  };

  const handleCroppedImageUpload = async (blob) => {
    const file = new File([blob], `right_banner_${Date.now()}.png`, { type: 'image/png' });
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      const res = await api.post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data.imageUrl || res.data.url || res.data.path;
      setFormData(prev => ({ ...prev, imageUrl: url }));
      toast.success('Image uploaded successfully (Transparency preserved)');
    } catch (e) {
      toast.error('Failed to upload image');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Banner Title is required');
      return;
    }
    if (!formData.imageUrl.trim()) {
      toast.error('Banner Image is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        badgeText: formData.badgeText,
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl,
        imagePath: formData.imageUrl,
        buttonText: formData.buttonText,
        link: formData.link,
        displayOrder: parseInt(formData.displayOrder, 10) || 1,
        isActive: formData.isActive
      };

      if (editingBanner) {
        await api.put(`/right-sidebar-banners/${editingBanner.id}`, payload);
        toast.success('Right sidebar banner updated successfully');
      } else {
        await api.post('/right-sidebar-banners', payload);
        toast.success('Right sidebar banner created successfully');
      }

      setModalOpen(false);
      await fetchBanners();
      window.dispatchEvent(new Event('karviyam_right_sidebar_banners_updated'));
    } catch (err) {
      toast.error('Failed to save right sidebar banner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (banner) => {
    setActionLoading(prev => ({ ...prev, [banner.id]: true }));
    try {
      await api.patch(`/right-sidebar-banners/${banner.id}/toggle`);
      toast.success(`Banner ${banner.isActive ? 'disabled' : 'enabled'} successfully`);
      await fetchBanners();
      window.dispatchEvent(new Event('karviyam_right_sidebar_banners_updated'));
    } catch (e) {
      toast.error('Failed to update banner status');
    } finally {
      setActionLoading(prev => ({ ...prev, [banner.id]: false }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this right sidebar banner?')) return;
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await api.delete(`/right-sidebar-banners/${id}`);
      toast.success('Right sidebar banner deleted');
      await fetchBanners();
      window.dispatchEvent(new Event('karviyam_right_sidebar_banners_updated'));
    } catch (e) {
      toast.error('Failed to delete banner');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(banners.map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkToggle = async (status) => {
    try {
      await Promise.all(
        selectedIds.map((id) =>
          api.put(`/right-sidebar-banners/${id}`, { isActive: status })
        )
      );
      toast.success(`Selected banners ${status ? 'enabled' : 'disabled'}`);
      setSelectedIds([]);
      await fetchBanners();
      window.dispatchEvent(new Event('karviyam_right_sidebar_banners_updated'));
    } catch (e) {
      toast.error('Bulk update failed');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected banners?`)) return;
    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/right-sidebar-banners/${id}`)));
      toast.success('Selected banners deleted');
      setSelectedIds([]);
      await fetchBanners();
      window.dispatchEvent(new Event('karviyam_right_sidebar_banners_updated'));
    } catch (e) {
      toast.error('Bulk delete failed');
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Light Theme Header */}
      <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-[#B71C1C] border border-rose-200">
              Desktop Right Sidebar
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {banners.length} Banners Total
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[#B71C1C]" />
            Right Sidebar Banners
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage promotional ad banners displayed on the right sidebar of the customer desktop homepage.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-[#B71C1C] hover:bg-[#8E0000] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Right Sidebar Banner</span>
        </button>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onBulkEnable={() => handleBulkToggle(true)}
          onBulkDisable={() => handleBulkToggle(false)}
          onBulkDelete={handleBulkDelete}
        />
      )}

      {/* Banners Grid / List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#B71C1C] animate-spin" />
          <p className="text-xs text-slate-500 font-bold mt-2">Loading right sidebar banners...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-sm">No Right Sidebar Banners Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">Create promotional banners to display custom offer ads in the desktop right sidebar.</p>
          <button
            onClick={() => handleOpenModal()}
            className="bg-[#B71C1C] text-white px-4 py-2 rounded-xl font-bold text-xs"
          >
            Create First Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`bg-white border rounded-2xl p-4 shadow-2xs space-y-3 relative transition-all ${
                banner.isActive ? 'border-slate-200' : 'border-slate-200/60 opacity-60'
              }`}
            >
              {/* Top Bar with Select Checkbox & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(banner.id)}
                    onChange={() => handleSelectOne(banner.id)}
                    className="rounded border-slate-300 text-[#B71C1C] focus:ring-[#B71C1C]"
                  />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    ORDER #{banner.displayOrder || 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    banner.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {banner.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={banner.isActive}
                      onChange={() => handleToggleStatus(banner)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#B71C1C]" />
                  </label>
                </div>
              </div>

              {/* Sidebar Banner Card Mockup Preview */}
              <div className="w-full bg-white rounded-xl border border-slate-200/90 p-3 flex items-center justify-between gap-2 shadow-2xs relative">
                <div className="flex-1 min-w-0 pr-1">
                  <span className="text-[9px] font-black uppercase text-[#B71C1C] tracking-wider block truncate">
                    {banner.badgeText || 'LIMITED OFFER'}
                  </span>
                  <h4 className="font-display font-black text-xs text-slate-900 leading-tight uppercase truncate mt-0.5" title={banner.title}>
                    {banner.title}
                  </h4>
                  <p className="text-[9.5px] text-slate-500 font-medium truncate mt-0.5" title={banner.description}>
                    {banner.description || 'Promotional offer description'}
                  </p>
                  <span className="text-[10px] font-black text-[#B71C1C] uppercase tracking-wide inline-flex items-center gap-1 mt-1.5">
                    {banner.buttonText || 'SHOP NOW'} →
                  </span>
                </div>

                {/* Transparency-preserved image container */}
                <div className="w-16 h-20 shrink-0 rounded-lg overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center relative">
                  <img
                    src={resolveImageUrl(banner.imageUrl || banner.imagePath)}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600';
                    }}
                  />
                </div>
              </div>

              {/* Destination Link */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 font-mono truncate">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{banner.link || '/shop'}</span>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => handleOpenModal(banner)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  disabled={actionLoading[banner.id]}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Banner Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#B71C1C]" />
                <span>{editingBanner ? 'Edit Right Sidebar Banner' : 'Add Right Sidebar Banner'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Badge Text */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Badge Text (Label)
                </label>
                <input
                  type="text"
                  value={formData.badgeText}
                  onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                  placeholder="e.g. KARVIYAM, LIMITED OFFER, FESTIVE SALE"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#B71C1C]"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Banner Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. PREMIUM COLLECTION"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#B71C1C]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Timeless styles for every occasion."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#B71C1C]"
                />
              </div>

              {/* Button Text & Destination Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    placeholder="e.g. EXPLORE NOW, SHOP NOW"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#B71C1C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Destination Link URL
                  </label>
                  <input
                    type="text"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="e.g. /shop, /category/women"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#B71C1C]"
                  />
                </div>
              </div>

              {/* Image Input Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Banner Image *
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseUrlMode(!useUrlMode)}
                    className="text-[11px] font-bold text-[#B71C1C] hover:underline cursor-pointer"
                  >
                    {useUrlMode ? 'Switch to Upload' : 'Paste Image URL'}
                  </button>
                </div>

                {useUrlMode ? (
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#B71C1C]"
                  />
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-2xl hover:border-[#B71C1C] transition-colors cursor-pointer bg-slate-50">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-extrabold text-slate-700">Click to upload banner image</span>
                    <span className="text-[10px] text-slate-400">PNG (Transparent supported), JPG, WebP</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileSelect}
                      className="hidden"
                    />
                  </label>
                )}

                {formData.imageUrl && (
                  <div className="mt-2 p-2 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-3">
                    <div className="w-12 h-14 bg-white rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                      <img
                        src={resolveImageUrl(formData.imageUrl)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-slate-700 truncate">{formData.imageUrl}</p>
                      <p className="text-[10px] text-emerald-600 font-bold">✓ Image Ready</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Display Order & Active Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#B71C1C]"
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-extrabold text-slate-800">Banner Enabled</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#B71C1C]" />
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#B71C1C] hover:bg-[#8E0000] cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingBanner ? 'Update Banner' : 'Create Banner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {cropperFile && (
        <ImageUploadCropperModal
          file={cropperFile}
          onClose={() => setCropperFile(null)}
          onCropComplete={(blob) => {
            setCropperFile(null);
            handleCroppedImageUpload(blob);
          }}
          aspect={1 / 1.4}
        />
      )}
    </div>
  );
}
