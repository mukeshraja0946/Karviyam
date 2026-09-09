import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Save,
  Plus,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  DollarSign,
  Palette,
  Tag,
  Maximize2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { broadcastSyncEvent } from '../services/api';

export default function AdminShopFiltersPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState([]);
  const [options, setOptions] = useState([]);
  const [activeTab, setActiveTab] = useState('sections'); // 'sections' | 'options'
  const [selectedSectionKey, setSelectedSectionKey] = useState('price');

  // Option Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [optForm, setOptForm] = useState({
    sectionKey: 'price',
    label: '',
    optionKey: '',
    minPrice: '',
    maxPrice: '',
    colorHex: '#000000',
    isEnabled: true
  });

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/shop-filters/admin-config');
      const data = res.data?.data || res.data || {};
      if (Array.isArray(data.sections)) {
        setSections(data.sections);
      }
      if (Array.isArray(data.options)) {
        setOptions(data.options);
      }
    } catch (err) {
      console.error('Error loading shop filter config:', err);
      toast.error('Failed to load shop filter configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Move Section Up/Down
  const moveSection = (index, direction) => {
    const newSections = [...sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    // Recalculate display_order
    const updated = newSections.map((sec, i) => ({
      ...sec,
      display_order: i + 1,
      displayOrder: i + 1
    }));
    setSections(updated);
  };

  // Toggle Section Enabled
  const toggleSectionEnabled = (id) => {
    setSections(prev =>
      prev.map(sec => sec.id === id ? { ...sec, is_enabled: sec.is_enabled ? 0 : 1 } : sec)
    );
  };

  // Section Field Change
  const handleSectionChange = (id, field, value) => {
    setSections(prev =>
      prev.map(sec => sec.id === id ? { ...sec, [field]: value } : sec)
    );
  };

  // Save All Sections & Reorder
  const handleSaveSections = async () => {
    setSaving(true);
    try {
      await api.put('/admin/shop-filters/sections', { sections });
      broadcastSyncEvent('karviyam_shop_filters_updated');
      toast.success('Shop filter sections updated successfully!');
      fetchConfig();
    } catch (err) {
      console.error('Error saving sections:', err);
      toast.error(err.response?.data?.message || 'Failed to save sections');
    } finally {
      setSaving(false);
    }
  };

  // Open Modal for Add/Edit Option
  const handleOpenOptionModal = (opt = null) => {
    if (opt) {
      setEditingOption(opt);
      setOptForm({
        sectionKey: opt.section_key || selectedSectionKey,
        label: opt.label || '',
        optionKey: opt.option_key || '',
        minPrice: opt.min_price !== null ? opt.min_price : '',
        maxPrice: opt.max_price !== null ? opt.max_price : '',
        colorHex: opt.color_hex || '#000000',
        isEnabled: Boolean(opt.is_enabled)
      });
    } else {
      setEditingOption(null);
      setOptForm({
        sectionKey: selectedSectionKey,
        label: '',
        optionKey: '',
        minPrice: '',
        maxPrice: '',
        colorHex: '#000000',
        isEnabled: true
      });
    }
    setModalOpen(true);
  };

  // Save Option
  const handleSaveOption = async (e) => {
    e.preventDefault();
    if (!optForm.label) {
      toast.error('Option label is required');
      return;
    }

    try {
      if (editingOption) {
        await api.put(`/admin/shop-filters/options/${editingOption.id}`, {
          label: optForm.label,
          optionKey: optForm.optionKey,
          minPrice: optForm.minPrice !== '' ? parseFloat(optForm.minPrice) : null,
          maxPrice: optForm.maxPrice !== '' ? parseFloat(optForm.maxPrice) : null,
          colorHex: optForm.colorHex,
          isEnabled: optForm.isEnabled,
          displayOrder: editingOption.display_order
        });
        toast.success('Filter option updated');
      } else {
        await api.post('/admin/shop-filters/options', {
          sectionKey: optForm.sectionKey,
          label: optForm.label,
          optionKey: optForm.optionKey,
          minPrice: optForm.minPrice !== '' ? parseFloat(optForm.minPrice) : null,
          maxPrice: optForm.maxPrice !== '' ? parseFloat(optForm.maxPrice) : null,
          colorHex: optForm.colorHex,
          isEnabled: optForm.isEnabled,
          displayOrder: options.filter(o => o.section_key === optForm.sectionKey).length + 1
        });
        toast.success('Filter option added');
      }

      setModalOpen(false);
      broadcastSyncEvent('karviyam_shop_filters_updated');
      fetchConfig();
    } catch (err) {
      console.error('Error saving option:', err);
      toast.error(err.response?.data?.message || 'Failed to save option');
    }
  };

  // Delete Option
  const handleDeleteOption = async (id) => {
    if (!window.confirm('Are you sure you want to delete this filter option?')) return;
    try {
      await api.delete(`/admin/shop-filters/options/${id}`);
      toast.success('Filter option deleted');
      broadcastSyncEvent('karviyam_shop_filters_updated');
      fetchConfig();
    } catch (err) {
      console.error('Error deleting option:', err);
      toast.error('Failed to delete option');
    }
  };

  // Toggle Option Enabled
  const handleToggleOptionEnabled = async (opt) => {
    try {
      await api.put(`/admin/shop-filters/options/${opt.id}`, {
        ...opt,
        label: opt.label,
        isEnabled: !opt.is_enabled
      });
      broadcastSyncEvent('karviyam_shop_filters_updated');
      fetchConfig();
    } catch (err) {
      toast.error('Failed to toggle option');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#B71C1C] animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading Shop Filter Configurations...</p>
        </div>
      </div>
    );
  }

  const sectionOptions = options.filter(o => o.section_key === selectedSectionKey);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#B71C1C]">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Shop Filter Management</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize, reorder, enable/disable sidebar filter sections and individual filter options shown on the Shop page.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchConfig}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleSaveSections}
            disabled={saving}
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#B71C1C] hover:bg-red-800 rounded-xl transition flex items-center gap-2 shadow-md shadow-red-900/10 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All Changes
          </button>
        </div>
      </div>

      {/* Tabs: Filter Sections vs Filter Options */}
      <div className="flex border-b border-slate-200 bg-white px-6 rounded-t-2xl pt-4">
        <button
          onClick={() => setActiveTab('sections')}
          className={`pb-4 text-sm font-bold border-b-2 px-4 transition ${
            activeTab === 'sections'
              ? 'border-[#B71C1C] text-[#B71C1C]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          1. Filter Sections & Order ({sections.length})
        </button>
        <button
          onClick={() => setActiveTab('options')}
          className={`pb-4 text-sm font-bold border-b-2 px-4 transition ${
            activeTab === 'options'
              ? 'border-[#B71C1C] text-[#B71C1C]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          2. Manage Filter Options (Price, Size, Colors, Brands)
        </button>
      </div>

      {/* TAB 1: SECTIONS MANAGEMENT */}
      {activeTab === 'sections' && (
        <div className="bg-white rounded-b-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <p className="text-xs text-slate-500 font-medium">
            Drag/reorder sections, edit title labels, toggle visibility on/off, and configure display limits.
          </p>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {sections.map((sec, idx) => (
              <div
                key={sec.id || sec.section_key}
                className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  sec.is_enabled ? 'bg-white' : 'bg-slate-50 opacity-75'
                }`}
              >
                {/* Left: Reorder & Title */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveSection(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveSection(idx, 'down')}
                      disabled={idx === sections.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="w-7 h-7 rounded-full bg-slate-100 text-xs font-bold flex items-center justify-center text-slate-700">
                    {idx + 1}
                  </span>

                  <div className="flex-1 max-w-xs">
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Key: {sec.section_key}
                    </label>
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => handleSectionChange(sec.id, 'title', e.target.value)}
                      className="w-full text-sm font-bold text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#B71C1C]/20 focus:border-[#B71C1C]"
                    />
                  </div>
                </div>

                {/* Center: Settings */}
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Display Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={sec.display_limit || 5}
                      onChange={(e) => handleSectionChange(sec.id, 'display_limit', parseInt(e.target.value, 10))}
                      className="w-20 text-xs font-bold border border-slate-200 rounded-lg px-2 py-1.5 text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      "Show More"
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSectionChange(sec.id, 'enable_show_more', sec.enable_show_more ? 0 : 1)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                        sec.enable_show_more
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {sec.enable_show_more ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Show More Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={sec.show_more_limit || 10}
                      onChange={(e) => handleSectionChange(sec.id, 'show_more_limit', parseInt(e.target.value, 10))}
                      className="w-20 text-xs font-bold border border-slate-200 rounded-lg px-2 py-1.5 text-center"
                    />
                  </div>
                </div>

                {/* Right: Toggle ON/OFF */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleSectionEnabled(sec.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                      sec.is_enabled
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {sec.is_enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {sec.is_enabled ? 'VISIBLE' : 'HIDDEN'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: OPTIONS MANAGEMENT */}
      {activeTab === 'options' && (
        <div className="bg-white rounded-b-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          {/* Section Selector */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {['price', 'size', 'colour', 'brand', 'availability', 'category'].map(key => (
                <button
                  key={key}
                  onClick={() => setSelectedSectionKey(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition ${
                    selectedSectionKey === key
                      ? 'bg-[#B71C1C] text-white shadow-md shadow-red-900/10'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {key} ({options.filter(o => o.section_key === key).length})
                </button>
              ))}
            </div>

            {selectedSectionKey !== 'category' && (
              <button
                onClick={() => handleOpenOptionModal()}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New {selectedSectionKey.toUpperCase()} Option
              </button>
            )}
          </div>

          {selectedSectionKey === 'category' ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <p className="font-bold">Category Options Note:</p>
              <p className="mt-1">
                Category filter options are generated dynamically from your active catalog Categories in database.
                To add, rename, or delete categories, please use the <strong>Categories</strong> section in Admin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionOptions.map(opt => (
                <div
                  key={opt.id}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between gap-3 ${
                    opt.is_enabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        {opt.option_key}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        {opt.section_key === 'colour' && opt.color_hex && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shadow-inner"
                            style={{ backgroundColor: opt.color_hex }}
                          />
                        )}
                        {opt.label}
                      </h4>

                      {opt.section_key === 'price' && (
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                          Range: ₹{opt.min_price || 0} – {opt.max_price >= 999999 ? '∞' : `₹${opt.max_price}`}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleOptionEnabled(opt)}
                      className={`p-1.5 rounded-lg text-xs font-bold transition ${
                        opt.is_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                      }`}
                      title={opt.is_enabled ? 'Disable Option' : 'Enable Option'}
                    >
                      {opt.is_enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="text-slate-400 font-medium">Order: {opt.display_order}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenOptionModal(opt)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg transition"
                        title="Edit Option"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteOption(opt.id)}
                        className="p-1.5 text-red-600 hover:text-red-800 bg-red-50 rounded-lg transition"
                        title="Delete Option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Option Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {editingOption ? 'Edit Filter Option' : `Add New ${selectedSectionKey.toUpperCase()} Option`}
            </h3>

            <form onSubmit={handleSaveOption} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Option Label *</label>
                <input
                  type="text"
                  value={optForm.label}
                  onChange={(e) => setOptForm({ ...optForm, label: e.target.value })}
                  placeholder="e.g. Under ₹499 or XL or Red"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#B71C1C]/20 focus:border-[#B71C1C]"
                  required
                />
              </div>

              {selectedSectionKey === 'price' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Min Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={optForm.minPrice}
                      onChange={(e) => setOptForm({ ...optForm, minPrice: e.target.value })}
                      placeholder="0"
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Max Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={optForm.maxPrice}
                      onChange={(e) => setOptForm({ ...optForm, maxPrice: e.target.value })}
                      placeholder="499"
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2"
                    />
                  </div>
                </div>
              )}

              {selectedSectionKey === 'colour' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Color Code (Hex)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={optForm.colorHex}
                      onChange={(e) => setOptForm({ ...optForm, colorHex: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-1"
                    />
                    <input
                      type="text"
                      value={optForm.colorHex}
                      onChange={(e) => setOptForm({ ...optForm, colorHex: e.target.value })}
                      placeholder="#B71C1C"
                      className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 font-mono uppercase"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="optEnabled"
                  checked={optForm.isEnabled}
                  onChange={(e) => setOptForm({ ...optForm, isEnabled: e.target.checked })}
                  className="w-4 h-4 text-[#B71C1C] rounded border-slate-300"
                />
                <label htmlFor="optEnabled" className="text-xs font-bold text-slate-700">
                  Enable Option
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#B71C1C] hover:bg-red-800 rounded-xl shadow-md shadow-red-900/10"
                >
                  Save Option
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
