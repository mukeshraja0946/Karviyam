import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Globe,
  Upload,
  Image as ImageIcon,
  CreditCard,
  Mail,
  Sliders,
  Wrench,
  ShieldCheck,
  MapPin,
  Phone,
  MessageSquare,
  Building2,
  FileText,
  Hash,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('company'); // 'company', 'payment', 'sequence', 'general'

  const [settings, setSettings] = useState({
    // Company Information
    storeName: 'Karviyam Ventures Private Limited',
    legalCompanyName: 'Karviyam Ventures Private Limited',
    gstNo: '33AAACK1234F1Z9',
    panNo: 'AAACK1234F',
    cinNo: 'U74999TN2026PTC123456',
    state: 'Tamil Nadu',
    stateCode: '33',
    address: 'Karviyam Tower, Park Avenue, Chennai, Tamil Nadu 600001',
    warehouseAddress: 'Karviyam Logistics Park, Erode, Tamil Nadu 638001',
    supportEmail: 'vanakkam@karviyam.com',
    supportPhone: '+91 98765 43210',
    website: 'www.karviyam.com',
    signatoryName: 'Karviyam Operations',
    signatoryDesignation: 'Authorized Signatory',

    // Order & Invoice Sequences
    orderPrefix: 'KV-ORD-',
    orderNextSeq: '1',
    invoicePrefix: 'KAR-',
    invoiceNextSeq: '1',

    // Payment Methods
    codEnabled: true,
    razorpayEnabled: true,
    stripeEnabled: true,
    onlinePaymentEnabled: true,
    defaultPaymentMethod: 'COD',

    // Branding & General
    footerAbout: 'Karviyam is a premium marketplace destination for high-street streetwear, 925 sterling silver jewellery, luxury kicks, and lifestyle products.',
    announcementText: 'FESTIVE SALE IS LIVE! UP TO 60% OFF ON HIGH-STREET WEAR & FINE JEWELLERY.',
    logoUrl: '',
    maxProductImages: '6',
    
    // Maintenance Mode & System Controls
    maintenanceMode: false,
    maintenanceTitle: "We'll Be Right Back!",
    maintenanceSubtitle: "SYSTEM UNDER MAINTENANCE",
    maintenanceMessage: 'Karviyam is currently undergoing scheduled platform maintenance to bring you exciting new drops! We will be back online shortly.',
    maintenanceEstimatedTime: 'Estimated Uptime: Back Online Soon',
    maintenanceShowTimer: true,
    maintenanceShowSocial: true,
    maintenanceAllowSearchEngines: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Fetch dedicated company settings record first
      const compRes = await api.get('/settings/company').catch(() => null);
      const compData = compRes?.data?.data || compRes?.data;

      const res = await api.get('/settings').catch(() => null);
      const apiData = res?.data ? res.data : (res || {});
      const dataMap = apiData.data || apiData;

      if (dataMap && typeof dataMap === 'object') {
        setSettings(prev => ({
          ...prev,
          storeName: compData?.companyDisplayName || dataMap.storeName || prev.storeName,
          legalCompanyName: compData?.legalCompanyName || dataMap.legalCompanyName || dataMap.storeName || prev.legalCompanyName,
          gstNo: compData?.gstNumber || dataMap.gstNo || prev.gstNo,
          panNo: compData?.panNumber || dataMap.panNo || prev.panNo,
          cinNo: compData?.cinNumber || dataMap.cinNo || prev.cinNo,
          state: compData?.state || dataMap.state || prev.state,
          stateCode: compData?.stateCode || dataMap.stateCode || prev.stateCode,
          address: compData?.registeredAddress || dataMap.address || prev.address,
          warehouseAddress: compData?.warehouseAddress || dataMap.warehouseAddress || prev.warehouseAddress,
          supportEmail: compData?.supportEmail || dataMap.supportEmail || prev.supportEmail,
          supportPhone: compData?.supportPhone || dataMap.supportPhone || prev.supportPhone,
          website: compData?.website || dataMap.website || prev.website,
          signatoryName: compData?.authorizedSignatory || dataMap.signatoryName || prev.signatoryName,
          signatoryDesignation: compData?.designation || dataMap.signatoryDesignation || prev.signatoryDesignation,
          orderPrefix: dataMap.orderPrefix || prev.orderPrefix,
          orderNextSeq: dataMap.orderNextSeq || prev.orderNextSeq,
          invoicePrefix: dataMap.invoicePrefix || prev.invoicePrefix,
          invoiceNextSeq: dataMap.invoiceNextSeq || prev.invoiceNextSeq,
          codEnabled: dataMap.codEnabled !== 'false',
          razorpayEnabled: dataMap.razorpayEnabled !== 'false',
          stripeEnabled: dataMap.stripeEnabled !== 'false',
          onlinePaymentEnabled: dataMap.onlinePaymentEnabled !== 'false',
          defaultPaymentMethod: dataMap.defaultPaymentMethod || prev.defaultPaymentMethod,
          footerAbout: dataMap.footerAbout || prev.footerAbout,
          announcementText: dataMap.announcementText || prev.announcementText,
          logoUrl: dataMap.logoUrl || prev.logoUrl,
          maxProductImages: dataMap.maxProductImages || prev.maxProductImages,
          maintenanceMode: dataMap.maintenanceMode === 'true',
          maintenanceTitle: dataMap.maintenanceTitle || prev.maintenanceTitle,
          maintenanceSubtitle: dataMap.maintenanceSubtitle || prev.maintenanceSubtitle,
          maintenanceMessage: dataMap.maintenanceMessage || prev.maintenanceMessage,
          maintenanceEstimatedTime: dataMap.maintenanceEstimatedTime || prev.maintenanceEstimatedTime,
          maintenanceShowTimer: dataMap.maintenanceShowTimer !== 'false',
          maintenanceShowSocial: dataMap.maintenanceShowSocial !== 'false',
          maintenanceAllowSearchEngines: dataMap.maintenanceAllowSearchEngines !== 'false',
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const notifyChanges = () => {
    window.dispatchEvent(new Event('karviyam_logo_updated'));
    window.dispatchEvent(new Event('karviyam_maintenance_updated'));
    window.dispatchEvent(new Event('karviyam_footer_updated'));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo file size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64Logo = reader.result;
        setSettings(prev => ({ ...prev, logoUrl: base64Logo }));
        toast.success('Company logo selected!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Frontend Validations
    if (!settings.storeName || !settings.storeName.trim()) {
      toast.error('Company Display Name is required');
      return;
    }
    if (!settings.legalCompanyName || !settings.legalCompanyName.trim()) {
      toast.error('Legal Company Name is required');
      return;
    }
    if (!settings.gstNo || !settings.gstNo.trim()) {
      toast.error('GST Number (GSTIN) is required');
      return;
    }
    if (!settings.panNo || !settings.panNo.trim()) {
      toast.error('PAN Number is required');
      return;
    }
    if (!settings.state || !settings.state.trim()) {
      toast.error('State is required');
      return;
    }
    if (!settings.stateCode || !settings.stateCode.trim()) {
      toast.error('State Code is required');
      return;
    }
    if (!settings.address || !settings.address.trim()) {
      toast.error('Registered Address is required');
      return;
    }
    if (!settings.supportEmail || !settings.supportEmail.trim()) {
      toast.error('Support Email is required');
      return;
    }
    if (!settings.supportPhone || !settings.supportPhone.trim()) {
      toast.error('Support Phone is required');
      return;
    }

    try {
      // 1. Save dedicated Company Settings entity to MySQL (company_settings table)
      const companyPayload = {
        companyDisplayName: settings.storeName.trim(),
        legalCompanyName: settings.legalCompanyName.trim(),
        gstNumber: settings.gstNo.trim(),
        panNumber: settings.panNo.trim(),
        cinNumber: settings.cinNo ? settings.cinNo.trim() : '',
        state: settings.state.trim(),
        stateCode: settings.stateCode.trim(),
        registeredAddress: settings.address.trim(),
        warehouseAddress: settings.warehouseAddress ? settings.warehouseAddress.trim() : '',
        supportEmail: settings.supportEmail.trim(),
        supportPhone: settings.supportPhone.trim(),
        website: settings.website ? settings.website.trim() : '',
        authorizedSignatory: settings.signatoryName ? settings.signatoryName.trim() : '',
        designation: settings.signatoryDesignation ? settings.signatoryDesignation.trim() : ''
      };

      await api.post('/settings/company', companyPayload);

      // 2. Save all key-value settings to MySQL (settings table)
      const generalPayload = {
        storeName: settings.storeName.trim(),
        legalCompanyName: settings.legalCompanyName.trim(),
        gstNo: settings.gstNo.trim(),
        panNo: settings.panNo.trim(),
        cinNo: settings.cinNo ? settings.cinNo.trim() : '',
        state: settings.state.trim(),
        stateCode: settings.stateCode.trim(),
        address: settings.address.trim(),
        warehouseAddress: settings.warehouseAddress ? settings.warehouseAddress.trim() : '',
        supportEmail: settings.supportEmail.trim(),
        supportPhone: settings.supportPhone.trim(),
        website: settings.website ? settings.website.trim() : '',
        signatoryName: settings.signatoryName ? settings.signatoryName.trim() : '',
        signatoryDesignation: settings.signatoryDesignation ? settings.signatoryDesignation.trim() : '',

        orderPrefix: settings.orderPrefix,
        orderNextSeq: settings.orderNextSeq,
        invoicePrefix: settings.invoicePrefix,
        invoiceNextSeq: settings.invoiceNextSeq,

        codEnabled: String(settings.codEnabled),
        razorpayEnabled: String(settings.razorpayEnabled),
        stripeEnabled: String(settings.stripeEnabled),
        onlinePaymentEnabled: String(settings.onlinePaymentEnabled),
        defaultPaymentMethod: settings.defaultPaymentMethod,

        footerAbout: settings.footerAbout,
        announcementText: settings.announcementText,
        logoUrl: settings.logoUrl || '',
        maxProductImages: String(settings.maxProductImages),
        maintenanceMode: String(settings.maintenanceMode),
        maintenanceTitle: settings.maintenanceTitle,
        maintenanceSubtitle: settings.maintenanceSubtitle,
        maintenanceMessage: settings.maintenanceMessage,
        maintenanceEstimatedTime: settings.maintenanceEstimatedTime,
        maintenanceShowTimer: String(settings.maintenanceShowTimer),
        maintenanceShowSocial: String(settings.maintenanceShowSocial),
        maintenanceAllowSearchEngines: String(settings.maintenanceAllowSearchEngines),
      };

      await api.post('/settings', generalPayload);

      // Cache locally for offline UI synchronization
      localStorage.setItem('karviyam_system_settings', JSON.stringify(settings));
      localStorage.setItem('karviyam_logo', settings.logoUrl || '');
      localStorage.setItem('karviyam_store_name', settings.storeName);
      localStorage.setItem('karviyam_legal_company_name', settings.legalCompanyName);
      localStorage.setItem('karviyam_support_email', settings.supportEmail);
      localStorage.setItem('karviyam_support_phone', settings.supportPhone);
      localStorage.setItem('karviyam_address', settings.address);
      localStorage.setItem('karviyam_footer_about', settings.footerAbout);
      localStorage.setItem('karviyam_gst_no', settings.gstNo);
      localStorage.setItem('karviyam_pan_no', settings.panNo);
      localStorage.setItem('karviyam_state_code', settings.stateCode);
      localStorage.setItem('karviyam_signatory_name', settings.signatoryName);
      localStorage.setItem('karviyam_maintenance_mode', String(settings.maintenanceMode));
      localStorage.setItem('karviyam_maintenance_message', settings.maintenanceMessage);

      window.dispatchEvent(new Event('karviyam_settings_updated'));
      notifyChanges();
      toast.success('Settings saved successfully.');
    } catch (e) {
      console.error('Settings save error:', e);
      const errMsg = e.response?.data?.message || e.message || 'Failed to save settings';
      toast.error(`Error: ${errMsg}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900">Website & Store Settings</h1>
        <p className="text-xs text-slate-500">Configure company legal info, GST/PAN, payment methods, sequential order numbering & invoice settings</p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'company'
              ? 'bg-[#B71C1C] text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company Information</span>
        </button>

        <button
          onClick={() => setActiveTab('payment')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'payment'
              ? 'bg-[#B71C1C] text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Methods</span>
        </button>

        <button
          onClick={() => setActiveTab('sequence')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'sequence'
              ? 'bg-[#B71C1C] text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>Order & Invoice Sequences</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'general'
              ? 'bg-[#B71C1C] text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Branding & General</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'system'
              ? 'bg-[#B71C1C] text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>System Controls & Maintenance</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Tab 1: Company Information */}
        {activeTab === 'company' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#B71C1C]" />
              <span>Company Legal & Tax Details (Printed on Invoices)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Display Name *</label>
                <input
                  type="text"
                  required
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none focus:border-[#B71C1C] font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Legal Company Name *</label>
                <input
                  type="text"
                  required
                  value={settings.legalCompanyName}
                  onChange={(e) => setSettings({ ...settings, legalCompanyName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none focus:border-[#B71C1C] font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">GST Number (GSTIN) *</label>
                <input
                  type="text"
                  required
                  value={settings.gstNo}
                  onChange={(e) => setSettings({ ...settings, gstNo: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PAN Number *</label>
                <input
                  type="text"
                  required
                  value={settings.panNo}
                  onChange={(e) => setSettings({ ...settings, panNo: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CIN Number (Optional)</label>
                <input
                  type="text"
                  value={settings.cinNo}
                  onChange={(e) => setSettings({ ...settings, cinNo: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={settings.state}
                    onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">State Code *</label>
                  <input
                    type="text"
                    required
                    value={settings.stateCode}
                    onChange={(e) => setSettings({ ...settings, stateCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Registered Address (Printed on Bills) *</label>
                <textarea
                  rows={2}
                  required
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-semibold text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Warehouse Address</label>
                <textarea
                  rows={2}
                  value={settings.warehouseAddress}
                  onChange={(e) => setSettings({ ...settings, warehouseAddress: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Support Email *</label>
                <input
                  type="email"
                  required
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Support Phone *</label>
                <input
                  type="text"
                  required
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Website</label>
                <input
                  type="text"
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Authorized Signatory Name</label>
                  <input
                    type="text"
                    value={settings.signatoryName}
                    onChange={(e) => setSettings({ ...settings, signatoryName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={settings.signatoryDesignation}
                    onChange={(e) => setSettings({ ...settings, signatoryDesignation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Payment Methods */}
        {activeTab === 'payment' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#B71C1C]" />
              <span>Checkout Payment Methods & Control</span>
            </h3>

            <div className="space-y-4">
              
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900">Cash on Delivery (COD)</h4>
                  <p className="text-[11px] text-slate-500">Allow customers to pay in cash upon doorstep delivery</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.codEnabled}
                    onChange={(e) => setSettings({ ...settings, codEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B71C1C]" />
                </label>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900">Online Payment Gateway Master Toggle</h4>
                  <p className="text-[11px] text-slate-500">Enable or disable all online payment gateways at checkout</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.onlinePaymentEnabled}
                    onChange={(e) => setSettings({ ...settings, onlinePaymentEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B71C1C]" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Razorpay (UPI & NetBanking)</span>
                    <input
                      type="checkbox"
                      checked={settings.razorpayEnabled}
                      onChange={(e) => setSettings({ ...settings, razorpayEnabled: e.target.checked })}
                      className="w-4 h-4 accent-[#B71C1C]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">Supports GPay, PhonePe, Paytm & NetBanking</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Stripe (Cards)</span>
                    <input
                      type="checkbox"
                      checked={settings.stripeEnabled}
                      onChange={(e) => setSettings({ ...settings, stripeEnabled: e.target.checked })}
                      className="w-4 h-4 accent-[#B71C1C]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">Supports domestic & international credit cards</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Payment Method at Checkout</label>
                <select
                  value={settings.defaultPaymentMethod}
                  onChange={(e) => setSettings({ ...settings, defaultPaymentMethod: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-bold text-xs"
                >
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="Razorpay">Razorpay (UPI, NetBanking)</option>
                  <option value="Stripe">Stripe Credit/Debit Card</option>
                </select>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Order & Invoice Sequences */}
        {activeTab === 'sequence' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
              <Hash className="w-4 h-4 text-[#B71C1C]" />
              <span>Sequential Numbering Controls (Order ID & Tax Invoice)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Order ID Sequence Format</h4>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Order Prefix</label>
                  <input
                    type="text"
                    value={settings.orderPrefix}
                    onChange={(e) => setSettings({ ...settings, orderPrefix: e.target.value })}
                    placeholder="e.g. KV-ORD-"
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Next Sequence Number</label>
                  <input
                    type="number"
                    min={1}
                    value={settings.orderNextSeq}
                    onChange={(e) => setSettings({ ...settings, orderNextSeq: e.target.value })}
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-mono font-bold text-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-500">Preview: <span className="font-mono font-bold text-[#B71C1C]">{settings.orderPrefix}{String(settings.orderNextSeq || 1).padStart(6, '0')}</span></p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Invoice Number Sequence Format</h4>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={settings.invoicePrefix}
                    onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                    placeholder="e.g. KAR-"
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Next Sequence Number</label>
                  <input
                    type="number"
                    min={1}
                    value={settings.invoiceNextSeq}
                    onChange={(e) => setSettings({ ...settings, invoiceNextSeq: e.target.value })}
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-mono font-bold text-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-500">Preview: <span className="font-mono font-bold text-[#B71C1C]">{settings.invoicePrefix}{String(settings.invoiceNextSeq || 1).padStart(6, '0')}</span></p>
              </div>

            </div>
          </div>
        )}

        {/* Tab 4: Branding & General */}
        {activeTab === 'general' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#B71C1C]" />
              <span>Branding & Store Description</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Footer About Description</label>
                <textarea
                  rows={3}
                  value={settings.footerAbout}
                  onChange={(e) => setSettings({ ...settings, footerAbout: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Top Announcement Banner Text</label>
                <input
                  type="text"
                  value={settings.announcementText}
                  onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-bold text-xs text-[#B71C1C]"
                />
              </div>

              {/* Logo Upload Box */}
              <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50 flex items-center gap-4">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="h-12 w-auto max-w-[160px] object-contain border rounded-xl p-1 bg-white" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-[#B71C1C] flex items-center justify-center font-bold">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}

                <div>
                  <label htmlFor="logoFileInput" className="bg-slate-900 hover:bg-[#B71C1C] text-white px-3.5 py-1.5 rounded-xl font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Brand Logo</span>
                  </label>
                  <input type="file" id="logoFileInput" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <p className="text-[11px] text-slate-500 mt-1">Recommended format: PNG / SVG with transparent background</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: System Controls & Maintenance Mode */}
        {activeTab === 'system' && (
          <div className="space-y-6 text-xs">
            
            {/* Master Toggle Switch Banner */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-3xl border border-red-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-[#B71C1C] bg-white px-3 py-1 rounded-full border border-red-200">
                  SYSTEM SECURITY CONTROL
                </span>
                <h3 className="font-display font-black text-xl text-slate-900 mt-2">
                  Maintenance Mode Master Switch
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md">
                  When active, customer access to browsing, registering, cart & checkout is suspended. Only authenticated Administrators can log in and manage the store.
                </p>
              </div>

              {/* Large OFF ○────────● ON Toggle Switch */}
              <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                <span className={`text-xs font-black uppercase tracking-wider ${!settings.maintenanceMode ? 'text-emerald-700' : 'text-slate-400'}`}>OFF</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setSettings({ ...settings, maintenanceMode: val });
                      localStorage.setItem('karviyam_maintenance_mode', String(val));
                      window.dispatchEvent(new Event('karviyam_maintenance_updated'));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#B71C1C]" />
                </label>
                <span className={`text-xs font-black uppercase tracking-wider ${settings.maintenanceMode ? 'text-[#B71C1C]' : 'text-slate-400'}`}>ON</span>
              </div>
            </div>

            {/* Maintenance Display Customization Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#B71C1C]" />
                <span>Maintenance Page Display & Customer Messaging</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Maintenance Title</label>
                  <input
                    type="text"
                    value={settings.maintenanceTitle}
                    onChange={(e) => setSettings({ ...settings, maintenanceTitle: e.target.value })}
                    placeholder="We'll Be Right Back!"
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Maintenance Subtitle / Badge</label>
                  <input
                    type="text"
                    value={settings.maintenanceSubtitle}
                    onChange={(e) => setSettings({ ...settings, maintenanceSubtitle: e.target.value })}
                    placeholder="SYSTEM UNDER MAINTENANCE"
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Maintenance Description Message</label>
                <textarea
                  rows={3}
                  value={settings.maintenanceMessage}
                  onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                  placeholder="Karviyam is currently undergoing scheduled platform maintenance..."
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-medium text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Completion Time</label>
                  <input
                    type="text"
                    value={settings.maintenanceEstimatedTime}
                    onChange={(e) => setSettings({ ...settings, maintenanceEstimatedTime: e.target.value })}
                    placeholder="Estimated Uptime: Back Online Soon"
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Support Contact Details</label>
                  <input
                    type="text"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    placeholder="vanakkam@karviyam.com"
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-bold text-xs"
                  />
                </div>
              </div>

              {/* Maintenance Feature Switches */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-900">Show Countdown Uptime Badge</h4>
                    <p className="text-[11px] text-slate-500">Display estimated completion countdown badge on maintenance screen</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.maintenanceShowTimer}
                    onChange={(e) => setSettings({ ...settings, maintenanceShowTimer: e.target.checked })}
                    className="w-4 h-4 accent-[#B71C1C] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-900">Enable Search Engine Indexing Guard</h4>
                    <p className="text-[11px] text-slate-500">Tell search engines (Google/Bing) not to index maintenance status page</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.maintenanceAllowSearchEngines}
                    onChange={(e) => setSettings({ ...settings, maintenanceAllowSearchEngines: e.target.checked })}
                    className="w-4 h-4 accent-[#B71C1C] cursor-pointer"
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>SAVE SETTINGS TO DATABASE</span>
          </button>
        </div>

      </form>
    </div>
  );
}
