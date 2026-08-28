import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Trash2, Edit2, X, Eye, Upload, Link as LinkIcon, Power, CheckCircle, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import ImageUploadCropperModal from '../components/ImageUploadCropperModal';
import BulkImportModal from '../components/BulkImportModal';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [cropperFile, setCropperFile] = useState(null);

  // Auto-scroll Admin Settings
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(() => {
    const saved = localStorage.getItem('karviyam_banner_autoscroll');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [scrollSpeed, setScrollSpeed] = useState(() => {
    const saved = localStorage.getItem('karviyam_banner_speed');
    return saved ? Number(saved) : 5000;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({ title: '', subtitle: '', imagePath: '', link: '/shop', status: 'active' });
  const [useUrlMode, setUseUrlMode] = useState(false);

  const handleApiError = (err, defaultMsg = 'An error occurred') => {
    if (!err || !err.response) {
      toast.error(defaultMsg || 'Unable to connect to server. Please check network connection.', { id: 'banner-toast' });
      return;
    }
    const status = err.response.status;
    const backendMessage = err.response.data?.message;

    if (status === 400) {
      toast.error(backendMessage || 'Invalid request. Please check required fields.', { id: 'banner-toast' });
    } else if (status === 401) {
      toast.error('Session expired. Please log in again.', { id: 'banner-toast' });
    } else if (status === 403) {
      toast.error("You don't have permission to manage banners.", { id: 'banner-toast' });
    } else if (status === 404) {
      toast.error('Banner API endpoint not found.', { id: 'banner-toast' });
    } else if (status === 500) {
      toast.error(backendMessage || 'Server error while processing banner request.', { id: 'banner-toast' });
    } else {
      toast.error(backendMessage || defaultMsg, { id: 'banner-toast' });
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      let list = null;
      let res = await api.get('/banners/all').catch(() => null);
      if (!res) {
        res = await api.get('/banners').catch(() => null);
      }

      const apiData = res?.data ? res.data : res;
      const rawData = apiData?.data !== undefined ? apiData.data : apiData;

      if (Array.isArray(rawData)) {
        list = rawData;
      } else if (rawData && typeof rawData === 'object') {
        if (Array.isArray(rawData.banners)) list = rawData.banners;
        if (rawData.autoScroll !== undefined) setAutoScrollEnabled(Boolean(rawData.autoScroll));
        if (rawData.speed !== undefined) setScrollSpeed(Number(rawData.speed));
      }

      if (Array.isArray(list)) {
        setBanners(list);
      } else {
        setBanners([]);
      }
    } catch (e) {
      console.error('[Fetch Banners Error]:', e);
      handleApiError(e, 'Could not load banners from server');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScrollSettings = async (enabled, speed) => {
    setAutoScrollEnabled(enabled);
    setScrollSpeed(speed);
    localStorage.setItem('karviyam_banner_autoscroll', JSON.stringify(enabled));
    localStorage.setItem('karviyam_banner_speed', String(speed));

    try {
      await api.post('/banners/settings', { autoScroll: enabled, speed }).catch(() => null);
    } catch (e) {}

    window.dispatchEvent(new Event('karviyam_banners_updated'));
    toast.success(`Banner auto-scroll ${enabled ? 'ENABLED' : 'DISABLED'} (${speed / 1000}s speed)!`, { id: 'banner-toast' });
  };

  const handleOpenAddModal = () => {
    setEditingBanner(null);
    setFormData({ title: '', subtitle: '', imagePath: '', link: '/shop', status: 'active' });
    setUseUrlMode(false);
    setSubmitting(false);
    setModalOpen(true);
  };

  const handleOpenEditModal = (b) => {
    setEditingBanner(b);
    setFormData({
      title: b.title || '',
      subtitle: b.subtitle || '',
      imagePath: b.imagePath || b.imageUrl || b.image || '',
      link: b.link || b.buttonLink || '/shop',
      status: (b.status || (b.isActive !== false ? 'active' : 'inactive')).toLowerCase()
    });
    setUseUrlMode(false);
    setSubmitting(false);
    setModalOpen(true);
  };

  const handleToggleStatus = async (b) => {
    if (actionLoading[b.id]) return;

    setActionLoading(prev => ({ ...prev, [b.id]: true }));
    const currentStatus = (b.status || (b.isActive ? 'active' : 'inactive')).toLowerCase();
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const nextActive = nextStatus === 'active';

    toast.loading(`Updating banner status...`, { id: 'banner-toast' });

    const updatedPayload = {
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      imagePath: b.imagePath || b.imageUrl || b.image,
      imageUrl: b.imageUrl || b.imagePath || b.image,
      link: b.link || b.buttonLink || '/shop',
      buttonLink: b.buttonLink || b.link || '/shop',
      status: nextStatus,
      isActive: nextActive,
      sortOrder: b.sortOrder || b.displayOrder || 0,
      displayOrder: b.displayOrder || b.sortOrder || 0
    };

    try {
      const res = await api.post('/banners', updatedPayload);
      const apiData = res.data ? res.data : res;
      if (apiData && apiData.success !== false) {
        toast.success(`Banner ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully!`, { id: 'banner-toast' });
        try { localStorage.removeItem('karviyam_admin_banners'); } catch (e) {}
        await fetchBanners();
        window.dispatchEvent(new Event('karviyam_banners_updated'));
      } else {
        throw new Error(apiData?.message || 'Failed to toggle banner status');
      }
    } catch (e) {
      console.error('[Toggle Status Error]:', e);
      handleApiError(e, 'Failed to update banner status');
    } finally {
      setActionLoading(prev => ({ ...prev, [b.id]: false }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP)', { id: 'banner-toast' });
      return;
    }

    setCropperFile(file);
    e.target.value = '';
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // Form Validation
    if (!formData.title || !formData.title.trim()) {
      toast.error('Banner Title is required', { id: 'banner-toast' });
      return;
    }

    if (!formData.imagePath) {
      toast.error('Banner Image is required. Please upload an image or provide a valid URL.', { id: 'banner-toast' });
      return;
    }

    setSubmitting(true);
    toast.loading(editingBanner ? 'Updating banner...' : 'Saving new banner...', { id: 'banner-toast' });

    const payload = {
      ...(editingBanner ? { id: editingBanner.id } : {}),
      title: formData.title.trim(),
      subtitle: formData.subtitle ? formData.subtitle.trim() : '',
      imagePath: formData.imagePath,
      imageUrl: formData.imagePath,
      link: formData.link || '/shop',
      buttonLink: formData.link || '/shop',
      buttonText: 'Shop Now',
      status: formData.status || 'active',
      isActive: (formData.status || 'active').toLowerCase() === 'active',
      displayOrder: editingBanner ? (editingBanner.displayOrder || editingBanner.sortOrder || 1) : (banners.length + 1),
      sortOrder: editingBanner ? (editingBanner.sortOrder || editingBanner.displayOrder || 1) : (banners.length + 1)
    };

    try {
      const res = await api.post('/banners', payload);
      const apiData = res.data ? res.data : res;

      if (apiData && apiData.success !== false) {
        toast.success(editingBanner ? 'Banner updated successfully!' : 'Banner created successfully!', { id: 'banner-toast' });
        
        const savedItem = apiData.data || apiData;

        // 1. Refetch from MySQL database
        await fetchBanners();
        window.dispatchEvent(new Event('karviyam_banners_updated'));
        try { localStorage.removeItem('karviyam_admin_banners'); } catch (e) {}

        setModalOpen(false);
        setEditingBanner(null);
        setFormData({ title: '', subtitle: '', imagePath: '', link: '/shop', status: 'active' });
      } else {
        throw new Error(apiData?.message || 'Failed to save banner');
      }
    } catch (e) {
      console.error('[Save Banner Error]:', e);
      handleApiError(e, 'Failed to save banner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    
    toast.loading('Deleting banner...', { id: 'banner-toast' });
    try {
      // 1. Send DELETE query to database API
      await api.delete(`/banners/${id}`);

      // 2. Clear local storage and refetch
      try { localStorage.removeItem('karviyam_admin_banners'); } catch (e) {}
      await fetchBanners();
      window.dispatchEvent(new Event('karviyam_banners_updated'));

      toast.success('Banner deleted successfully!', { id: 'banner-toast' });
    } catch (e) {
      console.error('[Delete Banner Error]:', e);
      handleApiError(e, 'Failed to delete banner');
    }
  };

  const [importModalOpen, setImportModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Homepage Banners & Sliders</h1>
          <p className="text-xs text-slate-500">Manage hero slider images, titles, promotional links & active status</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                const response = await api.get('/admin/excel/banners/export', { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'karviyam_banners_export.xlsx');
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.success('Exported homepage banners!');
              } catch (err) {
                toast.error('Failed to export banners');
              }
            }}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Export Banners</span>
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Import Banners</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Banner</span>
          </button>
        </div>
      </div>

      {/* Auto-Scroll & Slider Timing Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center font-bold">
            <Power className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Banner Slider Auto-Scroll</h4>
            <p className="text-slate-500 text-[11px]">Control whether homepage hero banners auto-slide and manage slide interval speed</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Auto-scroll Toggle */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => handleUpdateScrollSettings(true, scrollSpeed)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                autoScrollEnabled ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Auto-Scroll ON
            </button>
            <button
              onClick={() => handleUpdateScrollSettings(false, scrollSpeed)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                !autoScrollEnabled ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Auto-Scroll OFF
            </button>
          </div>

          {/* Slide Speed Selector */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 font-bold">
            <span className="text-slate-500">Speed:</span>
            <select
              value={scrollSpeed}
              onChange={(e) => handleUpdateScrollSettings(autoScrollEnabled, Number(e.target.value))}
              className="bg-transparent outline-none cursor-pointer text-slate-900 font-bold"
            >
              <option value="2000">2 Seconds (Ultra Fast)</option>
              <option value="3000">3 Seconds (Fast)</option>
              <option value="5000">5 Seconds (Normal - Default)</option>
              <option value="7000">7 Seconds (Relaxed)</option>
              <option value="10000">10 Seconds (Slow)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Banners List Cards */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs font-bold gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#B71C1C]" />
          <span>Loading homepage banners...</span>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Banners Found</h3>
          <p className="text-slate-500 text-xs">Click "Add New Banner" above to create your first homepage banner.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((b) => {
            const isActive = (b.status || (b.isActive ? 'active' : 'inactive')).toLowerCase() === 'active';
            const bannerImage = b.imagePath || b.imageUrl || b.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600';
            const isUpdatingThis = Boolean(actionLoading[b.id]);

            return (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="relative h-48 bg-slate-900">
                  <img
                    src={bannerImage}
                    alt={b.title || 'Banner'}
                    className="w-full h-full object-cover opacity-80"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex flex-col justify-end p-5 text-white">
                    <span className="text-[10px] font-black uppercase text-amber-400">Order #{b.displayOrder || b.sortOrder || b.id}</span>
                    <h3 className="font-display font-black text-xl leading-tight">{b.title || 'Untitled Banner'}</h3>
                    <p className="text-xs text-slate-300 font-medium">{b.subtitle || 'No subtitle provided'}</p>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold px-2.5 py-1 rounded-full uppercase text-[10px] ${
                        isActive
                          ? 'text-emerald-700 bg-emerald-100 border border-emerald-200'
                          : 'text-slate-500 bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </span>

                    {/* Active / Deactivate Toggle Button */}
                    <button
                      onClick={() => handleToggleStatus(b)}
                      disabled={isUpdatingThis}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                        isActive
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {isUpdatingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Power className="w-3.5 h-3.5" />
                      )}
                      <span>{isUpdatingThis ? 'UPDATING...' : (isActive ? 'Deactivate' : 'Activate')}</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(b)}
                      disabled={isUpdatingThis}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(b.id)}
                      disabled={isUpdatingThis}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{editingBanner ? 'Edit Banner' : 'Add New Banner'}</h3>
              <button
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="cursor-pointer text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. GALAXY OF ELEGANCE"
                  disabled={submitting}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold focus:border-[#B71C1C] disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Discover New Streetwear Collection"
                  disabled={submitting}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-[#B71C1C] disabled:bg-slate-100"
                />
              </div>

              {/* Upload Image Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Banner Image *</label>
                  <button
                    type="button"
                    onClick={() => setUseUrlMode(!useUrlMode)}
                    disabled={submitting}
                    className="text-[11px] text-[#B71C1C] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {useUrlMode ? <Upload className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
                    {useUrlMode ? 'Switch to Upload File' : 'Switch to Image URL'}
                  </button>
                </div>

                {!useUrlMode ? (
                  <div className="space-y-2">
                    {formData.imagePath ? (
                      <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-2 flex items-center gap-3 bg-slate-50">
                        <img
                          src={formData.imagePath}
                          alt="Preview"
                          className="w-20 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-xs truncate">
                            {editingBanner && !formData.imagePath.startsWith('data:') && !formData.imagePath.includes('uploads')
                              ? 'Existing Banner Image'
                              : 'Banner Image Ready'}
                          </p>
                          <p className="text-[10px] text-slate-400">Ready to save</p>
                        </div>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => setFormData({ ...formData, imagePath: '' })}
                          className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-[#B71C1C] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-slate-50 hover:bg-red-50/20 cursor-pointer transition-all">
                        {uploadingImage ? (
                          <div className="flex flex-col items-center gap-2 text-[#B71C1C]">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="font-bold text-xs">Uploading Image...</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-red-100 text-[#B71C1C] flex items-center justify-center">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div className="text-center">
                              <span className="font-bold text-slate-800 text-xs">Click to upload banner image</span>
                              <span className="block text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP up to 10MB</span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={submitting || uploadingImage}
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </>
                        )}
                      </label>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.imagePath}
                    disabled={submitting}
                    onChange={(e) => setFormData({ ...formData, imagePath: e.target.value })}
                    placeholder="Paste banner image URL (https://...)"
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-[#B71C1C] disabled:bg-slate-100"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Click Action Link</label>
                <input
                  type="text"
                  value={formData.link}
                  disabled={submitting}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="/shop or /shop?category=Jewellery"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-[#B71C1C] disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  disabled={submitting}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold disabled:bg-slate-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="w-full bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-bold py-3.5 rounded-xl shadow-md uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {submitting
                    ? (editingBanner ? 'UPDATING...' : 'SAVING...')
                    : (editingBanner ? 'Update Banner' : 'Save Banner')}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Banner Import Modal */}
      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        type="banners"
        onImportSuccess={fetchBanners}
      />

      {/* Standardized Image Cropper Modal */}
      <ImageUploadCropperModal
        isOpen={Boolean(cropperFile)}
        onClose={() => setCropperFile(null)}
        imageFile={cropperFile}
        configType="homepageBanner"
        onConfirmCrop={(croppedUrl) => {
          setFormData(prev => ({ ...prev, imagePath: croppedUrl }));
          setCropperFile(null);
        }}
      />

    </div>
  );
}
