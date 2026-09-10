import React, { useState, useEffect } from 'react';
import { Globe, Save, RefreshCw, CheckCircle2, Shield, Phone, Mail, MapPin, Info } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminFooterPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    about: '',
    address: '',
    phone: '',
    email: '',
    copyright: '',
    b1Title: 'Free Delivery',
    b1Sub: 'On orders above ₹499',
    b2Title: 'Easy Returns',
    b2Sub: '30 days return policy',
    b3Title: 'Secure Payments',
    b3Sub: '100% secure checkout',
    b4Title: 'Best Price Guarantee',
    b4Sub: 'Unmatched value',
    b5Title: '24/7 Support',
    b5Sub: 'Dedicated assistance',
  });

  const fetchFooter = async () => {
    setLoading(true);
    try {
      const res = await api.get('/footer-settings');
      const data = res.data?.data || res.data || {};
      setFormData(prev => ({
        ...prev,
        about: data.about || data.footerAbout || prev.about,
        address: data.address || data.registeredAddress || prev.address,
        phone: data.phone || data.supportPhone || prev.phone,
        email: data.email || data.supportEmail || prev.email,
        copyright: data.copyright || data.copyrightText || prev.copyright,
        b1Title: data.b1Title || data.badge1Title || prev.b1Title,
        b1Sub: data.b1Sub || data.badge1Sub || prev.b1Sub,
        b2Title: data.b2Title || data.badge2Title || prev.b2Title,
        b2Sub: data.b2Sub || data.badge2Sub || prev.b2Sub,
        b3Title: data.b3Title || data.badge3Title || prev.b3Title,
        b3Sub: data.b3Sub || data.badge3Sub || prev.b3Sub,
        b4Title: data.b4Title || data.badge4Title || prev.b4Title,
        b4Sub: data.b4Sub || data.badge4Sub || prev.b4Sub,
        b5Title: data.b5Title || data.badge5Title || prev.b5Title,
        b5Sub: data.b5Sub || data.badge5Sub || prev.b5Sub,
      }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load footer settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFooter();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/admin/settings', {
        footerAbout: formData.about,
        address: formData.address,
        supportPhone: formData.phone,
        supportEmail: formData.email,
        copyrightText: formData.copyright,
        badge1Title: formData.b1Title,
        badge1Sub: formData.b1Sub,
        badge2Title: formData.b2Title,
        badge2Sub: formData.b2Sub,
        badge3Title: formData.b3Title,
        badge3Sub: formData.b3Sub,
        badge4Title: formData.b4Title,
        badge4Sub: formData.b4Sub,
        badge5Title: formData.b5Title,
        badge5Sub: formData.b5Sub,
      });

      if (res.data?.success || res.status === 200) {
        toast.success('Footer settings saved & updated on store front!');
        window.dispatchEvent(new Event('karviyam_footer_updated'));
        window.dispatchEvent(new Event('storage'));
      } else {
        toast.error(res.data?.message || 'Failed to save footer settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Unable to save footer settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-[#B71C1C]" />
            <span>Storefront Footer Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage customer footer text, contact information, trust badges, and legal information in real time.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Brand & About Column */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-display font-bold text-sm text-slate-900 border-b pb-3">Brand Information & Contact Details</h3>
          
          <div>
            <label className="block font-bold text-slate-700 mb-1">About Store / Footer Description</label>
            <textarea
              rows={3}
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#B71C1C]"
              placeholder="Karviyam is a premium marketplace destination..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#B71C1C] font-semibold"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Support Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#B71C1C] font-semibold"
                placeholder="support@karviyam.com"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Registered Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#B71C1C] font-semibold"
                placeholder="Karviyam Tower, Park Avenue, Chennai..."
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Copyright Notice Text</label>
            <input
              type="text"
              value={formData.copyright}
              onChange={(e) => setFormData({ ...formData, copyright: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#B71C1C]"
              placeholder="© 2026 Karviyam E-Commerce Platform. All Rights Reserved."
            />
          </div>
        </div>

        {/* Top Trust Badges */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-display font-bold text-sm text-slate-900 border-b pb-3">Trust Badges (5 Items)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="font-bold text-slate-900">Badge 1</span>
              <input
                type="text"
                value={formData.b1Title}
                onChange={(e) => setFormData({ ...formData, b1Title: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                placeholder="Free Delivery"
              />
              <input
                type="text"
                value={formData.b1Sub}
                onChange={(e) => setFormData({ ...formData, b1Sub: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px]"
                placeholder="On orders above ₹499"
              />
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="font-bold text-slate-900">Badge 2</span>
              <input
                type="text"
                value={formData.b2Title}
                onChange={(e) => setFormData({ ...formData, b2Title: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                placeholder="Easy Returns"
              />
              <input
                type="text"
                value={formData.b2Sub}
                onChange={(e) => setFormData({ ...formData, b2Sub: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px]"
                placeholder="30 days return policy"
              />
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="font-bold text-slate-900">Badge 3</span>
              <input
                type="text"
                value={formData.b3Title}
                onChange={(e) => setFormData({ ...formData, b3Title: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                placeholder="Secure Payments"
              />
              <input
                type="text"
                value={formData.b3Sub}
                onChange={(e) => setFormData({ ...formData, b3Sub: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px]"
                placeholder="100% secure checkout"
              />
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="font-bold text-slate-900">Badge 4</span>
              <input
                type="text"
                value={formData.b4Title}
                onChange={(e) => setFormData({ ...formData, b4Title: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                placeholder="Best Price Guarantee"
              />
              <input
                type="text"
                value={formData.b4Sub}
                onChange={(e) => setFormData({ ...formData, b4Sub: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px]"
                placeholder="Unmatched value"
              />
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="font-bold text-slate-900">Badge 5</span>
              <input
                type="text"
                value={formData.b5Title}
                onChange={(e) => setFormData({ ...formData, b5Title: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                placeholder="24/7 Support"
              />
              <input
                type="text"
                value={formData.b5Sub}
                onChange={(e) => setFormData({ ...formData, b5Sub: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px]"
                placeholder="Dedicated assistance"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Footer Settings</span>
          </button>
        </div>

      </form>
    </div>
  );
}
