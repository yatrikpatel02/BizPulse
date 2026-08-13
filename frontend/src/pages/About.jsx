import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function About() {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[#f3f6fa] dark:bg-navy-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden font-sans flex flex-col justify-between">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Decorative Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 dark:bg-violet-600/[0.05] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 dark:bg-indigo-600/[0.05] rounded-full blur-[120px] pointer-events-none" />

      {/* ─── NAVBAR ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/70 dark:bg-navy-950/70 border-b border-slate-200/50 dark:border-white/[0.06] shadow-sm py-3 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-950/90 via-slate-900/90 to-indigo-950/90 border border-violet-500/30 dark:border-white/[0.06] shadow-md flex items-center justify-center transition-all group-hover:opacity-95 shadow-violet-500/5">
              <img
                src="/BizPulse.png"
                alt="BizPulse Logo"
                className="h-11 w-auto object-contain"
              />
            </div>
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Home</Link>
            <Link to="/about" className="text-violet-600 dark:text-violet-400 font-bold transition-colors">About</Link>
            <Link to="/faq" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">FAQ</Link>
            <Link to="/contact" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Contact</Link>
          </nav>

          {/* Header CTAs */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white/50 dark:bg-navy-900/50 hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-500 dark:text-slate-400 transition-colors shadow-sm"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m2.122-14.142l-.707-.707m12.728 12.728l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-1"
              >
                Go to Dashboard
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-block px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5 transition-all duration-300"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-grow pt-28 pb-16 px-6 max-w-5xl mx-auto w-full relative z-10 space-y-12">
        {/* Intro */}
        <div className="bg-white/80 dark:bg-navy-900/50 backdrop-blur-md border border-slate-200 dark:border-white/[0.06] rounded-3xl p-8 lg:p-12 shadow-xl shadow-slate-100 dark:shadow-none space-y-6">
          <div>
            <span className="text-xs font-bold tracking-wider text-violet-600 dark:text-violet-400 uppercase bg-violet-500/10 px-3 py-1 rounded-full">
              About BizPulse
            </span>
            <h1 className="text-4xl lg:text-5xl font-black font-display tracking-tight text-slate-950 dark:text-white mt-4 leading-tight">
              Smarter decisions. <br />Powered by <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">real business data</span>.
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm lg:text-base">
            BizPulse was founded with a singular mission: to provide retail and e-commerce companies with high-fidelity, real-time analytics pipelines. We believe that operational efficiency shouldn't be gated behind enterprise-scale complexity. By integrating inventory forecasting, competitor scraper automation, and Google Trends analysis into a unified interface, we allow merchants to act on signals, not speculations.
          </p>
        </div>

        {/* Pillars / Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-navy-900/40 border border-slate-200/50 dark:border-white/[0.04] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 dark:bg-violet-600/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white">Predictive Forecasting</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We run advanced Linear and Random Forest regression models directly on your raw sales sheets to forecast stock trends and prevent costly out-of-stock events.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/60 dark:bg-navy-900/40 border border-slate-200/50 dark:border-white/[0.04] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-600/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white">Competitor Scrapers</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Automated crawling modules pull pricing details from e-commerce listings, keeping your pricing catalog highly competitive.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/60 dark:bg-navy-900/40 border border-slate-200/50 dark:border-white/[0.04] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 dark:bg-violet-600/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white">Market Momentum</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Track search demand fluctuations using our built-in Google Trends engine to spot rising niche search keywords before competitors react.
            </p>
          </div>
        </div>

        {/* Tech Stack Details */}
        <div className="p-8 rounded-3xl bg-white/80 dark:bg-navy-900/50 border border-slate-200 dark:border-white/[0.06] space-y-6">
          <h3 className="font-black text-xl text-slate-900 dark:text-white font-display">Under the Hood</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            BizPulse is engineered with modern framework components to guarantee security, performance, and scaling readiness:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/50 border border-slate-100 dark:border-white/[0.02] text-center">
              Django API
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/50 border border-slate-100 dark:border-white/[0.02] text-center">
              React + Vite
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/50 border border-slate-100 dark:border-white/[0.02] text-center">
              Celery Workers
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/50 border border-slate-100 dark:border-white/[0.02] text-center">
              PostgreSQL
            </div>
          </div>
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 border-t border-slate-200 dark:border-white/[0.06] transition-colors duration-300 bg-white/20 dark:bg-navy-900/10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1.5 rounded-lg bg-gradient-to-tr from-violet-950/90 via-slate-900/90 to-indigo-950/90 border border-violet-500/30 dark:border-white/[0.06] shadow-sm flex items-center justify-center transition-colors">
              <img
                src="/BizPulse.png"
                alt="BizPulse Logo"
                className="h-7 w-auto object-contain"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} BizPulse Analytics. All rights reserved.
          </p>

          <div className="flex gap-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <Link to="/privacy" className="hover:text-violet-600 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-violet-600 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
