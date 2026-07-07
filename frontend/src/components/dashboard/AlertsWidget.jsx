import React from 'react';

export default function AlertsWidget({ alerts }) {
  return (
    <div className="bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 h-full transition-colors">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> Important Alerts
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
