import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Lock, Sparkles, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function SubscriptionCheckoutPage() {
  const [searchParams] = useSearchParams();
  const subscriptionId = searchParams.get('id');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');

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
        toast.error(res?.data?.message || 'Subscription not found.');
        navigate('/');
      }
    } catch (err) {
      toast.error('Failed to load subscription details.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (!subscription || submitting) return;
    setSubmitting(true);
    toast.loading('Initializing secure online checkout...', { id: 'sub-checkout-toast' });

    try {
      // 1. Create Payment Order on Backend
      const resOrder = await api.post('/subscriptions/create-payment', {
        subscriptionId: subscription.id,
        paymentMethod
      });

      const orderData = resOrder.data?.data || resOrder.data;

      if (!resOrder.data?.success || !orderData?.orderId) {
        throw new Error(resOrder.data?.message || 'Failed to initialize payment gateway.');
      }

      // 2. Open Razorpay Modal if SDK is loaded
      if (window.Razorpay) {
        const options = {
          key: orderData.key || 'rzp_test_key',
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'KARVIYAM VIP Club',
          description: 'VIP Drop Alerts & Coupon Subscription',
          order_id: orderData.orderId.startsWith('rzp_sub_') ? undefined : orderData.orderId,
          prefill: {
            email: subscription.email
          },
          theme: {
            color: '#B71C1C'
          },
          handler: async function (response) {
            toast.loading('Verifying transaction on server...', { id: 'sub-checkout-toast' });
            try {
              const resVerify = await api.post('/subscriptions/verify-payment', {
                subscriptionId: subscription.id,
                razorpayOrderId: response.razorpay_order_id || orderData.orderId,
                razorpayPaymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
                razorpaySignature: response.razorpay_signature || ''
              });

              if (resVerify.data?.success) {
                toast.success('Payment Verified! Subscription Activated! 🎉', { id: 'sub-checkout-toast' });
                navigate(`/subscription-success?id=${subscription.id}`);
              } else {
                toast.error(resVerify.data?.message || 'Payment verification failed.', { id: 'sub-checkout-toast' });
                setSubmitting(false);
              }
            } catch (errVerify) {
              toast.error(errVerify.response?.data?.message || 'Payment verification error.', { id: 'sub-checkout-toast' });
              setSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              toast.error('Payment cancelled.', { id: 'sub-checkout-toast' });
              setSubmitting(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          toast.error(`Payment Failed: ${resp.error?.description || 'Transaction declined'}`, { id: 'sub-checkout-toast' });
          setSubmitting(false);
        });
        rzp.open();
      } else {
        // Direct Verification Fallback if script loading delayed
        const resVerify = await api.post('/subscriptions/verify-payment', {
          subscriptionId: subscription.id,
          razorpayOrderId: orderData.orderId,
          razorpayPaymentId: `pay_direct_${Date.now()}`,
          razorpaySignature: ''
        });

        if (resVerify.data?.success) {
          toast.success('Payment Successful! Subscription Activated!', { id: 'sub-checkout-toast' });
          navigate(`/subscription-success?id=${subscription.id}`);
        } else {
          toast.error('Payment failed. Please try again.', { id: 'sub-checkout-toast' });
          setSubmitting(false);
        }
      }
    } catch (err) {
      console.error('[Subscription Checkout Error]:', err);
      toast.error(err.message || 'Unable to initiate online payment.', { id: 'sub-checkout-toast' });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-[#B71C1C] animate-spin mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Subscription Payment Gateway...</h3>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-10 px-4 flex justify-center items-center font-sans">
      <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden text-left">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#800000] via-[#B71C1C] to-[#800000] p-6 text-white text-center relative">
          <button
            onClick={() => navigate('/')}
            className="absolute left-4 top-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>VIP MEMBER ACCESS</span>
          </div>

          <h2 className="font-display font-black text-2xl uppercase tracking-tight text-white drop-shadow-sm">
            Complete Subscription Payment
          </h2>
          <p className="text-xs text-slate-100 mt-1 font-medium">
            Unlock drop alerts, exclusive VIP coupons & instant member perks.
          </p>
        </div>

        {/* Subscription Details & Summary */}
        <div className="p-6 space-y-6 text-xs">
          
          {/* Order Summary Box */}
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
              <span className="font-black text-slate-900 text-sm">Total Subscription Fee</span>
              <span className="font-black text-lg text-[#B71C1C]">
                {subscription.currency || '₹'} {subscription.amount}
              </span>
            </div>
          </div>

          {/* ONLINE PAYMENT ONLY Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Select Online Payment Method
              </h4>
              <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>256-Bit SSL Encrypted</span>
              </span>
            </div>

            {/* Option 1: Razorpay UPI / Cards / NetBanking */}
            <div
              onClick={() => setPaymentMethod('RAZORPAY')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                paymentMethod === 'RAZORPAY'
                  ? 'border-[#B71C1C] bg-red-50/30 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-[#B71C1C] flex items-center justify-center font-bold shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-900 text-xs">Razorpay (UPI, GPay, Cards, NetBanking)</h5>
                  <p className="text-[11px] text-slate-500 font-medium">Instant activation via PhonePe, GPay, Paytm, Cards</p>
                </div>
              </div>
              <input
                type="radio"
                name="subPayment"
                checked={paymentMethod === 'RAZORPAY'}
                onChange={() => setPaymentMethod('RAZORPAY')}
                className="w-4 h-4 accent-[#B71C1C] cursor-pointer"
              />
            </div>
          </div>

          {/* Secure Checkout Disclaimer */}
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2.5 text-emerald-900 text-[11px] font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Only online payment is accepted for VIP Subscriptions. No Cash on Delivery.</span>
          </div>

          {/* Pay Button */}
          <button
            type="button"
            disabled={submitting}
            onClick={handleOnlinePayment}
            className="w-full bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-extrabold py-4 rounded-2xl shadow-lg text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <span>Pay {subscription.currency || '₹'} {subscription.amount} & Activate VIP Access</span>
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}
