import React from 'react';

export default function RevenueByCategory() {
  const segments = [
    { label: 'Electronics', value: 42, color: '#4f46e5' },
    { label: 'Fashion', value: 25, color: '#818cf8' },
    { label: 'Home & Living', value: 18, color: '#c7d2fe' },
    { label: 'Beauty', value: 15, color: '#e0e7ff' },
  ];

  const r = 30;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;

  let accumulatedPercent = 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col w-full">
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 font-display">Revenue by Category</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Distribution breakdown</p>
      </div>

      {/* Donut Chart Visual */}
      <div className="flex items-center justify-center py-6">
        <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90 overflow-visible">
          {segments.map((seg, idx) => {
            const segmentCircumference = (seg.value / 100) * circumference;
            // Subtract a small gap (2px) from segment stroke to create spacing
            const gap = 2;
            const strokeDash = `${segmentCircumference - gap} ${circumference - (segmentCircumference - gap)}`;
            const strokeOffset = -((accumulatedPercent / 100) * circumference);
            
            accumulatedPercent += seg.value;

            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={r}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={10}
                strokeDasharray={strokeDash}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
      </div>

      {/* Legend list */}
      <div className="space-y-3 mt-2 border-t border-gray-50 dark:border-slate-800/60 pt-4">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="font-semibold text-gray-700 dark:text-slate-300">{seg.label}</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">{seg.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
