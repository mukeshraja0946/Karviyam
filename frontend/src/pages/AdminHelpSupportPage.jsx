import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Clock,
  User,
  Mail,
  CheckCircle,
  AlertCircle,
  Eye,
  Trash2,
  Send,
  Check,
  X,
  HelpCircle,
  Filter,
  FileText,
  Plus
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ExportDropdown from '../components/ExportDropdown';

const CONTACT_EXPORT_HEADERS = [
  { label: 'Customer Name', accessor: 'name' },
  { label: 'Email Address', accessor: 'email' },
  { label: 'Subject', accessor: (m) => m.subject || 'N/A' },
  { label: 'Message', accessor: 'message' },
  { label: 'Status', accessor: (m) => m.status || (m.isRead ? 'read' : 'new') },
  { label: 'Date Received', accessor: (m) => m.createdAt ? new Date(m.createdAt).toLocaleString() : 'N/A' }
];

export default function AdminHelpSupportPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingHelp, setSendingHelp] = useState(false);
  const [helpForm, setHelpForm] = useState({
    subject: '',
    message: ''
  });

  useEffect(() => {
    fetchMessages();

    const handleUpdate = () => {
      fetchMessages();
    };

    window.addEventListener('karviyam_contact_updated', handleUpdate);
    window.addEventListener('karviyam_data_mutated', handleUpdate);
    return () => {
      window.removeEventListener('karviyam_contact_updated', handleUpdate);
      window.removeEventListener('karviyam_data_mutated', handleUpdate);
    };
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/contact-messages').catch(() => api.get('/contact/messages'));
      const apiData = res.data ? res.data : res;
      const list = Array.isArray(apiData.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);
      setMessages(list);
    } catch (e) {
      console.error('Failed to fetch contact messages:', e);
      toast.error('Failed to load support messages');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      toast.loading(`Updating message status to ${newStatus}...`, { id: 'status-toast' });
      await api.put(`/admin/contact-messages/${id}/status`, { status: newStatus })
        .catch(() => api.post(`/admin/contact-messages/${id}/status`, { status: newStatus }));

      setMessages(prev =>
        prev.map(m => m.id === id ? { ...m, status: newStatus, isRead: newStatus === 'read' || newStatus === 'resolved' } : m)
      );

      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(prev => ({ ...prev, status: newStatus, isRead: newStatus === 'read' || newStatus === 'resolved' }));
      }

      toast.success(`Message marked as ${newStatus}`, { id: 'status-toast' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status', { id: 'status-toast' });
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this support message?')) return;

    try {
      toast.loading('Deleting message...', { id: 'delete-toast' });
      await api.delete(`/admin/contact-messages/${id}`)
        .catch(() => api.post(`/admin/contact-messages/${id}/delete`));

      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
      }
      toast.success('Message deleted successfully', { id: 'delete-toast' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete message', { id: 'delete-toast' });
    }
  };

  const handleSendAdminHelp = async (e) => {
    e.preventDefault();
    if (!helpForm.message || !helpForm.message.trim()) {
      toast.error('Please enter a help message content');
      return;
    }

    try {
      setSendingHelp(true);
      toast.loading('Sending support email to vanakkam@karviyam.com...', { id: 'help-toast' });
      await api.post('/admin/help', {
        subject: helpForm.subject || 'Admin Support Request',
        message: helpForm.message
      });

      toast.success('Support message sent successfully to vanakkam@karviyam.com', { id: 'help-toast' });
      setHelpForm({ subject: '', message: '' });
      setShowSendModal(false);
      fetchMessages();
    } catch (err) {
      console.error(err);
      toast.error('Failed to send admin help message', { id: 'help-toast' });
    } finally {
      setSendingHelp(false);
    }
  };

  // Filter messages
  const filteredMessages = messages.filter(m => {
    const matchesSearch =
      (m.name && m.name.toLowerCase().includes(search.toLowerCase())) ||
      (m.email && m.email.toLowerCase().includes(search.toLowerCase())) ||
      (m.subject && m.subject.toLowerCase().includes(search.toLowerCase())) ||
      (m.message && m.message.toLowerCase().includes(search.toLowerCase()));

    const statusVal = m.status || (m.isRead ? 'read' : 'new');
    const matchesStatus = statusFilter === 'ALL' || statusVal.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totalCount = messages.length;
  const newCount = messages.filter(m => (m.status === 'new' || (!m.status && !m.isRead))).length;
  const readCount = messages.filter(m => (m.status === 'read' || (!m.status && m.isRead))).length;
  const resolvedCount = messages.filter(m => m.status === 'resolved').length;

  const handleCreateTestMessage = async () => {
    try {
      toast.loading('Creating test customer inquiry in MySQL...', { id: 'test-msg-toast' });
      await api.post('/contact', {
        name: 'Test Customer',
        email: 'test@karviyam.com',
        subject: 'Support Email & Database Verification',
        message: 'This is an automated test inquiry verifying MySQL storage and SMTP delivery to vanakkam@karviyam.com.'
      });
      toast.success('Test message saved to MySQL! Updating table...', { id: 'test-msg-toast' });
      fetchMessages();
    } catch (e) {
      console.error(e);
      const errMsg = e.response?.data?.message || e.message || 'Failed to create test message';
      toast.error(`Error: ${errMsg}`, { id: 'test-msg-toast' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-[#B71C1C]" />
            <span>Help & Support Center</span>
          </h1>
          <p className="text-xs text-slate-500">Manage customer inquiries and send support messages to vanakkam@karviyam.com</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateTestMessage}
            className="px-3 py-2 bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            title="Insert a test inquiry into MySQL to verify system"
          >
            <Plus className="w-3.5 h-3.5 text-[#B71C1C]" />
            <span>Test DB Entry</span>
          </button>
          <ExportDropdown data={filteredMessages} headers={CONTACT_EXPORT_HEADERS} filename="Karviyam_Customer_Messages" />
          <button
            onClick={() => setShowSendModal(true)}
            className="px-4 py-2 bg-[#B71C1C] text-white text-xs font-bold rounded-lg shadow hover:bg-[#8E1414] transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Send Support Email</span>
          </button>
          <button
            onClick={fetchMessages}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh Messages"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Messages</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalCount}</h3>
          </div>
          <div className="p-3 bg-slate-100 rounded-lg text-slate-700">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">New Inquiries</p>
            <h3 className="text-2xl font-black text-rose-700 mt-1">{newCount}</h3>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">In Review</p>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{readCount}</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Resolved</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#B71C1C] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#B71C1C]"
          >
            <option value="ALL">All Messages ({totalCount})</option>
            <option value="new">New ({newCount})</option>
            <option value="read">Read ({readCount})</option>
            <option value="resolved">Resolved ({resolvedCount})</option>
          </select>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#B71C1C]" />
            <p className="text-xs font-bold">Loading support messages from MySQL...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No contact messages found</p>
            <p className="text-xs text-slate-500 mt-1">Customer inquiries submitted through /contact will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Message Excerpt</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Received Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMessages.map((msg) => {
                  const currentStatus = msg.status || (msg.isRead ? 'read' : 'new');
                  const isNew = currentStatus === 'new';
                  const isResolved = currentStatus === 'resolved';

                  return (
                    <tr key={msg.id} className={`hover:bg-slate-50/80 transition-colors ${isNew ? 'bg-rose-50/30 font-semibold' : ''}`}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
                            {msg.name ? msg.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{msg.name || 'Anonymous Customer'}</div>
                            <a href={`mailto:${msg.email}`} className="text-slate-500 text-[11px] hover:underline flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{msg.email}</span>
                            </a>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 line-clamp-1">{msg.subject || 'General Inquiry'}</div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-600 line-clamp-2 text-[11px]">{msg.message}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        {isNew ? (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-extrabold rounded-full inline-flex items-center gap-1 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                            New
                          </span>
                        ) : isResolved ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold rounded-full inline-flex items-center gap-1 uppercase">
                            <Check className="w-3 h-3" />
                            Resolved
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold rounded-full inline-flex items-center gap-1 uppercase">
                            <Clock className="w-3 h-3" />
                            Read
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedMessage(msg)}
                            className="p-1.5 bg-slate-100 text-slate-700 hover:bg-[#B71C1C] hover:text-white rounded-md transition-colors"
                            title="View Full Message"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {currentStatus !== 'read' && currentStatus !== 'resolved' && (
                            <button
                              onClick={() => handleUpdateStatus(msg.id, 'read')}
                              className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md transition-colors"
                              title="Mark as Read"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {currentStatus !== 'resolved' && (
                            <button
                              onClick={() => handleUpdateStatus(msg.id, 'resolved')}
                              className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors"
                              title="Mark as Resolved"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md transition-colors"
                            title="Delete Message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#B71C1C]" />
                <h3 className="font-bold text-sm">Customer Message Details</h3>
              </div>
              <button onClick={() => setSelectedMessage(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Customer Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedMessage.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Email Address</span>
                  <a href={`mailto:${selectedMessage.email}`} className="font-bold text-[#B71C1C] hover:underline text-sm">
                    {selectedMessage.email}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Date Received</span>
                  <span className="font-medium text-slate-700">
                    {selectedMessage.createdAt ? new Date(selectedMessage.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Current Status</span>
                  <span className="font-extrabold uppercase text-[#B71C1C]">
                    {selectedMessage.status || (selectedMessage.isRead ? 'read' : 'new')}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px] block mb-1">Subject</span>
                <div className="p-3 bg-white border border-slate-200 rounded-lg font-bold text-slate-900">
                  {selectedMessage.subject || 'General Inquiry'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px] block mb-1">Full Message</span>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 whitespace-pre-wrap leading-relaxed text-xs max-h-60 overflow-y-auto">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'read')}
                    className="px-3 py-1.5 bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Mark Read</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'resolved')}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Mark Resolved</span>
                  </button>
                </div>

                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || 'Karviyam Support Response')}`}
                  className="px-4 py-1.5 bg-[#B71C1C] text-white font-bold rounded-lg shadow hover:bg-[#8E1414] transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Reply Customer</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Admin Help Email Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#B71C1C] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                <h3 className="font-bold text-sm">Send Admin Support Email</h3>
              </div>
              <button onClick={() => setShowSendModal(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendAdminHelp} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                This will send an administrative support message directly to <strong>vanakkam@karviyam.com</strong> using the production SMTP server.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  placeholder="e.g. Hostinger SMTP & Gateway Configuration Issue"
                  value={helpForm.subject}
                  onChange={(e) => setHelpForm({ ...helpForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#B71C1C]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Support Message Content *</label>
                <textarea
                  rows="5"
                  placeholder="Describe your technical support or administrative request..."
                  value={helpForm.message}
                  onChange={(e) => setHelpForm({ ...helpForm, message: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#B71C1C]"
                  required
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingHelp}
                  className="px-5 py-2 bg-[#B71C1C] text-white font-bold rounded-lg shadow hover:bg-[#8E1414] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {sendingHelp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Email Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
