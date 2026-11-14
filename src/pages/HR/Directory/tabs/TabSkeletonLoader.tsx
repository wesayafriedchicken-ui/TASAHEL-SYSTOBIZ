import React from 'react';

export const TabSkeletonLoader: React.FC = () => {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Top Header Card Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-200" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-slate-200 rounded-md" />
            <div className="h-3 w-64 bg-slate-100 rounded-md" />
          </div>
        </div>
        <div className="h-8 w-24 bg-slate-200 rounded-xl" />
      </div>

      {/* Grid or Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div className="w-8 h-8 rounded-xl bg-slate-200" />
              <div className="h-3 w-16 bg-slate-100 rounded-md" />
            </div>
            <div className="h-7 w-24 bg-slate-200 rounded-md" />
            <div className="h-3 w-32 bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Content / Table Card Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="h-4 w-36 bg-slate-200 rounded-md" />
          <div className="h-8 w-28 bg-slate-200 rounded-xl" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-none">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-slate-100" />
                <div className="h-3.5 w-48 bg-slate-200 rounded-md" />
              </div>
              <div className="h-3.5 w-24 bg-slate-100 rounded-md" />
              <div className="h-3.5 w-16 bg-slate-200 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabSkeletonLoader;
