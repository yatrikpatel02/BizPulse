import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import CompanySwitcher from './CompanySwitcher';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Data', path: '/data', icon: '📂' },
    { name: 'Products', path: '/products', icon: '📦' },
    { name: 'Analytics', path: '/analytics', icon: '📈' },
    { name: 'Insights', path: '/insights', icon: '💡' },
    { name: 'Reports', path: '/reports', icon: '📄' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-800 bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col bg-white dark:bg-slate-900 border-r dark:border-slate-800 h-screen transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex items-center justify-center h-16 border-b dark:border-slate-800 min-w-[16rem]">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">BizPulse</h1>
        </div>
        <div className="min-w-[16rem]">
          <CompanySwitcher />
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto min-w-[16rem]">
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-200'
                  }`
                }
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="border-t dark:border-slate-800 p-4 min-w-[16rem] space-y-2">
          
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <span className="mr-3 text-lg">🚪</span>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
