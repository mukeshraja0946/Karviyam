import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Sparkles, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Smartphone, Copy, Check, ShoppingBag, Gift } from 'lucide-react';
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
  const [upiError, setUpiError] = useState('');
  
  const [step, setStep] = useState(1); // 1: Enter UPI ID, 2: Request Sent & Polling
  const [txnDetails, setTxnDetails] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  const pollIntervalRef = useRef(null);

  useEffect(() => {
    fetchReceivingAccount();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
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
          setShowSuccessPopup(true);
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

  // STEP 1: Send UPI Collect Request
  const handleSendPaymentRequest = async () => {
    if (!subscription || submitting) return;

    const cleanUpi = upiId.trim();
    if (!cleanUpi) {
      setUpiError('Please enter your VPA / UPI ID (e.g. user@upi or mobile@ybl)');
      return;
    }
    if (!validateUpiIdFormat(cleanUpi)) {
      setUpiError('Invalid UPI ID format. Example: user@upi or mobile@ybl');
      return;
    }
    setUpiError('');

    setSubmitting(true);
    toast.loading('Sending real UPI payment request...', { id: 'sub-checkout-toast' });

    try {
      const resOrder = await api.post('/subscriptions/create-payment', {
        subscriptionId: subscription.id,
        upiId: cleanUpi
      });

      const orderData = resOrder.data?.data || resOrder.data;

      if (!resOrder.data?.success || !orderData?.transactionReference) {
        throw new Error(resOrder.data?.message || 'Failed to send UPI payment request.');
      }

      setTxnDetails(orderData);
      setStep(2);
      toast.success('UPI Payment Request sent! Check your UPI app to approve.', { id: 'sub-checkout-toast', duration: 4000 });

      // Trigger mobile intent link if on mobile
      if (orderData.upiUri && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = orderData.upiUri;
      }

      // Start automatic backend polling every 3.5 seconds
      startStatusPolling(subscription.id);
    } catch (err) {
      console.error('[Subscription UPI Request Error]:', err);
      toast.error(err.response?.data?.message || err.message || 'Unable to send UPI payment request.', { id: 'sub-checkout-toast' });
    } finally {
      setSubmitting(false);
    }
  };

  // Polling backend status endpoint every 3.5 seconds
  const startStatusPolling = (subId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/subscriptions/${subId}/payment-status`).catch(() => null);
        const data = res?.data?.data || res?.data;

        if (data && data.status === 'ACTIVE' && data.paymentStatus === 'SUCCESS') {
          clearInterval(pollIntervalRef.current);
          setSubscription(data);
          setShowSuccessPopup(true);
          toast.success('Payment confirmed! VIP Subscription Activated! 🎉');
        }
      } catch (e) {}
    }, 3500);
  };

  const handleManualCheckStatus = async () => {
    if (!subscription || submitting) return;
    setSubmitting(true);
    toast.loading('Checking payment status with backend...', { id: 'status-check-toast' });

    try {
      const res = await api.get(`/subscriptions/${subscription.id}/payment-status`).catch(() => null);
      const data = res?.data?.data || res?.data;

      if (data && data.status === 'ACTIVE' && data.paymentStatus === 'SUCCESS') {
        setSubscription(data);
        setShowSuccessPopup(true);
        toast.success('Payment verified! VIP Subscription Activated! 🎉', { id: 'status-check-toast' });
      } else {
        toast.error('Payment request is still pending. Please approve in your UPI app.', { id: 'status-check-toast' });
      }
    } catch (e) {
      toast.error('Error checking payment status.', { id: 'status-check-toast' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCoupon = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    toast.success('VIP Offer Coupon copied!');
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center font-sans">
        <Loader2 className="w-10 h-10 text-[#B71C1C] animate-spin mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading VIP Subscription Details...</h3>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-10 px-4 flex justify-center items-center font-sans relative">
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
            Direct UPI Subscription
          </h2>
          <p className="text-xs text-slate-100 mt-1 font-medium">
            Pay directly via Google Pay, PhonePe, Paytm, or BHIM UPI app.
          </p>
        </div>

        {/* Main Content Area */}
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

          {/* STEP 1: ENTER UPI ID */}
          {step === 1 && (
            <div className="p-4 rounded-2xl border-2 border-[#B71C1C] bg-red-50/20 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#B71C1C] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-black text-slate-900 text-xs uppercase">UPI APP DIRECT (GPay, PhonePe, Paytm, BHIM)</h5>
                  <p className="text-[11px] text-slate-600 font-medium">Enter your VPA / UPI ID to receive payment request</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-[11.5px] font-bold text-slate-800">
                  Enter your VPA / UPI ID <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => {
                    setUpiId(e.target.value);
                    setUpiError('');
                  }}
                  placeholder="e.g. username@okhdfcbank, mobile@ybl, name@upi"
                  className="w-full bg-white border border-slate-300 text-xs px-3.5 py-3 rounded-xl outline-none focus:border-[#B71C1C] font-mono shadow-2xs"
                />
                {upiError && <p className="text-[11px] text-red-600 font-bold">{upiError}</p>}
                <p className="text-[10.5px] text-slate-500 font-medium">
                  We will send a real UPI payment request directly to your UPI app.
                </p>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSendPaymentRequest}
                className="w-full bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-extrabold py-4 rounded-2xl shadow-lg text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Payment Request...</span>
                  </>
                ) : (
                  <>
                    <span>VERIFY UPI ID & SEND PAYMENT REQUEST</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: PAYMENT REQUEST SENT & WAITING FOR CONFIRMATION */}
          {step === 2 && (
            <div className="p-5 rounded-2xl border-2 border-amber-400 bg-amber-50/40 shadow-xs space-y-4 text-center">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-amber-300">
                  <span>PAYMENT PENDING</span>
                </div>
                <h4 className="font-black text-slate-900 text-base">Payment Request Sent</h4>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  Please open your UPI app (Google Pay, PhonePe, Paytm, or BHIM) and approve the payment request.
                </p>
              </div>

              {/* Transaction Info Box */}
              <div className="bg-white border border-amber-200 p-3.5 rounded-xl space-y-2 text-left text-[11px]">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="font-bold text-slate-500">Amount:</span>
                  <span className="font-black text-slate-900 text-xs">₹{subscription.amount}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="font-bold text-slate-500">UPI ID:</span>
                  <span className="font-mono font-bold text-slate-900">{upiId}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="font-bold text-slate-500">Payment Reference:</span>
                  <span className="font-mono text-slate-700">#{txnDetails?.transactionReference || `TXN-SUB-${subscription.id}`}</span>
                </div>
              </div>

              <div className="text-[11px] text-amber-800 font-bold flex items-center justify-center gap-1.5 pt-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                <span>Waiting for payment confirmation from backend...</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleManualCheckStatus}
                  className="flex-1 bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-bold py-3 rounded-xl shadow-sm text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Check Payment Status</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel Payment
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================= */}
      {/* STEP 5: SUCCESS POPUP MODAL WITH VIP WELCOME OFFER       */}
      {/* ========================================================= */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Success Animated Badge */}
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[10.5px] font-black uppercase tracking-widest text-emerald-700 block mb-1">
                ✓ PAYMENT SUCCESSFUL
              </span>
              <h2 className="font-display font-black text-2xl text-slate-900">
                Subscription Activated!
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                You are now subscribed to KARVIYAM VIP updates.
              </p>
            </div>

            {/* Payment Summary */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Amount Paid:</span>
                <span className="font-bold text-slate-900">₹{subscription.amount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Subscription ID:</span>
                <span className="font-mono font-bold text-[#B71C1C]">#SUB-{subscription.id}</span>
              </div>
              {subscription.transactionReference && (
                <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200/60 text-[11px]">
                  <span>Payment Reference:</span>
                  <span className="font-mono text-slate-700">{subscription.transactionReference}</span>
                </div>
              )}
            </div>

            {/* VIP WELCOME OFFER (Only if Active Admin Offer exists) */}
            {subscription.hasActiveOffer && subscription.offerCouponCode && (
              <div className="p-4 rounded-2xl border-2 border-dashed border-[#B71C1C] bg-red-50/50 space-y-2 text-left">
                <div className="flex items-center gap-1.5 text-[#B71C1C] font-black text-xs uppercase">
                  <Gift className="w-4 h-4 text-amber-500" />
                  <span>VIP WELCOME OFFER</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {subscription.offerTitle || 'Use this code on your next order for exclusive VIP discount.'}
                </p>
                <div className="flex items-center justify-between bg-white border border-red-200 p-2.5 rounded-xl mt-1">
                  <span className="font-mono font-black text-sm text-[#B71C1C] tracking-wider">
                    {subscription.offerCouponCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCoupon(subscription.offerCouponCode)}
                    className="flex items-center gap-1 bg-[#B71C1C] hover:bg-[#900C0C] text-white text-[10.5px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedCoupon ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCoupon ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="w-full bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold py-3.5 rounded-2xl shadow-md text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>CONTINUE SHOPPING</span>
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
