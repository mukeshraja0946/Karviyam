import React from 'react';
import { X, ShieldCheck, FileText, Info, HelpCircle } from 'lucide-react';

export default function PolicyModal({ isOpen, onClose, title, content, lastUpdated }) {
  if (!isOpen) return null;

  const renderIcon = () => {
    const t = (title || '').toLowerCase();
    if (t.includes('return')) return <RotateCcwIcon className="w-5 h-5 text-[#B71C1C]" />;
    if (t.includes('terms')) return <FileText className="w-5 h-5 text-[#B71C1C]" />;
    if (t.includes('privacy')) return <ShieldCheck className="w-5 h-5 text-[#B71C1C]" />;
    return <Info className="w-5 h-5 text-[#B71C1C]" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] text-left animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#B71C1C] flex items-center justify-center font-bold shadow-2xs">
              {renderIcon()}
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-slate-900 uppercase tracking-tight leading-none">
                {title || 'Policy Information'}
              </h2>
              {lastUpdated && (
                <p className="text-[11px] font-medium text-slate-400 mt-1">
                  Last Updated: {lastUpdated}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto font-sans text-sm text-slate-700 leading-relaxed space-y-4">
          {content ? (
            <div
              className="prose prose-slate max-w-none text-slate-700 text-sm space-y-3 font-normal"
              dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }}
            />
          ) : (
            <div className="py-8 text-center text-slate-400 italic">
              No policy content has been configured by the store administrator.
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 font-medium">Karviyam E-Commerce Platform</span>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs px-5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

function RotateCcwIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
