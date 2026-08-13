import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function PrivacyPolicy() {
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
            <Link to="/about" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">About</Link>
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
      <main className="flex-grow pt-28 pb-16 px-6 max-w-4xl mx-auto w-full relative z-10">
        <div className="bg-white/80 dark:bg-navy-900/50 backdrop-blur-md border border-slate-200 dark:border-white/[0.06] rounded-3xl p-8 lg:p-12 shadow-xl shadow-slate-100 dark:shadow-none space-y-8">
          <div>
            <span className="text-xs font-bold tracking-wider text-violet-600 dark:text-violet-400 uppercase bg-violet-500/10 px-3 py-1 rounded-full">
              Legal
            </span>
            <h1 className="text-3xl lg:text-4xl font-black font-display tracking-tight text-slate-950 dark:text-white mt-4 leading-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Last updated: August 13, 2026
            </p>
          </div>

          <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              At BizPulse, we take your privacy seriously. This Privacy Policy describes how we collect, use, and safeguard the information you provide when using our business intelligence platform.
            </p>

            <hr className="border-slate-200 dark:border-white/[0.06]" />

            {/* Section 1 */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">1. Information We Collect</h3>
              <p>
                To provide our sales analytics and predictions, we collect:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Account Information:</strong> Name, email address, password hashes, and user settings collected during sign-up.</li>
                <li><strong>Business Metrics:</strong> Raw sales spreadsheets, inventory counts, product datasets, and transaction logs that you import into the dashboard.</li>
                <li><strong>Scraping Queries:</strong> Keywords added for opportunity scoring, Google Trends lookup logs, and competitor URL configurations.</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">2. How We Use Your Data</h3>
              <p>
                Your imported business data is used exclusively to power the platform's features:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Analytics & Forecasting:</strong> Running machine learning models (Linear and RandomForest algorithms) to output revenue forecasts and stock notifications.</li>
                <li><strong>Competitor Monitoring:</strong> Looking up Google Trends scores and scraping public competitor pricing schemas via automated service workers.</li>
                <li><strong>Operational Integrity:</strong> Authenticating dashboard sessions, logging API requests, and troubleshooting performance.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">3. Data Security</h3>
              <p>
                We use industry-standard encryption protocols (SSL/TLS) to secure all database transactions. User credentials are encrypted using Django's default PBKDF2 algorithm with a SHA256 hash. BizPulse does not sell, trade, or distribute your private business metrics to third-party advertising companies under any circumstances.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">4. Cookies</h3>
              <p>
                We use strictly necessary cookies to manage your login session, protect against Cross-Site Request Forgery (CSRF), and remember your color theme selection (light or dark mode).
              </p>
            </div>

            {/* Section 5 */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">5. Your Control & Rights</h3>
              <p>
                You retain complete ownership over your business data. You may download, edit, or delete any of your uploaded products, sales data, and business records directly from the settings panel or the viewer tables at any time.
              </p>
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
            <Link to="/privacy" className="text-violet-600 dark:text-violet-400 hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-violet-600 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
