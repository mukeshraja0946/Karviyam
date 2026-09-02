import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  Info,
  Sparkles,
  Palette
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { resolveImageUrl } from '../utils/imageUtils';
import ImageUploadCropperModal from '../components/ImageUploadCropperModal';

export default function AdminRightSidebarPromoCardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cropperFile, setCropperFile] = useState(null);

  const [formData, setFormData] = useState({
    enabled: true,
    badge: 'NEW ARRIVALS',
    title: 'Fresh Styles',
    description: 'Just Landed!',
    buttonText: 'SHOP NOW',
    link: '/new-arrivals',
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600',
    bgColor: '#434343',
    textColor: '#FFFFFF'
  });

  useEffect(() => {
    fetchPromoCard();
  }, []);

  const fetchPromoCard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/right-sidebar-promo-card').catch(() => null);
      const apiData = res?.data ? res.data : res;
      const data = apiData?.data || apiData;
      if (data && typeof data === 'object') {
        setFormData({
          enabled: data.enabled !== false,
          badge: data.badge || 'NEW ARRIVALS',
          title: data.title || 'Fresh Styles',
          description: data.description || 'Just Landed!',
          buttonText: data.buttonText || 'SHOP NOW',
          link: data.link || '/new-arrivals',
          imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600',
          bgColor: data.bgColor || '#434343',
          textColor: data.textColor || '#FFFFFF'
        });
        try {
          localStorage.setItem('karviyam_right_sidebar_promo_card', JSON.stringify(data));
        } catch (e) {}
      }
    } catch (e) {
      toast.error('Failed to load right sidebar promotional card config');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCropperFile(file);
      e.target.value = '';
    }
  };

  const handleCroppedUpload = async (blob) => {
    const file = new File([blob], `sidebar_promo_${Date.now()}.png`, { type: 'image/png' });
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      const res = await api.post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data.imageUrl || res.data.url || res.data.path;
      setFormData(prev => ({ ...prev, imageUrl: url }));
      toast.success('Image uploaded successfully');
    } catch (e) {
      toast.error('Failed to upload image');
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        enabled: formData.enabled,
        badge: formData.badge,
        title: formData.title,
        description: formData.description,
        buttonText: formData.buttonText,
        link: formData.link,
        imageUrl: formData.imageUrl,
        bgColor: formData.bgColor,
        textColor: formData.textColor
      };

      await api.put('/right-sidebar-promo-card', payload);
      try {
        localStorage.setItem('karviyam_right_sidebar_promo_card', JSON.stringify(payload));
      } catch (e) {}

      window.dispatchEvent(new Event('karviyam_right_sidebar_promo_card_updated'));
      window.dispatchEvent(new Event('karviyam_homepage_sections_updated'));

      toast.success('Right sidebar promotional card updated successfully!');
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#B71C1C] animate-spin" />
        <p className="text-xs text-slate-500 font-bold">Loading promotional card configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Admin Panel – Right Sidebar Promotional Card
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure the medium ad card in the right sidebar displayed above the Premium Collection card.
          </p>
        </div>

        <Link
          to="/admin"
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main 3-Column Configuration Canvas */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Controls (col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Enable Toggle */}
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="font-extrabold text-xs text-slate-900">Enable Promotional Card</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B71C1C]" />
            </label>
          </div>

          {/* Badge / Label */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-extrabold text-xs text-slate-800">Badge / Label</label>
              <span className="text-[10px] text-slate-400 font-bold">{formData.badge.length} / 30</span>
            </div>
            <input
              type="text"
              maxLength={30}
              value={formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
              placeholder="NEW ARRIVALS"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 focus:outline-none focus:border-[#B71C1C]"
            />
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-extrabold text-xs text-slate-800">Title</label>
              <span className="text-[10px] text-slate-400 font-bold">{formData.title.length} / 60</span>
            </div>
            <input
              type="text"
              maxLength={60}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Fresh Styles"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 focus:outline-none focus:border-[#B71C1C]"
            />
          </div>

          {/* Description / Sub text */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-extrabold text-xs text-slate-800">Description / Sub text</label>
              <span className="text-[10px] text-slate-400 font-bold">{formData.description.length} / 100</span>
            </div>
            <input
              type="text"
              maxLength={100}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Just Landed!"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#B71C1C]"
            />
          </div>

          {/* CTA Button Text */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-extrabold text-xs text-slate-800">CTA Button Text</label>
              <span className="text-[10px] text-slate-400 font-bold">{formData.buttonText.length} / 20</span>
            </div>
            <input
              type="text"
              maxLength={20}
              value={formData.buttonText}
              onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
              placeholder="SHOP NOW"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 focus:outline-none focus:border-[#B71C1C]"
            />
          </div>

          {/* CTA Link */}
          <div>
            <label className="font-extrabold text-xs text-slate-800 block mb-1">CTA Link (URL / Page)</label>
            <input
              type="text"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="/new-arrivals"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 focus:outline-none focus:border-[#B71C1C]"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Enter URL or select a page</span>
          </div>

        </div>

        {/* Middle Column: Card Image & Colors (col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          
          <label className="font-extrabold text-xs text-slate-800 block">Card Image</label>

          {/* Card Image Upload & Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            
            {/* Card Image Cover Box */}
            <div
              className="relative w-full h-[165px] rounded-2xl overflow-hidden shadow-md flex items-center border border-slate-300/80 bg-slate-900"
            >
              {/* 100% Full Background Cover Image */}
              <img
                src={resolveImageUrl(formData.imageUrl)}
                alt="Card Model"
                className="absolute inset-0 w-full h-full object-cover object-center"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600';
                }}
              />

              {/* Gradient overlay for left text readability */}
              <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                  background: `linear-gradient(to right, ${formData.bgColor || '#000000'}F2 0%, ${formData.bgColor || '#000000'}A6 50%, transparent 100%)`
                }}
              />

              {/* Left Text */}
              <div className="z-20 text-left space-y-1 p-3.5 w-[65%]" style={{ color: formData.textColor || '#FFFFFF' }}>
                <span className="text-[9.5px] font-black uppercase tracking-widest block opacity-95 drop-shadow-sm truncate">
                  {formData.badge || 'NEW ARRIVALS'}
                </span>
                <h4 className="font-display font-black text-sm leading-tight uppercase line-clamp-2 drop-shadow-sm">
                  {formData.title || 'Fresh Styles'}
                </h4>
                <p className="text-[10.5px] opacity-90 font-medium truncate drop-shadow-sm">
                  {formData.description || 'Just Landed!'}
                </p>
                <div className="pt-2">
                  <span className="inline-block bg-white text-slate-900 font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg shadow-sm">
                    {formData.buttonText || 'SHOP NOW'}
                  </span>
                </div>
              </div>

              {formData.imageUrl && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, imageUrl: '' })}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/90 text-white hover:bg-red-700 cursor-pointer shadow-md z-30 transition-transform hover:scale-105"
                  title="Remove Image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Direct Image Upload & URL input */}
            <div className="space-y-2">
              <label className="w-full py-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl font-extrabold text-xs text-slate-800 flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors">
                <Upload className="w-4 h-4 text-[#B71C1C]" />
                <span>Upload / Change Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      const base64Url = event.target.result;
                      if (base64Url) {
                        setFormData(prev => ({ ...prev, imageUrl: base64Url }));
                      }

                      try {
                        const formDataUpload = new FormData();
                        formDataUpload.append('image', file);

                        const res = await api.post('/upload', formDataUpload, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        }).catch(() => null);

                        const apiRes = res?.data ? res.data : res;
                        const dataObj = apiRes?.data || apiRes || {};
                        const serverUrl = dataObj.url || dataObj.imageUrl || dataObj.path || dataObj.fileUrl;

                        if (serverUrl) {
                          setFormData(prev => ({ ...prev, imageUrl: serverUrl }));
                          toast.success('Image updated successfully!');
                        } else {
                          toast.success('Image selected!');
                        }
                      } catch (err) {
                        toast.success('Image preview updated!');
                      }
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>

              <div>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="Or paste Image URL (e.g. https://...)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#B71C1C]"
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-medium text-center">
              Recommended size: 600x300px (PNG/JPG)<br />
              PNG with transparency is supported
            </p>
          </div>

          {/* Card Background Color */}
          <div>
            <label className="font-extrabold text-xs text-slate-800 block mb-1">Card Background (optional)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.bgColor || '#434343'}
                onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={formData.bgColor}
                onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Text Color */}
          <div>
            <label className="font-extrabold text-xs text-slate-800 block mb-1">Text Color (optional)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.textColor || '#FFFFFF'}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
              />
            </div>
          </div>

        </div>

        {/* Right Column: Live Interactive Preview (col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          <label className="font-extrabold text-xs text-slate-800 block">Preview</label>

          {/* Front-end Card Mockup Preview */}
          <div className="space-y-3">
            <div
              className={`w-full h-[165px] rounded-2xl flex items-center relative overflow-hidden shadow-md transition-all bg-slate-900 ${
                formData.enabled ? 'opacity-100' : 'opacity-40 grayscale'
              }`}
            >
              {/* 100% Full Background Cover Image */}
              <img
                src={resolveImageUrl(formData.imageUrl)}
                alt="Model Preview"
                className="absolute inset-0 w-full h-full object-cover object-center"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600';
                }}
              />

              {/* Gradient overlay for text readability */}
              <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                  background: `linear-gradient(to right, ${formData.bgColor || '#000000'}F2 0%, ${formData.bgColor || '#000000'}A6 50%, transparent 100%)`
                }}
              />

              {/* Text Content */}
              <div className="z-20 text-left space-y-1 p-4 w-[65%]" style={{ color: formData.textColor || '#FFFFFF' }}>
                <span className="text-[10px] font-black uppercase tracking-widest block opacity-95 drop-shadow-sm truncate">
                  {formData.badge || 'NEW ARRIVALS'}
                </span>
                <h3 className="font-display font-black text-base leading-tight uppercase line-clamp-2 drop-shadow-sm">
                  {formData.title || 'Fresh Styles'}
                </h3>
                <p className="text-[11px] opacity-90 font-medium truncate drop-shadow-sm">
                  {formData.description || 'Just Landed!'}
                </p>

                <div className="pt-2">
                  <span className="inline-block bg-white text-slate-900 font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow-sm">
                    {formData.buttonText || 'SHOP NOW'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-200/90 rounded-2xl p-3 flex items-start gap-2 text-[11px] text-sky-800 font-medium">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>Changes will appear on the homepage right sidebar after refresh.</span>
            </div>
          </div>

        </div>

      </div>

      {/* Footer Save Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#B71C1C] hover:bg-[#8E0000] cursor-pointer shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Save Changes</span>
        </button>
      </div>

      {/* Image Cropper Modal */}
      {cropperFile && (
        <ImageUploadCropperModal
          file={cropperFile}
          onClose={() => setCropperFile(null)}
          onCropComplete={(blob) => {
            setCropperFile(null);
            handleCroppedUpload(blob);
          }}
          aspect={1 / 1.3}
        />
      )}
    </div>
  );
}
