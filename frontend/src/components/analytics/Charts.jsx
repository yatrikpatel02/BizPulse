import React, { useState, useRef, useEffect } from 'react';

/**
 * Shared SVG Gradients Definition Component
 */
export function ChartGradients() {
  return (
    <svg className="absolute w-0 h-0" width="0" height="0">
      <defs>
        <linearGradient id="area-indigo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
        </linearGradient>
        <linearGradient id="area-emerald" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
        </linearGradient>
        <linearGradient id="grad-indigo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="grad-emerald" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="grad-blue" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="grad-rose" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Premium SVG Area / Line Chart
 */
export function AreaChart({ data = [], xKey = 'label', yKey = 'value', height = 240, color = 'indigo', valuePrefix = '₹' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/20 dark:border-slate-800/50 backdrop-blur-md" style={{ height }}>
        <p className="text-gray-400 dark:text-slate-500 text-sm">No trend data available</p>
      </div>
    );
  }

  const values = data.map(d => Number(d[yKey]) || 0);
  const maxVal = Math.max(...values, 100) * 1.15; // 15% padding at top
  const minVal = 0;

  const svgWidth = 600;
  const svgHeight = height;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Generate coordinates
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1 || 1)) * chartWidth;
    const val = Number(d[yKey]) || 0;
    const y = svgHeight - paddingBottom - ((val - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, item: d, val };
  });

  // SVG paths
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`
    : '';

  // Y-axis grid labels
  const yTicks = 4;
  const yLabelValues = Array.from({ length: yTicks + 1 }, (_, i) => minVal + (maxVal - minVal) * (i / yTicks));

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert mouseX to SVG space coordinates
    const scaleX = svgWidth / rect.width;
    const svgMouseX = mouseX * scaleX;

    // Find closest point index
    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((p, idx) => {
      const diff = Math.abs(p.x - svgMouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setHoveredIndex(closestIdx);
    
    // Scale tooltip screen position back
    const scaleY = rect.height / svgHeight;
    setTooltipPos({
      x: points[closestIdx].x / scaleX,
      y: points[closestIdx].y / scaleX - 10
    });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const fillGradient = color === 'emerald' ? 'url(#area-emerald)' : 'url(#area-indigo)';
  const strokeColor = color === 'emerald' ? '#10b981' : '#6366f1';

  return (
    <div 
      className="relative w-full overflow-visible"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height={svgHeight} className="overflow-visible select-none">
        {/* Grid lines */}
        {yLabelValues.map((v, i) => {
          const y = svgHeight - paddingBottom - (i / yTicks) * chartHeight;
          return (
            <g key={i} className="opacity-40">
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={svgWidth - paddingRight} 
                y2={y} 
                stroke="currentColor" 
                className="text-gray-200 dark:text-slate-800" 
                strokeDasharray="4 4"
              />
              <text 
                x={paddingLeft - 10} 
                y={y + 4} 
                textAnchor="end" 
                className="text-[10px] font-medium fill-gray-400 dark:fill-slate-500"
              >
                {valuePrefix}{v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((d, i) => {
          // Label frequency (show every 2nd or 3rd label to avoid crowding)
          const freq = Math.max(Math.ceil(data.length / 8), 1);
          if (i % freq !== 0 && i !== data.length - 1) return null;

          const x = paddingLeft + (i / (data.length - 1 || 1)) * chartWidth;
          return (
            <text
              key={i}
              x={x}
              y={svgHeight - 15}
              textAnchor="middle"
              className="text-[10px] font-medium fill-gray-400 dark:fill-slate-500"
            >
              {d[xKey]}
            </text>
          );
        })}

        {/* Area fill */}
        {areaPath && (
          <path 
            d={areaPath} 
            fill={fillGradient} 
            className="transition-all duration-300"
          />
        )}

        {/* Line stroke */}
        {linePath && (
          <path 
            d={linePath} 
            fill="none" 
            stroke={strokeColor} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        )}

        {/* Hover elements */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <g>
            {/* Vertical indicator line */}
            <line 
              x1={points[hoveredIndex].x} 
              y1={paddingTop} 
              x2={points[hoveredIndex].x} 
              y2={svgHeight - paddingBottom} 
              stroke={strokeColor} 
              strokeWidth="1.5" 
              strokeDasharray="3 3"
              className="opacity-60"
            />
            {/* Interactive hover circle pointer */}
            <circle 
              cx={points[hoveredIndex].x} 
              cy={points[hoveredIndex].y} 
              r="6" 
              fill={strokeColor} 
              stroke="white" 
              strokeWidth="2"
              className="shadow-md"
            />
            <circle 
              cx={points[hoveredIndex].x} 
              cy={points[hoveredIndex].y} 
              r="12" 
              fill={strokeColor} 
              fillOpacity="0.2"
            />
          </g>
        )}
      </svg>

      {/* Glassmorphism Tooltip absolute overlay */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div 
          className="absolute z-20 pointer-events-none transition-all duration-75 transform -translate-x-1/2 -translate-y-full p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-xl shadow-xl min-w-[120px] text-center"
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y}px` 
          }}
        >
          <div className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
            {points[hoveredIndex].item[xKey]}
          </div>
          <div className="text-sm font-bold text-gray-800 dark:text-slate-100 mt-0.5">
            {valuePrefix}{points[hoveredIndex].val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Premium SVG Bar Chart (Rounded top edges + Gradients)
 */
export function BarChart({ data = [], xKey = 'label', yKey = 'value', height = 240, color = 'indigo', valuePrefix = '₹' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/20 dark:border-slate-800/50 backdrop-blur-md" style={{ height }}>
        <p className="text-gray-400 dark:text-slate-500 text-sm">No visualization data available</p>
      </div>
    );
  }

  const values = data.map(d => Number(d[yKey]) || 0);
  const maxVal = Math.max(...values, 10) * 1.1; // 10% padding
  const minVal = 0;

  const svgWidth = 600;
  const svgHeight = height;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const barCount = data.length;
  const barGapPct = 0.35; // Gap ratio between bars
  const totalBarWidth = chartWidth / barCount;
  const barWidth = totalBarWidth * (1 - barGapPct);
  const barGap = totalBarWidth * barGapPct;

  const bars = data.map((d, index) => {
    const val = Number(d[yKey]) || 0;
    const h = ((val - minVal) / (maxVal - minVal)) * chartHeight;
    const x = paddingLeft + index * totalBarWidth + barGap / 2;
    const y = svgHeight - paddingBottom - h;
    return { x, y, h, item: d, val };
  });

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleX = svgWidth / rect.width;
    const svgMouseX = mouseX * scaleX;

    // Find which bar contains this X coordinate
    let foundIdx = null;
    bars.forEach((b, idx) => {
      if (svgMouseX >= b.x - barGap / 2 && svgMouseX <= b.x + barWidth + barGap / 2) {
        foundIdx = idx;
      }
    });

    if (foundIdx !== null) {
      setHoveredIdx(foundIdx);
      const scaleY = rect.height / svgHeight;
      setTooltipPos({
        x: (bars[foundIdx].x + barWidth / 2) / scaleX,
        y: bars[foundIdx].y / scaleX - 10
      });
    } else {
      setHoveredIdx(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  const barFill = color === 'emerald' ? 'url(#grad-emerald)' : color === 'blue' ? 'url(#grad-blue)' : color === 'rose' ? 'url(#grad-rose)' : 'url(#grad-indigo)';

  return (
    <div 
      className="relative w-full overflow-visible"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height={svgHeight} className="overflow-visible select-none">
        {/* Grid lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = svgHeight - paddingBottom - (i / 4) * chartHeight;
          const v = minVal + (maxVal - minVal) * (i / 4);
          return (
            <g key={i} className="opacity-40">
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={svgWidth - paddingRight} 
                y2={y} 
                stroke="currentColor" 
                className="text-gray-200 dark:text-slate-800" 
                strokeDasharray="4 4"
              />
              <text 
                x={paddingLeft - 10} 
                y={y + 4} 
                textAnchor="end" 
                className="text-[10px] font-medium fill-gray-400 dark:fill-slate-500"
              >
                {valuePrefix}{v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, i) => {
          const freq = Math.max(Math.ceil(data.length / 10), 1);
          if (i % freq !== 0 && i !== data.length - 1) return null;

          const x = paddingLeft + i * totalBarWidth + totalBarWidth / 2;
          return (
            <text
              key={i}
              x={x}
              y={svgHeight - 15}
              textAnchor="middle"
              className="text-[10px] font-medium fill-gray-400 dark:fill-slate-500"
            >
              {d[xKey]}
            </text>
          );
        })}

        {/* Bars */}
        {bars.map((b, idx) => (
          <rect
            key={idx}
            x={b.x}
            y={b.y}
            width={barWidth}
            height={Math.max(b.h, 2)}
            fill={barFill}
            rx={Math.min(barWidth / 3, 6)}
            ry={Math.min(barWidth / 3, 6)}
            className="transition-all duration-300 ease-out cursor-pointer hover:opacity-90"
            style={{
              transformOrigin: `${b.x + barWidth / 2}px ${svgHeight - paddingBottom}px`,
              transform: hoveredIdx === idx ? 'scaleY(1.03)' : 'scaleY(1)'
            }}
          />
        ))}
      </svg>

      {/* Tooltip Overlay */}
      {hoveredIdx !== null && bars[hoveredIdx] && (
        <div 
          className="absolute z-20 pointer-events-none transition-all duration-75 transform -translate-x-1/2 -translate-y-full p-3 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-xl shadow-xl min-w-[120px] text-center"
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y}px` 
          }}
        >
          <div className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
            {bars[hoveredIdx].item[xKey]}
          </div>
          <div className="text-sm font-bold text-gray-800 dark:text-slate-100 mt-0.5">
            {valuePrefix}{bars[hoveredIdx].val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Premium SVG Donut Chart
 */
export function DonutChart({ data = [], size = 200, innerLabel = 'CSAT', innerValue = '90%' }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/20 dark:border-slate-800/50 backdrop-blur-md" style={{ height: size }}>
        <p className="text-gray-400 dark:text-slate-500 text-sm">No sentiment data</p>
      </div>
    );
  }

  const total = data.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const radius = size * 0.35;
  const strokeWidth = size * 0.12;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute angles and stroke offsets
  let accumulatedPercentage = 0;
  const segments = data.map((d, index) => {
    const val = d.value || 0;
    const percentage = total > 0 ? val / total : 0;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercentage * circumference;
    accumulatedPercentage += percentage;

    // Choose premium color classes mapping
    let color = '#6366f1'; // Default Indigo
    if (d.label === 'Positive' || d.label === 'positive') color = '#10b981'; // Emerald
    else if (d.label === 'Neutral' || d.label === 'neutral') color = '#3b82f6'; // Blue
    else if (d.label === 'Negative' || d.label === 'negative') color = '#ef4444'; // Rose

    return {
      ...d,
      color,
      strokeDasharray,
      strokeDashoffset,
      pct: (percentage * 100).toFixed(1)
    };
  });

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full">
      {/* SVG Donut */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Base Background Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-gray-100 dark:text-slate-800/60"
            strokeWidth={strokeWidth}
          />
          {/* Segment Circles */}
          {segments.map((seg, idx) => (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out hover:opacity-90"
              style={{
                transformOrigin: 'center',
              }}
            />
          ))}
        </svg>

        {/* Center Text Card */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-slate-500">{innerLabel}</span>
          <span className="text-2xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight mt-0.5">{innerValue}</span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="flex flex-col gap-3 justify-center min-w-[140px]">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm py-1 px-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }}></span>
              <span className="font-medium text-gray-600 dark:text-slate-300">{seg.label}</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-slate-100 pl-4">{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Animated Counting KPI Number Component
 */
export function AnimatedCounter({ value, duration = 800, prefix = '', suffix = '' }) {
  const isNumeric = !isNaN(parseFloat(value)) && isFinite(value);
  const target = isNumeric ? parseFloat(value) : 0;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isNumeric) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out quad formula
      const easedProgress = progress * (2 - progress);
      setCount(easedProgress * target);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [target, duration, isNumeric]);

  if (!isNumeric) {
    return <span>{value}</span>;
  }

  // Formatting floats vs integers
  const displayVal = target % 1 === 0 
    ? Math.round(count).toLocaleString()
    : count.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 });

  return (
    <span>{prefix}{displayVal}{suffix}</span>
  );
}

