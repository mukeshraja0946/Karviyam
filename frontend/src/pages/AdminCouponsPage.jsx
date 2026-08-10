import React, { useState } from 'react';
import { Ticket, Plus, Trash2, Edit2, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../utils/api';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({ code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderAmount: '' });
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/coupons');
      const apiData = res?.data ? res.data : res;
      const list = Array.isArray(apiData?.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);

      setCoupons(prev => {
        if (list.length > 0) {
          const merged = [...list];
          prev.forEach(p => {
            if (p && p.id && !merged.some(m => String(m.id) === String(p.id))) {
              merged.unshift(p);
            }
          });
          try { localStorage.setItem('karviyam_admin_coupons', JSON.stringify(merged)); } catch (e) {}
          return merged;
        } else if (prev.length > 0) {
          try { localStorage.setItem('karviyam_admin_coupons', JSON.stringify(prev)); } catch (e) {}
          return prev;
        } else {
          try {
            const saved = localStorage.getItem('karviyam_admin_coupons');
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
    setEditingCoupon(null);
    setFormData({ code: '', discountType: 'PERCENTAGE', discountValue: '10', minOrderAmount: '499' });
    setModalOpen(true);
  };

  const handleOpenEditModal = (c) => {
    setEditingCoupon(c);
    setFormData({ code: c.code, discountType: c.discountType, discountValue: c.discountValue, minOrderAmount: c.minOrderAmount });
    setModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.code || !formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    if (!formData.discountValue) {
      toast.error('Discount value is required');
      return;
    }

    setSubmitting(true);
    toast.loading(editingCoupon ? 'Updating coupon...' : 'Creating new coupon...', { id: 'cpn-save-toast' });

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
        active: true
      };

      if (editingCoupon) {
        const res = await api.put(`/admin/coupons/${editingCoupon.id}`, payload);
        const apiData = res?.data ? res.data : res;
        if (apiData && apiData.success !== false) {
          toast.success('Coupon updated successfully!', { id: 'cpn-save-toast' });
          const savedItem = apiData.data || apiData;
          setCoupons(prev => {
            let updated = [...prev];
            const idx = updated.findIndex(c => String(c.id) === String(editingCoupon.id));
            if (idx >= 0) updated[idx] = { ...updated[idx], ...savedItem };
            try { localStorage.setItem('karviyam_admin_coupons', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
          try { await fetchCoupons(); } catch (eFetch) {}
          setModalOpen(false);
        } else {
          throw new Error(apiData?.message || 'Failed to update coupon');
        }
      } else {
        const res = await api.post('/admin/coupons', payload);
        const apiData = res?.data ? res.data : res;
        if (apiData && apiData.success !== false) {
          toast.success('New coupon code created!', { id: 'cpn-save-toast' });
          const savedItem = apiData.data || apiData;
          setCoupons(prev => {
            let updated = [...prev];
            const itemToInsert = (savedItem && (savedItem.id || savedItem.code))
              ? savedItem
              : { id: Date.now(), ...payload };
            updated.unshift(itemToInsert);
            try { localStorage.setItem('karviyam_admin_coupons', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
          try { await fetchCoupons(); } catch (eFetch) {}
          setModalOpen(false);
        } else {
          throw new Error(apiData?.message || 'Failed to create coupon');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save coupon', { id: 'cpn-save-toast' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    toast.loading('Deleting coupon...', { id: 'cpn-del-toast' });

    try {
      const res = await api.delete(`/admin/coupons/${id}`);
      const apiData = res?.data ? res.data : res;
      if (apiData && apiData.success !== false) {
        toast.success('Coupon deleted successfully!', { id: 'cpn-del-toast' });
        await fetchCoupons();
      } else {
        throw new Error(apiData?.message || 'Failed to delete coupon');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete coupon', { id: 'cpn-del-toast' });
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Coupons & Promo Codes</h1>
          <p className="text-xs text-slate-500">Create, edit, and manage discount promo codes for checkout</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Coupons List Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((c) => (
          <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative">
            <div className="flex justify-between items-start">
              <span className="font-mono font-black text-lg text-[#B71C1C] bg-red-50 px-3 py-1 rounded-xl border border-red-100">
                {c.code}
              </span>
              <div className="flex gap-1">
                <button onClick={() => handleOpenEditModal(c)} className="p-1.5 text-slate-400 hover:text-[#B71C1C] rounded-lg hover:bg-slate-100">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteCoupon(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900">
                Discount: {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
              </p>
              <p>Min Order Amount: ₹{c.minOrderAmount}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">Active</span>
              <span className="text-slate-400 font-medium">Never Expires</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900">{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h3>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. KARVIYAM10"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-mono font-bold focus:border-[#B71C1C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FIXED">FIXED (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Value</label>
                  <input
                    type="number"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Minimum Order Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold py-3.5 rounded-xl shadow-md uppercase tracking-wider"
              >
                {editingCoupon ? 'Update Coupon' : 'Save Coupon'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
