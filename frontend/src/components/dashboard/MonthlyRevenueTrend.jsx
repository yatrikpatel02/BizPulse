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
    <div className="glass-card rounded-2xl p-6 flex flex-col w-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-bold text-white font-display">Monthly Revenue Trend</h3>
          <p className="text-xs text-slate-500 font-medium">{dateRangeSubtitle}</p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          +14.2% YoY
        </span>
      </div>

      <div className="w-full mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible chart-glow">
          <defs>
            <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
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
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 12}
                y={getY(tick) + 4}
                className="text-[11px] font-semibold"
                fill="rgba(148,163,184,0.6)"
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
              stroke="rgba(139,92,246,0.25)"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
          )}

          {/* Main Line */}
          <polyline
            fill="none"
            stroke="url(#lineGradient)"
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
              fill={hoveredIndex === i ? '#a855f7' : '#8b5cf6'}
              stroke="#0a0e1a"
              strokeWidth={hoveredIndex === i ? 2.5 : 2}
              className="transition-all duration-150"
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
                fill="rgba(139,92,246,0.9)"
              />
              {/* Tooltip Text */}
              <text
                className="text-[10px] font-bold font-sans"
                fill="#ffffff"
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
                  className="text-[11px] font-semibold"
                  fill="rgba(148,163,184,0.5)"
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
