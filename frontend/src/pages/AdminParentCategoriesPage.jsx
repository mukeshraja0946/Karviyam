import React, { useState, useEffect } from 'react';
import ExportDropdown from '../components/ExportDropdown';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  X,
  Eye,
  Upload,
  Link as LinkIcon,
  Power,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Loader2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { resolveImageUrl } from '../utils/imageUtils';
import ImageUploadCropperModal from '../components/ImageUploadCropperModal';
import ClearAllModal from '../components/ClearAllModal';
import BulkActionBar from '../components/BulkActionBar';

const PARENT_CATEGORY_EXPORT_HEADERS = [
  { label: 'Category Name', accessor: 'name' },
  { label: 'Classification', accessor: (c) => c.classification || c.gender || 'WOMEN' },
  { label: 'Sub-title', accessor: 'subtitle' },
  { label: 'Display Order', accessor: (c) => c.displayOrder || c.orderIndex || 0 },
  { label: 'Status', accessor: (c) => c.isActive !== false ? 'Active' : 'Inactive' }
];

export default function AdminParentCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [cropperFile, setCropperFile] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    displayOrder: 1,
    isActive: true,
    link: '/shop'
  });
  const [useUrlMode, setUseUrlMode] = useState(false);

  useEffect(() => {
    fetchParentCategories();
  }, []);

  const fetchParentCategories = async () => {
    setLoading(true);
    try {
      let list = [];
      const res = await api.get('/parent-categories/admin').catch(() => null);
      const apiData = res?.data ? res.data : res;
      list = Array.isArray(apiData?.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);

      if (Array.isArray(list)) {
        setCategories(list);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('[Fetch Parent Categories Error]:', err);
      toast.error('Could not load parent categories from server');
    } finally {
      setLoading(false);
    }
  };

  const notifyUpdate = () => {
    try { localStorage.removeItem('karviyam_admin_parent_categories'); } catch (e) {}
    window.dispatchEvent(new Event('karviyam_parent_categories_updated'));
    window.dispatchEvent(new Event('karviyam_categories_updated'));
  };

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      imageUrl: '',
      displayOrder: categories.length + 1,
      isActive: true,
      link: '/shop'
    });
    setUseUrlMode(false);
    setSubmitting(false);
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      imageUrl: cat.imageUrl || cat.imagePath || '',
      displayOrder: cat.displayOrder || 1,
      isActive: cat.isActive !== false,
      link: cat.link || `/shop?category=${encodeURIComponent(cat.name || '')}`
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
    toast.success('Category image cropped & ready to save! ✂️');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    if (!formData.imageUrl || !formData.imageUrl.trim()) {
      toast.error('Please upload or enter a category image');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim().toUpperCase(),
        imageUrl: formData.imageUrl.trim(),
        displayOrder: Number(formData.displayOrder) || 1,
        isActive: Boolean(formData.isActive),
        link: formData.link.trim() || `/shop?category=${encodeURIComponent(formData.name.trim())}`
      };

      if (editingCategory && editingCategory.id) {
        await api.put(`/parent-categories/${editingCategory.id}`, payload);
        toast.success(`Updated "${payload.name}" successfully! 🎉`);
      } else {
        await api.post('/parent-categories', payload);
        toast.success(`Added "${payload.name}" successfully! 🎉`);
      }

      setModalOpen(false);
      await fetchParentCategories();
      notifyUpdate();
    } catch (err) {
      console.error('[Save Parent Category Error]:', err);
      toast.error(err.response?.data?.message || 'Failed to save parent category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (cat) => {
    const nextState = !cat.isActive;
    setActionLoading(prev => ({ ...prev, [cat.id]: true }));

    try {
      await api.put(`/parent-categories/${cat.id}`, {
        name: cat.name,
        imageUrl: cat.imagePath || cat.imageUrl,
        displayOrder: cat.displayOrder,
        isActive: nextState,
        link: cat.link
      });

      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: nextState } : c));
      toast.success(`Category "${cat.name}" is now ${nextState ? 'ENABLED' : 'DISABLED'}`);
      notifyUpdate();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update category status');
    } finally {
      setActionLoading(prev => ({ ...prev, [cat.id]: false }));
    }
  };

  const handleMoveOrder = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap items
    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    // Update display orders
    const updatedWithOrders = newCategories.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1
    }));

    setCategories(updatedWithOrders);

    try {
      const payloadItems = updatedWithOrders.map(item => ({
        id: item.id,
        displayOrder: item.displayOrder
      }));
      await api.put('/parent-categories/reorder', { items: payloadItems });
      toast.success('Category order saved! ↕️');
      notifyUpdate();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save category reordering');
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Are you sure you want to remove "${cat.name}" from the Homepage Top Categories?\n\nNote: This will NOT delete any products or subcategories in your store.`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [cat.id]: true }));
    try {
      const res = await api.delete(`/parent-categories/${cat.id}`);
      if (res && res.data && res.data.success !== false) {
        const strId = String(cat.id);
        setCategories(prev => prev.filter(c => String(c.id) !== strId));
        setSelectedIds(prev => prev.filter(i => String(i) !== strId));
        toast.success(`Category card "${cat.name}" deleted successfully!`);
        notifyUpdate();
        await fetchParentCategories();
      } else {
        throw new Error(res?.data?.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error('[DeleteParentCategory Error]:', err);
      toast.error(err.response?.data?.message || err.message || 'Unable to delete category. No changes were made.');
    } finally {
      setActionLoading(prev => ({ ...prev, [cat.id]: false }));
    }
  };

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
    setSelectedIds(categories.map(c => c.id));
    setIsAllDatasetSelected(true);
    toast.success(`Selected all ${categories.length} parent categories in dataset!`);
  };

  const handleDeleteSelectedParentCategories = async () => {
    if (selectedIds.length === 0) return;
    setBatchDeleting(true);
    const count = selectedIds.length;
    toast.loading(`Deleting ${count} selected parent categories...`, { id: 'pcat-batch-toast' });
    try {
      let res;
      if (isAllDatasetSelected || selectedIds.length >= categories.length) {
        res = await api.delete('/parent-categories/all')
          .catch(() => api.post('/parent-categories/delete-all'));
      } else {
        res = await api.post('/parent-categories/delete-batch', { ids: selectedIds })
          .catch(() => api.delete('/parent-categories/delete-batch', { data: { ids: selectedIds } }));
      }

      if (res && res.data && res.data.success !== false) {
        const deletedCount = res.data.data?.deletedCount ?? res.data.deletedCount ?? count;
        const strSelected = selectedIds.map(String);
        setCategories(prev => prev.filter(c => !strSelected.includes(String(c.id))));
        setSelectedIds([]);
        setIsAllDatasetSelected(false);
        notifyUpdate();
        toast.success(`Successfully deleted ${deletedCount} selected parent categories.`, { id: 'pcat-batch-toast' });
        await fetchParentCategories();
      } else {
        throw new Error(res?.data?.message || 'Failed to delete selected parent categories');
      }
    } catch (e) {
      console.error('[BatchDeleteParentCategories Error]:', e);
      const errorMsg = e.response?.data?.message || e.message || 'Unable to delete parent categories. No changes were made.';
      toast.error(errorMsg, { id: 'pcat-batch-toast' });
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleConfirmClearAllParentCategories = async () => {
    setClearAllLoading(true);
    toast.loading('Purging all parent categories...', { id: 'pcat-toast' });
    try {
      const res = await api.delete('/parent-categories/all')
        .catch(() => api.post('/parent-categories/delete-all'));

      if (res && res.data && res.data.success !== false) {
        const deletedCount = res.data.data?.deletedCount ?? res.data.deletedCount ?? categories.length;
        setCategories([]);
        setSelectedIds([]);
        setIsAllDatasetSelected(false);
        toast.success(`Successfully deleted ${deletedCount} parent categories.`, { id: 'pcat-toast' });
        notifyUpdate();
        setClearAllModalOpen(false);
        await fetchParentCategories();
      } else {
        throw new Error(res?.data?.message || 'Bulk delete API failed');
      }
    } catch (err) {
      console.error('[ClearAllParentCategories Error]:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Unable to clear parent categories. No changes were made.';
      toast.error(errorMsg, { id: 'pcat-toast' });
    } finally {
      setClearAllLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      
      {/* Header Banner (Light Theme) */}
      <div className="bg-white rounded-3xl p-6 text-slate-900 shadow-xs border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-[#B71C1C] flex items-center justify-center shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-900">
                Parent / Main Categories
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage the "Top Categories" cards displayed on Customer Homepage (Desktop & Mobile)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setClearAllModalOpen(true)}
            className="bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Data</span>
          </button>

          <ExportDropdown
            filename="parent_categories_report"
            title="Parent Categories Management Report"
            headers={PARENT_CATEGORY_EXPORT_HEADERS}
            data={categories}
          />

          <button
            onClick={handleOpenAddModal}
            className="bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider px-5 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Parent Category</span>
          </button>
        </div>
      </div>

      {/* Live Homepage Top Categories Preview Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Customer Homepage "Top Categories" Live Preview</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Only categories set to <span className="font-bold text-emerald-700">ENABLED</span> will appear for customers in exact display order.
            </p>
          </div>
          <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            {(Array.isArray(categories) ? categories : []).filter(c => c && c.isActive !== false).length} Active Cards
          </span>
        </div>

        {/* Horizontal Preview Grid (Matching Reference Screenshot) */}
        {(Array.isArray(categories) ? categories : []).filter(c => c && c.isActive !== false).length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No active categories. Click "Add Parent Category" or enable existing categories below.
          </div>
        ) : (
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-1 pt-0.5 w-full">
            {Array.from(Array.isArray(categories) ? categories : [])
              .filter(c => c && c.isActive !== false)
              .sort((a, b) => (Number(a?.displayOrder) || 0) - (Number(b?.displayOrder) || 0))
              .map(cat => (
                <div
                  key={cat?.id || cat?.name}
                  className="flex flex-col items-center shrink-0 w-[100px] group cursor-pointer"
                >
                  <div className="w-full aspect-square bg-[#F0F6FE] rounded-2xl p-2 flex items-center justify-center border border-slate-100/80 shadow-2xs overflow-hidden">
                    <img
                      src={resolveImageUrl(cat?.imageUrl || cat?.imagePath)}
                      alt={cat?.name || 'Category'}
                      className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="font-bold text-[11px] text-slate-800 text-center truncate w-full mt-2">
                    {cat?.name || ''}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Admin Management Grid / List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={categories.length > 0 && selectedIds.length === categories.length}
              onChange={() => toggleSelectAllPage(categories)}
              className="w-4 h-4 rounded border-slate-300 text-rose-700 focus:ring-rose-500 cursor-pointer"
            />
            <h2 className="font-display font-extrabold text-base text-slate-900">
              Parent Category Cards Management ({(Array.isArray(categories) ? categories : []).length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Use Up/Down arrows to reorder homepage display</span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#B71C1C] animate-spin" />
            <p className="text-xs font-bold text-slate-500">Loading Parent Categories...</p>
          </div>
        ) : (Array.isArray(categories) ? categories : []).length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Parent Categories Configured</p>
            <button
              onClick={handleOpenAddModal}
              className="bg-[#B71C1C] text-white text-xs font-extrabold px-4 py-2 rounded-xl"
            >
              Add First Parent Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(Array.isArray(categories) ? categories : []).map((cat, idx) => {
              if (!cat) return null;
              return (
                <div
                  key={cat.id || idx}
                  className={`bg-white rounded-2xl border-2 p-4 space-y-3 shadow-2xs relative flex flex-col justify-between transition-all ${
                    selectedIds.includes(cat.id) ? 'border-rose-300 ring-2 ring-rose-200 bg-rose-50/20' : cat.isActive !== false ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 bg-slate-50/70 opacity-75'
                  }`}
                >
                {/* Card Top Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(cat.id)}
                      onChange={() => toggleSelectRow(cat.id)}
                      className="w-4 h-4 rounded border-slate-300 text-rose-700 focus:ring-rose-500 cursor-pointer"
                    />
                    <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                      #{cat.displayOrder || idx + 1}
                    </span>
                  </div>

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
                      disabled={idx === categories.length - 1}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleActive(cat)}
                      disabled={actionLoading[cat.id]}
                      className={`ml-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1 ${
                        cat.isActive !== false
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{cat.isActive !== false ? 'Enabled' : 'Disabled'}</span>
                    </button>
                  </div>
                </div>

                {/* Category Image Box */}
                <div className="w-full h-36 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative group">
                  <img
                    src={resolveImageUrl(cat.imageUrl)}
                    alt={cat.name}
                    className="w-full h-full object-cover object-center transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(cat)}
                      className="bg-white text-slate-900 p-2 rounded-xl text-xs font-bold shadow-md hover:bg-[#B71C1C] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>

                {/* Category Details */}
                <div className="space-y-1">
                  <h3 className="font-display font-black text-sm text-slate-900 tracking-tight uppercase truncate">
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate">
                    <LinkIcon className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{cat.link || `/shop?category=${encodeURIComponent(cat.name)}`}</span>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenEditModal(cat)}
                    className="text-xs font-bold text-slate-700 hover:text-[#B71C1C] flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Card</span>
                  </button>

                  <button
                    onClick={() => handleDelete(cat)}
                    disabled={actionLoading[cat.id]}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                  >
                    {actionLoading[cat.id] ? (
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
            );
          })}
        </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* ADD / EDIT PARENT CATEGORY MODAL                          */}
      {/* ========================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-6">
            
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="font-display font-black text-base flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#B71C1C]" />
                  <span>{editingCategory ? 'Edit Parent Category' : 'Add New Parent Category'}</span>
                </h3>
                <p className="text-[10.5px] text-slate-400">Configure card details for Homepage Top Categories section</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Category Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. T-SHIRTS, SNEAKERS, KURTA SETS"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white uppercase"
                  required
                />
              </div>

              {/* Category Target Link */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">Category Target Link *</label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="e.g. /shop?category=T-Shirts"
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

              {/* Image Upload & Crop Section */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-800">Category Image *</label>
                  <button
                    type="button"
                    onClick={() => setUseUrlMode(!useUrlMode)}
                    className="text-[10.5px] font-bold text-[#B71C1C] hover:underline"
                  >
                    {useUrlMode ? 'Switch to Upload & Crop' : 'Switch to Image URL'}
                  </button>
                </div>

                {/* Upload & Crop Flow */}
                {!useUrlMode ? (
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center p-5 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-[#B71C1C] rounded-2xl cursor-pointer transition-all hover:bg-red-50/30 group">
                      <Upload className="w-7 h-7 text-slate-400 group-hover:text-[#B71C1C] transition-colors mb-1.5" />
                      <span className="text-xs font-extrabold text-slate-800">Upload Image File</span>
                      <span className="text-[10px] text-slate-400">Opens standardized 1:1 image cropper</span>
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
                          className="w-14 h-14 object-contain rounded-xl bg-white border border-slate-200 p-1"
                        />
                        <div className="flex-1 text-xs">
                          <span className="font-bold text-emerald-700 block">✓ Image ready</span>
                          <span className="text-[10px] text-slate-400">Cropped output saved for homepage</span>
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
                    <span>Save Category</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STANDARDIZED IMAGE UPLOAD CROPPER MODAL                    */}
      {/* ========================================================= */}
      {cropperFile && (
        <ImageUploadCropperModal
          isOpen={!!cropperFile}
          onClose={() => setCropperFile(null)}
          imageFile={cropperFile}
          configType="parentCategory"
          onConfirmCrop={handleCropConfirm}
        />
      )}
      <ClearAllModal
        isOpen={clearAllModalOpen}
        onClose={() => setClearAllModalOpen(false)}
        moduleName="Parent Categories"
        itemCount={categories.length}
        onConfirm={handleConfirmClearAllParentCategories}
        loading={clearAllLoading}
      />
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={categories.length}
        isAllDatasetSelected={isAllDatasetSelected}
        onSelectAllDataset={selectFullDataset}
        onDeleteSelected={handleDeleteSelectedParentCategories}
        onClearSelection={() => {
          setSelectedIds([]);
          setIsAllDatasetSelected(false);
        }}
        moduleName="Parent Categories"
        loading={batchDeleting}
      />

    </div>
  );
}
