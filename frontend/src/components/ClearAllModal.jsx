import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, ArrowRight, ShieldAlert } from 'lucide-react';

export default function ClearAllModal({
  isOpen,
  onClose,
  moduleName = 'Records',
  itemCount = 0,
  onConfirm,
  loading = false
}) {
  const [step, setStep] = useState(1);
  const [confirmInput, setConfirmInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setConfirmInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmDisabled = confirmInput.trim() !== 'CLEAR ALL';

  const handleNextStep = () => {
    setStep(2);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (isConfirmDisabled || loading) return;
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900 my-8">
        
        {/* Header Bar */}
        <div className="bg-rose-950 px-6 py-4 flex items-center justify-between text-white border-b border-rose-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base tracking-tight text-white">
                {step === 1 ? `Clear All ${moduleName} Data` : 'FINAL CONFIRMATION'}
              </h3>
              <p className="text-[11px] text-rose-200/80 font-medium">
                Step {step} of 2 • High Risk Action
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 1 ? (
          /* STEP 1: Warning & Count Display */
          <div className="p-6 space-y-5">
            <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 space-y-1">
                <p className="font-extrabold text-sm uppercase tracking-wide">
                  ⚠️ Clear All {moduleName} Data
                </p>
                <p className="leading-relaxed font-medium">
                  You are about to permanently delete <strong className="font-bold text-rose-950">{itemCount} {moduleName.toLowerCase()}</strong> and their associated module data. This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Exact Count Highlight Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 text-center space-y-1 border border-slate-800 shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Dataset Records</span>
              <div className="text-3xl font-black font-display text-rose-400 tracking-tight">
                {itemCount} {moduleName}
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {itemCount === 0 ? 'No active records currently exist.' : 'This will purge all module records across the system.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                disabled={itemCount === 0}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: Explicit Text Confirmation */
          <form onSubmit={handleFinalSubmit} className="p-6 space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
              <p className="font-extrabold text-xs uppercase text-amber-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>FINAL CONFIRMATION</span>
              </p>
              <p className="leading-relaxed font-medium">
                Type <strong className="font-black text-rose-600">CLEAR ALL</strong> to permanently delete all {itemCount} {moduleName.toLowerCase()}.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Confirmation Prompt:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Type CLEAR ALL here"
                autoFocus
                className="w-full bg-slate-50 border-2 border-rose-200 focus:border-rose-600 p-3 rounded-xl font-mono text-sm font-bold text-slate-900 outline-none uppercase placeholder:text-slate-400 placeholder:font-sans transition-colors"
              />
              <p className="text-[10px] text-slate-500 font-medium">
                Enter <strong className="font-bold text-slate-700">CLEAR ALL</strong> to unlock deletion.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isConfirmDisabled || loading}
                className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>{loading ? 'Deleting...' : 'DELETE ALL DATA'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
