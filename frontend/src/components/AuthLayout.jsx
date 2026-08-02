import React from 'react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-50 dark:bg-[#090d16] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden grid-bg transition-colors duration-200">
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-indigo-500/5 dark:bg-indigo-600/15 glow-orb"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 dark:bg-cyan-600/15 glow-orb"></div>

      <div className="max-w-md w-full relative z-10 space-y-8">
        <div className="text-center">
          <h2 className="text-4.5xl font-extrabold text-gray-900 dark:text-white tracking-tight font-display mb-1 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-400 dark:to-cyan-400">
            BizPulse
          </h2>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Business Intelligence Platform</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 shadow-xl rounded-2xl p-8 backdrop-blur-xl">
          {children}
        </div>

        <div className="text-center text-xs text-gray-400 dark:text-slate-500 font-medium">
          <p>© 2026 BizPulse. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
