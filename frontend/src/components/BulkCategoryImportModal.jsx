import React, { useState } from 'react';
import { X, Upload, FileText, Download, CheckCircle, AlertTriangle, Trash2, Edit3, ShieldAlert, FileCheck, Layers, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function BulkCategoryImportModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  
  // Import Options
  const [skipExisting, setSkipExisting] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [createMissingParent, setCreateMissingParent] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  if (!isOpen) return null;

  // Handle File Selection
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      processFile(dropped);
    }
  };

  const processFile = (fileObj) => {
    setFile(fileObj);
    setIsProcessing(true);

    const fileName = fileObj.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        let rows = [];

        if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.txt')) {
          rows = parseCSVText(text);
        } else if (fileName.endsWith('.pdf')) {
          rows = parsePDFText(text);
        } else {
          rows = parseCSVText(text);
        }

        setParsedRows(rows);
        toast.success(`Successfully parsed ${rows.length} category records!`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse file format. Please check template format.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsText(fileObj);
  };

  // CSV / Text Line Parser
  const parseCSVText = (content) => {
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length === 0 || (values.length === 1 && !values[0])) continue;

      const rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] ? values[idx].trim() : '';
      });

      const parsedItem = mapRowToCategory(rowObj, i);
      data.push(parsedItem);
    }

    return data;
  };

  const parseLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === '\t') && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  };

  const parsePDFText = (content) => {
    return parseCSVText(content);
  };

  // Row Mapping
  const mapRowToCategory = (rawMap, index) => {
    const getValue = (...keys) => {
      for (const k of keys) {
        const normKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (rawMap[normKey] !== undefined && rawMap[normKey] !== '') {
          return rawMap[normKey];
        }
      }
      return '';
    };

    const mainCategory = getValue('maincategory', 'category', 'type');
    const subcategory = getValue('subcategory', 'childcategory', 'name');
    const parentCategory = getValue('parentcategory', 'parent');
    const description = getValue('description', 'desc');
    const displayOrderStr = getValue('displayorder', 'order', 'orderindex');
    const statusStr = getValue('status', 'activestatus', 'active');
    const imageUrl = getValue('categoryimageurl', 'imageurl', 'image');
    const bannerUrl = getValue('categorybannerurl', 'bannerurl', 'banner');
    const iconUrl = getValue('categoryiconurl', 'iconurl', 'icon');
    const seoTitle = getValue('seotitle');
    const seoSlug = getValue('seoslug', 'slug');
    const seoDescription = getValue('seodescription', 'metadescription');
    const metaKeywords = getValue('metakeywords', 'keywords');

    const displayOrder = parseInt(displayOrderStr, 10) || (index + 1);
    const isActive = statusStr.toLowerCase() !== 'inactive' && statusStr.toLowerCase() !== 'false';

    const targetName = subcategory || mainCategory;

    const errors = [];
    if (!targetName) errors.push('Category Name missing');

    return {
      _id: index,
      mainCategory: mainCategory || 'WOMEN',
      subcategory: subcategory || '',
      parentCategory: parentCategory || (subcategory ? mainCategory : ''),
      description: description || `${targetName} collection and styles.`,
      displayOrder: displayOrder,
      activeStatus: isActive,
      imageUrl: imageUrl || '',
      bannerUrl: bannerUrl || '',
      iconUrl: iconUrl || '',
      seoTitle: seoTitle || targetName,
      seoSlug: seoSlug || '',
      seoDescription: seoDescription || `${targetName} products catalog`,
      metaKeywords: metaKeywords || `${targetName}, fashion, shopping`,
      isValid: errors.length === 0,
      errors: errors
    };
  };

  const handleCellEdit = (index, field, value) => {
    setParsedRows(prev => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };
      
      const errors = [];
      const targetName = row.subcategory || row.mainCategory;
      if (!targetName || !targetName.trim()) errors.push('Category Name missing');

      row.isValid = errors.length === 0;
      row.errors = errors;

      updated[index] = row;
      return updated;
    });
  };

  const handleRemoveRow = (index) => {
    setParsedRows(prev => prev.filter((_, i) => i !== index));
  };

  // Execute Bulk Category Import API
  const handleStartImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (!validRows.length) {
      toast.error('No valid category records to import!');
      return;
    }

    setImporting(true);
    try {
      const query = `skipExisting=${skipExisting}&updateExisting=${updateExisting}&createMissingParent=${createMissingParent}`;
      const res = await api.post(`/categories/bulk-import?${query}`, validRows);
      const apiData = res.data ? res.data : res;
      const result = apiData.data || apiData;

      if (apiData) {
        const created = result.createdCount ?? result.successCount ?? result.created ?? validRows.length;
        const updated = result.updatedCount ?? result.updated ?? 0;
        const failed = result.failedCount ?? result.failed ?? 0;

        setImportResult(result);
        toast.success(`Import Complete! Created: ${created}, Updated: ${updated}, Failed: ${failed}`);

        window.dispatchEvent(new CustomEvent('karviyam_categories_updated'));
        window.dispatchEvent(new CustomEvent('karviyam_parent_categories_updated'));
        window.dispatchEvent(new Event('storage'));

        if (onSuccess) {
          await onSuccess(result);
        }
        setParsedRows([]);
        setFile(null);
        if (onClose) {
          onClose();
        }
      }
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Bulk category import failed. Please check network connection.');
      // Keep modal open on error so the user can inspect errors and retry
    } finally {
      setImporting(false);
    }
  };

  // Download Sample CSV / Excel Template
  const downloadSampleCSV = () => {
    const csvContent = 
`Main Category,Subcategory,Parent Category,Description,Display Order,Status,Category Image URL,Category Banner URL,Category Icon URL,SEO Title,SEO Slug,SEO Description,Meta Keywords
Women,Sarees,Women,Traditional and modern Indian sarees,1,Active,,,,"Women Sarees","women-sarees","Buy authentic sarees online","saree, ethnic, silk"
Women,Kanjeevaram Sarees,Sarees,Authentic Kanjeevaram soft silk sarees,2,Active,,,,"Kanjeevaram Sarees","kanjeevaram-sarees","Soft zari silk sarees","kanjeevaram, silk, bridal"
Men,Shirts,Men,Casual and formal men shirts,1,Active,,,,"Men Shirts","men-shirts","Casual & formal linen shirts","men shirts, linen, formal"
Kids & Baby,Toys,Kids & Baby,Action toys and remote control cars,1,Active,,,,"Kids Toys","kids-toys","Fun toys for children","toys, rc cars, dolls"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Karviyam_Category_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample Category CSV template downloaded!');
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#B71C1C] flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900">Bulk Category & Subcategory Import</h2>
              <p className="text-xs text-slate-500">Import category hierarchies using Excel (.xlsx/.xls), CSV (.csv), or PDF files</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">

          {/* Download Template & Upload Box */}
          {!parsedRows.length && !importResult && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-red-50/40 rounded-2xl border border-red-100">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#B71C1C]" />
                  <span className="font-bold text-slate-800 text-xs">Need a Category Template?</span>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="flex items-center gap-1.5 bg-white text-[#B71C1C] border border-[#B71C1C]/30 hover:bg-red-50 px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Excel / CSV Template</span>
                </button>
              </div>

              {/* Upload Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 hover:border-[#B71C1C] rounded-3xl p-10 flex flex-col items-center justify-center gap-3 bg-slate-50 hover:bg-red-50/20 cursor-pointer transition-all text-center"
              >
                <div className="w-14 h-14 rounded-full bg-red-100 text-[#B71C1C] flex items-center justify-center shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Click or Drag & Drop Category File</p>
                  <p className="text-xs text-slate-400 mt-1">Supports Excel (.xlsx, .xls), CSV (.csv), or PDF (.pdf)</p>
                </div>
                <label className="bg-[#B71C1C] hover:bg-[#900C0C] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer mt-2">
                  <span>Browse File</span>
                  <input type="file" accept=".csv,.xlsx,.xls,.pdf,.txt" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* Import Result Screen */}
          {importResult && (
            <div className="space-y-4 p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-3 text-emerald-800">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm">Bulk Category Import Summary</h3>
                  <p className="text-xs text-emerald-700">Finished processing {importResult.totalRecords} category rows.</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                  <span className="block text-base font-bold text-emerald-600">{importResult.successCount}</span>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Imported</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-blue-200">
                  <span className="block text-base font-bold text-blue-600">{importResult.updatedCount}</span>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Updated</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                  <span className="block text-base font-bold text-amber-600">{importResult.skippedCount}</span>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Skipped</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-red-200">
                  <span className="block text-base font-bold text-red-600">{importResult.failedCount}</span>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Failed</span>
                </div>
              </div>

              {importResult.logs && importResult.logs.length > 0 && (
                <div className="bg-slate-900 text-slate-200 p-3 rounded-xl max-h-40 overflow-y-auto font-mono text-[11px] space-y-1">
                  {importResult.logs.map((log, idx) => (
                    <div key={idx}>• {log}</div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setImportResult(null);
                  setParsedRows([]);
                  setFile(null);
                }}
                className="w-full bg-[#B71C1C] hover:bg-[#900C0C] text-white py-2.5 rounded-xl font-bold uppercase tracking-wider cursor-pointer"
              >
                Import Another File
              </button>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && !importResult && (
            <div className="space-y-3">
              
              {/* Options Checklist */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipExisting}
                    onChange={(e) => setSkipExisting(e.target.checked)}
                    className="accent-[#B71C1C]"
                  />
                  <span>Skip Existing</span>
                </label>

                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="accent-[#B71C1C]"
                  />
                  <span>Update Existing</span>
                </label>

                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createMissingParent}
                    onChange={(e) => setCreateMissingParent(e.target.checked)}
                    className="accent-[#B71C1C]"
                  />
                  <span>Auto-Create Parent</span>
                </label>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-2xl overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase sticky top-0">
                    <tr>
                      <th className="p-3">Main Category</th>
                      <th className="p-3">Subcategory / Name *</th>
                      <th className="p-3">Parent Category</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Order</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={!row.isValid ? 'bg-red-50/50' : 'hover:bg-slate-50/80'}>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.mainCategory}
                            onChange={(e) => handleCellEdit(idx, 'mainCategory', e.target.value)}
                            className="w-full bg-transparent border-b border-slate-200 p-1 outline-none text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.subcategory || row.mainCategory}
                            onChange={(e) => handleCellEdit(idx, 'subcategory', e.target.value)}
                            className={`w-full bg-transparent border-b ${!row.isValid ? 'border-red-500 font-bold text-red-600' : 'border-slate-200'} p-1 outline-none text-xs`}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.parentCategory}
                            onChange={(e) => handleCellEdit(idx, 'parentCategory', e.target.value)}
                            className="w-full bg-transparent border-b border-slate-200 p-1 outline-none text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.description}
                            onChange={(e) => handleCellEdit(idx, 'description', e.target.value)}
                            className="w-full bg-transparent border-b border-slate-200 p-1 outline-none text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={row.displayOrder}
                            onChange={(e) => handleCellEdit(idx, 'displayOrder', e.target.value)}
                            className="w-14 bg-transparent border-b border-slate-200 p-1 outline-none text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.activeStatus ? 'Active' : 'Inactive'}
                            onChange={(e) => handleCellEdit(idx, 'activeStatus', e.target.value === 'Active')}
                            className="bg-transparent border-b border-slate-200 p-1 outline-none text-xs"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </td>
                        <td className="p-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {parsedRows.length > 0 && !importResult && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
            <span className="text-xs font-bold text-slate-600">{validCount} categories ready to import</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importing || validCount === 0}
                onClick={handleStartImport}
                className="flex items-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                {importing && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Import {validCount} Categories</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
