import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingBag, Search, Eye, FileText, CheckCircle, Clock, PackageCheck, Truck, CheckCheck, XCircle, RotateCcw, ChevronDown, Edit2, Trash2, X, Save, RefreshCw, Upload } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import InvoiceModal from '../components/InvoiceModal';
import ExportDropdown from '../components/ExportDropdown';
import BulkImportModal from '../components/BulkImportModal';

const ORDER_EXPORT_HEADERS = [
  { label: 'Order ID', accessor: (o) => o.orderCode || o.trackingNumber || `#ORD${o.id}` },
  { label: 'Customer Name', accessor: (o) => o.customer || o.fullName || o.shippingAddress?.fullName || 'Guest Customer' },
  { label: 'Email', accessor: 'email' },
  { label: 'Phone', accessor: 'phone' },
  { label: 'Date', accessor: (o) => o.date || (o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A') },
  { label: 'Amount (₹)', accessor: (o) => o.totalAmount != null ? o.totalAmount : o.amount || 0 },
  { label: 'Status', accessor: 'status' }
];

const INITIAL_MOCK_ORDERS = [
  { id: 1, orderCode: '#ORD12345', customer: 'Ravi Kumar', fullName: 'Ravi Kumar', email: 'ravi@example.com', phone: '+91 98765 43210', date: '05 May 2026', createdAt: '2026-05-05T14:30:00', totalAmount: 2499, status: 'DELIVERED', paymentStatus: 'Paid', trackingNumber: 'TRK-987654', address: 'Karviyam HQ', city: 'Chennai', pincode: '600001', items: [{ name: 'Karviyam Cyberpunk Tee', price: 899, quantity: 1 }] },
  { id: 2, orderCode: '#ORD12344', customer: 'Priya Sharma', fullName: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98123 45678', date: '05 May 2026', createdAt: '2026-05-05T10:15:00', totalAmount: 1999, status: 'SHIPPED', paymentStatus: 'Paid', trackingNumber: 'TRK-987655', address: 'Park Street', city: 'Kolkata', pincode: '700016', items: [{ name: 'Urban Linen Casual Shirt', price: 1299, quantity: 1 }] },
  { id: 3, orderCode: '#ORD12343', customer: 'Amit Singh', fullName: 'Amit Singh', email: 'amit@example.com', phone: '+91 97654 32109', date: '04 May 2026', createdAt: '2026-05-04T18:45:00', totalAmount: 3299, status: 'PROCESSING', paymentStatus: 'Pending', trackingNumber: 'TRK-987656', address: 'MG Road', city: 'Bangalore', pincode: '560001', items: [{ name: 'Apex Stealth Sneakers', price: 2499, quantity: 1 }] },
  { id: 4, orderCode: '#ORD12342', customer: 'Neha Patel', fullName: 'Neha Patel', email: 'neha@example.com', phone: '+91 96543 21098', date: '04 May 2026', createdAt: '2026-05-04T11:20:00', totalAmount: 999, status: 'DELIVERED', paymentStatus: 'Paid', trackingNumber: 'TRK-987657', address: 'SG Highway', city: 'Ahmedabad', pincode: '380015', items: [{ name: 'Royal Emerald Silver Pendant', price: 1999, quantity: 1 }] },
];

const STATUS_TABS = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'SHIPPED', label: 'Shipped' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'CANCELLED', label: 'Cancelled' },
  { id: 'RETURNED', label: 'Returned' },
];

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    status: 'PENDING',
    paymentStatus: 'Pending',
    address: '',
    city: '',
    pincode: '',
    trackingNumber: '',
    courierName: '',
    notes: ''
  });

  const urlStatus = (searchParams.get('status') || 'ALL').toUpperCase();
  const activeTab = STATUS_TABS.some(t => t.id === urlStatus) ? urlStatus : 'ALL';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      const apiData = res?.data ? res.data : res;
      const list = Array.isArray(apiData?.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);

      if (list.length > 0) {
        setOrders(list);
      } else {
        loadStoredOrMock();
      }
    } catch (e) {
      console.error(e);
      loadStoredOrMock();
    } finally {
      setLoading(false);
    }
  };

  const loadStoredOrMock = () => {
    try {
      const saved = localStorage.getItem('karviyam_admin_orders');
      if (saved) {
        setOrders(JSON.parse(saved));
      } else {
        setOrders(INITIAL_MOCK_ORDERS);
        localStorage.setItem('karviyam_admin_orders', JSON.stringify(INITIAL_MOCK_ORDERS));
      }
    } catch (e) {
      setOrders(INITIAL_MOCK_ORDERS);
    }
  };

  const handleTabChange = (tabId) => {
    if (tabId === 'ALL') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', tabId.toLowerCase());
    }
    setSearchParams(searchParams);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    toast.loading(`Updating order status to ${newStatus}...`, { id: 'ord-status-toast' });
    try {
      const res = await api.put(`/orders/${orderId}`, { status: newStatus });
      const apiData = res?.data ? res.data : res;
      if (apiData && apiData.success !== false) {
        toast.success(`Order #${orderId} status updated to ${newStatus}!`, { id: 'ord-status-toast' });
        await fetchOrders();
      } else {
        throw new Error(apiData?.message || 'Failed to update order status');
      }
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.message || 'Failed to update order status';
      toast.error(msg, { id: 'ord-status-toast' });
    }
  };

  const handleOpenEditModal = (order) => {
    setEditingOrder(order);
    setEditFormData({
      fullName: order.fullName || order.customer || '',
      email: order.email || '',
      phone: order.phone || '',
      status: (order.status || 'PENDING').toUpperCase(),
      paymentStatus: order.paymentStatus || 'Pending',
      address: order.address || order.shippingAddress?.addressLine || '',
      city: order.city || order.shippingAddress?.city || '',
      pincode: order.pincode || order.shippingAddress?.pincode || '',
      trackingNumber: order.trackingNumber || '',
      courierName: order.courierName || 'Delhivery',
      notes: order.notes || ''
    });
    setEditModalOpen(true);
  };

  const handleSaveOrderEdit = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;

    toast.loading(`Saving changes for Order #${editingOrder.id}...`, { id: 'ord-edit-toast' });
    try {
      const res = await api.put(`/orders/${editingOrder.id}`, editFormData);
      const apiData = res?.data ? res.data : res;

      if (apiData && apiData.success !== false) {
        toast.success(`Order #${editingOrder.id} updated successfully!`, { id: 'ord-edit-toast' });
        setEditModalOpen(false);
        await fetchOrders();
      } else {
        throw new Error(apiData?.message || 'Failed to update order');
      }
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.message || 'Failed to save order details';
      toast.error(msg, { id: 'ord-edit-toast' });
    }
  };

  const handleDeleteOrder = async (order) => {
    const code = order.orderCode || `#ORD${order.id}`;
    if (!window.confirm(`Are you sure you want to delete order ${code}?`)) return;

    toast.loading(`Deleting order ${code}...`, { id: 'ord-del-toast' });
    try {
      const res = await api.delete(`/orders/${order.id}`);
      const apiData = res?.data ? res.data : res;

      if (apiData && apiData.success !== false) {
        toast.success(`Order ${code} deleted permanently!`, { id: 'ord-del-toast' });
        await fetchOrders();
      } else {
        throw new Error(apiData?.message || 'Failed to delete order');
      }
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.message || 'Failed to delete order';
      toast.error(msg, { id: 'ord-del-toast' });
    }
  };

  const getOrderTimestamp = (order) => {
    if (order.createdAt) {
      const t = new Date(order.createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    if (order.date) {
      const t = new Date(order.date).getTime();
      if (!isNaN(t)) return t;
    }
    return order.id || 0;
  };

  const sortedOrders = [...orders].sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));

  const filtered = sortedOrders.filter((o) => {
    const displayCode = (o.orderCode || o.trackingNumber || `#ORD${o.id}`).toLowerCase();
    const customerName = (o.customer || o.fullName || o.shippingAddress?.fullName || '').toLowerCase();
    const emailStr = (o.email || '').toLowerCase();
    const phoneStr = (o.phone || '').toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch = displayCode.includes(query) || customerName.includes(query) || emailStr.includes(query) || phoneStr.includes(query);
    const currentStatus = (o.status || 'PENDING').toUpperCase();
    const matchesTab = activeTab === 'ALL' || currentStatus === activeTab;

    return matchesSearch && matchesTab;
  });

  const getStatusBadgeCount = (tabId) => {
    if (tabId === 'ALL') return orders.length;
    return orders.filter(o => (o.status || 'PENDING').toUpperCase() === tabId).length;
  };

  return (
    <div className="space-y-6">
      
      {/* Invoice Generator Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          isOpen={true}
          order={selectedInvoiceOrder}
          orderDetails={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* Edit Order Dialog Modal */}
      {editModalOpen && editingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="font-display font-bold text-lg">Edit Order details #{editingOrder.id}</h3>
                <p className="text-[11px] text-slate-400">Update customer details, status, delivery address & tracking</p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrderEdit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold outline-none focus:border-[#B71C1C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold outline-none focus:border-[#B71C1C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold outline-none focus:border-[#B71C1C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Order Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold outline-none focus:border-[#B71C1C]"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="RETURNED">RETURNED</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={editFormData.paymentStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold outline-none focus:border-[#B71C1C]"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Failed">Failed</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Delivery Address</label>
                  <input
                    type="text"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-medium outline-none focus:border-[#B71C1C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold outline-none focus:border-[#B71C1C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={editFormData.pincode}
                    onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono font-bold outline-none focus:border-[#B71C1C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Courier Partner</label>
                  <input
                    type="text"
                    value={editFormData.courierName}
                    onChange={(e) => setEditFormData({ ...editFormData, courierName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold outline-none focus:border-[#B71C1C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tracking AWB #</label>
                  <input
                    type="text"
                    value={editFormData.trackingNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, trackingNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono font-bold outline-none focus:border-[#B71C1C]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold transition-colors cursor-pointer shadow-md inline-flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Data Import Modal (PDF, Excel, CSV) */}
      <BulkImportModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        type="orders"
        onImportSuccess={() => fetchOrders()}
      />
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Order Management</h1>
          <p className="text-xs text-slate-500">Track customer orders, edit statuses & print invoices (Sorted by Newest First)</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown
            filename="orders_report"
            title="Orders Management Report"
            headers={ORDER_EXPORT_HEADERS}
            data={filtered}
          />
          <button
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Upload PDF, Excel or CSV for Bulk Updates"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            <span>Bulk Update (PDF/Excel)</span>
          </button>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = getStatusBadgeCount(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-[#B71C1C] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID, customer name, phone or email..."
            className="w-full bg-slate-50 border border-slate-200 text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-[#B71C1C]"
          />
        </div>
        <span className="text-xs font-bold text-slate-600">
          {filtered.length} {activeTab === 'ALL' ? 'Total' : activeTab} Orders Listed
        </span>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B71C1C]" />
            Loading store orders from database...
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-4 w-44 whitespace-nowrap">Order ID</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4 w-44 whitespace-nowrap">Created Date</th>
                <th className="p-4 w-28 whitespace-nowrap">Amount</th>
                <th className="p-4 w-36 whitespace-nowrap">Status</th>
                <th className="p-4 text-right w-1 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 font-medium">
                    No orders found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const displayCode = o.orderCode || o.trackingNumber || `#ORD${o.id}`;
                  const customerName = o.customer || o.fullName || o.shippingAddress?.fullName || 'Guest Customer';
                  const dateDisplay = o.date || (o.createdAt ? new Date(o.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A');
                  const amountDisplay = o.totalAmount != null ? o.totalAmount : o.amount || 0;

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 align-middle font-bold text-slate-900 whitespace-nowrap">{displayCode}</td>
                      <td className="p-4 align-middle">
                        <div className="font-bold text-slate-800">{customerName}</div>
                        {(o.email || o.phone) && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            {o.email && <span>{o.email}</span>}
                            {o.email && o.phone && <span> • </span>}
                            {o.phone && <span>{o.phone}</span>}
                          </div>
                        )}
                      </td>
                      <td className="p-4 align-middle text-slate-500 font-medium whitespace-nowrap">{dateDisplay}</td>
                      <td className="p-4 align-middle font-bold text-[#B71C1C] whitespace-nowrap">₹{amountDisplay}</td>
                      <td className="p-4 align-middle w-36 whitespace-nowrap">
                        {/* Custom Styled Status Dropdown */}
                        <div className="relative inline-flex items-center">
                          <select
                            value={(o.status || 'PENDING').toUpperCase()}
                            onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                            className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 font-extrabold text-[11px] tracking-wider text-slate-800 pl-3 pr-8 py-2 rounded-xl outline-none cursor-pointer focus:border-[#B71C1C] focus:ring-1 focus:ring-[#B71C1C] transition-all shadow-2xs"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="PROCESSING">PROCESSING</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                            <option value="RETURNED">RETURNED</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
                        </div>
                      </td>
                      
                      {/* Action Buttons: Edit, Delete, Print Invoice */}
                      <td className="p-4 align-middle text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => handleOpenEditModal(o)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Edit Order"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteOrder(o)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Delete</span>
                        </button>

                        <button
                          onClick={() => setSelectedInvoiceOrder({ ...o, orderCode: displayCode, customer: customerName, date: dateDisplay, totalAmount: amountDisplay })}
                          className="px-3 py-2 bg-red-50 hover:bg-[#B71C1C] hover:text-white text-[#B71C1C] font-bold text-[11px] rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Print Tax Invoice"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Print Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
