import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Power, Save, Loader2, Upload, Trash2, CheckCircle2, ShieldCheck, HelpCircle, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { resolveImageUrl } from '../utils/imageUtils';

export default function AdminPaymentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  const [paymentSettings, setPaymentSettings] = useState({
    codEnabled: true,
    razorpayEnabled: true,
    upiQrEnabled: true,
    upiId: 'karviyam@hdfcbank',
    qrImageUrl: '',
    qrDisplayName: 'Karviyam',
    qrInstructions: 'Scan this QR using GPay, PhonePe, Paytm or any supported UPI app',
    verificationMode: 'Razorpay'
  });

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/payment-settings').catch(() => null)
        || await api.get('/settings/payment').catch(() => null);
      
      const data = res?.data?.data || res?.data;
      if (data) {
        setPaymentSettings({
          codEnabled: data.codEnabled !== undefined ? data.codEnabled : (data.cod_enabled !== undefined ? data.cod_enabled : true),
          razorpayEnabled: data.razorpayEnabled !== undefined ? data.razorpayEnabled : (data.razorpay_enabled !== undefined ? data.razorpay_enabled : true),
          upiQrEnabled: data.upiQrEnabled !== undefined ? data.upiQrEnabled : (data.upi_qr_enabled !== undefined ? data.upi_qr_enabled : true),
          upiId: data.upiId || data.upi_id || 'karviyam@hdfcbank',
          qrImageUrl: data.qrImageUrl || data.qr_image_url || '',
          qrDisplayName: data.qrDisplayName || data.qr_display_name || 'Karviyam',
          qrInstructions: data.qrInstructions || data.qr_instructions || 'Scan this QR using GPay, PhonePe, Paytm or any supported UPI app',
          verificationMode: data.verificationMode || data.verification_mode || 'Razorpay'
        });
      }
    } catch (e) {
      console.error('Failed to fetch payment settings:', e);
      toast.error('Failed to load payment settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (paymentSettings.upiQrEnabled && !paymentSettings.upiId.trim()) {
      toast.error('Please enter a valid UPI ID for QR Payments.');
      return;
    }

    setSaving(true);
    toast.loading('Saving payment settings...', { id: 'admin-pay-toast' });

    try {
      const res = await api.put('/admin/payment-settings', paymentSettings).catch(() => null)
        || await api.post('/settings/payment', paymentSettings).catch(() => null);

      const resData = res?.data ? res.data : res;
      if (resData?.success || res?.status === 200) {
        toast.success('Payment settings saved successfully! 🎉', { id: 'admin-pay-toast' });
        localStorage.setItem('karviyam_admin_payment_settings', JSON.stringify(paymentSettings));
        window.dispatchEvent(new Event('karviyam_settings_updated'));
        fetchPaymentSettings();
      } else {
        toast.error(resData?.message || 'Failed to save payment settings.', { id: 'admin-pay-toast' });
      }
    } catch (err) {
      toast.error('Error saving payment settings.', { id: 'admin-pay-toast' });
    } finally {
      setSaving(false);
    }
  };

  const handleQrImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    setUploadingQr(true);
    toast.loading('Uploading QR Image...', { id: 'qr-upload-toast' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/admin/payment-settings/qr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).catch(async () => {
        return await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      });

      const data = res?.data?.data || res?.data;
      const uploadedUrl = data?.url || data?.urls?.[0];

      if (uploadedUrl) {
        setPaymentSettings(prev => ({ ...prev, qrImageUrl: uploadedUrl }));
        toast.success('QR Code image uploaded successfully!', { id: 'qr-upload-toast' });
      } else {
        toast.error('Failed to upload QR Code image.', { id: 'qr-upload-toast' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error uploading QR Code image.', { id: 'qr-upload-toast' });
    } finally {
      setUploadingQr(false);
    }
  };

  const handleRemoveQrImage = async () => {
    setPaymentSettings(prev => ({ ...prev, qrImageUrl: '' }));
    toast.success('QR Code image removed. Dynamic QR will be generated automatically.');
    try {
      await api.delete('/admin/payment-settings/qr').catch(() => null);
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 font-sans">
        <Loader2 className="w-10 h-10 text-[#B71C1C] animate-spin mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Payment Settings...</h3>
      </div>
    );
  }

  const previewQrUrl = paymentSettings.qrImageUrl 
    ? resolveImageUrl(paymentSettings.qrImageUrl)
    : `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('upi://pay?pa=' + (paymentSettings.upiId || 'karviyam@hdfcbank') + '&pn=' + encodeURIComponent(paymentSettings.qrDisplayName || 'Karviyam') + '&cu=INR')}`;

  return (
    <div className="space-y-6 text-xs font-sans max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#B71C1C]" />
            <span>Payment Methods & Settings</span>
          </h1>
          <p className="text-xs text-slate-500">
            Configure available payment methods, QR code options, and verification modes for customer checkout.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Payment Settings</span>
        </button>
      </div>

      {/* Security Banner */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 text-slate-900">
        <ShieldCheck className="w-5 h-5 text-[#B71C1C] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-slate-900">Central Payment Gateways & Verification</p>
          <p className="text-slate-700 font-medium">
            Storefront checkout dynamically loads payment methods configured on this page. All payments are verified server-side before order status becomes PAID / Processing.
          </p>
        </div>
      </div>

      {/* SECTION 1: PAYMENT METHODS TOGGLES */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        <h2 className="font-display font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Power className="w-4 h-4 text-[#B71C1C]" />
          <span>PAYMENT METHODS</span>
        </h2>

        <div className="divide-y divide-slate-100">
          
          {/* 1. Cash on Delivery */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <span className="font-extrabold text-sm text-slate-900 block">Cash on Delivery (COD)</span>
              <span className="text-xs text-slate-500 font-medium">Allow customers to pay cash upon doorstep delivery</span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={paymentSettings.codEnabled}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, codEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          {/* 2. Razorpay / UPI */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <span className="font-extrabold text-sm text-slate-900 block">Razorpay / UPI</span>
              <span className="text-xs text-slate-500 font-medium">Online payment securely through Razorpay Standard Checkout & UPI Intent</span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={paymentSettings.razorpayEnabled}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, razorpayEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          {/* 3. UPI QR Payment */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <span className="font-extrabold text-sm text-slate-900 block">UPI QR Payment</span>
              <span className="text-xs text-slate-500 font-medium">Allow customers to scan a UPI QR code using GPay, PhonePe, Paytm, or BHIM</span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={paymentSettings.upiQrEnabled}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, upiQrEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

        </div>
      </div>

      {/* SECTION 2: UPI QR CONFIGURATION (REVEALED WHEN UPI QR IS ENABLED) */}
      {paymentSettings.upiQrEnabled && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
          <h2 className="font-display font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[#B71C1C]" />
            <span>UPI QR CONFIGURATION</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Left: QR Image Preview & Upload */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-3">
              <span className="font-bold text-slate-800 text-xs block">QR Code Preview</span>
              
              <div className="w-44 h-44 bg-white border border-slate-300 rounded-2xl p-2 mx-auto flex items-center justify-center shadow-xs">
                <img
                  src={previewQrUrl}
                  alt="UPI QR Code Preview"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition-all">
                  {uploadingQr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{paymentSettings.qrImageUrl ? 'Replace QR Code' : 'Upload QR Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrImageUpload}
                    disabled={uploadingQr}
                    className="hidden"
                  />
                </label>

                {paymentSettings.qrImageUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveQrImage}
                    className="block mx-auto text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove Uploaded Image
                  </button>
                )}
              </div>

              <p className="text-[10px] text-slate-500 font-medium">
                PNG transparency is preserved. If no custom image is uploaded, a dynamic QR code for your UPI ID will be generated automatically.
              </p>
            </div>

            {/* Right: Settings Form Fields */}
            <div className="md:col-span-2 space-y-4">
              
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Receiving UPI ID <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={paymentSettings.upiId}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, upiId: e.target.value })}
                  placeholder="e.g. karviyam@hdfcbank"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-mono font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                  required
                />
                <p className="text-[10.5px] text-slate-500 mt-1">This UPI VPA receives funds for QR code payments.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  QR Display Name
                </label>
                <input
                  type="text"
                  value={paymentSettings.qrDisplayName}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, qrDisplayName: e.target.value })}
                  placeholder="e.g. Karviyam Retails"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  QR Payment Instructions
                </label>
                <textarea
                  rows={3}
                  value={paymentSettings.qrInstructions}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, qrInstructions: e.target.value })}
                  placeholder="e.g. Scan this QR code using GPay, PhonePe, Paytm, or BHIM app and complete the payment."
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-medium outline-none focus:border-[#B71C1C] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Payment Verification Mode
                </label>
                <select
                  value={paymentSettings.verificationMode}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, verificationMode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                >
                  <option value="Razorpay">Razorpay (Automated Gateway Verification)</option>
                  <option value="Manual">Manual (Admin Verification Required)</option>
                  <option value="Disabled">Disabled</option>
                </select>
                <p className="text-[10.5px] text-slate-500 mt-1">
                  Orders remain PENDING until backend server verifies payment status.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Bottom Save Action */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg cursor-pointer transition-all flex items-center gap-2 text-xs uppercase tracking-wider"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Payment Settings</span>
        </button>
      </div>

    </div>
  );
}
