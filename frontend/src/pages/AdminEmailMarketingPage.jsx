import React, { useState, useEffect } from 'react';
import { Mail, Send, Eye, Plus, Sparkles, CheckCircle2, Loader2, RefreshCw, FileText, Tag, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function AdminEmailMarketingPage() {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({ activeSubscribers: 0, totalSubscribers: 0, totalCampaignsSent: 0 });

  // Form State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipientType, setRecipientType] = useState('ACTIVE_SUBSCRIBERS');
  const [targetEmail, setTargetEmail] = useState('');
  const [couponCode, setCouponCode] = useState('');

  // Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/email-marketing/campaigns').catch(() => null);
      const data = res?.data?.data || res?.data;

      if (data) {
        setCampaigns(data.campaigns || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      toast.error('Failed to load email campaigns.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    if (sending) return;

    if (!subject.trim()) {
      toast.error('Please enter a campaign subject line.');
      return;
    }
    if (!content.trim()) {
      toast.error('Please enter email body content.');
      return;
    }
    if (recipientType === 'INDIVIDUAL' && !targetEmail.trim()) {
      toast.error('Please specify a recipient email address.');
      return;
    }

    if (!window.confirm(`Are you sure you want to dispatch this email campaign?`)) return;

    setSending(true);
    toast.loading('Dispatching email campaign to subscribers...', { id: 'email-camp-toast' });

    try {
      const payload = {
        subject: subject.trim(),
        content: content.trim(),
        recipientType,
        targetEmail: recipientType === 'INDIVIDUAL' ? targetEmail.trim() : undefined,
        couponCode: couponCode.trim() || undefined
      };

      const res = await api.post('/admin/email-marketing/send', payload);
      if (res.data?.success) {
        toast.success(res.data?.message || 'Email campaign dispatched successfully!', { id: 'email-camp-toast' });
        setSubject('');
        setContent('');
        setCouponCode('');
        setTargetEmail('');
        await fetchData();
      } else {
        toast.error(res.data?.message || 'Failed to send campaign.', { id: 'email-camp-toast' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error dispatching campaign.';
      toast.error(msg, { id: 'email-camp-toast' });
    } finally {
      setSending(false);
    }
  };

  const handleSendTestEmail = async () => {
    const email = window.prompt('Enter recipient email address for test email:', targetEmail || 'vanakkam@karviyam.com');
    if (!email) return;

    toast.loading(`Sending test email to ${email}...`, { id: 'test-email-toast' });
    try {
      const res = await api.post('/admin/email-marketing/test', { email });
      if (res.data?.success) {
        toast.success(`Test email sent to ${email} successfully!`, { id: 'test-email-toast' });
      } else {
        toast.error(res.data?.message || 'Test email failed.', { id: 'test-email-toast' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error sending test email.', { id: 'test-email-toast' });
    }
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2">
            <Mail className="w-6 h-6 text-[#B71C1C]" />
            <span>Email Marketing & VIP Campaigns</span>
          </h1>
          <p className="text-xs text-slate-500">
            Create, preview & dispatch promotional offer emails, coupon codes, and VIP drop announcements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSendTestEmail}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <Send className="w-4 h-4 text-emerald-400" />
            <span>Send Test Email</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-emerald-800">Active VIP Subscribers</span>
          <h3 className="font-black text-2xl text-emerald-700">{stats.activeSubscribers}</h3>
          <p className="text-[10px] text-emerald-800/80 font-medium">Verified active members ready to receive emails</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Registered Subscribers</span>
          <h3 className="font-black text-2xl text-slate-900">{stats.totalSubscribers}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Includes pending & completed subscribers</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Email Campaigns Sent</span>
          <h3 className="font-black text-2xl text-[#B71C1C]">{stats.totalCampaignsSent}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Historical campaign broadcasts dispatched</p>
        </div>
      </div>

      {/* Campaign Composer Form */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#B71C1C]" />
          <span>Create & Dispatch New Email Campaign</span>
        </h3>

        <form onSubmit={handleSendCampaign} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Target Audience */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
              <select
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-xs outline-none focus:border-[#B71C1C]"
              >
                <option value="ACTIVE_SUBSCRIBERS">Active VIP Subscribers Only ({stats.activeSubscribers})</option>
                <option value="ALL_SUBSCRIBERS">All Subscribers ({stats.totalSubscribers})</option>
                <option value="INDIVIDUAL">Specific Individual Email Address</option>
              </select>
            </div>

            {/* Individual Email input if selected */}
            {recipientType === 'INDIVIDUAL' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-xs outline-none focus:border-[#B71C1C]"
                />
              </div>
            )}

            {/* Optional Coupon Code */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Attach Promotional Coupon (Optional)</label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. KARVIYAM20"
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono font-bold text-xs text-[#B71C1C] outline-none focus:border-[#B71C1C]"
              />
            </div>
          </div>

          {/* Email Subject Line */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="🔥 KARVIYAM VIP Offer – Extra 20% OFF"
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-xs text-slate-900 outline-none focus:border-[#B71C1C]"
            />
          </div>

          {/* Email Body Content */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Content Message</label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Hello,\n\nEnjoy an exclusive KARVIYAM VIP offer on our latest streetwear and sterling silver jewellery collections.\n\nUse code: KARVIYAM20 at checkout for an extra 20% OFF.`}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium text-xs text-slate-800 outline-none focus:border-[#B71C1C]"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              disabled={!subject || !content}
              className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-slate-600" />
              <span>Preview Email</span>
            </button>

            <button
              type="submit"
              disabled={sending}
              className="bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching Campaign...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Campaign Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Sent Email History Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Campaign History Log</h3>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Campaign Subject</th>
                <th className="p-3">Audience</th>
                <th className="p-3">Recipients</th>
                <th className="p-3">Coupon Code</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Sent Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-[#B71C1C] mx-auto mb-2" />
                    <span>Loading email history...</span>
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    No email campaigns sent yet.
                  </td>
                </tr>
              ) : (
                campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{c.subject}</td>
                    <td className="p-3 font-semibold text-slate-600">{c.recipient_type}</td>
                    <td className="p-3 font-bold text-[#B71C1C]">{c.recipient_count} subscribers</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{c.coupon_code || '—'}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                        ✓ SENT
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-500 text-[11px]">
                      {c.sent_at ? new Date(c.sent_at).toLocaleString('en-IN') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Live Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Campaign Email Live Preview</h3>
              <button onClick={() => setPreviewOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Subject Line</span>
                <span className="font-extrabold text-slate-900 text-sm">{subject || 'No Subject'}</span>
              </div>

              <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-slate-200">
                {content || 'No content entered'}
              </div>

              {couponCode && (
                <div className="bg-red-50 border border-dashed border-red-300 p-3 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-red-700 uppercase block">Coupon Code Badge</span>
                  <span className="font-mono font-black text-lg text-[#B71C1C] tracking-widest">{couponCode}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-xl cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
