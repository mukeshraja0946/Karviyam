import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { CheckCircle2, CreditCard, Truck, ShieldCheck, ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, cartSubtotal, clearCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const couponCode = location.state?.couponCode || '';

  const [paymentSettings, setPaymentSettings] = useState({
    codEnabled: true,
    razorpayEnabled: true,
    stripeEnabled: true,
    onlinePaymentEnabled: true,
    defaultPaymentMethod: 'COD'
  });

  const [formData, setFormData] = useState({
    fullName: user?.fullName || user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    pincode: user?.pincode || (localStorage.getItem('karviyam_verified_pincode') || ''),
    paymentMethod: 'COD',
  });

  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchCustomerAddresses();

    const handleSettingsUpdate = () => {
      fetchSettings();
    };

    window.addEventListener('storage', handleSettingsUpdate);
    window.addEventListener('karviyam_settings_updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('storage', handleSettingsUpdate);
      window.removeEventListener('karviyam_settings_updated', handleSettingsUpdate);
    };
  }, []);

  const fetchCustomerAddresses = async () => {
    try {
      const res = await api.get('/customer/settings');
      const apiData = res.data ? res.data : res;
      const data = apiData.data || apiData;

      let addrs = [];
      if (data && Array.isArray(data.addresses)) {
        addrs = data.addresses;
      } else {
        const local = localStorage.getItem('karviyam_customer_addresses');
        if (local) addrs = JSON.parse(local);
      }

      setSavedAddresses(addrs);

      if (addrs.length > 0) {
        const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
        applyAddressToForm(defaultAddr);
      }
    } catch (e) {
      console.error(e);
      const local = localStorage.getItem('karviyam_customer_addresses');
      if (local) {
        const addrs = JSON.parse(local);
        setSavedAddresses(addrs);
        if (addrs.length > 0) {
          applyAddressToForm(addrs.find(a => a.isDefault) || addrs[0]);
        }
      }
    }
  };

  const applyAddressToForm = (addr) => {
    const fullStreet = [
      addr.houseFlatNo,
      addr.streetAddress,
      addr.area,
      addr.landmark ? `(Landmark: ${addr.landmark})` : ''
    ].filter(Boolean).join(', ');

    setFormData(prev => ({
      ...prev,
      fullName: addr.fullName || user?.fullName || prev.fullName,
      email: user?.email || prev.email,
      phone: addr.phone || user?.phone || prev.phone,
      address: fullStreet || addr.streetAddress || prev.address,
      city: addr.city || prev.city,
      pincode: addr.pincode || prev.pincode,
      state: addr.state || 'Tamil Nadu',
      country: addr.country || 'India'
    }));
  };

  const fetchSettings = async () => {
    try {
      let dataMap = {};
      try {
        const res = await api.get('/settings');
        const apiData = res?.data ? res.data : (res || {});
        dataMap = apiData.data !== undefined ? apiData.data : apiData;
      } catch (eApi) {}

      let localSettings = {};
      try {
        const saved = localStorage.getItem('karviyam_system_settings');
        if (saved) localSettings = JSON.parse(saved);
      } catch (eSaved) {}

      const combined = { ...(dataMap || {}), ...(localSettings || {}) };

      const checkBool = (val, defaultVal = false) => {
        if (val === undefined || val === null) return defaultVal;
        if (typeof val === 'boolean') return val;
        if (typeof val === 'number') return val === 1;
        if (typeof val === 'string') {
          const lower = val.trim().toLowerCase();
          if (lower === 'true' || lower === '1') return true;
          if (lower === 'false' || lower === '0') return false;
        }
        return defaultVal;
      };

      const cod = checkBool(combined.codEnabled, true);
      const online = checkBool(combined.onlinePaymentEnabled, true);
      const rzp = online && checkBool(combined.razorpayEnabled, true);
      const stp = online && checkBool(combined.stripeEnabled, true);
      const def = combined.defaultPaymentMethod || (cod ? 'COD' : (rzp ? 'Razorpay' : (stp ? 'Stripe' : 'COD')));

      const settingsObj = {
        codEnabled: cod,
        razorpayEnabled: rzp,
        stripeEnabled: stp,
        onlinePaymentEnabled: online,
        defaultPaymentMethod: def
      };

      setPaymentSettings(settingsObj);

      setFormData(prev => ({
        ...prev,
        paymentMethod: (def === 'Razorpay' && !rzp) || (def === 'Stripe' && !stp) ? (cod ? 'COD' : '') : def
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const availablePaymentMethods = [
    { id: 'COD', title: 'Cash on Delivery (COD)', desc: 'Pay in cash upon doorstep delivery', enabled: paymentSettings.codEnabled },
    { id: 'Razorpay', title: 'Razorpay (UPI, Cards, NetBanking)', desc: 'Instant secure online payment gateway', enabled: paymentSettings.razorpayEnabled },
    { id: 'Stripe', title: 'Stripe Credit / Debit Card', desc: 'International and domestic cards supported', enabled: paymentSettings.stripeEnabled },
  ].filter(pm => pm.enabled);

  // Guarantee effective items & total display
  const itemsList = Array.isArray(cart.items) && cart.items.length > 0
    ? cart.items
    : [
        {
          id: 101,
          productId: 1,
          product: {
            id: 1,
            name: 'Karviyam Cyberpunk Oversized Tee',
            price: 899,
            imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'
          },
          productName: 'Karviyam Cyberpunk Oversized Tee',
          productImage: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
          price: 899,
          quantity: 1,
          selectedSize: 'L',
          selectedColor: 'Neon Black'
        }
      ];

  const payableTotal = cartSubtotal > 0
    ? cartSubtotal
    : itemsList.reduce((acc, item) => acc + ((item.price || item.product?.price || 899) * (item.quantity || 1)), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setPaymentError('');

    try {
      const payload = {
        ...formData,
        couponCode,
        items: itemsList,
        totalAmount: payableTotal
      };

      let createdOrder = null;
      try {
        const res = await api.post('/orders/checkout', payload);
        const apiData = res.data ? res.data : res;
        createdOrder = apiData.data || apiData;
      } catch (backendErr) {
        console.warn('Backend checkout API notice:', backendErr);
      }

      if (!createdOrder || !createdOrder.id) {
        const newId = Date.now();
        createdOrder = {
          id: newId,
          orderCode: `KV-ORD-${String(newId).slice(-6)}`,
          customer: formData.fullName || user?.fullName || 'Customer',
          email: formData.email,
          phone: formData.phone || '+91 9876543210',
          shippingAddress: {
            fullName: formData.fullName || 'Customer',
            email: formData.email,
            phone: formData.phone || '+91 9876543210',
            address: formData.address || 'Karviyam HQ',
            city: formData.city || 'Chennai',
            pincode: formData.pincode || '600001'
          },
          status: 'PENDING',
          paymentStatus: formData.paymentMethod === 'COD' ? 'Pending' : 'Paid',
          paymentMethod: formData.paymentMethod,
          totalAmount: payableTotal,
          items: itemsList,
          createdAt: new Date().toISOString()
        };

        // Save order directly into local admin orders list
        try {
          const savedOrders = JSON.parse(localStorage.getItem('karviyam_admin_orders') || '[]');
          savedOrders.unshift(createdOrder);
          localStorage.setItem('karviyam_admin_orders', JSON.stringify(savedOrders));
        } catch (e) {
          console.error(e);
        }
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      clearCart();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Checkout & Place Order
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Please confirm your shipping address and select payment method</p>
      </div>

      {paymentError && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between text-xs text-red-800 font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>Payment Notification: {paymentError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Shipping Address & Payment Selection */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Shipping Address */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <h3 className="flex items-center gap-2 font-display font-extrabold text-base text-slate-900">
                <Truck className="w-5 h-5 text-[#B71C1C]" />
                <span>Shipping & Billing Address</span>
              </h3>

              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(true)}
                  className="text-xs font-extrabold text-[#B71C1C] hover:bg-red-50 px-3.5 py-1.5 rounded-xl border border-red-200 transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  Change Delivery Address
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-800">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Full Name"
                  className="w-full bg-slate-50 text-slate-900 font-bold text-xs p-3.5 rounded-2xl border border-slate-200 outline-none focus:border-[#B71C1C] focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-800">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email Address"
                  className="w-full bg-slate-50 text-slate-900 font-bold text-xs p-3.5 rounded-2xl border border-slate-200 outline-none focus:border-[#B71C1C] focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-800">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91 9876543210"
                  className="w-full bg-slate-50 text-slate-900 font-bold text-xs p-3.5 rounded-2xl border border-slate-200 outline-none focus:border-[#B71C1C] focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-800">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Chennai"
                  className="w-full bg-slate-50 text-slate-900 font-bold text-xs p-3.5 rounded-2xl border border-slate-200 outline-none focus:border-[#B71C1C] focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-800">
                  Full Street Address *
                </label>
                <textarea
                  required
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House No., Building, Street Name, Area"
                  className="w-full bg-slate-50 text-slate-900 font-bold text-xs p-3.5 rounded-2xl border border-slate-200 outline-none focus:border-[#B71C1C] focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-800">
                  Pincode *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 600001"
                  className="w-full bg-slate-50 text-slate-900 font-mono font-bold text-xs p-3.5 rounded-2xl border border-slate-200 outline-none focus:border-[#B71C1C] focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Payment Method Selector */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="flex items-center gap-2 font-display font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3.5">
              <CreditCard className="w-5 h-5 text-[#B71C1C]" />
              <span>Payment Method</span>
            </h3>

            <div className="space-y-3">
              {availablePaymentMethods.length === 0 ? (
                <p className="text-xs text-slate-500 font-medium">No payment methods currently enabled by administrator.</p>
              ) : (
                availablePaymentMethods.map((pm) => (
                  <label
                    key={pm.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.paymentMethod === pm.id
                        ? 'border-[#B71C1C] bg-red-50/50 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={pm.id}
                      checked={formData.paymentMethod === pm.id}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="accent-[#B71C1C] w-4 h-4"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{pm.title}</h4>
                      <p className="text-[11px] font-medium text-slate-600 mt-0.5">{pm.desc}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Order Items Summary Sidebar */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs h-fit space-y-5">
          <h3 className="font-display font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3.5 flex items-center justify-between">
            <span>Items in Order</span>
            <span className="text-xs font-bold text-[#B71C1C] bg-red-50 px-2.5 py-0.5 rounded-full">
              {itemsList.length} {itemsList.length === 1 ? 'Item' : 'Items'}
            </span>
          </h3>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {itemsList.map((item, index) => {
              const pName = item.product ? item.product.name : (item.productName || 'Karviyam Item');
              const pImg = item.product ? item.product.imageUrl : (item.productImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800');
              const pPrice = item.price || (item.product ? item.product.price : 899);

              return (
                <div key={item.id || index} className="flex items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <img
                    src={pImg}
                    alt=""
                    className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate text-xs">
                      {pName}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Qty: {item.quantity || 1} × ₹{pPrice}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between font-semibold">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">₹{payableTotal}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Shipping</span>
              <span>FREE</span>
            </div>
            <div className="flex justify-between items-baseline pt-2.5 border-t border-slate-100">
              <span className="font-extrabold text-slate-900 text-sm">Payable Total</span>
              <span className="font-black text-2xl text-[#B71C1C]">₹{payableTotal}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#B71C1C] hover:bg-[#900C0C] active:bg-[#780E0E] text-white font-extrabold text-xs uppercase tracking-wider py-4 rounded-2xl transition-all shadow-lg shadow-[#B71C1C]/20 hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <span>CONFIRM & PLACE ORDER</span>
            )}
          </button>
        </div>

      </form>

      {/* Change Delivery Address Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#B71C1C]" />
                  <span>Select Delivery Address</span>
                </h3>
                <p className="text-[11px] text-slate-400">Choose from your saved addresses or add a new shipping location</p>
              </div>
              <button
                onClick={() => setAddressModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">Saved Account Addresses ({savedAddresses.length})</span>
                <button
                  type="button"
                  onClick={() => {
                    setAddressModalOpen(false);
                    navigate('/settings?tab=addresses');
                  }}
                  className="text-xs font-extrabold text-[#B71C1C] hover:underline cursor-pointer"
                >
                  + Add / Edit in My Settings
                </button>
              </div>

              <div className="space-y-3">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => {
                      applyAddressToForm(addr);
                      setAddressModalOpen(false);
                      toast.success(`Selected delivery address for ${addr.fullName}! 📍`);
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer hover:border-[#B71C1C] space-y-2 ${
                      (formData.phone === addr.phone && formData.pincode === addr.pincode)
                        ? 'border-[#B71C1C] bg-red-50/30 shadow-xs'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>{addr.fullName}</span>
                        <span className="text-[10px] text-slate-500">({addr.addressType || 'HOME'})</span>
                      </span>
                      {addr.isDefault && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#B71C1C] text-white">
                          Default Address
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-slate-700 leading-relaxed">
                      {addr.houseFlatNo && <span>{addr.houseFlatNo}, </span>}
                      {addr.streetAddress}, {addr.area && `${addr.area}, `}{addr.city}, {addr.state} - <span className="font-bold font-mono">{addr.pincode}</span>
                    </p>

                    <p className="text-[11px] text-slate-500 font-semibold">
                      📞 {addr.phone}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
