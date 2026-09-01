import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Sparkles, CheckCircle, AlertCircle, Loader2, ArrowLeft, QrCode, Smartphone, Copy, Check, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function SubscriptionCheckoutPage() {
  const [searchParams] = useSearchParams();
  const subscriptionId = searchParams.get('id');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [bankAccount, setBankAccount] = useState(null);
  
  const [upiId, setUpiId] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [upiError, setUpiError] = useState('');
  const [utrError, setUtrError] = useState('');
  
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [txnDetails, setTxnDetails] = useState(null);
  const [step, setStep] = useState(1); // 1: Pay via UPI, 2: Submit UTR Verification

  useEffect(() => {
    fetchReceivingAccount();
  }, []);

  const fetchReceivingAccount = async () => {
    try {
      const res = await api.get('/bank-account/public').catch(() => null);
      const data = res?.data?.data || res?.data;
      if (data) setBankAccount(data);
    } catch (e) {}
  };

  useEffect(() => {
    if (!subscriptionId) {
      toast.error('Subscription ID missing.');
      navigate('/');
      return;
    }
    fetchSubscription();
  }, [subscriptionId]);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/subscriptions/detail/${subscriptionId}`).catch(() => null);
      const data = res?.data?.data || res?.data;

      if (res?.data?.success && data) {
        setSubscription(data);
        if (data.status === 'ACTIVE' && data.paymentStatus === 'SUCCESS') {
          toast.success('Your subscription is already active!');
          navigate(`/subscription-success?id=${data.id}`);
        }
      } else {
        toast.error(res?.data?.message || 'Subscription record not found.');
        navigate('/');
      }
    } catch (err) {
      toast.error('Failed to load subscription details.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const validateUpiIdFormat = (vpa) => {
    return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(String(vpa || '').trim());
  };

  const handleCopyUpi = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    toast.success('Receiving UPI ID copied!');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // STEP 1: Generate UPI Intent & Payment Request
  const handleInitiateUpiPayment = async () => {
    if (!subscription || submitting) return;

    if (!upiId.trim()) {
      setUpiError('Please enter your VPA / UPI ID (e.g., name@upi or mobile@ybl)');
      return;
    }
    if (!validateUpiIdFormat(upiId.trim())) {
      setUpiError('Invalid UPI ID format. Example: user@upi or mobile@ybl');
      return;
    }
    setUpiError('');

    setSubmitting(true);
    toast.loading('Generating secure UPI payment request...', { id: 'sub-checkout-toast' });

    try {
      const resOrder = await api.post('/subscriptions/create-payment', {
        subscriptionId: subscription.id,
        upiId: upiId.trim()
      });

      const orderData = resOrder.data?.data || resOrder.data;

      if (!resOrder.data?.success || !orderData?.transactionReference) {
        throw new Error(resOrder.data?.message || 'Failed to generate UPI transaction reference.');
      }

      setTxnDetails(orderData);
      setStep(2);
      toast.success('UPI Payment Request generated! Open your UPI App to complete transfer.', { id: 'sub-checkout-toast' });

      // Trigger UPI Intent link if on mobile
      if (orderData.upiUri && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = orderData.upiUri;
      }
    } catch (err) {
      console.error('[Subscription UPI Error]:', err);
      toast.error(err.message || 'Unable to initiate UPI payment request.', { id: 'sub-checkout-toast' });
    } finally {
      setSubmitting(false);
    }
  };

  // STEP 2: Submit UTR / Reference ID for Server Verification
  const handleVerifyUpiPayment = async () => {
    if (!subscription || submitting) return;

    if (!utrNumber.trim()) {
      setUtrError('Please enter the 12-digit UPI UTR / Reference number from your payment app.');
      return;
    }
    setUtrError('');

    setSubmitting(true);
    toast.loading('Submitting payment for server verification...', { id: 'sub-checkout-toast' });

    try {
      const resVerify = await api.post('/subscriptions/verify-payment', {
        subscriptionId: subscription.id,
        transactionReference: txnDetails?.transactionReference || `TXN-SUB-${subscription.id}`,
        utrNumber: utrNumber.trim()
      });

      const verifyData = resVerify.data?.data || resVerify.data;

      if (resVerify.data?.success && verifyData?.paymentStatus === 'SUCCESS') {
        toast.success('UPI Payment Verified! Subscription Activated! 🎉', { id: 'sub-checkout-toast' });
      } else {
        toast.success('Payment submitted for verification! Your subscription will activate after confirmation.', { id: 'sub-checkout-toast' });
      }

      navigate(`/subscription-success?id=${subscription.id}`);
    } catch (err) {
      console.error('[Subscription Verification Error]:', err);
      toast.error(err.response?.data?.message || 'Error submitting payment verification.', { id: 'sub-checkout-toast' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center font-sans">
        <Loader2 className="w-10 h-10 text-[#B71C1C] animate-spin mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Subscription Payment Details...</h3>
      </div>
    );
  }

  const receivingUpi = bankAccount?.upiId || 'karviyam@hdfcbank';
  const receivingName = bankAccount?.accountHolder || 'KARVIYAM RETAILS PRIVATE LIMITED';
  const receivingBank = bankAccount?.bankName || 'HDFC Bank';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${receivingUpi}&pn=${receivingName}&am=${subscription.amount}&cu=INR`)}`;

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-10 px-4 flex justify-center items-center font-sans">
      <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden text-left">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#800000] via-[#B71C1C] to-[#800000] p-6 text-white text-center relative">
          <button
            onClick={() => navigate('/')}
            className="absolute left-4 top-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>VIP MEMBER ACCESS</span>
          </div>

          <h2 className="font-display font-black text-2xl uppercase tracking-tight text-white drop-shadow-sm">
            UPI Direct Subscription
          </h2>
          <p className="text-xs text-slate-100 mt-1 font-medium">
            Pay directly via Google Pay, PhonePe, Paytm, or BHIM UPI app.
          </p>
        </div>

        {/* Main Form Content */}
        <div className="p-6 space-y-6 text-xs">
          
          {/* Subscription Summary Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
              <span className="font-bold text-slate-600">Subscriber Email</span>
              <span className="font-mono font-extrabold text-slate-900">{subscription.email}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
              <span className="font-bold text-slate-600">Subscription Reference</span>
              <span className="font-mono font-bold text-[#B71C1C]">#SUB-{subscription.id}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="font-black text-slate-900 text-sm">Total Subscription Amount</span>
              <span className="font-black text-lg text-[#B71C1C]">
                {subscription.currency || '₹'} {subscription.amount}
              </span>
            </div>
          </div>

          {/* UPI APP DIRECT SECTION ONLY */}
          <div className="p-4 rounded-2xl border-2 border-[#B71C1C] bg-red-50/20 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#B71C1C] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-black text-slate-900 text-xs uppercase">UPI APP DIRECT (GPay, PhonePe, Paytm, BHIM)</h5>
                  <p className="text-[11px] text-slate-600 font-medium">Direct UPI transfer to official KARVIYAM account</p>
                </div>
              </div>
              <div className="w-4 h-4 rounded-full bg-[#B71C1C] flex items-center justify-center text-white shrink-0">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Receiving Account Box */}
            <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-500">Receiving UPI ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-slate-900">{receivingUpi}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyUpi(receivingUpi)}
                    className="p-1 text-slate-500 hover:text-[#B71C1C] cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-500">Account Name:</span>
                <span className="font-bold text-slate-800">{receivingName}</span>
              </div>
            </div>

            {/* QR Code Scanner (Desktop/Tablet Display) */}
            <div className="flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[10.5px] font-bold text-slate-600 uppercase mb-2 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-[#B71C1C]" />
                <span>Scan QR Code with any UPI App</span>
              </span>
              <img
                src={qrCodeUrl}
                alt="KARVIYAM UPI Payment QR"
                className="w-36 h-36 border p-1.5 rounded-xl shadow-2xs"
              />
              <span className="text-[10px] text-slate-400 font-medium mt-1">GPay • PhonePe • Paytm • BHIM • Amazon Pay</span>
            </div>

            {/* STEP 1 INPUT: VPA / UPI ID */}
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <label className="block text-[11px] font-bold text-slate-800">
                1. Enter your VPA / UPI ID <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  setUpiError('');
                }}
                placeholder="e.g. username@okhdfcbank, mobile@ybl, name@upi"
                className="w-full bg-white border border-slate-300 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#B71C1C] font-mono shadow-2xs"
              />
              {upiError && <p className="text-[11px] text-red-600 font-bold">{upiError}</p>}
            </div>

            {/* STEP 2 INPUT: UTR / Reference ID (After Initiating Payment) */}
            {step === 2 && (
              <div className="space-y-2 pt-2 border-t border-red-200 bg-red-50/50 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-extrabold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Request Created (#{txnDetails?.transactionReference})</span>
                </div>
                <label className="block text-[11px] font-bold text-slate-900">
                  2. Enter 12-Digit UPI UTR / Ref Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => {
                    setUtrNumber(e.target.value);
                    setUtrError('');
                  }}
                  placeholder="e.g. 423901827491 or Transaction Ref ID"
                  className="w-full bg-white border border-slate-300 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#B71C1C] font-mono shadow-2xs"
                />
                {utrError && <p className="text-[11px] text-red-600 font-bold">{utrError}</p>}
                <p className="text-[10px] text-slate-500 font-medium">
                  Found in your UPI app payment history receipt after completing transfer.
                </p>
              </div>
            )}

          </div>

          {/* Secure Notice */}
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[10.5px] text-amber-900 font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Server Verified:</strong> Subscriptions activate strictly upon backend transaction verification. Unpaid or unconfirmed requests will remain pending.
            </span>
          </div>

          {/* Action Button */}
          {step === 1 ? (
            <button
              type="button"
              disabled={submitting}
              onClick={handleInitiateUpiPayment}
              className="w-full bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-extrabold py-4 rounded-2xl shadow-lg text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initiating UPI Request...</span>
                </>
              ) : (
                <>
                  <span>Pay {subscription.currency || '₹'} {subscription.amount} via UPI App</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleVerifyUpiPayment}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-extrabold py-4 rounded-2xl shadow-lg text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Transaction...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit UTR & Verify VIP Access</span>
                </>
              )}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
