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

const DEFAULT_MOBILE_SECTIONS = [
  { id: 'parent_categories', title: 'Quick Categories', subtitle: '', enabled: true, layout: 'horizontal', order: 1 },
  { id: 'hero_banners', title: 'Promotional Banners', subtitle: '', enabled: true, layout: 'horizontal', order: 2 },
  { id: 'trust_badges', title: 'Trust & Delivery Badges', subtitle: '', enabled: true, layout: 'horizontal', order: 3 },
  { id: 'categories_style', title: 'Shop Your Style', subtitle: '', enabled: true, layout: 'horizontal', order: 4 },
  { id: 'flash_picks', title: 'Flash Picks', subtitle: 'Ends in 02 : 41 : 36', enabled: true, layout: 'horizontal', order: 5 },
  { id: 'complete_look', title: 'Complete The Look', subtitle: 'Curated combos for you', enabled: true, layout: 'horizontal', order: 6 },
  { id: 'shop_by_occasion', title: 'Shop by Occasion', subtitle: '', enabled: true, layout: 'horizontal', order: 7 },
  { id: 'find_your_price', title: 'Find Your Price', subtitle: '', enabled: true, layout: 'horizontal', order: 8 },
  { id: 'recommended', title: 'Recommended For You', subtitle: '', enabled: true, layout: 'horizontal', order: 9 },
  { id: 'trending', title: 'Trending Now', subtitle: 'Popular styles customers are loving', enabled: true, layout: 'vertical', order: 10 },
  { id: 'new_arrivals', title: 'New Arrivals', subtitle: 'Explore the latest fashion collections', enabled: true, layout: 'horizontal', order: 11 },
  { id: 'best_sellers', title: 'Best Sellers', subtitle: 'Top rated favorites loved by everyone', enabled: true, layout: 'vertical', order: 12 },
  { id: 'continue_shopping', title: 'Continue Shopping', subtitle: '', enabled: true, layout: 'horizontal', order: 13 }
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);

  const [mobileSections, setMobileSections] = useState(() => {
    try {
      const saved = localStorage.getItem('karviyam_mobile_homepage_sections');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_MOBILE_SECTIONS;
  });

  const handleToggleSection = (id) => {
    setMobileSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleChangeSectionLayout = (id, layout) => {
    setMobileSections(prev => prev.map(s => s.id === id ? { ...s, layout } : s));
    if (id === 'recommended') setSettings(s => ({ ...s, mobileRecommendedMode: layout }));
    if (id === 'trending') setSettings(s => ({ ...s, mobileTrendingMode: layout }));
    if (id === 'new_arrivals') setSettings(s => ({ ...s, mobileNewArrivalsMode: layout }));
    if (id === 'best_sellers') setSettings(s => ({ ...s, mobileBestSellersMode: layout }));
  };

  const handleChangeSectionTitle = (id, title) => {
    setMobileSections(prev => prev.map(s => s.id === id ? { ...s, title } : s));
  };

  const handleChangeSectionSubtitle = (id, subtitle) => {
    setMobileSections(prev => prev.map(s => s.id === id ? { ...s, subtitle } : s));
  };

  const handleMoveSection = (index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= mobileSections.length) return;
    const updated = [...mobileSections];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIdx, 0, moved);
    const reordered = updated.map((sec, idx) => ({ ...sec, order: idx + 1 }));
    setMobileSections(reordered);
  };

  const [settings, setSettings] = useState({
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

    orderPrefix: 'KV-ORD-',
    orderNextSeq: '1',
    invoicePrefix: 'KAR-',
    invoiceNextSeq: '1',

    codEnabled: true,
    razorpayEnabled: true,
    stripeEnabled: true,
    onlinePaymentEnabled: true,
    defaultPaymentMethod: 'COD',

    footerAbout: 'Karviyam is a premium marketplace destination for high-street streetwear, 925 sterling silver jewellery, luxury kicks, and lifestyle products.',
    announcementText: 'FESTIVE SALE IS LIVE! UP TO 60% OFF ON HIGH-STREET WEAR & FINE JEWELLERY.',
    logoUrl: '',
    emailLogoUrl: '',
    maxProductImages: '6',

    categoryNavigationEnabled: true,

    recommendedScrollMode: 'grid',
    newArrivalsScrollMode: 'carousel',
    featuredScrollMode: 'carousel',
    removeImageGreyBox: true,

    productImageAutoChange: false,
    productImageChangeInterval: 3,

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
    try {
      const localLayouts = localStorage.getItem('karviyam_section_layouts');
      if (localLayouts) {
        const parsed = JSON.parse(localLayouts);
        setSettings(prev => ({
          ...prev,
          desktopRecommendedMode: parsed.desktop?.recommended || 'carousel',
          desktopNewArrivalsMode: parsed.desktop?.newArrivals || 'carousel',
          desktopFeaturedMode: parsed.desktop?.featured || 'carousel',
          mobileRecommendedMode: parsed.mobile?.recommended || parsed.recommended || 'horizontal',
          mobileTrendingMode: parsed.mobile?.trending || parsed.trending || 'vertical',
          mobileNewArrivalsMode: parsed.mobile?.newArrivals || 'horizontal',
          mobileBestSellersMode: parsed.mobile?.bestSellers || 'vertical',
          removeImageGreyBox: parsed.removeGreyBox !== false
        }));
      }

      const savedMob = localStorage.getItem('karviyam_mobile_homepage_sections');
      if (savedMob) {
        const parsedMob = JSON.parse(savedMob);
        if (Array.isArray(parsedMob) && parsedMob.length > 0) setMobileSections(parsedMob);
      }
    } catch (e) {}
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const compRes = await api.get('/settings/company').catch(() => null);
      const compData = compRes?.data?.data || compRes?.data;

      const payRes = await api.get('/settings/payment').catch(() => null);
      const payData = payRes?.data?.data || payRes?.data || {};

      const res = await api.get('/settings').catch(() => null);
      const apiData = res?.data ? res.data : (res || {});
      const dataMap = apiData.data || apiData;

      if (dataMap && typeof dataMap === 'object') {
        const checkB = (val, defaultVal = true) => {
          if (val === undefined || val === null) return defaultVal;
          if (typeof val === 'boolean') return val;
          if (typeof val === 'number') return val === 1;
          if (typeof val === 'string') {
            const l = val.trim().toLowerCase();
            if (l === 'true' || l === '1') return true;
            if (l === 'false' || l === '0') return false;
          }
          return defaultVal;
        };

        const codVal = payData.codEnabled !== undefined ? payData.codEnabled : (dataMap.codEnabled !== undefined ? dataMap.codEnabled : payData.cod_enabled);
        const onlineVal = payData.onlinePaymentEnabled !== undefined ? payData.onlinePaymentEnabled : (dataMap.onlinePaymentEnabled !== undefined ? dataMap.onlinePaymentEnabled : payData.online_payment_enabled);
        const rzpVal = payData.razorpayEnabled !== undefined ? payData.razorpayEnabled : (dataMap.razorpayEnabled !== undefined ? dataMap.razorpayEnabled : payData.razorpay_enabled);
        const stpVal = payData.stripeEnabled !== undefined ? payData.stripeEnabled : (dataMap.stripeEnabled !== undefined ? dataMap.stripeEnabled : payData.stripe_enabled);
        const defVal = payData.defaultPaymentMethod || dataMap.defaultPaymentMethod || payData.default_payment_method;
        const catNavVal = dataMap.categoryNavigationEnabled !== undefined ? dataMap.categoryNavigationEnabled : dataMap.category_navigation_enabled;

        const mobData = dataMap.karviyam_mobile_homepage_sections || dataMap.mobile_homepage_sections;
        if (mobData) {
          try {
            const parsedMob = typeof mobData === 'string' ? JSON.parse(mobData) : mobData;
            if (Array.isArray(parsedMob) && parsedMob.length > 0) {
              setMobileSections(parsedMob);
              localStorage.setItem('karviyam_mobile_homepage_sections', JSON.stringify(parsedMob));
            }
          } catch (e) {}
        }

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

          codEnabled: checkB(codVal, true),
          razorpayEnabled: checkB(rzpVal, true),
          stripeEnabled: checkB(stpVal, true),
          onlinePaymentEnabled: checkB(onlineVal, true),
          defaultPaymentMethod: defVal || prev.defaultPaymentMethod,
          categoryNavigationEnabled: checkB(catNavVal, true),

          productImageAutoChange: checkB(dataMap.productImageAutoChange !== undefined ? dataMap.productImageAutoChange : dataMap.product_image_auto_change, false),
          productImageChangeInterval: parseInt(dataMap.productImageChangeInterval || dataMap.product_image_change_interval || 3, 10) || 3,

          footerAbout: dataMap.footerAbout || prev.footerAbout,
          announcementText: dataMap.announcementText || prev.announcementText,
          logoUrl: dataMap.logoUrl || prev.logoUrl,
          emailLogoUrl: dataMap.email_logo_url || dataMap.emailLogoUrl || prev.emailLogoUrl,
          maxProductImages: dataMap.maxProductImages || prev.maxProductImages,
          maintenanceMode: dataMap.maintenanceMode === 'true' || dataMap.maintenanceMode === true,
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
    window.dispatchEvent(new Event('karviyam_settings_updated'));
    window.dispatchEvent(new Event('karviyam_category_nav_updated'));
    window.dispatchEvent(new Event('karviyam_section_layouts_updated'));
    window.dispatchEvent(new Event('karviyam_mobile_homepage_updated'));
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

  const handleEmailLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
        toast.error('Invalid image type. Please upload a PNG, JPG, or WebP image.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Email logo file size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64Logo = reader.result;
        setSettings(prev => ({ ...prev, emailLogoUrl: base64Logo }));
        toast.success('Custom email logo loaded! Click Save Settings to apply.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveEmailLogo = () => {
    setSettings(prev => ({ ...prev, emailLogoUrl: '' }));
    toast.success('Custom email logo removed. Default Karviyam logo will be used.');
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
        categoryNavigationEnabled: String(settings.categoryNavigationEnabled),
        category_navigation_enabled: String(settings.categoryNavigationEnabled),

        productImageAutoChange: String(settings.productImageAutoChange),
        product_image_auto_change: String(settings.productImageAutoChange),
        productImageChangeInterval: String(settings.productImageChangeInterval),
        product_image_change_interval: String(settings.productImageChangeInterval),

        footerAbout: settings.footerAbout,
        announcementText: settings.announcementText,
        logoUrl: settings.logoUrl || '',
        email_logo_url: settings.emailLogoUrl || '',
        emailLogoUrl: settings.emailLogoUrl || '',
        maxProductImages: String(settings.maxProductImages),
        maintenanceMode: String(settings.maintenanceMode),
        maintenanceLogoUrl: settings.maintenanceLogoUrl || '',
        maintenanceTitle: settings.maintenanceTitle,
        maintenanceSubtitle: settings.maintenanceSubtitle,
        maintenanceMessage: settings.maintenanceMessage,
        maintenanceEstimatedTime: settings.maintenanceEstimatedTime,
        maintenanceShowTimer: String(settings.maintenanceShowTimer),
        maintenanceShowSocial: String(settings.maintenanceShowSocial),
        maintenanceAllowSearchEngines: String(settings.maintenanceAllowSearchEngines),
        karviyam_mobile_homepage_sections: JSON.stringify(mobileSections),
        mobile_homepage_sections: JSON.stringify(mobileSections),
        karviyam_section_layouts: JSON.stringify({
          desktop: {
            recommended: settings.desktopRecommendedMode || 'carousel',
            newArrivals: settings.desktopNewArrivalsMode || 'carousel',
            featured: settings.desktopFeaturedMode || 'carousel'
          },
          mobile: {
            recommended: settings.mobileRecommendedMode || 'horizontal',
            trending: settings.mobileTrendingMode || 'vertical',
            newArrivals: settings.mobileNewArrivalsMode || 'horizontal',
            bestSellers: settings.mobileBestSellersMode || 'vertical'
          },
          removeGreyBox: settings.removeImageGreyBox !== false
        }),
        sectionLayouts: {
          desktop: {
            recommended: settings.desktopRecommendedMode || 'carousel',
            newArrivals: settings.desktopNewArrivalsMode || 'carousel',
            featured: settings.desktopFeaturedMode || 'carousel'
          },
          mobile: {
            recommended: settings.mobileRecommendedMode || 'horizontal',
            trending: settings.mobileTrendingMode || 'vertical',
            newArrivals: settings.mobileNewArrivalsMode || 'horizontal',
            bestSellers: settings.mobileBestSellersMode || 'vertical'
          },
          removeGreyBox: settings.removeImageGreyBox !== false
        }
      };

      await api.post('/settings', generalPayload);
      await api.post('/settings/footer', {
        footerAbout: settings.footerAbout,
        address: settings.address,
        supportPhone: settings.supportPhone,
        supportEmail: settings.supportEmail,
        logoUrl: settings.logoUrl || ''
      }).catch(() => null);
      await api.post('/settings/payment', {
        codEnabled: settings.codEnabled,
        onlinePaymentEnabled: settings.onlinePaymentEnabled,
        razorpayEnabled: settings.razorpayEnabled,
        stripeEnabled: settings.stripeEnabled,
        defaultPaymentMethod: settings.defaultPaymentMethod
      }).catch(() => null);

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
      localStorage.setItem('karviyam_maintenance_logo', settings.maintenanceLogoUrl || '');
      localStorage.setItem('karviyam_maintenance_message', settings.maintenanceMessage);
      localStorage.setItem('karviyam_product_image_auto_change', String(settings.productImageAutoChange));
      localStorage.setItem('karviyam_product_image_change_interval', String(settings.productImageChangeInterval));

      // Section Scrolling & Layout Configuration (Independent Desktop & Mobile Objects)
      const layoutConfig = {
        desktop: {
          recommended: settings.desktopRecommendedMode || 'carousel',
          newArrivals: settings.desktopNewArrivalsMode || 'carousel',
          featured: settings.desktopFeaturedMode || 'carousel'
        },
        mobile: {
          recommended: settings.mobileRecommendedMode || 'horizontal',
          trending: settings.mobileTrendingMode || 'vertical',
          newArrivals: settings.mobileNewArrivalsMode || 'horizontal',
          bestSellers: settings.mobileBestSellersMode || 'vertical'
        },
        removeGreyBox: settings.removeImageGreyBox !== false
      };

      localStorage.setItem('karviyam_section_layouts', JSON.stringify(layoutConfig));
      localStorage.setItem('karviyam_mobile_homepage_sections', JSON.stringify(mobileSections));

      window.dispatchEvent(new Event('karviyam_auto_change_updated'));
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
          onClick={() => setActiveTab('layout')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'layout'
              ? 'bg-[#B71C1C] text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Product Layout & Scroll Controls</span>
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
                    onChange={(e) => {
                      const updated = { ...settings, codEnabled: e.target.checked };
                      setSettings(updated);
                      localStorage.setItem('karviyam_system_settings', JSON.stringify(updated));
                      window.dispatchEvent(new Event('karviyam_settings_updated'));
                    }}
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
                    onChange={(e) => {
                      const updated = { ...settings, onlinePaymentEnabled: e.target.checked };
                      setSettings(updated);
                      localStorage.setItem('karviyam_system_settings', JSON.stringify(updated));
                      window.dispatchEvent(new Event('karviyam_settings_updated'));
                    }}
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
                      onChange={(e) => {
                        const updated = { ...settings, razorpayEnabled: e.target.checked };
                        setSettings(updated);
                        localStorage.setItem('karviyam_system_settings', JSON.stringify(updated));
                        window.dispatchEvent(new Event('karviyam_settings_updated'));
                      }}
                      className="w-4 h-4 accent-[#B71C1C] cursor-pointer"
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
                      onChange={(e) => {
                        const updated = { ...settings, stripeEnabled: e.target.checked };
                        setSettings(updated);
                        localStorage.setItem('karviyam_system_settings', JSON.stringify(updated));
                        window.dispatchEvent(new Event('karviyam_settings_updated'));
                      }}
                      className="w-4 h-4 accent-[#B71C1C] cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">Supports domestic & international credit cards</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Payment Method at Checkout</label>
                <select
                  value={settings.defaultPaymentMethod}
                  onChange={(e) => {
                    const updated = { ...settings, defaultPaymentMethod: e.target.value };
                    setSettings(updated);
                    localStorage.setItem('karviyam_system_settings', JSON.stringify(updated));
                    window.dispatchEvent(new Event('karviyam_settings_updated'));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none font-bold text-xs cursor-pointer"
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
              <span>Branding & General Settings</span>
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

              {/* Customer Support Email Header Logo Settings Box */}
              <div className="border border-slate-200 p-5 rounded-2xl bg-white space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#B71C1C]" />
                      <span>Customer Support Email Branding Logo</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Upload a custom logo to display at the top of all customer support response emails.
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                    settings.emailLogoUrl ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {settings.emailLogoUrl ? '✓ Active Custom Email Logo' : 'ℹ Default Karviyam Logo Active'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Email Logo Preview Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Email Header Logo Preview</span>
                    <div className="h-[85px] w-full max-w-[260px] mx-auto bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-center shadow-2xs overflow-hidden">
                      {settings.emailLogoUrl ? (
                        <img src={settings.emailLogoUrl} alt="Active Email Logo" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M12 3C12 3 8.5 7.5 8.5 12C8.5 14.5 10 16.5 12 17.5C14 16.5 15.5 14.5 15.5 12C15.5 7.5 12 3 12 3Z" fill="#B71C1C"/>
                            <path d="M12 17.5C9.5 16.8 6 14 6 11C6 9 7.5 7.5 7.5 7.5C7.5 7.5 5 10.5 5 13.5C5 16.5 8 18.5 12 19C16 18.5 19 16.5 19 13.5C19 10.5 16.5 7.5 16.5 7.5C16.5 7.5 18 9 18 11C18 14 14.5 16.8 12 17.5Z" fill="#B71C1C"/>
                            <path d="M12 19C7 18.5 3 15.5 3 13.5C3 12 4 10.5 4 10.5C4 10.5 2 12.5 2 15C2 17.5 6 20.5 12 21C18 20.5 22 17.5 22 15C22 12.5 20 10.5 20 10.5C20 10.5 21 12 21 13.5C21 15.5 17 18.5 12 19Z" fill="#B71C1C"/>
                          </svg>
                          <span className="font-serif font-black text-xs text-[#B71C1C] tracking-widest uppercase">KARVIYAM</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <label htmlFor="emailLogoFileInput" className="bg-[#B71C1C] hover:bg-[#8E1414] text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-2xs">
                        <Upload className="w-4 h-4" />
                        <span>{settings.emailLogoUrl ? 'Change Email Logo' : 'Upload Email Logo'}</span>
                      </label>
                      <input
                        type="file"
                        id="emailLogoFileInput"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleEmailLogoUpload}
                        className="hidden"
                      />

                      {settings.emailLogoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveEmailLogo}
                          className="bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-[#B71C1C] border border-slate-200 px-3.5 py-2 rounded-xl font-bold text-xs transition-colors"
                        >
                          Remove Logo
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowEmailPreviewModal(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-colors inline-flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Preview Email</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Supported formats: <strong>PNG, JPG/JPEG, WebP</strong> (Max 5MB). Image max-width in email: <strong>250px</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Product Layout & Scroll Controls */}
        {activeTab === 'layout' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-xs text-left">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#B71C1C]" />
              <span>Product Section Scroll & Layout Controls (Managed by Admin)</span>
            </h3>

            <div className="space-y-6">
              {/* BLOCK 1: DESKTOP PRODUCT LAYOUT & SCROLL CONTROLS */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 shadow-2xs">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-700" />
                    <span>DESKTOP PRODUCT LAYOUT & SCROLL CONTROLS (≥1024px)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configure product section layouts for desktop storefront view. Desktop settings are completely separate from mobile.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Desktop Recommended */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <label className="font-extrabold text-slate-800 block text-xs">Recommended For You (Desktop)</label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="desktopRecommended"
                          value="carousel"
                          checked={(settings.desktopRecommendedMode || 'carousel') === 'carousel'}
                          onChange={() => setSettings({ ...settings, desktopRecommendedMode: 'carousel' })}
                          className="text-[#B71C1C]"
                        />
                        <span className="font-bold text-slate-700">Horizontal Carousel (2 Rows)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="desktopRecommended"
                          value="grid"
                          checked={settings.desktopRecommendedMode === 'grid'}
                          onChange={() => setSettings({ ...settings, desktopRecommendedMode: 'grid' })}
                          className="text-[#B71C1C]"
                        />
                        <span className="font-bold text-slate-700">Vertical Grid</span>
                      </label>
                    </div>
                  </div>

                  {/* Desktop New Arrivals */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <label className="font-extrabold text-slate-800 block text-xs">New Arrivals (Desktop)</label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="desktopNewArrivals"
                          value="carousel"
                          checked={(settings.desktopNewArrivalsMode || 'carousel') === 'carousel'}
                          onChange={() => setSettings({ ...settings, desktopNewArrivalsMode: 'carousel' })}
                          className="text-[#B71C1C]"
                        />
                        <span className="font-bold text-slate-700">Horizontal Carousel</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="desktopNewArrivals"
                          value="grid"
                          checked={settings.desktopNewArrivalsMode === 'grid'}
                          onChange={() => setSettings({ ...settings, desktopNewArrivalsMode: 'grid' })}
                          className="text-[#B71C1C]"
                        />
                        <span className="font-bold text-slate-700">Vertical Grid</span>
                      </label>
                    </div>
                  </div>

                  {/* Desktop Featured */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <label className="font-extrabold text-slate-800 block text-xs">Featured Products (Desktop)</label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="desktopFeatured"
                          value="carousel"
                          checked={(settings.desktopFeaturedMode || 'carousel') === 'carousel'}
                          onChange={() => setSettings({ ...settings, desktopFeaturedMode: 'carousel' })}
                          className="text-[#B71C1C]"
                        />
                        <span className="font-bold text-slate-700">Horizontal Carousel</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="desktopFeatured"
                          value="grid"
                          checked={settings.desktopFeaturedMode === 'grid'}
                          onChange={() => setSettings({ ...settings, desktopFeaturedMode: 'grid' })}
                          className="text-[#B71C1C]"
                        />
                        <span className="font-bold text-slate-700">Vertical Grid</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOCK 2: MOBILE PRODUCT LAYOUT & HOMEPAGE CONFIGURATION */}
              <div className="border border-red-200 bg-red-50/20 rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-red-100 pb-3">
                  <div>
                    <h4 className="font-extrabold text-[#B71C1C] text-sm uppercase tracking-wider flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#B71C1C]" />
                      <span>MOBILE HOMEPAGE SECTIONS & LAYOUT EDITOR (&lt;1024px)</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                      Enable, disable, rename, reorder, and set scroll layout (Horizontal Swipe vs Vertical Grid) for every mobile homepage section independently. Desktop view remains 100% untouched.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {mobileSections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className={`p-4 rounded-xl border transition-all ${
                        sec.enabled ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-100 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        
                        {/* Left: Position & Section Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveSection(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title="Move Up"
                            >
                              ▲
                            </button>
                            <span className="text-[10px] font-black text-slate-500">#{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleMoveSection(idx, 1)}
                              disabled={idx === mobileSections.length - 1}
                              className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title="Move Down"
                            >
                              ▼
                            </button>
                          </div>

                          {/* Editable Title & Subtitle */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={sec.title || ''}
                                onChange={(e) => handleChangeSectionTitle(sec.id, e.target.value)}
                                className="font-extrabold text-xs text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-[#B71C1C] flex-1 min-w-0"
                                placeholder="Section Title"
                              />
                            </div>
                            <input
                              type="text"
                              value={sec.subtitle || ''}
                              onChange={(e) => handleChangeSectionSubtitle(sec.id, e.target.value)}
                              className="text-[11px] text-slate-500 bg-slate-50/60 px-2.5 py-0.5 rounded-md border border-slate-200/80 focus:outline-none focus:border-[#B71C1C] w-full"
                              placeholder="Subtitle (optional)"
                            />
                          </div>
                        </div>

                        {/* Right: Layout Switch & Visibility Toggle */}
                        <div className="flex items-center gap-3 shrink-0">
                          {/* Layout Options */}
                          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleChangeSectionLayout(sec.id, 'horizontal')}
                              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                                sec.layout === 'horizontal' ? 'bg-[#B71C1C] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Horizontal Swipe
                            </button>
                            <button
                              type="button"
                              onClick={() => handleChangeSectionLayout(sec.id, 'vertical')}
                              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                                sec.layout === 'vertical' ? 'bg-[#B71C1C] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Vertical 2-Col Grid
                            </button>
                          </div>

                          {/* Enable/Disable Switch */}
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sec.enabled}
                              onChange={() => handleToggleSection(sec.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B71C1C]" />
                          </label>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Product Card Image Box Settings */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs">Product Card Image Background</h4>
                    <p className="text-[11px] text-slate-500">Control image background styling on product cards across the store</p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.removeImageGreyBox}
                      onChange={(e) => setSettings({ ...settings, removeImageGreyBox: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B71C1C]" />
                  </label>
                </div>
                <p className="text-[10.5px] text-slate-600 font-medium">
                  {settings.removeImageGreyBox ? '✅ Pure White Background (Grey box removed)' : '⚪ Standard Tinted Grey Box'}
                </p>
              </div>

              {/* Section 4: Product Image Gallery Auto-Change Controls */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <span>PRODUCT IMAGE GALLERY AUTO-CHANGE</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">Automatically cycle through main image, sub images, and video on product detail pages</p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!settings.productImageAutoChange}
                      onChange={(e) => setSettings({ ...settings, productImageAutoChange: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B71C1C]" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Auto Image Change Status</label>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs border ${
                      settings.productImageAutoChange
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {settings.productImageAutoChange ? '🟢 AUTO CHANGE IS ON' : '🔴 AUTO CHANGE IS OFF'}
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Change Image Every</label>
                    <select
                      value={settings.productImageChangeInterval || 3}
                      onChange={(e) => setSettings({ ...settings, productImageChangeInterval: parseInt(e.target.value, 10) || 3 })}
                      disabled={!settings.productImageAutoChange}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold p-2.5 rounded-xl outline-none focus:border-[#B71C1C] disabled:opacity-50"
                    >
                      <option value={1}>1 Second</option>
                      <option value={2}>2 Seconds</option>
                      <option value={3}>3 Seconds (Default)</option>
                      <option value={4}>4 Seconds</option>
                      <option value={5}>5 Seconds</option>
                      <option value={6}>6 Seconds</option>
                      <option value={7}>7 Seconds</option>
                      <option value={8}>8 Seconds</option>
                      <option value={10}>10 Seconds</option>
                    </select>
                  </div>
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

              {/* Dedicated Maintenance Page Logo */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 text-xs">Separate Maintenance Page Logo</label>
                    <p className="text-[11px] text-slate-500">This logo will ONLY be applied on the Maintenance Mode page.</p>
                  </div>
                  {settings.maintenanceLogoUrl && (
                    <div className="shrink-0 p-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
                      <img src={settings.maintenanceLogoUrl} alt="Maintenance Logo Preview" className="h-10 w-auto max-w-[140px] object-contain" />
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, maintenanceLogoUrl: '' })}
                        className="text-[10px] text-red-600 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Upload Maintenance Logo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSettings({ ...settings, maintenanceLogoUrl: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Or Logo Image URL</label>
                    <input
                      type="text"
                      value={settings.maintenanceLogoUrl}
                      onChange={(e) => setSettings({ ...settings, maintenanceLogoUrl: e.target.value })}
                      placeholder="https://example.com/maintenance-logo.png"
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl outline-none font-medium text-xs"
                    />
                  </div>
                </div>
              </div>

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

      {/* ========================================================= */}
      {/* CUSTOMER SUPPORT EMAIL PREVIEW MODAL                      */}
      {/* ========================================================= */}
      {showEmailPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-left max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#B71C1C]" />
                <h3 className="font-bold text-slate-900 text-base">Customer Support Response Email Live Preview</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailPreviewModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              This preview shows how customer support response emails appear in Gmail, Outlook, and mobile apps using your active email logo configuration.
            </p>

            {/* Email Canvas Preview Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs font-sans">
              
              {/* Header Logo */}
              <div className="text-center pb-3 border-b border-slate-100 flex items-center justify-center">
                {settings.emailLogoUrl ? (
                  <img src={settings.emailLogoUrl} alt="Karviyam Logo" className="max-h-16 max-w-[240px] object-contain mx-auto" />
                ) : (
                  <div className="flex flex-col items-center">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                      <path d="M12 3C12 3 8.5 7.5 8.5 12C8.5 14.5 10 16.5 12 17.5C14 16.5 15.5 14.5 15.5 12C15.5 7.5 12 3 12 3Z" fill="#B71C1C"/>
                      <path d="M12 17.5C9.5 16.8 6 14 6 11C6 9 7.5 7.5 7.5 7.5C7.5 7.5 5 10.5 5 13.5C5 16.5 8 18.5 12 19C16 18.5 19 16.5 19 13.5C19 10.5 16.5 7.5 16.5 7.5C16.5 7.5 18 9 18 11C18 14 14.5 16.8 12 17.5Z" fill="#B71C1C"/>
                      <path d="M12 19C7 18.5 3 15.5 3 13.5C3 12 4 10.5 4 10.5C4 10.5 2 12.5 2 15C2 17.5 6 20.5 12 21C18 20.5 22 17.5 22 15C22 12.5 20 10.5 20 10.5C20 10.5 21 12 21 13.5C21 15.5 17 18.5 12 19Z" fill="#B71C1C"/>
                    </svg>
                    <span className="font-serif font-black text-xl text-[#B71C1C] tracking-widest uppercase mt-1">KARVIYAM</span>
                    <span className="text-[10px] text-slate-400 font-medium">Timeless Style. Trusted Quality.</span>
                  </div>
                )}
              </div>

              {/* Subject & Header Info */}
              <div className="flex justify-between items-center text-slate-600 text-[11px] pb-2 border-b border-slate-100">
                <span>Subject: <strong className="text-slate-900">Re: Customer Support Inquiry (#5000001)</strong></span>
                <span>{new Date().toLocaleDateString('en-GB')}</span>
              </div>

              {/* Body Content */}
              <div className="space-y-3 text-slate-700 leading-relaxed text-xs">
                <p>Hello <strong>Valued Customer</strong>,</p>
                <p>Hello from Karviyam Customer Support,</p>
                <p>We understand that you have an issue regarding Order <strong className="text-[#B71C1C]">#5000001</strong>.</p>
                <div className="bg-slate-50 border-l-4 border-[#B71C1C] p-3 rounded-r-xl font-medium text-slate-800">
                  We have verified your request. Your inquiry has been processed and resolved by our support team.
                </div>
                <p>We appreciate your cooperation and understanding in this regard.</p>
                <p>Thank you for choosing Karviyam,</p>
                <div>
                  <strong className="text-[#B71C1C] block font-bold text-sm">Karviyam Support Team</strong>
                  <span className="text-slate-500 font-mono text-[11px]">vanakkam@karviyam.com</span>
                </div>
              </div>

              {/* Pre-footer Info & Social Links */}
              <div className="border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400 space-y-1">
                <p>© {new Date().getFullYear()} Karviyam. All rights reserved.</p>
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEmailPreviewModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
