import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function DashboardLayout({ children }) {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  
  // Default to open on desktop, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    handleResize(); // check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getHeaderDetails = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
      case '/':
        return {
          title: 'Dashboard',
          subtitle: 'Overview of your business performance'
        };
      case '/data':
        return {
          title: 'Data Management',
          subtitle: 'Import your business data to generate insights.'
        };
      case '/data/records':
        return {
          title: 'View Records',
          subtitle: 'Browse and search your imported business datasets.'
        };
      case '/products':
        return {
          title: 'Products',
          subtitle: 'Manage your catalog of items and pricing.'
        };
      case '/analytics':
        return {
          title: 'Analytics',
          subtitle: 'Deeper visual statistical breakdowns.'
        };
      case '/insights':
        return {
          title: 'Insights',
          subtitle: 'System-generated machine learning recommendations.'
        };
      case '/reports':
        return {
          title: 'Reports',
          subtitle: 'Exportable business performance summaries.'
        };
      case '/profile':
        return {
          title: 'Profile Management',
          subtitle: 'Manage your user profile settings, password, and registered companies.'
        };
      default:
        return {
          title: 'BizPulse',
          subtitle: 'Business Intelligence Suite'
        };
    }
  };

  const { title, subtitle } = getHeaderDetails();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#090d16] transition-colors duration-200 overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden w-full relative z-10 grid-bg">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-800/60 z-10 transition-colors duration-200">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-gray-800 dark:text-slate-200 font-display leading-tight">{title}</h2>
              <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium hidden sm:inline">{subtitle}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <Link
              to="/settings"
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <Link to="/profile" className="flex items-center space-x-2 border-l border-gray-200/60 dark:border-slate-800/60 pl-4 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold uppercase ring-1 ring-indigo-500/20 shadow-sm text-xs">
                {(user?.first_name?.charAt(0) || '') + (user?.last_name?.charAt(0) || '') || user?.username?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 hidden sm:block">
                {user?.first_name || user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username}
              </span>
            </Link>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
