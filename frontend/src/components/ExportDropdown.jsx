import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown, FileCode } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';
import toast from 'react-hot-toast';

export default function ExportDropdown({ filename = 'report', title = 'Data Report', headers = [], data = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (format) => {
    setOpen(false);
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }

    try {
      if (format === 'csv') {
        exportToCSV(filename, headers, data);
        toast.success(`Exported ${data.length} records to CSV! 📝`);
      } else if (format === 'excel') {
        exportToExcel(filename, headers, data);
        toast.success(`Exported ${data.length} records to Excel! 📊`);
      } else if (format === 'pdf') {
        exportToPDF(filename, title, headers, data);
        toast.success(`Generating PDF Report for ${data.length} records... 📄`);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200 shadow-2xs"
      >
        <Download className="w-3.5 h-3.5 text-[#B71C1C]" />
        <span>Export Data</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
          <button
            onClick={() => handleExport('excel')}
            className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 font-bold text-slate-700 hover:text-emerald-700 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 font-bold text-slate-700 hover:text-blue-700 cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-blue-600" />
            <span>CSV File</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 font-bold text-slate-700 hover:text-[#B71C1C] cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#B71C1C]" />
            <span>PDF Document</span>
          </button>
        </div>
      )}
    </div>
  );
}
