import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  Truck,
  RotateCcw,
  ShieldCheck,
  Award,
  DollarSign,
  Users,
  Repeat,
  ArrowRight
} from 'lucide-react';

export default function DesktopSidebarRight() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText('KARVIYAM25');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-[230px] xl:w-[260px] flex-shrink-0 flex flex-col gap-3">
      
      {/* 1. Coupon Card */}
      <div className="w-full h-[135px] bg-[#FFF0F2] border border-red-200/90 rounded-xl p-3 flex flex-col justify-between shadow-xs relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display font-black text-xl text-[#B71C1C] leading-none">
              Get 25% Off
            </h3>
            <p className="font-bold text-[11px] text-slate-800 mt-0.5">
              Up To ₹200 Off*
            </p>
          </div>
          
          <div className="w-10 h-10 rounded-xl bg-red-100/90 border border-red-200 text-[#B71C1C] flex items-center justify-center font-black text-xl shadow-2xs">
            %
          </div>
        </div>

        {/* Coupon Code Strip */}
        <div className="bg-white border border-dashed border-red-300 rounded-lg px-2.5 py-1 flex items-center justify-between text-[11px] font-bold text-slate-800">
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-400 font-semibold uppercase">CODE:</span>
            <span className="font-black text-[#B71C1C] text-[11px]">KARVIYAM25</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="p-0.5 hover:text-[#B71C1C] text-slate-500 transition-colors cursor-pointer"
            title="Copy Coupon Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <p className="text-[9px] text-slate-500 font-medium text-center">
          *On your first order | T&C apply
        </p>
      </div>

      {/* 2. Delivery & Policy Strip */}
      <div className="w-full h-[60px] bg-white rounded-xl border border-slate-200/90 shadow-xs px-2.5 py-1.5 flex items-center justify-between">
        <div className="flex-1 flex items-center gap-1.5 border-r border-slate-100 pr-1.5">
          <Truck className="w-3.5 h-3.5 text-[#B71C1C] shrink-0" />
          <div className="leading-tight">
            <span className="font-bold text-[9.5px] text-slate-900 block">Free Delivery</span>
            <span className="text-[8.5px] text-slate-500 block">Above ₹499</span>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-1.5 border-r border-slate-100 px-1.5">
          <RotateCcw className="w-3.5 h-3.5 text-[#B71C1C] shrink-0" />
          <div className="leading-tight">
            <span className="font-bold text-[9.5px] text-slate-900 block">Easy Returns</span>
            <span className="text-[8.5px] text-slate-500 block">14 days policy</span>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-1.5 pl-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#B71C1C] shrink-0" />
          <div className="leading-tight">
            <span className="font-bold text-[9.5px] text-slate-900 block">100% Secure</span>
            <span className="text-[8.5px] text-slate-500 block">Payments</span>
          </div>
        </div>
      </div>

      {/* 3. Premium Collection Banner */}
      <div className="w-full h-[165px] xl:h-[175px] bg-white rounded-xl border border-slate-200/90 shadow-xs p-3 flex items-center justify-between relative overflow-hidden">
        <div className="flex-1 flex flex-col justify-between h-full py-0.5 pr-1.5">
          <div>
            <div className="flex items-center gap-1">
              <span className="font-display font-black text-[11px] text-[#B71C1C] tracking-wider">
                KARVIYAM
              </span>
            </div>
            <h4 className="font-display font-black text-[11px] text-slate-900 uppercase tracking-tight mt-1">
              PREMIUM COLLECTION
            </h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">
              Timeless styles for every occasion.
            </p>
          </div>

          <button
            onClick={() => navigate('/shop?category=Jewellery')}
            className="flex items-center gap-1 text-[9.5px] font-extrabold uppercase tracking-wider text-slate-900 hover:text-[#B71C1C] transition-colors cursor-pointer"
          >
            <span>EXPLORE NOW</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Model Image */}
        <div className="w-[85px] xl:w-[95px] h-[140px] xl:h-[148px] shrink-0 rounded-lg overflow-hidden shadow-2xs">
          <img
            src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600"
            alt="Premium Collection"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* 4. Benefits List Card */}
      <div className="w-full h-[190px] xl:h-[200px] bg-white rounded-xl border border-slate-200/90 shadow-xs p-3 flex flex-col justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Award className="w-3.5 h-3.5 text-[#B71C1C]" />
          </div>
          <div>
            <h5 className="font-bold text-[11px] text-slate-900">Best Quality</h5>
            <p className="text-[9.5px] text-slate-500 font-medium">100% Original Products</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <DollarSign className="w-3.5 h-3.5 text-[#B71C1C]" />
          </div>
          <div>
            <h5 className="font-bold text-[11px] text-slate-900">Affordable Prices</h5>
            <p className="text-[9.5px] text-slate-500 font-medium">Best Prices in India</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Users className="w-3.5 h-3.5 text-[#B71C1C]" />
          </div>
          <div>
            <h5 className="font-bold text-[11px] text-slate-900">Trusted by Millions</h5>
            <p className="text-[9.5px] text-slate-500 font-medium">Happy Customers</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Repeat className="w-3.5 h-3.5 text-[#B71C1C]" />
          </div>
          <div>
            <h5 className="font-bold text-[11px] text-slate-900">Easy Exchange</h5>
            <p className="text-[9.5px] text-slate-500 font-medium">Hassle Free Exchange</p>
          </div>
        </div>
      </div>

    </aside>
  );
}
