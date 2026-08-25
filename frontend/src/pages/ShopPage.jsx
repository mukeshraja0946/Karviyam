import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import MobileSortSheet from '../components/MobileSortSheet';
import MobileCategoryBar from '../components/MobileCategoryBar';
import api from '../utils/api';
import { Menu, SlidersHorizontal, ChevronDown, Check, X, Filter, EyeOff, ArrowUpDown, Sparkles } from 'lucide-react';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categoriesTree, setCategoriesTree] = useState([]);
  const [allCategoriesList, setAllCategoriesList] = useState([]);
  const [isCategoryDisabled, setIsCategoryDisabled] = useState(false);
  const [brands, setBrands] = useState([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  // Body Scroll Lock & ESC Key Listener for Left Slide-Over Filter Drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileFilterOpen(false);
      }
    };

    if (mobileFilterOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileFilterOpen]);

  // Selected Filter States
  const [selectedCategory, setSelectedCategory] = useState(slug || searchParams.get('category') || searchParams.get('categoryId') || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || searchParams.get('subcategoryId') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [selectedGender, setSelectedGender] = useState(searchParams.get('gender') || '');
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('search') || searchParams.get('keyword') || '');
  const [priceRange, setPriceRange] = useState(10000);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isFeaturedOnly, setIsFeaturedOnly] = useState(false);
  const [isTrendingOnly, setIsTrendingOnly] = useState(false);
  const [isBestSellerOnly, setIsBestSellerOnly] = useState(false);
  const [isNewArrivalOnly, setIsNewArrivalOnly] = useState(false);
  const [hasDiscountOnly, setHasDiscountOnly] = useState(false);

  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');

  // Handle open filter drawer signal from URL or global navigation event
  useEffect(() => {
    if (searchParams.get('openFilter') === 'true') {
      setMobileFilterOpen(true);
    }
    const handleOpenDrawer = () => setMobileFilterOpen(true);
    window.addEventListener('karviyam_open_filter_drawer', handleOpenDrawer);
    return () => window.removeEventListener('karviyam_open_filter_drawer', handleOpenDrawer);
  }, [searchParams]);

  // Sync state whenever URL searchParams change
  useEffect(() => {
    const cat = slug || searchParams.get('category') || searchParams.get('categoryId') || '';
    const subcat = searchParams.get('subcategory') || searchParams.get('subcategoryId') || '';
    const brand = searchParams.get('brand') || '';
    const gender = searchParams.get('gender') || '';
    const search = searchParams.get('search') || searchParams.get('keyword') || '';

    setSelectedCategory(cat);
    setSelectedSubcategory(subcat);
    setSelectedBrand(brand);
    setSelectedGender(gender);
    setSearchKeyword(search);
  }, [searchParams, slug]);

  // Count Active Filters for Mobile Badge
  const activeFilterCount = [
    selectedCategory, selectedSubcategory, selectedBrand, selectedGender,
    searchKeyword, selectedColor, selectedSize, selectedMaterial,
    inStockOnly, isFeaturedOnly, isTrendingOnly, isBestSellerOnly, isNewArrivalOnly, hasDiscountOnly
  ].filter(Boolean).length;

  useEffect(() => {
    fetchMetadata();
    window.addEventListener('karviyam_categories_updated', fetchMetadata);
    return () => window.removeEventListener('karviyam_categories_updated', fetchMetadata);
  }, []);

  useEffect(() => {
    fetchProducts();
    window.addEventListener('karviyam_products_updated', fetchProducts);
    return () => window.removeEventListener('karviyam_products_updated', fetchProducts);
  }, [
    searchParams, selectedCategory, selectedSubcategory, selectedBrand, selectedGender,
    searchKeyword, priceRange, selectedColor, selectedSize, selectedMaterial,
    inStockOnly, isFeaturedOnly, isTrendingOnly, isBestSellerOnly, isNewArrivalOnly, hasDiscountOnly,
    sortBy, sortDir, categoriesTree
  ]);

  const fetchMetadata = async () => {
    try {
      const [catRes, brandRes, allCatRes] = await Promise.all([
        api.get('/categories/tree'),
        api.get('/brands'),
        api.get('/categories?all=true').catch(() => null)
      ]);
      const catData = catRes.data ? catRes.data : catRes;
      const brandData = brandRes.data ? brandRes.data : brandRes;
      const allCatData = allCatRes?.data ? allCatRes.data : allCatRes;

      setCategoriesTree(Array.isArray(catData.data) ? catData.data : (Array.isArray(catData) ? catData : []));
      setAllCategoriesList(Array.isArray(allCatData?.data) ? allCatData.data : (Array.isArray(allCatData) ? allCatData : []));
      setBrands(Array.isArray(brandData.data) ? brandData.data : (Array.isArray(brandData) ? brandData : []));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    if (selectedCategory && allCategoriesList.length > 0) {
      const catLower = String(selectedCategory).trim().toLowerCase();
      const matchedAll = allCategoriesList.find(c =>
        String(c.id) === String(selectedCategory) ||
        (c.name || '').toLowerCase() === catLower ||
        (c.slug || '').toLowerCase() === catLower
      );
      if (matchedAll && (matchedAll.isActive === false || matchedAll.is_active === 0 || matchedAll.is_active === false)) {
        setIsCategoryDisabled(true);
        setProducts([]);
        setLoading(false);
        return;
      }
    }
    setIsCategoryDisabled(false);
    try {
      let query = `/products?size=60&sortBy=${sortBy}&sortDir=${sortDir}`;
      if (priceRange && priceRange < 10000) {
        query += `&maxPrice=${priceRange}`;
      }

      if (selectedCategory) {
        if (!isNaN(selectedCategory)) {
          query += `&categoryId=${selectedCategory}`;
        } else {
          const catNameLower = String(selectedCategory).trim().toLowerCase();
          const matchedCat = categoriesTree.find(c => (c.name || '').toLowerCase() === catNameLower);
          if (matchedCat && matchedCat.id) {
            query += `&categoryId=${matchedCat.id}`;
          } else if (['women', 'men', 'kids', 'unisex'].includes(catNameLower)) {
            query += `&gender=${encodeURIComponent(selectedCategory)}`;
          } else {
            query += `&keyword=${encodeURIComponent(selectedCategory)}`;
          }
        }
      }

      if (selectedSubcategory) {
        if (!isNaN(selectedSubcategory)) {
          query += `&subcategoryId=${selectedSubcategory}`;
        } else {
          query += `&keyword=${encodeURIComponent(selectedSubcategory)}`;
        }
      }

      if (selectedBrand) {
        const matchedBrand = brands.find(b => (b.name || '').toLowerCase() === String(selectedBrand).toLowerCase());
        if (matchedBrand && matchedBrand.id) {
          query += `&brandId=${matchedBrand.id}`;
        } else {
          query += `&keyword=${encodeURIComponent(selectedBrand)}`;
        }
      }

      if (selectedGender) query += `&gender=${encodeURIComponent(selectedGender)}`;
      if (searchKeyword) query += `&keyword=${encodeURIComponent(searchKeyword)}`;
      if (selectedColor) query += `&color=${encodeURIComponent(selectedColor)}`;
      if (selectedSize) query += `&sizeParam=${encodeURIComponent(selectedSize)}`;
      if (selectedMaterial) query += `&material=${encodeURIComponent(selectedMaterial)}`;
      if (inStockOnly) query += `&inStock=true`;
      if (isFeaturedOnly) query += `&isFeatured=true`;
      if (isTrendingOnly) query += `&isTrending=true`;
      if (isBestSellerOnly) query += `&isBestSeller=true`;
      if (isNewArrivalOnly) query += `&isNewArrival=true`;
      if (hasDiscountOnly) query += `&hasDiscount=true`;

      const res = await api.get(query);
      const apiData = res.data ? res.data : res;
      const pageObj = apiData.data || apiData;
      let items = Array.isArray(pageObj?.content) ? pageObj.content : (Array.isArray(pageObj) ? pageObj : []);
      
      // Fallback: If filtered parameter returned 0 products, try fetching active catalog products
      if (items.length === 0 && (selectedCategory || searchKeyword)) {
        const fallbackRes = await api.get('/products?size=60');
        const fbApiData = fallbackRes.data ? fallbackRes.data : fallbackRes;
        const fbObj = fbApiData.data || fbApiData;
        const fbItems = Array.isArray(fbObj?.content) ? fbObj.content : (Array.isArray(fbObj) ? fbObj : []);
        
        // Client-side filter fallback
        const filteredFb = fbItems.filter(p => {
          const matchCat = !selectedCategory || 
            String(p.categoryId) === String(selectedCategory) ||
            (p.categoryName || '').toLowerCase().includes(String(selectedCategory).toLowerCase()) ||
            (p.name || '').toLowerCase().includes(String(selectedCategory).toLowerCase()) ||
            (p.description || '').toLowerCase().includes(String(selectedCategory).toLowerCase());
          
          const matchKw = !searchKeyword ||
            (p.name || '').toLowerCase().includes(String(searchKeyword).toLowerCase()) ||
            (p.description || '').toLowerCase().includes(String(searchKeyword).toLowerCase()) ||
            (p.brand || '').toLowerCase().includes(String(searchKeyword).toLowerCase());

          return matchCat && matchKw;
        });

        if (filteredFb.length > 0) {
          items = filteredFb;
        } else if (!searchKeyword && !selectedCategory) {
          items = fbItems;
        }
      }

      setProducts(prev => {
        let merged = [...items];
        try {
          const savedAdmin = localStorage.getItem('karviyam_admin_products');
          if (savedAdmin) {
            const parsedAdmin = JSON.parse(savedAdmin);
            if (Array.isArray(parsedAdmin)) {
              parsedAdmin.forEach(ap => {
                if (ap && ap.id && !merged.some(m => String(m.id) === String(ap.id))) {
                  merged.unshift(ap);
                }
              });
            }
          }
        } catch (eLocal) {}

        if (merged.length === 0 && prev.length > 0) return prev;
        return merged;
      });
    } catch (e) {
      console.error('Error fetching shop products:', e);
      try {
        const savedAdmin = localStorage.getItem('karviyam_admin_products');
        if (savedAdmin) {
          const parsedAdmin = JSON.parse(savedAdmin);
          if (Array.isArray(parsedAdmin) && parsedAdmin.length > 0) setProducts(parsedAdmin);
        }
      } catch (eLocal) {}
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedBrand('');
    setSelectedGender('');
    setSearchKeyword('');
    setPriceRange(10000);
    setSelectedColor('');
    setSelectedSize('');
    setSelectedMaterial('');
    setInStockOnly(false);
    setIsFeaturedOnly(false);
    setIsTrendingOnly(false);
    setIsBestSellerOnly(false);
    setIsNewArrivalOnly(false);
    setHasDiscountOnly(false);
    setSearchParams({});
  };

  // Shared Filter Content markup
  const FilterContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 className="flex items-center gap-2 font-display font-extrabold text-sm uppercase tracking-wider text-slate-900">
          <SlidersHorizontal className="w-4 h-4 text-[#B71C1C]" /> Filters
        </h3>
        <button onClick={clearFilters} className="text-[11px] font-bold text-[#B71C1C] hover:underline cursor-pointer">
          Clear All
        </button>
      </div>

      {/* Quick Badges Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Highlights</h4>
        <div className="space-y-1.5 text-xs font-medium">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700">
            <input type="checkbox" checked={isTrendingOnly} onChange={(e) => setIsTrendingOnly(e.target.checked)} className="accent-[#B71C1C]" />
            <span>Trending Products</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-700">
            <input type="checkbox" checked={isBestSellerOnly} onChange={(e) => setIsBestSellerOnly(e.target.checked)} className="accent-[#B71C1C]" />
            <span>Best Sellers</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-700">
            <input type="checkbox" checked={isNewArrivalOnly} onChange={(e) => setIsNewArrivalOnly(e.target.checked)} className="accent-[#B71C1C]" />
            <span>New Arrivals</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-700">
            <input type="checkbox" checked={hasDiscountOnly} onChange={(e) => setHasDiscountOnly(e.target.checked)} className="accent-[#B71C1C]" />
            <span>Discounted Deals</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-700">
            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="accent-[#B71C1C]" />
            <span>In Stock Only</span>
          </label>
        </div>
      </div>

      {/* Category Tree Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Categories</h4>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-900 cursor-pointer">
            <input type="radio" name="cat" checked={!selectedCategory} onChange={() => { setSelectedCategory(''); setSelectedSubcategory(''); }} className="accent-[#B71C1C]" />
            <span>All Categories</span>
          </label>
          {categoriesTree.map((c) => (
            <div key={c.id} className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="cat"
                  checked={selectedCategory == c.id || selectedCategory === c.name}
                  onChange={() => { setSelectedCategory(c.id); setSelectedSubcategory(''); }}
                  className="accent-[#B71C1C]"
                />
                <span>{c.name}</span>
              </label>
              {c.children && c.children.length > 0 && (selectedCategory == c.id || selectedCategory === c.name) && (
                <div className="pl-4 space-y-1 border-l-2 border-slate-100 ml-1">
                  {c.children.map((sub) => (
                    <label key={sub.id} className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        name="subcat"
                        checked={selectedSubcategory == sub.id || selectedSubcategory === sub.name}
                        onChange={() => setSelectedSubcategory(sub.id)}
                        className="accent-[#B71C1C]"
                      />
                      <span>{sub.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Brand Filter */}
      {brands.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Brand</h4>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs font-medium p-2.5 rounded-xl outline-none"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Gender Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Gender / Target</h4>
        <div className="flex flex-wrap gap-1.5">
          {['Men', 'Women', 'Kids', 'Unisex'].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGender(selectedGender === g ? '' : g)}
              className={`text-[11px] px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                selectedGender === g ? 'bg-[#B71C1C] text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Slider */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
          <span>Max Price</span>
          <span className="text-[#B71C1C] font-black">₹{priceRange}</span>
        </div>
        <input
          type="range"
          min="200"
          max="20000"
          step="200"
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value)}
          className="w-full accent-[#B71C1C]"
        />
      </div>
    </div>
  );

  return (
    <div className="w-full overflow-x-hidden">
      
      {/* Category Tabs Bar at Top of Shop Page on Mobile */}
      <MobileCategoryBar />

      <div className="w-full px-2 sm:px-4 lg:px-6 py-2 sm:py-6 max-w-[1750px] mx-auto space-y-3 sm:space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col gap-2.5 border-b border-slate-200 pb-2.5 sm:pb-4">
          
          {/* Desktop Title & Sort (hidden on mobile) */}
          <div className="hidden md:flex items-center justify-between gap-3">
            <div>
              <h1 className="font-display font-black text-xl sm:text-2xl text-slate-900">Karviyam Product Catalog</h1>
              <p className="text-xs text-slate-500 mt-0.5">Showing {products.length} catalog products</p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort By:</span>
              <div className="relative inline-flex items-center">
                <select
                  value={`${sortBy}-${sortDir}`}
                  onChange={(e) => {
                    const [b, d] = e.target.value.split('-');
                    setSortBy(b);
                    setSortDir(d);
                  }}
                  className="bg-white border border-slate-200 text-slate-900 text-xs font-bold pl-3 pr-8 py-2 rounded-xl outline-none cursor-pointer focus:border-[#B71C1C] shadow-xs appearance-none leading-normal"
                >
                  <option value="id-desc">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating-desc">Highest Rated</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Mobile Horizontal Filter Controls Bar (< 768px): Explore More + [ Gender ▼ ] [ Categories ▼ ] [ Sort ▼ ] */}
          <div className="mobile-only space-y-2">
            {/* Explore More Header & Chips */}
            <div className="pt-1">
              <h3 className="font-display font-black text-sm text-center text-slate-900 tracking-tight mb-2">Explore More</h3>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 whitespace-nowrap touch-pan-x">
                <button
                  type="button"
                  onClick={() => setSelectedGender('')}
                  className="px-3.5 py-2 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white font-black text-[10px] uppercase tracking-wider shrink-0 shadow-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" /> FOR YOU
                </button>

                <button
                  type="button"
                  onClick={() => setPriceRange(499)}
                  className="px-3.5 py-2 rounded-2xl bg-red-50/80 border border-red-200 text-[#B71C1C] font-black text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1"
                >
                  UNDER ₹499 🪙
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy('rating')}
                  className="px-3.5 py-2 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-800 font-black text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1"
                >
                  DEAL OF THE DAY 🏷️
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy('id')}
                  className="px-3.5 py-2 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 font-black text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1"
                >
                  WHAT'S NEW ✨
                </button>
              </div>
            </div>

            {/* Filter Pills: [ Gender ▼ ] [ Categories ▼ ] [ 🎛️ Sort ▼ ] [ Under ₹999 ] */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1.5 whitespace-nowrap touch-pan-x">
              {/* Gender Pill */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className={`flex items-center gap-1 px-4 py-2 rounded-2xl border text-xs font-bold shrink-0 cursor-pointer shadow-2xs ${
                  selectedGender ? 'bg-red-50 text-[#B71C1C] border-red-300' : 'bg-white text-slate-800 border-slate-300'
                }`}
              >
                <span>Gender {selectedGender ? `(${selectedGender})` : '▼'}</span>
              </button>

              {/* Categories Pill */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className={`flex items-center gap-1 px-4 py-2 rounded-2xl border text-xs font-bold shrink-0 cursor-pointer shadow-2xs ${
                  selectedCategory ? 'bg-red-50 text-[#B71C1C] border-red-300' : 'bg-white text-slate-800 border-slate-300'
                }`}
              >
                <span>Categories {selectedCategory ? `(${selectedCategory})` : '▼'}</span>
              </button>

              {/* Sort Pill */}
              <button
                type="button"
                onClick={() => setMobileSortOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white border border-slate-300 text-slate-800 text-xs font-bold shrink-0 cursor-pointer shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-700" />
                <span>Sort ▼</span>
              </button>

              {/* Under ₹999 Pill */}
              <button
                type="button"
                onClick={() => setPriceRange(999)}
                className={`flex items-center gap-1 px-4 py-2 rounded-2xl border text-xs font-bold shrink-0 cursor-pointer shadow-2xs ${
                  priceRange <= 999 ? 'bg-red-50 text-[#B71C1C] border-red-300' : 'bg-white text-slate-800 border-slate-300'
                }`}
              >
                <span>Under ₹999</span>
              </button>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-[11px] font-semibold text-slate-700">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 shrink-0">Active:</span>
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 bg-red-50 text-[#B71C1C] px-2.5 py-0.5 rounded-full border border-red-200 shrink-0">
                  Category: {selectedCategory}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory('')} />
                </span>
              )}
              {selectedSubcategory && (
                <span className="inline-flex items-center gap-1 bg-red-50 text-[#B71C1C] px-2.5 py-0.5 rounded-full border border-red-200 shrink-0">
                  Subcategory: {selectedSubcategory}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedSubcategory('')} />
                </span>
              )}
              {selectedBrand && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 shrink-0">
                  Brand: {selectedBrand}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedBrand('')} />
                </span>
              )}
              {selectedGender && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 shrink-0">
                  Target: {selectedGender}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedGender('')} />
                </span>
              )}
              {priceRange < 10000 && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 shrink-0">
                  ≤ ₹{priceRange}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setPriceRange(10000)} />
                </span>
              )}
              <button onClick={clearFilters} className="text-[10px] font-bold text-[#B71C1C] underline shrink-0 cursor-pointer ml-1">
                Reset All
              </button>
            </div>
          )}
        </div>

        <div className="w-full">
          {/* Mobile Sort Sheet Modal */}
          <MobileSortSheet
            isOpen={mobileSortOpen}
            onClose={() => setMobileSortOpen(false)}
            currentSort={`${sortBy}-${sortDir}`}
            onSelectSort={(val) => {
              const [b, d] = val.split('-');
              setSortBy(b);
              setSortDir(d);
            }}
          />

          {/* Left-Side Filter Drawer (Width: ~85%, Max: 360px, Dark Overlay, ESC listener, Scroll Lock) */}
          {mobileFilterOpen && (
            <div
              className="fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-xs justify-start transition-opacity duration-300"
              onClick={(e) => {
                if (e.target === e.currentTarget) setMobileFilterOpen(false);
              }}
            >
              <div className="relative w-[85vw] max-w-[360px] bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-300 z-50">
                
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 shrink-0">
                  <h3 className="font-display font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#B71C1C]" /> FILTERS
                  </h3>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Filter Content (Scrollable) */}
                <div className="p-4 overflow-y-auto flex-1 space-y-6">
                  <FilterContent />
                </div>

                {/* Drawer Sticky Footer Action Buttons */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2.5 text-xs font-bold text-[#B71C1C] hover:bg-red-50 rounded-xl transition-colors border border-red-200 cursor-pointer"
                  >
                    CLEAR ALL
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="flex-1 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase py-2.5 rounded-xl shadow-md transition-colors cursor-pointer text-center"
                  >
                    APPLY FILTERS ({products.length})
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* Product Catalogue Grid */}
          <div className="w-full">
            {isCategoryDisabled ? (
              <div className="bg-amber-50/90 border border-amber-200 p-8 rounded-3xl text-center space-y-4 max-w-xl mx-auto my-6 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <EyeOff className="w-6 h-6" />
                </div>
                <h3 className="font-display font-extrabold text-xl text-slate-900">Category Currently Unavailable</h3>
                <p className="text-xs text-slate-600">The requested category is currently disabled or inactive in our catalog.</p>
                <button
                  onClick={clearFilters}
                  className="inline-block bg-[#B71C1C] hover:bg-[#900C0C] text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-md cursor-pointer transition-all"
                >
                  View All Active Products →
                </button>
              </div>
            ) : loading ? (
              <SkeletonLoader count={6} />
            ) : products.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center border border-slate-200/80 shadow-xs">
                <h3 className="font-display font-extrabold text-lg mb-2 text-slate-900">No Products Found</h3>
                <p className="text-xs text-slate-500 mb-4">Try adjusting your filters or search keywords.</p>
                <button onClick={clearFilters} className="bg-[#B71C1C] hover:bg-[#900C0C] text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-md cursor-pointer transition-all">
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                {/* Mobile Grid: STRICT 2 PRODUCTS PER ROW */}
                <div className="mobile-product-grid">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Desktop Grid (>= 768px) */}
                <div className="desktop-only-grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
