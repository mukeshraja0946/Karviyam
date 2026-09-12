import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import api from '../utils/api';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Grid,
  List,
  Check
} from 'lucide-react';

const PRICE_RANGE_OPTIONS = [
  { id: 'under_499', label: 'Under ₹499', min: 0, max: 499 },
  { id: '500_999', label: '₹500 – ₹999', min: 500, max: 999 },
  { id: '1000_1999', label: '₹1,000 – ₹1,999', min: 1000, max: 1999 },
  { id: '2000_2999', label: '₹2,000 – ₹2,999', min: 2000, max: 2999 },
  { id: 'above_3000', label: 'Above ₹3,000', min: 3000, max: 999999 }
];

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL'];

const COLOR_OPTIONS = [
  { id: 'black', name: 'Black', hex: '#000000' },
  { id: 'white', name: 'White', hex: '#FFFFFF' },
  { id: 'red', name: 'Red', hex: '#B71C1C' },
  { id: 'blue', name: 'Blue', hex: '#1D4ED8' },
  { id: 'green', name: 'Green', hex: '#15803D' },
  { id: 'beige', name: 'Beige', hex: '#F5F5DC' },
  { id: 'brown', name: 'Brown', hex: '#78350F' }
];

const FALLBACK_CATEGORIES = [
  { id: 1, name: 'Shirts', count: 45 },
  { id: 2, name: 'T-Shirts', count: 68 },
  { id: 3, name: 'Kurtas', count: 32 },
  { id: 4, name: 'Ethnic Wear', count: 54 },
  { id: 5, name: 'Jeans', count: 28 },
  { id: 6, name: 'Sarees', count: 40 },
  { id: 7, name: 'Sneakers', count: 18 }
];

const FALLBACK_BRANDS = [
  { id: 'KARVIYAM', name: 'KARVIYAM', count: 120 },
  { id: 'AUSK', name: 'AUSK', count: 45 },
  { id: 'NOBLE MONK', name: 'NOBLE MONK', count: 38 },
  { id: 'CB-COLEBROOK', name: 'CB-COLEBROOK', count: 29 },
  { id: 'DEELMO', name: 'DEELMO', count: 34 }
];

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug } = useParams();
  const navigate = useNavigate();

  // Dynamic Options from DB
  const [dbCategories, setDbCategories] = useState(FALLBACK_CATEGORIES);
  const [dbBrands, setDbBrands] = useState(FALLBACK_BRANDS);

  // Products & Loading State
  const [products, setProducts] = useState([]);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Pagination & Sorting States
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Accordion Expand/Collapse State
  const [collapsedGroups, setCollapsedGroups] = useState({
    category: false,
    brand: false,
    price: false,
    size: false,
    colour: false,
    availability: false
  });

  // Show More / Show Less States
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [showMoreBrands, setShowMoreBrands] = useState(false);

  // Mobile Filter Drawer State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Dynamic Admin Filter Sections Config
  const [filterSections, setFilterSections] = useState([]);
  const [showMoreStates, setShowMoreStates] = useState({});

  const loadFilterOptions = useCallback(async () => {
    try {
      const res = await api.get('/shop/filter-config').catch(() => null);
      const data = res?.data?.data || res?.data || res;
      if (Array.isArray(data) && data.length > 0) {
        setFilterSections(data);
      }
    } catch (err) {
      console.error('Error fetching shop filter config:', err);
    }
  }, []);

  useEffect(() => {
    loadFilterOptions();
    window.addEventListener('karviyam_shop_filters_updated', loadFilterOptions);
    return () => window.removeEventListener('karviyam_shop_filters_updated', loadFilterOptions);
  }, [loadFilterOptions]);

  // 2. Initialize filter state from URL parameters
  useEffect(() => {
    const urlCat = slug || searchParams.get('category') || searchParams.get('categories') || '';
    const urlBrand = searchParams.get('brand') || searchParams.get('brands') || '';
    const urlPrice = searchParams.get('price') || searchParams.get('priceRanges') || '';
    const urlSize = searchParams.get('size') || searchParams.get('sizes') || '';
    const urlColor = searchParams.get('color') || searchParams.get('colors') || '';
    const urlStock = searchParams.get('inStock') === 'true' || searchParams.get('availability') === 'in_stock';
    const urlSort = searchParams.get('sort') || searchParams.get('sortBy') || 'featured';
    const urlPage = parseInt(searchParams.get('page') || '1', 10);

    const parsedCats = urlCat ? urlCat.split(',').map(s => s.trim()).filter(Boolean) : [];
    const parsedBrands = urlBrand ? urlBrand.split(',').map(s => s.trim()).filter(Boolean) : [];
    const parsedPrices = urlPrice ? urlPrice.split(',').map(s => s.trim()).filter(Boolean) : [];
    const parsedSizes = urlSize ? urlSize.split(',').map(s => s.trim()).filter(Boolean) : [];
    const parsedColors = urlColor ? urlColor.split(',').map(s => s.trim()).filter(Boolean) : [];

    setSelectedCategories(parsedCats);
    setSelectedBrands(parsedBrands);
    setSelectedPriceRanges(parsedPrices);
    setSelectedSizes(parsedSizes);
    setSelectedColors(parsedColors);
    setInStockOnly(urlStock);
    setSortBy(urlSort);
    setCurrentPage(isNaN(urlPage) || urlPage < 1 ? 1 : urlPage);
  }, [searchParams, slug]);

  // Helper to sync local filter state to URL query parameters
  const updateUrlAndFetch = useCallback(
    (newFilters = {}) => {
      const cats = newFilters.categories !== undefined ? newFilters.categories : selectedCategories;
      const brds = newFilters.brands !== undefined ? newFilters.brands : selectedBrands;
      const prices = newFilters.priceRanges !== undefined ? newFilters.priceRanges : selectedPriceRanges;
      const szs = newFilters.sizes !== undefined ? newFilters.sizes : selectedSizes;
      const cols = newFilters.colors !== undefined ? newFilters.colors : selectedColors;
      const stock = newFilters.inStock !== undefined ? newFilters.inStock : inStockOnly;
      const sort = newFilters.sortBy !== undefined ? newFilters.sortBy : sortBy;
      const page = newFilters.page !== undefined ? newFilters.page : currentPage;

      const params = new URLSearchParams();
      if (cats.length > 0) params.set('categories', cats.join(','));
      if (brds.length > 0) params.set('brands', brds.join(','));
      if (prices.length > 0) params.set('priceRanges', prices.join(','));
      if (szs.length > 0) params.set('sizes', szs.join(','));
      if (cols.length > 0) params.set('colors', cols.join(','));
      if (stock) params.set('inStock', 'true');
      if (sort && sort !== 'featured') params.set('sortBy', sort);
      if (page > 1) params.set('page', page);

      setSearchParams(params, { replace: true });
    },
    [
      selectedCategories,
      selectedBrands,
      selectedPriceRanges,
      selectedSizes,
      selectedColors,
      inStockOnly,
      sortBy,
      currentPage,
      setSearchParams
    ]
  );

  // 3. Fetch products from Backend API whenever parameters change
  const fetchProductsFromBackend = useCallback(async () => {
    setLoading(true);
    try {
      const queryParts = [];
      const urlSearch = searchParams.get('search') || searchParams.get('q') || searchParams.get('keyword') || '';
      if (urlSearch) queryParts.push(`keyword=${encodeURIComponent(urlSearch)}`);
      if (selectedCategories.length > 0) queryParts.push(`categories=${encodeURIComponent(selectedCategories.join(','))}`);
      if (selectedBrands.length > 0) queryParts.push(`brands=${encodeURIComponent(selectedBrands.join(','))}`);
      if (selectedPriceRanges.length > 0) queryParts.push(`priceRanges=${encodeURIComponent(selectedPriceRanges.join(','))}`);
      if (selectedSizes.length > 0) queryParts.push(`sizes=${encodeURIComponent(selectedSizes.join(','))}`);
      if (selectedColors.length > 0) queryParts.push(`colors=${encodeURIComponent(selectedColors.join(','))}`);
      if (inStockOnly) queryParts.push('inStock=true');
      if (sortBy) queryParts.push(`sortBy=${encodeURIComponent(sortBy)}`);
      queryParts.push(`page=${currentPage - 1}`);
      queryParts.push('size=250');

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '?size=250';
      const response = await api.get(`/products${queryString}`);
      const apiResult = response?.data ? response.data : response;
      
      let list = [];
      let totalCount = 0;

      if (apiResult?.data) {
        if (Array.isArray(apiResult.data.products)) {
          list = apiResult.data.products;
          totalCount = apiResult.data.totalCount || list.length;
        } else if (Array.isArray(apiResult.data.content)) {
          list = apiResult.data.content;
          totalCount = apiResult.data.totalElements || list.length;
        } else if (Array.isArray(apiResult.data)) {
          list = apiResult.data;
          totalCount = list.length;
        }
      } else if (Array.isArray(apiResult)) {
        list = apiResult;
        totalCount = list.length;
      }

      setProducts(list);
      setTotalProductsCount(totalCount);
    } catch (err) {
      console.error('Error loading shop products from backend API:', err);
      setProducts([]);
      setTotalProductsCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    selectedCategories,
    selectedBrands,
    selectedPriceRanges,
    selectedSizes,
    selectedColors,
    inStockOnly,
    sortBy,
    currentPage
  ]);

  useEffect(() => {
    fetchProductsFromBackend();
  }, [fetchProductsFromBackend]);

  // Handlers for filter controls
  const toggleCollapseGroup = (groupKey) => {
    setCollapsedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const handleCategoryToggle = (catName) => {
    const updated = selectedCategories.includes(catName)
      ? selectedCategories.filter(c => c !== catName)
      : [...selectedCategories, catName];
    setSelectedCategories(updated);
    setCurrentPage(1);
    updateUrlAndFetch({ categories: updated, page: 1 });
  };

  const handleBrandToggle = (brandName) => {
    const updated = selectedBrands.includes(brandName)
      ? selectedBrands.filter(b => b !== brandName)
      : [...selectedBrands, brandName];
    setSelectedBrands(updated);
    setCurrentPage(1);
    updateUrlAndFetch({ brands: updated, page: 1 });
  };

  const handlePriceRangeToggle = (rangeId) => {
    const updated = selectedPriceRanges.includes(rangeId)
      ? selectedPriceRanges.filter(r => r !== rangeId)
      : [...selectedPriceRanges, rangeId];
    setSelectedPriceRanges(updated);
    setCurrentPage(1);
    updateUrlAndFetch({ priceRanges: updated, page: 1 });
  };

  const handleSizeToggle = (sizeVal) => {
    const updated = selectedSizes.includes(sizeVal)
      ? selectedSizes.filter(s => s !== sizeVal)
      : [...selectedSizes, sizeVal];
    setSelectedSizes(updated);
    setCurrentPage(1);
    updateUrlAndFetch({ sizes: updated, page: 1 });
  };

  const handleColorToggle = (colorName) => {
    const updated = selectedColors.includes(colorName)
      ? selectedColors.filter(c => c !== colorName)
      : [...selectedColors, colorName];
    setSelectedColors(updated);
    setCurrentPage(1);
    updateUrlAndFetch({ colors: updated, page: 1 });
  };

  const handleStockToggle = () => {
    const updated = !inStockOnly;
    setInStockOnly(updated);
    setCurrentPage(1);
    updateUrlAndFetch({ inStock: updated, page: 1 });
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    updateUrlAndFetch({ sortBy: newSort });
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedPriceRanges([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setInStockOnly(false);
    setSortBy('featured');
    setCurrentPage(1);
    setSearchParams({}, { replace: true });
    if (slug) navigate('/shop');
  };

  // Page Title Label
  const pageTitleLabel = useMemo(() => {
    if (selectedCategories.length === 1) return selectedCategories[0];
    if (selectedBrands.length === 1) return selectedBrands[0];
    if (slug) return slug;
    return 'All Products';
  }, [selectedCategories, selectedBrands, slug]);

  // Render Filter Sidebar
  const renderFilterSidebar = () => {
    const activeSections = Array.isArray(filterSections) && filterSections.length > 0
      ? filterSections.filter(s => s.isEnabled)
      : null;

    return (
      <div className="space-y-4 text-xs font-sans text-slate-800">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">Filters</h3>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-extrabold text-[#B71C1C] hover:underline cursor-pointer transition-colors"
          >
            Clear All
          </button>
        </div>

        {activeSections ? (
          activeSections.map((sec) => {
            const key = sec.key;
            const title = (sec.title || key).toUpperCase();
            const isCollapsed = Boolean(collapsedGroups[key]);
            const opts = Array.isArray(sec.options) ? sec.options.filter(o => o.isEnabled !== false) : [];
            const isExpandedShowMore = Boolean(showMoreStates[key]);
            const limit = isExpandedShowMore ? (sec.showMoreLimit || 20) : (sec.displayLimit || 5);
            const visibleOpts = opts.slice(0, limit);

            return (
              <div key={sec.id || key} className="border-b border-slate-200 pb-3.5">
                <div
                  onClick={() => toggleCollapseGroup(key)}
                  className="flex items-center justify-between cursor-pointer py-1 select-none group"
                >
                  <span className="font-bold text-xs text-slate-900 group-hover:text-[#B71C1C] transition-colors">
                    {title}
                  </span>
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  )}
                </div>

                {!isCollapsed && (
                  <div className="mt-2.5">
                    {key === 'size' ? (
                      <div className="flex flex-wrap gap-1.5">
                        {visibleOpts.map((szOpt) => {
                          const szName = szOpt.label || szOpt.key;
                          const isSelected = selectedSizes.includes(szName);
                          return (
                            <button
                              key={szOpt.id || szName}
                              type="button"
                              onClick={() => handleSizeToggle(szName)}
                              className={`min-w-[36px] px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#B71C1C] border-[#B71C1C] text-white shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                              }`}
                            >
                              {szName}
                            </button>
                          );
                        })}
                      </div>
                    ) : key === 'colour' ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {visibleOpts.map((colOpt) => {
                          const colName = colOpt.label || colOpt.key;
                          const isSelected = selectedColors.includes(colName);
                          const hex = colOpt.hex || '#000000';
                          return (
                            <button
                              key={colOpt.id || colName}
                              type="button"
                              onClick={() => handleColorToggle(colName)}
                              className={`w-6 h-6 rounded-full border border-slate-300 shadow-2xs flex items-center justify-center transition-all cursor-pointer ${
                                isSelected ? 'ring-2 ring-offset-1 ring-[#B71C1C] scale-110' : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: hex }}
                              title={colName}
                            >
                              {isSelected && (
                                <Check
                                  className={`w-3 h-3 ${
                                    hex === '#FFFFFF' || hex === '#F5F5DC' ? 'text-slate-900' : 'text-white'
                                  }`}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : key === 'availability' ? (
                      <div className="space-y-2">
                        {visibleOpts.map((aOpt) => (
                          <label
                            key={aOpt.id || aOpt.key}
                            className="flex items-center justify-between cursor-pointer hover:text-[#B71C1C] transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={inStockOnly}
                                onChange={handleStockToggle}
                                className="accent-[#B71C1C] w-3.5 h-3.5 rounded cursor-pointer"
                              />
                              <span className="text-[11.5px] font-medium">{aOpt.label || 'In Stock'}</span>
                            </div>
                            {aOpt.count !== undefined && (
                              <span className="text-[10px] text-slate-400 font-bold ml-1 shrink-0">
                                ({aOpt.count})
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {visibleOpts.map((opt) => {
                          const optLabel = opt.label || opt.name || opt.key;
                          const optKey = opt.key || optLabel;
                          let isChecked = false;
                          let onToggle = () => {};

                          if (key === 'category') {
                            isChecked = selectedCategories.includes(optLabel) || selectedCategories.includes(optKey);
                            onToggle = () => handleCategoryToggle(optLabel);
                          } else if (key === 'brand') {
                            isChecked = selectedBrands.includes(optLabel) || selectedBrands.includes(optKey);
                            onToggle = () => handleBrandToggle(optLabel);
                          } else if (key === 'price') {
                            isChecked = selectedPriceRanges.includes(optKey);
                            onToggle = () => handlePriceRangeToggle(optKey);
                          }

                          return (
                            <label
                              key={opt.id || optKey}
                              className="flex items-center justify-between cursor-pointer hover:text-[#B71C1C] transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={onToggle}
                                  className="accent-[#B71C1C] w-3.5 h-3.5 rounded cursor-pointer shrink-0"
                                />
                                <span className="text-[11.5px] font-medium truncate">{optLabel}</span>
                              </div>
                              {opt.count !== undefined && (
                                <span className="text-[10px] text-slate-400 font-bold ml-1 shrink-0">
                                  ({opt.count})
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {sec.enableShowMore && opts.length > (sec.displayLimit || 5) && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowMoreStates(prev => ({ ...prev, [key]: !prev[key] }))
                        }
                        className="text-[11px] font-extrabold text-[#B71C1C] hover:underline pt-2 cursor-pointer block"
                      >
                        {isExpandedShowMore ? '- Show Less' : '+ Show More'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* Fallback static renderers if filterSections loading */
          <div className="border-b border-slate-200 pb-3.5">
            <div onClick={() => toggleCollapseGroup('category')} className="flex items-center justify-between cursor-pointer py-1 select-none group">
              <span className="font-bold text-xs text-slate-900 group-hover:text-[#B71C1C] transition-colors">CATEGORY</span>
              {collapsedGroups.category ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
            </div>
            {!collapsedGroups.category && (
              <div className="mt-2.5 space-y-2">
                {dbCategories.slice(0, 5).map(cat => (
                  <label key={cat.id || cat.name} className="flex items-center justify-between cursor-pointer hover:text-[#B71C1C]">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedCategories.includes(cat.name)} onChange={() => handleCategoryToggle(cat.name)} className="accent-[#B71C1C] w-3.5 h-3.5 rounded" />
                      <span className="text-[11.5px] font-medium">{cat.name}</span>
                    </div>
                    {cat.count !== undefined && <span className="text-[10px] text-slate-400 font-bold">({cat.count})</span>}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen py-4 text-left font-sans">
      <div className="max-w-[1640px] mx-auto px-3 sm:px-6">
        {/* ========================================================= */}
        {/* DESKTOP LAYOUT (≥ 1024px / lg) — INDEPENDENT SCROLLING    */}
        {/* ========================================================= */}
        <div className="hidden lg:flex gap-6 items-start h-[calc(100vh-140px)] overflow-hidden">
          {/* 1. LEFT FILTER SIDEBAR: INDEPENDENT VERTICAL SCROLL */}
          <aside className="w-[250px] xl:w-[270px] shrink-0 h-full overflow-y-auto overscroll-contain pr-1.5 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
            {renderFilterSidebar()}
          </aside>

          {/* 2. MAIN PRODUCT CATALOG: INDEPENDENT VERTICAL SCROLL */}
          <main className="flex-1 min-w-0 h-full overflow-y-auto overscroll-contain pr-1.5 space-y-4">
            {/* Results Header Bar */}
            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200/90 shadow-2xs sticky top-0 z-10">
              <div>
                <h1 className="font-display font-black text-lg text-slate-900 tracking-tight">
                  {pageTitleLabel}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {totalProductsCount} {totalProductsCount === 1 ? 'product' : 'products'} found
                </p>
              </div>

              {/* Sort dropdown & view mode */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-[#B71C1C] cursor-pointer"
                  >
                    <option value="featured">Featured</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Customer Rating</option>
                    <option value="newest">Newest Arrivals</option>
                    <option value="best_selling">Best Selling</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-white text-[#B71C1C] shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white text-[#B71C1C] shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product List / Grid */}
            {loading ? (
              <SkeletonLoader count={10} />
            ) : products.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl text-center border border-slate-200/90 shadow-2xs">
                <h3 className="font-bold text-base text-slate-900 mb-1">
                  No products found
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Try removing some filters or changing your selection.
                </p>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  CLEAR ALL FILTERS
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 w-full">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-3 w-full">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between gap-4 cursor-pointer hover:border-[#B71C1C] transition-colors"
                  >
                    <div className="w-24 h-24 bg-slate-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img
                        src={resolveImageUrl(
                          product.imageUrl || product.image,
                          product.id
                        )}
                        alt={product.name}
                        onError={(e) => handleImageError(e, product.id)}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-black uppercase text-[#B71C1C] tracking-wider block">
                        {product.brand || 'KARVIYAM'}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 truncate mt-0.5">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1">
                        <span>★</span>
                        <span className="text-slate-800">{product.rating || 4.5}</span>
                        <span className="text-slate-400 font-medium">
                          ({product.reviewsCount || 45})
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-base text-slate-900 block">
                        ₹{product.price}
                      </span>
                      {product.oldPrice && product.oldPrice > product.price && (
                        <span className="text-xs text-slate-400 line-through block">
                          ₹{product.oldPrice}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.id}`);
                        }}
                        className="mt-2 bg-[#B71C1C] text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-2xs"
                      >
                        View Product
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>

        {/* ========================================================= */}
        {/* MOBILE LAYOUT (< 1024px / lg)                             */}
        {/* ========================================================= */}
        <div className="block lg:hidden space-y-3">
          {/* Mobile Action Bar: Filter Button & Result Count */}
          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div>
              <h1 className="font-display font-black text-base text-slate-900">
                {pageTitleLabel}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                {totalProductsCount} products found
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="flex items-center gap-2 bg-[#B71C1C] text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-2xs cursor-pointer active:scale-95 transition-transform"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>FILTERS</span>
            </button>
          </div>

          {/* Mobile Product Grid */}
          {loading ? (
            <SkeletonLoader count={6} />
          ) : products.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 mb-1">
                No products found
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Try removing some filters or changing your selection.
              </p>
              <button
                type="button"
                onClick={handleClearAll}
                className="bg-[#B71C1C] text-white text-xs font-bold px-5 py-2 rounded-xl"
              >
                CLEAR ALL FILTERS
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FILTER DRAWER MODAL */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-xs justify-start">
          <div className="w-[300px] max-w-[85%] bg-white h-full shadow-2xl flex flex-col justify-between p-4 overflow-y-auto">
            {renderFilterSidebar()}

            <div className="border-t border-slate-200 pt-3 mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleClearAll}
                className="w-1/2 py-2 text-xs font-bold border border-slate-300 text-slate-700 rounded-xl"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-1/2 py-2 text-xs font-bold bg-[#B71C1C] text-white rounded-xl shadow-xs"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
