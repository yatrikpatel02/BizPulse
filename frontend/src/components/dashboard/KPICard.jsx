import React from 'react';

export default function KPICard({ title, value, change, isPositive }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 flex flex-col hover:shadow-md transition-shadow">
      <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">{title}</h3>
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <span className="text-2xl xl:text-3xl font-bold text-gray-900 dark:text-slate-100">{value}</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium whitespace-nowrap ${
          isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
        }`}>
          {change}
        </span>
      </div>
    </div>
  );
}
