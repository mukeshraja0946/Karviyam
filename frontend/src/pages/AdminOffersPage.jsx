import React, { useState } from 'react';
import { Tag, Plus, Trash2, Edit2, X, Percent, Gift, Zap, ShieldCheck, Calendar, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../utils/api';

export default function AdminOffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'PERCENTAGE',
    value: '',
    minOrder: '499',
    targetCategory: 'All Products',
    validTill: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/coupons');
      const apiData = res?.data ? res.data : res;
      const list = Array.isArray(apiData?.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);
      const formatted = list.map(c => ({
        id: c.id,
        name: `${c.code} Offer`,
        code: c.code,
        type: c.discountType || 'PERCENTAGE',
        value: c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`,
        minOrder: c.minOrderAmount || 0,
        targetCategory: 'All Products',
        status: c.active ? 'ACTIVE' : 'PAUSED',
        validTill: '2026-12-31',
        description: `Get ${c.discountValue}${c.discountType === 'PERCENTAGE' ? '%' : ' FLAT'} discount on orders above ₹${c.minOrderAmount}`
      }));

      setOffers(prev => {
        if (formatted.length > 0) {
          const merged = [...formatted];
          prev.forEach(p => {
            if (p && p.id && !merged.some(m => String(m.id) === String(p.id))) {
              merged.unshift(p);
            }
          });
          try { localStorage.setItem('karviyam_admin_offers', JSON.stringify(merged)); } catch (e) {}
          return merged;
        } else if (prev.length > 0) {
          try { localStorage.setItem('karviyam_admin_offers', JSON.stringify(prev)); } catch (e) {}
          return prev;
        } else {
          try {
            const saved = localStorage.getItem('karviyam_admin_offers');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
          } catch (eSaved) {}
          return [];
        }
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingOffer(null);
    setFormData({
      name: '',
      code: '',
      type: 'PERCENTAGE',
      value: '15',
      minOrder: '499',
      targetCategory: 'All Products',
      validTill: '2026-12-31',
      description: ''
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (off) => {
    setEditingOffer(off);
    setFormData({
      name: off.name,
      code: off.code,
      type: off.type,
      value: String(off.value).replace(/[^0-9.]/g, ''),
      minOrder: off.minOrder,
      targetCategory: off.targetCategory,
      validTill: off.validTill,
      description: off.description
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (off) => {
    const nextActive = off.status !== 'ACTIVE';
    toast.loading(`Updating offer status...`, { id: 'off-toggle-toast' });
    try {
      await api.put(`/admin/coupons/${off.id}`, { active: nextActive });
      toast.success(`Offer campaign set to ${nextActive ? 'ACTIVE' : 'PAUSED'}!`, { id: 'off-toggle-toast' });
      await fetchOffers();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status', { id: 'off-toggle-toast' });
    }
  };

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.code || !formData.code.trim()) {
      toast.error('Offer code is required');
      return;
    }

    setSubmitting(true);
    toast.loading(editingOffer ? 'Updating offer...' : 'Publishing offer...', { id: 'off-save-toast' });

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.type === 'FLAT' ? 'FIXED' : 'PERCENTAGE',
        discountValue: parseFloat(formData.value) || 10,
        minOrderAmount: parseFloat(formData.minOrder) || 0,
        active: true
      };

      let savedObj = null;
      if (editingOffer) {
        const res = await api.put(`/admin/coupons/${editingOffer.id}`, payload);
        savedObj = res?.data?.data || res?.data || res;
        toast.success('Offer updated successfully!', { id: 'off-save-toast' });
      } else {
        const res = await api.post('/admin/coupons', payload);
        savedObj = res?.data?.data || res?.data || res;
        toast.success('New promotional offer published!', { id: 'off-save-toast' });
      }

      setOffers(prev => {
        let updated = [...prev];
        const newOfferObj = {
          id: savedObj?.id || Date.now(),
          name: `${payload.code} Offer`,
          code: payload.code,
          type: payload.discountType,
          value: payload.discountType === 'PERCENTAGE' ? `${payload.discountValue}%` : `₹${payload.discountValue}`,
          minOrder: payload.minOrderAmount,
          targetCategory: 'All Products',
          status: 'ACTIVE',
          validTill: '2026-12-31',
          description: `Get ${payload.discountValue}${payload.discountType === 'PERCENTAGE' ? '%' : ' FLAT'} discount on orders above ₹${payload.minOrderAmount}`
        };

        if (editingOffer) {
          const idx = updated.findIndex(o => String(o.id) === String(editingOffer.id));
          if (idx >= 0) updated[idx] = { ...updated[idx], ...newOfferObj };
        } else {
          updated.unshift(newOfferObj);
        }

        try { localStorage.setItem('karviyam_admin_offers', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });

      setModalOpen(false);
      try { await fetchOffers(); } catch (eFetch) {}
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save offer', { id: 'off-save-toast' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    toast.loading('Deleting offer campaign...', { id: 'off-del-toast' });
    try {
      await api.delete(`/admin/coupons/${id}`).catch(() => api.delete(`/coupons/${id}`)).catch(() => null);

      setOffers(prev => {
        const updated = prev.filter(o => String(o.id) !== String(id));
        try { localStorage.setItem('karviyam_admin_offers', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });

      toast.success('Offer deleted successfully!', { id: 'off-del-toast' });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete offer', { id: 'off-del-toast' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Offers & Discounts Management</h1>
          <p className="text-xs text-slate-500">Configure sales campaigns, flash deals, BOGO offers & discount rules</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Offer</span>
        </button>
      </div>

      {/* Offers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {offers.map((off) => (
          <div key={off.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center font-black">
                  {off.type === 'PERCENTAGE' && <Percent className="w-6 h-6" />}
                  {off.type === 'FLAT' && <Tag className="w-6 h-6" />}
                  {off.type === 'FREE_SHIPPING' && <Zap className="w-6 h-6" />}
                  {off.type === 'BUY_X_GET_Y' && <Gift className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{off.name}</h3>
                  <span className="text-[10px] font-mono font-bold text-[#B71C1C] bg-red-50 px-2 py-0.5 rounded-md border border-red-100 uppercase">
                    {off.code}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEditModal(off)}
                  className="p-1.5 text-slate-400 hover:text-[#B71C1C] rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteOffer(off.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 line-clamp-2">{off.description}</p>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100 font-medium">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Discount Benefit</span>
                <span className="font-bold text-[#B71C1C] text-xs">{off.value}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Min Order Value</span>
                <span className="font-bold text-slate-800 text-xs">₹{off.minOrder}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(off.id)}
                  className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase transition-all cursor-pointer ${
                    off.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                >
                  {off.status}
                </button>
                <span className="text-slate-400">• {off.targetCategory}</span>
              </div>

              <div className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>Valid till {off.validTill}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Offer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900">{editingOffer ? 'Edit Offer Campaign' : 'Create New Offer'}</h3>
              <button onClick={() => setModalOpen(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Midnight Festive Drop"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold focus:border-[#B71C1C]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Promo Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. MIDNIGHT20"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-mono font-bold focus:border-[#B71C1C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FLAT">FLAT AMOUNT (₹)</option>
                    <option value="FREE_SHIPPING">FREE SHIPPING</option>
                    <option value="BUY_X_GET_Y">BUY X GET Y</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Benefit Display</label>
                  <input
                    type="text"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="e.g. 20% OFF or ₹300 FLAT"
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.minOrder}
                    onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Category</label>
                  <input
                    type="text"
                    value={formData.targetCategory}
                    onChange={(e) => setFormData({ ...formData, targetCategory: e.target.value })}
                    placeholder="e.g. All Products, Clothing..."
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Valid Till Date</label>
                <input
                  type="date"
                  required
                  value={formData.validTill}
                  onChange={(e) => setFormData({ ...formData, validTill: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Banner Terms</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Offer details & promotional banner highlight..."
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold py-3.5 rounded-xl shadow-md uppercase tracking-wider cursor-pointer transition-all"
              >
                {editingOffer ? 'Update Offer' : 'Save & Publish Offer'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
