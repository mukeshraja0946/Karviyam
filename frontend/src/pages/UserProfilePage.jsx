import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';
import api from '../utils/api';
import { isValidAvatarUrl, resolveImageUrl } from '../utils/imageUtils';
import toast from 'react-hot-toast';
import {
  Package, Search, Truck, RotateCcw, FileText, CheckCircle2, Clock,
  AlertCircle, Star, X, ChevronDown, ShoppingCart, ExternalLink, LogOut,
  RefreshCw, User, MapPin, Calendar, CreditCard, ArrowRight, ShieldCheck
} from 'lucide-react';

export default function UserProfilePage() {
  const { user, logout } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Primary Data State
  const [orders, setOrders] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Filters & Search & Sort State
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, NOT_SHIPPED, SHIPPED, DELIVERED, CANCELLED, RETURNS
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('NEWEST'); // NEWEST, OLDEST

  // Modals State
  const [orderDetailsModal, setOrderDetailsModal] = useState({ open: false, order: null });
  const [trackingModal, setTrackingModal] = useState({ open: false, order: null });
  const [returnModal, setReturnModal] = useState({ open: false, order: null, selectedItem: null });
  const [returnStatusModal, setReturnStatusModal] = useState({ open: false, returnReq: null, order: null });
  const [invoiceModal, setInvoiceModal] = useState({ open: false, order: null });
  const [reviewModal, setReviewModal] = useState({ open: false, order: null, item: null });
  const [shipToTooltip, setShipToTooltip] = useState(null); // orderId

  // Return Form State
  const [returnType, setReturnType] = useState('RETURN'); // RETURN or REPLACE
  const [returnReason, setReturnReason] = useState('Damaged item');
  const [returnQty, setReturnQty] = useState(1);
  const [returnDesc, setReturnDesc] = useState('');
  const [returnImage, setReturnImage] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImage, setReviewImage] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Buy Again Loading State
  const [buyAgainLoading, setBuyAgainLoading] = useState({});

  useEffect(() => {
    fetchOrdersAndReturns();
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully 👋');
    navigate('/login');
  };



  const fetchOrdersAndReturns = async () => {
    setLoading(true);
    setFetchError(null);
    let allOrders = [];

    try {
      // 1. Fetch Orders
      let ordRes = await api.get('/orders/my-orders').catch(() => null);
      if (!ordRes) {
        ordRes = await api.get('/orders').catch(() => null);
      }

      // 2. Fetch Returns
      const retRes = await api.get('/returns/my-requests').catch(() => null);

      if (ordRes && (ordRes.status === 200 || ordRes.status === 304 || ordRes.data?.success)) {
        const apiData = ordRes.data ? ordRes.data : ordRes;
        const list = Array.isArray(apiData.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);

        allOrders = list.map(o => {
          const rawItems = Array.isArray(o.orderItems || o.items) ? (o.orderItems || o.items) : [];
          const items = rawItems.map(i => ({
            id: i.id || Date.now(),
            productId: i.productId || i.product_id || (i.product ? i.product.id : 0),
            productName: i.productName || i.product_name || (i.product ? i.product.name : `Product #${i.productId || i.product_id}`),
            sku: i.sku || i.product_sku || (i.product ? i.product.sku : `KV-PRD-${i.productId || i.product_id || 1}`),
            productImage: resolveImageUrl(i.imageUrl || i.image_url || i.productImage || (i.product ? i.product.imageUrl || i.product.image_url : '')),
            priceAtTime: i.priceAtTime != null ? i.priceAtTime : (i.price_at_time != null ? i.price_at_time : 0),
            quantity: i.quantity || 1,
            selectedSize: i.selectedSize || i.selected_size || 'M',
            selectedColor: i.selectedColor || i.selected_color || 'Standard'
          }));

          return {
            id: o.id,
            orderCode: o.orderCode || o.trackingNumber || `#ORD-${o.id}`,
            status: o.status || 'ORDER_PLACED',
            trackingStatus: o.trackingStatus || o.tracking_status || o.status || 'Order Placed',
            currentLocation: o.currentLocation || o.current_location || '',
            courierPartner: o.courierPartner || o.courier_partner || '',
            trackingNumber: o.trackingNumber || o.tracking_number || '',
            estimatedDelivery: o.estimatedDelivery || o.estimated_delivery || '',
            statusMessage: o.statusMessage || o.status_message || '',
            deliveredAt: o.deliveredAt || o.delivered_at || null,
            totalAmount: o.totalAmount != null ? o.totalAmount : (o.total_amount || 0),
            discountAmount: o.discountAmount != null ? o.discountAmount : (o.discount_amount || 0),
            shippingCost: o.shippingCost != null ? o.shippingCost : (o.shipping_cost || 0),
            taxAmount: o.taxAmount != null ? o.taxAmount : (o.tax_amount || 0),
            fullName: o.fullName || o.full_name || user?.fullName || user?.name || 'Customer',
            email: o.email || user?.email || '',
            phone: o.phone || '',
            address: o.address || '',
            city: o.city || '',
            pincode: o.pincode || '',
            paymentMethod: o.paymentMethod || o.payment_method || 'COD',
            paymentStatus: o.paymentStatus || o.payment_status || 'PENDING',
            items: items,
            createdAt: o.createdAt || o.created_at || o.orderDate || Date.now()
          };
        });
      } else {
        setFetchError('Unable to load your orders. Please try again.');
      }

      if (retRes) {
        const retData = retRes.data?.data || retRes.data || [];
        setReturnRequests(Array.isArray(retData) ? retData : []);
      }
    } catch (e) {
      console.error('Failed to load orders:', e);
      setFetchError('Unable to load your orders. Please try again.');
    } finally {
      setOrders(allOrders);
      setLoading(false);
    }
  };

  // Helper: Return eligibility check (7-day delivery window)
  const isEligibleForReturn = (order, item) => {
    const statusUpper = String(order.status).toUpperCase();
    if (statusUpper !== 'DELIVERED') {
      return { eligible: false, reason: 'Order must be delivered before initiating a return or replacement.' };
    }

    // Check existing return request for order/item
    const existingReturn = returnRequests.find(r => String(r.order_id) === String(order.id));
    if (existingReturn) {
      return { eligible: false, reason: `Return request already ${existingReturn.status || 'submitted'}.` };
    }

    // Check delivery window (7 days)
    if (order.deliveredAt) {
      const deliveredDate = new Date(order.deliveredAt);
      const now = new Date();
      const diffDays = Math.floor((now - deliveredDate) / (1000 * 60 * 60 * 24));
      if (diffDays > 7) {
        return { eligible: false, reason: '7-day return window expired.' };
      }
    }

    return { eligible: true };
  };

  // Helper: Buy It Again Action
  const handleBuyItAgain = async (item) => {
    const key = `${item.productId}-${item.selectedSize}-${item.selectedColor}`;
    setBuyAgainLoading(prev => ({ ...prev, [key]: true }));

    try {
      const productTarget = {
        id: item.productId,
        productId: item.productId,
        name: item.productName,
        productName: item.productName,
        price: item.priceAtTime,
        imageUrl: item.productImage
      };

      await addToCart(productTarget, item.quantity || 1, item.selectedSize || 'M', item.selectedColor || 'Standard');
      toast.success(`Added ${item.productName} to your cart! 🛒`);
    } catch (err) {
      console.error('Buy again error:', err);
      toast.error('Failed to add item to cart');
    } finally {
      setBuyAgainLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Helper: Cancel Order Action
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to cancel Order #ORD-${orderId}?`)) return;

    try {
      const res = await api.put(`/orders/${orderId}/cancel`).catch(() => null);
      if (res && (res.status === 200 || res.data?.success)) {
        toast.success('Order cancelled successfully.');
        fetchOrdersAndReturns();
      } else {
        toast.error(res?.data?.message || 'Failed to cancel order.');
      }
    } catch (err) {
      console.error('Cancel order error:', err);
      toast.error(err.response?.data?.message || 'Unable to cancel order.');
    }
  };

  // Helper: Open Return Request Modal
  const handleOpenReturnModal = (order, item = null) => {
    const selected = item || (order.items && order.items.length > 0 ? order.items[0] : null);
    setReturnModal({ open: true, order, selectedItem: selected });
    setReturnType('RETURN');
    setReturnReason('Damaged item');
    setReturnQty(selected ? selected.quantity : 1);
    setReturnDesc('');
    setReturnImage('');
  };

  // Helper: Submit Return/Replace Form
  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    const { order, selectedItem } = returnModal;
    if (!order || !selectedItem) return;

    setSubmittingReturn(true);
    try {
      const res = await api.post('/returns', {
        orderId: order.id,
        orderItemId: selectedItem.id,
        productId: selectedItem.productId,
        type: returnType,
        reason: returnReason,
        quantity: Number(returnQty),
        description: returnDesc,
        images: returnImage ? [returnImage] : []
      });

      if (res.data?.success || res.status === 201 || res.status === 200) {
        toast.success(`${returnType === 'REPLACE' ? 'Replacement' : 'Return'} request submitted successfully!`);
        setReturnModal({ open: false, order: null, selectedItem: null });
        fetchOrdersAndReturns();
      } else {
        toast.error(res.data?.message || 'Failed to submit request.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Unable to submit request.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Helper: Submit Review Form
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const { order, item } = reviewModal;
    if (!order || !item) return;

    setSubmittingReview(true);
    try {
      const res = await api.post('/reviews', {
        productId: item.productId,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
        images: reviewImage ? [reviewImage] : []
      });

      if (res.data?.success || res.status === 201 || res.status === 200) {
        toast.success('Thank you! Your product review has been submitted. ⭐');
        setReviewModal({ open: false, order: null, item: null });
        setReviewRating(5);
        setReviewTitle('');
        setReviewComment('');
        setReviewImage('');
      } else {
        toast.error(res.data?.message || 'Failed to submit review.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Unable to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filtered and Sorted Orders
  const filteredOrders = orders.filter(ord => {
    const statusUpper = String(ord.status).toUpperCase();
    const activeReturn = returnRequests.find(r => String(r.order_id) === String(ord.id));

    // Tab Filter
    if (activeTab === 'NOT_SHIPPED') {
      if (['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(statusUpper)) return false;
    } else if (activeTab === 'SHIPPED') {
      if (!['SHIPPED', 'OUT_FOR_DELIVERY'].includes(statusUpper)) return false;
    } else if (activeTab === 'DELIVERED') {
      if (statusUpper !== 'DELIVERED') return false;
    } else if (activeTab === 'CANCELLED') {
      if (statusUpper !== 'CANCELLED') return false;
    } else if (activeTab === 'RETURNS') {
      if (!activeReturn && !statusUpper.includes('RETURN') && !statusUpper.includes('REFUND') && !statusUpper.includes('REPLACE')) return false;
    }

    // Search Query Filter (Order ID, Product Name, SKU)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchOrderId = String(ord.id).includes(query) || String(ord.orderCode).toLowerCase().includes(query);
      const matchItem = ord.items.some(i =>
        String(i.productName).toLowerCase().includes(query) ||
        String(i.sku).toLowerCase().includes(query)
      );
      if (!matchOrderId && !matchItem) return false;
    }

    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === 'NEWEST' ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="min-h-screen bg-[#F7F8F9] py-4 px-3 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-3.5">

        {/* User Account Banner */}
        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white text-slate-800 flex items-center justify-center font-bold text-base shadow-2xs shrink-0 overflow-hidden border border-slate-200 p-0.5">
              {isValidAvatarUrl(user?.profilePicture) || isValidAvatarUrl(user?.avatar) ? (
                <img src={resolveImageUrl(user?.profilePicture || user?.avatar)} alt="" className="w-full h-full object-contain object-center block" />
              ) : (
                <div className="w-full h-full bg-[#131921] text-white flex items-center justify-center rounded-full">
                  <span>{user?.fullName?.charAt(0) || user?.name?.charAt(0) || 'U'}</span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base text-slate-900 leading-tight">
                  {user?.fullName || user?.name || 'Customer Account'}
                </h1>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.2 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified Customer
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/settings')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Account Settings
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Page Title & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your Orders</h2>
            <p className="text-[11px] text-slate-500 font-medium">Manage and track your recent purchases, returns, and invoices</p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search all orders, items or SKU"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#007185] focus:ring-1 focus:ring-[#007185] shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:border-[#007185] cursor-pointer shadow-2xs"
            >
              <option value="NEWEST">Sort by: Newest</option>
              <option value="OLDEST">Sort by: Oldest</option>
            </select>
          </div>
        </div>

        {/* Amazon-Style Filter Tabs */}
        <div className="border-b border-slate-200 flex items-center gap-2 sm:gap-6 overflow-x-auto text-xs font-semibold text-slate-600 pb-0">
          {[
            { id: 'ALL', label: 'Orders' },
            { id: 'NOT_SHIPPED', label: 'Not Yet Shipped' },
            { id: 'SHIPPED', label: 'Shipped' },
            { id: 'DELIVERED', label: 'Delivered' },
            { id: 'CANCELLED', label: 'Cancelled' },
            { id: 'RETURNS', label: 'Returns & Refunds' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#C7511F] text-[#C7511F] font-bold'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={fetchOrdersAndReturns}
            className="ml-auto pb-2.5 text-slate-400 hover:text-[#007185] flex items-center gap-1 cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Content Loading & Error & Empty States */}
        {loading ? (
          <div className="bg-white p-12 rounded-xl text-center border border-slate-200 shadow-xs space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#007185]" />
            <p className="text-xs text-slate-600 font-medium">Loading your orders...</p>
          </div>
        ) : fetchError ? (
          <div className="bg-white p-12 rounded-xl text-center border border-slate-200 shadow-xs space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <p className="text-xs text-slate-700 font-semibold">{fetchError}</p>
            <button
              onClick={fetchOrdersAndReturns}
              className="px-4 py-2 bg-[#007185] text-white text-xs font-bold rounded-lg hover:bg-[#005a6a] transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-xl text-center border border-slate-200 shadow-xs space-y-4">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <div>
              <h3 className="font-bold text-base text-slate-900">No orders yet</h3>
              <p className="text-xs text-slate-500 mt-1">Your orders will appear here after you place your first order.</p>
            </div>
            <button
              onClick={() => navigate('/shop')}
              className="px-6 py-2.5 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-bold rounded-full shadow-xs transition-colors cursor-pointer inline-block border border-[#D32F2F]"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          /* Order Cards List */
          <div className="space-y-3.5">
            {filteredOrders.map(ord => {
              const activeReturn = returnRequests.find(r => String(r.order_id) === String(ord.id));
              const statusUpper = String(ord.status).toUpperCase();
              const isCancelled = statusUpper === 'CANCELLED';
              const isDelivered = statusUpper === 'DELIVERED';
              const isProcessing = ['ORDER_PLACED', 'PAYMENT_CONFIRMED', 'PROCESSING', 'PACKED'].includes(statusUpper);
              const formattedDate = new Date(ord.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

              return (
                <div key={ord.id} className="bg-white rounded-lg border border-[#D5D9D9] shadow-2xs overflow-hidden">
                  
                  {/* Amazon Order Header */}
                  <div className="bg-[#F0F2F2] border-b border-[#D5D9D9] px-4 py-2 sm:px-5 flex flex-wrap items-center justify-between gap-y-2 gap-x-5 text-xs text-[#565959]">
                    <div className="flex flex-wrap items-center gap-6 sm:gap-10">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-[#565959]">ORDER PLACED</span>
                        <span className="font-medium text-[#0F1111]">{formattedDate}</span>
                      </div>

                      <div>
                        <span className="block text-[10px] uppercase font-bold text-[#565959]">TOTAL</span>
                        <span className="font-bold text-[#0F1111]">₹{ord.totalAmount?.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="relative">
                        <span className="block text-[10px] uppercase font-bold text-[#565959]">SHIP TO</span>
                        <button
                          onClick={() => setShipToTooltip(shipToTooltip === ord.id ? null : ord.id)}
                          className="font-medium text-[#007185] hover:text-[#C7511F] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{ord.fullName}</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>

                        {/* Ship To Address Tooltip */}
                        {shipToTooltip === ord.id && (
                          <div className="absolute left-0 top-full mt-2 w-64 bg-white p-3 rounded-lg border border-slate-300 shadow-xl z-20 text-slate-800 space-y-1">
                            <p className="font-bold text-xs text-slate-900">{ord.fullName}</p>
                            <p className="text-[11px] text-slate-600 leading-relaxed">{ord.address}</p>
                            <p className="text-[11px] text-slate-600">{ord.city} - {ord.pincode}</p>
                            <p className="text-[11px] text-slate-500 font-mono mt-1">Phone: {ord.phone}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end text-right gap-1 ml-auto sm:ml-0">
                      <div className="text-[11px]">
                        <span className="font-bold text-[#565959] uppercase text-[10px]">ORDER # </span>
                        <span className="font-medium text-[#0F1111]">{ord.orderCode}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <button
                          onClick={() => setOrderDetailsModal({ open: true, order: ord })}
                          className="text-[#007185] hover:text-[#C7511F] hover:underline font-medium cursor-pointer"
                        >
                          View order details
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => setInvoiceModal({ open: true, order: ord })}
                          className="text-[#007185] hover:text-[#C7511F] hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>Invoice</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-3.5 sm:p-4 space-y-3.5">

                    {/* Status Heading Banner */}
                    <div className="space-y-0.5 border-b border-slate-100 pb-2.5">
                      {isDelivered ? (
                        <div>
                          <h3 className="font-bold text-base text-[#0F1111] flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span>Delivered {ord.deliveredAt ? `on ${new Date(ord.deliveredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}</span>
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">Your package was handed directly to a resident or left safely at your address.</p>
                        </div>
                      ) : isCancelled ? (
                        <div>
                          <h3 className="font-bold text-base text-red-700 flex items-center gap-2">
                            <X className="w-5 h-5 text-red-600" />
                            <span>Cancelled</span>
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">If you were charged, a refund will be processed and credited to the original payment method within 3-5 business days.</p>
                        </div>
                      ) : activeReturn ? (
                        <div>
                          <h3 className="font-bold text-base text-purple-800 flex items-center gap-2">
                            <RotateCcw className="w-5 h-5 text-purple-600" />
                            <span>Return Status: {activeReturn.status || 'Processing'}</span>
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">Return request ({activeReturn.type}) submitted on {new Date(activeReturn.created_at || Date.now()).toLocaleDateString('en-GB')}.</p>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-bold text-base text-[#0F1111] flex items-center gap-2">
                            <Truck className="w-5 h-5 text-[#007185]" />
                            <span>{ord.trackingStatus || 'Order Placed Successfully'}</span>
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {ord.statusMessage || (isProcessing ? 'Your order has been received and is being prepared for dispatch.' : 'Your shipment is in transit.')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Order Products & Action Buttons Grid */}
                    <div className="space-y-3.5">
                      {ord.items.map((item, idx) => {
                        const returnEligible = isEligibleForReturn(ord, item);
                        const buyAgainKey = `${item.productId}-${item.selectedSize}-${item.selectedColor}`;

                        return (
                          <div key={item.id || idx} className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-3.5 border-b border-slate-100 last:border-0 last:pb-0">
                            
                            {/* Product Info Left */}
                            <div className="flex items-start gap-3.5 flex-1">
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-md border border-slate-200 shrink-0 bg-white p-0.5"
                              />

                              <div className="space-y-0.5 text-xs">
                                <button
                                  onClick={() => navigate(`/product/${item.productId}`)}
                                  className="font-bold text-[#007185] hover:text-[#C7511F] hover:underline text-xs leading-snug text-left cursor-pointer"
                                >
                                  {item.productName}
                                </button>
                                <p className="text-slate-500 font-mono text-[10px]">SKU: {item.sku}</p>
                                <p className="text-slate-600 font-medium text-[11px]">
                                  Size: <span className="font-bold text-slate-800">{item.selectedSize}</span> | Colour: <span className="font-bold text-slate-800">{item.selectedColor}</span> | Qty: <span className="font-bold text-slate-800">{item.quantity}</span>
                                </p>
                                <p className="font-bold text-slate-900 text-xs mt-0.5">₹{item.priceAtTime?.toLocaleString('en-IN')}</p>

                                {/* Item Quick Action Buttons */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                                  {/* Buy It Again Button */}
                                  <button
                                    onClick={() => handleBuyItAgain(item)}
                                    disabled={buyAgainLoading[buyAgainKey]}
                                    className="px-3 py-1 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[11px] font-semibold rounded-full border border-[#D32F2F] shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <ShoppingCart className="w-3 h-3" />
                                    <span>{buyAgainLoading[buyAgainKey] ? 'Adding...' : 'Buy It Again'}</span>
                                  </button>

                                  {/* View your item Button */}
                                  <button
                                    onClick={() => navigate(`/product/${item.productId}`)}
                                    className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 text-[11px] font-medium rounded-full border border-[#D5D9D9] shadow-2xs transition-colors cursor-pointer"
                                  >
                                    View your item
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Order & Item Action Buttons Right */}
                            <div className="w-full sm:w-48 shrink-0 flex flex-col gap-1.5">
                              {/* Track Order Button */}
                              {!isCancelled && (
                                <button
                                  onClick={() => setTrackingModal({ open: true, order: ord })}
                                  className="w-full py-1.5 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-semibold rounded-full border border-[#D32F2F] shadow-2xs transition-colors cursor-pointer text-center"
                                >
                                  Track Order
                                </button>
                              )}

                              {/* View Return / Refund Status Button */}
                              {activeReturn && (
                                <button
                                  onClick={() => setReturnStatusModal({ open: true, returnReq: activeReturn, order: ord })}
                                  className="w-full py-1.5 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-semibold rounded-full border border-[#D32F2F] shadow-2xs transition-colors cursor-pointer text-center"
                                >
                                  View Return/Refund Status
                                </button>
                              )}

                              {/* Return / Replace Button */}
                              {!isCancelled && !activeReturn && (
                                <button
                                  onClick={() => handleOpenReturnModal(ord, item)}
                                  disabled={!returnEligible.eligible}
                                  title={!returnEligible.eligible ? returnEligible.reason : 'Return or Replace item'}
                                  className={`w-full py-1.5 text-xs font-medium rounded-full border shadow-2xs transition-colors cursor-pointer text-center ${
                                    returnEligible.eligible
                                      ? 'bg-white hover:bg-slate-50 text-slate-800 border-[#D5D9D9]'
                                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                  }`}
                                >
                                  Return / Replace
                                </button>
                              )}

                              {/* Write a product review Button */}
                              {isDelivered && (
                                <button
                                  onClick={() => setReviewModal({ open: true, order: ord, item: item })}
                                  className="w-full py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium rounded-full border border-[#D5D9D9] shadow-2xs transition-colors cursor-pointer text-center"
                                >
                                  Write a product review
                                </button>
                              )}

                              {/* Cancel Order Button */}
                              {isProcessing && !isCancelled && (
                                <button
                                  onClick={() => handleCancelOrder(ord.id)}
                                  className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-full border border-red-200 transition-colors cursor-pointer text-center"
                                >
                                  Cancel Order
                                </button>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODAL 1: VIEW ORDER DETAILS MODAL                          */}
      {/* ========================================================= */}
      {orderDetailsModal.open && orderDetailsModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="bg-[#131921] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Order Details</h3>
                <p className="text-xs text-slate-300">Order ID: {orderDetailsModal.order.orderCode}</p>
              </div>
              <button
                onClick={() => setOrderDetailsModal({ open: false, order: null })}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Top Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] text-slate-400">Shipping Address</h4>
                  <p className="font-bold text-slate-900 text-xs">{orderDetailsModal.order.fullName}</p>
                  <p>{orderDetailsModal.order.address}</p>
                  <p>{orderDetailsModal.order.city} - {orderDetailsModal.order.pincode}</p>
                  <p className="font-mono text-[11px] text-slate-500 mt-1">Phone: {orderDetailsModal.order.phone}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] text-slate-400">Payment & Status</h4>
                  <p><span className="font-bold">Payment Method:</span> {orderDetailsModal.order.paymentMethod}</p>
                  <p><span className="font-bold">Payment Status:</span> <span className="font-semibold text-emerald-700">{orderDetailsModal.order.paymentStatus}</span></p>
                  <p><span className="font-bold">Order Status:</span> <span className="font-semibold text-[#007185]">{orderDetailsModal.order.status}</span></p>
                  <p><span className="font-bold">Order Date:</span> {new Date(orderDetailsModal.order.createdAt).toLocaleString('en-GB')}</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-3">Order Items</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {orderDetailsModal.order.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                            <img src={item.productImage} alt="" className="w-8 h-8 object-cover rounded border border-slate-200" />
                            <div>
                              <span>{item.productName}</span>
                              <span className="block text-[10px] text-slate-400 font-normal">Size: {item.selectedSize} | Colour: {item.selectedColor}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">{item.sku}</td>
                          <td className="p-3 text-center font-bold">{item.quantity}</td>
                          <td className="p-3 text-right">₹{item.priceAtTime?.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right font-bold">₹{(item.priceAtTime * item.quantity)?.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-right font-medium text-xs">
                <p className="flex justify-between"><span>Items Subtotal:</span> <span>₹{(orderDetailsModal.order.totalAmount - (orderDetailsModal.order.shippingCost || 0) + (orderDetailsModal.order.discountAmount || 0))?.toLocaleString('en-IN')}</span></p>
                {orderDetailsModal.order.discountAmount > 0 && (
                  <p className="flex justify-between text-emerald-700"><span>Discount:</span> <span>- ₹{orderDetailsModal.order.discountAmount?.toLocaleString('en-IN')}</span></p>
                )}
                <p className="flex justify-between"><span>Shipping Charge:</span> <span>₹{orderDetailsModal.order.shippingCost?.toLocaleString('en-IN') || '0'}</span></p>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-[#B71C1C]">₹{orderDetailsModal.order.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: INVOICE MODAL                                     */}
      {/* ========================================================= */}
      {invoiceModal.open && invoiceModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="bg-[#131921] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Order Invoice</h3>
                <p className="text-xs text-slate-300">Tax Invoice #KAR-{invoiceModal.order.id}</p>
              </div>
              <button
                onClick={() => setInvoiceModal({ open: false, order: null })}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 bg-white">
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#B71C1C] tracking-wide">KARVIYAM</h2>
                  <p className="text-[11px] text-slate-500">Premium E-Commerce Store</p>
                  <p className="text-[11px] text-slate-500">Support: vanakkam@karviyam.com</p>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-sm text-slate-900">INVOICE</h4>
                  <p><span className="font-semibold">Invoice No:</span> KAR-{invoiceModal.order.id}</p>
                  <p><span className="font-semibold">Date:</span> {new Date(invoiceModal.order.createdAt).toLocaleDateString('en-GB')}</p>
                </div>
              </div>

              {/* Invoice Customer Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h5 className="font-bold text-slate-900 mb-1">Billed & Shipped To:</h5>
                  <p className="font-bold text-slate-900">{invoiceModal.order.fullName}</p>
                  <p>{invoiceModal.order.address}</p>
                  <p>{invoiceModal.order.city} - {invoiceModal.order.pincode}</p>
                  <p>Email: {invoiceModal.order.email}</p>
                </div>
                <div className="text-right">
                  <h5 className="font-bold text-slate-900 mb-1">Order Summary:</h5>
                  <p><span className="font-semibold">Order ID:</span> {invoiceModal.order.orderCode}</p>
                  <p><span className="font-semibold">Payment Method:</span> {invoiceModal.order.paymentMethod}</p>
                  <p><span className="font-semibold">Payment Status:</span> {invoiceModal.order.paymentStatus}</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Product Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {invoiceModal.order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{item.productName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">SKU: {item.sku} | Size: {item.selectedSize} | Color: {item.selectedColor}</span>
                      </td>
                      <td className="p-3 text-center font-bold">{item.quantity}</td>
                      <td className="p-3 text-right">₹{item.priceAtTime?.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold">₹{(item.priceAtTime * item.quantity)?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Grand Total Breakdown */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-right font-medium text-xs border-t border-slate-200 pt-3">
                  <p className="flex justify-between"><span>Subtotal:</span> <span>₹{(invoiceModal.order.totalAmount - (invoiceModal.order.shippingCost || 0) + (invoiceModal.order.discountAmount || 0))?.toLocaleString('en-IN')}</span></p>
                  {invoiceModal.order.discountAmount > 0 && (
                    <p className="flex justify-between text-emerald-700"><span>Discount:</span> <span>- ₹{invoiceModal.order.discountAmount?.toLocaleString('en-IN')}</span></p>
                  )}
                  <p className="flex justify-between"><span>Shipping Fee:</span> <span>₹{invoiceModal.order.shippingCost?.toLocaleString('en-IN') || '0'}</span></p>
                  <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-sm text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-[#B71C1C]">₹{invoiceModal.order.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Invoice Footer / Action */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <p className="text-[11px] text-slate-400 italic">This is a computer-generated tax invoice from Karviyam.</p>
                <button
                  onClick={() => window.open(`/api/orders/${invoiceModal.order.id}/invoice`, '_blank')}
                  className="px-5 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-bold rounded-full border border-[#D32F2F] shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download / Print Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: TRACK ORDER TIMELINE MODAL                        */}
      {/* ========================================================= */}
      {trackingModal.open && trackingModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#131921] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-red-400" />
                  <span>Track Package</span>
                </h3>
                <p className="text-xs text-slate-300">Order #{trackingModal.order.orderCode}</p>
              </div>
              <button
                onClick={() => setTrackingModal({ open: false, order: null })}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs text-slate-700">
              {/* Courier & Tracking ID Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Courier Partner</span>
                    <span className="font-bold text-slate-900 text-xs">{trackingModal.order.courierPartner || 'Express Shipping'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Tracking ID</span>
                    <span className="font-bold font-mono text-slate-900 text-xs">{trackingModal.order.trackingNumber || `KV-TRK-${trackingModal.order.id}`}</span>
                  </div>
                </div>

                {trackingModal.order.estimatedDelivery && (
                  <p className="text-xs text-emerald-700 font-semibold pt-1 border-t border-slate-200">
                    Estimated Delivery: {trackingModal.order.estimatedDelivery}
                  </p>
                )}
              </div>

              {/* Vertical Step Timeline */}
              <div className="space-y-4 relative pl-6 border-l-2 border-slate-200 ml-3">
                {[
                  { step: 'Order Placed', desc: 'Order received and confirmed', completed: true },
                  { step: 'Payment Confirmed', desc: 'Payment verified', completed: trackingModal.order.paymentStatus === 'PAID' || trackingModal.order.paymentMethod === 'COD' },
                  { step: 'Processing & Packed', desc: 'Item packed in warehouse', completed: ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(String(trackingModal.order.status).toUpperCase()) },
                  { step: 'Shipped', desc: 'Handed to courier partner', completed: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(String(trackingModal.order.status).toUpperCase()) },
                  { step: 'Out for Delivery', desc: 'Agent out for delivery', completed: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(String(trackingModal.order.status).toUpperCase()) },
                  { step: 'Delivered', desc: 'Delivered to recipient', completed: String(trackingModal.order.status).toUpperCase() === 'DELIVERED' }
                ].map((st, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${
                      st.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}>
                      {st.completed ? '✓' : idx + 1}
                    </div>
                    <div>
                      <h4 className={`font-bold text-xs ${st.completed ? 'text-slate-900' : 'text-slate-400'}`}>{st.step}</h4>
                      <p className="text-[11px] text-slate-500">{st.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Close Action */}
              <div className="pt-2 text-right">
                <button
                  onClick={() => setTrackingModal({ open: false, order: null })}
                  className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  Close Tracking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: RETURN / REPLACE ITEM FLOW MODAL                  */}
      {/* ========================================================= */}
      {returnModal.open && returnModal.order && returnModal.selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#131921] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-red-400" />
                  <span>Return / Replace Item</span>
                </h3>
                <p className="text-xs text-slate-300">Order #{returnModal.order.orderCode}</p>
              </div>
              <button
                onClick={() => setReturnModal({ open: false, order: null, selectedItem: null })}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="p-6 space-y-4 text-xs text-slate-700">
              {/* Product Selection */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">Select Item to Return</label>
                <select
                  value={returnModal.selectedItem.id}
                  onChange={(e) => {
                    const sel = returnModal.order.items.find(i => String(i.id) === e.target.value);
                    if (sel) {
                      setReturnModal(prev => ({ ...prev, selectedItem: sel }));
                      setReturnQty(sel.quantity);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium outline-none focus:border-[#007185]"
                >
                  {returnModal.order.items.map((i, idx) => (
                    <option key={idx} value={i.id}>{i.productName} (Qty: {i.quantity})</option>
                  ))}
                </select>
              </div>

              {/* Return vs Replace Selection */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">Request Option</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReturnType('RETURN')}
                    className={`py-2.5 px-4 font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      returnType === 'RETURN'
                        ? 'bg-[#B71C1C] text-white border-[#B71C1C]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Return Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnType('REPLACE')}
                    className={`py-2.5 px-4 font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      returnType === 'REPLACE'
                        ? 'bg-[#B71C1C] text-white border-[#B71C1C]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Replace Item
                  </button>
                </div>
              </div>

              {/* Quantity Picker */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">Quantity to Return</label>
                <select
                  value={returnQty}
                  onChange={(e) => setReturnQty(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium outline-none focus:border-[#007185]"
                >
                  {Array.from({ length: returnModal.selectedItem.quantity }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">Reason for Return</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold outline-none focus:border-[#007185]"
                >
                  <option value="Wrong item received">Wrong item received</option>
                  <option value="Damaged item">Damaged item</option>
                  <option value="Defective product">Defective product</option>
                  <option value="Size issue">Size issue</option>
                  <option value="Colour differs">Colour differs</option>
                  <option value="Item not as described">Item not as described</option>
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Additional Description */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">Comments / Description</label>
                <textarea
                  rows={2}
                  value={returnDesc}
                  onChange={(e) => setReturnDesc(e.target.value)}
                  placeholder="Provide additional details regarding the issue..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#007185]"
                />
              </div>

              {/* Photo Proof URL */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">Photo Proof URL (Optional)</label>
                <input
                  type="text"
                  value={returnImage}
                  onChange={(e) => setReturnImage(e.target.value)}
                  placeholder="https://example.com/damage_photo.jpg"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#007185]"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReturnModal({ open: false, order: null, selectedItem: null })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="px-6 py-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  {submittingReturn && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: RETURN / REFUND STATUS MODAL                      */}
      {/* ========================================================= */}
      {returnStatusModal.open && returnStatusModal.returnReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#131921] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Return / Refund Status</h3>
                <p className="text-xs text-slate-300">Request #{returnStatusModal.returnReq.id}</p>
              </div>
              <button
                onClick={() => setReturnStatusModal({ open: false, returnReq: null, order: null })}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs text-slate-700">
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 space-y-1">
                <p><span className="font-bold">Request Type:</span> {returnStatusModal.returnReq.type || 'RETURN'}</p>
                <p><span className="font-bold">Reason:</span> {returnStatusModal.returnReq.reason}</p>
                <p><span className="font-bold">Current Status:</span> <span className="font-bold text-purple-800">{returnStatusModal.returnReq.status}</span></p>
                <p><span className="font-bold">Submitted Date:</span> {new Date(returnStatusModal.returnReq.created_at || Date.now()).toLocaleDateString('en-GB')}</p>
              </div>

              {/* Status Timeline */}
              <div className="space-y-4 relative pl-6 border-l-2 border-purple-200 ml-3">
                {[
                  { title: 'Return Requested', done: true },
                  { title: 'Return Approved', done: ['APPROVED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'RECEIVED', 'REFUNDED'].includes(String(returnStatusModal.returnReq.status).toUpperCase()) },
                  { title: 'Pickup Scheduled', done: ['PICKUP_SCHEDULED', 'PICKED_UP', 'RECEIVED', 'REFUNDED'].includes(String(returnStatusModal.returnReq.status).toUpperCase()) },
                  { title: 'Item Picked Up', done: ['PICKED_UP', 'RECEIVED', 'REFUNDED'].includes(String(returnStatusModal.returnReq.status).toUpperCase()) },
                  { title: 'Return Received', done: ['RECEIVED', 'REFUNDED'].includes(String(returnStatusModal.returnReq.status).toUpperCase()) },
                  { title: 'Refund Completed', done: String(returnStatusModal.returnReq.status).toUpperCase() === 'REFUNDED' }
                ].map((st, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${
                      st.done
                        ? 'bg-purple-700 border-purple-700 text-white'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}>
                      {st.done ? '✓' : idx + 1}
                    </div>
                    <h4 className={`font-bold text-xs ${st.done ? 'text-slate-900' : 'text-slate-400'}`}>{st.title}</h4>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setReturnStatusModal({ open: false, returnReq: null, order: null })}
                  className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  Close Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: WRITE PRODUCT REVIEW MODAL                        */}
      {/* ========================================================= */}
      {reviewModal.open && reviewModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#131921] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#FFD814] fill-[#FFD814]" />
                  <span>Write Product Review</span>
                </h3>
                <p className="text-xs text-slate-300">{reviewModal.item.productName}</p>
              </div>
              <button
                onClick={() => setReviewModal({ open: false, order: null, item: null })}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4 text-xs text-slate-700">
              <div className="flex items-center gap-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Purchase</span>
              </div>

              {/* Rating Star Picker */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">Overall Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star className={`w-6 h-6 ${star <= reviewRating ? 'text-[#FFD814] fill-[#FFD814]' : 'text-slate-300'}`} />
                    </button>
                  ))}
                  <span className="font-bold text-slate-800 ml-2">{reviewRating} of 5 Stars</span>
                </div>
              </div>

              {/* Review Headline */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">Add a headline</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="What's most important to know?"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold outline-none focus:border-[#007185]"
                />
              </div>

              {/* Review Comment */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">Add a written review</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="What did you like or dislike? What did you use this product for?"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#007185]"
                />
              </div>

              {/* Review Image URL */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">Photo URL (Optional)</label>
                <input
                  type="text"
                  value={reviewImage}
                  onChange={(e) => setReviewImage(e.target.value)}
                  placeholder="https://example.com/product_photo.jpg"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#007185]"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewModal({ open: false, order: null, item: null })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold rounded-full border border-[#D32F2F] shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {submittingReview && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
