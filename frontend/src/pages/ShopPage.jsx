import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate, useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';
import {
  Menu,
  SlidersHorizontal,
  ChevronDown,
  Check,
  X,
  Filter,
  EyeOff,
  Star,
  ArrowLeft,
  Search,
  Camera,
  Mic,
  QrCode,
  Bell,
  ShoppingBag,
  PlusSquare,
  Heart,
  ShoppingCart,
  Home,
  Grid,
  User
} from 'lucide-react';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { addToCart, itemCount } = useCart();
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categoriesTree, setCategoriesTree] = useState([]);
  const [brands, setBrands] = useState([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [expressOnly, setExpressOnly] = useState(false);
  const [fitsYou, setFitsYou] = useState(false);

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
  }, [selectedCategory, selectedSubcategory, selectedBrand, selectedGender, searchKeyword, priceRange, sortBy, sortDir, freeShippingOnly, deliveryDayFilter, selectedRating, expressOnly]);

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
      let list = [];
      try {
        const res = await api.get('/products?size=200').catch(() => api.get('/products'));
        const apiData = res?.data ? res.data : res;
        list = Array.isArray(apiData?.data) ? apiData.data : (Array.isArray(apiData?.content) ? apiData.content : (Array.isArray(apiData) ? apiData : []));
      } catch (eApi) {}

      try {
        const savedAdmin = localStorage.getItem('karviyam_admin_products');
        if (savedAdmin) {
          const parsed = JSON.parse(savedAdmin);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach(adminProd => {
              if (adminProd && adminProd.id) {
                const existingIdx = list.findIndex(p => String(p.id) === String(adminProd.id) || (p.sku && adminProd.sku && String(p.sku) === String(adminProd.sku)));
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

      if (selectedCategory && selectedCategory.trim() !== '') {
        const catClean = selectedCategory.trim().toLowerCase();
        list = list.filter(p => {
          const pCatId = String(p.categoryId || p.category_id || p.category?.id || '').toLowerCase();
          const pCatName = String(p.categoryName || p.category || p.category?.name || '').toLowerCase();
          const pGender = String(p.gender || p.genderCategory || '').toLowerCase();
          const pSubcat = String(p.subcategory || p.subCategory || '').toLowerCase();
          const pName = String(p.name || '').toLowerCase();
          const pDesc = String(p.description || '').toLowerCase();
          const pTags = String(p.tags || '').toLowerCase();

          return (
            pCatId === catClean ||
            pCatName.includes(catClean) ||
            pGender.includes(catClean) ||
            pSubcat.includes(catClean) ||
            pName.includes(catClean) ||
            pDesc.includes(catClean) ||
            pTags.includes(catClean)
          );
        });
      }

      if (searchKeyword && searchKeyword.trim() !== '') {
        const kw = searchKeyword.trim().toLowerCase();
        list = list.filter(p => {
          const pName = String(p.name || '').toLowerCase();
          const pBrand = String(p.brand || '').toLowerCase();
          const pDesc = String(p.description || '').toLowerCase();
          const pSku = String(p.sku || '').toLowerCase();
          return pName.includes(kw) || pBrand.includes(kw) || pDesc.includes(kw) || pSku.includes(kw);
        });
      }

      if (selectedBrand && selectedBrand.trim() !== '') {
        list = list.filter(p => String(p.brand || '').toLowerCase().includes(selectedBrand.toLowerCase()));
      }
      if (freeShippingOnly || expressOnly) {
        list = list.filter(p => p.freeShipping || p.price > 399);
      }
      if (selectedRating > 0) {
        list = list.filter(p => (p.rating || 4.0) >= selectedRating);
      }
      if (priceRange && priceRange > 0) {
        list = list.filter(p => (p.price || 0) <= priceRange);
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
    setExpressOnly(false);
    setFitsYou(false);
    setSelectedRating(0);
    setSearchParams({});
  };

  const SidebarFilterContent = () => (
    <div className="space-y-6 text-xs text-slate-800">
      <div className="border-b border-slate-200 pb-4 space-y-2">
        <h4 className="font-bold text-slate-900 text-xs tracking-tight">Popular Shopping Ideas</h4>
        <ul className="space-y-1.5 text-slate-700 font-medium text-[11.5px]">
          <li onClick={() => setSearchKeyword('Shirts')} className="hover:text-[#B71C1C] cursor-pointer">Shirts</li>
          <li onClick={() => setSearchKeyword('T-Shirts')} className="hover:text-[#B71C1C] cursor-pointer">T-Shirts</li>
          <li onClick={() => setSearchKeyword('Kurtas')} className="hover:text-[#B71C1C] cursor-pointer">Kurtas</li>
          <li onClick={() => setSearchKeyword('Ethnic Wear')} className="hover:text-[#B71C1C] cursor-pointer">Ethnic Wear</li>
        </ul>
      </div>

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
        </div>
      </div>
    </div>
  );

  const getDeliveryDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  };

  return (
    <div className="w-full mx-auto">
      
      <div className="block md:hidden bg-slate-50 min-h-screen pb-32">
        
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs px-3 py-2 space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1 text-[#B71C1C] shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 flex items-center bg-slate-100/90 rounded-full px-3 py-1.5 gap-2 border border-slate-200 shadow-inner">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="mens shirt"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <Camera className="w-4 h-4 text-[#B71C1C]/80 shrink-0 cursor-pointer" />
              <Mic className="w-4 h-4 text-[#B71C1C]/80 shrink-0 cursor-pointer" />
              <QrCode className="w-4 h-4 text-[#B71C1C]/80 shrink-0 cursor-pointer" />
            </div>
          </div>

          <div className="flex items-center justify-between px-1 pt-0.5">
            <div onClick={() => navigate('/')} className="flex items-center gap-1.5 cursor-pointer">
              <svg className="w-5 h-5 fill-[#B71C1C]" viewBox="0 0 24 24">
                <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6zm-4 9.5c0-2 4-3.1 4-3.1s4 1.1 4 3.1V16H8v-0.5z"/>
              </svg>
              <span className="font-display font-black text-lg tracking-tight text-[#B71C1C] uppercase leading-none">
                KARVIYAM
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-700">
              <div className="relative cursor-pointer">
                <Bell className="w-5 h-5 text-slate-800" />
                <span className="absolute -top-1 -right-1 bg-[#B71C1C] text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  3
                </span>
              </div>
              <div onClick={() => navigate('/cart')} className="relative cursor-pointer">
                <ShoppingBag className="w-5 h-5 text-slate-800" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#B71C1C] text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap text-xs font-bold text-slate-800">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-full px-3 py-1.5 text-xs font-bold text-slate-800 shrink-0 shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-700" />
            <span>Filters</span>
          </button>

          <button
            onClick={() => setExpressOnly(!expressOnly)}
            className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-xs font-extrabold shrink-0 shadow-2xs transition-colors ${
              expressOnly ? 'bg-red-50 border-[#B71C1C] text-[#B71C1C]' : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <span className="text-[#B71C1C] font-black">✔ Express</span>
            <div className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-colors ${expressOnly ? 'bg-[#B71C1C] justify-end' : 'bg-slate-300 justify-start'}`}>
              <div className="w-3 h-3 bg-white rounded-full shadow-xs"></div>
            </div>
          </button>

          <button
            onClick={() => setFitsYou(!fitsYou)}
            className={`border rounded-full px-3 py-1.5 text-xs font-bold shrink-0 shadow-2xs ${
              fitsYou ? 'bg-red-50 border-[#B71C1C] text-[#B71C1C]' : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            Fits you
          </button>

          <button className="bg-slate-50 border border-slate-300 rounded-full px-3 py-1.5 text-xs font-bold text-slate-800 shrink-0">
            •••
          </button>

          <button className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-full px-3 py-1.5 text-xs font-bold text-slate-800 shrink-0">
            <span>Most Popular</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>

        <main className="px-2 py-3">
          {loading ? (
            <SkeletonLoader count={6} />
          ) : products.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 mx-2">
              <h3 className="font-bold text-sm text-slate-900 mb-1">No Products Found</h3>
              <p className="text-xs text-slate-500 mb-3">Try clearing search filters.</p>
              <button onClick={clearFilters} className="bg-[#B71C1C] text-white text-xs font-bold px-5 py-2 rounded-xl">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 w-full">
              {products.map((product) => {
                const price = product.price || 370;
                const oldPrice = product.oldPrice || Math.round(price * 4.2);
                const disc = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 81;
                const rating = product.rating || 4.0;
                const reviews = product.reviewsCount || ((product.id * 137) % 800 + 120);
                const boughtCount = (product.id ? (product.id * 230) % 800 + 100 : 200);
                const colorsCount = Array.isArray(product.images) && product.images.length > 1 ? product.images.length : (product.id ? (product.id * 3) % 9 + 4 : 6);
                const brandName = product.brand || 'DEELMO';
                const isLiked = isInWishlist(product.id);

                return (
                  <div
                    key={product.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between shadow-2xs relative"
                  >
                    <div
                      className="relative w-full h-[220px] bg-slate-50 overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <img
                        src={product.imageUrl || product.image || (Array.isArray(product.images) && product.images[0]) || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600'}
                        alt={product.name}
                        className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                      />
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-slate-700 hover:text-[#B71C1C]"
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#B71C1C] text-[#B71C1C]' : 'text-slate-700'}`} />
                      </button>

                      <div className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-white/90 shadow-2xs flex items-center justify-center text-slate-700">
                        <PlusSquare className="w-4 h-4 text-slate-700" />
                      </div>

                      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9.5px] font-bold text-slate-800 shadow-2xs border border-slate-200">
                        {colorsCount} colours
                      </div>
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                      <div>
                        <span className="text-[9px] font-black text-[#B71C1C] tracking-wider uppercase block">
                          KARVIYAM ESSENTIALS
                        </span>

                        <h4 className="text-xs font-black text-slate-900 uppercase truncate leading-tight mt-0.5">
                          {brandName}
                        </h4>

                        <p
                          className="text-[11px] font-medium text-slate-700 line-clamp-2 leading-tight mt-0.5 cursor-pointer"
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                          {product.name}
                        </p>

                        <div className="mt-1 flex items-center gap-1 text-[10.5px]">
                          <span className="font-bold text-slate-900">{rating}</span>
                          <div className="flex text-amber-500 text-[10px]">
                            {'★'.repeat(Math.floor(rating))}
                            {'☆'.repeat(5 - Math.floor(rating))}
                          </div>
                          <span className="text-slate-500 font-medium">({reviews})</span>
                        </div>

                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                          {boughtCount}+ bought in past month
                        </p>
                      </div>

                      <div>
                        <div className="mt-1.5 flex items-baseline gap-1 flex-wrap">
                          <span className="text-sm font-black text-slate-900">₹{price}</span>
                          <span className="text-[10px] text-slate-400 line-through">M.R.P. ₹{oldPrice}</span>
                          <span className="text-[10px] font-extrabold text-[#B71C1C]">({disc}% off)</span>
                        </div>

                        <p className="text-[10px] font-semibold text-slate-800 mt-0.5">
                          FREE delivery <span className="font-bold text-slate-900">{getDeliveryDateStr()}</span>
                        </p>

                        <button
                          onClick={() => {
                            addToCart(product, 1);
                            toast.success('Added to bag!');
                          }}
                          className="w-full mt-2 bg-[#B71C1C] hover:bg-[#900C0C] active:scale-98 text-white py-1.5 px-2 rounded-lg text-[11.5px] font-extrabold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <div className="fixed bottom-12 left-0 right-0 z-30 bg-[#B71C1C] text-white px-3.5 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <div className="bg-white text-[#B71C1C] font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-tight shadow-2xs">
              KARVIYAM bazaar
            </div>
            <span className="font-extrabold text-xs tracking-wide">
              Crazy prices for you!
            </span>
          </div>
          <button onClick={() => navigate('/shop')} className="text-xs font-black hover:underline cursor-pointer flex items-center gap-0.5">
            <span>See all</span>
            <span>&gt;</span>
          </button>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 py-1.5 px-4 flex items-center justify-between shadow-xl">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
              location.pathname === '/' ? 'text-[#B71C1C]' : 'text-slate-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => navigate('/shop')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
              location.pathname.startsWith('/shop') ? 'text-[#B71C1C]' : 'text-slate-600'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span>Categories</span>
          </button>

          <button
            onClick={() => navigate('/wishlist')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
              location.pathname === '/wishlist' ? 'text-[#B71C1C]' : 'text-slate-600'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span>Wishlist</span>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
              location.pathname === '/profile' ? 'text-[#B71C1C]' : 'text-slate-600'
            }`}
          >
            <User className="w-5 h-5" />
            <span>Account</span>
          </button>

          <button
            onClick={() => navigate('/cart')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold relative ${
              location.pathname === '/cart' ? 'text-[#B71C1C]' : 'text-slate-600'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#B71C1C] text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </div>
            <span>Bag</span>
          </button>
        </nav>

      </div>

      <div className="hidden md:block w-full max-w-[1700px] mx-auto px-4 sm:px-8 py-3">
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

        <div className="flex gap-8 items-start">
          <div className="hidden lg:block w-[230px] shrink-0 border-r border-slate-200/90 pr-4 space-y-6 sticky top-[130px] h-[calc(100vh-145px)] overflow-y-auto overscroll-contain scrollbar-thin">
            <SidebarFilterContent />
          </div>

          <div className="flex-1 space-y-4 h-[calc(100vh-145px)] overflow-y-auto overscroll-contain pr-2 scrollbar-thin">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="font-display font-bold text-lg text-slate-900">
                Results
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Check each product page for other buying options. Price and other details may vary based on product size and colour.
              </p>
            </div>

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
      </div>

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
