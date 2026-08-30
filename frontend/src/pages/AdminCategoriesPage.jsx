import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Edit2, Save, X, Search, Image as ImageIcon, Upload, Link as LinkIcon, Eye, EyeOff, Check, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import api from '../utils/api';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';
import toast from 'react-hot-toast';
import BulkImportModal from '../components/BulkImportModal';
import ExportPreviewModal from '../components/ExportPreviewModal';
import ImageUploadCropperModal from '../components/ImageUploadCropperModal';
import ClearAllModal from '../components/ClearAllModal';
import BulkActionBar from '../components/BulkActionBar';

const CLASSIFICATION_OPTIONS = [
  'MEN',
  'WOMEN',
  'UNISEX',
  'JEWELS',
  'KIDS & BABY',
  'ACCESSORIES',
  'KITCHEN & HOME',
  'SCHOOL & OFFICE',
  'OTHER'
];

const compressImage = (file, maxWidth = 600, maxHeight = 600, quality = 0.75) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type || 'image/jpeg', quality));
      };
      img.onerror = () => resolve(event.target.result);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

const compressBase64Url = (url) => {
  if (!url || !url.startsWith('data:image/') || url.length < 300000) {
    return Promise.resolve(url);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > 600) {
          height = Math.round((height * 600) / width);
          width = 600;
        }
      } else {
        if (height > 600) {
          width = Math.round((width * 600) / height);
          height = 600;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
};

const getCategoryActive = (cat) => {
  if (!cat) return true;
  const val = cat.isActive !== undefined ? cat.isActive : cat.is_active;
  if (val === undefined || val === null) return true;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') return val.toLowerCase() === 'true' || val === '1';
  if (typeof val === 'object' && val !== null && val.type === 'Buffer' && Array.isArray(val.data)) {
    return val.data[0] === 1 || val.data[0] === 0x01;
  }
  return Boolean(val);
};

const CategoryToggleSwitch = ({ isActive, disabled, onToggle }) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={`relative inline-flex h-8 w-20 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 ease-in-out select-none border focus:outline-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
      } ${
        isActive
          ? 'bg-emerald-600 border-emerald-700 shadow-xs'
          : 'bg-slate-300 border-slate-400 shadow-inner'
      }`}
      title={isActive ? 'Click to Turn OFF (Disable Category)' : 'Click to Turn ON (Enable Category)'}
    >
      <span
        className={`absolute text-[11px] font-black tracking-wider transition-opacity duration-200 ${
          isActive ? 'left-3 text-white opacity-100' : 'right-3 text-slate-700 opacity-100'
        }`}
      >
        {isActive ? 'ON' : 'OFF'}
      </span>
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-300 ease-in-out ${
          isActive ? 'translate-x-13' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportActiveTab, setExportActiveTab] = useState('pdf');
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'WOMEN',
    parentId: '',
    description: '',
    imageUrl: '',
    iconUrl: '',
    bannerUrl: '',
    orderIndex: 0,
    isActive: true,
    seoTitle: '',
    metaDescription: '',
    metaKeywords: '',
  });

  useEffect(() => {
    // Load from localStorage cache immediately if available for instant display
    try {
      const saved = localStorage.getItem('karviyam_admin_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
      }
    } catch (eSaved) {}

    fetchCategories();

    const handleCategoryUpdate = () => {
      fetchCategories();
    };
    window.addEventListener('karviyam_categories_updated', handleCategoryUpdate);
    return () => {
      window.removeEventListener('karviyam_categories_updated', handleCategoryUpdate);
    };
  }, []);

  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
  const [clearAllLoading, setClearAllLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAllDatasetSelected, setIsAllDatasetSelected] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      const apiData = res.data ? res.data : res;
      const rawList = Array.isArray(apiData?.data)
        ? apiData.data
        : (Array.isArray(apiData)
          ? apiData
          : (Array.isArray(apiData?.categories) ? apiData.categories : []));
      
      const normalized = rawList.map(c => ({
        ...c,
        isActive: getCategoryActive(c)
      }));
      setCategories(normalized);
      if (normalized.length > 0) {
        try { localStorage.setItem('karviyam_admin_categories', JSON.stringify(normalized)); } catch (e) {}
      } else {
        try { localStorage.removeItem('karviyam_admin_categories'); } catch (e) {}
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClearAllCategories = async () => {
    setClearAllLoading(true);
    toast.loading('Purging all product categories...', { id: 'cat-del-all-toast' });
    try {
      const res = await api.delete('/admin/categories/all')
        .catch(() => api.delete('/categories/all'))
        .catch(() => api.post('/admin/categories/delete-all'));

      if (res && res.data && res.data.success !== false) {
        const deletedCount = res.data.data?.deletedCount ?? res.data.deletedCount ?? categories.length;
        setCategories([]);
        setSelectedIds([]);
        setIsAllDatasetSelected(false);
        try { localStorage.removeItem('karviyam_admin_categories'); } catch (e) {}
        toast.success(`Successfully deleted ${deletedCount} categories.`, { id: 'cat-del-all-toast' });
        setClearAllModalOpen(false);
        await fetchCategories();
      } else {
        throw new Error(res?.data?.message || 'Category bulk delete failed');
      }
    } catch (e) {
      console.error('[ClearAllCategories Failure]:', e);
      const errorMsg = e.response?.data?.message || e.message || 'Unable to delete categories. No changes were made.';
      toast.error(errorMsg, { id: 'cat-del-all-toast' });
    } finally {
      setClearAllLoading(false);
    }
  };

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
    toast.success(`Selected all ${categories.length} categories in dataset!`);
  };

  const handleDeleteSelectedCategories = async () => {
    if (selectedIds.length === 0) return;
    setBatchDeleting(true);
    const count = selectedIds.length;
    toast.loading(`Deleting ${count} selected categories...`, { id: 'cat-batch-toast' });
    try {
      let res;
      if (isAllDatasetSelected || selectedIds.length >= categories.length) {
        res = await api.delete('/admin/categories/all').catch(() => api.delete('/categories/all'));
      } else {
        res = await api.post('/admin/categories/delete-batch', { ids: selectedIds })
          .catch(() => api.post('/categories/delete-batch', { ids: selectedIds }));
      }

      if (res && res.data && res.data.success !== false) {
        const deletedCount = res.data.data?.deletedCount ?? res.data.deletedCount ?? count;
        const strSelected = selectedIds.map(String);
        setCategories(prev => prev.filter(c => !strSelected.includes(String(c.id))));
        setSelectedIds([]);
        setIsAllDatasetSelected(false);
        try { localStorage.removeItem('karviyam_admin_categories'); } catch (e) {}
        toast.success(`Successfully deleted ${deletedCount} selected categories.`, { id: 'cat-batch-toast' });
        await fetchCategories();
      } else {
        throw new Error(res?.data?.message || 'Failed to delete selected categories');
      }
    } catch (e) {
      console.error('[BatchDeleteCategories Error]:', e);
      const errorMsg = e.response?.data?.message || e.message || 'Unable to delete categories. No changes were made.';
      toast.error(errorMsg, { id: 'cat-batch-toast' });
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      type: 'WOMEN',
      parentId: '',
      description: '',
      imageUrl: '',
      iconUrl: '',
      bannerUrl: '',
      orderIndex: categories.length + 1,
      isActive: true,
      seoTitle: '',
      metaDescription: '',
      metaKeywords: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      type: cat.type || 'WOMEN',
      parentId: (cat.parentId || cat.parent_id) ? String(cat.parentId || cat.parent_id) : '',
      description: cat.description || '',
      imageUrl: cat.imageUrl || cat.image_url || cat.mainImage || cat.main_image || '',
      iconUrl: cat.iconUrl || cat.icon_url || cat.categoryIcon || cat.category_icon || '',
      bannerUrl: cat.bannerUrl || cat.banner_url || cat.categoryBanner || cat.category_banner || '',
      orderIndex: cat.orderIndex ?? cat.sortOrder ?? cat.sort_order ?? cat.displayOrder ?? 0,
      isActive: cat.isActive !== false,
      seoTitle: cat.seoTitle || cat.seo_title || '',
      metaDescription: cat.metaDescription || cat.meta_description || '',
      metaKeywords: cat.metaKeywords || cat.meta_keywords || '',
    });
    setModalOpen(true);
  };

  const [cropperState, setCropperState] = useState(null); // { file, fieldKey, configType }

  const handleFileUpload = (e, fieldKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    const configType = fieldKey === 'iconUrl' ? 'categoryIcon' : (fieldKey === 'bannerUrl' ? 'categoryBanner' : 'category');
    setCropperState({ file, fieldKey, configType });
    e.target.value = '';
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.name || !formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSubmitting(true);
    toast.loading(editingCategory ? 'Updating category...' : 'Saving new category...', { id: 'cat-save-toast' });

    try {
      const compressedImage = await compressBase64Url(formData.imageUrl);
      const compressedIcon = await compressBase64Url(formData.iconUrl);
      const compressedBanner = await compressBase64Url(formData.bannerUrl);

      const payload = {
        ...formData,
        name: formData.name.trim(),
        imageUrl: compressedImage || null,
        iconUrl: compressedIcon || null,
        bannerUrl: compressedBanner || null,
        parentId: formData.parentId ? parseInt(formData.parentId, 10) : null,
        orderIndex: parseInt(formData.orderIndex, 10) || 0,
      };

      if (editingCategory) {
        const res = await api.put(`/categories/${editingCategory.id}`, payload)
          .catch(() => api.post(`/categories/${editingCategory.id}`, payload));
        const apiData = res.data ? res.data : res;
        if (apiData && apiData.success !== false) {
          toast.success('Category updated successfully!', { id: 'cat-save-toast' });
          const savedItem = apiData.data || apiData;
          setCategories(prev => {
            let updated = [...prev];
            const idx = updated.findIndex(c => String(c.id) === String(editingCategory.id));
            const normalizedItem = {
              ...updated[idx],
              ...savedItem,
              isActive: getCategoryActive(savedItem)
            };
            if (idx >= 0) updated[idx] = normalizedItem;
            try { localStorage.setItem('karviyam_admin_categories', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
          try { await fetchCategories(); } catch (eFetch) {}
          window.dispatchEvent(new Event('karviyam_categories_updated'));
          setModalOpen(false);
        } else {
          throw new Error(apiData?.message || 'Failed to update category');
        }
      } else {
        const res = await api.post('/categories', payload);
        const apiData = res.data ? res.data : res;
        if (apiData && apiData.success !== false) {
          toast.success('Category created successfully!', { id: 'cat-save-toast' });
          const savedItem = apiData.data || apiData;
          const normalizedNew = {
            id: savedItem?.id || Date.now(),
            ...payload,
            ...(savedItem || {}),
            isActive: getCategoryActive(savedItem || payload)
          };
          setCategories(prev => {
            const updated = [normalizedNew, ...prev.filter(c => String(c.id) !== String(normalizedNew.id))];
            try { localStorage.setItem('karviyam_admin_categories', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
          try { await fetchCategories(); } catch (eFetch) {}
          window.dispatchEvent(new Event('karviyam_categories_updated'));
          setModalOpen(false);
        } else {
          throw new Error(apiData?.message || 'Failed to create category');
        }
      }
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to save category';
      toast.error(msg, { id: 'cat-save-toast' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat) => {
    const catId = typeof cat === 'object' ? cat.id : cat;
    const catName = typeof cat === 'object' ? cat.name : 'this category';
    if (!window.confirm(`Are you sure you want to delete ${catName} permanently from database?`)) return;
    toast.loading(`Deleting category ${catName}...`, { id: 'cat-del-toast' });
    try {
      const res = await api.delete(`/categories/${catId}`)
        .catch(() => api.delete(`/admin/categories/${catId}`))
        .catch(() => api.post(`/categories/${catId}/delete`));

      if (res && res.data && res.data.success !== false) {
        const strId = String(catId);
        setCategories(prev => {
          const updated = prev.filter(c => String(c.id) !== strId);
          try {
            if (updated.length > 0) {
              localStorage.setItem('karviyam_admin_categories', JSON.stringify(updated));
            } else {
              localStorage.removeItem('karviyam_admin_categories');
            }
          } catch (e) {}
          return updated;
        });
        setSelectedIds(prev => prev.filter(i => String(i) !== strId));
        window.dispatchEvent(new Event('karviyam_categories_updated'));
        toast.success('Category deleted successfully from database!', { id: 'cat-del-toast' });
        await fetchCategories();
      } else {
        throw new Error(res?.data?.message || 'Category deletion failed');
      }
    } catch (e) {
      console.error('[DeleteCategory Failure]:', e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Unable to delete category. No changes were made.';
      toast.error(msg, { id: 'cat-del-toast' });
    }
  };
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const handleToggleStatus = async (cat, targetStatus = null) => {
    const catId = typeof cat === 'object' ? cat.id : cat;
    const currentActive = getCategoryActive(cat);
    const nextStatus = targetStatus !== null ? Boolean(targetStatus) : !currentActive;

    setTogglingId(catId);
    toast.loading(`Updating ${cat.name || 'category'} status...`, { id: 'cat-toggle-toast' });

    try {
      const payload = {
        isActive: nextStatus,
        active: nextStatus,
        is_active: nextStatus
      };
      let res = await api.post(`/categories/${catId}/toggle-status?active=${nextStatus}`, payload).catch(() => null);
      if (!res) {
        res = await api.put(`/categories/${catId}/toggle-status?active=${nextStatus}`, payload);
      }
      const apiData = res.data ? res.data : res;
      if (apiData && (apiData.success !== false || apiData.status === 'success')) {
        const returnedObj = apiData.data || apiData;
        const finalActive = getCategoryActive(returnedObj) !== undefined ? getCategoryActive(returnedObj) : nextStatus;

        setCategories(prev => prev.map(c =>
          String(c.id) === String(catId)
            ? { ...c, ...returnedObj, isActive: finalActive, is_active: finalActive ? 1 : 0 }
            : c
        ));

        toast.success(`Category ${finalActive ? 'enabled' : 'disabled'} successfully!`, { id: 'cat-toggle-toast' });
        await fetchCategories();
        window.dispatchEvent(new Event('karviyam_categories_updated'));
      } else {
        throw new Error(apiData?.message || 'Failed to toggle category status');
      }
    } catch (e) {
      console.error(e);
      // Revert state if request failed
      setCategories(prev => prev.map(c =>
        String(c.id) === String(catId)
          ? { ...c, isActive: currentActive, is_active: currentActive ? 1 : 0 }
          : c
      ));
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to update category. Please try again.';
      toast.error(msg, { id: 'cat-toggle-toast' });
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.type && c.type.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Categories Management</h1>
          <p className="text-xs text-slate-500">Manage product categories, visibility, sorting and category details.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setExportActiveTab('excel');
              setExportModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Export Categories (Excel)</span>
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Import Categories</span>
          </button>

          <button
            onClick={() => setClearAllModalOpen(true)}
            className="flex items-center gap-2 bg-rose-700 hover:bg-rose-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-white" />
            <span>Clear All Data</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD CATEGORY</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & View Toggle */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name or type..."
            className="w-full bg-slate-50 border border-slate-200 text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-[#B71C1C]"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-bold text-slate-600">{filtered.length} Categories Total</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Grid View
            </button>
          </div>
        </div>
      </div>

      {/* Structured Category Table */}
      {selectedIds.length > 0 && selectedIds.length === filtered.length && categories.length > filtered.length && !isAllDatasetSelected && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
          <span>All {filtered.length} categories on this page are selected.</span>
          <button
            type="button"
            onClick={selectFullDataset}
            className="text-rose-700 hover:text-rose-900 font-extrabold underline cursor-pointer"
          >
            Select all {categories.length} categories in dataset
          </button>
        </div>
      )}

      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-600 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectedIds.length === filtered.length}
                      onChange={() => toggleSelectAllPage(filtered)}
                      className="w-4 h-4 rounded border-slate-300 text-rose-700 focus:ring-rose-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Parent Category</th>
                  <th className="py-3.5 px-4">Classification</th>
                  <th className="py-3.5 px-4 text-center">Display Order</th>
                  <th className="py-3.5 px-4 text-center">STATUS</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                      <div className="space-y-1.5">
                        <p className="font-bold text-slate-700 text-sm">
                          {categories.length === 0 ? 'No Categories Found' : 'No categories found matching filter.'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {categories.length === 0
                            ? 'There are no product categories to display in the database.'
                            : 'Try adjusting your search query.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((cat) => {
                    const parentCat = categories.find(c => String(c.id) === String(cat.parentId));
                    const isActive = getCategoryActive(cat);
                    return (
                      <tr key={cat.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(cat.id) ? 'bg-rose-50/40' : !isActive ? 'bg-amber-50/20' : ''}`}>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(cat.id)}
                            onChange={() => toggleSelectRow(cat.id)}
                            className="w-4 h-4 rounded border-slate-300 text-rose-700 focus:ring-rose-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={resolveImageUrl(cat.imageUrl || cat.iconUrl || cat.bannerUrl, cat.id)}
                              onError={(e) => handleImageError(e, cat.id)}
                              alt={cat.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                            />
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{cat.name}</p>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{cat.description || 'No description'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {parentCat ? (
                            <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                              {parentCat.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">None (Top-Level)</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-red-50 text-[#B71C1C] text-[10px]">
                            {cat.type || 'WOMEN'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                          {cat.orderIndex || 0}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <CategoryToggleSwitch
                            isActive={isActive}
                            disabled={togglingId === cat.id}
                            onToggle={() => handleToggleStatus(cat)}
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(cat)}
                              className="p-1.5 text-slate-500 hover:text-[#B71C1C] rounded-lg hover:bg-red-50 transition-colors"
                              title="Edit Category"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(cat)}
                              className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Categories Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 col-span-full">
              <p className="font-bold text-slate-700 text-sm">
                {categories.length === 0 ? 'No Categories Found' : 'No categories found matching filter.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {categories.length === 0
                  ? 'There are no product categories to display in the database.'
                  : 'Try adjusting your search query.'}
              </p>
            </div>
          ) : (
            filtered.map((cat) => {
            const isActive = getCategoryActive(cat);
            return (
              <div key={cat.id} className={`bg-white p-5 rounded-2xl border ${selectedIds.includes(cat.id) ? 'border-rose-300 ring-2 ring-rose-200 bg-rose-50/20' : isActive ? 'border-slate-200' : 'border-amber-200 bg-amber-50/20'} shadow-xs flex flex-col justify-between space-y-4 relative`}>
                <div className="absolute top-4 right-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(cat.id)}
                    onChange={() => toggleSelectRow(cat.id)}
                    className="w-4 h-4 rounded border-slate-300 text-rose-700 focus:ring-rose-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-start gap-4 pr-6">
                  <img
                    src={cat.imageUrl || cat.iconUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'}
                    alt={cat.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-50 text-[#B71C1C]">
                        {cat.type}
                      </span>
                      {cat.parentName && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Parent: {cat.parentName}
                        </span>
                      )}
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {isActive ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm truncate">{cat.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{cat.description || 'No description'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="text-[11px] font-mono text-slate-400">Order #{cat.orderIndex || 0}</span>
                  <div className="flex items-center gap-2">
                    <CategoryToggleSwitch
                      isActive={isActive}
                      disabled={togglingId === cat.id}
                      onToggle={() => handleToggleStatus(cat)}
                    />
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-[#B71C1C] rounded-lg hover:bg-red-50"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl p-5 rounded-3xl shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600 cursor-pointer" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {/* Row 1: Core Fields (4 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarees, Shirts..."
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl outline-none focus:border-[#B71C1C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent Category</label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl outline-none focus:border-[#B71C1C]"
                  >
                    <option value="">None (Top-Level Category)</option>
                    {categories
                      .filter(c => !c.parentId && (!editingCategory || String(c.id) !== String(editingCategory.id)))
                      .map(c => (
                        <option key={c.id} value={c.id}>↳ {c.name} ({c.type || 'General'})</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Classification Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl outline-none focus:border-[#B71C1C] font-semibold text-slate-800"
                  >
                    {CLASSIFICATION_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Row 1.5: Category Status Control */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Category Status *</h4>
                  <p className="text-[11px] text-slate-500">Enabled categories appear in customer navigation. Disabled categories are hidden.</p>
                </div>
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: true })}
                    className={`px-3.5 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${formData.isActive ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Enabled [ ON ]
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: false })}
                    className={`px-3.5 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${!formData.isActive ? 'bg-red-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Disabled [ OFF ]
                  </button>
                </div>
              </div>

              {/* Row 2: File Uploads & URL Inputs (3 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Main Image */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-[11px]">Main Image</label>
                  {formData.imageUrl ? (
                    <div className="relative border border-slate-200 rounded-xl p-1.5 flex items-center gap-2 bg-slate-50 h-11">
                      <img src={formData.imageUrl} alt="Preview" className="w-8 h-8 object-cover rounded-lg border border-slate-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-[10px] truncate">{formData.imageUrl.substring(0, 30)}...</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                        className="p-1 text-red-600 hover:bg-red-100 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-[#B71C1C] rounded-xl p-2 flex items-center justify-center gap-2 bg-slate-50 hover:bg-red-50/20 cursor-pointer h-11 transition-all">
                      <Upload className="w-4 h-4 text-[#B71C1C]" />
                      <span className="font-bold text-slate-700 text-[11px]">Upload Image File</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'imageUrl')} className="hidden" />
                    </label>
                  )}
                  <input
                    type="text"
                    value={formData.imageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="Or paste Image URL..."
                    className="w-full bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-[11px] outline-none"
                  />
                </div>

                {/* Icon */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-[11px]">Category Icon</label>
                  {formData.iconUrl ? (
                    <div className="relative border border-slate-200 rounded-xl p-1.5 flex items-center gap-2 bg-slate-50 h-11">
                      <img src={formData.iconUrl} alt="Icon" className="w-8 h-8 object-cover rounded-lg border border-slate-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-[10px] truncate">{formData.iconUrl.substring(0, 30)}...</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, iconUrl: '' })}
                        className="p-1 text-red-600 hover:bg-red-100 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-[#B71C1C] rounded-xl p-2 flex items-center justify-center gap-2 bg-slate-50 hover:bg-red-50/20 cursor-pointer h-11 transition-all">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-700 text-[11px]">Upload Icon File</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'iconUrl')} className="hidden" />
                    </label>
                  )}
                  <input
                    type="text"
                    value={formData.iconUrl || ''}
                    onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                    placeholder="Or paste Icon URL..."
                    className="w-full bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-[11px] outline-none"
                  />
                </div>

                {/* Banner */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-[11px]">Category Banner</label>
                  {formData.bannerUrl ? (
                    <div className="relative border border-slate-200 rounded-xl p-1.5 flex items-center gap-2 bg-slate-50 h-11">
                      <img src={formData.bannerUrl} alt="Banner" className="w-8 h-8 object-cover rounded-lg border border-slate-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-[10px] truncate">{formData.bannerUrl.substring(0, 30)}...</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, bannerUrl: '' })}
                        className="p-1 text-red-600 hover:bg-red-100 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-[#B71C1C] rounded-xl p-2 flex items-center justify-center gap-2 bg-slate-50 hover:bg-red-50/20 cursor-pointer h-11 transition-all">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-700 text-[11px]">Upload Banner File</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'bannerUrl')} className="hidden" />
                    </label>
                  )}
                  <input
                    type="text"
                    value={formData.bannerUrl || ''}
                    onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                    placeholder="Or paste Banner URL..."
                    className="w-full bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-[11px] outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short category description..."
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl outline-none focus:border-[#B71C1C]"
                />
              </div>

              {/* Row 4: SEO Metadata (3 Columns) */}
              <div className="border-t border-slate-200 pt-2 space-y-1.5">
                <h4 className="font-bold text-slate-800 text-[11px]">SEO Metadata</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1 text-[11px]">SEO Title</label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      placeholder="Title for search engines"
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1 text-[11px]">Meta Keywords</label>
                    <input
                      type="text"
                      value={formData.metaKeywords}
                      onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                      placeholder="sarees, cotton, traditional..."
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1 text-[11px]">Meta Description</label>
                    <input
                      type="text"
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      placeholder="Meta description..."
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold py-2.5 rounded-xl shadow-md uppercase tracking-wider cursor-pointer transition-all mt-1"
              >
                {editingCategory ? 'Update Category' : 'Save Category'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Category Import Modal */}
      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        type="categories"
        onImportSuccess={() => {
          fetchCategories();
          setImportModalOpen(false);
        }}
      />

      {/* Standardized Category Image Cropper Modal */}
      <ImageUploadCropperModal
        isOpen={Boolean(cropperState)}
        onClose={() => setCropperState(null)}
        imageFile={cropperState?.file}
        configType={cropperState?.configType || 'category'}
        onConfirmCrop={(croppedUrl) => {
          if (cropperState?.fieldKey) {
            setFormData(prev => ({ ...prev, [cropperState.fieldKey]: croppedUrl }));
          }
          setCropperState(null);
        }}
      />
      <ClearAllModal
        isOpen={clearAllModalOpen}
        onClose={() => setClearAllModalOpen(false)}
        moduleName="Categories"
        itemCount={categories.length}
        onConfirm={handleConfirmClearAllCategories}
        loading={clearAllLoading}
      />
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={categories.length}
        isAllDatasetSelected={isAllDatasetSelected}
        onSelectAllDataset={selectFullDataset}
        onDeleteSelected={handleDeleteSelectedCategories}
        onClearSelection={() => {
          setSelectedIds([]);
          setIsAllDatasetSelected(false);
        }}
        moduleName="Categories"
        loading={batchDeleting}
      />
      <ExportPreviewModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Categories Management"
        filename="karviyam_categories_export"
        headers={[
          { label: 'Category Name', accessor: 'name' },
          { label: 'Type / Classification', accessor: (c) => c.type || c.classification || 'WOMEN' },
          { label: 'Sort Order', accessor: (c) => c.orderIndex || c.order_index || 0 },
          { label: 'Status', accessor: (c) => getCategoryActive(c) ? 'Active' : 'Inactive' }
        ]}
        data={filtered}
        activeTab={exportActiveTab}
        customExcelHandler={async () => {
          const response = await api.get('/admin/excel/categories/export', { responseType: 'blob' });
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'karviyam_categories_export.xlsx');
          document.body.appendChild(link);
          link.click();
          link.remove();
          toast.success('Exported category catalog!');
        }}
      />

    </div>
  );
}




