import React from 'react';

export default function AlertsWidget({ alerts }) {
  return (
    <div className="glass-card rounded-2xl shadow-sm p-6 h-full transition-all duration-300">
      <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 font-display mb-6 flex items-center">
        <svg className="w-5 h-5 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg> 
        Important Alerts
      </h3>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div 
            key={index} 
            className={`p-4 text-xs rounded-xl border font-medium leading-relaxed transition-all duration-300 ${
              alert.type === 'critical' 
                ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
            }`}
          >
            <span className="font-bold text-sm block mb-1 uppercase tracking-wide">
              {alert.title}
            </span> 
            {alert.message}
          </div>
        ))}
        {alerts.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-slate-500 italic">No important alerts.</p>
        )}
      </div>
    </div>
  );
}
