import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, Tag, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../utils/api';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, itemCount, cartSubtotal, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      const res = await api.get(`/coupons/validate/${encodeURIComponent(couponCode.trim())}`);
      if (res?.success) {
        const coupon = res.data;
        let discount = 0;
        if (coupon.discountType === 'PERCENTAGE') {
          discount = (cartSubtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
            discount = coupon.maxDiscountAmount;
          }
        } else {
          discount = coupon.discountValue;
        }
        setAppliedCoupon(coupon);
        setDiscountAmount(discount);
        toast.success(`Coupon ${coupon.code} applied! Saved ₹${discount}`);
      }
    } catch (err) {
      toast.error(err.message || 'Invalid coupon code');
    }
  };

  const shippingCost = cartSubtotal > 999 || cartSubtotal === 0 ? 0 : 99;
  const finalTotal = Math.max(0, cartSubtotal - discountAmount + shippingCost);

  const cartItems = (cart?.items || []).filter(Boolean);

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="w-full px-4 sm:px-8 lg:px-12 py-20 max-w-7xl mx-auto text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="font-display font-black text-2xl mb-2 text-slate-900">Your Bag is Empty</h2>
        <p className="text-xs text-slate-500 mb-6">Looks like you haven't added anything to your bag yet.</p>
        <button
          onClick={() => navigate('/shop')}
          className="bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider px-8 py-3.5 rounded-full shadow-md cursor-pointer transition-all"
        >
          Explore Catalog →
        </button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-12 max-w-7xl mx-auto space-y-8">
      <h1 className="font-display font-black text-3xl text-slate-900">Shopping Bag ({itemCount})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const prodName = item.product?.name || item.productName || item.name || 'Karviyam Product';
            const prodPrice = Number(item.product?.price || item.price || 0);
            const prodImg = resolveImageUrl(item.product?.imageUrl || item.imageUrl || item.productImage || item.image, item.id);

            return (
              <div
                key={item.id}
                className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs"
              >
                <img
                  src={prodImg}
                  alt={prodName}
                  onError={(e) => handleImageError(e, item.id)}
                  className="w-24 h-24 object-cover rounded-2xl bg-slate-100 border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-extrabold text-sm text-slate-900 truncate">
                    {prodName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Size: <span className="font-bold text-slate-900">{item.selectedSize || 'M'}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-display font-black text-sm text-slate-900">
                      ₹{prodPrice}
                    </span>
                  </div>
                </div>

                {/* Quantity Modifier */}
                <div className="flex items-center bg-slate-100 rounded-full border border-slate-200 px-3 py-1">
                  <button
                    onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                    className="px-2 font-bold text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3 font-bold text-xs text-slate-900">{item.quantity || 1}</span>
                  <button
                    onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                    className="px-2 font-bold text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-slate-400 hover:text-[#B71C1C] transition-colors cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Order Summary Sidebar */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs h-fit space-y-6">
          <h3 className="font-display font-extrabold text-lg text-slate-900 border-b border-slate-100 pb-4">
            Order Summary
          </h3>

          {/* Coupon Form */}
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Promo Code (KARVIYAM10)"
              className="bg-slate-50 text-xs px-4 py-2.5 rounded-full border border-slate-200 focus:outline-none focus:border-[#B71C1C] flex-1 uppercase font-bold text-slate-900"
            />
            <button
              type="submit"
              className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full hover:bg-[#B71C1C] cursor-pointer transition-colors"
            >
              Apply
            </button>
          </form>

          {appliedCoupon && (
            <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-200">
              <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> {appliedCoupon.code}</span>
              <span>-₹{discountAmount}</span>
            </div>
          )}

          <div className="space-y-3 text-xs border-b border-slate-100 pb-4 text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">₹{cartSubtotal}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Discount</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Estimated Shipping</span>
              <span className="font-bold text-slate-900">
                {shippingCost === 0 ? <span className="text-emerald-700">FREE</span> : `₹${shippingCost}`}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-baseline pt-2">
            <span className="font-display font-extrabold text-sm text-slate-900">Total Amount</span>
            <span className="font-display font-black text-2xl text-[#B71C1C]">₹{finalTotal}</span>
          </div>

          <button
            onClick={() => navigate('/checkout', { state: { couponCode: appliedCoupon ? appliedCoupon.code : null } })}
            className="w-full flex items-center justify-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider py-4 rounded-full transition-colors shadow-md cursor-pointer"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
