import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import api from '../utils/api';
import { Menu, SlidersHorizontal, ChevronDown, Check, X, Filter, EyeOff, Star } from 'lucide-react';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categoriesTree, setCategoriesTree] = useState([]);
  const [brands, setBrands] = useState([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Selected Filter States
  const [selectedCategory, setSelectedCategory] = useState(slug || searchParams.get('category') || searchParams.get('categoryId') || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || searchParams.get('subcategoryId') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [selectedGender, setSelectedGender] = useState(searchParams.get('gender') || '');
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('search') || searchParams.get('keyword') || '');
  const [priceRange, setPriceRange] = useState(10000);

  const [deliveryDayFilter, setDeliveryDayFilter] = useState('');
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    fetchMetadata();
    window.addEventListener('karviyam_categories_updated', fetchMetadata);
    return () => window.removeEventListener('karviyam_categories_updated', fetchMetadata);
  }, []);

  useEffect(() => {
    const cat = slug || searchParams.get('category') || searchParams.get('categoryId') || '';
    const sub = searchParams.get('subcategory') || searchParams.get('subcategoryId') || '';
    const brd = searchParams.get('brand') || '';
    const gnd = searchParams.get('gender') || '';
    const srch = searchParams.get('search') || searchParams.get('keyword') || '';

    setSelectedCategory(cat);
    setSelectedSubcategory(sub);
    setSelectedBrand(brd);
    setSelectedGender(gnd);
    setSearchKeyword(srch);
  }, [searchParams, slug]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedSubcategory, selectedBrand, selectedGender, searchKeyword, priceRange, sortBy, sortDir, freeShippingOnly, deliveryDayFilter, selectedRating]);

  const fetchMetadata = async () => {
    try {
      const catRes = await api.get('/categories/tree');
      const catData = catRes.data ? catRes.data : catRes;
      setCategoriesTree(Array.isArray(catData.data) ? catData.data : (Array.isArray(catData) ? catData : []));

      const brandRes = await api.get('/brands');
      const brandData = brandRes.data ? brandRes.data : brandRes;
      setBrands(Array.isArray(brandData.data) ? brandData.data : (Array.isArray(brandData) ? brandData : []));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        category: selectedCategory,
        subcategory: selectedSubcategory,
        brand: selectedBrand,
        gender: selectedGender,
        search: searchKeyword,
        maxPrice: priceRange,
        sort: sortBy,
        dir: sortDir,
        size: 20
      };

      const res = await api.get('/products', { params });
      const apiData = res.data ? res.data : res;
      let list = Array.isArray(apiData.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);

      if (freeShippingOnly) {
        list = list.filter(p => p.freeShipping || p.price > 499);
      }
      if (selectedRating > 0) {
        list = list.filter(p => (p.rating || 4.0) >= selectedRating);
      }

      setProducts(list);
    } catch (e) {
      console.error(e);
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
    setDeliveryDayFilter('');
    setFreeShippingOnly(false);
    setSelectedRating(0);
    setSearchParams({});
  };

  // Sidebar Component for Desktop & Mobile Slide-over Drawer
  const SidebarFilterContent = () => (
    <div className="space-y-6 text-xs text-slate-800">
      
      {/* 1. Popular Shopping Ideas */}
      <div className="border-b border-slate-200 pb-4 space-y-2">
        <h4 className="font-bold text-slate-900 text-xs tracking-tight">Popular Shopping Ideas</h4>
        <ul className="space-y-1.5 text-slate-700 font-medium text-[11.5px]">
          <li onClick={() => setSearchKeyword('Shirts')} className="hover:text-[#B71C1C] cursor-pointer">Shirts</li>
          <li onClick={() => setSearchKeyword('T-Shirts')} className="hover:text-[#B71C1C] cursor-pointer">T-Shirts</li>
          <li onClick={() => setSearchKeyword('Kurtas')} className="hover:text-[#B71C1C] cursor-pointer">Kurtas</li>
          <li onClick={() => setSearchKeyword('Ethnic Wear')} className="hover:text-[#B71C1C] cursor-pointer">Ethnic Wear</li>
        </ul>
      </div>

      {/* 2. Delivery Day */}
      <div className="border-b border-slate-200 pb-4 space-y-2">
        <h4 className="font-bold text-slate-900 text-xs tracking-tight">Delivery Day</h4>
        <div className="space-y-1.5 font-medium">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={deliveryDayFilter === '1'}
              onChange={(e) => setDeliveryDayFilter(e.target.checked ? '1' : '')}
              className="accent-[#B71C1C] w-3.5 h-3.5 rounded"
            />
            <span>Get It by Tomorrow</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={deliveryDayFilter === '2'}
              onChange={(e) => setDeliveryDayFilter(e.target.checked ? '2' : '')}
              className="accent-[#B71C1C] w-3.5 h-3.5 rounded"
            />
            <span>Get It in 2 Days</span>
          </label>
        </div>
      </div>

      {/* 3. Eligible for Free Delivery */}
      <div className="border-b border-slate-200 pb-4 space-y-1.5">
        <h4 className="font-bold text-slate-900 text-xs tracking-tight">Eligible for Free Delivery</h4>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={freeShippingOnly}
            onChange={(e) => setFreeShippingOnly(e.target.checked)}
            className="accent-[#B71C1C] w-3.5 h-3.5 rounded mt-0.5"
          />
          <div>
            <span className="font-bold text-slate-900 block">Free Shipping</span>
            <span className="text-[10px] text-slate-500 block leading-tight">
              Get FREE Shipping on eligible orders shipped by Karviyam
            </span>
          </div>
        </label>
      </div>

      {/* 4. Brands */}
      <div className="border-b border-slate-200 pb-4 space-y-2">
        <h4 className="font-bold text-slate-900 text-xs tracking-tight">Brands</h4>
        <div className="space-y-1.5 font-medium">
          {['KARVIYAM', 'AUSK', 'NOBLE MONK', 'CB-COLEBROOK', 'DEELMO', 'ROYALSCOUT', 'LYMIO'].map((b) => (
            <label key={b} className="flex items-center gap-2 cursor-pointer hover:text-[#B71C1C]">
              <input
                type="checkbox"
                checked={selectedBrand === b}
                onChange={() => setSelectedBrand(selectedBrand === b ? '' : b)}
                className="accent-[#B71C1C] w-3.5 h-3.5 rounded"
              />
              <span className="uppercase text-[11px]">{b}</span>
            </label>
          ))}
          <span className="text-[11px] font-bold text-sky-700 hover:underline cursor-pointer block pt-1">
            ∨ See more
          </span>
        </div>
      </div>

      {/* 5. Karviyam Fashion */}
      <div className="border-b border-slate-200 pb-4 space-y-2">
        <h4 className="font-bold text-slate-900 text-xs tracking-tight">Karviyam Fashion</h4>
        <div className="space-y-1.5 font-medium">
          {['Top Brands', 'Made for Karviyam', 'Premium Brands'].map((f) => (
            <label key={f} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-[#B71C1C] w-3.5 h-3.5 rounded" />
              <span>{f}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 6. Customer Reviews */}
      <div className="space-y-2">
        <h4 className="font-bold text-slate-900 text-xs tracking-tight">Customer Reviews</h4>
        <div className="space-y-1.5">
          {[4, 3, 2, 1].map((stars) => (
            <div
              key={stars}
              onClick={() => setSelectedRating(selectedRating === stars ? 0 : stars)}
              className={`flex items-center gap-1.5 cursor-pointer py-0.5 ${
                selectedRating === stars ? 'font-bold text-[#B71C1C]' : 'text-slate-700 hover:text-[#B71C1C]'
              }`}
            >
              <div className="flex text-amber-400 text-xs">
                {'★'.repeat(stars)}
                {'☆'.repeat(5 - stars)}
              </div>
              <span className="text-[11px]">& Up</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 py-3">
      
      {/* Mobile Filter Button Bar (< 1024px) */}
      <div className="lg:hidden flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
        <div>
          <h1 className="font-display font-black text-lg text-slate-900">Results</h1>
          <p className="text-[10.5px] text-slate-500">Showing {products.length} products</p>
        </div>
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="flex items-center gap-2 bg-[#B71C1C] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Main 2-Column Desktop Layout (Independent Scroll Containers) */}
      <div className="flex gap-8 items-start">
        
        {/* Left Sidebar (Desktop Sticky Independent Scroll Container) */}
        <div className="hidden lg:block w-[230px] shrink-0 border-r border-slate-200/90 pr-4 space-y-6 sticky top-[130px] h-[calc(100vh-145px)] overflow-y-auto overscroll-contain scrollbar-thin">
          <SidebarFilterContent />
        </div>

        {/* Right Main Catalogue Product Grid (Independent Scroll Container) */}
        <div className="flex-1 space-y-4 h-[calc(100vh-145px)] overflow-y-auto overscroll-contain pr-2 scrollbar-thin">
          
          {/* Results Header Banner */}
          <div className="border-b border-slate-200 pb-3">
            <h2 className="font-display font-bold text-lg text-slate-900">
              Results
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Check each product page for other buying options. Price and other details may vary based on product size and colour.
            </p>
          </div>

          {/* Product Grid: Strict Equal Heights & Alignment */}
          {loading ? (
            <SkeletonLoader count={8} />
          ) : products.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl text-center border border-slate-200">
              <h3 className="font-bold text-base text-slate-900 mb-1">No Products Found</h3>
              <p className="text-xs text-slate-500 mb-4">Try clearing some of your filter criteria.</p>
              <button
                onClick={clearFilters}
                className="bg-[#B71C1C] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full pb-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Mobile Slide-Over Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-xs justify-start">
          <div className="w-[300px] max-w-full bg-white h-full shadow-2xl flex flex-col justify-between p-5 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase">Filters</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="text-slate-500 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4">
              <SidebarFilterContent />
            </div>
            <div className="border-t border-slate-200 pt-3 flex gap-2">
              <button onClick={clearFilters} className="w-1/2 py-2 text-xs font-bold border border-slate-300 rounded-lg">
                Clear
              </button>
              <button onClick={() => setMobileFilterOpen(false)} className="w-1/2 py-2 text-xs font-bold bg-[#B71C1C] text-white rounded-lg">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
