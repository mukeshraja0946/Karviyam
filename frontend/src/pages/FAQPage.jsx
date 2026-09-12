import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  Mail,
  Phone
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const DEFAULT_FAQS = [
  {
    category: 'Ordering & Catalog',
    icon: 'Package',
    questions: [
      {
        q: 'How do I place an order on Karviyam?',
        a: 'Browse our catalog, select your desired size and color, click "Add to Cart", and proceed to checkout. You can pay securely via Credit/Debit Cards, UPI, Net Banking, or Cash on Delivery.'
      },
      {
        q: 'Are all products on Karviyam authentic and original?',
        a: 'Yes, 100%! All apparel, 925 sterling silver jewellery, and footwear on Karviyam are verified authentic directly from licensed manufacturers.'
      },
      {
        q: 'Can I cancel or modify my order after placing it?',
        a: 'You can cancel your order within 24 hours of placement or before it gets dispatched from our warehouse. Go to your Account → My Orders to request a cancellation.'
      }
    ]
  },
  {
    category: 'Shipping & Order Tracking',
    icon: 'Truck',
    questions: [
      {
        q: 'How can I track my order live?',
        a: 'Click "Track My Order" in the website footer or visit your Profile page. You can enter your Order ID or AWB Tracking Number to view real-time shipping milestones and location updates.'
      },
      {
        q: 'What are the delivery charges and timelines?',
        a: 'We offer FREE shipping on all prepaid orders above ₹499 across India. Standard delivery takes 3 to 5 business days depending on your pincode.'
      }
    ]
  },
  {
    category: 'Returns, Exchanges & Refunds',
    icon: 'RotateCcw',
    questions: [
      {
        q: 'What is Karviyam’s Return Policy?',
        a: 'We offer a hassle-free 30-day return and exchange policy. Items must be unworn, unwashed, and in their original packaging with tags intact.'
      },
      {
        q: 'How long does a refund take to process?',
        a: 'Once your returned product is inspected at our hub, refunds are credited back to your original payment method within 3-5 business days.'
      }
    ]
  },
  {
    category: 'Payments & Security',
    icon: 'ShieldCheck',
    questions: [
      {
        q: 'Which payment methods are accepted?',
        a: 'We accept Razorpay, UPI (Google Pay, PhonePe, Paytm), All Credit & Debit Cards, Net Banking, and Cash on Delivery (COD).'
      },
      {
        q: 'Is my payment information secure?',
        a: 'Absolutely. All transactions are encrypted with SSL 256-bit security and processed through RBI-approved gateway partners.'
      }
    ]
  }
];

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openFaqId, setOpenFaqId] = useState(null);
  const [faqData, setFaqData] = useState(DEFAULT_FAQS);
  const [customFaqHtml, setCustomFaqHtml] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchFaqSettings = async () => {
      try {
        const res = await api.get('/footer-settings').catch(() => null);
        const data = res?.data?.data || res?.data;
        if (data && data.faqContent) {
          setCustomFaqHtml(data.faqContent);
        }
      } catch (e) {}
    };
    fetchFaqSettings();
  }, []);

  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const filteredFaqs = faqData.map(cat => {
    const qList = cat.questions.filter(
      item =>
        item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.a.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return { ...cat, questions: qList };
  }).filter(cat => cat.questions.length > 0);

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-8 font-sans text-slate-800 text-left">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center mx-auto font-bold shadow-2xs">
            <HelpCircle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#B71C1C] bg-red-50 border border-red-100 px-3 py-1 rounded-full">
              KARVIYAM HELP CENTER
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 uppercase tracking-tight mt-2">
              Frequently Asked Questions
            </h1>
            <p className="text-slate-600 text-sm max-w-xl mx-auto mt-1 font-medium">
              Everything you need to know about shopping, shipping, returns, and orders on Karviyam.
            </p>
          </div>

          {/* Search Input */}
          <div className="max-w-md mx-auto pt-2">
            <div className="relative">
              <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search questions e.g. return, tracking, refund..."
                className="w-full bg-slate-50 border border-slate-200 text-sm pl-11 pr-4 py-3 rounded-2xl outline-none focus:border-[#B71C1C] transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Custom Admin FAQ Content if configured */}
        {customFaqHtml && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="prose prose-slate max-w-none text-sm" dangerouslySetInnerHTML={{ __html: customFaqHtml }} />
          </div>
        )}

        {/* FAQ Accordions */}
        <div className="space-y-6">
          {filteredFaqs.map((cat, catIdx) => (
            <div key={catIdx} className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
              <h3 className="font-display font-black text-base uppercase text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <span className="text-[#B71C1C]">●</span>
                <span>{cat.category}</span>
              </h3>

              <div className="space-y-3">
                {cat.questions.map((qItem, qIdx) => {
                  const faqId = `${catIdx}-${qIdx}`;
                  const isOpen = openFaqId === faqId;

                  return (
                    <div
                      key={faqId}
                      className="border border-slate-100 rounded-2xl overflow-hidden transition-all bg-slate-50/50 hover:bg-slate-50"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(faqId)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-sm text-slate-900 cursor-pointer"
                      >
                        <span className="pr-4">{qItem.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#B71C1C] shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100/80 pt-3">
                          {qItem.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support Banner */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-3xl border border-red-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-display font-black text-base text-slate-900 uppercase">Still have questions?</h4>
            <p className="text-xs text-slate-600 font-medium">Our customer care team is available 24/7 to assist you.</p>
          </div>
          <Link
            to="/contact"
            className="bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-2xl shadow-md transition-all shrink-0 inline-flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>CONTACT CUSTOMER SUPPORT</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
