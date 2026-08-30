import React, { useState } from 'react';
import { X, FileSpreadsheet, FileText, Download, Eye, Check, Printer, FileCode } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';
import toast from 'react-hot-toast';

export default function ExportPreviewModal({
  isOpen,
  onClose,
  title = 'Data Export Preview',
  filename = 'karviyam_export',
  headers = [],
  data = [],
  customExcelHandler = null,
  activeTab = 'pdf'
}) {
  const [tab, setTab] = useState(activeTab || 'pdf');

  if (!isOpen) return null;

  const handleExportExcel = async () => {
    try {
      if (typeof customExcelHandler === 'function') {
        await customExcelHandler();
      } else {
        exportToExcel(filename, headers, data);
        toast.success(`Exported ${data.length} records to Excel spreadsheet! 📊`);
      }
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Failed to export Excel file');
    }
  };

  const handleExportPDF = () => {
    try {
      exportToPDF(filename, title, headers, data);
      toast.success(`Opening PDF Print Preview... 📄`);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF document');
    }
  };

  const handleExportCSV = () => {
    try {
      exportToCSV(filename, headers, data);
      toast.success(`Exported ${data.length} records to CSV! 📝`);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Failed to export CSV file');
    }
  };

  const previewLimit = 50;
  const previewData = data.slice(0, previewLimit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <span>Export & PDF Print Preview</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                  {data.length} Records
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">{title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab & Format Controls */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('pdf')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                tab === 'pdf'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Document Preview</span>
            </button>

            <button
              onClick={() => setTab('excel')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                tab === 'excel'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (.xlsx) Preview</span>
            </button>

            <button
              onClick={() => setTab('csv')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                tab === 'csv'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>CSV Data</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing first {previewData.length} of {data.length} items
          </div>
        </div>

        {/* Document Preview Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
            
            {/* Report Letterhead Header */}
            <div className="flex items-center justify-between border-b-2 border-red-700 pb-4">
              <div>
                <h3 className="font-extrabold text-xl text-red-800 tracking-tight">KARVIYAM ENTERPRISE</h3>
                <p className="text-xs text-slate-500 font-semibold">{title}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-red-50 text-red-700 font-bold text-2xs uppercase tracking-wider rounded-md border border-red-200">
                  Official Export
                </span>
                <p className="text-2xs text-slate-400 mt-1">{new Date().toLocaleString()}</p>
              </div>
            </div>

            {/* Document Data Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-2xs uppercase tracking-wider font-bold">
                    <th className="p-2.5 border-r border-slate-800">#</th>
                    {headers.map((h, i) => (
                      <th key={i} className="p-2.5 border-r border-slate-800 last:border-r-0 whitespace-nowrap">
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {previewData.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70 hover:bg-slate-100'}>
                      <td className="p-2.5 font-bold text-slate-400 border-r border-slate-200">{idx + 1}</td>
                      {headers.map((h, i) => {
                        let val = h.accessor
                          ? typeof h.accessor === 'function'
                            ? h.accessor(item)
                            : item[h.accessor]
                          : '';
                        return (
                          <td key={i} className="p-2.5 border-r border-slate-200 last:border-r-0 max-w-xs truncate">
                            {val !== null && val !== undefined ? String(val) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.length > previewLimit && (
              <p className="text-2xs text-center text-slate-400 font-medium italic">
                ...and {data.length - previewLimit} more rows will be included in your full export file/document.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Export & Print PDF</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
