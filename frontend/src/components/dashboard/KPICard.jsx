import React from 'react';

export default function KPICard({ title, value, subtitle, change, isPositive, trendText, icon }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 font-display">{title}</h3>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            {icon}
          </div>
        )}
      </div>
      
      <div className="space-y-1.5 flex-1">
        <div className="text-3xl font-bold text-gray-900 dark:text-white font-display">
          {value}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">
            {subtitle}
          </div>
        )}
      </div>
      
      {(change || trendText) && (
        <div className="mt-4 flex items-center text-xs font-semibold">
          <span className={`flex items-center mr-1.5 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isPositive ? '↗' : '↘'} {change}
          </span>
          {trendText && (
            <span className="text-gray-400 dark:text-slate-500 font-medium">{trendText}</span>
          )}
        </div>
      )}
    </div>
  );
}
