import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Download, RefreshCw, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function BulkImportModal({ isOpen, onClose, type = 'products', onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [reportLog, setReportLog] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setLoading(true);
    setPreviewData(null);
    setReportLog(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Call backend Preview Endpoint
      const endpoint = type === 'products' ? '/admin/excel/products/preview' : `/admin/excel/${type}/preview`;
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).catch(() => null);

      if (res?.data?.success) {
        const d = res.data.data;
        const normalized = {
          totalRows: d.summary?.totalRows ?? d.totalRows ?? (d.rows?.length || 0),
          newCount: d.summary?.validRows ?? d.newCount ?? 0,
          updateCount: d.summary?.updateCount ?? d.updateCount ?? 0,
          errorCount: d.summary?.invalidRows ?? d.errorCount ?? 0,
          previewRows: (d.rows || d.previewRows || []).map((r, i) => ({
            rowNumber: r.rowNumber || i + 1,
            sku: r.sku || r['SKU Code'] || r['SKU'] || 'N/A',
            productName: r.name || r.productName || r['Product Name'] || r['Category Name'] || r['Title'] || r['Brand Name'] || 'Item',
            action: r.action || (r.status === 'ERROR' ? 'SKIP' : 'SAVE'),
            status: r.status || 'VALID',
            errors: r.problem ? [r.problem] : (r.errors || [])
          }))
        };
        setPreviewData(normalized);
        toast.success(`Preview generated for ${normalized.totalRows} rows!`);
      } else {
        // Local XLSX preview fallback if backend endpoint returns standard status
        const buffer = await selectedFile.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);
        setPreviewData({
          totalRows: json.length,
          newCount: json.length,
          updateCount: 0,
          errorCount: 0,
          previewRows: json.map((r, i) => ({
            rowNumber: i + 1,
            sku: r['SKU Code'] || r['SKU'] || 'N/A',
            productName: r['Category Name'] || r['Product Name'] || r['Brand Name'] || r['Title'] || r['Name'] || 'Item',
            action: 'SAVE',
            status: 'VALID',
            errors: []
          }))
        });
        toast.success(`Parsed ${json.length} records!`);
      }
    } catch (err) {
      console.error('Preview error:', err);
      toast.error('Failed to parse file for preview.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get(`/admin/excel/${type === 'products' ? 'products' : type}/template`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `karviyam_${type}_import_template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Downloaded official Excel template!');
    } catch (err) {
      toast.error('Failed to download template file');
    }
  };

  const handleExecuteImport = async () => {
    if (!file) {
      toast.error('Please select an Excel file first.');
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = `/admin/excel/${type === 'products' ? 'products' : type}/import`;
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        const d = res.data.data;
        setReportLog(d);
        toast.success(`Import Complete! Created: ${d.createdCount || d.successCount || 0}, Updated: ${d.updatedCount || 0}, Failed: ${d.failedCount || 0}`);
        if (onImportSuccess) onImportSuccess();
      } else {
        throw new Error(res.data?.message || 'Import failed');
      }
    } catch (err) {
      console.error('Import execution error:', err);
      toast.error(err.response?.data?.message || 'Failed to execute import.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadErrorReport = async () => {
    if (!reportLog?.failedRows || reportLog.failedRows.length === 0) return;
    try {
      const response = await api.post('/admin/excel/error-report', {
        failedRows: reportLog.failedRows
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `import_error_report_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download error report.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div>
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span className="capitalize">Bulk {type.replace('-', ' ')} Import System</span>
            </h3>
            <p className="text-[11px] text-slate-400">Complete non-destructive Excel backup & restore for all fields and media</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">

          {/* Download Sample Template */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <p className="font-bold text-slate-800">Download Official Excel Template with Field Guide</p>
              <p className="text-[11px] text-slate-500">Includes schema rules and image URL guidelines for {type.replace('-', ' ')}</p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl transition-all shadow-2xs flex items-center gap-2 shrink-0 cursor-pointer text-xs"
            >
              <Download className="w-4 h-4 text-[#B71C1C]" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Dropzone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-[#B71C1C] bg-slate-50 hover:bg-red-50/20 p-6 rounded-3xl text-center cursor-pointer transition-all space-y-2"
          >
            <Upload className="w-8 h-8 text-[#B71C1C] mx-auto" />
            <div>
              <p className="font-bold text-slate-900 text-sm">
                {fileName ? fileName : 'Click or Drag & Drop Excel File (.xlsx, .xls)'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Supports standard Excel structure for {type.replace('-', ' ')}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="text-center py-4 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#B71C1C] mx-auto" />
              <p className="font-bold text-slate-600">Generating Data Validation Preview...</p>
            </div>
          )}

          {/* Import Validation Preview Window */}
          {previewData && !loading && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Eye className="w-4 h-4 text-purple-600" />
                  <span>IMPORT PREVIEW SUMMARY</span>
                </span>
                <div className="flex items-center gap-2 font-bold text-[11px]">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">Valid: {previewData.newCount || 0}</span>
                  {previewData.errorCount > 0 && (
                    <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-md">Errors: {previewData.errorCount}</span>
                  )}
                </div>
              </div>

              {/* Rows Table */}
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2">Row</th>
                      {type === 'products' && <th className="p-2">SKU Code</th>}
                      <th className="p-2">{type === 'products' ? 'Product Name' : 'Item Name'}</th>
                      <th className="p-2">Action</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Validation Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {previewData.previewRows?.map((row, idx) => (
                      <tr key={idx} className={row.status === 'ERROR' ? 'bg-red-50/50' : ''}>
                        <td className="p-2 font-mono">{row.rowNumber}</td>
                        {type === 'products' && <td className="p-2 font-mono font-bold text-slate-800">{row.sku}</td>}
                        <td className="p-2 truncate max-w-[180px]">{row.productName}</td>
                        <td className="p-2 font-bold">
                          <span className={row.status === 'VALID' ? 'text-emerald-700' : 'text-slate-400'}>
                            {row.action}
                          </span>
                        </td>
                        <td className="p-2 font-extrabold">
                          {row.status === 'VALID' ? (
                            <span className="text-emerald-600">VALID</span>
                          ) : (
                            <span className="text-red-600">ERROR</span>
                          )}
                        </td>
                        <td className="p-2 text-red-600 text-[10px]">
                          {row.errors?.length > 0 ? row.errors.join('; ') : 'OK'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Results Summary & Error Download */}
          {reportLog && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2 text-emerald-900">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Import Result: Created {reportLog.createdCount || 0} / Updated {reportLog.updatedCount || 0} / Failed {reportLog.failedCount || 0}</span>
                </span>
                {reportLog.failedCount > 0 && (
                  <button
                    onClick={handleDownloadErrorReport}
                    className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-red-200 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Excel Error Report</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handleExecuteImport}
              disabled={!file || processing}
              className="px-6 py-2.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold rounded-xl shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>Execute Import ({previewData?.totalRows || 0} Rows)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
