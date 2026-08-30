import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown, FileCode, Printer } from 'lucide-react';
import ExportPreviewModal from './ExportPreviewModal';

export default function ExportDropdown({
  filename = 'karviyam_report',
  title = 'Data Report',
  headers = [],
  data = [],
  customExcelHandler = null
}) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pdf');
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

  const openPreview = (tabName) => {
    setActiveTab(tabName);
    setOpen(false);
    setModalOpen(true);
  };

  return (
    <>
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
          <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => openPreview('pdf')}
              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 font-bold text-slate-700 hover:text-red-700 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-red-600" />
              <span>Export & Print PDF</span>
            </button>
            <button
              onClick={() => openPreview('excel')}
              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 font-bold text-slate-700 hover:text-emerald-700 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => openPreview('csv')}
              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 font-bold text-slate-700 hover:text-blue-700 cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-blue-600" />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      <ExportPreviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={title}
        filename={filename}
        headers={headers}
        data={data}
        customExcelHandler={customExcelHandler}
        activeTab={activeTab}
      />
    </>
  );
}

