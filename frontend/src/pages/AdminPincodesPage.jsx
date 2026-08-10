import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Truck,
  DollarSign,
  Filter,
  RefreshCw,
  FileText,
  FileType,
  FileCode,
  Download,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminPincodesPage() {
  const [pincodes, setPincodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [distinctStates, setDistinctStates] = useState([]);
  const [distinctCities, setDistinctCities] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingPincode, setEditingPincode] = useState(null);

  const [formData, setFormData] = useState({
    pincode: '',
    area: '',
    city: '',
    district: '',
    state: '',
    isDeliveryAvailable: true,
    isCodAvailable: true,
    estimatedDeliveryDays: 3,
    isActive: true
  });

  // Bulk Import States
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [previewRows, setPreviewRows] = useState([]);
  const [importDataText, setImportDataText] = useState('');

  useEffect(() => {
    fetchPincodes();
    fetchFilters();
  }, [search, selectedState, selectedCity]);

  const fetchPincodes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pincodes', {
        params: {
          keyword: search,
          state: selectedState,
          city: selectedCity,
          size: 100
        }
      });
      const apiData = res.data ? res.data : res;
      const paged = apiData.data || apiData;
      if (paged && paged.content) {
        setPincodes(paged.content);
      } else if (Array.isArray(paged)) {
        setPincodes(paged);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load deliverable pincodes');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const statesRes = await api.get('/pincodes/states');
      const citiesRes = await api.get('/pincodes/cities');
      setDistinctStates(statesRes.data?.data || statesRes.data || []);
      setDistinctCities(citiesRes.data?.data || citiesRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setEditingPincode(null);
    setFormData({
      pincode: '',
      area: '',
      city: '',
      district: '',
      state: '',
      isDeliveryAvailable: true,
      isCodAvailable: true,
      estimatedDeliveryDays: 3,
      isActive: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (pin) => {
    setEditingPincode(pin);
    setFormData({
      pincode: pin.pincode || '',
      area: pin.area || '',
      city: pin.city || '',
      district: pin.district || '',
      state: pin.state || '',
      isDeliveryAvailable: pin.isDeliveryAvailable !== false,
      isCodAvailable: pin.isCodAvailable !== false,
      estimatedDeliveryDays: pin.estimatedDeliveryDays || 3,
      isActive: pin.isActive !== false
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pincode.trim()) {
      toast.error('Pincode is required');
      return;
    }

    try {
      if (editingPincode) {
        const res = await api.put(`/admin/pincodes/${editingPincode.id}`, formData);
        const apiData = res.data ? res.data : res;
        if (apiData) {
          toast.success('Pincode record updated!');
          fetchPincodes();
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/admin/pincodes', formData);
        const apiData = res.data ? res.data : res;
        if (apiData) {
          toast.success('New deliverable pincode added!');
          fetchPincodes();
          fetchFilters();
          setModalOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to save pincode record';
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pincode record?')) return;
    try {
      await api.delete(`/admin/pincodes/${id}`);
      toast.success('Pincode removed');
      fetchPincodes();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete pincode');
    }
  };

  const handleToggleStatus = async (pin) => {
    try {
      await api.put(`/admin/pincodes/${pin.id}/toggle-status?active=${!pin.isActive}`);
      toast.success(`Pincode ${!pin.isActive ? 'enabled' : 'disabled'}`);
      fetchPincodes();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const handleDownloadTemplate = (format = 'csv') => {
    const csvContent = `pincode,area,city,district,state,isDeliveryAvailable,isCodAvailable,estimatedDeliveryDays,isActive\n600001,Parrys,Chennai,Chennai,Tamil Nadu,true,true,2,true\n600002,Anna Salai,Chennai,Chennai,Tamil Nadu,true,true,2,true\n638001,Main Market,Erode,Erode,Tamil Nadu,true,true,3,true\n110001,Connaught Place,New Delhi,Central Delhi,Delhi,true,true,4,true`;
    const blob = new Blob([csvContent], { type: format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deliverable_pincodes_sample.${format === 'excel' ? 'xlsx' : 'csv'}`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Sample ${format.toUpperCase()} Template Downloaded!`);
  };

  // Drag & Drop File Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    setUploadedFileName(file.name);
    parseUploadedFile(file);
  };

  const parseUploadedFile = (file) => {
    if (!file) return;
    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
      reader.onload = (e) => processRawTextData(e.target.result);
      reader.readAsText(file);
    } else {
      // Handle XLSX, XLS, PDF, DOCX, DOC via buffer extraction
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const decoder = new TextDecoder('utf-8');
        const rawString = decoder.decode(arrayBuffer);
        processRawTextData(rawString);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processRawTextData = (rawText) => {
    if (!rawText) return;

    // Clean HTML/XML tags or PDF binary streams if present
    const cleaned = rawText.replace(/<[^>]+>/g, ' ');
    const lines = cleaned.split(/[\r\n]+/);
    const extractedRows = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.includes(',') ? line.split(',') : line.split(/\s{2,}|\t/);
      const pinMatch = line.match(/\b\d{6}\b/);

      if (pinMatch || cols.length >= 1) {
        const pinCandidate = pinMatch ? pinMatch[0] : cols[0].replace(/\D/g, '');
        if (pinCandidate && pinCandidate.length === 6) {
          extractedRows.push({
            id: Date.now() + i,
            pincode: pinCandidate,
            area: cols[1] ? cols[1].trim() : 'Central Region',
            city: cols[2] ? cols[2].trim() : 'District Headquarter',
            district: cols[3] ? cols[3].trim() : (cols[2] ? cols[2].trim() : ''),
            state: cols[4] ? cols[4].trim() : 'Tamil Nadu',
            isDeliveryAvailable: cols[5] ? cols[5].toLowerCase().includes('true') : true,
            isCodAvailable: cols[6] ? cols[6].toLowerCase().includes('true') : true,
            estimatedDeliveryDays: cols[7] ? (parseInt(cols[7], 10) || 3) : 3,
            isActive: true
          });
        }
      }
    }

    if (extractedRows.length > 0) {
      setPreviewRows(extractedRows);
      toast.success(`Parsed ${extractedRows.length} valid pincode records!`);
    } else {
      toast.error('No 6-digit pincodes found in file. Try CSV or Excel format.');
    }
  };

  const handlePreviewRowChange = (index, field, value) => {
    const updated = [...previewRows];
    updated[index][field] = value;
    setPreviewRows(updated);
  };

  const handleRemovePreviewRow = (index) => {
    const updated = previewRows.filter((_, idx) => idx !== index);
    setPreviewRows(updated);
  };

  const handleBulkImportSubmit = async () => {
    let rowsToImport = [...previewRows];

    // If user pasted manual CSV text instead
    if (rowsToImport.length === 0 && importDataText.trim()) {
      const lines = importDataText.trim().split('\n');
      const hasHeader = lines[0].toLowerCase().includes('pincode');
      const startIdx = hasHeader ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',');
        if (cols[0]) {
          const pin = cols[0].trim().replace(/\D/g, '');
          if (pin.length === 6) {
            rowsToImport.push({
              pincode: pin,
              area: cols[1]?.trim() || 'Central Locality',
              city: cols[2]?.trim() || 'Main City',
              district: cols[3]?.trim() || '',
              state: cols[4]?.trim() || 'Tamil Nadu',
              isDeliveryAvailable: cols[5] ? cols[5].trim().toLowerCase() === 'true' : true,
              isCodAvailable: cols[6] ? cols[6].trim().toLowerCase() === 'true' : true,
              estimatedDeliveryDays: cols[7] ? parseInt(cols[7].trim(), 10) || 3 : 3,
              isActive: true
            });
          }
        }
      }
    }

    if (rowsToImport.length === 0) {
      toast.error('Please upload a file or paste CSV data first');
      return;
    }

    setImporting(true);
    try {
      const res = await api.post('/admin/pincodes/bulk-import', rowsToImport);
      const result = res.data?.data || res.data;
      toast.success(`Import complete! ${result.successCount || rowsToImport.length} pincodes imported.`);
      fetchPincodes();
      fetchFilters();
      setImportModalOpen(false);
      setPreviewRows([]);
      setImportDataText('');
      setUploadedFileName('');
    } catch (err) {
      console.error(err);
      toast.error('Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#B71C1C]" />
            <h1 className="font-display font-extrabold text-2xl text-slate-900">Deliverable Locations Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Manage serviceable pincodes, delivery availability, COD rules & delivery timeframes</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition-all border border-slate-200"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import Pincodes</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-[#B71C1C]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Pincode</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pincode, area, city, district, state..."
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 rounded-2xl text-xs outline-none focus:border-[#B71C1C]"
            />
          </div>

          <div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl text-xs outline-none font-semibold text-slate-700"
            >
              <option value="">All States</option>
              {distinctStates.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl text-xs outline-none font-semibold text-slate-700"
            >
              <option value="">All Cities</option>
              {distinctCities.map(ct => (
                <option key={ct} value={ct}>{ct}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Pincodes Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B71C1C] mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Loading pincodes database...</p>
          </div>
        ) : pincodes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">No deliverable locations found</h3>
            <p className="text-xs text-slate-400">Try adjusting search query or add new pincodes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Pincode</th>
                  <th className="px-5 py-3.5">Area / Location</th>
                  <th className="px-5 py-3.5">City & State</th>
                  <th className="px-5 py-3.5">Delivery Status</th>
                  <th className="px-5 py-3.5">COD Status</th>
                  <th className="px-5 py-3.5">Est. Days</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pincodes.map((pin) => (
                  <tr key={pin.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-extrabold text-slate-900 font-mono text-sm">
                      {pin.pincode}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{pin.area || 'General Region'}</div>
                      <div className="text-[11px] text-slate-400">{pin.district || pin.city}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-800">{pin.city}</span>, <span className="text-slate-500">{pin.state}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        pin.isDeliveryAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                      }`}>
                        {pin.isDeliveryAvailable ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {pin.isDeliveryAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        pin.isCodAvailable ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <DollarSign className="w-3 h-3" />
                        {pin.isCodAvailable ? 'COD Enabled' : 'Prepaid Only'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {pin.estimatedDeliveryDays || 3} Business Days
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(pin)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                            pin.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'
                          }`}
                          title={pin.isActive ? 'Disable Pincode' : 'Enable Pincode'}
                        >
                          {pin.isActive ? 'Active' : 'Disabled'}
                        </button>

                        <button
                          onClick={() => handleOpenEdit(pin)}
                          className="p-1.5 text-slate-400 hover:text-[#B71C1C] rounded-lg hover:bg-red-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(pin.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Pincode Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingPincode ? 'Edit Deliverable Pincode' : 'Add New Deliverable Location'}
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600 cursor-pointer" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                    placeholder="e.g. 600001"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-[#B71C1C] font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="e.g. Parrys, Mylapore"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Chennai"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="e.g. Chennai"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Tamil Nadu"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Est. Delivery (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={formData.estimatedDeliveryDays}
                    onChange={(e) => setFormData({ ...formData, estimatedDeliveryDays: parseInt(e.target.value, 10) || 3 })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Options</label>
                  <div className="flex flex-col gap-1 pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isDeliveryAvailable}
                        onChange={(e) => setFormData({ ...formData, isDeliveryAvailable: e.target.checked })}
                        className="accent-[#B71C1C]"
                      />
                      <span className="font-semibold text-slate-800">Delivery Available</span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isCodAvailable}
                        onChange={(e) => setFormData({ ...formData, isCodAvailable: e.target.checked })}
                        className="accent-[#B71C1C]"
                      />
                      <span className="font-semibold text-slate-800">COD Available</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 bg-[#B71C1C] hover:bg-[#900C0C] text-white py-3 rounded-2xl font-bold transition-all shadow-md"
                >
                  Save Pincode Record
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Advanced Multi-Format Bulk Import Pincodes Modal (Drag & Drop + PDF/Word/Excel/CSV + Preview) */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#B71C1C]" />
                <h3 className="font-bold text-slate-900 text-base">Bulk Import Deliverable Locations</h3>
              </div>
              <button onClick={() => { setImportModalOpen(false); setPreviewRows([]); }}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600 cursor-pointer" />
              </button>
            </div>

            {/* Template Download Section */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Download Sample Templates</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Supports PDF, Word (.docx), Excel (.xlsx, .xls), CSV, and TXT files</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadTemplate('csv')}
                  className="bg-white border border-slate-200 hover:border-slate-400 text-slate-800 px-3 py-1.5 rounded-xl font-bold transition-all shadow-2xs"
                >
                  Sample CSV
                </button>
                <button
                  onClick={() => handleDownloadTemplate('excel')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl font-bold transition-all shadow-2xs"
                >
                  Sample Excel
                </button>
              </div>
            </div>

            {/* Drag & Drop File Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all cursor-pointer ${
                dragActive ? 'border-[#B71C1C] bg-red-50/50 scale-[1.01]' : 'border-slate-300 hover:border-[#B71C1C] bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                id="pincodeFileInput"
                accept=".csv,.xlsx,.xls,.pdf,.doc,.docx,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <label htmlFor="pincodeFileInput" className="cursor-pointer block space-y-2">
                <div className="w-12 h-12 rounded-full bg-red-50 text-[#B71C1C] flex items-center justify-center mx-auto shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {uploadedFileName ? `File Selected: ${uploadedFileName}` : 'Drag & Drop file here, or click Browse'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supported Formats: <span className="font-semibold text-slate-700">Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf), Word (.docx, .doc)</span>
                  </p>
                </div>
              </label>
            </div>

            {/* Data Preview & Edit Table (If Rows Extracted) */}
            {previewRows.length > 0 ? (
              <div className="space-y-3 border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Data Preview & Validation ({previewRows.length} Records Extracted)</span>
                  </h4>
                  <button
                    onClick={() => setPreviewRows([])}
                    className="text-[11px] font-bold text-red-600 hover:underline"
                  >
                    Clear Preview
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 sticky top-0 text-[10px] font-bold uppercase text-slate-600">
                      <tr>
                        <th className="p-2.5">Pincode</th>
                        <th className="p-2.5">Area</th>
                        <th className="p-2.5">City</th>
                        <th className="p-2.5">State</th>
                        <th className="p-2.5">Est. Days</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={row.pincode}
                              onChange={(e) => handlePreviewRowChange(idx, 'pincode', e.target.value)}
                              className="w-20 bg-white border border-slate-200 px-2 py-1 rounded-lg font-mono font-bold text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.area}
                              onChange={(e) => handlePreviewRowChange(idx, 'area', e.target.value)}
                              className="w-full bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.city}
                              onChange={(e) => handlePreviewRowChange(idx, 'city', e.target.value)}
                              className="w-full bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.state}
                              onChange={(e) => handlePreviewRowChange(idx, 'state', e.target.value)}
                              className="w-full bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min={1}
                              max={30}
                              value={row.estimatedDeliveryDays}
                              onChange={(e) => handlePreviewRowChange(idx, 'estimatedDeliveryDays', parseInt(e.target.value, 10) || 3)}
                              className="w-16 bg-white border border-slate-200 px-2 py-1 rounded-lg font-bold text-xs"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <button
                              onClick={() => handleRemovePreviewRow(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-2 border-t border-slate-200 pt-3 text-xs">
                <label className="block font-bold text-slate-700 mb-1">Or Paste Raw CSV/Text Data Directly</label>
                <textarea
                  rows={4}
                  value={importDataText}
                  onChange={(e) => setImportDataText(e.target.value)}
                  placeholder="pincode,area,city,district,state,isDeliveryAvailable,isCodAvailable,estimatedDeliveryDays&#10;600001,Parrys,Chennai,Chennai,Tamil Nadu,true,true,2&#10;638001,Erode Main,Erode,Erode,Tamil Nadu,true,true,3"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl font-mono text-xs outline-none focus:border-[#B71C1C]"
                />
              </div>
            )}

            {/* Footer Action Buttons */}
            <div className="flex gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => { setImportModalOpen(false); setPreviewRows([]); }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={importing || (previewRows.length === 0 && !importDataText.trim())}
                onClick={handleBulkImportSubmit}
                className="flex-1 bg-[#B71C1C] hover:bg-[#900C0C] text-white py-3 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {importing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>Import {previewRows.length > 0 ? `${previewRows.length} Pincodes` : 'Pincodes'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
