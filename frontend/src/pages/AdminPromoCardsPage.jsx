import React, { useState, useEffect } from 'react';
import {
  Tag,
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
  Gift
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { resolveImageUrl } from '../utils/imageUtils';
import ImageUploadCropperModal from '../components/ImageUploadCropperModal';

export default function AdminPromoCardsPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [cropperFile, setCropperFile] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    displayOrder: 1,
    isActive: true,
    link: '/shop'
  });
  const [useUrlMode, setUseUrlMode] = useState(false);

  useEffect(() => {
    fetchPromoCards();
  }, []);

  const fetchPromoCards = async () => {
    setLoading(true);
    try {
      let list = [];
      const res = await api.get('/promo-cards/admin').catch(() => null);
      const apiData = res?.data ? res.data : res;
      list = Array.isArray(apiData?.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);

      if (list && list.length > 0) {
        setPromos(list);
        try {
          localStorage.setItem('karviyam_admin_promo_cards', JSON.stringify(list));
        } catch (e) {}
      } else {
        const saved = localStorage.getItem('karviyam_admin_promo_cards');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) setPromos(parsed);
          } catch (eP) {}
        }
      }
    } catch (err) {
      console.error('[Fetch Promo Cards Error]:', err);
      toast.error('Could not load promotional cards from server');
    } finally {
      setLoading(false);
    }
  };

  const notifyUpdate = () => {
    window.dispatchEvent(new Event('karviyam_promo_cards_updated'));
    window.dispatchEvent(new Event('karviyam_banners_updated'));
  };

  const handleOpenAddModal = () => {
    setEditingPromo(null);
    setFormData({
      title: '',
      subtitle: '',
      imageUrl: '',
      displayOrder: promos.length + 1,
      isActive: true,
      link: '/shop'
    });
    setUseUrlMode(false);
    setSubmitting(false);
    setModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingPromo(p);
    setFormData({
      title: p.title || '',
      subtitle: p.subtitle || '',
      imageUrl: p.imageUrl || p.imagePath || '',
      displayOrder: p.displayOrder || 1,
      isActive: p.isActive !== false,
      link: p.link || '/shop'
    });
    setUseUrlMode(false);
    setSubmitting(false);
    setModalOpen(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }

    setCropperFile(file);
    e.target.value = '';
  };

  const handleCropConfirm = (croppedBase64) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: croppedBase64
    }));
    setCropperFile(null);
    toast.success('Promotional creative cropped & ready to save! ✂️');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imageUrl || !formData.imageUrl.trim()) {
      toast.error('Please upload or enter a promotional banner image');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        imageUrl: formData.imageUrl.trim(),
        displayOrder: Number(formData.displayOrder) || 1,
        isActive: Boolean(formData.isActive),
        link: formData.link.trim() || '/shop'
      };

      if (editingPromo && editingPromo.id) {
        await api.put(`/promo-cards/${editingPromo.id}`, payload);
        toast.success(`Promotional card updated successfully! 🎉`);
      } else {
        await api.post('/promo-cards', payload);
        toast.success(`Promotional card added successfully! 🎉`);
      }

      setModalOpen(false);
      await fetchPromoCards();
      notifyUpdate();
    } catch (err) {
      console.error('[Save Promo Card Error]:', err);
      toast.error(err.response?.data?.message || 'Failed to save promotional card');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (p) => {
    const nextState = !p.isActive;
    setActionLoading(prev => ({ ...prev, [p.id]: true }));

    try {
      await api.put(`/promo-cards/${p.id}`, {
        title: p.title,
        subtitle: p.subtitle,
        imageUrl: p.imagePath || p.imageUrl,
        displayOrder: p.displayOrder,
        isActive: nextState,
        link: p.link
      });

      setPromos(prev => prev.map(c => c.id === p.id ? { ...c, isActive: nextState } : c));
      toast.success(`Promotional card is now ${nextState ? 'ENABLED' : 'DISABLED'}`);
      notifyUpdate();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update promotion status');
    } finally {
      setActionLoading(prev => ({ ...prev, [p.id]: false }));
    }
  };

  const handleMoveOrder = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === promos.length - 1) return;

    const newPromos = [...promos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap items
    const temp = newPromos[index];
    newPromos[index] = newPromos[targetIndex];
    newPromos[targetIndex] = temp;

    const updatedWithOrders = newPromos.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1
    }));

    setPromos(updatedWithOrders);

    try {
      const payloadItems = updatedWithOrders.map(item => ({
        id: item.id,
        displayOrder: item.displayOrder
      }));
      await api.put('/promo-cards/reorder', { items: payloadItems });
      toast.success('Promotional order saved! ↕️');
      notifyUpdate();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save promotional reordering');
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm('Are you sure you want to delete this promotional card?')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [p.id]: true }));
    try {
      await api.delete(`/promo-cards/${p.id}`);
      setPromos(prev => prev.filter(c => c.id !== p.id));
      toast.success('Promotional card deleted successfully!');
      notifyUpdate();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete promotional card');
    } finally {
      setActionLoading(prev => ({ ...prev, [p.id]: false }));
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-700/60">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#B71C1C] flex items-center justify-center text-white shadow-md">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
                Promotional Cards & Sidebar Banners
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Upload & manage promotional creatives displayed on Customer Homepage sidebar & mobile offer sections
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider px-5 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Promotional Card</span>
        </button>
      </div>

      {/* Admin Management Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-display font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Active Homepage Promotional Creatives ({promos.length})</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Order #1 appears at top of customer sidebar</span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#B71C1C] animate-spin" />
            <p className="text-xs font-bold text-slate-500">Loading Promotional Cards...</p>
          </div>
        ) : promos.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <Gift className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Promotional Cards Configured</p>
            <button
              onClick={handleOpenAddModal}
              className="bg-[#B71C1C] text-white text-xs font-extrabold px-4 py-2 rounded-xl"
            >
              Add First Promotional Card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {promos.map((p, idx) => (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border-2 p-4 space-y-3 shadow-2xs relative flex flex-col justify-between transition-all ${
                  p.isActive !== false ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 bg-slate-50/70 opacity-75'
                }`}
              >
                {/* Card Top Header */}
                <div className="flex items-center justify-between">
                  <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                    #{p.displayOrder || idx + 1}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveOrder(idx, 'up')}
                      disabled={idx === 0}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleMoveOrder(idx, 'down')}
                      disabled={idx === promos.length - 1}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleActive(p)}
                      disabled={actionLoading[p.id]}
                      className={`ml-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1 ${
                        p.isActive !== false
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{p.isActive !== false ? 'Enabled' : 'Disabled'}</span>
                    </button>
                  </div>
                </div>

                {/* Promotional Creative Image Display */}
                <div className="w-full h-48 bg-slate-950 rounded-xl overflow-hidden border border-slate-200 p-1 flex items-center justify-center relative group">
                  <img
                    src={resolveImageUrl(p.imageUrl)}
                    alt={p.title || 'Promotional Banner'}
                    className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="bg-white text-slate-900 p-2 rounded-xl text-xs font-bold shadow-md hover:bg-[#B71C1C] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Replace Image</span>
                    </button>
                  </div>
                </div>

                {/* Promotional Card Details */}
                <div className="space-y-1">
                  <h3 className="font-display font-black text-xs text-slate-900 uppercase truncate">
                    {p.title || 'Promotional Banner'}
                  </h3>
                  {p.subtitle && (
                    <p className="text-[11px] text-slate-500 font-semibold truncate">{p.subtitle}</p>
                  )}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium truncate pt-1">
                    <LinkIcon className="w-3 h-3 shrink-0 text-slate-400" />
                    <span className="truncate">{p.link || '/shop'}</span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenEditModal(p)}
                    className="text-xs font-bold text-slate-700 hover:text-[#B71C1C] flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Card</span>
                  </button>

                  <button
                    onClick={() => handleDelete(p)}
                    disabled={actionLoading[p.id]}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                  >
                    {actionLoading[p.id] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* ADD / EDIT PROMOTIONAL CARD MODAL                         */}
      {/* ========================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-6">
            
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="font-display font-black text-base flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#B71C1C]" />
                  <span>{editingPromo ? 'Edit Promotional Card' : 'Add New Promotional Card'}</span>
                </h3>
                <p className="text-[10.5px] text-slate-400">Configure promotional creative for customer homepage</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Optional Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">Title / Internal Name (Optional)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. FESTIVE SPECIAL, PREPAID OFFER"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white uppercase"
                />
              </div>

              {/* Clickable Destination Link */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">Destination Click Link *</label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="e.g. /shop?filter=bestsellers or /shop?category=T-Shirts"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                  required
                />
              </div>

              {/* Display Order & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">Display Order *</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.displayOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">Status</label>
                  <select
                    value={formData.isActive ? 'enabled' : 'disabled'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'enabled' }))}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white cursor-pointer"
                  >
                    <option value="enabled">Enabled (Visible)</option>
                    <option value="disabled">Disabled (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Promotional Creative Image Upload */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-800">Promotional Creative Image *</label>
                  <button
                    type="button"
                    onClick={() => setUseUrlMode(!useUrlMode)}
                    className="text-[10.5px] font-bold text-[#B71C1C] hover:underline"
                  >
                    {useUrlMode ? 'Switch to Upload & Crop' : 'Switch to Image URL'}
                  </button>
                </div>

                {!useUrlMode ? (
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center p-5 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-[#B71C1C] rounded-2xl cursor-pointer transition-all hover:bg-red-50/30 group">
                      <Upload className="w-7 h-7 text-slate-400 group-hover:text-[#B71C1C] transition-colors mb-1.5" />
                      <span className="text-xs font-extrabold text-slate-800">Upload Promotional Creative Image</span>
                      <span className="text-[10px] text-slate-400">Opens standardized image cropper</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>

                    {formData.imageUrl && (
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                        <img
                          src={resolveImageUrl(formData.imageUrl)}
                          alt="Preview"
                          className="w-16 h-20 object-contain rounded-xl bg-slate-900 border border-slate-200 p-1"
                        />
                        <div className="flex-1 text-xs">
                          <span className="font-bold text-emerald-700 block">✓ Creative image ready</span>
                          <span className="text-[10px] text-slate-400">Cropped creative output saved</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                          className="text-xs font-bold text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Card</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Standard Image Upload Cropper Modal */}
      {cropperFile && (
        <ImageUploadCropperModal
          isOpen={!!cropperFile}
          onClose={() => setCropperFile(null)}
          imageFile={cropperFile}
          configType="productMain"
          onConfirmCrop={handleCropConfirm}
        />
      )}

    </div>
  );
}
