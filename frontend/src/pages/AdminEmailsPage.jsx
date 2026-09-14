import React, { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit3,
  Eye,
  Send,
  RefreshCw,
  Search,
  Filter,
  Sliders,
  Check,
  ChevronRight,
  ShieldCheck,
  Box,
  Truck,
  DollarSign,
  UserCheck,
  HelpCircle,
  Layers,
  Sparkles,
  Info,
  Clock,
  Upload,
  FileSpreadsheet,
  FileText,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { resolveImageUrl } from '../utils/imageUtils';

export default function AdminEmailsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'logs' | 'test'
  const [logoLoadError, setLogoLoadError] = useState(false);

  // Settings & Templates State
  const [settings, setSettings] = useState({
    emailNotificationsEnabled: true,
    enableOrderPlacedEmail: true,
    enableStatusUpdateEmail: true,
    enableOutForDeliveryEmail: true,
    enableDeliveredEmail: true,
    enableCancelledEmail: true,
    enableRefundEmail: true,
    emailLogoUrl: null
  });
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);

  // Filters for Audit Logs
  const [logFilters, setLogFilters] = useState({
    eventType: 'ALL',
    status: 'ALL',
    search: '',
    page: 1
  });
  const [logsLoading, setLogsLoading] = useState(false);

  // Active Modals
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Send Test Email State
  const [testEmailData, setTestEmailData] = useState({
    recipientEmail: '',
    templateKey: 'ORDER_PLACED'
  });
  const [sendingTest, setSendingTest] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);

  // Available Dynamic Variable Placeholders
  const templateVariables = [
    { code: '{{customer_name}}', desc: 'Customer Full Name' },
    { code: '{{customer_email}}', desc: 'Customer Registered Email' },
    { code: '{{order_id}}', desc: 'Order ID (e.g., ORD-17)' },
    { code: '{{order_date}}', desc: 'Order Date' },
    { code: '{{payment_method}}', desc: 'Payment Method (COD / UPI / Razorpay)' },
    { code: '{{payment_status}}', desc: 'Payment Status' },
    { code: '{{order_total}}', desc: 'Order Amount' },
    { code: '{{delivery_status}}', desc: 'Current Shipping/Delivery Status' },
    { code: '{{delivery_location}}', desc: 'Current Shipping Location' },
    { code: '{{tracking_number}}', desc: 'Courier Tracking Number' },
    { code: '{{estimated_delivery}}', desc: 'Estimated Delivery Window' },
    { code: '{{product_name}}', desc: 'Ordered Product Name' },
    { code: '{{quantity}}', desc: 'Quantity' },
    { code: '{{product_price}}', desc: 'Product Unit Price' },
    { code: '{{coupon_code}}', desc: 'Applied Coupon Code' },
    { code: '{{otp_code}}', desc: 'OTP Verification Security Code' }
  ];

  // Template Categories Mapping
  const categories = [
    {
      id: 'order',
      title: 'ORDER EMAILS',
      desc: 'Transactional emails sent during order placement and shipping updates',
      icon: Box,
      keys: [
        'ORDER_PLACED',
        'PAYMENT_CONFIRMED',
        'PROCESSING',
        'PACKED',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED'
      ]
    },
    {
      id: 'return',
      title: 'RETURN / REFUND EMAILS',
      desc: 'Notifications regarding product returns, claims, and refund credits',
      icon: DollarSign,
      keys: [
        'RETURN_REQUESTED',
        'RETURN_APPROVED',
        'RETURN_REJECTED',
        'REFUND_INITIATED',
        'REFUNDED'
      ]
    },
    {
      id: 'account',
      title: 'ACCOUNT EMAILS',
      desc: 'Security, registration, authentication, and user profile notifications',
      icon: UserCheck,
      keys: [
        'ACCOUNT_CREATED',
        'OTP_LOGIN',
        'PASSWORD_RESET',
        'EMAIL_VERIFICATION'
      ]
    },
    {
      id: 'other',
      title: 'OTHER EMAILS',
      desc: 'Support responses, newsletters, marketing promos, and administrative alerts',
      icon: Mail,
      keys: [
        'CONTACT_RESPONSE',
        'NEWSLETTER',
        'PROMOTIONAL',
        'ADMIN_NOTIFICATION'
      ]
    }
  ];

  // Fetch Settings & Templates on Mount
  useEffect(() => {
    fetchEmailSettings();
    fetchEmailLogs();
  }, []);

  const fetchEmailSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/email-notifications/settings');
      if (res.data && res.data.success) {
        setSettings(res.data.data.settings || {});
        setTemplates(res.data.data.templates || []);
      }
    } catch (err) {
      console.error('Failed to load email settings:', err);
      toast.error('Failed to load email notification settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailLogs = async () => {
    setLogsLoading(true);
    try {
      const params = new window.URLSearchParams();
      if (logFilters.eventType !== 'ALL') params.append('eventType', logFilters.eventType);
      if (logFilters.status !== 'ALL') params.append('status', logFilters.status);
      if (logFilters.search) params.append('search', logFilters.search);
      params.append('page', logFilters.page);
      params.append('limit', 30);

      const res = await api.get(`/admin/email-notifications/logs?${params.toString()}`);
      if (res.data && res.data.success) {
        setLogs(res.data.data.logs || []);
        setLogsTotal(res.data.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch email logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleToggleGlobalSetting = async (key) => {
    const updatedSettings = { ...settings, [key]: !settings[key] };
    setSettings(updatedSettings);
    try {
      await api.post('/admin/email-notifications/settings', { settings: updatedSettings });
      toast.success('Email settings saved to database!');
    } catch (err) {
      toast.error('Failed to update setting');
      fetchEmailSettings();
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading('Uploading custom email logo...');
    setUploadingLogo(true);
    try {
      const res = await api.post('/admin/email-notifications/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.success) {
        toast.success('Custom email logo uploaded & saved!', { id: toastId });
        setLogoLoadError(false);
        setSettings((prev) => ({ ...prev, emailLogoUrl: res.data.data.logoUrl }));
      } else {
        toast.error(res.data?.message || 'Logo upload failed', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload email logo', { id: toastId });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    const toastId = toast.loading('Removing custom email logo...');
    try {
      const res = await api.post('/admin/email-notifications/logo/remove');
      if (res.data && res.data.success) {
        toast.success('Custom logo removed. Default logo restored!', { id: toastId });
        setLogoLoadError(false);
        setSettings((prev) => ({ ...prev, emailLogoUrl: null }));
      }
    } catch (err) {
      toast.error('Failed to remove custom logo', { id: toastId });
    }
  };

  const handleExportExcel = async () => {
    const toastId = toast.loading('Generating Excel audit log file...');
    try {
      const params = new window.URLSearchParams();
      if (logFilters.eventType !== 'ALL') params.append('eventType', logFilters.eventType);
      if (logFilters.status !== 'ALL') params.append('status', logFilters.status);
      if (logFilters.search) params.append('search', logFilters.search);

      const response = await api.get(`/admin/email-notifications/logs/export/excel?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new window.Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Karviyam_Email_Audit_Logs_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel file exported successfully!', { id: toastId });
    } catch (err) {
      toast.error('Failed to export Excel file', { id: toastId });
    }
  };

  const handleExportPdf = async () => {
    const toastId = toast.loading('Generating PDF audit log report...');
    try {
      const params = new window.URLSearchParams();
      if (logFilters.eventType !== 'ALL') params.append('eventType', logFilters.eventType);
      if (logFilters.status !== 'ALL') params.append('status', logFilters.status);
      if (logFilters.search) params.append('search', logFilters.search);

      const response = await api.get(`/admin/email-notifications/logs/export/pdf?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new window.Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Karviyam_Email_Audit_Report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF report exported successfully!', { id: toastId });
    } catch (err) {
      toast.error('Failed to export PDF report', { id: toastId });
    }
  };

  const handleClearAllLogs = async () => {
    setClearingLogs(true);
    const toastId = toast.loading('Clearing all email delivery audit logs...');
    try {
      const res = await api.delete('/admin/email-notifications/logs');
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'All email delivery audit logs cleared successfully.', { id: toastId });
        setShowClearConfirmModal(false);
        setLogFilters((prev) => ({ ...prev, page: 1 }));
        fetchEmailLogs();
        fetchEmailSettings();
      } else {
        toast.error(res.data?.message || 'Failed to clear email delivery logs.', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear email delivery logs.', { id: toastId });
    } finally {
      setClearingLogs(false);
    }
  };

  const handleToggleTemplate = async (templateKey, currentStatus) => {
    const updatedTemplates = templates.map((t) =>
      t.template_key === templateKey ? { ...t, is_enabled: !currentStatus } : t
    );
    setTemplates(updatedTemplates);
    try {
      const targetTpl = updatedTemplates.find((t) => t.template_key === templateKey);
      await api.post('/admin/email-notifications/settings', {
        templates: [targetTpl]
      });
      toast.success(`${templateKey} template ${!currentStatus ? 'ENABLED' : 'DISABLED'}`);
    } catch (err) {
      toast.error('Failed to update template status');
      fetchEmailSettings();
    }
  };

  const handleSaveEditedTemplate = async (e) => {
    e.preventDefault();
    if (!editingTemplate) return;

    const toastId = toast.loading('Saving email template to database...');
    try {
      await api.post('/admin/email-notifications/settings', {
        templates: [editingTemplate]
      });
      toast.success('Email template updated successfully!', { id: toastId });
      setEditingTemplate(null);
      fetchEmailSettings();
    } catch (err) {
      toast.error('Failed to save template edits', { id: toastId });
    }
  };

  const handleOpenPreview = async (template) => {
    setPreviewTemplate(template);
    setPreviewLoading(true);
    try {
      const res = await api.post('/admin/email-notifications/preview', {
        templateKey: template.template_key,
        subject: template.subject,
        heading: template.heading,
        bodyHtml: template.body_html,
        buttonText: template.button_text,
        buttonUrl: template.button_url
      });

      if (res.data && res.data.success) {
        setPreviewHtml(res.data.data.html || '');
        setPreviewSubject(res.data.data.subject || '');
      }
    } catch (err) {
      toast.error('Failed to render live email preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailData.recipientEmail) {
      toast.error('Please enter a valid recipient email address');
      return;
    }

    const toastId = toast.loading(`Dispatching test email to ${testEmailData.recipientEmail}...`);
    setSendingTest(true);
    try {
      const targetTpl = templates.find((t) => t.template_key === testEmailData.templateKey) || {};
      const res = await api.post('/admin/email-notifications/test-email', {
        recipientEmail: testEmailData.recipientEmail,
        templateKey: testEmailData.templateKey,
        subject: targetTpl.subject,
        heading: targetTpl.heading,
        bodyHtml: targetTpl.body_html,
        buttonText: targetTpl.button_text,
        buttonUrl: targetTpl.button_url
      });

      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Test email dispatched successfully!', { id: toastId });
        fetchEmailLogs();
      } else {
        toast.error(res.data?.message || 'Test email failed to send', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test email', { id: toastId });
    } finally {
      setSendingTest(false);
    }
  };

  const insertVariableToEditField = (field, varCode) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      [field]: (editingTemplate[field] || '') + ' ' + varCode
    });
  };

  const getTemplateByKey = (key) => templates.find((t) => t.template_key === key);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-[#B71C1C] animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading Karviyam Email Control Center...</p>
      </div>
    );
  }

  const activeTemplatesCount = templates.filter((t) => t.is_enabled).length;

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 text-[#B71C1C] rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Email Management & Templates
            </h1>
            <span className="bg-red-100 text-[#B71C1C] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              Real Backend Events
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage transactional email triggers, custom email branding, placeholders, SMTP dispatches, and delivery logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchEmailSettings(); fetchEmailLogs(); }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-[#F5F5F5] hover:bg-red-50 hover:text-[#B71C1C] rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#D32F2F] to-[#B71C1C] rounded-xl hover:shadow-md transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Send Test Email
          </button>
        </div>
      </div>

      {/* QUICK SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{templates.length}</div>
            <div className="text-xs font-semibold text-slate-500">Configured Email Types</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{activeTemplatesCount} / {templates.length}</div>
            <div className="text-xs font-semibold text-slate-500">Active Triggers</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{logsTotal}</div>
            <div className="text-xs font-semibold text-slate-500">Total Email Logs</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            settings.smtpStatus?.status === 'CONNECTED' ? 'bg-emerald-50 text-emerald-600' :
            settings.smtpStatus?.status === 'AUTH_FAILED' ? 'bg-rose-50 text-rose-600' :
            settings.smtpStatus?.status === 'CONNECTION_FAILED' ? 'bg-amber-50 text-amber-600' :
            'bg-slate-100 text-slate-500'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className={`text-xs font-black flex items-center gap-1.5 ${
              settings.smtpStatus?.status === 'CONNECTED' ? 'text-emerald-600' :
              settings.smtpStatus?.status === 'AUTH_FAILED' ? 'text-rose-600' :
              settings.smtpStatus?.status === 'CONNECTION_FAILED' ? 'text-amber-600' :
              'text-slate-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                settings.smtpStatus?.status === 'CONNECTED' ? 'bg-emerald-500 animate-ping' :
                settings.smtpStatus?.status === 'AUTH_FAILED' ? 'bg-rose-500' :
                settings.smtpStatus?.status === 'CONNECTION_FAILED' ? 'bg-amber-500' :
                'bg-slate-400'
              }`}></span>
              {settings.smtpStatus?.status === 'CONNECTED' ? 'SMTP Connected' :
               settings.smtpStatus?.status === 'AUTH_FAILED' ? 'SMTP Auth Failed' :
               settings.smtpStatus?.status === 'CONNECTION_FAILED' ? 'SMTP Connection Failed' :
               'SMTP Not Configured'}
            </div>
            <div className="text-xs font-medium text-slate-400 mt-0.5 truncate max-w-[160px]" title={settings.smtpStatus?.message || settings.smtpStatus?.host || 'No details'}>
              {settings.smtpStatus?.host ? `${settings.smtpStatus.host}:${settings.smtpStatus.port}` : 'Checking backend status...'}
            </div>
          </div>
        </div>
      </div>

      {/* GLOBAL MASTER SWITCH BANNER */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <Sliders className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold">Master Email Notification Engine</h3>
            <p className="text-xs text-slate-300">
              {settings.emailNotificationsEnabled
                ? 'System is active and automatically dispatching transactional customer emails.'
                : 'GLOBAL PAUSE ACTIVE — All customer transactional emails are temporarily disabled.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleToggleGlobalSetting('emailNotificationsEnabled')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            settings.emailNotificationsEnabled
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-rose-500 text-white hover:bg-rose-600'
          }`}
        >
          {settings.emailNotificationsEnabled ? 'GLOBAL ENGINE: ON' : 'GLOBAL ENGINE: OFF'}
        </button>
      </div>

      {/* EMAIL BRANDING, VERIFIED SENDER & AUTO-SEND ORDER PLACED CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* VERIFIED SENDER EMAIL CARD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">VERIFIED SENDER EMAIL</h3>
                <p className="text-[11px] text-slate-500">Backend Enforced Mailbox</p>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">SENDER EMAIL</span>
                <span className="font-mono font-bold text-slate-900">vanakkam@karviyam.com</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                <span className="font-semibold text-slate-500">SENDER NAME</span>
                <span className="font-bold text-slate-900">Karviyam</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>✓ All customer emails are sent from this verified address.</span>
          </div>

          <div className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-700">DNS Anti-Spam Alignment (Google Workspace):</div>
            <div>• <strong>SPF (TXT):</strong> <code className="font-mono bg-white px-1 py-0.5 rounded border text-slate-800">v=spf1 include:_spf.google.com ~all</code></div>
            <div>• <strong>DKIM (TXT):</strong> <code className="font-mono bg-white px-1 py-0.5 rounded border text-slate-800">google._domainkey</code> (Generated in Google Admin Console)</div>
            <div>• <strong>DMARC (TXT):</strong> <code className="font-mono bg-white px-1 py-0.5 rounded border text-slate-800">v=DMARC1; p=none; rua=mailto:vanakkam@karviyam.com</code></div>
          </div>
        </div>

        {/* EMAIL BRANDING CARD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 text-[#B71C1C] rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">EMAIL BRANDING</h3>
              <p className="text-[11px] text-slate-500">Custom Email Header Logo</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="w-32 h-14 bg-white rounded-lg border border-slate-200 p-2 flex items-center justify-center overflow-hidden shrink-0">
              {settings.emailLogoUrl && !logoLoadError ? (
                <img
                  src={resolveImageUrl(settings.emailLogoUrl)}
                  alt="Custom Email Logo"
                  className="max-h-full max-w-full object-contain"
                  onError={() => {
                    console.warn('[Email Branding] Failed to load logo from URL:', settings.emailLogoUrl);
                    setLogoLoadError(true);
                  }}
                />
              ) : (
                <div className="text-[10px] font-black text-[#B71C1C] flex items-center gap-1">
                  <span className="w-6 h-6 rounded-md bg-[#B71C1C] text-white flex items-center justify-center font-serif text-xs">K</span>
                  KARVIYAM
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="text-xs font-bold text-slate-900">
                {settings.emailLogoUrl && !logoLoadError
                  ? 'Custom Header Logo Active'
                  : logoLoadError
                  ? '⚠️ Load Error — Default Logo Active'
                  : 'Default Karviyam Logo Active'}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Appears on all outgoing customer emails, previews, and test emails.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <label className="flex-1">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={uploadingLogo}
              />
              <div className="flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 hover:bg-red-100 text-[#B71C1C] rounded-xl text-xs font-bold transition-all cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {uploadingLogo ? 'Uploading Logo...' : 'Upload Logo'}
              </div>
            </label>

            {settings.emailLogoUrl && (
              <button
                onClick={handleRemoveLogo}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Remove Logo
              </button>
            )}
          </div>
        </div>

        {/* AUTO-SEND ORDER PLACED TOGGLE CARD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Box className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">ORDER PLACED EMAIL SETTINGS</h3>
                <p className="text-[11px] text-slate-500">Auto-send trigger for newly created orders</p>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Automatically Send Order Placed Email</span>
                <button
                  onClick={() => handleToggleGlobalSetting('enableOrderPlacedEmail')}
                  className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                    settings.enableOrderPlacedEmail
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  }`}
                >
                  {settings.enableOrderPlacedEmail ? '✓ ON' : '✕ OFF'}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Automatically send the Order Placed email to the customer's registered email after a successful order is created.
              </p>
            </div>
          </div>

          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Persisted in database settings system
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'templates'
              ? 'border-[#B71C1C] text-[#B71C1C]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4" />
          Email Templates & Triggers ({templates.length})
        </button>

        <button
          onClick={() => { setActiveTab('logs'); fetchEmailLogs(); }}
          className={`pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'logs'
              ? 'border-[#B71C1C] text-[#B71C1C]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Email Delivery Audit Logs ({logsTotal})
        </button>

        <button
          onClick={() => setActiveTab('test')}
          className={`pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'test'
              ? 'border-[#B71C1C] text-[#B71C1C]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Send className="w-4 h-4" />
          Send Test Email Sandbox
        </button>
      </div>

      {/* TAB 1: TEMPLATES & CATEGORIES */}
      {activeTab === 'templates' && (
        <div className="space-y-8">
          {categories.map((cat) => {
            const CategoryIcon = cat.icon;
            return (
              <div key={cat.id} className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                  <CategoryIcon className="w-5 h-5 text-[#B71C1C]" />
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">{cat.title}</h2>
                    <p className="text-[11px] text-slate-500">{cat.desc}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {cat.keys.map((key) => {
                    const tpl = getTemplateByKey(key);
                    if (!tpl) return null;

                    return (
                      <div
                        key={tpl.id || key}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          tpl.is_enabled
                            ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                            : 'bg-slate-50/70 border-slate-200 opacity-80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                              {tpl.template_key}
                            </span>

                            <button
                              onClick={() => handleToggleTemplate(tpl.template_key, Boolean(tpl.is_enabled))}
                              className={`px-3 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                                tpl.is_enabled
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              }`}
                            >
                              {tpl.is_enabled ? '✓ ON' : '✕ OFF'}
                            </button>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                            {tpl.subject || tpl.heading}
                          </h4>

                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {tpl.heading}
                          </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleOpenPreview(tpl)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Preview
                          </button>

                          <button
                            onClick={() => setEditingTemplate(tpl)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-red-50 hover:bg-red-100 text-[#B71C1C] rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>

                          <button
                            onClick={() => {
                              setTestEmailData({ recipientEmail: '', templateKey: tpl.template_key });
                              setActiveTab('test');
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[11px] transition-all cursor-pointer"
                            title="Test Email"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: EMAIL AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs by recipient, order ID, or subject..."
                value={logFilters.search}
                onChange={(e) => setLogFilters({ ...logFilters, search: e.target.value })}
                className="w-full bg-[#F8FAFC] text-xs text-slate-900 pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-[#B71C1C] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <select
                value={logFilters.eventType}
                onChange={(e) => setLogFilters({ ...logFilters, eventType: e.target.value, page: 1 })}
                className="bg-[#F8FAFC] text-xs text-slate-700 px-3 py-2 rounded-xl border border-slate-200 font-semibold outline-none"
              >
                <option value="ALL">All Event Types</option>
                <option value="ORDER_PLACED">Order Placed</option>
                <option value="PAYMENT_CONFIRMED">Payment Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="PACKED">Packed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>

              <select
                value={logFilters.status}
                onChange={(e) => setLogFilters({ ...logFilters, status: e.target.value, page: 1 })}
                className="bg-[#F8FAFC] text-xs text-slate-700 px-3 py-2 rounded-xl border border-slate-200 font-semibold outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="SENT">SENT</option>
                <option value="FAILED">FAILED</option>
                <option value="SKIPPED">SKIPPED</option>
              </select>

              <button
                onClick={fetchEmailLogs}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                title="Filter Logs"
              >
                <Filter className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowClearConfirmModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all cursor-pointer"
                title="Clear All Email Audit Logs"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>

              <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-all cursor-pointer"
                title="Export Filtered Logs to Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </button>

              <button
                onClick={handleExportPdf}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all cursor-pointer"
                title="Export Filtered Logs to PDF"
              >
                <FileText className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase">
                    <th className="p-3">Log ID</th>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">From Email</th>
                    <th className="p-3">Recipient Email</th>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Sent At</th>
                    <th className="p-3">Failure Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {logsLoading ? (
                    <tr>
                      <td colSpan="9" className="text-center py-8 text-slate-400">
                        Loading email audit logs...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-8 text-slate-400 font-semibold">
                        No email logs recorded matching filters.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-500">#{log.id}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">{log.event_type || log.email_type}</td>
                        <td className="p-3 font-mono font-semibold text-slate-600">{log.from_email || 'vanakkam@karviyam.com'}</td>
                        <td className="p-3 font-semibold text-slate-800">{log.recipient_email || log.customer_email || '—'}</td>
                        <td className="p-3 font-mono text-slate-600">{log.order_id ? `#ORD-${log.order_id}` : '—'}</td>
                        <td className="p-3 font-medium text-slate-700 truncate max-w-xs">{log.subject || '—'}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              log.status === 'SENT'
                                ? 'bg-emerald-100 text-emerald-700'
                                : log.status === 'FAILED'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          {log.created_at || log.sent_at ? new Date(log.created_at || log.sent_at).toLocaleString('en-IN') : '—'}
                        </td>
                        <td className="p-3 text-rose-500 text-[11px] truncate max-w-xs">
                          {log.failure_reason || log.error_message || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SEND TEST EMAIL */}
      {activeTab === 'test' && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Send Test Email</h3>
            <p className="text-xs text-slate-500 mt-1">
              Dispatch an actual transactional test email using your backend SMTP/Email service to verify formatting, branding logo, and deliverability.
            </p>
          </div>

          {/* REAL SMTP SERVER STATUS BANNER */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            settings.smtpStatus?.status === 'CONNECTED' ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' :
            settings.smtpStatus?.status === 'AUTH_FAILED' ? 'bg-rose-50/70 border-rose-200 text-rose-900' :
            settings.smtpStatus?.status === 'CONNECTION_FAILED' ? 'bg-amber-50/70 border-amber-200 text-amber-900' :
            'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="space-y-0.5">
              <div className="font-extrabold flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  settings.smtpStatus?.status === 'CONNECTED' ? 'bg-emerald-500 animate-ping' :
                  settings.smtpStatus?.status === 'AUTH_FAILED' ? 'bg-rose-500' :
                  settings.smtpStatus?.status === 'CONNECTION_FAILED' ? 'bg-amber-500' :
                  'bg-slate-400'
                }`}></span>
                SMTP Status: {settings.smtpStatus?.status === 'CONNECTED' ? 'Connected & Ready' :
                               settings.smtpStatus?.status === 'AUTH_FAILED' ? 'Authentication Failed (535)' :
                               settings.smtpStatus?.status === 'CONNECTION_FAILED' ? 'Host Connection Timeout' :
                               'Not Configured'}
              </div>
              <div className="text-[11px] opacity-80">
                Server: <span className="font-mono">{settings.smtpStatus?.host || 'N/A'}</span> : <span className="font-mono">{settings.smtpStatus?.port || 'N/A'}</span> | Account: <span className="font-mono">{settings.smtpStatus?.user || 'N/A'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchEmailSettings}
              className="px-3 py-1.5 bg-white/80 border border-slate-200 text-slate-700 font-bold text-[11px] rounded-lg hover:bg-white transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              Verify Connection
            </button>
          </div>

          <form onSubmit={handleSendTestEmail} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Recipient Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g., admin@karviyam.com or test@example.com"
                value={testEmailData.recipientEmail}
                onChange={(e) => setTestEmailData({ ...testEmailData, recipientEmail: e.target.value })}
                className="w-full bg-[#F8FAFC] text-xs text-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#B71C1C] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Select Template Key *
              </label>
              <select
                value={testEmailData.templateKey}
                onChange={(e) => setTestEmailData({ ...testEmailData, templateKey: e.target.value })}
                className="w-full bg-[#F8FAFC] text-xs text-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#B71C1C] outline-none font-mono"
              >
                {templates.map((t) => (
                  <option key={t.template_key} value={t.template_key}>
                    {t.template_key} — {t.subject}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-extrabold text-slate-800">Preview Information:</div>
              <div>Test email will automatically use current custom email logo (or default logo) and sample backend order values.</div>
            </div>

            <button
              type="submit"
              disabled={sendingTest}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#D32F2F] to-[#B71C1C] text-white text-xs font-extrabold rounded-xl hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sendingTest ? 'Sending Test Email...' : 'Send Test Email Now'}
            </button>
          </form>
        </div>
      )}

      {/* TEMPLATE EDITOR MODAL */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#B71C1C]" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Edit Template: <span className="font-mono text-[#B71C1C]">{editingTemplate.template_key}</span>
                </h3>
              </div>
              <button
                onClick={() => setEditingTemplate(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedTemplate} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Dynamic Variables Selector */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-1.5">
                  Available Dynamic Variables (Click to Insert)
                </label>
                <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-28 overflow-y-auto">
                  {templateVariables.map((v) => (
                    <button
                      type="button"
                      key={v.code}
                      onClick={() => insertVariableToEditField('body_html', v.code)}
                      className="px-2 py-1 bg-white hover:bg-red-50 hover:text-[#B71C1C] text-slate-700 rounded-md text-[10px] font-mono border border-slate-200 transition-all cursor-pointer"
                      title={v.desc}
                    >
                      {v.code}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Email Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={editingTemplate.subject || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  className="w-full bg-[#F8FAFC] text-xs text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#B71C1C] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Main Email Heading *
                </label>
                <input
                  type="text"
                  required
                  value={editingTemplate.heading || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, heading: e.target.value })}
                  className="w-full bg-[#F8FAFC] text-xs text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#B71C1C] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Email Body HTML / Text *
                </label>
                <textarea
                  rows="6"
                  required
                  value={editingTemplate.body_html || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body_html: e.target.value })}
                  className="w-full bg-[#F8FAFC] text-xs font-mono text-slate-900 p-3.5 rounded-xl border border-slate-200 focus:border-[#B71C1C] outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.button_text || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, button_text: e.target.value })}
                    className="w-full bg-[#F8FAFC] text-xs text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#B71C1C] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    CTA Button Target URL
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.button_url || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, button_url: e.target.value })}
                    className="w-full bg-[#F8FAFC] text-xs text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#B71C1C] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Footer Text
                </label>
                <input
                  type="text"
                  value={editingTemplate.footer_text || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, footer_text: e.target.value })}
                  className="w-full bg-[#F8FAFC] text-xs text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#B71C1C] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#B71C1C] hover:bg-red-800 rounded-xl shadow-xs cursor-pointer"
                >
                  Save Template to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE HTML PREVIEW MODAL */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-slate-400">EMAIL PREVIEW MODE — SAMPLE DATA ONLY</div>
                <div className="text-xs font-bold text-white line-clamp-1">Subject: {previewSubject}</div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 bg-slate-100 p-4 overflow-y-auto flex justify-center">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mb-2 text-[#B71C1C]" />
                  <p className="text-xs font-semibold">Generating HTML email preview...</p>
                </div>
              ) : (
                <iframe
                  title="Email HTML Preview"
                  srcDoc={previewHtml}
                  className="w-full max-w-2xl h-[70vh] bg-white rounded-xl shadow-lg border border-slate-200"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CLEAR ALL LOGS MODAL */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Clear All Email Delivery Logs?
                </h3>
                <p className="text-xs text-slate-400 font-medium">Permanent Database Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              This will permanently delete all email delivery audit records from the database. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                disabled={clearingLogs}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllLogs}
                disabled={clearingLogs}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {clearingLogs ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All Logs
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
