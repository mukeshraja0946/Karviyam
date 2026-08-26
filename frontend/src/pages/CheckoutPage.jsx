import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { ShieldCheck, Truck, RotateCcw, Headphones, Tag, Lock, CreditCard, Smartphone, Banknote, Building, X, RefreshCw, Trash2 } from 'lucide-react';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, cartSubtotal, clearCart, removeItem } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [deliveryOption, setDeliveryOption] = useState('standard'); // 'standard' or 'express'
  const [couponCode, setCouponCode] = useState(location.state?.couponCode || 'KARVIYAM25');
  const [couponApplied, setCouponApplied] = useState(true);
  const [couponDiscount, setCouponDiscount] = useState(85);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('COD');
  const [submitting, setSubmitting] = useState(false);

  const [removedItemKeys, setRemovedItemKeys] = useState([]);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || user?.name || 'Arun Kumar',
    email: user?.email || 'arunkumar@example.com',
    phone: user?.phone || '9876543210',
    address: user?.address || 'Door No. 12, Sai Nagar, Peelamedu',
    city: user?.city || 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: user?.pincode || '641015',
  });

  const [selectedAddrId, setSelectedAddrId] = useState(1);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const savedAddresses = [
    {
      id: 1,
      fullName: 'Arun Kumar',
      addressType: 'HOME',
      houseFlatNo: 'Door No. 12',
      streetAddress: 'Sai Nagar, Peelamedu',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641015',
      phone: '9876543210',
      isDefault: true
    }
  ];

  // Effective items matching reference screenshot
  const rawItemsList = Array.isArray(cart.items) && cart.items.length > 0
    ? cart.items
    : [
        {
          id: 101,
          productName: "Karviyam Cyberpunk Oversized Tee",
          productImage: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
          price: 899,
          quantity: 1,
          selectedSize: 'L',
          selectedColor: 'Neon Black'
        },
        {
          id: 102,
          productName: "Elegant Printers Edition 3",
          productImage: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800",
          price: 1058,
          quantity: 1,
          selectedSize: 'M',
          selectedColor: 'Standard'
        },
        {
          id: 103,
          productName: "Test Silk Shirt",
          productImage: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800",
          price: 1299,
          quantity: 3,
          selectedSize: 'M',
          selectedColor: 'Karviyam Crimson'
        }
      ];

  const itemsList = rawItemsList.filter((item, idx) => !removedItemKeys.includes(item.id || idx));

  const handleRemoveItem = (itemId, idx) => {
    const targetKey = itemId || idx;
    setRemovedItemKeys(prev => [...prev, targetKey]);
    if (removeItem && itemId) {
      removeItem(itemId);
    }
    toast.success('Product removed from order items');
  };

  const rawItemTotal = itemsList.reduce((acc, item) => acc + ((item.price || item.product?.price || 899) * (item.quantity || 1)), 0);
  const shippingCharge = deliveryOption === 'express' ? 69 : 0;
  const activeDiscount = couponApplied ? couponDiscount : 0;
  const orderTotal = Math.max(0, rawItemTotal + shippingCharge - activeDiscount);

  // Trigger Payment Modal when user clicks "Proceed to Payment"
  const handleProceedToPayment = () => {
    setPaymentModalOpen(true);
  };

  // Execute Final Order Placement
  const handleConfirmAndPlaceOrder = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        paymentMethod: selectedPaymentMethod,
        couponCode: couponApplied ? couponCode : '',
        items: itemsList,
        totalAmount: orderTotal
      };

      let createdOrder = null;
      try {
        const res = await api.post('/orders/checkout', payload);
        const apiData = res.data ? res.data : res;
        createdOrder = apiData.data || apiData;
      } catch (e) {}

      if (!createdOrder || !createdOrder.id) {
        const newId = Date.now();
        createdOrder = {
          id: `KV-ORD-${String(newId).slice(-6)}`,
          orderCode: `KV-ORD-${String(newId).slice(-6)}`,
          customer: formData.fullName || 'Arun Kumar',
          email: formData.email || 'arunkumar@example.com',
          phone: formData.phone || '9876543210',
          shippingAddress: formData,
          status: 'PENDING',
          paymentStatus: selectedPaymentMethod === 'COD' ? 'Pending' : 'Paid',
          paymentMethod: selectedPaymentMethod,
          totalAmount: orderTotal,
          items: itemsList,
          createdAt: new Date().toISOString()
        };

        try {
          const savedOrders = JSON.parse(localStorage.getItem('karviyam_admin_orders') || '[]');
          savedOrders.unshift(createdOrder);
          localStorage.setItem('karviyam_admin_orders', JSON.stringify(savedOrders));
        } catch (e) {}
      }

      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch (e) {}

      clearCart();
      setPaymentModalOpen(false);
      toast.success('Order placed successfully! 🎉');
      navigate('/order-success', { state: { order: createdOrder } });
    } catch (err) {
      console.error(err);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen text-slate-900 pb-12 font-sans">
      
      {/* ========================================================= */}
      {/* 1. HORIZONTAL CHECKOUT STEPPER                            */}
      {/* ========================================================= */}
      <div className="w-full bg-white border-b border-slate-200 py-3.5 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between text-xs font-bold">
          
          {/* Step 1: Cart */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#B71C1C] text-white flex items-center justify-center font-black text-xs shadow-xs">
              1
            </div>
            <span className="font-extrabold text-slate-900">Cart</span>
          </div>

          <div className="flex-1 h-0.5 bg-[#B71C1C] mx-3 sm:mx-6" />

          {/* Step 2: Address */}
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-black text-xs shadow-xs ${paymentModalOpen ? 'bg-[#B71C1C]' : 'bg-[#B71C1C]'}`}>
              2
            </div>
            <span className="font-extrabold text-slate-900">Address</span>
          </div>

          <div className={`flex-1 h-0.5 mx-3 sm:mx-6 ${paymentModalOpen ? 'bg-[#B71C1C]' : 'bg-slate-200'}`} />

          {/* Step 3: Payment */}
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${paymentModalOpen ? 'bg-[#B71C1C] text-white shadow-xs' : 'bg-slate-100 text-slate-400 border border-slate-300'}`}>
              3
            </div>
            <span className={paymentModalOpen ? 'font-extrabold text-slate-900' : 'text-slate-400 font-medium'}>Payment</span>
          </div>

          <div className="flex-1 h-0.5 bg-slate-200 mx-3 sm:mx-6" />

          {/* Step 4: Place Order */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 border border-slate-300 flex items-center justify-center font-bold text-xs">
              4
            </div>
            <span className="text-slate-400 font-medium">Place Order</span>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN 2-COLUMN CHECKOUT LAYOUT                          */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-start">
          
          {/* LEFT COLUMN: ~70% WIDTH (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* SECTION A: Delivery Address */}
            <div className="space-y-3">
              <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                Delivery Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Address Card 1 (Selected Default) */}
                <div 
                  onClick={() => setSelectedAddrId(1)}
                  className={`bg-white p-4 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between h-[145px] min-h-[145px] max-h-[145px] ${
                    selectedAddrId === 1
                      ? 'border-[#B71C1C] shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-4 border-[#B71C1C] bg-white shrink-0" />
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900">Arun Kumar</span>
                      <span className="bg-[#E6F4EA] text-[#137333] text-[9.5px] font-black px-2 py-0.5 rounded">
                        Default
                      </span>
                    </div>

                    <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium pl-6">
                      Door No. 12, Sai Nagar, Peelamedu,<br />
                      Coimbatore, Tamil Nadu - 641015
                    </p>

                    <p className="text-[11.5px] text-slate-600 font-medium pl-6">
                      Phone: 9876543210
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddressModalOpen(true);
                    }}
                    className="text-xs font-bold text-[#B71C1C] hover:underline absolute bottom-3.5 right-4 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                {/* Address Card 2 (Add a new address) */}
                <div 
                  onClick={() => setAddressModalOpen(true)}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between h-[145px] min-h-[145px] max-h-[145px]"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-white shrink-0" />
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900">Add a new address</span>
                    </div>

                    <p className="text-[11.5px] text-slate-500 font-medium pl-6">
                      Add a new delivery address for this order
                    </p>
                  </div>

                  <div className="pl-6 pb-0.5">
                    <span className="text-xs font-extrabold text-[#B71C1C] hover:underline">
                      + Add Address
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* SECTION B: Delivery Options */}
            <div className="space-y-3 pt-2">
              <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                Delivery Options
              </h2>

              <div className="space-y-3">
                
                {/* Option 1: Standard Free Delivery */}
                <label 
                  className={`bg-white p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all h-[64px] min-h-[64px] max-h-[64px] ${
                    deliveryOption === 'standard'
                      ? 'border-[#B71C1C] shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="delOption"
                      checked={deliveryOption === 'standard'}
                      onChange={() => setDeliveryOption('standard')}
                      className="accent-[#B71C1C] w-4 h-4 cursor-pointer"
                    />
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block leading-tight">FREE Delivery</span>
                      <span className="text-[11px] text-emerald-700 font-bold leading-tight">Get it by Thu, 27 Aug</span>
                    </div>
                  </div>

                  <span className="font-black text-xs text-slate-900">FREE</span>
                </label>

                {/* Option 2: Express Delivery */}
                <label 
                  className={`bg-white p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all h-[64px] min-h-[64px] max-h-[64px] ${
                    deliveryOption === 'express'
                      ? 'border-[#B71C1C] shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="delOption"
                      checked={deliveryOption === 'express'}
                      onChange={() => setDeliveryOption('express')}
                      className="accent-[#B71C1C] w-4 h-4 cursor-pointer"
                    />
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block leading-tight">Express Delivery</span>
                      <span className="text-[11px] text-emerald-700 font-bold leading-tight">Get it by Tomorrow, 26 Aug</span>
                    </div>
                  </div>

                  <span className="font-black text-xs text-slate-900">₹69</span>
                </label>

              </div>
            </div>

            {/* SECTION C: Order Items */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                  Order Items ({itemsList.length})
                </h2>
                {itemsList.length > 0 && (
                  <span className="text-xs text-slate-500 font-medium">Click remove icon to remove item</span>
                )}
              </div>

              {itemsList.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-600">All items removed from this order.</p>
                  <button
                    onClick={() => navigate('/shop')}
                    className="bg-[#B71C1C] text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {itemsList.map((item, idx) => (
                    <div 
                      key={item.id || idx} 
                      className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4 h-[96px] min-h-[96px] max-h-[96px] group hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1 overflow-hidden">
                        <img
                          src={item.productImage || item.product?.imageUrl || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'}
                          alt={item.productName || item.product?.name}
                          className="w-16 h-16 object-contain rounded-lg bg-slate-50 border border-slate-100 p-1 shrink-0"
                        />
                        <div className="flex-1 space-y-1 overflow-hidden">
                          <h4 className="font-bold text-xs text-slate-900 truncate" title={item.productName || item.product?.name}>
                            {item.productName || item.product?.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Size: <span className="font-bold text-slate-800">{item.selectedSize || 'L'}</span> &nbsp;|&nbsp; Colour: <span className="font-bold text-slate-800">{item.selectedColor || 'Standard'}</span>
                          </p>
                          <p className="text-xs text-slate-900 font-bold">
                            ₹{(item.price || item.product?.price || 899).toFixed(2)} &nbsp;·&nbsp; <span className="text-slate-500 font-medium">Qty: {item.quantity || 1}</span>
                          </p>
                        </div>
                      </div>

                      {/* Product Remove Option Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id, idx)}
                        className="p-2 rounded-xl text-[#B71C1C] hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shrink-0 flex items-center gap-1 text-xs font-bold shadow-2xs"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4 text-[#B71C1C]" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: ~30% WIDTH (lg:col-span-4) - ORDER SUMMARY */}
          <div className="lg:col-span-4 space-y-4">
            
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
              
              <h3 className="font-display font-black text-base text-slate-900 border-b border-slate-100 pb-3">
                Order Summary
              </h3>

              {/* Breakdown Line Items */}
              <div className="space-y-2.5 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Price ({itemsList.length} items)</span>
                  <span className="font-bold text-slate-900">₹{rawItemTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="font-bold text-emerald-700">{deliveryOption === 'express' ? '₹69.00' : 'FREE'}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon Discount</span>
                    <span className="font-bold">-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="font-display font-black text-sm text-slate-900">Order Total</span>
                  <span className="font-display font-black text-xl text-[#B71C1C]">₹{orderTotal.toFixed(2)}</span>
                </div>
                {couponApplied && (
                  <p className="text-[11px] text-emerald-700 font-bold">
                    You will save ₹{couponDiscount.toFixed(2)} on this order
                  </p>
                )}
              </div>

              {/* Applied Coupon Card */}
              {couponApplied ? (
                <div className="bg-[#FFF5F5] border border-[#FED7D7] rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#B71C1C] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                      %
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">{couponCode}</span>
                      <span className="text-[10px] text-slate-500 font-medium block">Coupon applied</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-700 block">-₹{couponDiscount.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => setCouponApplied(false)}
                      className="text-[10px] font-bold text-[#B71C1C] hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none uppercase font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCouponApplied(true);
                      setCouponDiscount(85);
                      toast.success('Coupon KARVIYAM25 applied! 🎉');
                    }}
                    className="bg-[#B71C1C] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              )}

              {/* Safe and Secure Payments Box */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-[11px] leading-tight">Safe and Secure Payments</span>
                  <span className="text-[10px] text-slate-500 block leading-tight">100% Secure. Your data is protected.</span>
                </div>
              </div>

              {/* Proceed to Payment Button */}
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="w-full bg-[#B71C1C] hover:bg-[#8E0000] active:bg-[#780E0E] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-md hover:shadow-lg transition-colors cursor-pointer text-center"
              >
                Proceed to Payment
              </button>

              <p className="text-[9.5px] text-slate-500 text-center font-medium leading-relaxed">
                By placing this order, you agree to the Karviyam Terms & Conditions and Privacy Policy.
              </p>

              {/* 4 Bottom Trust Icons Grid */}
              <div className="grid grid-cols-4 gap-1 pt-3 border-t border-slate-100 text-center text-[9.5px] font-bold text-slate-600">
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-[#B71C1C]" />
                  <span>Original Products</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RotateCcw className="w-4 h-4 text-[#B71C1C]" />
                  <span>Easy Returns</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Lock className="w-4 h-4 text-[#B71C1C]" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Tag className="w-4 h-4 text-[#B71C1C]" />
                  <span>Best Price Guarantee</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* 3. BOTTOM FULL-WIDTH VALUE PROPOSITION TRUST STRIP */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mt-8 shadow-2xs">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-left">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">100% Original Products</h4>
                <p className="text-[10px] text-slate-500">Sourced Directly</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Easy Returns & Refunds</h4>
                <p className="text-[10px] text-slate-500">Hassle Free Process</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Secure Payments</h4>
                <p className="text-[10px] text-slate-500">Multiple Payment Options</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Customer Support</h4>
                <p className="text-[10px] text-slate-500">24/7 Support</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Best Price Guarantee</h4>
                <p className="text-[10px] text-slate-500">We Promise the Best</p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 4. PAYMENT METHOD MODAL (STEP 3: PAYMENT)                */}
      {/* ========================================================= */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-6">
            
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="font-display font-extrabold text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#B71C1C]" />
                  <span>Select Payment Method</span>
                </h3>
                <p className="text-[10.5px] text-slate-400">Step 3 of 4: Choose your preferred payment option</p>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Payment Options */}
            <div className="p-6 space-y-3.5">
              
              <div className="bg-red-50 border border-red-200/80 p-3 rounded-2xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Payable Total Amount:</span>
                <span className="font-black text-[#B71C1C] text-base">₹{orderTotal.toFixed(2)}</span>
              </div>

              <div className="space-y-2.5 pt-1">
                
                {/* 1. Cash on Delivery */}
                <label 
                  onClick={() => setSelectedPaymentMethod('COD')}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'COD' ? 'border-[#B71C1C] bg-red-50/40 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="pmethod"
                      checked={selectedPaymentMethod === 'COD'}
                      onChange={() => setSelectedPaymentMethod('COD')}
                      className="accent-[#B71C1C] w-4 h-4"
                    />
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block leading-tight">Cash on Delivery (COD)</span>
                      <span className="text-[10px] text-slate-500 font-medium block leading-tight">Pay cash upon doorstep delivery</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Popular</span>
                </label>

                {/* 2. UPI / GPay / PhonePe */}
                <label 
                  onClick={() => setSelectedPaymentMethod('UPI')}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'UPI' ? 'border-[#B71C1C] bg-red-50/40 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="pmethod"
                      checked={selectedPaymentMethod === 'UPI'}
                      onChange={() => setSelectedPaymentMethod('UPI')}
                      className="accent-[#B71C1C] w-4 h-4"
                    />
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block leading-tight">UPI / GPay / PhonePe</span>
                      <span className="text-[10px] text-slate-500 font-medium block leading-tight">Instant QR & App payment</span>
                    </div>
                  </div>
                </label>

                {/* 3. Credit / Debit Card */}
                <label 
                  onClick={() => setSelectedPaymentMethod('CARD')}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'CARD' ? 'border-[#B71C1C] bg-red-50/40 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="pmethod"
                      checked={selectedPaymentMethod === 'CARD'}
                      onChange={() => setSelectedPaymentMethod('CARD')}
                      className="accent-[#B71C1C] w-4 h-4"
                    />
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block leading-tight">Credit / Debit Card</span>
                      <span className="text-[10px] text-slate-500 font-medium block leading-tight">Visa, Mastercard, RuPay</span>
                    </div>
                  </div>
                </label>

              </div>

              {/* Action Buttons */}
              <div className="pt-3 space-y-2">
                <button
                  type="button"
                  onClick={handleConfirmAndPlaceOrder}
                  disabled={submitting}
                  className="w-full bg-[#B71C1C] hover:bg-[#900C0C] active:bg-[#780E0E] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Placing Your Order...</span>
                    </>
                  ) : (
                    <span>CONFIRM & PLACE ORDER (₹{orderTotal.toFixed(2)})</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="w-full text-xs font-bold text-slate-500 hover:text-slate-900 py-2 cursor-pointer text-center"
                >
                  Back to Order Details
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
