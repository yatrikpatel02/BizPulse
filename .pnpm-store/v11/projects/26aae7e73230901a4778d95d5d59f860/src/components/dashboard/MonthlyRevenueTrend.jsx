import React, { useState } from 'react';

export default function MonthlyRevenueTrend({ trends = [] }) {
  const data = (trends && trends.length > 0)
    ? trends.map(t => ({
        month: t.label || t.date || '',
        value: t.value !== undefined ? t.value : (t.revenue || 0)
      }))
    : [
        { month: 'Jan', value: 92 },
        { month: 'Feb', value: 102 },
        { month: 'Mar', value: 115 },
        { month: 'Apr', value: 130 },
        { month: 'May', value: 144 },
        { month: 'Jun', value: 162 }
      ];

  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Graph dimensions
  const width = 500;
  const height = 240;
  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Dynamically compute yMax and yTicks based on actual values
  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 10);
  const yMax = Math.ceil(maxVal * 1.15); // Add 15% headroom
  
  const tickStep = yMax / 4;
  const yTicks = [0, tickStep, tickStep * 2, tickStep * 3, yMax];

  const formatValue = (val) => {
    if (val >= 1000000) return `₹${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val.toFixed(0)}`;
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 2) {
      const year = parts[0];
      const monthNum = parseInt(parts[1], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (monthNum >= 1 && monthNum <= 12) {
        return `${months[monthNum - 1]} ${year}`;
      }
    }
    return dateStr;
  };

  const dateRangeSubtitle = (() => {
    if (trends && trends.length > 0 && data.length > 0) {
      const start = formatDateLabel(data[0].month);
      const end = formatDateLabel(data[data.length - 1].month);
      return `${start} – ${end}`;
    }
    return 'January – June 2025';
  })();

  // Helper to map data coordinates
  const getX = (index) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index * (chartWidth / (data.length - 1)));
  };
  const getY = (val) => paddingTop + chartHeight * (1 - (val / yMax));

  // Construct line path points
  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

  // Construct polygon points for filled gradient area below the line
  const fillPoints = `
    ${getX(0)},${paddingTop + chartHeight}
    ${points}
    ${getX(data.length - 1)},${paddingTop + chartHeight}
  `;

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col w-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 font-display">Monthly Revenue Trend</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{dateRangeSubtitle}</p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
          +14.2% YoY
        </span>
      </div>

      <div className="w-full mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={paddingLeft}
                y1={getY(tick)}
                x2={width - paddingRight}
                y2={getY(tick)}
                className="stroke-gray-100 dark:stroke-slate-800/80"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 12}
                y={getY(tick) + 4}
                className="text-[11px] font-semibold fill-gray-400 dark:fill-slate-500 text-right"
                textAnchor="end"
              >
                {formatValue(tick)}
              </text>
            </g>
          ))}

          {/* Shaded Area */}
          <polygon
            points={fillPoints}
            fill="url(#revenueAreaGradient)"
          />

          {/* Vertical guide line on hover */}
          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1={paddingTop}
              x2={getX(hoveredIndex)}
              y2={paddingTop + chartHeight}
              className="stroke-indigo-500/30 dark:stroke-indigo-400/25"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
          )}

          {/* Main Line */}
          <polyline
            fill="none"
            stroke="#4f46e5"
            strokeWidth={3}
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Static Marker Dots */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(d.value)}
              r={hoveredIndex === i ? 6 : 4.5}
              className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900 transition-all duration-150"
              strokeWidth={hoveredIndex === i ? 2.5 : 2}
            />
          ))}

          {/* Tooltip Popup */}
          {hoveredIndex !== null && (
            <g transform={`translate(${getX(hoveredIndex)}, ${getY(data[hoveredIndex].value) - 28})`} className="pointer-events-none select-none">
              {/* Tooltip Background Card */}
              <rect
                x={-35}
                y={-18}
                width={70}
                height={26}
                rx={6}
                className="fill-slate-900/90 dark:fill-slate-100/95"
              />
              {/* Tooltip Text */}
              <text
                className="text-[10px] font-bold fill-white dark:fill-slate-900 font-sans"
                textAnchor="middle"
                y={-1}
                dy=".3em"
              >
                {formatValue(data[hoveredIndex].value)}
              </text>
            </g>
          )}

          {/* Invisible larger hover triggers for easy mouse interactions */}
          {data.map((d, i) => (
            <circle
              key={`trigger-${i}`}
              cx={getX(i)}
              cy={getY(d.value)}
              r={20}
              className="fill-transparent cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}

          {/* Month Labels */}
          {(() => {
            const labelStep = Math.max(1, Math.ceil(data.length / 6));
            return data.map((d, i) => {
              if (i % labelStep !== 0) return null;
              return (
                <text
                  key={i}
                  x={getX(i)}
                  y={paddingTop + chartHeight + 22}
                  className="text-[11px] font-semibold fill-gray-400 dark:fill-slate-500"
                  textAnchor="middle"
                >
                  {formatDateLabel(d.month)}
                </text>
              );
            });
          })()}
        </svg>
      </div>
    </div>
  );
}
