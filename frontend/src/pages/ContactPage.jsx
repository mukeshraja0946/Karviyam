import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { contactService } from '../services/contactService';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  // Dynamic Store Settings from Admin Settings
  const [storeAddress, setStoreAddress] = useState(() => localStorage.getItem('karviyam_address') || 'Karviyam HQ, Main Street, India');
  const [storeEmail, setStoreEmail] = useState(() => localStorage.getItem('karviyam_support_email') || 'vanakkam@karviyam.com');
  const [storePhone, setStorePhone] = useState(() => localStorage.getItem('karviyam_support_phone') || '+91 98765 43210');

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setStoreAddress(localStorage.getItem('karviyam_address') || 'Karviyam HQ, Main Street, India');
      setStoreEmail(localStorage.getItem('karviyam_support_email') || 'vanakkam@karviyam.com');
      setStorePhone(localStorage.getItem('karviyam_support_phone') || '+91 98765 43210');
    };

    window.addEventListener('storage', handleSettingsUpdate);
    window.addEventListener('karviyam_footer_updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('storage', handleSettingsUpdate);
      window.removeEventListener('karviyam_footer_updated', handleSettingsUpdate);
    };
  }, []);

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Full Name is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !formData.email.trim()) {
      errs.email = 'Email Address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.message || !formData.message.trim()) {
      errs.message = 'Message is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!validate()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    try {
      setLoading(true);
      toast.loading('Sending message...', { id: 'contact-toast' });
      
      const res = await contactService.submitContact(formData);
      
      if (res && res.success !== false) {
        toast.success('Message sent successfully! Our customer support team will respond shortly.', { id: 'contact-toast' });
        setFormData({ name: '', email: '', subject: '', message: '' });
        setErrors({});
        window.dispatchEvent(new window.Event('karviyam_contact_updated'));
      } else {
        throw new Error(res?.message || 'Unable to send message. Please try again.');
      }
    } catch (err) {
      console.error('Contact submission error:', err);
      toast.error('Unable to send message. Please try again.', { id: 'contact-toast' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto space-y-6">
      {/* Top Header Section */}
      <div className="text-center space-y-1">
        <span className="text-[#B71C1C] font-extrabold tracking-wider uppercase text-[11px]">
          Customer Support
        </span>
        <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
          Get In Touch With Karviyam
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          Have questions about your order, shipping, or custom jewellery sizing? Our customer care team is here 24/7 to assist you.
        </p>
      </div>

      {/* Info Cards (Compact Horizontal Row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs text-center flex flex-col items-center hover:border-red-200 hover:shadow-xs transition-all">
          <div className="w-10 h-10 bg-red-50 text-[#B71C1C] rounded-xl flex items-center justify-center mb-2.5">
            <Phone className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900">Call Us</h3>
          <p className="text-slate-500 text-[11px] mt-0.5 font-medium">Mon-Sat from 9am to 8pm</p>
          <a href={`tel:${storePhone.replace(/\s+/g, '')}`} className="text-[#B71C1C] font-extrabold text-xs sm:text-sm mt-1.5 hover:underline block leading-snug">
            {storePhone}
          </a>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs text-center flex flex-col items-center hover:border-red-200 hover:shadow-xs transition-all">
          <div className="w-10 h-10 bg-red-50 text-[#B71C1C] rounded-xl flex items-center justify-center mb-2.5">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900">Email Us</h3>
          <p className="text-slate-500 text-[11px] mt-0.5 font-medium">We respond within 24 hours</p>
          <a href={`mailto:${storeEmail}`} className="text-[#B71C1C] font-extrabold text-xs sm:text-sm mt-1.5 hover:underline block leading-snug">
            {storeEmail}
          </a>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs text-center flex flex-col items-center hover:border-red-200 hover:shadow-xs transition-all">
          <div className="w-10 h-10 bg-red-50 text-[#B71C1C] rounded-xl flex items-center justify-center mb-2.5">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900">Flagship Store & HQ</h3>
          <p className="text-slate-500 text-[11px] mt-0.5 font-medium">Official Business Address</p>
          <span className="text-[#B71C1C] font-extrabold text-xs sm:text-sm mt-1.5 leading-snug block">
            {storeAddress}
          </span>
        </div>
      </div>

      {/* Message Form Box */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
        <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <MessageSquare className="w-4 h-4 text-[#B71C1C]" /> Send Us A Message
        </h2>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-extrabold text-slate-700 text-xs mb-1">Full Name *</label>
              <input
                type="text"
                className={`w-full px-3.5 py-2.5 rounded-xl border ${errors.name ? 'border-red-500 bg-red-50/40' : 'border-slate-200 bg-slate-50'} text-slate-900 focus:bg-white focus:border-[#B71C1C] outline-none font-semibold text-xs transition-all`}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
              />
              {errors.name && <p className="text-red-600 text-[11px] mt-1 font-bold">{errors.name}</p>}
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 text-xs mb-1">Email Address *</label>
              <input
                type="email"
                className={`w-full px-3.5 py-2.5 rounded-xl border ${errors.email ? 'border-red-500 bg-red-50/40' : 'border-slate-200 bg-slate-50'} text-slate-900 focus:bg-white focus:border-[#B71C1C] outline-none font-semibold text-xs transition-all`}
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
              />
              {errors.email && <p className="text-red-600 text-[11px] mt-1 font-bold">{errors.email}</p>}
            </div>
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 text-xs mb-1">Subject</label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#B71C1C] outline-none font-semibold text-xs transition-all"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 text-xs mb-1">Message *</label>
            <textarea
              rows="3"
              className={`w-full px-3.5 py-2.5 rounded-xl border ${errors.message ? 'border-red-500 bg-red-50/40' : 'border-slate-200 bg-slate-50'} text-slate-900 focus:bg-white focus:border-[#B71C1C] outline-none font-semibold text-xs transition-all resize-y min-h-[90px]`}
              value={formData.message}
              onChange={(e) => {
                setFormData({ ...formData, message: e.target.value });
                if (errors.message) setErrors({ ...errors, message: null });
              }}
            ></textarea>
            {errors.message && <p className="text-red-600 text-[11px] mt-1 font-bold">{errors.message}</p>}
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-6 py-2.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
