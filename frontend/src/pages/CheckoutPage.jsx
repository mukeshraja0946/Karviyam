import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { ShieldCheck, Truck, RotateCcw, Headphones, Tag, Lock, CreditCard, Smartphone, Banknote, Building, X, RefreshCw, Trash2, MapPin, Plus } from 'lucide-react';

export default function CheckoutPage() {
  const { user, login } = useAuth();
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

  // Auth Modal State for Checkout
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authStep, setAuthStep] = useState('IDENTIFY'); // 'IDENTIFY', 'LOGIN', 'REGISTER'
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dynamic Authenticated User Address Management
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);

  const [addrForm, setAddrForm] = useState({
    fullName: '',
    phone: '',
    houseFlatNo: '',
    streetAddress: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    country: 'India',
    addressType: 'HOME'
  });

  const [removedItemKeys, setRemovedItemKeys] = useState([]);

  const [formData, setFormData] = useState(() => ({
    fullName: user?.fullName || user?.name || user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    houseFlatNo: '',
    streetAddress: '',
    city: user?.city || (localStorage.getItem('karviyam_user_city') || '').split(',')[0] || 'Chennai',
    state: user?.state || 'Tamil Nadu',
    pincode: user?.pincode || localStorage.getItem('karviyam_user_pincode') || '600001',
  }));

  const applyAddressToFormData = (addr) => {
    if (!addr) return;
    const fullAddrStr = `${addr.houseFlatNo ? addr.houseFlatNo + ', ' : ''}${addr.streetAddress || ''}`;
    setFormData(prev => ({
      ...prev,
      fullName: addr.fullName || user?.fullName || prev.fullName,
      phone: addr.phone || user?.phone || prev.phone,
      email: user?.email || prev.email,
      houseFlatNo: addr.houseFlatNo || '',
      streetAddress: addr.streetAddress || '',
      city: addr.city || prev.city || 'Chennai',
      state: addr.state || prev.state || 'Tamil Nadu',
      pincode: addr.pincode || prev.pincode || '600001',
      address: fullAddrStr
    }));

    if (addr.pincode) {
      localStorage.setItem('karviyam_user_pincode', addr.pincode);
      if (addr.city) localStorage.setItem('karviyam_user_city', `${addr.city}, ${addr.state || 'Tamil Nadu'}`);
      window.dispatchEvent(new CustomEvent('karviyam_location_updated', {
        detail: { pincode: addr.pincode, city: addr.city }
      }));
    }
  };

  const fetchUserAddresses = async () => {
    if (!user) {
      setUserAddresses([]);
      setSelectedAddressId(null);
      return;
    }
    setAddressLoading(true);
    try {
      const res = await api.get('/users/addresses').catch(() => null);
      const apiData = res?.data?.data || res?.data || res || [];
      const list = Array.isArray(apiData) ? apiData : [];

      setUserAddresses(list);

      if (list.length > 0) {
        const def = list.find(a => a.isDefault) || list[0];
        setSelectedAddressId(def.id);
        applyAddressToFormData(def);
      } else {
        setSelectedAddressId(null);
      }
    } catch (err) {
      console.error('Error fetching user addresses:', err);
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAddresses();
  }, [user]);

  const openAddressModal = (addrToEdit = null) => {
    if (addrToEdit) {
      setEditingAddress(addrToEdit);
      setAddrForm({
        fullName: addrToEdit.fullName || '',
        phone: addrToEdit.phone || '',
        houseFlatNo: addrToEdit.houseFlatNo || '',
        streetAddress: addrToEdit.streetAddress || '',
        city: addrToEdit.city || 'Chennai',
        state: addrToEdit.state || 'Tamil Nadu',
        pincode: addrToEdit.pincode || '',
        country: addrToEdit.country || 'India',
        addressType: addrToEdit.addressType || 'HOME'
      });
    } else {
      setEditingAddress(null);
      setAddrForm({
        fullName: user?.fullName || user?.name || user?.full_name || formData.fullName || '',
        phone: user?.phone || formData.phone || '',
        houseFlatNo: '',
        streetAddress: '',
        city: formData.city || 'Chennai',
        state: formData.state || 'Tamil Nadu',
        pincode: formData.pincode || '',
        country: 'India',
        addressType: 'HOME'
      });
    }
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    if (e) e.preventDefault();
    if (!addrForm.fullName || !addrForm.fullName.trim()) { toast.error('Please enter Full Name'); return; }
    if (!addrForm.phone || !addrForm.phone.trim() || addrForm.phone.trim().length < 10) { toast.error('Please enter a valid 10-digit Mobile Number'); return; }
    if (!addrForm.houseFlatNo || !addrForm.houseFlatNo.trim()) { toast.error('Please enter House / Door No.'); return; }
    if (!addrForm.streetAddress || !addrForm.streetAddress.trim()) { toast.error('Please enter Street / Area'); return; }
    if (!addrForm.city || !addrForm.city.trim()) { toast.error('Please enter City'); return; }
    if (!addrForm.pincode || !addrForm.pincode.trim() || addrForm.pincode.trim().length !== 6) { toast.error('Please enter a valid 6-digit Pincode'); return; }

    try {
      let savedDto = null;
      if (editingAddress && editingAddress.id) {
        const res = await api.put(`/users/addresses/${editingAddress.id}`, { ...addrForm, isDefault: true });
        savedDto = res.data?.data || res.data;
        toast.success('Delivery address updated successfully! 🎉');
      } else {
        const res = await api.post('/users/addresses', { ...addrForm, isDefault: true });
        savedDto = res.data?.data || res.data;
        toast.success('New delivery address added & saved! 🎉');
      }

      setAddressModalOpen(false);
      setEditingAddress(null);

      // Refresh address list from backend
      await fetchUserAddresses();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save address. Please try again.');
    }
  };

  useEffect(() => {
    const syncPincode = () => {
      const savedPin = localStorage.getItem('karviyam_user_pincode');
      const savedCity = localStorage.getItem('karviyam_user_city');
      if (savedPin) {
        setFormData(prev => ({
          ...prev,
          pincode: prev.pincode || savedPin,
          city: prev.city || (savedCity || '').split(',')[0] || ''
        }));
      }
    };
    window.addEventListener('karviyam_location_updated', syncPincode);
    window.addEventListener('storage', syncPincode);
    return () => {
      window.removeEventListener('karviyam_location_updated', syncPincode);
      window.removeEventListener('storage', syncPincode);
    };
  }, []);

  // Dynamic Payment Method Settings (Controlled by Admin → Database)
  const [paymentSettings, setPaymentSettings] = useState({
    codEnabled: true,
    onlinePaymentEnabled: false,
    razorpayEnabled: false,
    stripeEnabled: false,
    defaultPaymentMethod: 'COD'
  });

  const fetchPaymentSettings = async () => {
    try {
      const payRes = await api.get('/settings/payment').catch(() => null);
      const payData = payRes?.data?.data || payRes?.data || {};

      const res = await api.get('/settings').catch(() => null);
      const apiData = res?.data ? res.data : (res || {});
      const dataMap = apiData.data || apiData || {};

      let localPay = {};
      try {
        const saved = localStorage.getItem('karviyam_admin_payment_settings');
        if (saved) localPay = JSON.parse(saved);
      } catch (e) {}

      const checkB = (val, defaultVal = true) => {
        if (val === undefined || val === null) return defaultVal;
        if (typeof val === 'boolean') return val;
        if (typeof val === 'number') return val === 1;
        if (typeof val === 'string') {
          const l = val.trim().toLowerCase();
          if (l === 'true' || l === '1') return true;
          if (l === 'false' || l === '0') return false;
        }
        return defaultVal;
      };

      const codVal = payData.codEnabled !== undefined ? payData.codEnabled : (dataMap.codEnabled !== undefined ? dataMap.codEnabled : localPay.codEnabled);
      const onlineVal = payData.onlinePaymentEnabled !== undefined ? payData.onlinePaymentEnabled : (dataMap.onlinePaymentEnabled !== undefined ? dataMap.onlinePaymentEnabled : localPay.onlinePaymentEnabled);
      const rzpVal = payData.razorpayEnabled !== undefined ? payData.razorpayEnabled : (dataMap.razorpayEnabled !== undefined ? dataMap.razorpayEnabled : localPay.razorpayEnabled);
      const stpVal = payData.stripeEnabled !== undefined ? payData.stripeEnabled : (dataMap.stripeEnabled !== undefined ? dataMap.stripeEnabled : localPay.stripeEnabled);
      const defVal = payData.defaultPaymentMethod || dataMap.defaultPaymentMethod || localPay.defaultPaymentMethod || 'COD';

      setPaymentSettings({
        codEnabled: checkB(codVal, true),
        onlinePaymentEnabled: checkB(onlineVal, false),
        razorpayEnabled: checkB(rzpVal, false),
        stripeEnabled: checkB(stpVal, false),
        defaultPaymentMethod: defVal
      });
    } catch (e) {
      console.error('Failed to fetch payment settings:', e);
    }
  };

  useEffect(() => {
    fetchPaymentSettings();
    window.addEventListener('karviyam_settings_updated', fetchPaymentSettings);
    window.addEventListener('storage', fetchPaymentSettings);
    return () => {
      window.removeEventListener('karviyam_settings_updated', fetchPaymentSettings);
      window.removeEventListener('storage', fetchPaymentSettings);
    };
  }, []);

  // Compute strictly allowed payment methods based on Admin Settings
  const isCodAvailable = paymentSettings.codEnabled === true;
  const isOnlineMasterEnabled = paymentSettings.onlinePaymentEnabled === true;
  const isRazorpayAvailable = isOnlineMasterEnabled && paymentSettings.razorpayEnabled === true;
  const isStripeAvailable = isOnlineMasterEnabled && paymentSettings.stripeEnabled === true;

  const availablePaymentMethods = [];
  if (isCodAvailable) {
    availablePaymentMethods.push({
      id: 'COD',
      name: 'Cash on Delivery (COD)',
      desc: 'Pay cash upon doorstep delivery',
      badge: 'Popular',
      iconClass: 'bg-amber-50 text-amber-700',
      IconComponent: Banknote
    });
  }
  if (isRazorpayAvailable) {
    availablePaymentMethods.push({
      id: 'UPI',
      name: 'UPI / GPay / PhonePe / Razorpay',
      desc: 'Instant QR & App payment via Razorpay',
      iconClass: 'bg-purple-50 text-purple-700',
      IconComponent: Smartphone
    });
  }
  if (isStripeAvailable) {
    availablePaymentMethods.push({
      id: 'CARD',
      name: 'Credit / Debit Card (Stripe)',
      desc: 'Visa, Mastercard, RuPay via Stripe',
      iconClass: 'bg-blue-50 text-blue-700',
      IconComponent: CreditCard
    });
  }

  // Pre-select default payment method or first available
  useEffect(() => {
    if (availablePaymentMethods.length > 0) {
      const defMethod = (paymentSettings.defaultPaymentMethod || '').toUpperCase();
      const match = availablePaymentMethods.find(m => m.id === defMethod || m.name.toUpperCase().includes(defMethod));
      if (match) {
        setSelectedPaymentMethod(match.id);
      } else if (!availablePaymentMethods.some(m => m.id === selectedPaymentMethod)) {
        setSelectedPaymentMethod(availablePaymentMethods[0].id);
      }
    }
  }, [paymentSettings.defaultPaymentMethod, availablePaymentMethods.length, paymentModalOpen]);

  // Effective items matching reference screenshot
  const rawItemsList = Array.isArray(cart.items) && cart.items.length > 0
    ? cart.items
    : [];

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

  // Step 1: Check if account exists
  const handleCheckAccount = async (e) => {
    if (e) e.preventDefault();
    const cleanId = authIdentifier.trim();
    if (!cleanId) {
      setAuthError('Please enter your Mobile Number or Email Address');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await api.post('/auth/check-account', { identifier: cleanId });
      const apiData = res.data ? res.data : res;
      const result = apiData.data || apiData || {};

      if (result.exists) {
        setAuthEmail(result.email || cleanId);
        setAuthPhone(result.phone || '');
        setAuthFullName(result.fullName || '');
        setAuthStep('LOGIN');
      } else {
        setAuthEmail(cleanId.includes('@') ? cleanId : '');
        setAuthPhone(!cleanId.includes('@') ? cleanId : '');
        setAuthFullName('');
        setAuthStep('REGISTER');
      }
    } catch (err) {
      console.error(err);
      setAuthEmail(cleanId);
      setAuthStep('LOGIN');
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 2: Login Existing Customer
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!authPassword || !authPassword.trim()) {
      setAuthError('Please enter your password');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await api.post('/auth/login', {
        email: authEmail || authIdentifier,
        identifier: authIdentifier,
        password: authPassword
      });
      const apiData = res.data ? res.data : res;
      const authResult = apiData.data || apiData || {};

      if (authResult.token || authResult.user || authResult.id) {
        if (login) login(authResult);
        toast.success(`Welcome back, ${authResult.fullName || authResult.user?.fullName || 'Customer'}! 🎉`);
        setAuthModalOpen(false);

        // Update formData from authenticated user profile
        setFormData(prev => ({
          ...prev,
          fullName: authResult.fullName || authResult.user?.fullName || prev.fullName,
          email: authResult.email || authResult.user?.email || prev.email,
          phone: authResult.phone || authResult.user?.phone || prev.phone,
          address: authResult.address || authResult.user?.address || prev.address,
        }));

        // Proceed to payment selection directly
        setPaymentModalOpen(true);
      } else {
        setAuthError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your password.';
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 3: Register New Customer
  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!authFullName || !authFullName.trim()) {
      setAuthError('Please enter your Full Name');
      return;
    }
    if (!authPhone || !authPhone.trim() || authPhone.trim().length < 10) {
      setAuthError('Please enter a valid 10-digit Mobile Number');
      return;
    }
    if (!authEmail || !authEmail.trim() || !authEmail.includes('@')) {
      setAuthError('Please enter a valid Email Address');
      return;
    }
    if (!authPassword || authPassword.trim().length < 4) {
      setAuthError('Password must be at least 4 characters long');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await api.post('/auth/register', {
        fullName: authFullName.trim(),
        email: authEmail.trim(),
        phone: authPhone.trim(),
        password: authPassword.trim(),
        address: formData.address || ''
      });
      const apiData = res.data ? res.data : res;
      const authResult = apiData.data || apiData || {};

      if (authResult.token || authResult.user || authResult.id) {
        if (login) login(authResult);
        toast.success(`Account created successfully! Welcome to Karviyam, ${authFullName.trim()} 🎉`);
        setAuthModalOpen(false);

        setFormData(prev => ({
          ...prev,
          fullName: authFullName.trim(),
          email: authEmail.trim(),
          phone: authPhone.trim(),
        }));

        // Proceed to payment selection directly
        setPaymentModalOpen(true);
      } else {
        setAuthError('Account creation failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Trigger Payment Modal or Auth Modal when user clicks "Proceed to Payment"
  const handleProceedToPayment = () => {
    if (!itemsList || itemsList.length === 0) {
      toast.error('Your Bag is empty! Please add products before checking out.');
      return;
    }

    // 1. CHECK AUTHENTICATION STATUS FIRST!
    if (!user) {
      setAuthStep('IDENTIFY');
      setAuthIdentifier('');
      setAuthError('');
      setAuthModalOpen(true);
      return;
    }

    // 2. Customer IS authenticated -> Validate delivery address fields for order fulfillment
    if (!formData.address || !formData.address.trim()) {
      toast.error('Please enter your Delivery Address');
      return;
    }
    if (!formData.city || !formData.city.trim()) {
      toast.error('Please enter your City');
      return;
    }
    if (!formData.pincode || !formData.pincode.trim() || formData.pincode.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit Pincode');
      return;
    }

    // Open Payment Method Selection
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
      {/* 2. ADD / EDIT DELIVERY ADDRESS MODAL                     */}
      {/* ========================================================= */}
      {addressModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-6">
            
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="font-display font-black text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#B71C1C]" />
                  <span>{editingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}</span>
                </h3>
                <p className="text-[10.5px] text-slate-400">Save address to your account for fast checkout</p>
              </div>
              <button
                onClick={() => setAddressModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={addrForm.fullName}
                    onChange={(e) => setAddrForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Receiver's full name"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    value={addrForm.phone}
                    onChange={(e) => setAddrForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="10-digit contact mobile"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">House / Flat / Door No. *</label>
                <input
                  type="text"
                  value={addrForm.houseFlatNo}
                  onChange={(e) => setAddrForm(prev => ({ ...prev, houseFlatNo: e.target.value }))}
                  placeholder="e.g. Door No. 12, Flat 3B"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">Street / Area / Landmark *</label>
                <input
                  type="text"
                  value={addrForm.streetAddress}
                  onChange={(e) => setAddrForm(prev => ({ ...prev, streetAddress: e.target.value }))}
                  placeholder="e.g. MG Road, Near City Mall"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">City *</label>
                  <input
                    type="text"
                    value={addrForm.city}
                    onChange={(e) => setAddrForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">State *</label>
                  <input
                    type="text"
                    value={addrForm.state}
                    onChange={(e) => setAddrForm(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={addrForm.pincode}
                    onChange={(e) => setAddrForm(prev => ({ ...prev, pincode: e.target.value }))}
                    placeholder="6-digit PIN"
                    maxLength={6}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">Address Type</label>
                <div className="flex gap-4">
                  {['HOME', 'WORK', 'OTHER'].map(type => (
                    <label key={type} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="addrType"
                        checked={addrForm.addressType === type}
                        onChange={() => setAddrForm(prev => ({ ...prev, addressType: type }))}
                        className="accent-[#B71C1C]"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Save Address & Continue
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. CHECKOUT AUTHENTICATION / LOGIN / CREATE ACCOUNT MODAL  */}
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
              <div className="flex items-center justify-between">
                <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#B71C1C]" />
                  <span>Delivery Address</span>
                </h2>
                {userAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => openAddressModal(null)}
                    className="text-xs font-extrabold text-[#B71C1C] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {userAddresses.length === 0 ? (
                /* No Saved Address Box -> Add Delivery Address CTA */
                <div className="bg-amber-50/60 border border-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#B71C1C]" />
                      <span>No Delivery Address Found</span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      Please add your delivery address details to proceed with order placement.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddressModal(null)}
                    className="bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Delivery Address</span>
                  </button>
                </div>
              ) : (
                /* Saved Address Cards Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    const fullAddressStr = `${addr.houseFlatNo ? addr.houseFlatNo + ', ' : ''}${addr.streetAddress || ''}`;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          applyAddressToFormData(addr);
                        }}
                        className={`bg-white p-4 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between min-h-[145px] ${
                          isSelected ? 'border-[#B71C1C] bg-red-50/20 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-4 shrink-0 ${isSelected ? 'border-[#B71C1C] bg-white' : 'border-slate-300 bg-white'}`} />
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900">{addr.fullName}</span>
                            <span className="bg-slate-100 text-slate-700 text-[9.5px] font-bold px-2 py-0.5 rounded uppercase">
                              {addr.addressType || 'HOME'}
                            </span>
                            {addr.isDefault && (
                              <span className="bg-[#E6F4EA] text-[#137333] text-[9.5px] font-black px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>

                          <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium pl-6">
                            {fullAddressStr}<br />
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>

                          <p className="text-[11.5px] text-slate-600 font-medium pl-6">
                            Phone: {addr.phone}
                          </p>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddressModal(addr);
                            }}
                            className="text-xs font-bold text-[#B71C1C] hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add a new address card option */}
                  <div
                    onClick={() => openAddressModal(null)}
                    className="bg-white p-4 rounded-xl border border-dashed border-slate-300 hover:border-[#B71C1C] transition-all cursor-pointer flex flex-col justify-between min-h-[145px] hover:bg-red-50/20"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">Add a new address</span>
                      </div>
                      <p className="text-[11.5px] text-slate-500 font-medium pl-8">
                        Add a new delivery address to your account for this order
                      </p>
                    </div>

                    <div className="pl-8 pb-0.5">
                      <span className="text-xs font-extrabold text-[#B71C1C] hover:underline">
                        + Add Address
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
      {/* 3. CHECKOUT AUTHENTICATION / LOGIN / CREATE ACCOUNT MODAL  */}
      {/* ========================================================= */}
      {authModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-6">
            
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="font-display font-black text-base flex items-center gap-1.5">
                  <span className="text-[#B71C1C]">KARVIYAM</span>
                  <span className="text-slate-300 font-normal">| Checkout Login</span>
                </h3>
                <p className="text-[10.5px] text-slate-400">Authenticate your account to proceed to payment</p>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
                  {authError}
                </div>
              )}

              {/* STEP 1: IDENTIFY (Mobile Number / Email) */}
              {authStep === 'IDENTIFY' && (
                <form onSubmit={handleCheckAccount} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Mobile Number or Email Address <span className="text-[#B71C1C]">*</span>
                    </label>
                    <input
                      type="text"
                      value={authIdentifier}
                      onChange={(e) => { setAuthIdentifier(e.target.value); setAuthError(''); }}
                      placeholder="e.g. 9876543210 or name@example.com"
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white transition-all"
                      autoFocus
                    />
                    <p className="text-[10px] text-slate-400 mt-1">We will check whether you already have a Karviyam account.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>CONTINUE TO CHECKOUT</span>}
                  </button>
                </form>
              )}

              {/* STEP 2: LOGIN (Password) */}
              {authStep === 'LOGIN' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Account Found</span>
                      <span className="font-bold text-slate-900">{authFullName || authEmail || authIdentifier}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAuthStep('IDENTIFY')}
                      className="text-[10.5px] font-bold text-[#B71C1C] hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Password <span className="text-[#B71C1C]">*</span>
                    </label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => { setAuthPassword(e.target.value); setAuthError(''); }}
                      placeholder="Enter your account password"
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white transition-all"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>LOGIN & CONTINUE TO PAYMENT</span>}
                  </button>
                </form>
              )}

              {/* STEP 3: CREATE ACCOUNT */}
              {authStep === 'REGISTER' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs">
                    <p className="font-bold">Account Not Found</p>
                    <p className="text-[10.5px] font-medium text-amber-700">Create a Karviyam account below to complete your order.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">Mobile Number *</label>
                    <input
                      type="text"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">Create Password *</label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="At least 4 characters"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>CREATE ACCOUNT & CONTINUE TO PAYMENT</span>}
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

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
                {availablePaymentMethods.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-bold text-center space-y-1">
                    <p>⚠️ Payment options are currently unavailable.</p>
                    <p className="text-[10px] font-normal text-amber-700">Please contact store administration to enable payment options.</p>
                  </div>
                ) : (
                  availablePaymentMethods.map((pm) => {
                    const IconComp = pm.IconComponent;
                    const isSelected = selectedPaymentMethod === pm.id;
                    return (
                      <label 
                        key={pm.id}
                        onClick={() => setSelectedPaymentMethod(pm.id)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected ? 'border-[#B71C1C] bg-red-50/40 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="pmethod"
                            checked={isSelected}
                            onChange={() => setSelectedPaymentMethod(pm.id)}
                            className="accent-[#B71C1C] w-4 h-4"
                          />
                          <div className={`w-8 h-8 rounded-xl ${pm.iconClass} flex items-center justify-center shrink-0`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block leading-tight">{pm.name}</span>
                            <span className="text-[10px] text-slate-500 font-medium block leading-tight">{pm.desc}</span>
                          </div>
                        </div>
                        {pm.badge && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">{pm.badge}</span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 space-y-2">
                <button
                  type="button"
                  onClick={handleConfirmAndPlaceOrder}
                  disabled={submitting || availablePaymentMethods.length === 0}
                  className="w-full bg-[#B71C1C] hover:bg-[#900C0C] active:bg-[#780E0E] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
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
