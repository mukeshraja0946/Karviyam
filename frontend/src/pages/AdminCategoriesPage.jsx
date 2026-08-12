import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Edit2, Save, X, Search, Image as ImageIcon, Upload, Link as LinkIcon, Eye, EyeOff, Check, FileSpreadsheet } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import BulkCategoryImportModal from '../components/BulkCategoryImportModal';

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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
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
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      const apiData = res.data ? res.data : res;
      const list = Array.isArray(apiData.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);

      setCategories(prev => {
        if (list.length > 0) {
          const merged = [...list];
          prev.forEach(p => {
            if (p && p.id && !merged.some(m => String(m.id) === String(p.id))) {
              merged.unshift(p);
            }
          });
          try { localStorage.setItem('karviyam_admin_categories', JSON.stringify(merged)); } catch (e) {}
          return merged;
        } else if (prev.length > 0) {
          try { localStorage.setItem('karviyam_admin_categories', JSON.stringify(prev)); } catch (e) {}
          return prev;
        } else {
          try {
            const saved = localStorage.getItem('karviyam_admin_categories');
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
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
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
      parentId: cat.parentId ? String(cat.parentId) : '',
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
      iconUrl: cat.iconUrl || '',
      bannerUrl: cat.bannerUrl || '',
      orderIndex: cat.orderIndex || 0,
      isActive: cat.isActive !== false,
      seoTitle: cat.seoTitle || '',
      metaDescription: cat.metaDescription || '',
      metaKeywords: cat.metaKeywords || '',
    });
    setModalOpen(true);
  };

  const handleFileUpload = async (e, fieldKey) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        toast.loading('Uploading image...', { id: 'img-upload' });

        const uploadRes = await api.post('/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).catch(() => null);

        toast.dismiss('img-upload');

        const apiData = uploadRes?.data ? uploadRes.data : uploadRes;
        const uploadedUrl = apiData?.data?.url || apiData?.url;

        if (uploadedUrl) {
          setFormData(prev => ({ ...prev, [fieldKey]: uploadedUrl }));
          toast.success('Image uploaded successfully!');
          return;
        }

        // Fallback to compressed base64
        const compressedBase64 = await compressImage(file);
        if (compressedBase64) {
          setFormData(prev => ({ ...prev, [fieldKey]: compressedBase64 }));
          toast.success('Image selected and optimized!');
        }
      } catch (err) {
        console.error(err);
        toast.dismiss('img-upload');
        toast.error('Error processing image');
      }
    }
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
            if (idx >= 0) updated[idx] = { ...updated[idx], ...savedItem };
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
          setCategories(prev => {
            let updated = [...prev];
            const itemToInsert = (savedItem && (savedItem.id || savedItem.name))
              ? savedItem
              : { id: Date.now(), ...payload };
            updated.unshift(itemToInsert);
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
    if (!window.confirm(`Are you sure you want to delete ${catName}?`)) return;
    toast.loading(`Deleting category ${catName}...`, { id: 'cat-del-toast' });
    try {
      await api.delete(`/categories/${catId}`).catch(() => null);

      setCategories(prev => {
        const updated = prev.filter(c => String(c.id) !== String(catId));
        try { localStorage.setItem('karviyam_admin_categories', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });

      window.dispatchEvent(new Event('karviyam_categories_updated'));
      toast.success('Category deleted successfully!', { id: 'cat-del-toast' });
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to delete category';
      toast.error(msg, { id: 'cat-del-toast' });
    }
  };

  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const handleToggleStatus = async (cat, targetStatus = null) => {
    const nextStatus = targetStatus !== null ? Boolean(targetStatus) : !cat.isActive;
    toast.loading(`Updating ${cat.name} status...`, { id: 'cat-toggle-toast' });
    try {
      const res = await api.put(`/categories/${cat.id}/toggle-status?active=${nextStatus}`);
      const apiData = res.data ? res.data : res;
      if (apiData && apiData.success !== false) {
        toast.success(`Category ${nextStatus ? 'enabled' : 'disabled'} successfully!`, { id: 'cat-toggle-toast' });
        await fetchCategories();
        window.dispatchEvent(new Event('karviyam_categories_updated'));
      } else {
        throw new Error(apiData?.message || 'Failed to toggle category status');
      }
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.message || 'Failed to toggle status';
      toast.error(msg, { id: 'cat-toggle-toast' });
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
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Import Categories</span>
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
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-600 tracking-wider">
                <tr>
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
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                      No categories found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((cat) => {
                    const parentCat = categories.find(c => String(c.id) === String(cat.parentId));
                    return (
                      <tr key={cat.id} className={`hover:bg-slate-50/80 transition-colors ${!cat.isActive ? 'bg-amber-50/20' : ''}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={cat.imageUrl || cat.iconUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'}
                              alt={cat.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
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
                          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(cat, true)}
                              className={`px-3 py-1 rounded-lg font-black text-[11px] transition-all cursor-pointer ${cat.isActive ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-800'}`}
                            >
                              ON
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(cat, false)}
                              className={`px-3 py-1 rounded-lg font-black text-[11px] transition-all cursor-pointer ${!cat.isActive ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-800'}`}
                            >
                              OFF
                            </button>
                          </div>
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
          {filtered.map((cat) => (
            <div key={cat.id} className={`bg-white p-5 rounded-2xl border ${cat.isActive ? 'border-slate-200' : 'border-amber-200 bg-amber-50/20'} shadow-xs flex flex-col justify-between space-y-4`}>
              <div className="flex items-start gap-4">
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
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cat.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {cat.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm truncate">{cat.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{cat.description || 'No description'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-[11px] font-mono text-slate-400">Order #{cat.orderIndex || 0}</span>
                <div className="flex items-center gap-1">
                  <div className="inline-flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 mr-1">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(cat, true)}
                      className={`px-2 py-0.5 rounded font-black text-[9px] ${cat.isActive ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      ON
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(cat, false)}
                      className={`px-2 py-0.5 rounded font-black text-[9px] ${!cat.isActive ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                    >
                      OFF
                    </button>
                  </div>
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
          ))}
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
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl outline-none"
                  >
                    <option value="">None (Top-Level)</option>
                    {categories
                      .filter(c => !editingCategory || c.id !== editingCategory.id)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
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

              {/* Row 2: File Uploads (3 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Main Image */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-[11px]">Main Image File</label>
                  {formData.imageUrl ? (
                    <div className="relative border border-slate-200 rounded-xl p-1.5 flex items-center gap-2 bg-slate-50 h-14">
                      <img src={formData.imageUrl} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-[11px] truncate">Selected</p>
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
                    <label className="border-2 border-dashed border-slate-300 hover:border-[#B71C1C] rounded-xl p-2.5 flex items-center justify-center gap-2 bg-slate-50 hover:bg-red-50/20 cursor-pointer h-14 transition-all">
                      <Upload className="w-4 h-4 text-[#B71C1C]" />
                      <span className="font-bold text-slate-700 text-[11px]">Upload Image</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'imageUrl')} className="hidden" />
                    </label>
                  )}
                </div>

                {/* Icon */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-[11px]">Category Icon</label>
                  {formData.iconUrl ? (
                    <div className="relative border border-slate-200 rounded-xl p-1.5 flex items-center gap-2 bg-slate-50 h-14">
                      <img src={formData.iconUrl} alt="Icon" className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-[11px] truncate">Selected</p>
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
                    <label className="border-2 border-dashed border-slate-300 hover:border-[#B71C1C] rounded-xl p-2.5 flex items-center justify-center gap-2 bg-slate-50 hover:bg-red-50/20 cursor-pointer h-14 transition-all">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-700 text-[11px]">Upload Icon</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'iconUrl')} className="hidden" />
                    </label>
                  )}
                </div>

                {/* Banner */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-[11px]">Category Banner</label>
                  {formData.bannerUrl ? (
                    <div className="relative border border-slate-200 rounded-xl p-1.5 flex items-center gap-2 bg-slate-50 h-14">
                      <img src={formData.bannerUrl} alt="Banner" className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-[11px] truncate">Selected</p>
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
                    <label className="border-2 border-dashed border-slate-300 hover:border-[#B71C1C] rounded-xl p-2.5 flex items-center justify-center gap-2 bg-slate-50 hover:bg-red-50/20 cursor-pointer h-14 transition-all">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-700 text-[11px]">Upload Banner</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'bannerUrl')} className="hidden" />
                    </label>
                  )}
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
      <BulkCategoryImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={fetchCategories}
      />

    </div>
  );
}




