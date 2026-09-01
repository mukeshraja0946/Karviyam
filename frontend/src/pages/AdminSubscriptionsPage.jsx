import React, { useState, useEffect } from 'react';
import { Mail, Search, Trash2, Power, DollarSign, CheckCircle2, Clock, AlertCircle, Loader2, Sparkles, RefreshCw, Layers } from 'lucide-react';
import ExportDropdown from '../components/ExportDropdown';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { broadcastSyncEvent } from '../services/api';

const SUBSCRIPTION_EXPORT_HEADERS = [
  { label: 'Subscriber Email', accessor: 'email' },
  { label: 'Subscription Status', accessor: 'status' },
  { label: 'Payment Status', accessor: 'payment_status' },
  { label: 'Amount Paid', accessor: (s) => `${s.currency || '₹'} ${s.amount}` },
  { label: 'Payment Method', accessor: 'payment_method' },
  { label: 'Transaction ID', accessor: 'transaction_id' },
  { label: 'Subscription Date', accessor: (s) => s.created_at ? new Date(s.created_at).toLocaleString() : '' }
];

export default function AdminSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, pending: 0, failed: 0, revenue: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Settings State
  const [settings, setSettings] = useState({
    enabled: true,
    price: 99,
    currency: 'INR',
    title: 'STAY UPDATED',
    description: 'Subscribe to get special drop alerts, VIP coupons & discounts.',
    buttonText: 'SUBSCRIBE NOW'
  });

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/subscriptions/subscribers?search=${encodeURIComponent(search)}&status=${statusFilter}`).catch(() => null);
      const data = res?.data?.data || res?.data;

      if (data) {
        setSubscribers(data.subscribers || []);
        if (data.metrics) setMetrics(data.metrics);
        if (data.settings) setSettings(data.settings);
      }
    } catch (e) {
      toast.error('Failed to fetch subscribers.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    toast.loading('Saving subscription settings...', { id: 'sub-admin-toast' });

    try {
      const res = await api.put('/admin/subscriptions/settings')
        .catch(() => api.put('/admin/subscriptions/admin-settings'))
        .catch(() => api.put('/subscriptions/admin/settings', settings));
      if (res.data?.success) {
        toast.success('Subscription settings updated successfully!', { id: 'sub-admin-toast' });
        broadcastSyncEvent('karviyam_subscription_updated');
        await fetchData();
      } else {
        toast.error(res.data?.message || 'Failed to save settings.', { id: 'sub-admin-toast' });
      }
    } catch (err) {
      toast.error('Error saving subscription settings.', { id: 'sub-admin-toast' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteSubscriber = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscriber record?')) return;
    toast.loading('Deleting subscriber record...', { id: 'sub-admin-toast' });

    try {
      await api.delete(`/admin/subscriptions/subscribers/${id}`);
      toast.success('Subscriber deleted.', { id: 'sub-admin-toast' });
      await fetchData();
    } catch (err) {
      toast.error('Failed to delete subscriber.', { id: 'sub-admin-toast' });
    }
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      
      {/* Page Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2">
            <Mail className="w-6 h-6 text-[#B71C1C]" />
            <span>VIP Subscriptions & Membership</span>
          </h1>
          <p className="text-xs text-slate-500">
            Manage storefront subscription settings, VIP drop alerts, online payment fees & subscriber lists
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportDropdown
            filename="karviyam_subscribers_report"
            title="KARVIYAM VIP Subscribers Report"
            headers={SUBSCRIPTION_EXPORT_HEADERS}
            data={subscribers}
          />
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Subscribers</span>
          <h3 className="font-black text-xl text-slate-900">{metrics.total}</h3>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-emerald-800">Active VIP Members</span>
          <h3 className="font-black text-xl text-emerald-700">{metrics.active}</h3>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-amber-800">Pending Payments</span>
          <h3 className="font-black text-xl text-amber-700">{metrics.pending}</h3>
        </div>

        <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-rose-800">Failed Payments</span>
          <h3 className="font-black text-xl text-rose-700">{metrics.failed}</h3>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1 col-span-2 lg:col-span-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Revenue Collected</span>
          <h3 className="font-black text-xl text-[#B71C1C]">₹{metrics.revenue.toLocaleString()}</h3>
        </div>
      </div>

      {/* Master Toggle & Settings Form */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Power className="w-4 h-4 text-[#B71C1C]" />
              <span>Subscription Master Configuration</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Control subscription section visibility on storefront and configure pricing & content.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 shrink-0">
            <span className={`text-xs font-black uppercase ${!settings.enabled ? 'text-slate-400' : 'text-slate-600'}`}>
              DISABLED
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B71C1C]" />
            </label>
            <span className={`text-xs font-black uppercase ${settings.enabled ? 'text-[#B71C1C]' : 'text-slate-400'}`}>
              ENABLED
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Subscription Price</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={settings.price}
                  onChange={(e) => setSettings({ ...settings, price: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 pl-7 pr-3 py-2.5 rounded-xl font-bold text-xs outline-none focus:border-[#B71C1C]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Section Title</label>
              <input
                type="text"
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                placeholder="STAY UPDATED"
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-xs outline-none focus:border-[#B71C1C]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Button CTA Text</label>
              <input
                type="text"
                value={settings.buttonText}
                onChange={(e) => setSettings({ ...settings, buttonText: e.target.value })}
                placeholder="SUBSCRIBE NOW"
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-xs outline-none focus:border-[#B71C1C]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Section Description / Sub-subtitle</label>
            <input
              type="text"
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              placeholder="Subscribe to get special drop alerts, VIP coupons & discounts."
              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-medium text-xs outline-none focus:border-[#B71C1C]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
            >
              {savingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Subscription Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Subscribers Table Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        
        {/* Table Filters Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 text-sm">Subscribers List</h3>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              {['ALL', 'ACTIVE', 'PENDING', 'FAILED'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                    statusFilter === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email..."
                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-xl text-xs outline-none focus:border-[#B71C1C]"
              />
            </div>
          </div>
        </div>

        {/* Subscribers Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Subscriber Email</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment Status</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Payment ID / Transaction</th>
                <th className="p-3">Subscription Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-[#B71C1C] mx-auto mb-2" />
                    <span>Loading subscriber records...</span>
                  </td>
                </tr>
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No subscribers found matching your criteria.
                  </td>
                </tr>
              ) : (
                subscribers.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900 font-mono">{sub.email}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-extrabold text-[10px] ${
                        sub.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sub.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {sub.status === 'ACTIVE' && '🟢 ACTIVE'}
                        {sub.status === 'PENDING' && '⏳ PENDING'}
                        {sub.status === 'FAILED' && '🔴 FAILED'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">
                      {sub.payment_status === 'SUCCESS' ? '✅ Paid' : '⏳ Pending Payment'}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {sub.currency || '₹'} {sub.amount}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {sub.payment_id || sub.transaction_id || '—'}
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {sub.created_at ? new Date(sub.created_at).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteSubscriber(sub.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
