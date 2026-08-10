import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowRight, Printer, Shield, FileText } from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';

export default function OrderSuccessPage() {
  const location = useLocation();
  const orderDetails = location.state?.order || {
    id: '#ORD' + Math.floor(100000 + Math.random() * 900000),
    totalAmount: 1798,
    items: [
      { name: 'Karviyam Cyberpunk Oversized Tee', quantity: 1, price: 899 },
      { name: 'Urban Linen Casual Shirt', quantity: 1, price: 899 }
    ],
    shippingAddress: {
      fullName: 'Ravi Kumar',
      addressLine: 'Karviyam Residence, Main Road',
      city: 'Chennai',
      pincode: '600001',
      phone: '+91 98765 43210'
    }
  };

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white max-w-lg w-full p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-2xl text-center space-y-6">
        
        {/* Animated Check Icon Badge */}
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-in zoom-in-50">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#B71C1C] block mb-1">
            Order Placed Successfully
          </span>
          <h1 className="font-display font-black text-2xl text-slate-900">
            Thank You for Your Order!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Order ID: <span className="font-bold text-slate-800">{orderDetails.id}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>Payment Status:</span>
            <span className="font-bold text-emerald-600">Confirmed (COD / Card)</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Estimated Delivery:</span>
            <span className="font-bold text-slate-900">3-5 Business Days</span>
          </div>
          <div className="flex justify-between text-slate-600 font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
            <span>Amount Paid:</span>
            <span className="text-[#B71C1C]">₹{orderDetails.totalAmount}</span>
          </div>
        </div>

        {/* Download Invoice Button */}
        <button
          onClick={() => setInvoiceModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-[#B71C1C] text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-2xl transition-all shadow-md"
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
        orderDetails={orderDetails}
      />
    </div>
  );
}
