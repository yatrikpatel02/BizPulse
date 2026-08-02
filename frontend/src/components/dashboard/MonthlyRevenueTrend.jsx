import React from 'react';

export default function MonthlyRevenueTrend() {
  const data = [
    { month: 'Jan', value: 92 },
    { month: 'Feb', value: 102 },
    { month: 'Mar', value: 115 },
    { month: 'Apr', value: 130 },
    { month: 'May', value: 144 },
    { month: 'Jun', value: 162 }
  ];

  // Graph dimensions
  const width = 500;
  const height = 240;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const yMax = 180;
  const yTicks = [0, 45, 90, 135, 180];

  // Helper to map data coordinates
  const getX = (index) => paddingLeft + (index * (chartWidth / (data.length - 1)));
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
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">January – June 2025</p>
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
                ₹{tick}K
              </text>
            </g>
          ))}

          {/* Shaded Area */}
          <polygon
            points={fillPoints}
            fill="url(#revenueAreaGradient)"
          />

          {/* Main Line */}
          <polyline
            fill="none"
            stroke="#4f46e5"
            strokeWidth={3}
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Marker Dots */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(d.value)}
              r={4.5}
              className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900"
              strokeWidth={2}
            />
          ))}

          {/* Month Labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={getX(i)}
              y={paddingTop + chartHeight + 22}
              className="text-[11px] font-semibold fill-gray-400 dark:fill-slate-500"
              textAnchor="middle"
            >
              {d.month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
