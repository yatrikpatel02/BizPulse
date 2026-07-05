import React from 'react';

export default function AlertsWidget({ alerts }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 h-full transition-colors">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4 flex items-center">
        <span className="mr-2">⚠️</span> Important Alerts
      </h3>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div 
            key={index} 
            className={`p-3 text-sm rounded-lg border ${
              alert.type === 'critical' 
                ? 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800/50 text-red-700 dark:text-red-400' 
                : 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800/50 text-amber-700 dark:text-amber-400'
            }`}
          >
            <span className="font-semibold">{alert.title}:</span> {alert.message}
          </div>
        ))}
        {alerts.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-slate-500 italic">No important alerts.</p>
        )}
      </div>
    </div>
  );
}
