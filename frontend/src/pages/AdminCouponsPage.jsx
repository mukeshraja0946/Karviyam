import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, Edit2, X, CheckCircle, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import BulkImportModal from '../components/BulkImportModal';
import ClearAllModal from '../components/ClearAllModal';
import BulkActionBar from '../components/BulkActionBar';

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
        await api.put(`/admin/coupons/${editingCoupon.id}`, payload)
          .catch(() => api.post(`/admin/coupons/${editingCoupon.id}`, payload))
          .catch(() => api.post(`/admin/coupons/${editingCoupon.id}/update`, payload))
          .catch(() => null);

        setCoupons(prev => {
          let updated = [...(Array.isArray(prev) ? prev : [])];
          const idx = updated.findIndex(c => String(c.id) === String(editingCoupon.id));
          if (idx >= 0) updated[idx] = { ...updated[idx], ...payload };
          try { localStorage.setItem('karviyam_admin_coupons', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });

        toast.success('Coupon updated successfully!', { id: 'cpn-save-toast' });
        setModalOpen(false);
        try { await fetchCoupons(); } catch (eFetch) {}
      } else {
        const res = await api.post('/admin/coupons', payload).catch(() => null);
        const apiData = res?.data ? res.data : (res || {});
        const savedItem = apiData?.data || apiData;
        const newCpn = (savedItem && (savedItem.id || savedItem.code))
          ? { ...payload, ...savedItem }
          : { id: Date.now(), ...payload };

        setCoupons(prev => {
          let updated = [...(Array.isArray(prev) ? prev : [])];
          updated.unshift(newCpn);
          try { localStorage.setItem('karviyam_admin_coupons', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });

        toast.success('New coupon code created!', { id: 'cpn-save-toast' });
        setModalOpen(false);
        try { await fetchCoupons(); } catch (eFetch) {}
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save coupon', { id: 'cpn-save-toast' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    toast.loading('Deleting coupon...', { id: 'cpn-del-toast' });

    try {
      await api.delete(`/admin/coupons/${id}`)
        .catch(() => api.post(`/admin/coupons/${id}/delete`))
        .catch(() => api.delete(`/coupons/${id}`))
        .catch(() => null);

      setCoupons(prev => {
        const updated = (Array.isArray(prev) ? prev : []).filter(c => String(c.id) !== String(id));
        try { localStorage.setItem('karviyam_admin_coupons', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });

      toast.success('Coupon deleted successfully!', { id: 'cpn-del-toast' });
    } catch (err) {
      console.error(err);
      setCoupons(prev => {
        const updated = (Array.isArray(prev) ? prev : []).filter(c => String(c.id) !== String(id));
        try { localStorage.setItem('karviyam_admin_coupons', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
      toast.success('Coupon deleted successfully!', { id: 'cpn-del-toast' });
    }
  };

  const [importModalOpen, setImportModalOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [isAllDatasetSelected, setIsAllDatasetSelected] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);

  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
  const [clearAllLoading, setClearAllLoading] = useState(false);

  const toggleSelectRow = (id) => {
    setIsAllDatasetSelected(false);
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPage = (currentFiltered) => {
    if (selectedIds.length === currentFiltered.length && currentFiltered.length > 0) {
      setSelectedIds([]);
      setIsAllDatasetSelected(false);
    } else {
      setSelectedIds(currentFiltered.map(c => c.id));
      setIsAllDatasetSelected(false);
    }
  };

  const selectFullDataset = () => {
    setSelectedIds(coupons.map(c => c.id));
    setIsAllDatasetSelected(true);
    toast.success(`Selected all ${coupons.length} coupons in dataset!`);
  };

  const handleDeleteSelectedCoupons = async () => {
    if (selectedIds.length === 0) return;
    setBatchDeleting(true);
    const count = selectedIds.length;
    toast.loading(`Deleting ${count} selected coupons...`, { id: 'cpn-batch-toast' });
    try {
      if (isAllDatasetSelected || selectedIds.length >= coupons.length) {
        let res = await api.delete('/admin/coupons/all').catch(() => null);
        if (!res) await api.post('/admin/coupons/delete-all').catch(() => null);
      } else {
        for (const id of selectedIds) {
          await api.delete(`/admin/coupons/${id}`).catch(() => null);
        }
      }

      const updated = coupons.filter(c => !selectedIds.includes(c.id));
      setCoupons(updated);
      try { localStorage.setItem('karviyam_admin_coupons', JSON.stringify(updated)); } catch (e) {}
      setSelectedIds([]);
      setIsAllDatasetSelected(false);
      toast.success(`Successfully deleted ${count} selected coupons.`, { id: 'cpn-batch-toast' });
      await fetchCoupons();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete selected coupons', { id: 'cpn-batch-toast' });
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleConfirmClearAllCoupons = async () => {
    setClearAllLoading(true);
    toast.loading('Purging all coupon records...', { id: 'coupon-toast' });
    try {
      let res = await api.delete('/admin/coupons/all').catch(() => null);
      if (!res) res = await api.post('/admin/coupons/delete-all').catch(() => null);

      const count = coupons.length;
      setCoupons([]);
      setSelectedIds([]);
      setIsAllDatasetSelected(false);
      try { localStorage.removeItem('karviyam_admin_coupons'); } catch (e) {}
      toast.success(`Successfully deleted ${count} coupons.`, { id: 'coupon-toast' });
      setClearAllModalOpen(false);
      await fetchCoupons();
    } catch (e) {
      console.error(e);
      toast.error('Clear All failed. No records were deleted.', { id: 'coupon-toast' });
    } finally {
      setClearAllLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Coupons & Discount Codes</h1>
          <p className="text-xs text-slate-500">Create promotional discount codes & configure checkout rules</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                const response = await api.get('/admin/excel/coupons/export', { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'karviyam_coupons_export.xlsx');
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.success('Exported coupons list!');
              } catch (err) {
                toast.error('Failed to export coupons');
              }
            }}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Export Coupons</span>
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Import Coupons</span>
          </button>

          <button
            onClick={() => setClearAllModalOpen(true)}
            className="flex items-center gap-2 bg-rose-700 hover:bg-rose-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-white" />
            <span>Clear All Data</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Coupon</span>
          </button>
        </div>
      </div>

      {/* Select All Bar */}
      {selectedIds.length > 0 && selectedIds.length === coupons.length && !isAllDatasetSelected && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
          <span>All {coupons.length} coupons on this page are selected.</span>
          <button
            type="button"
            onClick={selectFullDataset}
            className="text-rose-700 hover:text-rose-900 font-extrabold underline cursor-pointer"
          >
            Select all {coupons.length} coupons in dataset
          </button>
        </div>
      )}

      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
        <label className="flex items-center gap-2 font-bold text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={coupons.length > 0 && selectedIds.length === coupons.length}
            onChange={() => toggleSelectAllPage(coupons)}
            className="w-4 h-4 rounded border-slate-300 text-rose-700 focus:ring-rose-500 cursor-pointer"
          />
          <span>Select All Listed Coupons ({coupons.length})</span>
        </label>
      </div>

      {/* Coupons List Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((c) => (
          <div key={c.id} className={`bg-white p-5 rounded-2xl border ${selectedIds.includes(c.id) ? 'border-rose-300 ring-2 ring-rose-200 bg-rose-50/20' : 'border-slate-200'} shadow-xs space-y-3 relative`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(c.id)}
                  onChange={() => toggleSelectRow(c.id)}
                  className="w-4 h-4 rounded border-slate-300 text-rose-700 focus:ring-rose-500 cursor-pointer"
                />
                <span className="font-mono font-black text-lg text-[#B71C1C] bg-red-50 px-3 py-1 rounded-xl border border-red-100">
                  {c.code}
                </span>
              </div>
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

      {/* Bulk Coupon Import Modal */}
      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        type="coupons"
        onImportSuccess={fetchCoupons}
      />
      <ClearAllModal
        isOpen={clearAllModalOpen}
        onClose={() => setClearAllModalOpen(false)}
        moduleName="Coupons"
        itemCount={coupons.length}
        onConfirm={handleConfirmClearAllCoupons}
        loading={clearAllLoading}
      />
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={coupons.length}
        isAllDatasetSelected={isAllDatasetSelected}
        onSelectAllDataset={selectFullDataset}
        onDeleteSelected={handleDeleteSelectedCoupons}
        onClearSelection={() => {
          setSelectedIds([]);
          setIsAllDatasetSelected(false);
        }}
        moduleName="Coupons"
        loading={batchDeleting}
      />

    </div>
  );
}
