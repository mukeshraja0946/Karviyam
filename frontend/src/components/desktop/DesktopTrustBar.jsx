import React from 'react';
import {
  Award,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Tag
} from 'lucide-react';

export default function DesktopTrustBar() {
  return (
    <div className="w-full bg-white border-t border-b border-slate-200/80 py-2.5 px-3 sm:px-4 mt-3">
      <div className="max-w-[1560px] w-full mx-auto flex items-center justify-between gap-2.5 xl:gap-3 overflow-x-auto no-scrollbar">
        
        {/* Item 1 */}
        <div className="flex items-center gap-2 bg-slate-50/60 px-3 py-1.5 rounded-lg border border-slate-100 flex-1 min-w-[170px]">
          <div className="w-7 h-7 rounded-full bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div>
            <h5 className="font-extrabold text-[11px] text-slate-900 leading-tight">100% Original Products</h5>
            <p className="text-[9.5px] text-slate-500 font-medium">Sourced Directly</p>
          </div>
        </div>

        {/* Item 2 */}
        <div className="flex items-center gap-2 bg-slate-50/60 px-3 py-1.5 rounded-lg border border-slate-100 flex-1 min-w-[170px]">
          <div className="w-7 h-7 rounded-full bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <h5 className="font-extrabold text-[11px] text-slate-900 leading-tight">Secure Payments</h5>
            <p className="text-[9.5px] text-slate-500 font-medium">Multiple Options</p>
          </div>
        </div>

        {/* Item 3 */}
        <div className="flex items-center gap-2 bg-slate-50/60 px-3 py-1.5 rounded-lg border border-slate-100 flex-1 min-w-[170px]">
          <div className="w-7 h-7 rounded-full bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
            <RotateCcw className="w-3.5 h-3.5" />
          </div>
          <div>
            <h5 className="font-extrabold text-[11px] text-slate-900 leading-tight">Easy Returns & Refunds</h5>
            <p className="text-[9.5px] text-slate-500 font-medium">Hassle Free Process</p>
          </div>
        </div>

        {/* Item 4 */}
        <div className="flex items-center gap-2 bg-slate-50/60 px-3 py-1.5 rounded-lg border border-slate-100 flex-1 min-w-[170px]">
          <div className="w-7 h-7 rounded-full bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <div>
            <h5 className="font-extrabold text-[11px] text-slate-900 leading-tight">Customer Support</h5>
            <p className="text-[9.5px] text-slate-500 font-medium">24/7 Dedicated Assistance</p>
          </div>
        </div>

        {/* Item 5 */}
        <div className="flex items-center gap-2 bg-slate-50/60 px-3 py-1.5 rounded-lg border border-slate-100 flex-1 min-w-[170px]">
          <div className="w-7 h-7 rounded-full bg-red-50 text-[#B71C1C] flex items-center justify-center shrink-0">
            <Tag className="w-3.5 h-3.5" />
          </div>
          <div>
            <h5 className="font-extrabold text-[11px] text-slate-900 leading-tight">Best Price Guarantee</h5>
            <p className="text-[9.5px] text-slate-500 font-medium">Unmatched Value</p>
          </div>
        </div>

      </div>
    </div>
  );
}
