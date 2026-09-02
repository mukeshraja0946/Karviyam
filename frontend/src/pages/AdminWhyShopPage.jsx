import React, { useState, useEffect } from 'react';
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
  Award,
  ShieldCheck,
  RotateCcw,
  Truck,
  Star,
  Heart,
  CheckCircle2,
  Package,
  Lock,
  IndianRupee,
  BadgePercent,
  Headphones,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { broadcastSyncEvent } from '../services/api';
import { renderBenefitIcon } from '../components/WhyShopWithKarviyam';

const DEFAULT_CONFIG = {
  enabled: true,
  title: 'WHY SHOP WITH KARVIYAM?',
  benefits: [
    { id: '1', title: 'Best Quality', subtitle: '100% Original', icon: 'Award', enabled: true },
    { id: '2', title: 'Secure Payments', subtitle: '100% Protected', icon: 'ShieldCheck', enabled: true },
    { id: '3', title: 'Easy Returns', subtitle: '14 Days Policy', icon: 'RotateCcw', enabled: true },
    { id: '4', title: 'Free Delivery', subtitle: 'Above ₹499', icon: 'Truck', enabled: true },
    { id: '5', title: 'Top Brands', subtitle: 'Original Products', icon: 'Star', enabled: true }
  ]
};

const AVAILABLE_ICONS = [
  { id: 'Award', label: 'Badge / Award (Best Quality)' },
  { id: 'ShieldCheck', label: 'Shield (Secure Payments)' },
  { id: 'RotateCcw', label: 'Return Arrow (Easy Returns)' },
  { id: 'Truck', label: 'Delivery Truck (Free Shipping)' },
  { id: 'Star', label: 'Star (Top Brands)' },
  { id: 'Heart', label: 'Heart (Loved by Millions)' },
  { id: 'CheckCircle2', label: 'Check Circle (Guaranteed)' },
  { id: 'Package', label: 'Package Box (Safe Delivery)' },
  { id: 'Lock', label: 'Lock (Encrypted Security)' },
  { id: 'IndianRupee', label: 'Rupee Coin (Best Price)' },
  { id: 'BadgePercent', label: 'Discount Tag (Best Offers)' },
  { id: 'Headphones', label: 'Headphones (Customer Support)' },
  { id: 'Sparkles', label: 'Sparkles (Premium Store)' }
];

export default function AdminWhyShopPage({ isEmbedded = false }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings').catch(() => null);
      const apiData = res?.data ? res.data : res;
      const dataMap = apiData?.data || apiData || {};
      const rawCfg = dataMap.karviyam_why_shop_config || dataMap.whyShopConfig;
      if (rawCfg) {
        const parsed = typeof rawCfg === 'string' ? JSON.parse(rawCfg) : rawCfg;
        if (parsed && typeof parsed === 'object') {
          setConfig({
            enabled: parsed.enabled !== false,
            title: parsed.title || 'WHY SHOP WITH KARVIYAM?',
            benefits: Array.isArray(parsed.benefits) ? parsed.benefits : DEFAULT_CONFIG.benefits
          });
        }
      }
    } catch (e) {
      toast.error('Failed to load "Why Shop With Karviyam" configurations.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaster = () => {
    setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleTitleChange = (val) => {
    setConfig(prev => ({ ...prev, title: val }));
  };

  const handleAddBenefit = () => {
    const newBenefit = {
      id: String(Date.now()),
      title: 'New Benefit',
      subtitle: 'Description here',
      icon: 'Award',
      enabled: true
    };
    setConfig(prev => ({
      ...prev,
      benefits: [...prev.benefits, newBenefit]
    }));
  };

  const handleUpdateBenefit = (idx, field, val) => {
    setConfig(prev => {
      const updated = [...prev.benefits];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, benefits: updated };
    });
  };

  const handleMoveBenefit = (idx, dir) => {
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === config.benefits.length - 1)) return;
    setConfig(prev => {
      const updated = [...prev.benefits];
      const temp = updated[idx];
      updated[idx] = updated[idx + dir];
      updated[idx + dir] = temp;
      return { ...prev, benefits: updated };
    });
  };

  const handleDeleteBenefit = (idx) => {
    if (config.benefits.length <= 1) {
      toast.error('At least one benefit item is required.');
      return;
    }
    setConfig(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== idx)
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    toast.loading('Saving "Why Shop With Karviyam" configuration...', { id: 'ws-save-toast' });

    try {
      const jsonStr = JSON.stringify(config);
      const res = await api.post('/settings', {
        karviyam_why_shop_config: jsonStr,
        whyShopConfig: jsonStr
      });

      if (res.data?.success !== false) {
        try {
          localStorage.setItem('karviyam_why_shop_config', jsonStr);
        } catch (eStorage) {}
        broadcastSyncEvent('karviyam_why_shop_updated');
        broadcastSyncEvent('karviyam_homepage_sections_updated');
        toast.success('"Why Shop With Karviyam" section updated successfully! 🎉', { id: 'ws-save-toast' });
      } else {
        throw new Error(res.data?.message || 'Failed to save configuration.');
      }
    } catch (err) {
      console.error('[Save WhyShop Error]:', err);
      toast.error('Error saving "Why Shop With Karviyam" configuration.', { id: 'ws-save-toast' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-6 font-sans">
        <Loader2 className="w-8 h-8 text-[#B71C1C] animate-spin mb-2" />
        <h3 className="font-bold text-slate-800 text-xs">Loading "Why Shop With Karviyam" Settings...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs font-sans">
      {!isEmbedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-[#B71C1C]" />
              <span>Why Shop With Karviyam Homepage Section</span>
            </h1>
            <p className="text-xs text-slate-500">
              Manage benefit cards, icons, subtitles, and section visibility for Desktop & Mobile homepages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchConfig}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Configurations</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Section Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* Header Bar with Master Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Section Master Control</span>
              <span className="text-[10px] font-mono bg-red-50 text-[#B71C1C] px-2 py-0.5 rounded-md uppercase font-black">
                Homepage Hero Sub-Section (Right Column)
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enable or disable the "Why Shop With Karviyam?" section.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
            <span className={`text-xs font-extrabold uppercase ${!config.enabled ? 'text-rose-600' : 'text-slate-400'}`}>
              OFF
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled !== false}
                onChange={handleToggleMaster}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B71C1C]" />
            </label>
            <span className={`text-xs font-extrabold uppercase ${config.enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
              ON
            </span>
          </div>
        </div>

        {/* Section Title Field */}
        <div className="max-w-md">
          <label className="block font-bold text-slate-800 mb-1">Section Header Title</label>
          <input
            type="text"
            value={config.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="WHY SHOP WITH KARVIYAM?"
            className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl font-extrabold text-sm outline-none focus:border-[#B71C1C]"
          />
        </div>

        {/* Benefits List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Benefit Cards / Badges ({config.benefits.length})
              </h4>
              <p className="text-[11px] text-slate-500">
                Manage titles, descriptions, icons, and order of benefit items shown on customer homepage.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddBenefit}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Benefit Card</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {config.benefits.map((item, idx) => (
              <div
                key={item.id || idx}
                className={`flex flex-col sm:flex-row sm:items-center justify-between border p-3.5 rounded-2xl gap-3 transition-all ${
                  item.enabled !== false ? 'border-slate-200 bg-white' : 'border-slate-200 opacity-60 bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-[10px] flex items-center justify-center">
                    #{idx + 1}
                  </span>

                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleMoveBenefit(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 hover:bg-white text-slate-700 disabled:opacity-30 rounded cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveBenefit(idx, 1)}
                      disabled={idx === config.benefits.length - 1}
                      className="p-1 hover:bg-white text-slate-700 disabled:opacity-30 rounded cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Icon Preview */}
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-[#B71C1C] flex items-center justify-center border border-rose-100 shadow-2xs">
                    {renderBenefitIcon(item.icon, "w-4 h-4")}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-0.5">Benefit Title</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleUpdateBenefit(idx, 'title', e.target.value)}
                      placeholder="e.g. Best Quality"
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-extrabold text-xs outline-none focus:border-[#B71C1C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-0.5">Subtitle / Description</label>
                    <input
                      type="text"
                      value={item.subtitle || ''}
                      onChange={(e) => handleUpdateBenefit(idx, 'subtitle', e.target.value)}
                      placeholder="e.g. 100% Original"
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-medium text-xs outline-none focus:border-[#B71C1C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-0.5">Choose Icon</label>
                    <select
                      value={item.icon || 'Award'}
                      onChange={(e) => handleUpdateBenefit(idx, 'icon', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-xs outline-none focus:border-[#B71C1C]"
                    >
                      {AVAILABLE_ICONS.map(ic => (
                        <option key={ic.id} value={ic.id}>
                          {ic.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500">Enable:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.enabled !== false}
                        onChange={(e) => handleUpdateBenefit(idx, 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteBenefit(idx)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Benefit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2 text-xs uppercase tracking-wider"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save "Why Shop With Karviyam" Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
