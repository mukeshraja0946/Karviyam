import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Loader2,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';

export default function OrderTrackingModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [searchOrderId, setSearchOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchMyOrders = async () => {
    if (!user) return;
    try {
      const res = await api.get('/orders/my-orders').catch(() => null);
      const data = res?.data?.data || res?.data;
      if (Array.isArray(data) && data.length > 0) {
        setMyOrders(data);
        if (!selectedOrder) {
          setSelectedOrder(data[0]);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen) {
      fetchMyOrders();
    }
  }, [isOpen, user]);

  const handleSearchOrder = async (e) => {
    if (e) e.preventDefault();
    const query = searchOrderId.trim().replace(/\D/g, '') || searchOrderId.trim();

    if (!query) {
      toast.error('Please enter an Order ID or Order Number');
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/orders/${query}`);
      const data = res?.data?.data || res?.data;

      if (data && data.id) {
        setSelectedOrder(data);
        toast.success(`Found Order #${data.id}`);
      } else {
        toast.error('Order not found. Please verify your Order ID.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Order record not found. Please check the Order ID.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Timeline Steps Definition
  const TIMELINE_STEPS = [
    { key: 'Order Placed', label: 'Order Placed' },
    { key: 'Confirmed', label: 'Confirmed' },
    { key: 'Packed', label: 'Packed' },
    { key: 'Shipped', label: 'Shipped' },
    { key: 'Out for Delivery', label: 'Out for Delivery' },
    { key: 'Delivered', label: 'Delivered' }
  ];

  const getStepIndex = (statusStr) => {
    const s = String(statusStr || '').toUpperCase().trim();
    if (s.includes('DELIVERED')) return 5;
    if (s.includes('OUT_FOR_DELIVERY') || s.includes('OUT FOR DELIVERY')) return 4;
    if (s.includes('SHIPPED')) return 3;
    if (s.includes('PACKED')) return 2;
    if (s.includes('CONFIRMED')) return 1;
    if (s.includes('CANCELLED')) return -1;
    return 0; // Order Placed
  };

  const currentStepIdx = selectedOrder ? getStepIndex(selectedOrder.trackingStatus || selectedOrder.status) : 0;
  const isCancelled = selectedOrder && String(selectedOrder.status).toUpperCase() === 'CANCELLED';
  const isDelivered = currentStepIdx === 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] text-left animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center font-bold shadow-2xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-slate-900 uppercase tracking-tight leading-none">
                Live Order Tracking
              </h2>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                Track your package, courier details & delivery status in real time
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto font-sans text-xs space-y-6">
          
          {/* Search Bar / Order Selector */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <form onSubmit={handleSearchOrder} className="flex gap-2">
              <input
                type="text"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                placeholder="Enter Order ID (e.g. 10294)"
                className="flex-1 bg-white border border-slate-200 text-xs px-4 py-2.5 rounded-xl font-medium outline-none focus:border-[#B71C1C]"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Track Order</span>
              </button>
            </form>

            {myOrders.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Recent Orders:</span>
                {myOrders.slice(0, 5).map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelectedOrder(o)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer shrink-0 ${
                      selectedOrder?.id === o.id
                        ? 'bg-[#B71C1C] text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    Order #{o.id} ({o.status})
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedOrder ? (
            <div className="space-y-6">
              
              {/* Status Header Banner */}
              <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isCancelled
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : isDelivered
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-gradient-to-r from-red-50/80 to-rose-50/80 border-red-200 text-slate-900'
              }`}>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#B71C1C] block">
                    ORDER #{selectedOrder.id}
                  </span>
                  <h3 className="font-display font-black text-base sm:text-lg text-slate-900 mt-0.5 flex items-center gap-2">
                    {isCancelled ? (
                      <span className="text-red-700">Order Cancelled</span>
                    ) : isDelivered ? (
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>ORDER DELIVERED</span>
                      </span>
                    ) : (
                      <span>Status: {selectedOrder.trackingStatus || selectedOrder.status}</span>
                    )}
                  </h3>
                  {selectedOrder.statusMessage && (
                    <p className="text-xs font-medium text-slate-600 mt-1">
                      {selectedOrder.statusMessage}
                    </p>
                  )}
                </div>

                <div className="text-right text-xs shrink-0 font-medium">
                  {selectedOrder.estimatedDelivery && !isDelivered && (
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                      <Calendar className="w-4 h-4 text-[#B71C1C]" />
                      <span>Est. Delivery: {selectedOrder.estimatedDelivery}</span>
                    </div>
                  )}
                  {isDelivered && selectedOrder.deliveredAt && (
                    <div className="text-emerald-700 font-bold bg-white px-3 py-1.5 rounded-xl border border-emerald-200">
                      Delivered on: {new Date(selectedOrder.deliveredAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Tracking Progress Timeline */}
              {!isCancelled && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h4 className="font-display font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Tracking Timeline
                  </h4>

                  <div className="relative flex items-center justify-between w-full px-2 py-3">
                    {/* Background Progress Line */}
                    <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-200 -translate-y-1/2 z-0" />
                    <div
                      className="absolute top-1/2 left-4 h-1 bg-[#B71C1C] -translate-y-1/2 z-0 transition-all duration-500"
                      style={{ width: `${(Math.max(0, currentStepIdx) / (TIMELINE_STEPS.length - 1)) * 90}%` }}
                    />

                    {TIMELINE_STEPS.map((step, idx) => {
                      const isPassed = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center text-center group">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isPassed
                              ? 'bg-[#B71C1C] text-white shadow-xs'
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}>
                            {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span className={`text-[10px] font-bold mt-2 max-w-[70px] leading-tight ${
                            isCurrent ? 'text-[#B71C1C]' : isPassed ? 'text-slate-900' : 'text-slate-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Courier & Shipping Location Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#B71C1C]" />
                    <span>Courier & Tracking Info</span>
                  </h5>
                  <div className="space-y-1 text-slate-600 text-[11px] font-medium">
                    <p><span className="font-bold text-slate-800">Courier Partner:</span> {selectedOrder.courierPartner || 'Delivery Express'}</p>
                    <p><span className="font-bold text-slate-800">Tracking AWB #:</span> {selectedOrder.trackingNumber || 'KV-TRK-84920'}</p>
                    {selectedOrder.currentLocation && (
                      <p className="flex items-center gap-1 text-[#B71C1C] font-bold">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Current Hub: {selectedOrder.currentLocation}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#B71C1C]" />
                    <span>Delivery Destination</span>
                  </h5>
                  <div className="space-y-1 text-slate-600 text-[11px] font-medium">
                    <p className="font-bold text-slate-900">{selectedOrder.fullName}</p>
                    <p>{selectedOrder.address}</p>
                    <p>{selectedOrder.city} - {selectedOrder.pincode}</p>
                    <p>Phone: {selectedOrder.phone}</p>
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs text-slate-900 border-b border-slate-200 flex justify-between items-center">
                  <span>Order Items ({(selectedOrder.items || selectedOrder.orderItems || []).length})</span>
                  <span>Total: ₹{selectedOrder.totalAmount} ({selectedOrder.paymentMethod})</span>
                </div>
                <div className="divide-y divide-slate-100 p-3 space-y-2">
                  {(selectedOrder.items || selectedOrder.orderItems || []).map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-200 p-1 flex items-center justify-center">
                          <img
                            src={resolveImageUrl(item.imageUrl)}
                            alt={item.productName}
                            onError={handleImageError}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div>
                          <h6 className="font-bold text-slate-900 truncate max-w-[200px]">{item.productName}</h6>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Qty: {item.quantity} {item.selectedSize ? `| Size: ${item.selectedSize}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-slate-900">₹{item.priceAtTime * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Package className="w-12 h-12 mx-auto text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">Enter an Order ID to track your package live</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Logged in customers can also select from their recent orders list above.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 font-medium">Karviyam Express Delivery Network</span>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs px-5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
