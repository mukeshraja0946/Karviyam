import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Upload, AlertCircle, Eye, EyeOff, Film, FileSpreadsheet } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import BulkImportModal from '../components/BulkImportModal';
import ExportDropdown from '../components/ExportDropdown';

const PRODUCT_EXPORT_HEADERS = [
  { label: 'Product Name', accessor: 'name' },
  { label: 'SKU', accessor: (p) => p.sku || `KV-SKU-${p.id}` },
  { label: 'Category', accessor: 'categoryName' },
  { label: 'Brand', accessor: 'brand' },
  { label: 'Price (₹)', accessor: 'price' },
  { label: 'Stock Quantity', accessor: 'stockQuantity' },
  { label: 'Status', accessor: (p) => p.isActive !== false ? 'Active' : 'Inactive' }
];
const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.75) => {
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
        if (width > 800) {
          height = Math.round((height * 800) / width);
          width = 800;
        }
      } else {
        if (height > 800) {
          width = Math.round((width * 800) / height);
          height = 800;
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

export default function AdminProductsPage() {
  const [maxImagesLimit, setMaxImagesLimit] = useState(() => {
    const saved = localStorage.getItem('karviyam_max_product_images');
    return saved ? parseInt(saved, 10) : 6;
  });

  const [products, setProducts] = useState([]);
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedSkus, setSelectedSkus] = useState([]);

  const handleBulkDeleteSelected = async () => {
    if (!selectedSkus.length) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedSkus.length} selected product(s)?`)) return;

    try {
      await api.post('/products/bulk-delete', selectedSkus);
      setProducts(prev => {
        const updated = prev.filter(p => !selectedSkus.includes(p.sku || p.id));
        localStorage.setItem('karviyam_admin_products', JSON.stringify(updated));
        return updated;
      });
      toast.success(`Deleted ${selectedSkus.length} product(s) successfully!`);
      setSelectedSkus([]);
    } catch (e) {
      toast.error('Bulk delete failed');
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    subcategoryId: '',
    brandId: '',
    brand: 'Karviyam',
    price: '',
    oldPrice: '',
    costPrice: '',
    discountPercentage: '',
    stockQuantity: '20',
    type: 'WOMEN',
    gender: 'Unisex',
    description: '',
    videoUrl: '',
    color: '',
    size: '',
    material: '',
    fabric: '',
    weight: '',
    tags: '',
    isFeatured: false,
    isTrending: false,
    isBestSeller: false,
    isNewArrival: false,
    isActive: true,
    images: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        api.get('/products?size=200&includeInactive=true'),
        api.get('/categories/tree'),
        api.get('/brands')
      ]);

      const prodData = prodRes.data?.data || prodRes.data || prodRes;
      if (prodData) {
        setProducts(prodData.content || (Array.isArray(prodData) ? prodData : []));
      }

      const catData = catRes.data?.data || catRes.data || catRes;
      if (catData) {
        setCategoriesTree(Array.isArray(catData) ? catData : (catData.data || []));
      }

      const brandData = brandRes.data?.data || brandRes.data || brandRes;
      if (brandData) {
        setBrands(Array.isArray(brandData) ? brandData : (brandData.data || []));
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    const defaultCat = categoriesTree[0]?.id || '';
    setFormData({
      name: '',
      sku: `KV-PRD-${Math.floor(100 + Math.random() * 900)}`,
      barcode: '',
      categoryId: defaultCat,
      subcategoryId: '',
      brandId: '',
      brand: 'Karviyam',
      price: '',
      oldPrice: '',
      costPrice: '',
      discountPercentage: '',
      stockQuantity: '20',
      type: 'WOMEN',
      gender: 'Unisex',
      description: '',
      videoUrl: '',
      color: 'Crimson Red',
      size: '',
      material: '',
      fabric: '',
      weight: '',
      tags: '',
      isFeatured: false,
      isTrending: false,
      isBestSeller: false,
      isNewArrival: false,
      isActive: true,
      images: [],
      colorVariants: [
        { colorName: 'Crimson Red', colorCode: '#B71C1C', isDefault: true, imageUrls: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'] },
        { colorName: 'Obsidian Black', colorCode: '#000000', isDefault: false, imageUrls: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'] }
      ]
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingProduct(p);

    let parsedVariants = [];
    if (Array.isArray(p.colorVariants) && p.colorVariants.length > 0) {
      parsedVariants = p.colorVariants.map(cv => ({
        colorName: cv.colorName,
        colorCode: cv.colorCode || '#000000',
        isDefault: !!cv.isDefault,
        imageUrls: Array.isArray(cv.images) ? cv.images.map(i => typeof i === 'string' ? i : i.imageUrl) : [p.imageUrl || '']
      }));
    } else if (p.colorVariantImages) {
      try {
        const map = typeof p.colorVariantImages === 'string' ? JSON.parse(p.colorVariantImages) : p.colorVariantImages;
        Object.keys(map).forEach((cName, idx) => {
          parsedVariants.push({
            colorName: cName,
            colorCode: cName.toLowerCase().includes('black') ? '#000000' : (cName.toLowerCase().includes('white') ? '#FFFFFF' : '#B71C1C'),
            isDefault: idx === 0,
            imageUrls: map[cName] || [p.imageUrl || '']
          });
        });
      } catch (e) {}
    }

    if (parsedVariants.length === 0) {
      parsedVariants = [
        { colorName: p.color || 'Standard', colorCode: '#B71C1C', isDefault: true, imageUrls: [p.imageUrl || ''] }
      ];
    }

    setFormData({
      name: p.name || '',
      sku: p.sku || '',
      barcode: p.barcode || '',
      categoryId: p.categoryId || '',
      subcategoryId: p.subcategoryId || '',
      brandId: p.brandId || '',
      brand: p.brand || 'Karviyam',
      price: p.price || '',
      oldPrice: p.oldPrice || '',
      costPrice: p.costPrice || '',
      discountPercentage: p.discountPercentage || '',
      stockQuantity: p.stockQuantity != null ? p.stockQuantity.toString() : '0',
      type: p.type || 'Clothing',
      gender: p.gender || 'Unisex',
      description: p.description || '',
      videoUrl: p.videoUrl || '',
      color: p.color || parsedVariants[0]?.colorName || '',
      size: p.size || '',
      material: p.material || '',
      fabric: p.fabric || '',
      weight: p.weight || '',
      tags: p.tags || '',
      isFeatured: !!p.isFeatured,
      isTrending: !!p.isTrending,
      isBestSeller: !!p.isBestSeller,
      isNewArrival: !!p.isNewArrival,
      isActive: p.isActive !== false,
      images: p.images || (p.imageUrl ? [p.imageUrl] : []),
      colorVariants: parsedVariants,
    });
    setModalOpen(true);
  };

  const handleMultipleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (formData.images.length + files.length > maxImagesLimit) {
      toast.error(`Maximum limit is ${maxImagesLimit} images per product.`);
      return;
    }

    const processors = files.map(file => compressImage(file));

    Promise.all(processors).then(newImageUrls => {
      const validUrls = newImageUrls.filter(Boolean);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...validUrls]
      }));
      toast.success(`${validUrls.length} image(s) added and optimized!`);
    });
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Product title is required');
      return;
    }
    if (!formData.price) {
      toast.error('Product price is required');
      return;
    }

    const qty = parseInt(formData.stockQuantity, 10) || 0;

    const compressedImages = await Promise.all(
      (formData.images || []).map(url => compressBase64Url(url))
    );

    // Build colorVariantImages map for MySQL LONGTEXT field & Storefront compatibility
    const colorVariantImagesMap = {};
    (formData.colorVariants || []).forEach(v => {
      if (v.colorName) {
        colorVariantImagesMap[v.colorName] = (v.imageUrls || []).filter(Boolean);
      }
    });

    const defaultVar = (formData.colorVariants || []).find(v => v.isDefault) || (formData.colorVariants || [])[0];

    const payload = {
      ...formData,
      color: defaultVar ? defaultVar.colorName : formData.color,
      colorVariantImages: JSON.stringify(colorVariantImagesMap),
      images: compressedImages,
      price: parseFloat(formData.price),
      oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
      discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : null,
      stockQuantity: qty,
      categoryId: formData.categoryId ? parseInt(formData.categoryId, 10) : null,
      subcategoryId: formData.subcategoryId ? parseInt(formData.subcategoryId, 10) : null,
      brandId: formData.brandId ? parseInt(formData.brandId, 10) : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      imageUrl: (defaultVar && defaultVar.imageUrls && defaultVar.imageUrls[0]) || compressedImages[0] || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
    };

    try {
      if (editingProduct) {
        const res = await api.put(`/admin/products/${editingProduct.id}`, payload);
        const apiData = res.data ? res.data : res;
        if (apiData) {
          toast.success('Product updated successfully!');
          fetchData();
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/admin/products', payload);
        const apiData = res.data ? res.data : res;
        if (apiData) {
          toast.success('New product added to catalog!');
          fetchData();
          setModalOpen(false);
        }
      }
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to save product';
      toast.error(msg);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await api.delete(`/admin/products/${id}`);
      const apiData = res.data ? res.data : res;
      if (apiData) {
        toast.success('Product removed from catalog');
        fetchData();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete product');
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedCategoryObj = categoriesTree.find(c => c.id == formData.categoryId);
  const availableSubcategories = selectedCategoryObj?.children || [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Product Catalog Management</h1>
          <p className="text-xs text-slate-500">Manage products, variants, brands, stock, prices, and catalog status</p>
        </div>

        <div className="flex items-center gap-2">
          {selectedSkus && selectedSkus.length > 0 && (
            <button
              onClick={handleBulkDeleteSelected}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer animate-in fade-in duration-150"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected ({selectedSkus.length})</span>
            </button>
          )}

          <ExportDropdown
            filename="products_catalog"
            title="Product Catalog Report"
            headers={PRODUCT_EXPORT_HEADERS}
            data={selectedSkus.length > 0 ? filtered.filter(p => selectedSkus.includes(p.sku || p.id)) : filtered}
          />
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Bulk Import / Export</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title, SKU, brand..."
            className="w-full bg-slate-50 border border-slate-200 text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-[#B71C1C]"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600">{filtered.length} Products Found</span>
          {selectedSkus.length > 0 && (
            <span className="text-xs font-extrabold text-[#B71C1C] bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
              {selectedSkus.length} Selected
            </span>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">SKU / Barcode</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price / MRP</th>
              <th className="p-4 text-center">Stock</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={p.images?.[0] || p.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 line-clamp-1">{p.name}</p>
                      <span className="text-[10px] text-slate-400 font-semibold">{p.brand || 'Karviyam'}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-slate-600">
                  <p className="font-semibold">{p.sku || '-'}</p>
                  <p className="text-[10px] text-slate-400">{p.barcode || ''}</p>
                </td>
                <td className="p-4">
                  <p className="font-bold text-slate-700">{p.categoryName || '-'}</p>
                  {p.subcategoryName && <p className="text-[10px] text-slate-500">{p.subcategoryName}</p>}
                </td>
                <td className="p-4 font-bold text-[#B71C1C]">
                  ₹{p.price}
                  {p.oldPrice && <span className="text-[10px] text-slate-400 line-through block">₹{p.oldPrice}</span>}
                </td>
                <td className="p-4 text-center font-bold text-slate-800">{p.stockQuantity} Units</td>
                <td className="p-4 text-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {p.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right space-x-1">
                  <button
                    onClick={() => handleOpenEditModal(p)}
                    className="p-2 text-slate-500 hover:text-[#B71C1C] rounded-lg hover:bg-red-50"
                    title="Edit Product"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900">{editingProduct ? 'Edit Product Details' : 'Add New Product'}</h3>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-[#B71C1C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Main Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, subcategoryId: '' })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                  >
                    <option value="">Select Category</option>
                    {categoriesTree.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subcategory</label>
                  <select
                    value={formData.subcategoryId}
                    onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                  >
                    <option value="">Select Subcategory</option>
                    {availableSubcategories.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand</label>
                  <select
                    value={formData.brandId}
                    onChange={(e) => {
                      const bObj = brands.find(b => b.id == e.target.value);
                      setFormData({ ...formData, brandId: e.target.value, brand: bObj ? bObj.name : formData.brand });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    value={formData.oldPrice}
                    onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Product Color Variants & Galleries Management Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Product Color Variants & Separate Image Galleries
                    </label>
                    <p className="text-[10px] text-slate-500">Configure unlimited colors with color pickers & dedicated photo galleries</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newVar = {
                        colorName: `Color ${(formData.colorVariants || []).length + 1}`,
                        colorCode: '#000000',
                        isDefault: (formData.colorVariants || []).length === 0,
                        imageUrls: ['']
                      };
                      setFormData({ ...formData, colorVariants: [...(formData.colorVariants || []), newVar] });
                    }}
                    className="text-[11px] font-extrabold text-[#B71C1C] hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 cursor-pointer transition-all shrink-0"
                  >
                    + Add Color Variant
                  </button>
                </div>

                <div className="space-y-3">
                  {(formData.colorVariants || []).map((variant, vIdx) => (
                    <div key={vIdx} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Color Name */}
                        <div className="flex-1 min-w-[120px]">
                          <label className="block font-bold text-slate-700 text-[10px] mb-1">Color Name</label>
                          <input
                            type="text"
                            value={variant.colorName}
                            onChange={(e) => {
                              const updated = [...formData.colorVariants];
                              updated[vIdx].colorName = e.target.value;
                              setFormData({ ...formData, colorVariants: updated });
                            }}
                            placeholder="e.g. Obsidian Black"
                            className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg font-bold text-xs"
                          />
                        </div>

                        {/* Color Code Picker */}
                        <div>
                          <label className="block font-bold text-slate-700 text-[10px] mb-1">Color Picker</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={variant.colorCode || '#000000'}
                              onChange={(e) => {
                                const updated = [...formData.colorVariants];
                                updated[vIdx].colorCode = e.target.value;
                                setFormData({ ...formData, colorVariants: updated });
                              }}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0"
                            />
                            <input
                              type="text"
                              value={variant.colorCode || '#000000'}
                              onChange={(e) => {
                                const updated = [...formData.colorVariants];
                                updated[vIdx].colorCode = e.target.value;
                                setFormData({ ...formData, colorVariants: updated });
                              }}
                              className="w-20 bg-slate-50 border border-slate-200 p-2 rounded-lg font-mono font-bold text-xs"
                            />
                          </div>
                        </div>

                        {/* Default Color Radio */}
                        <div className="flex items-center gap-1.5 pt-4">
                          <input
                            type="radio"
                            name="defaultColorVariant"
                            id={`default-color-${vIdx}`}
                            checked={!!variant.isDefault}
                            onChange={() => {
                              const updated = formData.colorVariants.map((v, i) => ({
                                ...v,
                                isDefault: i === vIdx
                              }));
                              setFormData({ ...formData, colorVariants: updated });
                            }}
                            className="w-4 h-4 accent-[#B71C1C] cursor-pointer"
                          />
                          <label htmlFor={`default-color-${vIdx}`} className="font-bold text-slate-700 text-[11px] cursor-pointer">
                            Default Color
                          </label>
                        </div>

                        {/* Delete Color Variant Button */}
                        {formData.colorVariants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.colorVariants.filter((_, i) => i !== vIdx);
                              if (variant.isDefault && updated.length > 0) updated[0].isDefault = true;
                              setFormData({ ...formData, colorVariants: updated });
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg ml-auto cursor-pointer"
                            title="Remove Color Variant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Separate Image Gallery Box for this Color */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="block font-bold text-slate-700 text-[10px]">
                            {variant.colorName || 'Color'} Image Gallery ({variant.imageUrls.length})
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...formData.colorVariants];
                              updated[vIdx].imageUrls.push('');
                              setFormData({ ...formData, colorVariants: updated });
                            }}
                            className="text-[10px] font-bold text-slate-600 hover:text-[#B71C1C] cursor-pointer"
                          >
                            + Add Image URL
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {variant.imageUrls.map((imgUrl, imgIdx) => (
                            <div key={imgIdx} className="flex items-center gap-2">
                              <input
                                type="url"
                                value={imgUrl}
                                onChange={(e) => {
                                  const updated = [...formData.colorVariants];
                                  updated[vIdx].imageUrls[imgIdx] = e.target.value;
                                  setFormData({ ...formData, colorVariants: updated });
                                }}
                                placeholder={`Image URL ${imgIdx + 1} for ${variant.colorName}`}
                                className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                              />
                              {variant.imageUrls.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...formData.colorVariants];
                                    updated[vIdx].imageUrls = updated[vIdx].imageUrls.filter((_, i) => i !== imgIdx);
                                    setFormData({ ...formData, colorVariants: updated });
                                  }}
                                  className="text-red-500 p-1 hover:bg-red-50 rounded cursor-pointer"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Available Sizes</label>
                  <input type="text" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none" placeholder="S, M, L, XL, Free Size..." />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Material / Fabric</label>
                  <input type="text" value={formData.material} onChange={(e) => setFormData({ ...formData, material: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none" placeholder="Silk, Cotton, Brass..." />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Video URL (Optional)</label>
                <input type="text" value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none" placeholder="https://..." />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tags (Comma Separated)</label>
                <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none" placeholder="saree, festive, silk, designer" />
              </div>

              {/* Badges Toggles */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} className="accent-[#B71C1C]" />
                  <span>Featured Product</span>
                </label>
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={formData.isTrending} onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })} className="accent-[#B71C1C]" />
                  <span>Trending Product</span>
                </label>
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={formData.isBestSeller} onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })} className="accent-[#B71C1C]" />
                  <span>Best Seller</span>
                </label>
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={formData.isNewArrival} onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })} className="accent-[#B71C1C]" />
                  <span>New Arrival</span>
                </label>
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="accent-[#B71C1C]" />
                  <span>Active Catalog Status</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed product description..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold py-3.5 rounded-xl shadow-md uppercase tracking-wider cursor-pointer"
              >
                {editingProduct ? 'Update Product' : 'Save Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Product Import Modal */}
      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        type="products"
        onImportSuccess={fetchData}
      />

    </div>
  );
}


