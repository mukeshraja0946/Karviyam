import React, { useEffect } from 'react';
import { X, Check, ArrowUpDown } from 'lucide-react';

export default function MobileSortSheet({ isOpen, onClose, currentSort, onSelectSort }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sortOptions = [
    { label: 'Newest Arrivals', value: 'id-desc' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Highest Rated', value: 'rating-desc' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 block md:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full bg-white rounded-t-3xl shadow-2xl p-5 border-t border-slate-200 animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-3">
          <div className="flex items-center gap-2 font-display font-extrabold text-slate-900 text-sm uppercase tracking-wider">
            <ArrowUpDown className="w-4 h-4 text-[#B71C1C]" />
            <span>SORT PRODUCTS</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-1 py-1">
          {sortOptions.map((opt) => {
            const isSelected = currentSort === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSelectSort(opt.value);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-red-50 text-[#B71C1C] border border-red-200 shadow-2xs'
                    : 'bg-slate-50/60 hover:bg-slate-100 text-slate-800 border border-transparent'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-[#B71C1C] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
