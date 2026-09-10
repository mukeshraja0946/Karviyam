import React, { useState, useEffect } from 'react';
import { RotateCcw, Search, Filter, CheckCircle2, XCircle, Clock, Eye, FileText, Check, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminReturnsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReq, setSelectedReq] = useState(null);

  // Status Modal Edit State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundRef, setRefundRef] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/returns/admin/list', {
        params: { status: statusFilter, search: searchTerm }
      });
      const data = res.data?.data || res.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load return requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReturns();
  };

  const handleOpenStatusModal = (reqItem) => {
    setSelectedReq(reqItem);
    setNewStatus(reqItem.status || 'RETURN/REFUND REQUESTED');
    setRefundAmount(reqItem.refund_amount || reqItem.order_total || '');
    setRefundRef(reqItem.refund_reference || '');
    setAdminNotes(reqItem.admin_notes || '');
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;
    setUpdating(true);
    try {
      const res = await api.put(`/returns/admin/${selectedReq.id}/status`, {
        status: newStatus,
        refundAmount: parseFloat(refundAmount) || 0,
        refundReference: refundRef,
        adminNotes: adminNotes
      });

      if (res.data?.success || res.status === 200) {
        toast.success(`Request #${selectedReq.id} updated to ${newStatus}!`);
        setStatusModalOpen(false);
        fetchReturns();
      } else {
        toast.error(res.data?.message || 'Failed to update request status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Unable to update return status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeClass = (st) => {
    const s = String(st || '').toUpperCase();
    if (s.includes('APPROVED') || s.includes('REFUNDED') || s.includes('COMPLETED')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s.includes('REJECTED') || s.includes('CANCELLED')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (s.includes('PROCESSING') || s.includes('REVIEW') || s.includes('PICKUP')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 flex items-center gap-2.5">
            <RotateCcw className="w-6 h-6 text-[#B71C1C]" />
            <span>Refund & Return Requests Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review customer return/refund submissions, inspect evidence, approve/reject, and track refund references.
          </p>
        </div>
        <button
          onClick={fetchReturns}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Request ID, Order ID, Customer Name, Email, Reason..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 text-xs text-slate-900 border border-slate-200 rounded-xl outline-none focus:border-[#B71C1C] focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 text-xs text-slate-800 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#B71C1C] font-semibold w-full md:w-auto"
          >
            <option value="ALL">All Statuses</option>
            <option value="RETURN/REFUND REQUESTED">Requested</option>
            <option value="UNDER REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="PICKUP SCHEDULED">Pickup Scheduled</option>
            <option value="ITEM RECEIVED">Item Received</option>
            <option value="REFUND PROCESSING">Refund Processing</option>
            <option value="REFUNDED">Refunded</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B71C1C]" />
            <p className="text-xs font-semibold">Loading return requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RotateCcw className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No Return or Refund Requests Found</p>
            <p className="text-xs text-slate-400">Customer requests will appear here when submitted.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Req #</th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Type & Reason</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">#{r.id}</td>
                    <td className="px-6 py-4 font-bold text-[#B71C1C]">#{r.order_id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{r.customer_name || 'Customer'}</div>
                      <div className="text-[11px] text-slate-400">{r.customer_email || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] bg-slate-100 px-2 py-0.5 rounded-md mr-1.5">
                        {r.type}
                      </span>
                      <span className="text-slate-700 font-semibold">{r.reason}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ₹{parseFloat(r.refund_amount || r.order_total || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-[11px]">
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenStatusModal(r)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-[#B71C1C] text-white font-bold text-[11px] rounded-xl transition-colors cursor-pointer"
                      >
                        Manage Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Status Modal */}
      {statusModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-red-400" />
                  <span>Update Return Request #{selectedReq.id}</span>
                </h3>
                <p className="text-[11px] text-slate-400">Order #{selectedReq.order_id} — {selectedReq.customer_name}</p>
              </div>
              <button
                onClick={() => setStatusModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 text-slate-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4 text-xs">
              
              {/* Customer Reason Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Reason: {selectedReq.reason}</div>
                {selectedReq.description && (
                  <p className="text-slate-600 text-[11px]">{selectedReq.description}</p>
                )}
                {selectedReq.images && selectedReq.images.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {selectedReq.images.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noreferrer" className="block border rounded-lg overflow-hidden w-14 h-14 bg-slate-200">
                        <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Request Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl p-3 font-semibold outline-none focus:border-[#B71C1C]"
                >
                  <option value="RETURN/REFUND REQUESTED">RETURN/REFUND REQUESTED</option>
                  <option value="UNDER REVIEW">UNDER REVIEW</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PICKUP SCHEDULED">PICKUP SCHEDULED</option>
                  <option value="ITEM RECEIVED">ITEM RECEIVED</option>
                  <option value="REFUND PROCESSING">REFUND PROCESSING</option>
                  <option value="REFUNDED">REFUNDED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Refund Amount (₹)</label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#B71C1C] font-semibold"
                    placeholder="e.g. 1499"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Refund Transaction Ref</label>
                  <input
                    type="text"
                    value={refundRef}
                    onChange={(e) => setRefundRef(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#B71C1C] font-semibold"
                    placeholder="e.g. REF-BANK-83921"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Admin Internal / Customer Notes</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#B71C1C]"
                  placeholder="Notes explaining return approval, rejection reason, or refund status details..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Status Changes</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
