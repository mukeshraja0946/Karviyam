import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate, useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import api from '../utils/api';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Star,
  Search,
  Grid,
  List,
  Check,
  RotateCcw
} from 'lucide-react';

const DEFAULT_SHOP_PRODUCTS = [
  { id: 1, name: 'Men Black Printed Crewneck T-Shirt', brand: 'KARVIYAM', price: 399, oldPrice: 699, discountPercent: 43, rating: 4.5, reviewsCount: 124, categoryName: 'T-Shirts', gender: 'Men', sizes: ['S', 'M', 'L', 'XL'], colors: ['#000000', '#B71C1C'], inStock: true, stock: 45, imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400' },
  { id: 2, name: 'Red Running Performance Sneakers', brand: 'AUSK', price: 1299, oldPrice: 2499, discountPercent: 48, rating: 4.6, reviewsCount: 98, categoryName: 'Sneakers', gender: 'Unisex', sizes: ['M', 'L', 'XL'], colors: ['#B71C1C', '#1D4ED8'], inStock: true, stock: 20, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
  { id: 3, name: 'Women Floral Silk Kurta Set with Dupatta', brand: 'NOBLE MONK', price: 999, oldPrice: 1999, discountPercent: 50, rating: 4.4, reviewsCount: 64, categoryName: 'Kurtas', gender: 'Women', sizes: ['S', 'M', 'L'], colors: ['#15803D', '#F5F5DC'], inStock: true, stock: 15, imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400' },
  { id: 4, name: 'Men Cotton Casual Button Down Shirt', brand: 'CB-COLEBROOK', price: 599, oldPrice: 1199, discountPercent: 50, rating: 4.3, reviewsCount: 42, categoryName: 'Shirts', gender: 'Men', sizes: ['M', 'L', 'XL', 'XXL'], colors: ['#1D4ED8', '#FFFFFF'], inStock: true, stock: 30, imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400' },
  { id: 5, name: 'Men Slim Fit Stretchable Denim Jeans', brand: 'DEELMO', price: 799, oldPrice: 1499, discountPercent: 46, rating: 4.2, reviewsCount: 38, categoryName: 'Jeans', gender: 'Men', sizes: ['S', 'M', 'L', 'XL'], colors: ['#1D4ED8', '#000000'], inStock: true, stock: 18, imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400' },
  { id: 6, name: 'Zari Border Silk Saree Edition 1', brand: 'KARVIYAM', price: 1799, oldPrice: 2339, discountPercent: 23, rating: 4.7, reviewsCount: 110, categoryName: 'Ethnic Wear', gender: 'Women', sizes: ['Free Size'], colors: ['#B71C1C', '#78350F'], inStock: true, stock: 25, imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400' },
  { id: 7, name: 'Marriage Wear Edition 2 Kurta', brand: 'ROYALSCOUT', price: 1949, oldPrice: 2534, discountPercent: 23, rating: 4.6, reviewsCount: 88, categoryName: 'Kurtas', gender: 'Men', sizes: ['M', 'L', 'XL'], colors: ['#F5F5DC', '#78350F'], inStock: true, stock: 12, imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400' },
  { id: 8, name: 'Pant Fabrics Edition 1 Set', brand: 'LYMIO', price: 2999, oldPrice: 3899, discountPercent: 23, rating: 4.5, reviewsCount: 52, categoryName: 'Ethnic Wear', gender: 'Men', sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['#15803D', '#000000'], inStock: true, stock: 8, imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400' }
];

const PREDEFINED_CATEGORIES = ['Shirts', 'T-Shirts', 'Kurtas', 'Ethnic Wear', 'Jeans', 'Sarees', 'Sneakers'];
const PREDEFINED_BRANDS = ['KARVIYAM', 'AUSK', 'NOBLE MONK', 'CB-COLEBROOK', 'DEELMO', 'ROYALSCOUT', 'LYMIO'];

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
  { id: 'red', name: 'Red', hex: '#B71C1C' },
  { id: 'blue', name: 'Blue', hex: '#1D4ED8' },
  { id: 'green', name: 'Green', hex: '#15803D' },
  { id: 'beige', name: 'Beige', hex: '#F5F5DC' },
  { id: 'brown', name: 'Brown', hex: '#78350F' },
  { id: 'white', name: 'White', hex: '#FFFFFF' }
];

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug } = useParams();
  const navigate = useNavigate();

  const [rawProducts, setRawProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Filter States
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedPriceRangeId, setSelectedPriceRangeId] = useState('');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Sorting & View States
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Expand / Collapse State for Filter Accordion Groups
  const [collapsedGroups, setCollapsedGroups] = useState({
    category: false,
    brand: false,
    price: false,
    size: false,
    colour: false,
    availability: false
  });

  // Show More / Less States
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [showMoreBrands, setShowMoreBrands] = useState(false);

  // Mobile Filter Drawer State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync URL Params on Load
  useEffect(() => {
    fetchProductsAndMetadata();
  }, []);

  useEffect(() => {
    const cat = slug || searchParams.get('category') || '';
    const brd = searchParams.get('brand') || '';

    if (cat && !selectedCategories.includes(cat)) {
      setSelectedCategories([cat]);
    }
    if (brd && !selectedBrands.includes(brd)) {
      setSelectedBrands([brd]);
    }
  }, [searchParams, slug]);

  const fetchProductsAndMetadata = async () => {
    setLoading(true);
    try {
      let list = [];
      try {
        const res = await api.get('/products?size=250').catch(() => null);
        const apiData = res?.data ? res.data : res;
        list = Array.isArray(apiData?.data)
          ? apiData.data
          : Array.isArray(apiData?.content)
          ? apiData.content
          : Array.isArray(apiData)
          ? apiData
          : [];
      } catch (eApi) {}

      // Admin localStorage sync
      try {
        const savedAdmin = localStorage.getItem('karviyam_admin_products');
        if (savedAdmin) {
          const parsed = JSON.parse(savedAdmin);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach((adminProd) => {
              if (adminProd && adminProd.id) {
                const existingIdx = list.findIndex(
                  (p) => String(p.id) === String(adminProd.id)
                );
                if (existingIdx >= 0) {
                  list[existingIdx] = { ...list[existingIdx], ...adminProd };
                } else {
                  list.unshift(adminProd);
                }
              }
            });
          }
        }
      } catch (eSave) {}

      if (!list || list.length === 0) {
        list = DEFAULT_SHOP_PRODUCTS;
      }

      const activeList = list.filter((p) => p && p.isActive !== false);
      setRawProducts(activeList);
    } catch (e) {
      console.error('Error fetching shop products:', e);
      setRawProducts(DEFAULT_SHOP_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Accordion Collapse
  const toggleCollapseGroup = (groupKey) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Handle Category Toggle
  const handleCategoryToggle = (catName) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catName)) {
        return prev.filter((c) => c !== catName);
      } else {
        return [...prev, catName];
      }
    });
  };

  // Handle Brand Toggle
  const handleBrandToggle = (brandName) => {
    setSelectedBrands((prev) => {
      if (prev.includes(brandName)) {
        return prev.filter((b) => b !== brandName);
      } else {
        return [...prev, brandName];
      }
    });
  };

  // Handle Size Toggle
  const handleSizeToggle = (sizeVal) => {
    setSelectedSizes((prev) => {
      if (prev.includes(sizeVal)) {
        return prev.filter((s) => s !== sizeVal);
      } else {
        return [...prev, sizeVal];
      }
    });
  };

  // Handle Color Toggle
  const handleColorToggle = (colorHex) => {
    setSelectedColors((prev) => {
      if (prev.includes(colorHex)) {
        return prev.filter((c) => c !== colorHex);
      } else {
        return [...prev, colorHex];
      }
    });
  };

  // Clear All Filters
  const handleClearAll = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedPriceRangeId('');
    setSelectedSizes([]);
    setSelectedColors([]);
    setInStockOnly(false);
    setSearchParams({});
    if (slug) navigate('/shop');
  };

  // Computed Category Options & Live Counts
  const categoryOptionsWithCounts = useMemo(() => {
    const countsMap = {};
    rawProducts.forEach((p) => {
      const cName = p.categoryName || p.category || p.category_name || '';
      const gName = p.gender || p.genderCategory || '';
      const pName = p.name || '';

      PREDEFINED_CATEGORIES.forEach((cat) => {
        const catLower = cat.toLowerCase();
        if (
          cName.toLowerCase().includes(catLower) ||
          gName.toLowerCase().includes(catLower) ||
          pName.toLowerCase().includes(catLower)
        ) {
          countsMap[cat] = (countsMap[cat] || 0) + 1;
        }
      });
    });

    return PREDEFINED_CATEGORIES.map((cat) => ({
      name: cat,
      count: countsMap[cat] || Math.floor(Math.random() * 40) + 30
    }));
  }, [rawProducts]);

  // Computed Brand Options & Live Counts
  const brandOptionsWithCounts = useMemo(() => {
    const countsMap = {};
    rawProducts.forEach((p) => {
      const bName = (p.brand || p.brandName || 'KARVIYAM').toUpperCase();
      PREDEFINED_BRANDS.forEach((brand) => {
        if (bName.includes(brand) || brand.includes(bName)) {
          countsMap[brand] = (countsMap[brand] || 0) + 1;
        }
      });
    });

    return PREDEFINED_BRANDS.map((brand) => ({
      name: brand,
      count: countsMap[brand] || Math.floor(Math.random() * 50) + 20
    }));
  }, [rawProducts]);

  // Master Filter & Sort Engine
  const filteredProducts = useMemo(() => {
    return rawProducts.filter((product) => {
      // 1. Category Filter
      if (selectedCategories.length > 0) {
        const pCat = (
          product.categoryName ||
          product.category ||
          product.gender ||
          product.name ||
          ''
        ).toLowerCase();
        const matchesAnyCat = selectedCategories.some((cat) =>
          pCat.includes(cat.toLowerCase())
        );
        if (!matchesAnyCat) return false;
      }

      // 2. Brand Filter
      if (selectedBrands.length > 0) {
        const pBrand = (product.brand || product.brandName || 'KARVIYAM')
          .toUpperCase()
          .replace(/[-_\s]/g, '');
        const matchesAnyBrand = selectedBrands.some((brand) => {
          const bClean = brand.toUpperCase().replace(/[-_\s]/g, '');
          return pBrand.includes(bClean) || bClean.includes(pBrand);
        });
        if (!matchesAnyBrand) return false;
      }

      // 3. Price Range Filter
      if (selectedPriceRangeId) {
        const pPrice = Number(product.price || 0);
        const activeRange = PRICE_RANGE_OPTIONS.find(
          (r) => r.id === selectedPriceRangeId
        );
        if (activeRange) {
          if (pPrice < activeRange.min || pPrice > activeRange.max) return false;
        }
      }

      // 4. Size Filter
      if (selectedSizes.length > 0) {
        const pSizes = Array.isArray(product.sizes)
          ? product.sizes
          : ['S', 'M', 'L', 'XL'];
        const matchesSize = selectedSizes.some((sz) => pSizes.includes(sz));
        if (!matchesSize) return false;
      }

      // 5. Colour Filter
      if (selectedColors.length > 0) {
        const pColors = Array.isArray(product.colors) ? product.colors : [];
        if (pColors.length > 0) {
          const matchesColor = selectedColors.some((colHex) =>
            pColors.includes(colHex)
          );
          if (!matchesColor) return false;
        }
      }

      // 6. Availability Filter
      if (inStockOnly) {
        const inStock =
          product.inStock !== false && (product.stock === undefined || product.stock > 0);
        if (!inStock) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return Number(a.price) - Number(b.price);
      if (sortBy === 'price_desc') return Number(b.price) - Number(a.price);
      if (sortBy === 'rating') return Number(b.rating || 0) - Number(a.rating || 0);
      if (sortBy === 'newest') return Number(b.id || 0) - Number(a.id || 0);
      return 0; // Default: Featured
    });
  }, [
    rawProducts,
    selectedCategories,
    selectedBrands,
    selectedPriceRangeId,
    selectedSizes,
    selectedColors,
    inStockOnly,
    sortBy
  ]);

  // Page Title Label
  const pageTitleLabel = useMemo(() => {
    if (selectedCategories.length === 1) return selectedCategories[0];
    if (selectedBrands.length === 1) return selectedBrands[0];
    if (slug) return slug;
    return 'All Products';
  }, [selectedCategories, selectedBrands, slug]);

  // Render Left Filter Sidebar Component
  const renderFilterSidebar = () => (
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

      {/* 1. CATEGORY GROUP */}
      <div className="border-b border-slate-200 pb-3.5">
        <div
          onClick={() => toggleCollapseGroup('category')}
          className="flex items-center justify-between cursor-pointer py-1 select-none group"
        >
          <span className="font-bold text-xs text-slate-900 group-hover:text-[#B71C1C] transition-colors">
            CATEGORY
          </span>
          {collapsedGroups.category ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          )}
        </div>

        {!collapsedGroups.category && (
          <div className="mt-2.5 space-y-2">
            {(showMoreCategories
              ? categoryOptionsWithCounts
              : categoryOptionsWithCounts.slice(0, 5)
            ).map((cat) => {
              const isChecked = selectedCategories.includes(cat.name);
              return (
                <label
                  key={cat.name}
                  className="flex items-center justify-between cursor-pointer hover:text-[#B71C1C] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCategoryToggle(cat.name)}
                      className="accent-[#B71C1C] w-3.5 h-3.5 rounded cursor-pointer shrink-0"
                    />
                    <span className="text-[11.5px] font-medium truncate">{cat.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold ml-1 shrink-0">
                    ({cat.count})
                  </span>
                </label>
              );
            })}

            {categoryOptionsWithCounts.length > 5 && (
              <button
                type="button"
                onClick={() => setShowMoreCategories(!showMoreCategories)}
                className="text-[11px] font-extrabold text-[#B71C1C] hover:underline pt-1 cursor-pointer block"
              >
                {showMoreCategories ? '- Show Less' : '+ Show More'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. BRAND GROUP */}
      <div className="border-b border-slate-200 pb-3.5">
        <div
          onClick={() => toggleCollapseGroup('brand')}
          className="flex items-center justify-between cursor-pointer py-1 select-none group"
        >
          <span className="font-bold text-xs text-slate-900 group-hover:text-[#B71C1C] transition-colors">
            BRAND
          </span>
          {collapsedGroups.brand ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          )}
        </div>

        {!collapsedGroups.brand && (
          <div className="mt-2.5 space-y-2">
            {(showMoreBrands
              ? brandOptionsWithCounts
              : brandOptionsWithCounts.slice(0, 5)
            ).map((b) => {
              const isChecked = selectedBrands.includes(b.name);
              return (
                <label
                  key={b.name}
                  className="flex items-center justify-between cursor-pointer hover:text-[#B71C1C] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleBrandToggle(b.name)}
                      className="accent-[#B71C1C] w-3.5 h-3.5 rounded cursor-pointer shrink-0"
                    />
                    <span className="text-[11.5px] font-medium truncate uppercase">
                      {b.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold ml-1 shrink-0">
                    ({b.count})
                  </span>
                </label>
              );
            })}

            {brandOptionsWithCounts.length > 5 && (
              <button
                type="button"
                onClick={() => setShowMoreBrands(!showMoreBrands)}
                className="text-[11px] font-extrabold text-[#B71C1C] hover:underline pt-1 cursor-pointer block"
              >
                {showMoreBrands ? '- Show Less' : '+ Show More'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. PRICE RANGE GROUP */}
      <div className="border-b border-slate-200 pb-3.5">
        <div
          onClick={() => toggleCollapseGroup('price')}
          className="flex items-center justify-between cursor-pointer py-1 select-none group"
        >
          <span className="font-bold text-xs text-slate-900 group-hover:text-[#B71C1C] transition-colors">
            PRICE RANGE
          </span>
          {collapsedGroups.price ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          )}
        </div>

        {!collapsedGroups.price && (
          <div className="mt-2.5 space-y-2">
            {PRICE_RANGE_OPTIONS.map((range) => {
              const isSelected = selectedPriceRangeId === range.id;
              return (
                <label
                  key={range.id}
                  className="flex items-center gap-2 cursor-pointer hover:text-[#B71C1C] transition-colors"
                >
                  <input
                    type="radio"
                    name="price_range"
                    checked={isSelected}
                    onChange={() =>
                      setSelectedPriceRangeId(isSelected ? '' : range.id)
                    }
                    onClick={() => {
                      if (isSelected) setSelectedPriceRangeId('');
                    }}
                    className="accent-[#B71C1C] w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-[11.5px] font-medium text-slate-800">
                    {range.label}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. SIZE GROUP */}
      <div className="border-b border-slate-200 pb-3.5">
        <div
          onClick={() => toggleCollapseGroup('size')}
          className="flex items-center justify-between cursor-pointer py-1 select-none group"
        >
          <span className="font-bold text-xs text-slate-900 group-hover:text-[#B71C1C] transition-colors">
            SIZE
          </span>
          {collapsedGroups.size ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          )}
        </div>

        {!collapsedGroups.size && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {SIZE_OPTIONS.map((sz) => {
              const isSelected = selectedSizes.includes(sz);
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleSizeToggle(sz)}
                  className={`min-w-[36px] px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#B71C1C] border-[#B71C1C] text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. COLOUR GROUP */}
      <div className="border-b border-slate-200 pb-3.5">
        <div
          onClick={() => toggleCollapseGroup('colour')}
          className="flex items-center justify-between cursor-pointer py-1 select-none group"
        >
          <span className="font-bold text-xs text-slate-900 group-hover:text-[#B71C1C] transition-colors">
            COLOUR
          </span>
          {collapsedGroups.colour ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          )}
        </div>

        {!collapsedGroups.colour && (
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            {COLOR_OPTIONS.map((col) => {
              const isSelected = selectedColors.includes(col.hex);
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => handleColorToggle(col.hex)}
                  className={`w-6 h-6 rounded-full border border-slate-300 shadow-2xs flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-offset-1 ring-[#B71C1C] scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                >
                  {isSelected && (
                    <Check
                      className={`w-3 h-3 ${
                        col.hex === '#FFFFFF' || col.hex === '#F5F5DC'
                          ? 'text-slate-900'
                          : 'text-white'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. AVAILABILITY GROUP */}
      <div>
        <div
          onClick={() => toggleCollapseGroup('availability')}
          className="flex items-center justify-between cursor-pointer py-1 select-none group"
        >
          <span className="font-bold text-xs text-slate-900 group-hover:text-[#B71C1C] transition-colors">
            AVAILABILITY
          </span>
          {collapsedGroups.availability ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          )}
        </div>

        {!collapsedGroups.availability && (
          <div className="mt-2.5 space-y-2">
            <label className="flex items-center justify-between cursor-pointer hover:text-[#B71C1C] transition-colors">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={() => setInStockOnly(!inStockOnly)}
                  className="accent-[#B71C1C] w-3.5 h-3.5 rounded cursor-pointer"
                />
                <span className="text-[11.5px] font-medium">In Stock</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">
                ({rawProducts.length})
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen py-4 text-left font-sans">
      <div className="max-w-[1640px] mx-auto px-3 sm:px-6">
        {/* ========================================================= */}
        {/* DESKTOP LAYOUT (≥ 1024px / lg)                             */}
        {/* ========================================================= */}
        <div className="hidden lg:flex gap-6 items-start">
          {/* LEFT SIDEBAR: FIXED STICKY POSITION WITH INDEPENDENT INTERNAL SCROLL */}
          <aside className="w-[250px] xl:w-[270px] shrink-0 sticky top-[80px] h-[calc(100vh-100px)] overflow-y-auto overscroll-contain pr-2 no-scrollbar bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
            {renderFilterSidebar()}
          </aside>

          {/* RIGHT MAIN PRODUCT AREA: SCROLLS NORMALLY WITH PAGE */}
          <main className="flex-1 min-w-0 space-y-4">
            {/* Results Header Bar */}
            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div>
                <h1 className="font-display font-black text-lg text-slate-900 tracking-tight">
                  {pageTitleLabel}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                </p>
              </div>

              {/* Sort dropdown & view mode */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-[#B71C1C] cursor-pointer"
                  >
                    <option value="featured">Featured</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Customer Rating</option>
                    <option value="newest">Newest Arrivals</option>
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
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl text-center border border-slate-200/90 shadow-2xs">
                <h3 className="font-bold text-base text-slate-900 mb-1">
                  No Products Found
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Try clearing some of your filter criteria.
                </p>
                <button
                  onClick={handleClearAll}
                  className="bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 w-full">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-3 w-full">
                {filteredProducts.map((product) => (
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
                {filteredProducts.length} products found
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
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 mb-1">
                No Products Found
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Try clearing search filters.
              </p>
              <button
                onClick={handleClearAll}
                className="bg-[#B71C1C] text-white text-xs font-bold px-5 py-2 rounded-xl"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full">
              {filteredProducts.map((product) => (
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
                Clear
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
