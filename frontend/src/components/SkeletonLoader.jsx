import React from 'react';

export default function SkeletonLoader({ count = 6 }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-slate-100 rounded-xl h-[240px] sm:h-96 w-full flex flex-col justify-between p-2 border border-slate-200/60">
          <div className="bg-slate-200 h-[105px] sm:h-56 rounded-lg w-full" />
          <div className="space-y-1.5 mt-2 flex-1">
            <div className="bg-slate-200 h-3 rounded w-1/3" />
            <div className="bg-slate-200 h-3.5 rounded w-full" />
            <div className="bg-slate-200 h-4 rounded w-1/2" />
          </div>
          <div className="bg-slate-300 h-6 sm:h-10 rounded-md w-full mt-2" />
        </div>
      ))}
    </div>
  );
}
