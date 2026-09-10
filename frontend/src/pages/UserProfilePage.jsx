import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Package, User, MapPin, Clock, RefreshCw, LogOut, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function UserProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Return Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnType, setReturnType] = useState('RETURN');
  const [returnReason, setReturnReason] = useState('Damaged or Defective Item');
  const [returnDesc, setReturnDesc] = useState('');
  const [returnImage, setReturnImage] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully 👋');
    navigate('/login');
  };

  useEffect(() => {
    fetchOrdersAndReturns();
  }, [user]);

  const fetchOrdersAndReturns = async () => {
    setLoading(true);
    let allOrders = [];

    // Fetch Orders & My Return Requests
    try {
      const [ordRes, retRes] = await Promise.all([
        api.get('/orders').catch(() => null),
        api.get('/returns/my-requests').catch(() => null)
      ]);

      if (ordRes) {
        const apiData = ordRes.data ? ordRes.data : ordRes;
        const list = Array.isArray(apiData.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);
        
        if (list.length > 0) {
          allOrders = list.map(o => ({
            id: o.id,
            orderCode: o.orderCode || o.trackingNumber || `#ORD${o.id}`,
            trackingNumber: o.trackingNumber || o.orderCode || `KV-TRK-${o.id}`,
            status: o.status || 'PENDING',
            items: Array.isArray(o.items) ? o.items.map(i => ({
              id: i.id || Date.now(),
              productName: i.productName || (i.product ? i.product.name : 'Item'),
              productImage: i.productImage || (i.product ? i.product.imageUrl : ''),
              priceAtTime: i.priceAtTime != null ? i.priceAtTime : (i.price != null ? i.price : (i.product ? i.product.price : 0)),
              quantity: i.quantity || 1
            })) : [],
            totalAmount: o.totalAmount != null ? o.totalAmount : o.total_amount || 0,
            createdAt: o.createdAt || o.created_at || o.orderDate || Date.now()
          }));
        }
      }

      if (retRes) {
        const retData = retRes.data?.data || retRes.data || [];
        setReturnRequests(Array.isArray(retData) ? retData : []);
      }
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setOrders(allOrders);
      setLoading(false);
    }
  };

  const handleOpenReturnModal = (ord) => {
    setSelectedOrder(ord);
    setReturnType('RETURN');
    setReturnReason('Damaged or Defective Item');
    setReturnDesc('');
    setReturnImage('');
    setReturnModalOpen(true);
  };

  const handleSubmitReturnRequest = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!returnReason) {
      toast.error('Please select a return reason');
      return;
    }

    setSubmittingReturn(true);
    try {
      const res = await api.post('/returns', {
        orderId: selectedOrder.id,
        type: returnType,
        reason: returnReason,
        description: returnDesc,
        images: returnImage ? [returnImage] : []
      });

      if (res.data?.success || res.status === 201 || res.status === 200) {
        toast.success('Return/Refund request submitted successfully!');
        setReturnModalOpen(false);
        fetchOrdersAndReturns();
      } else {
        toast.error(res.data?.message || 'Failed to submit return request');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Unable to submit return request');
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#D32F2F] to-[#B71C1C] text-white flex items-center justify-center font-display font-black text-2xl shadow-md">
              {user?.fullName?.charAt(0) || user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
                {user?.fullName || user?.name || 'Customer Account'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Account Settings
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-[#B71C1C] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Orders Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#B71C1C]" />
              <span>Order History & Returns</span>
            </h2>
            <button
              onClick={fetchOrdersAndReturns}
              className="text-xs text-slate-500 hover:text-[#B71C1C] flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="bg-white p-10 rounded-3xl text-center border border-slate-200/80 shadow-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B71C1C]" />
              <p className="text-xs text-slate-500 font-medium">Loading your placed orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl text-center border border-slate-200/80 shadow-xs">
              <Package className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No orders placed yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => {
                const activeReturn = returnRequests.find(r => String(r.order_id) === String(ord.id));
                const isCancelled = String(ord.status).toUpperCase() === 'CANCELLED';

                return (
                  <div key={ord.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3.5 text-xs gap-2">
                      <div>
                        <span className="font-extrabold text-slate-900">{ord.orderCode}</span>
                        <span className="text-slate-400 ml-2 font-mono text-[11px]">({ord.trackingNumber})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-extrabold px-3 py-1 rounded-full uppercase text-[10px] ${
                          ord.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                          ord.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.status}
                        </span>

                        {activeReturn && (
                          <span className="font-bold px-3 py-1 rounded-full uppercase text-[10px] bg-purple-100 text-purple-800 border border-purple-200">
                            {activeReturn.type}: {activeReturn.status}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {ord.items.map((item, idx) => (
                        <div key={item.id || idx} className="flex items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                          <img src={item.productImage} alt="" className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Qty: {item.quantity} × ₹{item.priceAtTime}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pt-3 border-t border-slate-100 gap-3">
                      <span className="text-slate-500 font-medium">
                        Placed on {new Date(ord.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-display font-black text-base text-[#B71C1C]">Total: ₹{ord.totalAmount}</span>
                        
                        {!isCancelled && !activeReturn && (
                          <button
                            onClick={() => handleOpenReturnModal(ord)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-[#B71C1C] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Return & Refund</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Return & Refund Request Modal */}
      {returnModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-red-400" />
                  <span>Request Return & Refund</span>
                </h3>
                <p className="text-[11px] text-slate-400">Order {selectedOrder.orderCode}</p>
              </div>
              <button
                onClick={() => setReturnModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 text-slate-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReturnRequest} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Request Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReturnType('RETURN')}
                    className={`py-2.5 px-4 font-bold rounded-xl border text-center transition-all ${
                      returnType === 'RETURN'
                        ? 'bg-[#B71C1C] text-white border-[#B71C1C]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Return Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnType('REFUND')}
                    className={`py-2.5 px-4 font-bold rounded-xl border text-center transition-all ${
                      returnType === 'REFUND'
                        ? 'bg-[#B71C1C] text-white border-[#B71C1C]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Refund Only
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Return / Refund</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl p-3 font-semibold outline-none focus:border-[#B71C1C]"
                >
                  <option value="Damaged or Defective Item">Damaged or Defective Item</option>
                  <option value="Wrong Item Delivered">Wrong Item Delivered</option>
                  <option value="Size or Fitting Issue">Size or Fitting Issue</option>
                  <option value="Product Not as Described">Product Not as Described</option>
                  <option value="Changed My Mind">Changed My Mind</option>
                  <option value="Quality Not Satisfactory">Quality Not Satisfactory</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Details / Explanation</label>
                <textarea
                  rows={3}
                  value={returnDesc}
                  onChange={(e) => setReturnDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#B71C1C]"
                  placeholder="Describe the issue with your item..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Supporting Photo / Image URL (Optional)</label>
                <input
                  type="text"
                  value={returnImage}
                  onChange={(e) => setReturnImage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#B71C1C]"
                  placeholder="e.g. https://domain.com/photo.jpg or image URL"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="px-6 py-2.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  {submittingReturn && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
