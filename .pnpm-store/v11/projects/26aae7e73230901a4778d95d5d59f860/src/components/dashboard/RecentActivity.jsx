import React from 'react';

export default function RecentActivity({ activities }) {
  return (
    <div className="glass-card rounded-2xl shadow-sm p-6 h-full transition-all duration-300">
      <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 font-display mb-6">Recent Activity</h3>
      <div className="relative pl-6 border-l border-gray-200/50 dark:border-slate-800/60 space-y-6">
        {activities.map((activity, index) => (
          <div key={index} className="relative group">
            {/* Timeline dot with hover scale animation */}
            <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-white dark:bg-[#090d16] border-2 border-indigo-500 ring-4 ring-indigo-500/10 group-hover:scale-125 transition-all duration-300"></div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{activity.title}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-slate-500 italic pl-2">No recent activity.</p>
        )}
      </div>
    </div>
  );
}
