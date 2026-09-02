import React, { useState, useEffect } from 'react';
import { LayoutGrid, Eye, Power, Save, ArrowUp, ArrowDown, Sliders, CheckCircle2, AlertCircle, Loader2, Sparkles, RefreshCw, Layers, Grid, MoveHorizontal, Package, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { broadcastSyncEvent } from '../services/api';
import AdminFindYourPricePage from './AdminFindYourPricePage';

export default function AdminHomepageSectionsPage() {
  const [activeTab, setActiveTab] = useState('sections');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/homepage-sections').catch(() => null);
      const data = res?.data?.data || res?.data;

      if (data) {
        if (Array.isArray(data.sections)) {
          setSections(data.sections.sort((a, b) => (parseInt(a.position) || 0) - (parseInt(b.position) || 0)));
        }
        if (Array.isArray(data.availableProducts)) {
          setAvailableProducts(data.availableProducts);
        }
      }
    } catch (e) {
      toast.error('Failed to load homepage section configurations.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnable = (idx) => {
    setSections(prev => {
      const updated = [...prev];
      updated[idx].enabled = !updated[idx].enabled;
      return updated;
    });
  };

  const handleChangeField = (idx, field, val) => {
    setSections(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const handleMoveOrder = (idx, direction) => {
    if ((direction === -1 && idx === 0) || (direction === 1 && idx === sections.length - 1)) return;
    
    setSections(prev => {
      const updated = [...prev];
      const targetIdx = idx + direction;
      
      const temp = updated[idx];
      updated[idx] = updated[targetIdx];
      updated[targetIdx] = temp;

      // Re-assign positions
      return updated.map((sec, i) => ({
        ...sec,
        position: i + 1
      }));
    });
  };

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    toast.loading('Saving homepage section configurations...', { id: 'admin-sec-toast' });

    try {
      // Clean and normalize positions
      const cleaned = sections.map((sec, i) => ({
        ...sec,
        position: i + 1
      }));

      const res = await api.put('/admin/homepage-sections', { sections: cleaned });

      if (res.data?.success) {
        toast.success('Homepage section configurations saved successfully! 🎉', { id: 'admin-sec-toast' });
        broadcastSyncEvent('karviyam_homepage_sections_updated');
        await fetchSections();
      } else {
        toast.error(res.data?.message || 'Failed to save configurations.', { id: 'admin-sec-toast' });
      }
    } catch (err) {
      toast.error('Error saving section configurations.', { id: 'admin-sec-toast' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 font-sans">
        <Loader2 className="w-10 h-10 text-[#B71C1C] animate-spin mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Homepage Section Control Center...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-[#B71C1C]" />
            <span>Homepage Product Sections Management</span>
          </h1>
          <p className="text-xs text-slate-500">
            Configure Trending, Most-Loved Fashion, and Starting @ ₹199 sections. Unified settings for Desktop & Mobile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSections}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Configurations</span>
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'sections'
              ? 'bg-[#B71C1C] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Featured Product Sections
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('find_your_price')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'find_your_price'
              ? 'bg-[#B71C1C] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Find Your Price Section
        </button>
      </div>

      {activeTab === 'find_your_price' ? (
        <AdminFindYourPricePage isEmbedded={true} />
      ) : (
        <>
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 text-red-950">
            <Sparkles className="w-5 h-5 text-[#B71C1C] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-slate-900">Single Source of Truth Configuration</p>
              <p className="text-slate-600 font-medium">
                Changes made here (Title, Visibility, Display Type: Horizontal Scroll vs Grid, and Order) automatically update both Desktop and Mobile homepages in real-time.
              </p>
            </div>
          </div>

      {/* Section List Cards */}
      <div className="space-y-5">
        {sections.map((sec, idx) => (
          <div
            key={sec.id || sec.section_key || idx}
            className={`bg-white border rounded-3xl p-6 shadow-xs space-y-5 transition-all ${
              sec.enabled !== false ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
            }`}
          >
            {/* Header / Position & Toggle Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xs shadow-sm">
                  #{idx + 1}
                </span>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>{sec.title}</span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase">
                      {sec.id || sec.section_key}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">{sec.subtitle || 'Homepage featured row'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Reorder Buttons */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 hover:bg-white text-slate-700 disabled:opacity-30 rounded-lg cursor-pointer transition-colors"
                    title="Move Section Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(idx, 1)}
                    disabled={idx === sections.length - 1}
                    className="p-1.5 hover:bg-white text-slate-700 disabled:opacity-30 rounded-lg cursor-pointer transition-colors"
                    title="Move Section Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Enable / Disable Toggle */}
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
                  <span className={`text-[10.5px] font-extrabold uppercase ${!sec.enabled ? 'text-rose-600' : 'text-slate-400'}`}>
                    OFF
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sec.enabled !== false}
                      onChange={() => handleToggleEnable(idx)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#B71C1C]" />
                  </label>
                  <span className={`text-[10.5px] font-extrabold uppercase ${sec.enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                    ON
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Section Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={sec.title}
                  onChange={(e) => handleChangeField(idx, 'title', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-bold text-xs outline-none focus:border-[#B71C1C]"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle / Tagline</label>
                <input
                  type="text"
                  value={sec.subtitle || ''}
                  onChange={(e) => handleChangeField(idx, 'subtitle', e.target.value)}
                  placeholder="Optional tagline text"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-[#B71C1C]"
                />
              </div>

              {/* Display Type: Horizontal Scroll vs Grid */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Layout</label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleChangeField(idx, 'display_type', 'horizontal')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all ${
                      sec.display_type === 'horizontal' ? 'bg-[#B71C1C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <MoveHorizontal className="w-3.5 h-3.5" />
                    <span>Horizontal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChangeField(idx, 'display_type', 'grid')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all ${
                      sec.display_type === 'grid' ? 'bg-[#B71C1C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Grid</span>
                  </button>
                </div>
              </div>

              {/* Product Limit */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Count Limit</label>
                <select
                  value={sec.limit || 8}
                  onChange={(e) => handleChangeField(idx, 'limit', parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-bold text-xs outline-none focus:border-[#B71C1C]"
                >
                  <option value={4}>4 Products</option>
                  <option value={8}>8 Products</option>
                  <option value={12}>12 Products</option>
                  <option value={16}>16 Products</option>
                </select>
              </div>

              {/* View All Text */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">View All Button Text</label>
                <input
                  type="text"
                  value={sec.view_all_text || ''}
                  onChange={(e) => handleChangeField(idx, 'view_all_text', e.target.value)}
                  placeholder="View All →"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C]"
                />
              </div>

              {/* View All Link */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">View All Link URL</label>
                <input
                  type="text"
                  value={sec.view_all_link || ''}
                  onChange={(e) => handleChangeField(idx, 'view_all_link', e.target.value)}
                  placeholder="/shop"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono outline-none focus:border-[#B71C1C]"
                />
              </div>

              {/* Product Selection Mode */}
              <div className="col-span-1 md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Product Selection Mode</label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="radio"
                      name={`mode_${sec.id}`}
                      checked={sec.selection_mode !== 'custom'}
                      onChange={() => handleChangeField(idx, 'selection_mode', 'auto')}
                      className="accent-[#B71C1C]"
                    />
                    <span>Automatic Smart Query (e.g. Best Sellers, Price &lt; ₹199, Trending)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="radio"
                      name={`mode_${sec.id}`}
                      checked={sec.selection_mode === 'custom'}
                      onChange={() => handleChangeField(idx, 'selection_mode', 'custom')}
                      className="accent-[#B71C1C]"
                    />
                    <span>Custom Selected Products</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Custom Product Selection (If custom mode enabled) */}
            {sec.selection_mode === 'custom' && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                <label className="block font-bold text-slate-800 text-xs">Select Products to Display in this Section:</label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                  {availableProducts.map(p => {
                    const isSelected = Array.isArray(sec.custom_product_ids) && sec.custom_product_ids.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 cursor-pointer hover:border-[#B71C1C]">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const currentList = Array.isArray(sec.custom_product_ids) ? sec.custom_product_ids : [];
                              const newList = e.target.checked
                                ? [...currentList, p.id]
                                : currentList.filter(id => id !== p.id);
                              handleChangeField(idx, 'custom_product_ids', newList);
                            }}
                            className="accent-[#B71C1C]"
                          />
                          <span className="font-bold text-slate-900">{p.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">#{p.id}</span>
                        </div>
                        <span className="font-black text-[#B71C1C]">₹{p.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Save Button Bar */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="bg-[#B71C1C] hover:bg-[#900C0C] disabled:bg-slate-400 text-white font-bold px-8 py-3 rounded-2xl shadow-lg cursor-pointer transition-all flex items-center gap-2 uppercase tracking-wider text-xs"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save All Homepage Section Configurations</span>
        </button>
      </div>
        </>
      )}

    </div>
  );
}
