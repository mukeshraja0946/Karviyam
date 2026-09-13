import React, { useState } from 'react';
import { X, MapPin, ShoppingBag, CreditCard, Banknote, Smartphone, QrCode, ArrowLeft, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';

export default function OrderConfirmationModal({
  isOpen,
  onClose,
  address,
  onChangeAddress,
  items = [],
  subtotal = 0,
  discount = 0,
  couponDiscount = 0,
  shippingCharge = 0,
  totalAmount = 0,
  paymentMethod = 'COD',
  onChangePayment,
  onBack,
  onConfirm,
  submitting = false
}) {
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(true);

  if (!isOpen) return null;

  // Format currency helper
  const fmt = (val) => {
    const n = Number(val) || 0;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  // Payment Method Display details
  const getPaymentMethodInfo = () => {
    switch (paymentMethod) {
      case 'COD':
        return {
          label: 'Cash on Delivery (COD)',
          desc: 'Pay cash upon doorstep delivery',
          icon: Banknote,
          colorClass: 'text-amber-700 bg-amber-50 border-amber-200'
        };
      case 'UPI':
        return {
          label: 'Online Payment — Razorpay UPI',
          desc: 'Pay securely using GPay, PhonePe, Paytm or Cards',
          icon: Smartphone,
          colorClass: 'text-purple-700 bg-purple-50 border-purple-200'
        };
      case 'UPI_QR':
        return {
          label: 'UPI QR Code',
          desc: 'Scan QR using any supported UPI application',
          icon: QrCode,
          colorClass: 'text-rose-700 bg-rose-50 border-rose-200'
        };
      default:
        return {
          label: 'Cash on Delivery (COD)',
          desc: 'Pay cash upon doorstep delivery',
          icon: Banknote,
          colorClass: 'text-amber-700 bg-amber-50 border-amber-200'
        };
    }
  };

  const payInfo = getPaymentMethodInfo();
  const PayIcon = payInfo.icon;

  const totalDiscount = (Number(discount) || 0) + (Number(couponDiscount) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#B71C1C]/20 border border-[#B71C1C]/40 flex items-center justify-center text-[#B71C1C]">
              <ShieldCheck className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="font-display font-black text-base text-white tracking-tight">Confirm Your Order</h2>
              <p className="text-[11px] text-slate-400 font-medium">Step 4 of 4: Review delivery details and confirm order</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Scrollable Container */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">

          {/* 1. DELIVERY ADDRESS */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#B71C1C]" />
                <span>DELIVERY ADDRESS</span>
              </span>

              {onChangeAddress && (
                <button
                  type="button"
                  onClick={onChangeAddress}
                  disabled={submitting}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  Change Address
                </button>
              )}
            </div>

            {address ? (
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-slate-800 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-800 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase">
                    📍 {address.addressType || 'HOME'}
                  </span>
                  <span className="font-extrabold text-slate-900 text-xs">{address.fullName || address.name}</span>
                </div>
                <p className="text-slate-600 font-medium leading-relaxed">
                  {address.houseFlatNo ? `${address.houseFlatNo}, ` : ''}{address.streetAddress || address.address}
                </p>
                <p className="text-slate-600 font-medium">
                  {address.city}, {address.state || 'Tamil Nadu'} — <span className="font-bold text-slate-900">{address.pincode}</span>
                </p>
                <p className="text-slate-500 font-medium text-[11px] pt-0.5">
                  📞 Phone: <span className="font-bold text-slate-800">{address.phone}</span>
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl font-bold flex items-center justify-between">
                <span>Please select or add a delivery address to place your order.</span>
                <button
                  type="button"
                  onClick={onChangeAddress}
                  className="px-3 py-1 bg-[#B71C1C] text-white text-xs font-bold rounded-lg"
                >
                  Add Address
                </button>
              </div>
            )}
          </div>

          {/* 2. ORDER ITEMS */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-[#B71C1C]" />
                <span>ORDER ITEMS ({items.length})</span>
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
              {items.map((item, idx) => {
                const itemImg = item.productImage || item.imageUrl || (Array.isArray(item.images) && item.images[0]) || '';
                const itemPrice = Number(item.price) || 0;
                const itemQty = Math.max(1, Number(item.quantity) || 1);
                const itemOldPrice = Number(item.oldPrice || item.old_price) || 0;

                return (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={resolveImageUrl(itemImg, item.productId || item.id)}
                        onError={(e) => handleImageError(e, item.productId || item.id)}
                        alt={item.productName || item.name}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                      />
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 text-xs truncate">{item.productName || item.name}</p>
                        {item.brand && <p className="text-[10px] text-slate-500 font-semibold">{item.brand}</p>}
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-600 font-medium">
                          {item.selectedSize && <span>Size: <strong className="text-slate-800">{item.selectedSize}</strong></span>}
                          {item.selectedColor && <span>Color: <strong className="text-slate-800">{item.selectedColor}</strong></span>}
                          <span>Qty: <strong className="text-slate-800">{itemQty}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-[#B71C1C] text-xs">{fmt(itemPrice * itemQty)}</p>
                      {itemOldPrice > itemPrice && (
                        <p className="text-[10px] text-slate-400 line-through">{fmt(itemOldPrice * itemQty)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. PRICE DETAILS */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Tag className="w-4 h-4 text-[#B71C1C]" />
              <span>PRICE DETAILS</span>
            </span>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 font-medium">
              <div className="flex items-center justify-between text-slate-600">
                <span>Product Total</span>
                <span className="font-bold text-slate-800">{fmt(subtotal)}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-bold">
                  <span>Discount & Offers</span>
                  <span>-{fmt(totalDiscount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span>{shippingCharge > 0 ? fmt(shippingCharge) : <strong className="text-emerald-600 uppercase">FREE</strong>}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-900 font-black text-sm">
                <span>Total Payable</span>
                <span className="text-[#B71C1C] text-base">{fmt(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* 4. PAYMENT METHOD */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#B71C1C]" />
                <span>SELECTED PAYMENT METHOD</span>
              </span>

              {onChangePayment && (
                <button
                  type="button"
                  onClick={onChangePayment}
                  disabled={submitting}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  Change Payment
                </button>
              )}
            </div>

            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${payInfo.colorClass}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center border border-slate-200">
                  <PayIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900">{payInfo.label}</p>
                  <p className="text-[10.5px] text-slate-600 font-medium">{payInfo.desc}</p>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>
          </div>

          {/* 5. CONFIRMATION CHECKBOX */}
          <label className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer select-none bg-slate-50 border border-slate-200">
            <input
              type="checkbox"
              checked={confirmedCheckbox}
              onChange={(e) => setConfirmedCheckbox(e.target.checked)}
              disabled={submitting}
              className="w-4 h-4 rounded border-slate-300 text-[#B71C1C] focus:ring-[#B71C1C] cursor-pointer"
            />
            <span className="font-bold text-slate-700 text-xs">
              I confirm that my delivery address, cart items, and order details are correct.
            </span>
          </label>

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onBack || onClose}
            disabled={submitting}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting || !confirmedCheckbox || !address}
            className="px-6 py-3 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-black text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>CONFIRM ORDER & PAY ({fmt(totalAmount)})</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
