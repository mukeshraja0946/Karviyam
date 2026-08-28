import React, { useState } from 'react';
import { Trash2, X, CheckSquare, AlertCircle, Loader2 } from 'lucide-react';

export default function BulkActionBar({
  selectedCount = 0,
  totalCount = 0,
  isAllDatasetSelected = false,
  onSelectAllDataset = null,
  onDeleteSelected = () => {},
  onClearSelection = () => {},
  moduleName = 'Items',
  loading = false
}) {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  if (selectedCount === 0) return null;

  const handleDeleteConfirm = () => {
    setConfirmModalOpen(false);
    onDeleteSelected();
  };

  return (
    <>
      {/* Floating Bulk Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl bg-slate-900 text-white p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#B71C1C] flex items-center justify-center font-black text-xs">
            {selectedCount}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-100 flex items-center gap-2">
              <span>{selectedCount} {moduleName} Selected</span>
              {isAllDatasetSelected && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-extrabold uppercase">
                  Full Dataset ({totalCount})
                </span>
              )}
            </p>
            {totalCount > selectedCount && onSelectAllDataset && !isAllDatasetSelected && (
              <button
                type="button"
                onClick={onSelectAllDataset}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline font-bold transition-colors cursor-pointer text-left"
              >
                Select all {totalCount} {moduleName.toLowerCase()} across all pages
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setConfirmModalOpen(true)}
            disabled={loading}
            className="flex-1 sm:flex-initial px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-white" />}
            <span>Delete Selected ({selectedCount})</span>
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Selection</span>
          </button>
        </div>
      </div>

      {/* Selected Items Confirmation Dialog Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 text-slate-900">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-base text-slate-900">
                  Delete {selectedCount} Selected {moduleName}?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Are you sure you want to delete the <strong className="font-bold text-slate-900">{selectedCount} selected {moduleName.toLowerCase()}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete ({selectedCount})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
