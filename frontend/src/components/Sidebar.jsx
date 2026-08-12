import React from 'react';

import { NavLink } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import CompanySwitcher from './CompanySwitcher';

export default function Sidebar({ isOpen, setIsOpen }) {

  const { logout } = useAuth();

  const navItems = [

    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> 
    },

    { 
      name: 'Data', 
      path: '/data', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg> 
    },

     { 
      name: 'View Records', 
      path: '/data/records', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 4v16M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
    },

    { 
      name: 'Products', 
      path: '/products', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> 
    },

    { 
      name: 'Analytics', 
      path: '/analytics', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> 
    },

    { 
      name: 'Insights', 
      path: '/insights', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> 
    },

    { 

      name: 'Market Intelligence', 

      path: '/market-intelligence', 

      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> 

    },

    { 

      name: 'Reports', 
      path: '/reports', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> 
    },

    { 
      name: 'Settings', 
      path: '/settings', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> 
    },

  ];

  return (

    <>

      {/* Mobile overlay */}

      {isOpen && (

        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />

      )}

      
      {/* Sidebar */}

      <div className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col bg-navy-950 border-r border-white/[0.06] h-screen transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0'
      }`}>

        {/* Logo Area */}
        <div className="flex items-center justify-center h-16 border-b border-white/[0.06] min-w-[16rem]">
          <div className="flex items-center gap-2.5">
            <img
              src="/BizPulse.png"
              alt="BizPulse Logo"
              className="h-10 w-auto object-contain"
            />
          </div>
        </div>

        <div className="min-w-[16rem]">
          <CompanySwitcher />
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto min-w-[16rem]">

          <nav className="flex-1 px-3 py-4 space-y-1">

            {navItems.map((item) => (

              <NavLink

                key={item.name}

                to={item.path}

                end

                className={({ isActive }) =>

                  `flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group ${

                    isActive

                      ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white border border-violet-500/20 nav-active-glow'

                      : 'border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'

                  }`

                }

              >

                <div className={`mr-3 transition-colors duration-200`}>{item.icon}</div>

                {item.name}

              </NavLink>

            ))}

          </nav>

        </div>

        <div className="border-t border-white/[0.06] p-3 min-w-[16rem] space-y-2">

          <button

            onClick={logout}

            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"

          >

            <svg className="mr-3 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>

            Logout

          </button>

        </div>

      </div>

    </>

  );

}
