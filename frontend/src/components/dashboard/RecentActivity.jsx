import React from 'react';

export default function RecentActivity({ activities }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 h-full transition-colors">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-slate-200">{activity.title}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{activity.time}</p>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-slate-500 italic">No recent activity.</p>
        )}
      </div>
    </div>
  );
}
