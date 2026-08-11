import React from 'react';

export default function KPICard({ title, value, subtitle, change, isPositive, trendText, icon }) {
  return (
    <div className="glass-card hover:border-violet-500/20 hover:-translate-y-1 hover:shadow-glow-purple rounded-2xl p-6 flex flex-col transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-400 font-display">{title}</h3>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/15 to-indigo-600/10 flex items-center justify-center text-violet-400 border border-violet-500/10 group-hover:shadow-glow-purple-sm transition-all duration-300">
            {icon}
          </div>
        )}
      </div>
      
      <div className="space-y-1.5 flex-1">
        <div className="text-lg sm:text-[24px] lg:text-lg xl:text-2xl font-bold text-white font-display tracking-tight break-words">
          {value}
        </div>
        {subtitle && (
          <div className="text-xs text-slate-500 font-medium">
            {subtitle}
          </div>
        )}
      </div>
      
      {(change || trendText) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-semibold leading-none">
          <span className={`inline-flex items-center ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? '↗' : '↘'} {change}
          </span>
          {trendText && (
            <span className="text-slate-500 font-medium whitespace-nowrap">{trendText}</span>
          )}
        </div>
      )}
    </div>
  );
}
