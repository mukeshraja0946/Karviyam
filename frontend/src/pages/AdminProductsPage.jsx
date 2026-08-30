import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Upload, AlertCircle, Eye, EyeOff, Film, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import api from '../utils/api';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';
import toast from 'react-hot-toast';
import BulkImportModal from '../components/BulkImportModal';
import ExportDropdown from '../components/ExportDropdown';
import ExportPreviewModal from '../components/ExportPreviewModal';
import ImageUploadCropperModal from '../components/ImageUploadCropperModal';
import ClearAllModal from '../components/ClearAllModal';
import BulkActionBar from '../components/BulkActionBar';

const PRODUCT_EXPORT_HEADERS = [
  { label: 'Product Image', accessor: (p) => p.imageUrl || (Array.isArray(p.images) && p.images[0]) || p.image || '' },
  { label: 'SKU Code', accessor: (p) => p.sku || `KV-SKU-${p.id}` },
  { label: 'Product Name', accessor: 'name' },
  { label: 'Category', accessor: (p) => p.categoryName || p.category_name || 'Apparel' },
  { label: 'Brand', accessor: (p) => p.brand || 'Karviyam' },
  { label: 'Selling Price (₹)', accessor: 'price' },
  { label: 'MRP Price (₹)', accessor: (p) => p.oldPrice || p.old_price || p.price },
  { label: 'Stock Quantity', accessor: (p) => `${p.stockQuantity || p.stock_quantity || 0} Units` },
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
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportActiveTab, setExportActiveTab] = useState('pdf');
  const [maxImagesLimit, setMaxImagesLimit] = useState(() => {
    const saved = localStorage.getItem('karviyam_max_product_images');
    return saved ? parseInt(saved, 10) : 6;
  });

  const [products, setProducts] = useState([]);
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const DEFAULT_CATEGORIES = React.useMemo(() => [
    { id: 1, name: 'WOMEN', type: 'WOMEN', subcategories: [{ id: 6, name: 'Sarees' }, { id: 7, name: 'Lehengas' }, { id: 8, name: 'Salwar Suits' }] },
    { id: 2, name: 'MEN', type: 'MEN', subcategories: [{ id: 9, name: 'Kurtas & Pyjamas' }, { id: 10, name: 'Sherwanis' }, { id: 11, name: 'Shirts & Trousers' }] },
    { id: 3, name: 'KIDS & BABY', type: 'KIDS & BABY', subcategories: [{ id: 12, name: 'Boys Ethnic' }, { id: 13, name: 'Girls Dresses' }] },
    { id: 4, name: 'ACCESSORIES', type: 'ACCESSORIES', subcategories: [{ id: 14, name: 'Jewellery' }, { id: 15, name: 'Bags & Clutches' }] },
    { id: 5, name: 'KITCHEN & HOME', type: 'KITCHEN & HOME', subcategories: [{ id: 16, name: 'Traditional Cookware' }, { id: 17, name: 'Home Decor' }] }
  ], []);

  const allCategories = React.useMemo(() => {
    if (Array.isArray(categoriesTree) && categoriesTree.length > 0) {
      return categoriesTree;
    }
    try {
      const saved = localStorage.getItem('karviyam_admin_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_CATEGORIES;
  }, [categoriesTree, DEFAULT_CATEGORIES]);

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedSkus, setSelectedSkus] = useState([]);
  const [cropperState, setCropperState] = useState(null); // { file, vIdx, imgIdx }

  const handleUploadVariantImage = (file, vIdx, imgType = 'main', subIdx = null) => {
    if (!file) return;
    if (typeof file === 'string') {
      setCropperState({ file, vIdx, imgType, subIdx });
      return;
    }
    if (!file.type || !file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }
    setCropperState({ file, vIdx, imgType, subIdx });
  };

  const handleMultipleVariantSubFiles = (e, vIdx) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter(f => f.type && f.type.startsWith('image/'));
    if (!validFiles.length) {
      toast.error('Please select valid image files (PNG, JPG, WEBP)');
      return;
    }

    const currentSubs = formData.colorVariants?.[vIdx]?.subImages || [];
    if (currentSubs.length >= 6) {
      toast.error('Maximum 6 sub images allowed.');
      return;
    }

    // Open cropper for sub image file upload
    setCropperState({
      file: validFiles[0],
      vIdx,
      imgType: 'sub',
      subIdx: null
    });
    e.target.value = '';
  };

  const handleUploadVariantVideo = async (file, vIdx) => {
    if (!file) return;
    if (!file.type || (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|ogg|m4v|avi)$/i))) {
      toast.error('Please select a valid video file (MP4, WEBM, MOV)');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video file size exceeds 100MB limit');
      return;
    }

    const toastId = toast.loading('Uploading video file...');
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const apiData = res.data?.data || res.data || res;
      const vUrl = apiData.url || apiData.fileUrl || (apiData.filename ? `/uploads/${apiData.filename}` : '');

      if (vUrl) {
        setFormData(prev => {
          const updated = [...(prev.colorVariants || [])];
          if (updated[vIdx]) {
            updated[vIdx].videoUrl = vUrl;
          }
          return { ...prev, colorVariants: updated, videoUrl: vUrl };
        });
        toast.success('Product video uploaded successfully!', { id: toastId });
      } else {
        throw new Error('Upload response did not return a valid video URL');
      }
    } catch (err) {
      console.error('Video Upload Error:', err);
      toast.error(err.response?.data?.message || 'Video upload failed', { id: toastId });
    }
  };

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
      setSelectedIds(currentFiltered.map(p => p.id));
      setIsAllDatasetSelected(false);
    }
  };

  const selectFullDataset = () => {
    setSelectedIds(products.map(p => p.id));
    setIsAllDatasetSelected(true);
    toast.success(`Selected all ${products.length} products in the dataset!`);
  };

  const handleDeleteSelectedProducts = async () => {
    if (selectedIds.length === 0) return;
    setBatchDeleting(true);
    const count = selectedIds.length;
    toast.loading(`Deleting ${count} selected products...`, { id: 'prd-batch-toast' });
    try {
      let res;
      if (isAllDatasetSelected || selectedIds.length >= products.length) {
        res = await api.delete('/admin/products/all')
          .catch(() => api.delete('/products/all'))
          .catch(() => api.post('/admin/products/delete-all'));
      } else {
        res = await api.post('/admin/products/delete-batch', { ids: selectedIds })
          .catch(() => api.post('/products/delete-batch', { ids: selectedIds }));
      }

      if (res && res.data && res.data.success !== false) {
        const deletedCount = res.data.data?.deletedCount ?? res.data.deletedCount ?? count;
        const strSelected = selectedIds.map(String);
        setProducts(prev => prev.filter(p => !strSelected.includes(String(p.id))));
        setSelectedIds([]);
        setIsAllDatasetSelected(false);
        try { localStorage.removeItem('karviyam_admin_products'); } catch (e) {}
        window.dispatchEvent(new Event('karviyam_products_updated'));
        toast.success(`Successfully deleted ${deletedCount} selected products.`, { id: 'prd-batch-toast' });
        await fetchProducts();
      } else {
        throw new Error(res?.data?.message || 'Failed to delete selected products');
      }
    } catch (e) {
      console.error('[BatchDeleteProducts Error]:', e);
      const errorMsg = e.response?.data?.message || e.message || 'Unable to delete products. No changes were made.';
      toast.error(errorMsg, { id: 'prd-batch-toast' });
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleConfirmClearAllProducts = async () => {
    setClearAllLoading(true);
    toast.loading('Purging all product catalog records...', { id: 'prd-del-all-toast' });
    try {
      const res = await api.delete('/admin/products/all')
        .catch(() => api.delete('/products/all'))
        .catch(() => api.post('/admin/products/delete-all'));

      if (res && res.data && res.data.success !== false) {
        const deletedCount = res.data.data?.deletedCount ?? res.data.deletedCount ?? products.length;
        setProducts([]);
        setSelectedIds([]);
        setIsAllDatasetSelected(false);
        try { localStorage.removeItem('karviyam_admin_products'); } catch (e) {}
        window.dispatchEvent(new Event('karviyam_products_updated'));
        toast.success(`Successfully deleted ${deletedCount} products.`, { id: 'prd-del-all-toast' });
        setClearAllModalOpen(false);
        await fetchProducts();
      } else {
        throw new Error(res?.data?.message || 'Clear All products failed');
      }
    } catch (e) {
      console.error('[ClearAllProducts Error]:', e);
      const errorMsg = e.response?.data?.message || e.message || 'Unable to clear products. No changes were made.';
      toast.error(errorMsg, { id: 'prd-del-all-toast' });
    } finally {
      setClearAllLoading(false);
    }
  };

  const DEFAULT_BRANDS = React.useMemo(() => [
    { id: 1, name: 'Karviyam', slug: 'karviyam' },
    { id: 2, name: 'Zara', slug: 'zara' },
    { id: 3, name: 'H&M', slug: 'hm' },
    { id: 4, name: 'Nike', slug: 'nike' },
    { id: 5, name: 'Adidas', slug: 'adidas' },
    { id: 6, name: 'Raymond', slug: 'raymond' },
    { id: 7, name: 'Manyavar', slug: 'manyavar' }
  ], []);

  const allBrands = React.useMemo(() => {
    if (Array.isArray(brands) && brands.length > 0) {
      return brands;
    }
    try {
      const saved = localStorage.getItem('karviyam_admin_brands');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_BRANDS;
  }, [brands, DEFAULT_BRANDS]);

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

  const availableSubcategories = React.useMemo(() => {
    if (!formData.categoryId) return [];

    const parentCat = allCategories.find(c => 
      String(c.id) === String(formData.categoryId) ||
      c.name?.toLowerCase() === String(formData.categoryId).toLowerCase()
    );

    if (parentCat && Array.isArray(parentCat.subcategories) && parentCat.subcategories.length > 0) {
      return parentCat.subcategories;
    }

    const childSubcats = allCategories.filter(c => 
      c.parentId && (String(c.parentId) === String(formData.categoryId) || String(c.parentId) === String(parentCat?.id))
    );
    if (childSubcats.length > 0) return childSubcats;

    return [
      { id: 'sub-1', name: 'General Subcategory' },
      { id: 'sub-2', name: 'Premium Edition' },
      { id: 'sub-3', name: 'Standard Collection' },
      { id: 'sub-4', name: 'Special Collection' }
    ];
  }, [formData.categoryId, allCategories]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        api.get('/products?size=200&includeInactive=true').catch(() => api.get('/admin/products')),
        api.get('/categories/tree').catch(() => api.get('/categories')),
        api.get('/brands')
      ]);

      const prodData = prodRes.data?.data || prodRes.data || prodRes;
      const list = prodData.content || (Array.isArray(prodData) ? prodData : []);

      if (Array.isArray(list)) {
        setProducts(list);
        if (list.length > 0) {
          try { localStorage.setItem('karviyam_admin_products', JSON.stringify(list)); } catch (e) {}
        } else {
          try { localStorage.removeItem('karviyam_admin_products'); } catch (e) {}
        }
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
        {
          colorName: 'Emerald Green',
          colorCode: '#B71C1C',
          isDefault: true,
          mainImage: '',
          subImages: [],
          videoUrl: '',
          imageUrls: []
        }
      ]
    });
    setModalOpen(true);
  };

  const populateFormWithProduct = (p) => {
    setEditingProduct(p);

    let parsedVariants = [];
    const variantsArray = (Array.isArray(p.colorVariants) && p.colorVariants.length > 0)
      ? p.colorVariants
      : ((Array.isArray(p.colors) && p.colors.length > 0)
        ? p.colors
        : ((Array.isArray(p.color_variants) && p.color_variants.length > 0) ? p.color_variants : []));

    if (variantsArray.length > 0) {
      parsedVariants = variantsArray.map(cv => {
        const rawImgs = Array.isArray(cv.imageUrls)
          ? cv.imageUrls
          : (Array.isArray(cv.images) ? cv.images.map(i => typeof i === 'string' ? i : i.imageUrl) : []);
        const mainImg = cv.mainImage || rawImgs[0] || (p.imageUrl || '');
        const subImgs = Array.isArray(cv.subImages)
          ? cv.subImages.filter(Boolean)
          : (rawImgs.length > 1 ? rawImgs.slice(1).filter(Boolean) : []);
        const unified = [];
        if (mainImg) unified.push(mainImg);
        subImgs.forEach(s => { if (s && !unified.includes(s)) unified.push(s); });

        return {
          colorName: cv.colorName || cv.name || 'Standard',
          colorCode: cv.colorCode || cv.hexCode || '#B71C1C',
          isDefault: !!cv.isDefault,
          mainImage: mainImg,
          subImages: subImgs,
          videoUrl: cv.videoUrl || p.videoUrl || '',
          imageUrls: unified
        };
      });
    } else if (p.colorVariantImages || p.color_variant_images) {
      try {
        const rawMap = p.colorVariantImages || p.color_variant_images;
        const map = typeof rawMap === 'string' ? JSON.parse(rawMap) : rawMap;
        Object.keys(map).forEach((cName, idx) => {
          const val = map[cName];
          let mainImg = '';
          let subImgs = [];
          let vUrl = p.videoUrl || '';
          if (Array.isArray(val)) {
            mainImg = val[0] || '';
            subImgs = val.slice(1);
          } else if (val && typeof val === 'object') {
            const raw = Array.isArray(val.imageUrls) ? val.imageUrls.filter(Boolean) : [];
            mainImg = val.mainImage || raw[0] || '';
            subImgs = Array.isArray(val.subImages)
              ? val.subImages.filter(Boolean)
              : (raw.length > 1 ? raw.slice(1).filter(Boolean) : []);
            vUrl = val.videoUrl || p.videoUrl || '';
          }
          const unified = [];
          if (mainImg) unified.push(mainImg);
          subImgs.forEach(s => { if (s && !unified.includes(s)) unified.push(s); });

          parsedVariants.push({
            colorName: cName,
            colorCode: cName.toLowerCase().includes('black') ? '#000000' : (cName.toLowerCase().includes('white') ? '#FFFFFF' : '#B71C1C'),
            isDefault: idx === 0,
            mainImage: mainImg,
            subImages: subImgs,
            videoUrl: vUrl,
            imageUrls: unified
          });
        });
      } catch (e) {}
    }

    if (parsedVariants.length === 0) {
      const mainImg = p.imageUrl || '';
      parsedVariants = [
        {
          colorName: p.color || 'Standard',
          colorCode: '#B71C1C',
          isDefault: true,
          mainImage: mainImg,
          subImages: [],
          videoUrl: p.videoUrl || '',
          imageUrls: mainImg ? [mainImg] : []
        }
      ];
    }

    // Resolve Category ID
    let catId = p.categoryId || p.category_id || '';
    if (!catId && (p.categoryName || p.type)) {
      const catMatch = allCategories.find(c => 
        (p.categoryName && c.name?.toLowerCase() === p.categoryName?.toLowerCase()) ||
        (p.type && (c.name?.toLowerCase() === p.type?.toLowerCase() || c.type?.toLowerCase() === p.type?.toLowerCase()))
      );
      if (catMatch) catId = catMatch.id;
    }

    // Resolve Subcategory ID
    let subcatId = p.subcategoryId || p.subcategory_id || '';
    if (!subcatId && p.subcategoryName) {
      const parentCat = allCategories.find(c => String(c.id) === String(catId));
      if (parentCat && Array.isArray(parentCat.subcategories)) {
        const subMatch = parentCat.subcategories.find(s => s.name?.toLowerCase() === p.subcategoryName?.toLowerCase());
        if (subMatch) subcatId = subMatch.id;
      }
    }

    // Resolve Brand ID & Name
    let bId = p.brandId || p.brand_id || '';
    let bName = p.brand || 'Karviyam';
    if (!bId && bName) {
      const brandMatch = allBrands.find(b => b.name?.toLowerCase() === bName?.toLowerCase());
      if (brandMatch) bId = brandMatch.id;
    } else if (bId && !bName) {
      const brandMatch = allBrands.find(b => String(b.id) === String(bId));
      if (brandMatch) bName = brandMatch.name;
    }

    setFormData({
      name: p.name || '',
      sku: p.sku || '',
      barcode: p.barcode || '',
      categoryId: catId,
      subcategoryId: subcatId,
      brandId: bId,
      brand: bName,
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
  };

  const handleOpenEditModal = async (p) => {
    populateFormWithProduct(p);
    setModalOpen(true);

    try {
      const res = await api.get(`/products/${p.id}`);
      const freshProd = res.data?.data || res.data;
      if (freshProd && (freshProd.id || freshProd.name)) {
        populateFormWithProduct(freshProd);
      }
    } catch (eFresh) {}
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

  const [submitting, setSubmitting] = useState(false);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.name.trim()) {
      toast.error('Product title is required');
      return;
    }
    if (!formData.price) {
      toast.error('Product price is required');
      return;
    }

    setSubmitting(true);
    toast.loading(editingProduct ? 'Updating product details...' : 'Adding new product to catalog...', { id: 'prod-save-toast' });

    try {
      const qty = parseInt(formData.stockQuantity, 10) || 0;

      const compressedImages = await Promise.all(
        (formData.images || []).map(url => compressBase64Url(url))
      );

      // Build colorVariantImages map for MySQL LONGTEXT field & Storefront compatibility
      const colorVariantImagesMap = {};
      (formData.colorVariants || []).forEach(v => {
        if (v.colorName) {
          const mainImg = v.mainImage || (v.imageUrls ? v.imageUrls[0] : '');
          const subImgs = Array.isArray(v.subImages)
            ? v.subImages.filter(Boolean)
            : (v.imageUrls ? v.imageUrls.filter(i => i && i !== mainImg) : []);
          const unified = [];
          if (mainImg) unified.push(mainImg);
          subImgs.forEach(s => { if (s && !unified.includes(s)) unified.push(s); });

          colorVariantImagesMap[v.colorName] = {
            colorName: v.colorName,
            colorCode: v.colorCode || '#000000',
            isDefault: !!v.isDefault,
            mainImage: mainImg,
            subImages: subImgs,
            videoUrl: v.videoUrl || '',
            imageUrls: unified
          };
        }
      });

      const defaultVar = (formData.colorVariants || []).find(v => v.isDefault) || (formData.colorVariants || [])[0];

      const selCat = allCategories.find(c => String(c.id) === String(formData.categoryId));
      const selSub = selCat?.subcategories?.find(s => String(s.id) === String(formData.subcategoryId));
      const selBrand = allBrands.find(b => String(b.id) === String(formData.brandId));

      const finalCatId = formData.categoryId ? parseInt(formData.categoryId, 10) : (selCat ? selCat.id : null);
      const finalSubcatId = formData.subcategoryId ? parseInt(formData.subcategoryId, 10) : (selSub ? selSub.id : null);
      const finalBrandId = formData.brandId ? parseInt(formData.brandId, 10) : (selBrand ? selBrand.id : null);
      const finalBrandName = selBrand ? selBrand.name : (formData.brand || 'Karviyam');
      const finalCatName = selCat ? selCat.name : (formData.categoryName || formData.type || 'Clothing');
      const finalSubcatName = selSub ? selSub.name : formData.subcategoryName;

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
        categoryId: finalCatId,
        category_id: finalCatId,
        categoryName: finalCatName,
        subcategoryId: finalSubcatId,
        subcategory_id: finalSubcatId,
        subcategoryName: finalSubcatName,
        brandId: finalBrandId,
        brand_id: finalBrandId,
        brand: finalBrandName,
        type: finalCatName,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        imageUrl: (defaultVar && defaultVar.imageUrls && defaultVar.imageUrls[0]) || compressedImages[0] || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
      };

      if (editingProduct) {
        const res = await api.put(`/admin/products/${editingProduct.id}`, payload)
          .catch(() => api.post(`/admin/products/${editingProduct.id}`, payload))
          .catch(() => api.post(`/products/${editingProduct.id}`, payload));
        const apiData = res.data ? res.data : res;
        if (apiData && apiData.success !== false) {
          toast.success('Product updated successfully!', { id: 'prod-save-toast' });
          const savedItem = apiData.data || apiData;
          setProducts(prev => {
            let updated = [...prev];
            const idx = updated.findIndex(p => String(p.id) === String(editingProduct.id));
            const mergedItem = {
              ...updated[idx],
              ...savedItem,
              ...payload,
              id: editingProduct.id,
              categoryId: finalCatId,
              category_id: finalCatId,
              categoryName: finalCatName,
              subcategoryId: finalSubcatId,
              subcategory_id: finalSubcatId,
              subcategoryName: finalSubcatName,
              brandId: finalBrandId,
              brand_id: finalBrandId,
              brand: finalBrandName
            };
            if (idx >= 0) updated[idx] = mergedItem;
            try { localStorage.setItem('karviyam_admin_products', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
          try { await fetchData(); } catch (eFetch) {}
          setModalOpen(false);
        } else {
          throw new Error(apiData?.message || 'Failed to update product');
        }
      } else {
        const res = await api.post('/admin/products', payload);
        const apiData = res.data ? res.data : res;
        if (apiData && apiData.success !== false) {
          toast.success('New product added to catalog!', { id: 'prod-save-toast' });
          const savedItem = apiData.data || apiData;
          setProducts(prev => {
            let updated = [...prev];
            const itemToInsert = (savedItem && (savedItem.id || savedItem.name))
              ? savedItem
              : { id: Date.now(), ...payload };
            updated.unshift(itemToInsert);
            try { localStorage.setItem('karviyam_admin_products', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
          try { await fetchData(); } catch (eFetch) {}
          setModalOpen(false);
        } else {
          throw new Error(apiData?.message || 'Failed to create product');
        }
      }
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to save product';
      toast.error(msg, { id: 'prod-save-toast' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product permanently from database?')) return;
    toast.loading('Deleting product from database...', { id: 'prod-del-toast' });
    try {
      const res = await api.delete(`/admin/products/${id}`)
        .catch(() => api.delete(`/products/${id}`));

      if (res && res.data && res.data.success !== false) {
        const strId = String(id);
        setProducts(prev => {
          const updated = prev.filter(p => String(p.id) !== strId);
          try {
            if (updated.length > 0) {
              localStorage.setItem('karviyam_admin_products', JSON.stringify(updated));
            } else {
              localStorage.removeItem('karviyam_admin_products');
            }
          } catch (e) {}
          return updated;
        });
        setSelectedIds(prev => prev.filter(i => String(i) !== strId));
        toast.success('Product deleted successfully from database.', { id: 'prod-del-toast' });
        await fetchData();
      } else {
        throw new Error(res?.data?.message || 'Product deletion failed');
      }
    } catch (e) {
      console.error('[DeleteProduct Failure]:', e);
      const errorMsg = e.response?.data?.message || e.message || 'Unable to delete product. No changes were made.';
      toast.error(errorMsg, { id: 'prod-del-toast' });
    }
  };

  const filtered = products.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
  );

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

          <button
            type="button"
            onClick={() => {
              setExportActiveTab('excel');
              setExportModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Export Products (Excel)</span>
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Import / Restore Products</span>
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
      {selectedIds.length > 0 && selectedIds.length === filtered.length && products.length > filtered.length && !isAllDatasetSelected && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
          <span>All {filtered.length} products on this page are selected.</span>
          <button
            type="button"
            onClick={selectFullDataset}
            className="text-rose-700 hover:text-rose-900 font-extrabold underline cursor-pointer"
          >
            Select all {products.length} products in the dataset
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
            <tr>
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.length === filtered.length}
                  onChange={() => toggleSelectAllPage(filtered)}
                  className="w-4 h-4 rounded border-slate-300 text-rose-700 focus:ring-rose-500 cursor-pointer"
                />
              </th>
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
              <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(p.id) ? 'bg-rose-50/40' : ''}`}>
                <td className="p-4 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => toggleSelectRow(p.id)}
                    className="w-4 h-4 rounded border-slate-300 text-rose-700 focus:ring-rose-500 cursor-pointer"
                  />
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveImageUrl(p.imageUrl || (Array.isArray(p.images) && p.images[0]) || p.image, p.id)}
                      onError={(e) => handleImageError(e, p.id)}
                      alt={p.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                    />
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
                    {allCategories.map((c) => (
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
                    value={formData.brandId || (allBrands.find(b => b.name?.toLowerCase() === formData.brand?.toLowerCase())?.id) || ''}
                    onChange={(e) => {
                      const bObj = allBrands.find(b => String(b.id) === String(e.target.value));
                      setFormData({ ...formData, brandId: e.target.value, brand: bObj ? bObj.name : formData.brand });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                  >
                    <option value="">Select Brand</option>
                    {allBrands.map((b) => (
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
                        mainImage: '',
                        subImages: [],
                        videoUrl: '',
                        imageUrls: []
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

                      {/* Structured Product Media Section (1 Main Image + Up to 6 Sub Images + 1 Video File Upload) */}
                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">
                            {variant.colorName || 'Color'} Product Media
                          </label>
                          <span className="text-[10px] text-slate-500 font-bold">
                            1 Main + Up to 6 Sub Images + 1 Video File
                          </span>
                        </div>

                        {/* SECTION 1: MAIN IMAGE (1 MAX) */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#B71C1C] flex items-center gap-1">
                              ★ Main Product Image (Primary)
                            </span>
                            {!variant.mainImage && (
                              <label className="text-[10px] font-extrabold text-[#B71C1C] hover:bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 cursor-pointer flex items-center gap-1 transition-all shadow-2xs">
                                <Upload className="w-3 h-3" />
                                <span>Upload Main Image</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadVariantImage(file, vIdx, 'main');
                                  }}
                                />
                              </label>
                            )}
                          </div>

                          {variant.mainImage ? (
                            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                              <img
                                src={resolveImageUrl(variant.mainImage)}
                                alt="Main"
                                className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-bold text-slate-800 block truncate">{variant.mainImage}</span>
                                <span className="text-[9px] font-extrabold text-[#B71C1C] uppercase tracking-wider">MAIN IMAGE</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setCropperState({ file: variant.mainImage, vIdx, imgType: 'main' })}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-md border border-slate-300 cursor-pointer flex items-center gap-1"
                                >
                                  <span>Crop</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...formData.colorVariants];
                                    updated[vIdx].mainImage = '';
                                    updated[vIdx].imageUrls = [updated[vIdx].mainImage, ...(updated[vIdx].subImages || [])].filter(Boolean);
                                    setFormData({ ...formData, colorVariants: updated });
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                                  title="Delete Main Image"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-bold italic py-1">No Main Image uploaded yet.</p>
                          )}
                        </div>

                        {/* SECTION 2: SUB IMAGES (MAX 6) */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                              Sub Images ({(variant.subImages || []).length}/6)
                            </span>
                            {(variant.subImages || []).length < 6 ? (
                              <label className="text-[10px] font-extrabold text-slate-700 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 cursor-pointer flex items-center gap-1 transition-all">
                                <Upload className="w-3 h-3 text-[#B71C1C]" />
                                <span>+ Add Sub Image(s)</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => handleMultipleVariantSubFiles(e, vIdx)}
                                />
                              </label>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Maximum 6 sub images allowed.
                              </span>
                            )}
                          </div>

                          {(variant.subImages || []).length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {variant.subImages.map((sImg, sIdx) => (
                                <div key={sIdx} className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-2 justify-between shadow-2xs">
                                  <img
                                    src={resolveImageUrl(sImg)}
                                    alt={`Sub ${sIdx + 1}`}
                                    className="w-10 h-10 object-cover rounded-md border border-slate-200 shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[9px] font-extrabold text-slate-700 block truncate">Sub Image {sIdx + 1}</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setCropperState({ file: sImg, vIdx, imgType: 'sub', subIdx: sIdx })}
                                      className="text-[9px] font-bold text-slate-700 hover:text-[#B71C1C] px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 cursor-pointer"
                                    >
                                      Crop
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...formData.colorVariants];
                                        updated[vIdx].subImages = updated[vIdx].subImages.filter((_, i) => i !== sIdx);
                                        updated[vIdx].imageUrls = [updated[vIdx].mainImage, ...updated[vIdx].subImages].filter(Boolean);
                                        setFormData({ ...formData, colorVariants: updated });
                                      }}
                                      className="text-[9px] font-bold text-red-600 hover:bg-red-50 px-1 py-0.5 rounded cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-bold italic py-1">No Sub Images uploaded yet (Up to 6 allowed).</p>
                          )}
                        </div>

                        {/* SECTION 3: PRODUCT VIDEO FILE UPLOAD (0/1) */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1">
                              <Film className="w-3.5 h-3.5 text-purple-600" />
                              Product Video File ({variant.videoUrl ? '1/1' : '0/1'})
                            </span>
                            {!variant.videoUrl ? (
                              <label className="text-[10px] font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 cursor-pointer flex items-center gap-1 transition-all shadow-2xs">
                                <Upload className="w-3 h-3 text-purple-600" />
                                <span>Upload Video File (MP4, WEBM)</span>
                                <input
                                  type="file"
                                  accept="video/mp4,video/webm,video/ogg,video/quicktime"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadVariantVideo(file, vIdx);
                                  }}
                                />
                              </label>
                            ) : null}
                          </div>

                          {variant.videoUrl ? (
                            <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                              <video
                                src={resolveImageUrl(variant.videoUrl)}
                                controls
                                className="w-32 h-18 rounded-md object-cover bg-black shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-bold text-slate-800 block truncate">{variant.videoUrl}</span>
                                <span className="text-[9px] font-extrabold text-purple-600 uppercase tracking-wider">PRODUCT VIDEO FILE</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <label className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-md border border-slate-300 cursor-pointer flex items-center gap-1">
                                  <span>Replace</span>
                                  <input
                                    type="file"
                                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleUploadVariantVideo(file, vIdx);
                                    }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...formData.colorVariants];
                                    updated[vIdx].videoUrl = '';
                                    setFormData({ ...formData, colorVariants: updated, videoUrl: '' });
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                                  title="Delete Video"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-bold italic py-1">No video uploaded yet. Upload MP4, WEBM or MOV video file from your device.</p>
                          )}
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

      {/* Standardized Product Image Cropper Modal */}
      <ImageUploadCropperModal
        isOpen={Boolean(cropperState)}
        onClose={() => setCropperState(null)}
        imageFile={cropperState?.file}
        configType="productGallery"
        onConfirmCrop={(croppedUrl) => {
          if (cropperState) {
            const { vIdx, imgType, subIdx } = cropperState;
            setFormData(prev => {
              const updated = [...(prev.colorVariants || [])];
              if (updated[vIdx]) {
                if (imgType === 'main') {
                  updated[vIdx].mainImage = croppedUrl;
                } else if (imgType === 'sub') {
                  const subArr = [...(updated[vIdx].subImages || [])];
                  if (subIdx !== null && subIdx !== undefined && subIdx < subArr.length) {
                    subArr[subIdx] = croppedUrl;
                  } else {
                    subArr.push(croppedUrl);
                  }
                  updated[vIdx].subImages = subArr.slice(0, 6);
                }
                const mI = updated[vIdx].mainImage || '';
                const sI = (updated[vIdx].subImages || []).filter(Boolean);
                updated[vIdx].imageUrls = [mI, ...sI].filter(Boolean);
              }
              return { ...prev, colorVariants: updated };
            });
            toast.success('Cropped image saved!');
          }
          setCropperState(null);
        }}
      />
      <ClearAllModal
        isOpen={clearAllModalOpen}
        onClose={() => setClearAllModalOpen(false)}
        moduleName="Products"
        itemCount={products.length}
        onConfirm={handleConfirmClearAllProducts}
        loading={clearAllLoading}
      />
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={products.length}
        isAllDatasetSelected={isAllDatasetSelected}
        onSelectAllDataset={selectFullDataset}
        onDeleteSelected={handleDeleteSelectedProducts}
        onClearSelection={() => {
          setSelectedIds([]);
          setIsAllDatasetSelected(false);
        }}
        moduleName="Products"
        loading={batchDeleting}
      />
      <ExportPreviewModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Product Catalog Management"
        filename="karviyam_products_export"
        headers={PRODUCT_EXPORT_HEADERS}
        data={filtered}
        activeTab={exportActiveTab}
        customExcelHandler={async () => {
          const response = await api.get('/admin/excel/products/export', { responseType: 'blob' });
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'karviyam_products_export.xlsx');
          document.body.appendChild(link);
          link.click();
          link.remove();
          toast.success('Exported complete multi-sheet product catalog!');
        }}
      />

    </div>
  );
}


