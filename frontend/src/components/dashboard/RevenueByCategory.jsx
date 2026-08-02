import React, { useState } from 'react';

export default function RevenueByCategory() {
  const segments = [
    { label: 'Electronics', value: 42, color: '#4f46e5' },
    { label: 'Fashion', value: 25, color: '#818cf8' },
    { label: 'Home & Living', value: 18, color: '#c7d2fe' },
    { label: 'Beauty', value: 15, color: '#e0e7ff' },
  ];

  const [hoveredIdx, setHoveredIdx] = useState(null);

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
                fill="none"
                stroke={seg.color}
                strokeWidth={hoveredIdx === idx ? 13 : 10}
                strokeDasharray={strokeDash}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="transition-all duration-300 ease-out cursor-pointer"
                pointerEvents="stroke"
              />
            );
          })}

          {/* Donut Hole Centered Information */}
          {hoveredIdx !== null ? (
            <g className="text-center transform rotate-90 select-none pointer-events-none origin-center">
              <text
                x={cx}
                y={cy - 5}
                textAnchor="middle"
                className={`${
                  segments[hoveredIdx].label.length > 8 ? 'text-[5px]' : 'text-[6.5px]'
                } font-bold fill-gray-400 dark:fill-slate-500 uppercase tracking-wider`}
                textLength={segments[hoveredIdx].label.length > 8 ? "34" : undefined}
                lengthAdjust={segments[hoveredIdx].label.length > 8 ? "spacingAndGlyphs" : undefined}
              >
                {segments[hoveredIdx].label}
              </text>
              <text
                x={cx}
                y={cy + 9}
                textAnchor="middle"
                className="text-[12px] font-extrabold fill-gray-900 dark:fill-white font-display"
              >
                {segments[hoveredIdx].value}%
              </text>
            </g>
          ) : (
            <g className="text-center transform rotate-90 select-none pointer-events-none origin-center">
              <text
                x={cx}
                y={cy - 5}
                textAnchor="middle"
                className="text-[6.5px] font-bold fill-gray-400 dark:fill-slate-500 uppercase tracking-wider"
              >
                Total
              </text>
              <text
                x={cx}
                y={cy + 9}
                textAnchor="middle"
                className="text-[12px] font-extrabold fill-gray-900 dark:fill-white font-display"
              >
                100%
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend list */}
      <div className="space-y-1.5 mt-2 border-t border-gray-50 dark:border-slate-800/60 pt-4">
        {segments.map((seg, idx) => (
          <div 
            key={idx} 
            className={`flex items-center justify-between text-sm px-2.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
              hoveredIdx === idx 
                ? 'bg-indigo-50/50 dark:bg-indigo-950/20 translate-x-1.5' 
                : 'hover:bg-gray-50/50 dark:hover:bg-slate-850/30'
            }`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div className="flex items-center gap-2">
              <span 
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className={`font-semibold transition-colors ${
                hoveredIdx === idx ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-700 dark:text-slate-350'
              }`}>{seg.label}</span>
            </div>
            <span className={`font-bold transition-colors ${
              hoveredIdx === idx ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-gray-900 dark:text-white'
            }`}>{seg.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
