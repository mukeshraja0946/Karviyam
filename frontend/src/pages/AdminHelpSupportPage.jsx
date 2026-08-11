import React, { useState, useEffect, useRef } from 'react';
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
  Plus,
  CornerDownLeft,
  ShieldAlert
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ExportDropdown from '../components/ExportDropdown';

const CONTACT_EXPORT_HEADERS = [
  { label: 'Customer Name', accessor: (m) => m.name || m.customerName || 'Customer' },
  { label: 'Email Address', accessor: (m) => m.email || m.customerEmail },
  { label: 'Subject', accessor: (m) => m.subject || 'N/A' },
  { label: 'Latest Message', accessor: 'message' },
  { label: 'Status', accessor: (m) => String(m.status || 'NEW').toUpperCase() },
  { label: 'Date Received', accessor: (m) => m.createdAt ? new Date(m.createdAt).toLocaleString() : 'N/A' }
];

export default function AdminHelpSupportPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Active Thread Modal state
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const threadEndRef = useRef(null);

  // Send Admin Help modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingHelp, setSendingHelp] = useState(false);
  const [helpForm, setHelpForm] = useState({ subject: '', message: '' });

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

  useEffect(() => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/contact-messages')
        .catch(() => api.get('/contact/messages'))
        .catch(() => api.get('/contact'));
      const apiData = res?.data ? res.data : res;
      const list = Array.isArray(apiData?.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);
      setMessages(list);
    } catch (e) {
      console.error('Failed to fetch contact messages:', e);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConversation = async (msg) => {
    setSelectedMessage(msg);
    setLoadingThread(true);
    setReplyText('');
    try {
      const res = await api.get(`/admin/contact-messages/${msg.id}`).catch(() => api.get(`/contact/messages/${msg.id}`));
      const threadData = res.data?.data || res.data || res;
      setActiveThread(threadData);

      // Update local state to IN REVIEW if status was NEW
      const newStatus = (threadData.status || 'IN REVIEW').toUpperCase();
      setMessages(prev =>
        prev.map(m => m.id === msg.id ? { ...m, status: newStatus } : m)
      );
    } catch (e) {
      console.error('Error fetching conversation thread:', e);
      // Fallback: construct single message thread
      setActiveThread({
        id: msg.id,
        customerName: msg.name,
        customerEmail: msg.email,
        subject: msg.subject,
        status: (msg.status || 'NEW').toUpperCase(),
        createdAt: msg.createdAt,
        messages: [{
          id: msg.id,
          senderType: 'customer',
          senderEmail: msg.email,
          message: msg.message,
          createdAt: msg.createdAt
        }]
      });
    } finally {
      setLoadingThread(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText || !replyText.trim()) {
      toast.error('Please enter a reply message before sending.');
      return;
    }

    const msgId = selectedMessage?.id;
    if (!msgId) return;

    try {
      setSendingReply(true);
      toast.loading(`Sending reply email to ${selectedMessage.email}...`, { id: 'reply-toast' });

      const res = await api.post(`/admin/contact-messages/${msgId}/reply`, { message: replyText.trim() })
        .catch(() => api.post(`/contact/messages/${msgId}/reply`, { message: replyText.trim() }));

      const resData = res.data?.data || res.data || {};
      const updatedMessages = resData.messages || [];

      toast.success(resData.emailSent ? `Reply sent successfully to ${selectedMessage.email}!` : 'Reply stored in database thread!', { id: 'reply-toast' });

      if (updatedMessages.length > 0) {
        setActiveThread(prev => ({
          ...prev,
          status: resData.status || 'IN REVIEW',
          messages: updatedMessages
        }));
      } else {
        // Append locally if backend returns basic object
        const newMsgObj = {
          id: Date.now(),
          conversationId: msgId,
          senderType: 'admin',
          senderEmail: 'vanakkam@karviyam.com',
          message: replyText.trim(),
          createdAt: new Date().toISOString()
        };
        setActiveThread(prev => ({
          ...prev,
          status: 'IN REVIEW',
          messages: [...(prev?.messages || []), newMsgObj]
        }));
      }

      setMessages(prev =>
        prev.map(m => m.id === msgId ? { ...m, status: 'IN REVIEW', message: replyText.trim() } : m)
      );

      setReplyText('');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to send reply';
      toast.error(`Error: ${errMsg}`, { id: 'reply-toast' });
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const cleanStatus = newStatus.toUpperCase();
      toast.loading(`Updating status to ${cleanStatus}...`, { id: 'status-toast' });

      await api.put(`/admin/contact-messages/${id}/status`, { status: cleanStatus })
        .catch(() => api.post(`/admin/contact-messages/${id}/status`, { status: cleanStatus }));

      setMessages(prev =>
        prev.map(m => m.id === id ? { ...m, status: cleanStatus, isRead: cleanStatus === 'IN REVIEW' || cleanStatus === 'RESOLVED' } : m)
      );

      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(prev => ({ ...prev, status: cleanStatus }));
      }
      if (activeThread && activeThread.id === id) {
        setActiveThread(prev => ({ ...prev, status: cleanStatus }));
      }

      toast.success(`Conversation marked as ${cleanStatus}`, { id: 'status-toast' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status', { id: 'status-toast' });
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this support conversation?')) return;

    try {
      toast.loading('Deleting conversation...', { id: 'delete-toast' });
      await api.delete(`/admin/contact-messages/${id}`)
        .catch(() => api.post(`/admin/contact-messages/${id}/delete`));

      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
        setActiveThread(null);
      }
      toast.success('Conversation deleted successfully', { id: 'delete-toast' });
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

  const handleCreateTestMessage = async () => {
    try {
      toast.loading('Creating test customer inquiry in MySQL...', { id: 'test-msg-toast' });
      await api.post('/contact', {
        name: 'Mukesh',
        email: 'mukesh@gmail.com',
        subject: 'Payment issue',
        message: 'I need help with my payment.'
      });
      toast.success('Test message saved to MySQL! Updating table...', { id: 'test-msg-toast' });
      fetchMessages();
    } catch (e) {
      console.error(e);
      const errMsg = e.response?.data?.message || e.message || 'Failed to create test message';
      toast.error(`Error: ${errMsg}`, { id: 'test-msg-toast' });
    }
  };

  // Filter messages
  const filteredMessages = messages.filter(m => {
    const name = m.name || m.customerName || '';
    const email = m.email || m.customerEmail || '';
    const subject = m.subject || '';
    const msg = m.message || '';

    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      subject.toLowerCase().includes(search.toLowerCase()) ||
      msg.toLowerCase().includes(search.toLowerCase());

    const statusVal = String(m.status || (m.isRead ? 'IN REVIEW' : 'NEW')).toUpperCase();
    const matchesStatus = statusFilter === 'ALL' || statusVal === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const totalCount = messages.length;
  const newCount = messages.filter(m => String(m.status || 'NEW').toUpperCase() === 'NEW').length;
  const inReviewCount = messages.filter(m => String(m.status || '').toUpperCase() === 'IN REVIEW' || String(m.status || '').toUpperCase() === 'READ').length;
  const resolvedCount = messages.filter(m => String(m.status || '').toUpperCase() === 'RESOLVED').length;

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
            className="px-3 py-2 bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Insert Mukesh test inquiry into MySQL"
          >
            <Plus className="w-3.5 h-3.5 text-[#B71C1C]" />
            <span>Test DB Entry</span>
          </button>
          <ExportDropdown data={filteredMessages} headers={CONTACT_EXPORT_HEADERS} filename="Karviyam_Customer_Messages" />
          <button
            onClick={() => setShowSendModal(true)}
            className="px-4 py-2 bg-[#B71C1C] text-white text-xs font-bold rounded-lg shadow hover:bg-[#8E1414] transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send Support Email</span>
          </button>
          <button
            onClick={fetchMessages}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
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
            <h3 className="text-2xl font-black text-amber-700 mt-1">{inReviewCount}</h3>
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
            <option value="NEW">New ({newCount})</option>
            <option value="IN REVIEW">In Review ({inReviewCount})</option>
            <option value="RESOLVED">Resolved ({resolvedCount})</option>
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
                  const name = msg.name || msg.customerName || 'Customer';
                  const email = msg.email || msg.customerEmail || '';
                  const statusVal = String(msg.status || (msg.isRead ? 'IN REVIEW' : 'NEW')).toUpperCase();
                  const isNew = statusVal === 'NEW';
                  const isResolved = statusVal === 'RESOLVED';

                  return (
                    <tr
                      key={msg.id}
                      onClick={() => handleOpenConversation(msg)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${isNew ? 'bg-rose-50/30 font-semibold' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
                            {name ? name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{name}</div>
                            <span className="text-slate-500 text-[11px] flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{email}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 line-clamp-1">{msg.subject || 'General Support Inquiry'}</div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-600 line-clamp-2 text-[11px]">{msg.message}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        {isNew ? (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-extrabold rounded-full inline-flex items-center gap-1 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                            NEW
                          </span>
                        ) : isResolved ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold rounded-full inline-flex items-center gap-1 uppercase">
                            <Check className="w-3 h-3" />
                            RESOLVED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold rounded-full inline-flex items-center gap-1 uppercase">
                            <Clock className="w-3 h-3" />
                            IN REVIEW
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenConversation(msg)}
                            className="p-1.5 bg-slate-100 text-slate-700 hover:bg-[#B71C1C] hover:text-white rounded-md transition-colors"
                            title="Open Conversation Thread & Reply"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {statusVal !== 'IN REVIEW' && statusVal !== 'RESOLVED' && (
                            <button
                              onClick={() => handleUpdateStatus(msg.id, 'IN REVIEW')}
                              className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md transition-colors"
                              title="Mark as In Review"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {statusVal !== 'RESOLVED' && (
                            <button
                              onClick={() => handleUpdateStatus(msg.id, 'RESOLVED')}
                              className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors"
                              title="Mark as Resolved"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md transition-colors"
                            title="Delete Conversation"
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

      {/* Complete Conversation Thread & Reply Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#B71C1C] text-white flex items-center justify-center font-bold text-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-none">Support Conversation #{selectedMessage.id}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Customer: <strong className="text-white">{selectedMessage.name || selectedMessage.customerName}</strong> ({selectedMessage.email || selectedMessage.customerEmail})</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase ${
                  String(activeThread?.status || selectedMessage.status || 'NEW').toUpperCase() === 'RESOLVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : String(activeThread?.status || selectedMessage.status || 'NEW').toUpperCase() === 'IN REVIEW'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {String(activeThread?.status || selectedMessage.status || 'NEW').toUpperCase()}
                </span>
                <button onClick={() => { setSelectedMessage(null); setActiveThread(null); }} className="text-slate-400 hover:text-white p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conversation Information Summary */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Customer Name</span>
                  <span className="font-bold text-slate-900">{selectedMessage.name || selectedMessage.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Customer Email</span>
                  <span className="font-bold text-[#B71C1C]">{selectedMessage.email || selectedMessage.customerEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Subject</span>
                  <span className="font-bold text-slate-800 truncate block">{selectedMessage.subject || 'General Inquiry'}</span>
                </div>
              </div>
            </div>

            {/* Chronological Messages Body */}
            <div className="p-4 space-y-4 text-xs overflow-y-auto flex-1 bg-slate-50/50">
              {loadingThread ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B71C1C]" />
                  <p className="text-xs font-bold">Fetching complete conversation history...</p>
                </div>
              ) : (activeThread?.messages || []).length === 0 ? (
                <div className="p-4 bg-white border border-slate-200 rounded-xl">
                  <p className="font-bold text-slate-700 mb-1">Customer Message:</p>
                  <p className="text-slate-600 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              ) : (
                (activeThread?.messages || []).map((msgItem, idx) => {
                  const isCustomer = msgItem.senderType === 'customer' || msgItem.sender_type === 'customer';
                  return (
                    <div
                      key={msgItem.id || idx}
                      className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          {isCustomer ? (selectedMessage.name || 'Customer') : 'Karviyam Admin (vanakkam@karviyam.com)'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {msgItem.createdAt ? new Date(msgItem.createdAt).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'short' }) : ''}
                        </span>
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl max-w-[85%] text-xs shadow-xs leading-relaxed whitespace-pre-wrap ${
                          isCustomer
                            ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                            : 'bg-[#B71C1C] text-white rounded-tr-xs shadow-md'
                        }`}
                      >
                        {msgItem.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Admin Reply Box Form */}
            <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-slate-200 shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CornerDownLeft className="w-3.5 h-3.5 text-[#B71C1C]" />
                  <span>Send Admin Reply to <span className="text-[#B71C1C] font-mono">{selectedMessage.email || selectedMessage.customerEmail}</span></span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Email sent from: vanakkam@karviyam.com</span>
              </div>

              <textarea
                rows="3"
                placeholder="Type your reply to the customer here... (e.g. Hello Mukesh, we have verified your payment details...)"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#B71C1C] focus:bg-white transition-colors"
                required
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'IN REVIEW')}
                    className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>In Review</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'RESOLVED')}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Mark Resolved</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={sendingReply}
                  className="px-5 py-2 bg-[#B71C1C] text-white font-bold text-xs rounded-xl shadow hover:bg-[#8E1414] transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {sendingReply ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>SEND REPLY</span>
                    </>
                  )}
                </button>
              </div>
            </form>

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
