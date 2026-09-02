import React, { useState, useEffect } from 'react';
import { Award, Plus, Trash2, CheckCircle2, Upload, Image as ImageIcon, X } from 'lucide-react';
import api from '../utils/api';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';
import toast from 'react-hot-toast';
import ExportDropdown from '../components/ExportDropdown';
import ImageUploadCropperModal from '../components/ImageUploadCropperModal';
import ClearAllModal from '../components/ClearAllModal';
import BulkActionBar from '../components/BulkActionBar';

const BRAND_EXPORT_HEADERS = [
  { label: 'Brand Name', accessor: 'name' },
  { label: 'Slug', accessor: 'slug' },
  { label: 'Status', accessor: (b) => b.isActive !== false ? 'Active' : 'Inactive' }
];

const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
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
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type || 'image/png';
        resolve(canvas.toDataURL(mimeType, quality));
      };
      img.onerror = () => resolve(event.target.result);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandLogo, setNewBrandLogo] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  const DEFAULT_BRANDS = [
    { id: 1, name: 'Karviyam', slug: 'karviyam', logoUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200', isActive: true }
  ];

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await api.get('/brands');
      const apiData = res.data ? res.data : res;
      const list = Array.isArray(apiData.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);

      setBrands(prev => {
        if (list.length > 0) {
          const merged = [...list];
          prev.forEach(p => {
            if (p && p.id && !merged.some(m => String(m.id) === String(p.id))) {
              merged.unshift(p);
            }
          });
          try { localStorage.setItem('karviyam_admin_brands', JSON.stringify(merged)); } catch (e) {}
          return merged;
        } else if (prev.length > 0) {
          try { localStorage.setItem('karviyam_admin_brands', JSON.stringify(prev)); } catch (e) {}
          return prev;
        } else {
          try {
            const saved = localStorage.getItem('karviyam_admin_brands');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
          } catch (eSaved) {}
          return DEFAULT_BRANDS;
        }
      });
    } catch (e) {
      console.error(e);
      try {
        const saved = localStorage.getItem('karviyam_admin_brands');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setBrands(parsed);
          else setBrands(DEFAULT_BRANDS);
        } else {
          setBrands(DEFAULT_BRANDS);
        }
      } catch (e2) {
        setBrands(DEFAULT_BRANDS);
      }
    } finally {
      setLoading(false);
    }
  };

  const [cropperFile, setCropperFile] = useState(null);

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    setCropperFile(file);
    e.target.value = '';
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!newBrandName.trim()) {
      toast.error('Brand name is required');
      return;
    }
    try {
      const payload = {
        name: newBrandName.trim(),
        logoUrl: newBrandLogo.trim() || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200',
        isActive: true,
      };
      const res = await api.post('/brands', payload);
      const apiData = res.data ? res.data : res;
      const savedItem = apiData.data || apiData;

      toast.success('Brand added successfully!');
      setNewBrandName('');
      setNewBrandLogo('');

      setBrands(prev => {
        let updated = [...prev];
        const itemToInsert = (savedItem && (savedItem.id || savedItem.name))
          ? savedItem
          : { id: Date.now(), ...payload };
        updated.unshift(itemToInsert);
        try { localStorage.setItem('karviyam_admin_brands', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });

      window.dispatchEvent(new Event('karviyam_categories_updated'));
      try { await fetchBrands(); } catch (eFetch) {}
    } catch (e) {
      console.error(e);
      const errMsg = e.response?.data?.message || e.message || 'Failed to add brand';
      toast.error(errMsg);
    }
  };

  const handleDeleteBrand = async (id) => {
    if (!window.confirm('Delete this brand permanently from database?')) return;
    toast.loading('Deleting brand...', { id: 'brand-del-toast' });
    try {
      const res = await api.delete(`/admin/brands/${id}`)
        .catch(() => api.delete(`/brands/${id}`));

      if (res && res.data && res.data.success !== false) {
        const strId = String(id);
        setBrands(prev => {
          const updated = prev.filter(b => String(b.id) !== strId);
          try {
            if (updated.length > 0) {
              localStorage.setItem('karviyam_admin_brands', JSON.stringify(updated));
            } else {
              localStorage.removeItem('karviyam_admin_brands');
            }
          } catch (e) {}
          return updated;
        });
        setSelectedIds(prev => prev.filter(i => String(i) !== strId));
        window.dispatchEvent(new Event('karviyam_categories_updated'));
        toast.success('Brand deleted successfully!', { id: 'brand-del-toast' });
        await fetchBrands();
      } else {
        throw new Error(res?.data?.message || 'Brand deletion failed');
      }
    } catch (e) {
      console.error('[DeleteBrand Error]:', e);
      toast.error(e.response?.data?.message || e.message || 'Unable to delete brand. No changes were made.', { id: 'brand-del-toast' });
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
      setSelectedIds(currentFiltered.map(b => b.id));
      setIsAllDatasetSelected(false);
    }
  };

  const selectFullDataset = () => {
    setSelectedIds(brands.map(b => b.id));
    setIsAllDatasetSelected(true);
    toast.success(`Selected all ${brands.length} brands in dataset!`);
  };

  const handleDeleteSelectedBrands = async () => {
    if (selectedIds.length === 0) return;
    setBatchDeleting(true);
    const count = selectedIds.length;
    toast.loading(`Deleting ${count} selected brands...`, { id: 'brand-batch-toast' });
    try {
      let res;
      if (isAllDatasetSelected || selectedIds.length >= brands.length) {
        res = await api.delete('/brands/all')
          .catch(() => api.post('/brands/delete-all'));
      } else {
        res = await api.post('/brands/delete-batch', { ids: selectedIds })
          .catch(() => api.delete('/brands/delete-batch', { data: { ids: selectedIds } }));
      }

      if (res && res.data && res.data.success !== false) {
        const deletedCount = res.data.data?.deletedCount ?? res.data.deletedCount ?? count;
        const strSelected = selectedIds.map(String);
        setBrands(prev => prev.filter(b => !strSelected.includes(String(b.id))));
        setSelectedIds([]);
        setIsAllDatasetSelected(false);
        try { localStorage.removeItem('karviyam_admin_brands'); } catch (e) {}
        window.dispatchEvent(new Event('karviyam_categories_updated'));
        toast.success(`Successfully deleted ${deletedCount} selected brands.`, { id: 'brand-batch-toast' });
        await fetchBrands();
      } else {
        throw new Error(res?.data?.message || 'Failed to delete selected brands');
      }
    } catch (e) {
      console.error('[BatchDeleteBrands Error]:', e);
      const errorMsg = e.response?.data?.message || e.message || 'Unable to delete brands. No changes were made.';
      toast.error(errorMsg, { id: 'brand-batch-toast' });
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleConfirmClearAllBrands = async () => {
    setClearAllLoading(true);
    toast.loading('Purging all brand records...', { id: 'brand-toast' });
    try {
      const res = await api.delete('/brands/all')
        .catch(() => api.post('/brands/delete-all'));

      if (res && res.data && res.data.success !== false) {
        const deletedCount = res.data.data?.deletedCount ?? res.data.deletedCount ?? brands.length;
        setBrands([]);
        setSelectedIds([]);
        setIsAllDatasetSelected(false);
        try { localStorage.removeItem('karviyam_admin_brands'); } catch (e) {}
        window.dispatchEvent(new Event('karviyam_categories_updated'));
        toast.success(`Successfully deleted ${deletedCount} brands.`, { id: 'brand-toast' });
        setClearAllModalOpen(false);
        await fetchBrands();
      } else {
        throw new Error(res?.data?.message || 'Clear All brands failed');
      }
    } catch (err) {
      console.error('[ClearAllBrands Error]:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Unable to clear brands. No changes were made.';
      toast.error(errorMsg, { id: 'brand-toast' });
    } finally {
      setClearAllLoading(false);
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-xl sm:text-2xl text-slate-900 tracking-tight">Brand Management</h1>
          <p className="text-xs text-slate-500 font-medium">Manage store brands & manufacturer labels</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setClearAllModalOpen(true)}
            className="flex items-center gap-2 bg-rose-700 hover:bg-rose-800 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-white" />
            <span>Clear All Data</span>
          </button>
          <ExportDropdown
            filename="brands_report"
            title="Brands Management Report"
            headers={BRAND_EXPORT_HEADERS}
            data={brands}
          />
        </div>
      </div>

      {/* Add Brand Form with Image Upload */}
      <form onSubmit={handleAddBrand} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 max-w-2xl">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <input
            type="text"
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            placeholder="New Brand Name *"
            required
            className="flex-1 w-full bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs rounded-xl outline-none focus:border-[#B71C1C]"
          />

          {/* Upload Image Button & Preview */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {newBrandLogo ? (
              <div className="relative flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <img src={newBrandLogo} alt="Logo Preview" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">Logo Ready</span>
                <button
                  type="button"
                  onClick={() => setNewBrandLogo('')}
                  className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-red-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Upload Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            )}

            <button
              type="submit"
              className="bg-[#B71C1C] hover:bg-[#900C0C] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Brand</span>
            </button>
          </div>
        </div>
      </form>

      {/* Brands List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
            <tr>
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={brands.length > 0 && selectedIds.length === brands.length}
                  onChange={() => toggleSelectAllPage(brands)}
                  className="w-4 h-4 rounded border-slate-300 text-rose-700 focus:ring-rose-500 cursor-pointer"
                />
              </th>
              <th className="p-4">Brand Details</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {brands.map((b) => (
              <tr key={b.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(b.id) ? 'bg-rose-50/40' : ''}`}>
                <td className="p-4 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(b.id)}
                    onChange={() => toggleSelectRow(b.id)}
                    className="w-4 h-4 rounded border-slate-300 text-rose-700 focus:ring-rose-500 cursor-pointer"
                  />
                </td>
                <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                  <img
                    src={resolveImageUrl(b.logoUrl, b.id)}
                    onError={(e) => handleImageError(e, b.id)}
                    alt={b.name}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                  />
                  <span>{b.name}</span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${b.isActive !== false ? 'text-emerald-700 bg-emerald-100' : 'text-slate-600 bg-slate-200'}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {b.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleDeleteBrand(b.id)}
                    className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Standardized Brand Logo Image Cropper Modal */}
      <ImageUploadCropperModal
        isOpen={Boolean(cropperFile)}
        onClose={() => setCropperFile(null)}
        imageFile={cropperFile}
        configType="brandLogo"
        onConfirmCrop={(croppedUrl) => {
          setNewBrandLogo(croppedUrl);
          setCropperFile(null);
        }}
      />
      <ClearAllModal
        isOpen={clearAllModalOpen}
        onClose={() => setClearAllModalOpen(false)}
        moduleName="Brands"
        itemCount={brands.length}
        onConfirm={handleConfirmClearAllBrands}
        loading={clearAllLoading}
      />
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={brands.length}
        isAllDatasetSelected={isAllDatasetSelected}
        onSelectAllDataset={selectFullDataset}
        onDeleteSelected={handleDeleteSelectedBrands}
        onClearSelection={() => {
          setSelectedIds([]);
          setIsAllDatasetSelected(false);
        }}
        moduleName="Brands"
        loading={batchDeleting}
      />

    </div>
  );
}
