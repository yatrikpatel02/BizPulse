import React, { useState } from 'react';

export default function RevenueByCategory({ productPerformance = [] }) {
  const segments = (productPerformance && productPerformance.length > 0)
    ? (() => {
        const categoryMap = {
          'Electronics': { value: 0, color: '#8b5cf6' },
          'Office & Computing': { value: 0, color: '#6366f1' },
          'Fashion & Apparel': { value: 0, color: '#3b82f6' },
          'General & Others': { value: 0, color: '#38bdf8' }
        };

        productPerformance.forEach(p => {
          const name = (p.label || p.product_name || '').toLowerCase();
          const rev = p.value !== undefined ? p.value : (p.total_revenue || 0);

          if (name.includes('phone') || name.includes('headphone') || name.includes('earbud') || name.includes('audio') || name.includes('speaker') || name.includes('sound') || name.includes('sonic') || name.includes('wifi') || name.includes('router') || name.includes('wireless') || name.includes('power')) {
            categoryMap['Electronics'].value += rev;
          } else if (name.includes('keyboard') || name.includes('mouse') || name.includes('monitor') || name.includes('laptop') || name.includes('stand') || name.includes('desktop') || name.includes('desk') || name.includes('office') || name.includes('mechanix') || name.includes('view')) {
            categoryMap['Office & Computing'].value += rev;
          } else if (name.includes('shoes') || name.includes('shoe') || name.includes('socks') || name.includes('clothing') || name.includes('shirt') || name.includes('jeans') || name.includes('apparel') || name.includes('sports') || name.includes('aero') || name.includes('stream')) {
            categoryMap['Fashion & Apparel'].value += rev;
          } else {
            categoryMap['General & Others'].value += rev;
          }
        });

        const total = Object.values(categoryMap).reduce((sum, c) => sum + c.value, 0);
        
        return Object.entries(categoryMap)
          .map(([label, c]) => ({
            label,
            value: total > 0 ? Math.round((c.value / total) * 100) : 0,
            color: c.color
          }))
          .filter(seg => seg.value > 0);
      })()
    : [
        { label: 'Electronics', value: 42, color: '#8b5cf6' },
        { label: 'Fashion', value: 25, color: '#6366f1' },
        { label: 'Home & Living', value: 18, color: '#3b82f6' },
        { label: 'Beauty', value: 15, color: '#38bdf8' },
      ];

  const [hoveredIdx, setHoveredIdx] = useState(null);

  const r = 37;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;

  let accumulatedPercent = 0;

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col w-full">
      <div>
        <h3 className="text-lg font-bold text-white font-display">Revenue by Category</h3>
        <p className="text-xs text-slate-500 font-medium">Distribution breakdown</p>
      </div>

      {/* Donut Chart Visual */}
      <div className="flex items-center justify-center py-6">
        <svg viewBox="0 0 100 100" className="w-44 h-44 transform -rotate-90 overflow-visible">
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
                style={hoveredIdx === idx ? { filter: `drop-shadow(0 0 6px ${seg.color}40)` } : {}}
                pointerEvents="stroke"
              />
            );
          })}

          {/* Donut Hole Centered Information */}
          {hoveredIdx !== null ? (
            <g className="text-center transform rotate-90 select-none pointer-events-none origin-center">
              <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                className={`${
                  segments[hoveredIdx].label.length > 8 ? 'text-[7px]' : 'text-[8.5px]'
                } font-bold uppercase tracking-wider`}
                fill="rgba(148,163,184,0.7)"
                textLength={segments[hoveredIdx].label.length > 8 ? "42" : undefined}
                lengthAdjust={segments[hoveredIdx].label.length > 8 ? "spacingAndGlyphs" : undefined}
              >
                {segments[hoveredIdx].label}
              </text>
              <text
                x={cx}
                y={cy + 10}
                textAnchor="middle"
                className="text-[14px] font-extrabold font-display"
                fill="#ffffff"
              >
                {segments[hoveredIdx].value}%
              </text>
            </g>
          ) : (
            <g className="text-center transform rotate-90 select-none pointer-events-none origin-center">
              <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                className="text-[8.5px] font-bold uppercase tracking-wider"
                fill="rgba(148,163,184,0.7)"
              >
                Total
              </text>
              <text
                x={cx}
                y={cy + 10}
                textAnchor="middle"
                className="text-[14px] font-extrabold font-display"
                fill="#ffffff"
              >
                100%
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend list */}
      <div className="space-y-1.5 mt-2 border-t border-white/[0.06] pt-4">
        {segments.map((seg, idx) => (
          <div 
            key={idx} 
            className={`flex items-center justify-between text-sm px-2.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
              hoveredIdx === idx 
                ? 'bg-violet-500/10 translate-x-1.5' 
                : 'hover:bg-white/[0.03]'
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
                hoveredIdx === idx ? 'text-violet-400 font-bold' : 'text-slate-400'
              }`}>{seg.label}</span>
            </div>
            <span className={`font-bold transition-colors ${
              hoveredIdx === idx ? 'text-violet-400 font-extrabold' : 'text-white'
            }`}>{seg.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
