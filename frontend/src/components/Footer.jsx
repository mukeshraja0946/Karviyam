import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, RotateCcw, ShieldCheck, Tag, Headphones, Mail, Phone, MapPin } from 'lucide-react';
import api from '../utils/api';

export default function Footer() {
  const [customLogo, setCustomLogo] = useState(() => localStorage.getItem('karviyam_logo') || '');
  
  const [footerData, setFooterData] = useState(() => ({
    about: localStorage.getItem('karviyam_footer_about') || 'Karviyam is a premium marketplace destination for high-street streetwear, 925 sterling silver jewellery, luxury kicks, and lifestyle products.',
    address: localStorage.getItem('karviyam_address') || 'Karviyam Tower, Park Avenue, Chennai, Tamil Nadu 600001',
    phone: localStorage.getItem('karviyam_support_phone') || '+91 98765 43210',
    email: localStorage.getItem('karviyam_support_email') || 'support@karviyam.com',
    b1Title: localStorage.getItem('karviyam_badge1Title') || 'Free Delivery',
    b1Sub: localStorage.getItem('karviyam_badge1Sub') || 'On orders above ₹499',
    b2Title: localStorage.getItem('karviyam_badge2Title') || 'Easy Returns',
    b2Sub: localStorage.getItem('karviyam_badge2Sub') || '30 days return policy',
    b3Title: localStorage.getItem('karviyam_badge3Title') || 'Secure Payments',
    b3Sub: localStorage.getItem('karviyam_badge3Sub') || '100% secure checkout',
    b4Title: localStorage.getItem('karviyam_badge4Title') || 'Best Price Guarantee',
    b4Sub: localStorage.getItem('karviyam_badge4Sub') || 'Unmatched value',
    b5Title: localStorage.getItem('karviyam_badge5Title') || '24/7 Support',
    b5Sub: localStorage.getItem('karviyam_badge5Sub') || 'Dedicated assistance',
  }));

  useEffect(() => {
    fetchPublicSettings();
    window.addEventListener('storage', fetchPublicSettings);
    window.addEventListener('karviyam_logo_updated', fetchPublicSettings);
    window.addEventListener('karviyam_footer_updated', fetchPublicSettings);
    return () => {
      window.removeEventListener('storage', fetchPublicSettings);
      window.removeEventListener('karviyam_logo_updated', fetchPublicSettings);
      window.removeEventListener('karviyam_footer_updated', fetchPublicSettings);
    };
  }, []);

  const fetchPublicSettings = async () => {
    try {
      const res = await api.get('/footer-settings').catch(() => api.get('/settings/footer')).catch(() => api.get('/settings'));
      const apiData = res.data ? res.data : res;
      const dataMap = apiData.data !== undefined ? apiData.data : apiData;

      if (dataMap && typeof dataMap === 'object') {
        const logo = dataMap.logoUrl || dataMap.logo;
        if (logo) {
          setCustomLogo(logo);
          localStorage.setItem('karviyam_logo', logo);
        }

        const aboutText = dataMap.about || dataMap.footerAbout;
        let addrText = dataMap.address || dataMap.registeredAddress;
        if (!addrText || addrText === 'ABC00123') {
          addrText = 'Karviyam Tower, Park Avenue, Chennai, Tamil Nadu 600001';
        }
        const phoneText = dataMap.phone || dataMap.supportPhone;
        const emailText = dataMap.email || dataMap.supportEmail;
        const copyText = dataMap.copyright || dataMap.copyrightText;

        if (aboutText) localStorage.setItem('karviyam_footer_about', aboutText);
        if (addrText) localStorage.setItem('karviyam_address', addrText);
        if (phoneText) localStorage.setItem('karviyam_support_phone', phoneText);
        if (emailText) localStorage.setItem('karviyam_support_email', emailText);

        setFooterData(prev => ({
          ...prev,
          about: aboutText || prev.about,
          address: addrText || prev.address,
          phone: phoneText || prev.phone,
          email: emailText || prev.email,
          copyright: copyText || prev.copyright || '© 2026 Karviyam E-Commerce Platform. All Rights Reserved. Built for Enterprise Performance.',
          b1Title: dataMap.b1Title || dataMap.badge1Title || prev.b1Title,
          b1Sub: dataMap.b1Sub || dataMap.badge1Sub || prev.b1Sub,
          b2Title: dataMap.b2Title || dataMap.badge2Title || prev.b2Title,
          b2Sub: dataMap.b2Sub || dataMap.badge2Sub || prev.b2Sub,
          b3Title: dataMap.b3Title || dataMap.badge3Title || prev.b3Title,
          b3Sub: dataMap.b3Sub || dataMap.badge3Sub || prev.b3Sub,
          b4Title: dataMap.b4Title || dataMap.badge4Title || prev.b4Title,
          b4Sub: dataMap.b4Sub || dataMap.badge4Sub || prev.b4Sub,
          b5Title: dataMap.b5Title || dataMap.badge5Title || prev.b5Title,
          b5Sub: dataMap.b5Sub || dataMap.badge5Sub || prev.b5Sub,
        }));
      }
    } catch (e) {
      console.error('Failed to load database footer settings:', e);
    }
  };

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-700">
      
      {/* Top Value Proposition Trust Badges (Dynamic Admin Content) */}
      <div className="bg-slate-50 border-b border-slate-200 py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{footerData.b1Title}</h4>
              <p className="text-[10px] text-slate-500">{footerData.b1Sub}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{footerData.b2Title}</h4>
              <p className="text-[10px] text-slate-500">{footerData.b2Sub}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{footerData.b3Title}</h4>
              <p className="text-[10px] text-slate-500">{footerData.b3Sub}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{footerData.b4Title}</h4>
              <p className="text-[10px] text-slate-500">{footerData.b4Sub}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{footerData.b5Title}</h4>
              <p className="text-[10px] text-slate-500">{footerData.b5Sub}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-8 md:py-12 grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
        
        {/* Brand Column (Dynamic Admin Content) */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2.5">
            {customLogo ? (
              <img src={customLogo} alt="Karviyam" className="h-10 w-auto object-contain max-w-[200px]" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D32F2F] to-[#B71C1C] text-white flex items-center justify-center font-black shadow-md">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6zm-4 9.5c0-2 4-3.1 4-3.1s4 1.1 4 3.1V16H8v-0.5z"/>
                  </svg>
                </div>
                <span className="font-display font-black text-xl tracking-tight text-[#B71C1C]">
                  KARVIYAM
                </span>
              </div>
            )}
          </Link>
          
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            {footerData.about}
          </p>

          <div className="text-xs space-y-2 text-slate-600 font-medium pt-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#B71C1C] shrink-0" />
              <span>{footerData.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#B71C1C] shrink-0" />
              <span>{footerData.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#B71C1C] shrink-0" />
              <span>{footerData.email}</span>
            </div>
          </div>
        </div>

        {/* Categories Link Column & Customer Care Column Side-by-Side on Mobile */}
        <div className="grid grid-cols-2 gap-6 col-span-1 md:col-span-2">
          {/* Categories Link Column */}
          <div>
            <h4 className="font-display font-bold text-sm text-slate-900 mb-4 uppercase tracking-wider">Categories</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-500">
              <li><Link to="/shop?category=Clothing" className="hover:text-[#B71C1C] transition-colors">Oversized T-Shirts</Link></li>
              <li><Link to="/shop?category=Clothing" className="hover:text-[#B71C1C] transition-colors">Casual Linen Shirts</Link></li>
              <li><Link to="/shop?category=Footwear" className="hover:text-[#B71C1C] transition-colors">Apex Stealth Sneakers</Link></li>
              <li><Link to="/shop?category=Jewellery" className="hover:text-[#B71C1C] transition-colors">925 Silver Jewellery</Link></li>
              <li><Link to="/shop?category=Clothing" className="hover:text-[#B71C1C] transition-colors">Anime Graphic Hoodies</Link></li>
            </ul>
          </div>

          {/* Customer Care Column */}
          <div>
            <h4 className="font-display font-bold text-sm text-slate-900 mb-4 uppercase tracking-wider">Customer Care</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-500">
              <li><Link to="/profile" className="hover:text-[#B71C1C] transition-colors">Track My Order</Link></li>
              <li><Link to="/contact" className="hover:text-[#B71C1C] transition-colors">Help Center & FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-[#B71C1C] transition-colors">Return Policy</Link></li>
              <li><Link to="/contact" className="hover:text-[#B71C1C] transition-colors">Terms of Service</Link></li>
              <li><Link to="/contact" className="hover:text-[#B71C1C] transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div>
          <h4 className="font-display font-bold text-sm text-slate-900 mb-4 uppercase tracking-wider">Stay Updated</h4>
          <p className="text-xs text-slate-500 mb-3">
            Subscribe to get special drop alerts, VIP coupons & discounts.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full bg-slate-100 border border-slate-200 text-xs px-4 py-3 rounded-xl outline-none focus:border-[#B71C1C] focus:bg-white transition-all font-medium"
            />
            <button
              type="submit"
              className="w-full bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-xs transition-colors"
            >
              Subscribe Now
            </button>
          </form>
        </div>

      </div>

      {/* Copyright Bar */}
      <div className="bg-slate-50 border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 font-medium">
        © 2026 Karviyam E-Commerce Platform. All Rights Reserved. Built for Enterprise Performance.
      </div>
    </footer>
  );
}
