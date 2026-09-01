import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Sparkles, Mail, ShieldCheck, ArrowRight, Copy, Check } from 'lucide-react';
import api from '../utils/api';

export default function SubscriptionSuccessPage() {
  const [searchParams] = useSearchParams();
  const subscriptionId = searchParams.get('id');
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (subscriptionId) {
      fetchSubscription();
    }
  }, [subscriptionId]);

  const fetchSubscription = async () => {
    try {
      const res = await api.get(`/subscriptions/detail/${subscriptionId}`).catch(() => null);
      const data = res?.data?.data || res?.data;
      if (data) {
        setSubscription(data);
      }
    } catch (e) {}
  };

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText('KARVIYAM25');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 flex items-center justify-center font-sans">
      <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl shadow-xl p-6 sm:p-8 text-center space-y-6">
        
        {/* Animated Success Badge */}
        <div className="w-20 h-20 bg-emerald-100 border-4 border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>PAYMENT VERIFIED & ACTIVE</span>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Subscription Successful!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            You're now subscribed to KARVIYAM updates.
          </p>
        </div>

        {/* Subscription Receipt Box */}
        {subscription && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="font-bold text-slate-500">Subscriber Email</span>
              <span className="font-mono font-bold text-slate-900">{subscription.email}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="font-bold text-slate-500">Subscription ID</span>
              <span className="font-mono font-bold text-[#B71C1C]">#SUB-{subscription.id}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="font-bold text-slate-500">Payment Status</span>
              <span className="font-bold text-emerald-700">🟢 SUCCESS</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-slate-900">Amount Paid</span>
              <span className="font-black text-slate-900 text-sm">
                {subscription.currency || '₹'} {subscription.amount}
              </span>
            </div>
          </div>
        )}

        {/* VIP Member Coupon Box */}
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-dashed border-red-300 rounded-2xl p-4 space-y-2">
          <span className="text-[10px] font-black uppercase text-[#B71C1C] tracking-widest block">
            VIP WELCOME GIFT COUPON
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono font-black text-xl text-[#B71C1C] tracking-widest">KARVIYAM25</span>
            <button
              onClick={handleCopyCoupon}
              className="p-1 text-slate-600 hover:text-[#B71C1C] cursor-pointer"
              title="Copy Coupon"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-600 font-medium">
            Use code <span className="font-bold text-slate-900">KARVIYAM25</span> at checkout for an extra 25% OFF your next order.
          </p>
        </div>

        {/* Confirmation Email Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
          <Mail className="w-4 h-4 text-[#B71C1C]" />
          <span>A confirmation receipt has been sent to your email.</span>
        </div>

        {/* Action Button */}
        <Link
          to="/shop"
          className="w-full bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold py-3.5 rounded-2xl shadow-md text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
        >
          <span>Explore Shop & Use VIP Coupon</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

      </div>
    </div>
  );
}
