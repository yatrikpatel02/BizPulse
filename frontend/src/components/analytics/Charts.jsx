import React, { useState, useRef, useEffect } from 'react';

/**
 * Shared SVG Gradients Definition Component
 */
export function ChartGradients() {
  return (
    <svg className="absolute w-0 h-0" width="0" height="0">
      <defs>
        <linearGradient id="area-indigo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
        </linearGradient>
        <linearGradient id="area-emerald" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
        </linearGradient>
        <linearGradient id="grad-indigo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="grad-emerald" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="grad-blue" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="grad-rose" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
      </defs>
    </svg>
  );
}


/**
 * Premium SVG Area / Line Chart
 */
export function AreaChart({ data = [], xKey = 'label', yKey = 'value', height = 280, color = 'indigo', valuePrefix = '₹' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-navy-800/60 bg-navy-800/60 rounded-2xl border border-white/[0.06] backdrop-blur-md" style={{ height }}>
        <p className="text-slate-500 text-sm">No trend data available</p>
      </div>
    );
  }

  const values = data.map(d => Number(d[yKey]) || 0);
  const maxVal = Math.max(...values, 100) * 1.15; // 15% padding at top
  const minVal = 0;

  const svgWidth = 600;
  const svgHeight = height;
  const paddingLeft = 65; // increased padding slightly for larger y labels
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Generate coordinates
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1 || 1)) * chartWidth;
    const val = Number(d[yKey]) || 0;
    const y = svgHeight - paddingBottom - ((val - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, item: d, val };
  });

  const yTicks = 4;
  const yLabelValues = Array.from({ length: yTicks + 1 }, (_, i) => minVal + (i / yTicks) * (maxVal - minVal));

  const areaPath = points.length > 0 
    ? `${points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`
    : '';

  const linePath = points.length > 0
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : '';

  const handleMouseMove = (e) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / svgWidth;
    const mouseX = (e.clientX - rect.left) / scaleX;
    
    // Find closest point
    let minDiff = Infinity;
    let closestIdx = 0;
    
    points.forEach((p, idx) => {
      const diff = Math.abs(p.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setHoveredIndex(closestIdx);
    
    // Scale tooltip screen position back
    const scaleY = rect.height / svgHeight;
    setTooltipPos({
      x: points[closestIdx].x * scaleX,
      y: points[closestIdx].y * scaleY - 10
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
            <g key={i}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={svgWidth - paddingRight} 
                y2={y} 
                stroke="rgba(255, 255, 255, 0.04)" 
                strokeDasharray="4 4"
              />
              <text 
                x={paddingLeft - 10} 
                y={y + 4} 
                textAnchor="end" 
                className="text-[10px] font-semibold fill-slate-500 font-sans"
              >
                {valuePrefix}{v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels with smart collision prevention */}
        {(() => {
          let lastRenderedIdx = -999;
          const freq = Math.max(Math.ceil(data.length / 5), 1); // show fewer labels by default to avoid crowding
          
          return data.map((d, i) => {
            const isLast = i === data.length - 1;
            const isFreqMatch = i % freq === 0;
            const distance = i - lastRenderedIdx;
            
            if (isLast) {
              if (distance < Math.max(2, freq * 0.7)) return null;
            } else if (!isFreqMatch) {
              return null;
            }
            
            lastRenderedIdx = i;
            const x = paddingLeft + (i / (data.length - 1 || 1)) * chartWidth;
            return (
              <text
                key={i}
                x={x}
                y={svgHeight - 15}
                textAnchor="middle"
                className="text-[10px] font-semibold fill-slate-500 font-sans"
              >
                {d[xKey]}
              </text>
            );
          });
        })()}

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
            className="transition-all duration-300 chart-glow"
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
          className="absolute z-20 pointer-events-none transition-all duration-75 transform -translate-x-1/2 -translate-y-full p-3 bg-navy-800/60 bg-navy-800/60 backdrop-blur-md border border-white/[0.06] rounded-xl shadow-xl min-w-[120px] text-center"
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y}px` 
          }}
        >
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            {points[hoveredIndex].item[xKey]}
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
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
      <div className="flex items-center justify-center bg-navy-800/60 bg-navy-800/60 rounded-2xl border border-white/[0.06] backdrop-blur-md" style={{ height }}>
        <p className="text-slate-500 text-sm">No visualization data available</p>
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
        y: bars[foundIdx].y / scaleY - 10
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
            <g key={i}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={svgWidth - paddingRight} 
                y2={y} 
                stroke="rgba(255, 255, 255, 0.04)" 
                strokeDasharray="4 4"
              />
              <text 
                x={paddingLeft - 10} 
                y={y + 4} 
                textAnchor="end" 
                className="text-[10px] font-semibold fill-slate-500 font-sans"
              >
                {valuePrefix}{v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toFixed(0)}
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
              className="text-[10px] font-semibold fill-slate-500 font-sans"
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
          className="absolute z-20 pointer-events-none transition-all duration-75 transform -translate-x-1/2 -translate-y-full p-3 bg-navy-800/60 backdrop-blur-md border border-white/[0.06] rounded-xl shadow-xl min-w-[120px] text-center"
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y}px` 
          }}
        >
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            {bars[hoveredIdx].item[xKey]}
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
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
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-navy-800/60 bg-navy-800/60 rounded-2xl border border-white/[0.06] backdrop-blur-md" style={{ height: size }}>
        <p className="text-slate-500 text-sm">No sentiment data</p>
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
  const segments = data.map((d) => {
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
        <svg width={size} height={size} className="transform -rotate-90 overflow-visible">
          {/* Base Background Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.04)"
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
              strokeWidth={hoveredIdx === idx ? strokeWidth * 1.3 : strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="transition-all duration-300 ease-out cursor-pointer hover:opacity-90"
              style={{
                transformOrigin: 'center',
              }}
            />
          ))}
        </svg>

        {/* Inner Centered Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{innerLabel}</span>
          <span className="text-2xl font-extrabold text-white mt-0.5">{innerValue}</span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex flex-col gap-2 min-w-[160px]">
        {segments.map((seg, idx) => (
          <div 
            key={idx} 
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`flex items-center justify-between text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
              hoveredIdx === idx 
                ? 'bg-white/[0.04] border-white/[0.08] scale-[1.03] shadow-glow-purple-sm' 
                : 'border-transparent hover:bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }}></span>
              <span className="font-medium text-slate-300">{seg.label}</span>
            </div>
            <span className="font-semibold text-white pl-4">{seg.pct}%</span>
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

