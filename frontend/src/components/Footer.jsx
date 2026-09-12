import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Tag,
  Headphones,
  Mail,
  Phone,
  MapPin,
  Loader2,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { resolveImageUrl, isValidImageUrl } from '../utils/imageUtils';

export default function Footer() {
  const navigate = useNavigate();
  const [logoFailed, setLogoFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [footerConfig, setFooterConfig] = useState({
    footerEnabled: true,
    brandName: 'KARVIYAM',
    about: 'Karviyam is a premium marketplace destination for high-street streetwear, 925 sterling silver jewellery, luxury kicks, and lifestyle products.',
    address: 'Tamil Nadu, Salem, Attur, Gangavalli - 636105',
    phone: '+91 93443 30782',
    email: 'vanakkam@karviyam.com',
    logoUrl: '',
    copyright: '© 2026 Karviyam E-Commerce Platform. All Rights Reserved. Built for Enterprise Performance.',
    stayUpdatedTitle: 'STAY UPDATED',
    stayUpdatedDescription: 'Subscribe to get special drop alerts, VIP coupons & discounts.',
    newsletterEnabled: true,
    columns: [],
    socialLinks: {
      instagram: 'https://instagram.com/karviyam',
      facebook: 'https://facebook.com/karviyam',
      youtube: 'https://youtube.com/karviyam',
      whatsapp: 'https://wa.me/919344330782',
      twitter: 'https://twitter.com/karviyam'
    },
    b1Title: 'Free Delivery',
    b1Sub: 'On orders above ₹499',
    b2Title: 'Easy Returns',
    b2Sub: '30 days return policy',
    b3Title: 'Secure Payments',
    b3Sub: '100% secure checkout',
    b4Title: 'Best Price Guarantee',
    b4Sub: 'Unmatched value',
    b5Title: '24/7 Support',
    b5Sub: 'Dedicated assistance'
  });

  const [subEmail, setSubEmail] = useState('');
  const [subSubmitting, setSubSubmitting] = useState(false);

  const fetchFooterSettings = async () => {
    try {
      const res = await api.get('/footer-settings').catch(() => api.get('/settings/footer')).catch(() => null);
      const data = res?.data?.data || res?.data;

      if (data && typeof data === 'object') {
        setFooterConfig({
          footerEnabled: data.footerEnabled !== undefined ? Boolean(data.footerEnabled) : true,
          brandName: data.brandName || 'KARVIYAM',
          about: data.about || data.footerAbout || 'Karviyam is a premium marketplace destination for high-street streetwear, 925 sterling silver jewellery, luxury kicks, and lifestyle products.',
          address: data.address || data.registeredAddress || 'Tamil Nadu, Salem, Attur, Gangavalli - 636105',
          phone: data.phone || data.supportPhone || '+91 93443 30782',
          email: data.email || data.supportEmail || 'vanakkam@karviyam.com',
          logoUrl: data.logoUrl || data.logo || '',
          copyright: data.copyright || data.copyrightText || '© 2026 Karviyam E-Commerce Platform. All Rights Reserved. Built for Enterprise Performance.',
          stayUpdatedTitle: data.stayUpdatedTitle || 'STAY UPDATED',
          stayUpdatedDescription: data.stayUpdatedDescription || 'Subscribe to get special drop alerts, VIP coupons & discounts.',
          newsletterEnabled: data.newsletterEnabled !== undefined ? Boolean(data.newsletterEnabled) : true,
          columns: Array.isArray(data.columns) ? data.columns : [],
          socialLinks: (data.socialLinks && typeof data.socialLinks === 'object') ? data.socialLinks : {},
          b1Title: data.b1Title || data.badge1Title || 'Free Delivery',
          b1Sub: data.b1Sub || data.badge1Sub || 'On orders above ₹499',
          b2Title: data.b2Title || data.badge2Title || 'Easy Returns',
          b2Sub: data.b2Sub || data.badge2Sub || '30 days return policy',
          b3Title: data.b3Title || data.badge3Title || 'Secure Payments',
          b3Sub: data.b3Sub || data.badge3Sub || '100% secure checkout',
          b4Title: data.b4Title || data.badge4Title || 'Best Price Guarantee',
          b4Sub: data.b4Sub || data.badge4Sub || 'Unmatched value',
          b5Title: data.b5Title || data.badge5Title || '24/7 Support',
          b5Sub: data.b5Sub || data.badge5Sub || 'Dedicated assistance'
        });
      }
    } catch (e) {
      console.error('Failed to load footer settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFooterSettings();

    const handleSync = () => {
      fetchFooterSettings();
      setLogoFailed(false);
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('karviyam_logo_updated', handleSync);
    window.addEventListener('karviyam_footer_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('karviyam_logo_updated', handleSync);
      window.removeEventListener('karviyam_footer_updated', handleSync);
    };
  }, []);

  if (footerConfig.footerEnabled === false) return null;

  const activeColumns = (footerConfig.columns || [])
    .filter(col => col && col.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const social = footerConfig.socialLinks || {};

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-700 font-sans">
      
      {/* Top Value Proposition Trust Badges */}
      <div className="bg-slate-50 border-b border-slate-200 py-3.5 sm:py-6 px-3 sm:px-8">
        <div className="max-w-[1640px] w-full mx-auto px-2 sm:px-4 grid grid-cols-2 md:grid-cols-5 gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{footerConfig.b1Title}</h4>
              <p className="text-[10px] text-slate-500">{footerConfig.b1Sub}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{footerConfig.b2Title}</h4>
              <p className="text-[10px] text-slate-500">{footerConfig.b2Sub}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{footerConfig.b3Title}</h4>
              <p className="text-[10px] text-slate-500">{footerConfig.b3Sub}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{footerConfig.b4Title}</h4>
              <p className="text-[10px] text-slate-500">{footerConfig.b4Sub}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{footerConfig.b5Title}</h4>
              <p className="text-[10px] text-slate-500">{footerConfig.b5Sub}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-[1640px] w-full mx-auto px-4 sm:px-8 xl:px-12 pt-6 pb-8 md:py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Brand Column */}
        <div className="md:col-span-4 space-y-4">
          <Link to="/" className="inline-flex items-center gap-2.5">
            {footerConfig.logoUrl && isValidImageUrl(footerConfig.logoUrl) && !logoFailed ? (
              <img
                src={resolveImageUrl(footerConfig.logoUrl)}
                alt={footerConfig.brandName || 'Karviyam'}
                onError={() => setLogoFailed(true)}
                className="h-9 sm:h-10 w-auto object-contain max-w-[200px]"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D32F2F] to-[#B71C1C] text-white flex items-center justify-center font-black shadow-md">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6zm-4 9.5c0-2 4-3.1 4-3.1s4 1.1 4 3.1V16H8v-0.5z"/>
                  </svg>
                </div>
                <span className="font-display font-black text-xl tracking-tight text-[#B71C1C] uppercase">
                  {footerConfig.brandName || 'KARVIYAM'}
                </span>
              </div>
            )}
          </Link>
          
          <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-md">
            {footerConfig.about}
          </p>

          <div className="text-xs space-y-2 text-slate-600 font-medium pt-1">
            {footerConfig.address && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#B71C1C] shrink-0 mt-0.5" />
                <span className="leading-snug">{footerConfig.address}</span>
              </div>
            )}
            {footerConfig.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#B71C1C] shrink-0" />
                <a href={`tel:${footerConfig.phone}`} className="hover:text-[#B71C1C] transition-colors">{footerConfig.phone}</a>
              </div>
            )}
            {footerConfig.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#B71C1C] shrink-0" />
                <a href={`mailto:${footerConfig.email}`} className="hover:text-[#B71C1C] transition-colors">{footerConfig.email}</a>
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            {social.instagram && (
              <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#B71C1C] hover:text-white text-slate-600 flex items-center justify-center transition-colors shadow-2xs" title="Instagram">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            )}
            {social.facebook && (
              <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#B71C1C] hover:text-white text-slate-600 flex items-center justify-center transition-colors shadow-2xs" title="Facebook">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.592 9 4.415V8z"/></svg>
              </a>
            )}
            {social.youtube && (
              <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#B71C1C] hover:text-white text-slate-600 flex items-center justify-center transition-colors shadow-2xs" title="YouTube">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            )}
            {social.whatsapp && (
              <a href={social.whatsapp} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#B71C1C] hover:text-white text-slate-600 flex items-center justify-center transition-colors shadow-2xs" title="WhatsApp">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.146 4.195 4.316-1.134z"/></svg>
              </a>
            )}
            {social.twitter && (
              <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#B71C1C] hover:text-white text-slate-600 flex items-center justify-center transition-colors shadow-2xs" title="Twitter / X">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            )}
          </div>
        </div>

        {/* Dynamic Column Columns */}
        <div className="md:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-6">
          {activeColumns.map((col) => {
            const activeLinks = (col.links || [])
              .filter(l => l && l.enabled !== false)
              .sort((a, b) => (a.order || 0) - (b.order || 0));

            return (
              <div key={col.id || col.title} className="space-y-3">
                <h4 className="font-display font-bold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  {col.title}
                </h4>
                <ul className="space-y-2 text-xs font-medium text-slate-500">
                  {activeLinks.map((link) => {
                    const dest = link.destination || '#';
                    const isExternal = link.openNewTab || dest.startsWith('http://') || dest.startsWith('https://');
                    
                    return (
                      <li key={link.id || link.title}>
                        {isExternal ? (
                          <a
                            href={dest}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#B71C1C] transition-colors inline-flex items-center gap-1"
                          >
                            <span>{link.title}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        ) : (
                          <Link
                            to={dest}
                            className="hover:text-[#B71C1C] transition-colors block"
                          >
                            {link.title}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Newsletter Subscription Column */}
        {footerConfig.newsletterEnabled !== false && (
          <div className="md:col-span-3 space-y-3 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
            <h4 className="font-display font-bold text-xs text-slate-900 uppercase tracking-wider">
              {footerConfig.stayUpdatedTitle || 'STAY UPDATED'}
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {footerConfig.stayUpdatedDescription || 'Subscribe to get special drop alerts, VIP coupons & discounts.'}
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (subSubmitting) return;

                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!subEmail || !emailPattern.test(subEmail.trim())) {
                  toast.error('Please enter a valid email address.');
                  return;
                }

                setSubSubmitting(true);
                toast.loading('Initiating subscription...', { id: 'footer-sub-toast' });

                try {
                  const res = await api.post('/subscriptions/subscribe', { email: subEmail.trim() });
                  const data = res.data?.data || res.data;

                  if (res.data?.success && data?.subscriptionId) {
                    toast.success('Redirecting to Subscription Checkout...', { id: 'footer-sub-toast' });
                    setSubEmail('');
                    navigate(`/subscribe/payment?id=${data.subscriptionId}`);
                  } else {
                    toast.error(res.data?.message || 'Subscription failed. Please try again.', { id: 'footer-sub-toast' });
                  }
                } catch (err) {
                  const msg = err.response?.data?.message || 'Unable to complete subscription request.';
                  toast.error(msg, { id: 'footer-sub-toast' });
                } finally {
                  setSubSubmitting(false);
                }
              }}
              className="space-y-2 pt-1"
            >
              <input
                type="email"
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
                placeholder="Enter your email address"
                disabled={subSubmitting}
                className="w-full bg-white border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#B71C1C] transition-all font-medium disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={subSubmitting}
                className="w-full bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {subSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>SUBSCRIBE NOW</span>
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Bottom Copyright Bar */}
      <div className="bg-slate-50 border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 font-medium">
        {footerConfig.copyright}
      </div>
    </footer>
  );
}
