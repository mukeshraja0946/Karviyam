import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Package, User, MapPin, Clock, RefreshCw } from 'lucide-react';

export default function UserProfilePage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    let allOrders = [];

    // 1. Try fetching from Backend MySQL REST API
    try {
      const res = await api.get('/orders');
      const apiData = res.data ? res.data : res;
      const list = Array.isArray(apiData.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);
      
      if (list.length > 0) {
        allOrders = list.map(o => ({
          id: o.id,
          orderCode: o.orderCode || o.trackingNumber || `#ORD${o.id}`,
          trackingNumber: o.trackingNumber || o.orderCode || `KV-TRK-${o.id}`,
          status: o.status || 'PENDING',
          items: Array.isArray(o.items) && o.items.length > 0 ? o.items.map(i => ({
            id: i.id || Date.now(),
            productName: i.productName || (i.product ? i.product.name : 'Product'),
            productImage: i.productImage || (i.product ? i.product.imageUrl : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'),
            priceAtTime: i.priceAtTime != null ? i.priceAtTime : (i.price != null ? i.price : (i.product ? i.product.price : 899)),
            quantity: i.quantity || 1
          })) : [
            {
              id: 1,
              productName: 'Karviyam Cyberpunk Oversized Tee',
              productImage: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
              priceAtTime: 899,
              quantity: 1
            }
          ],
          totalAmount: o.totalAmount != null ? o.totalAmount : o.amount || 899,
          createdAt: o.createdAt || o.date || new Date().toISOString()
        }));
      }
    } catch (e) {
      console.error('Failed to load API orders:', e);
    }

    // 2. Load Local Storage Placed Orders
    try {
      const saved = localStorage.getItem('karviyam_admin_orders');
      if (saved) {
        const localList = JSON.parse(saved);
        if (Array.isArray(localList) && localList.length > 0) {
          const userEmail = (user?.email || '').toLowerCase().trim();
          
          const userLocalOrders = localList.filter(o => {
            if (!userEmail) return true;
            const oEmail = (o.email || o.shippingAddress?.email || '').toLowerCase().trim();
            return !oEmail || oEmail === userEmail || o.customer === user?.fullName;
          }).map(o => ({
            id: o.id,
            orderCode: o.orderCode || `#ORD${o.id}`,
            trackingNumber: o.trackingNumber || o.orderCode || `KV-TRK-${o.id}`,
            status: o.status || 'PENDING',
            items: Array.isArray(o.items) && o.items.length > 0 ? o.items.map(i => ({
              id: i.id || Date.now(),
              productName: i.productName || (i.product ? i.product.name : 'Karviyam Item'),
              productImage: i.productImage || (i.product ? i.product.imageUrl : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'),
              priceAtTime: i.priceAtTime != null ? i.priceAtTime : (i.price != null ? i.price : (i.product ? i.product.price : 899)),
              quantity: i.quantity || 1
            })) : [
              {
                id: 1,
                productName: 'Karviyam Cyberpunk Oversized Tee',
                productImage: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
                priceAtTime: 899,
                quantity: 1
              }
            ],
            totalAmount: o.totalAmount != null ? o.totalAmount : o.amount || 899,
            createdAt: o.createdAt || o.date || new Date().toISOString()
          }));

          // Merge without duplicate IDs
          const existingIds = new Set(allOrders.map(o => String(o.id)));
          userLocalOrders.forEach(lo => {
            if (!existingIds.has(String(lo.id))) {
              allOrders.push(lo);
            }
          });
        }
      }
    } catch (e) {
      console.error('Failed to load local orders:', e);
    }

    // Sort newest first
    allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setOrders(allOrders);
    setLoading(false);
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 max-w-7xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* User Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs h-fit text-center">
          <div className="w-20 h-20 bg-[#B71C1C] text-white font-black text-2xl rounded-full flex items-center justify-center mx-auto mb-4 shadow-md shadow-[#B71C1C]/30">
            {user?.fullName ? user.fullName[0].toUpperCase() : 'M'}
          </div>
          <h2 className="font-display font-extrabold text-lg text-slate-900">{user?.fullName || 'Madhan'}</h2>
          <p className="text-xs text-slate-500 mb-4">{user?.email || 'madhan@gmail.com'}</p>
          <div className="text-left text-xs space-y-2.5 border-t border-slate-100 pt-4">
            <p className="flex items-center gap-2 text-slate-600 font-medium">
              <User className="w-4 h-4 text-[#B71C1C] shrink-0" />
              <span>{user?.phone || '+91 98765 43210'}</span>
            </p>
            <p className="flex items-center gap-2 text-slate-600 font-medium">
              <MapPin className="w-4 h-4 text-[#B71C1C] shrink-0" />
              <span>{user?.address || '123 Karviyam Street, Chennai 600001'}</span>
            </p>
          </div>
        </div>

        {/* Order History */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-black text-2xl text-slate-900">Order History</h2>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
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
              {orders.map((ord) => (
                <div key={ord.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3.5 text-xs gap-2">
                    <div>
                      <span className="font-extrabold text-slate-900">{ord.orderCode}</span>
                      <span className="text-slate-400 ml-2 font-mono text-[11px]">({ord.trackingNumber})</span>
                    </div>
                    <span className={`font-extrabold px-3 py-1 rounded-full uppercase text-[10px] ${
                      ord.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                      ord.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {ord.status}
                    </span>
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

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">
                      Placed on {new Date(ord.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-display font-black text-base text-[#B71C1C]">Total Amount: ₹{ord.totalAmount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
