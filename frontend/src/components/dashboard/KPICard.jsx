import React from 'react';

export default function KPICard({ title, value, change, isPositive }) {
  return (
    <div className="glass-card rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 hover:border-indigo-500/40 p-6 flex flex-col transition-all duration-300">
      <h3 className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <span className="text-2xl xl:text-3xl font-bold text-gray-900 dark:text-slate-100 font-display">{value}</span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${
          isPositive 
            ? 'bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40' 
            : 'bg-rose-100/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40'
        }`}>
          {change}
        </span>
      </div>
    </div>
  );
}
