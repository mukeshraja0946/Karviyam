import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight, FileText, AlertTriangle, RefreshCw, Loader2, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import InvoiceModal from '../components/InvoiceModal';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const passedOrder = location.state?.order;
  const orderIdFromUrl = searchParams.get('id') || searchParams.get('orderId') || (passedOrder ? (passedOrder.id || passedOrder.orderCode) : null);

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(passedOrder || null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  
  const [utrNumber, setUtrNumber] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (orderIdFromUrl) {
      fetchOrderDetails(orderIdFromUrl);
    } else {
      setLoading(false);
    }
  }, [orderIdFromUrl]);

  const fetchOrderDetails = async (idToFetch) => {
    setLoading(true);
    try {
      const cleanId = String(idToFetch).replace(/\D/g, '') || idToFetch;
      const res = await api.get(`/orders/${cleanId}`).catch(() => null);
      const data = res?.data?.data || res?.data;

      if (data && data.id) {
        setOrder(data);
      }
    } catch (e) {
      console.error('Failed to load order details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUpiPayment = async () => {
    if (!order || verifying) return;

    if (!utrNumber.trim()) {
      toast.error('Please enter your 12-digit UPI UTR / Reference number from your payment app.');
      return;
    }

    setVerifying(true);
    toast.loading('Verifying payment with backend...', { id: 'order-verify-toast' });

    try {
      const res = await api.post('/orders/verify-payment', {
        orderId: order.id,
        utrNumber: utrNumber.trim(),
        paidAmount: order.totalAmount
      });

      const resData = res?.data ? res.data : res;

      if (resData?.success) {
        toast.success('UPI Payment verified successfully! Order Confirmed! 🎉', { id: 'order-verify-toast' });
        await fetchOrderDetails(order.id);
      } else {
        toast.error(resData?.message || 'Payment verification pending. Complete transfer in your UPI app.', { id: 'order-verify-toast' });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Error verifying UPI payment.';
      toast.error(errMsg, { id: 'order-verify-toast' });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-sans">
        <Loader2 className="w-10 h-10 text-[#B71C1C] animate-spin mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Verifying Order Payment Status...</h3>
      </div>
    );
  }

  // ----------------------------------------------------
  // VERIFICATION LOGIC: Must be verified by backend database!
  // ----------------------------------------------------
  const pStatus = (order?.paymentStatus || '').toUpperCase();
  const oStatus = (order?.status || '').toUpperCase();
  const isCod = (order?.paymentMethod || '').toUpperCase() === 'COD';

  const isConfirmed = order && (
    pStatus === 'SUCCESS' || pStatus === 'PAID' || pStatus === 'COMPLETED' ||
    oStatus === 'CONFIRMED' || oStatus === 'PROCESSING' || oStatus === 'SHIPPED' || oStatus === 'DELIVERED' ||
    (isCod && oStatus !== 'CANCELLED')
  );

  const isFailed = order && (pStatus === 'FAILED' || pStatus === 'CANCELLED' || oStatus === 'CANCELLED');

  // ----------------------------------------------------
  // 1. UNPAID / PENDING UPI VERIFICATION STATE
  // ----------------------------------------------------
  if (!order || (!isConfirmed && !isFailed)) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 font-sans">
        <div className="bg-white max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl text-center space-y-6">
          
          <div className="w-20 h-20 bg-amber-100 border-4 border-amber-200 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-md">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2 border border-amber-200">
              <span>PAYMENT PENDING VERIFICATION</span>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
              We are waiting for your UPI payment
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Your order has been recorded, but payment has not been confirmed by backend yet.
            </p>
          </div>

          {order && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="font-bold text-slate-500">Order ID</span>
                <span className="font-mono font-bold text-[#B71C1C]">#ORD-{order.id}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="font-bold text-slate-500">Payment Status</span>
                <span className="font-bold text-amber-700 uppercase">🟡 {order.paymentStatus || 'PENDING'}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-slate-900">Total Amount Due</span>
                <span className="font-black text-slate-900 text-sm">₹{order.totalAmount}</span>
              </div>
            </div>
          )}

          {/* UTR Input Form */}
          {order && (
            <div className="bg-red-50/50 border border-red-200 p-4 rounded-2xl text-left space-y-2.5">
              <label className="block text-[11px] font-bold text-slate-800">
                Already paid in your UPI App? Enter UTR / Ref Number:
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. 12-digit UTR from GPay / PhonePe / Paytm"
                className="w-full bg-white border border-slate-300 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#B71C1C] font-mono shadow-2xs"
              />
              <button
                type="button"
                disabled={verifying}
                onClick={handleVerifyUpiPayment}
                className="w-full bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Verify Payment Status</span>
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => fetchOrderDetails(order?.id || orderIdFromUrl)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3.5 rounded-2xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Status</span>
            </button>

            <Link
              to="/shop"
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold text-xs py-3.5 rounded-2xl transition-colors shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. FAILED / CANCELLED PAYMENT STATE
  // ----------------------------------------------------
  if (isFailed) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 font-sans">
        <div className="bg-white max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 border-4 border-red-200 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-md">
            <AlertTriangle className="w-10 h-10" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2 border border-red-200">
              <span>PAYMENT UNSUCCESSFUL</span>
            </div>

            <h1 className="font-display font-black text-2xl text-slate-900">
              Order Payment Failed or Cancelled
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Your transaction was declined or cancelled by your payment app.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              to="/checkout"
              className="w-full bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold py-3.5 rounded-2xl shadow-md text-xs uppercase tracking-wider transition-all block text-center"
            >
              Try Checkout Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 3. VERIFIED SUCCESSFUL STATE
  // ----------------------------------------------------
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 font-sans">
      <div className="bg-white max-w-lg w-full p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-2xl text-center space-y-6">
        
        {/* Animated Check Icon Badge */}
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#B71C1C] block mb-1">
            Order Placed Successfully
          </span>
          <h1 className="font-display font-black text-2xl text-slate-900">
            Thank You for Your Order!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Order ID: <span className="font-mono font-bold text-slate-800">#ORD-{order.id}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>Payment Status:</span>
            <span className="font-bold text-emerald-700">🟢 Payment Completed ({isCod ? 'COD' : 'Verified UPI'})</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Estimated Delivery:</span>
            <span className="font-bold text-slate-900">3-5 Business Days</span>
          </div>
          <div className="flex justify-between text-slate-600 font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
            <span>Amount Paid:</span>
            <span className="text-[#B71C1C]">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Download Invoice Button */}
        <button
          onClick={() => setInvoiceModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-[#B71C1C] text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-2xl transition-all shadow-md cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>View & Download Tax Invoice</span>
        </button>

        <div className="flex gap-4 pt-2">
          <Link
            to="/shop"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-[#B71C1C] font-bold text-xs py-3.5 rounded-2xl transition-colors border border-red-200"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>

          <Link
            to="/profile"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3.5 rounded-2xl transition-colors"
          >
            <span>Track Order</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

      {/* Tax Invoice Modal */}
      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        orderDetails={order}
      />
    </div>
  );
}
