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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const res = await contactService.submitContact(formData);
      toast.success(res?.message || 'Thank you! Your message has been sent to vanakkam@karviyam.com');

      // Direct mailto trigger to ensure email client opens with pre-filled details to vanakkam@karviyam.com
      const mailtoUrl = `mailto:vanakkam@karviyam.com?subject=${encodeURIComponent(formData.subject || 'Message from ' + formData.name)}&body=${encodeURIComponent(formData.message + '\n\nFrom: ' + formData.name + ' (' + formData.email + ')')}`;
      window.open(mailtoUrl, '_blank');

      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error('Sending via email client to vanakkam@karviyam.com...');
      const mailtoUrl = `mailto:vanakkam@karviyam.com?subject=${encodeURIComponent(formData.subject || 'Message from ' + formData.name)}&body=${encodeURIComponent(formData.message + '\n\nFrom: ' + formData.name + ' (' + formData.email + ')')}`;
      window.open(mailtoUrl, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-12 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-2">
        <span className="text-[#B71C1C] font-extrabold tracking-widest uppercase text-xs">Customer Support</span>
        <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900">Get In Touch With Karviyam</h1>
        <p className="text-slate-600 text-sm max-w-2xl mx-auto">
          Have questions about your order, shipping, or custom jewellery sizing? Our customer care team is here 24/7 to assist you.
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs text-center flex flex-col items-center hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-red-50 text-[#B71C1C] rounded-2xl flex items-center justify-center mb-4">
            <Phone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Call Us</h3>
          <p className="text-slate-500 text-xs mt-1 font-medium">Mon-Sat from 9am to 8pm</p>
          <a href={`tel:${storePhone.replace(/\s+/g, '')}`} className="text-[#B71C1C] font-extrabold text-sm mt-3 hover:underline">
            {storePhone}
          </a>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs text-center flex flex-col items-center hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-red-50 text-[#B71C1C] rounded-2xl flex items-center justify-center mb-4">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Email Us</h3>
          <p className="text-slate-500 text-xs mt-1 font-medium">We respond within 24 hours</p>
          <a href="mailto:vanakkam@karviyam.com" className="text-[#B71C1C] font-extrabold text-sm mt-3 hover:underline">
            vanakkam@karviyam.com
          </a>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs text-center flex flex-col items-center hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-red-50 text-[#B71C1C] rounded-2xl flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Flagship Store & HQ</h3>
          <p className="text-slate-500 text-xs mt-1 font-medium">Official Business Address</p>
          <span className="text-[#B71C1C] font-extrabold text-sm mt-3 leading-snug">
            {storeAddress}
          </span>
        </div>
      </div>

      {/* Message Form Box */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#B71C1C]" /> Send Us A Message
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-2">Full Name *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#B71C1C] outline-none font-medium transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-2">Email Address *</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#B71C1C] outline-none font-medium transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-2">Subject</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#B71C1C] outline-none font-medium transition-all"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-2">Message *</label>
            <textarea
              rows="5"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#B71C1C] outline-none font-medium transition-all"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-8 py-3.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
