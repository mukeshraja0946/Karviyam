import React, { useState, useEffect } from 'react';
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
  IndianRupee
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { broadcastSyncEvent } from '../services/api';

const DEFAULT_CONFIG = {
  enabled: true,
  title: 'Find Your Price',
  buttons: [
    { id: '1', label: 'Under ₹499', maxPrice: 499, enabled: true },
    { id: '2', label: 'Under ₹999', maxPrice: 999, enabled: true },
    { id: '3', label: 'Under ₹1499', maxPrice: 1499, enabled: true },
    { id: '4', label: 'Under ₹1999', maxPrice: 1999, enabled: true },
    { id: '5', label: 'Under ₹2999', maxPrice: 2999, enabled: true }
  ]
};

export default function AdminFindYourPricePage({ isEmbedded = false }) {
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
      const rawCfg = dataMap.karviyam_find_your_price_config || dataMap.findYourPriceConfig;
      if (rawCfg) {
        const parsed = typeof rawCfg === 'string' ? JSON.parse(rawCfg) : rawCfg;
        if (parsed && typeof parsed === 'object') {
          setConfig({
            enabled: parsed.enabled !== false,
            title: parsed.title || 'Find Your Price',
            buttons: Array.isArray(parsed.buttons) ? parsed.buttons : DEFAULT_CONFIG.buttons
          });
        }
      }
    } catch (e) {
      toast.error('Failed to load Find Your Price configurations.');
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

  const handleAddButton = () => {
    const nextMax = 3999;
    const newBtn = {
      id: String(Date.now()),
      label: `Under ₹${nextMax}`,
      maxPrice: nextMax,
      enabled: true
    };
    setConfig(prev => ({
      ...prev,
      buttons: [...prev.buttons, newBtn]
    }));
  };

  const handleUpdateButton = (idx, field, val) => {
    setConfig(prev => {
      const updated = [...prev.buttons];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, buttons: updated };
    });
  };

  const handleMoveButton = (idx, dir) => {
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === config.buttons.length - 1)) return;
    setConfig(prev => {
      const updated = [...prev.buttons];
      const temp = updated[idx];
      updated[idx] = updated[idx + dir];
      updated[idx + dir] = temp;
      return { ...prev, buttons: updated };
    });
  };

  const handleDeleteButton = (idx) => {
    if (config.buttons.length <= 1) {
      toast.error('At least one price button option is required.');
      return;
    }
    setConfig(prev => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== idx)
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    toast.loading('Saving "Find Your Price" section configuration...', { id: 'fyp-save-toast' });

    try {
      const jsonStr = JSON.stringify(config);
      const res = await api.post('/settings', {
        karviyam_find_your_price_config: jsonStr,
        findYourPriceConfig: jsonStr
      });

      if (res.data?.success !== false) {
        try {
          localStorage.setItem('karviyam_find_your_price_config', jsonStr);
        } catch (eStorage) {}
        broadcastSyncEvent('karviyam_find_your_price_updated');
        broadcastSyncEvent('karviyam_homepage_sections_updated');
        toast.success('"Find Your Price" section updated successfully! 🎉', { id: 'fyp-save-toast' });
      } else {
        throw new Error(res.data?.message || 'Failed to save configuration.');
      }
    } catch (err) {
      console.error('[Save FindYourPrice Error]:', err);
      toast.error('Error saving "Find Your Price" configuration.', { id: 'fyp-save-toast' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-6 font-sans">
        <Loader2 className="w-8 h-8 text-[#B71C1C] animate-spin mb-2" />
        <h3 className="font-bold text-slate-800 text-xs">Loading "Find Your Price" Settings...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs font-sans">
      {!isEmbedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2">
              <IndianRupee className="w-6 h-6 text-[#B71C1C]" />
              <span>Find Your Price Homepage Section</span>
            </h1>
            <p className="text-xs text-slate-500">
              Manage price filter buttons, section title, and storefront visibility for Desktop & Mobile homepages.
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
        
        {/* Header Bar with Enable/Disable Master Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Section Master Control</span>
              <span className="text-[10px] font-mono bg-red-50 text-[#B71C1C] px-2 py-0.5 rounded-md uppercase font-black">
                Homepage Hero Sub-Section
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enable or disable the "Find Your Price" section below the hero banner.
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
            placeholder="Find Your Price"
            className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl font-extrabold text-sm outline-none focus:border-[#B71C1C]"
          />
        </div>

        {/* Price Buttons Table/List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Price Filter Pill Buttons ({config.buttons.length})
              </h4>
              <p className="text-[11px] text-slate-500">
                Clicking a button opens products under that price threshold in the Shop page.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddButton}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Price Button</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {config.buttons.map((btn, idx) => (
              <div
                key={btn.id || idx}
                className={`flex flex-col sm:flex-row sm:items-center justify-between border p-3.5 rounded-2xl gap-3 transition-all ${
                  btn.enabled !== false ? 'border-slate-200 bg-white' : 'border-slate-200 opacity-60 bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-[10px] flex items-center justify-center">
                    #{idx + 1}
                  </span>

                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleMoveButton(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 hover:bg-white text-slate-700 disabled:opacity-30 rounded cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveButton(idx, 1)}
                      disabled={idx === config.buttons.length - 1}
                      className="p-1 hover:bg-white text-slate-700 disabled:opacity-30 rounded cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-0.5">Button Display Label</label>
                    <input
                      type="text"
                      value={btn.label}
                      onChange={(e) => handleUpdateButton(idx, 'label', e.target.value)}
                      placeholder="e.g. Under ₹499"
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-extrabold text-xs outline-none focus:border-[#B71C1C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-0.5">Maximum Price Threshold (₹)</label>
                    <input
                      type="number"
                      value={btn.maxPrice}
                      onChange={(e) => handleUpdateButton(idx, 'maxPrice', parseFloat(e.target.value) || 0)}
                      placeholder="499"
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-extrabold text-xs outline-none focus:border-[#B71C1C]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500">Enable:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={btn.enabled !== false}
                        onChange={(e) => handleUpdateButton(idx, 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteButton(idx)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Option"
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
            <span>Save "Find Your Price" Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
