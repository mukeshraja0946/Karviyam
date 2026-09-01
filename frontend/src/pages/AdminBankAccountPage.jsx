import React, { useState, useEffect } from 'react';
import { Landmark, Eye, EyeOff, Save, Loader2, Power, ShieldCheck, CheckCircle2, AlertCircle, Copy, Sparkles, Building2, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { broadcastSyncEvent } from '../services/api';

export default function AdminBankAccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(false);

  const [bankDetails, setBankDetails] = useState({
    enabled: true,
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    upiId: '',
    accountType: 'Current',
    instructions: ''
  });

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/bank-account').catch(() => null);
      const data = res?.data?.data || res?.data;
      if (data) {
        setBankDetails({
          enabled: data.enabled !== false,
          accountHolder: data.accountHolder || data.account_holder_name || '',
          bankName: data.bankName || data.bank_name || '',
          accountNumber: data.accountNumber || data.account_number || '',
          ifscCode: data.ifscCode || data.ifsc_code || '',
          branchName: data.branchName || data.branch_name || '',
          upiId: data.upiId || data.upi_id || '',
          accountType: data.accountType || data.account_type || 'Current',
          instructions: data.instructions || data.payment_instructions || ''
        });
      }
    } catch (e) {
      toast.error('Failed to load bank account details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    // Field Validations
    if (!bankDetails.accountHolder.trim()) {
      toast.error('Account Holder Name is required.');
      return;
    }
    if (!bankDetails.bankName.trim()) {
      toast.error('Bank Name is required.');
      return;
    }
    if (!bankDetails.accountNumber.trim()) {
      toast.error('Account Number is required.');
      return;
    }
    if (!bankDetails.ifscCode.trim()) {
      toast.error('IFSC Code is required.');
      return;
    }
    if (!bankDetails.upiId.trim()) {
      toast.error('Receiving UPI ID is required.');
      return;
    }

    setSaving(true);
    toast.loading('Saving bank account settings...', { id: 'admin-bank-toast' });

    try {
      const res = await api.put('/admin/bank-account', bankDetails);
      const resData = res?.data ? res.data : res;

      if (resData?.success) {
        toast.success('Bank account settings saved successfully.', { id: 'admin-bank-toast' });
        broadcastSyncEvent('karviyam_bank_account_updated');
        await fetchBankDetails();
      } else {
        toast.error(resData?.message || 'Failed to save bank account settings.', { id: 'admin-bank-toast' });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Error saving bank account details.';
      toast.error(errMsg, { id: 'admin-bank-toast' });
    } finally {
      setSaving(false);
    }
  };

  const getMaskedDisplay = (accNo) => {
    if (!accNo) return '';
    if (showFullAccount) return accNo;
    const str = String(accNo).trim();
    if (str.length <= 4) return str;
    return `•••• •••• •••• ${str.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 font-sans">
        <Loader2 className="w-10 h-10 text-[#B71C1C] animate-spin mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Bank Account Receiving Settings...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs font-sans max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-[#B71C1C]" />
            <span>Bank Account & Receiving Details</span>
          </h1>
          <p className="text-xs text-slate-500">
            Configure central receiving bank account and UPI ID used for both Customer Product Orders and VIP Subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Payment Details</span>
          </button>
        </div>
      </div>

      {/* Info & Security Notice */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3 text-emerald-950">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-slate-900">Central Payment Receiving Source</p>
          <p className="text-slate-700 font-medium">
            This account serves as the single source of truth for all incoming customer payments. Disabling this master toggle will hide bank transfer and manual UPI options from storefront checkout screens.
          </p>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* Master Enable/Disable Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Power className="w-4 h-4 text-[#B71C1C]" />
              <span>Receiving Bank Account Status</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Master toggle to enable or disable bank transfer/UPI receiving on storefront.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 shrink-0">
            <span className={`text-xs font-black uppercase ${!bankDetails.enabled ? 'text-rose-600' : 'text-slate-400'}`}>
              DISABLED
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={bankDetails.enabled}
                onChange={(e) => setBankDetails({ ...bankDetails, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
            <span className={`text-xs font-black uppercase ${bankDetails.enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
              ENABLED
            </span>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSave} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Account Holder Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Account Holder Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={bankDetails.accountHolder}
                onChange={(e) => setBankDetails({ ...bankDetails, accountHolder: e.target.value })}
                placeholder="e.g. KARVIYAM RETAILS PRIVATE LIMITED"
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-xs outline-none focus:border-[#B71C1C]"
              />
            </div>

            {/* Bank Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Bank Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                placeholder="e.g. HDFC Bank / ICICI Bank"
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-xs outline-none focus:border-[#B71C1C]"
              />
            </div>

            {/* Account Number with Mask / Show Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">
                  Account Number <span className="text-red-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowFullAccount(!showFullAccount)}
                  className="text-[10.5px] font-bold text-[#B71C1C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showFullAccount ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showFullAccount ? 'Hide Number' : 'Show Full Number'}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={showFullAccount ? bankDetails.accountNumber : getMaskedDisplay(bankDetails.accountNumber)}
                  onChange={(e) => {
                    if (showFullAccount) {
                      setBankDetails({ ...bankDetails, accountNumber: e.target.value });
                    }
                  }}
                  readOnly={!showFullAccount}
                  placeholder="e.g. 50200012345678"
                  className={`w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono font-bold text-xs outline-none focus:border-[#B71C1C] ${
                    !showFullAccount ? 'cursor-not-allowed text-slate-600' : ''
                  }`}
                />
              </div>
            </div>

            {/* IFSC Code */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                IFSC Code <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={bankDetails.ifscCode}
                onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                placeholder="e.g. HDFC0001234"
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono font-bold text-xs outline-none focus:border-[#B71C1C]"
              />
            </div>

            {/* Branch Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Branch Name</label>
              <input
                type="text"
                value={bankDetails.branchName}
                onChange={(e) => setBankDetails({ ...bankDetails, branchName: e.target.value })}
                placeholder="e.g. T. Nagar Branch, Chennai"
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-medium text-xs outline-none focus:border-[#B71C1C]"
              />
            </div>

            {/* UPI ID / VPA */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Receiving UPI ID / VPA <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={bankDetails.upiId}
                onChange={(e) => setBankDetails({ ...bankDetails, upiId: e.target.value })}
                placeholder="e.g. karviyam@hdfcbank, 9876543210@ybl"
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono font-bold text-indigo-900 outline-none focus:border-[#B71C1C]"
              />
            </div>

            {/* Account Type */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Account Type</label>
              <select
                value={bankDetails.accountType}
                onChange={(e) => setBankDetails({ ...bankDetails, accountType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-xs outline-none focus:border-[#B71C1C]"
              >
                <option value="Current">Current Account</option>
                <option value="Savings">Savings Account</option>
              </select>
            </div>

          </div>

          {/* Payment Instructions / Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Instructions / Notes for Customers</label>
            <textarea
              rows={3}
              value={bankDetails.instructions}
              onChange={(e) => setBankDetails({ ...bankDetails, instructions: e.target.value })}
              placeholder="e.g. Please quote your Order Reference ID or Subscription ID in payment remarks."
              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-medium text-xs outline-none focus:border-[#B71C1C]"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-bold px-8 py-3 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Bank Account Settings</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
