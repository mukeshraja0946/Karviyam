import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  Users,
  Megaphone,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { broadcastSyncEvent } from '../services/api';

export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcasts, setBroadcasts] = useState([]);

  const [form, setForm] = useState({
    title: '',
    message: '',
    targetAudience: 'ALL',
    startDate: '',
    endDate: '',
    isEnabled: true
  });

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/admin/broadcasts');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setBroadcasts(data);
      }
    } catch (err) {
      console.error('Error loading broadcasts:', err);
      toast.error('Failed to load promotional broadcasts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      toast.error('Title and message are required');
      return;
    }

    setBroadcasting(true);
    try {
      await api.post('/notifications/admin/broadcast', form);
      toast.success('Promotional notification broadcasted successfully!');
      setForm({
        title: '',
        message: '',
        targetAudience: 'ALL',
        startDate: '',
        endDate: '',
        isEnabled: true
      });
      broadcastSyncEvent('karviyam_notifications_updated');
      fetchBroadcasts();
    } catch (err) {
      console.error('Error broadcasting notification:', err);
      toast.error(err.response?.data?.message || 'Failed to broadcast notification');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleToggleBroadcast = async (b) => {
    try {
      await api.put(`/notifications/admin/broadcasts/${b.id}/toggle`, {
        isEnabled: !b.is_enabled
      });
      toast.success('Broadcast status updated');
      broadcastSyncEvent('karviyam_notifications_updated');
      fetchBroadcasts();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#B71C1C]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Customer Promotional Notifications</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Send promotional alerts and important store updates to customer notification panels.
            </p>
          </div>
        </div>

        <button
          onClick={fetchBroadcasts}
          className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Broadcast Form */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#B71C1C]" />
            New Broadcast Notification
          </h2>

          <form onSubmit={handleBroadcastSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Notification Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Festival Special Offer! 20% OFF"
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#B71C1C]/20 focus:border-[#B71C1C]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Message Content *</label>
              <textarea
                rows="4"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Write the promotional message here..."
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#B71C1C]/20 focus:border-[#B71C1C]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target Audience</label>
              <select
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2"
              >
                <option value="ALL">All Registered Customers</option>
                <option value="VIP">VIP Subscribers Only</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isBroadEnabled"
                checked={form.isEnabled}
                onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
                className="w-4 h-4 text-[#B71C1C] rounded border-slate-300"
              />
              <label htmlFor="isBroadEnabled" className="text-xs font-bold text-slate-700">
                Broadcast Immediately (Active)
              </label>
            </div>

            <button
              type="submit"
              disabled={broadcasting}
              className="w-full py-2.5 text-xs font-bold text-white bg-[#B71C1C] hover:bg-red-800 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-red-900/10 disabled:opacity-50"
            >
              {broadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Broadcast Notification
            </button>
          </form>
        </div>

        {/* Broadcast History Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-600" />
            Promotional Broadcast History ({broadcasts.length})
          </h2>

          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#B71C1C] animate-spin" />
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
              <p className="text-xs text-slate-500">No promotional broadcasts created yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {broadcasts.map(b => (
                <div key={b.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900">{b.title}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                        {b.target_audience || 'ALL'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{b.message}</p>
                    <p className="text-[10px] text-slate-400">
                      Created: {new Date(b.created_at).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleBroadcast(b)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      b.is_enabled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {b.is_enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {b.is_enabled ? 'ACTIVE' : 'DISABLED'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
