import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Sparkles, Copy, Check, ArrowRight, Flame } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import toast from 'react-hot-toast';

export default function OffersPage() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    fetchOffersData();
  }, []);

  const fetchOffersData = async () => {
    setLoading(true);
    try {
      const [couponsRes, prodsRes] = await Promise.all([
        api.get('/coupons').catch(() => null),
        api.get('/products?size=40').catch(() => null)
      ]);

      // Process Coupons
      const cData = couponsRes?.data?.data || couponsRes?.data || couponsRes;
      let cList = Array.isArray(cData) ? cData : [];
      if (!cList || cList.length === 0) {
        cList = [
          { id: 1, code: 'FESTIVE30', discountPercentage: 30, description: 'Get 30% OFF on your order', minAmount: 999 },
          { id: 2, code: 'KARVIYAM500', discountAmount: 500, description: 'Flat ₹500 OFF on purchases above ₹2,499', minAmount: 2499 },
          { id: 3, code: 'WELCOME10', discountPercentage: 10, description: '10% OFF on your first purchase', minAmount: 499 }
        ];
      }
      setCoupons(cList.filter(c => c.isActive !== false));

      // Process Products for Sale/Offers
      const pData = prodsRes?.data?.data || prodsRes?.data;
      let pList = Array.isArray(pData?.content) ? pData.content : (Array.isArray(pData) ? pData : []);
      
      const formattedProds = pList.map(p => {
        const rawPrice = Number(p.price) || 499;
        const rawOldPrice = Number(p.oldPrice || p.mrp || Math.round(rawPrice * 1.45));
        const discPercentage = Math.round(((rawOldPrice - rawPrice) / rawOldPrice) * 100);
        return {
          ...p,
          price: rawPrice,
          oldPrice: rawOldPrice,
          discountPercentage: discPercentage
        };
      });

      setProducts(formattedProds);
    } catch (e) {
      console.error('Error fetching offers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied to clipboard!`, { id: 'offer-toast' });
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-3">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-5">
        
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-red-950 via-[#B71C1C] to-rose-900 rounded-2xl p-5 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>SUPER SAVER DEALS</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight leading-tight drop-shadow-md">
              Exclusive Offers & Deals
            </h1>
            <p className="text-xs sm:text-sm text-rose-100 max-w-xl font-medium">
              Save big on premium streetwear, traditional wear, sneakers, and accessories with active coupons and discounts.
            </p>
          </div>
        </div>

        {/* Coupons List */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#B71C1C]" />
            <h2 className="font-display font-extrabold text-base sm:text-lg text-slate-900 uppercase">
              Active Promo Coupons
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {coupons.map((c) => (
              <div key={c.id || c.code} className="bg-white border border-rose-100 rounded-xl p-3.5 shadow-2xs flex items-center justify-between gap-3 hover:shadow-xs transition-shadow relative overflow-hidden">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-[#B71C1C] bg-rose-50 px-2 py-0.5 rounded border border-rose-200 uppercase tracking-wide">
                      {c.code}
                    </span>
                    {c.discountPercentage ? (
                      <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                        {c.discountPercentage}% OFF
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                        ₹{c.discountAmount} OFF
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium line-clamp-1">
                    {c.description || `Save on orders over ₹${c.minAmount || 499}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCode(c.code)}
                  className="bg-slate-900 hover:bg-[#B71C1C] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode === c.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Offer Products */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h2 className="font-display font-extrabold text-base sm:text-lg text-slate-900 uppercase">
                Trending Deals & Discounted Styles
              </h2>
            </div>
            <button
              onClick={() => navigate('/shop')}
              className="text-xs font-bold text-[#B71C1C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Shop</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <SkeletonLoader count={8} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
