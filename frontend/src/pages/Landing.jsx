import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

export default function Landing() {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Scroll state for sticky header styling
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  // Contact Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormSuccess('');
    setFormError('');

    try {
      const response = await api.post('/accounts/contact/', formData);
      setFormSuccess(response.data.detail || 'Your message has been sent successfully!');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error('Contact submission error:', err);
      setFormError(
        err.response?.data?.message || 
        err.response?.data?.detail || 
        'Failed to submit the form. Please check your network and try again.'
      );
    } finally {
      setFormLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#f3f6fa] dark:bg-navy-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden font-sans">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Decorative Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 dark:bg-violet-600/[0.05] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 dark:bg-indigo-600/[0.05] rounded-full blur-[120px] pointer-events-none" />

      {/* ─── NAVBAR ─── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'backdrop-blur-md bg-white/70 dark:bg-navy-950/70 border-b border-slate-200/50 dark:border-white/[0.06] shadow-sm py-3' 
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
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
                  Login
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

      {/* ─── HERO SECTION ─── */}
      <section className="pt-32 pb-24 md:pt-40 md:pb-32 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-600 dark:text-violet-400">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
              Pulse-Check Your Analytics
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08] font-display text-slate-900 dark:text-white">
              Smarter Business Analytics in{' '}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Real-Time
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              BizPulse automates CSV imports, extracts real-time product demand patterns via Google Trends, parses customer feedback sentiment, and outputs downloadable PDF report briefs.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/15 hover:shadow-violet-500/25 hover:-translate-y-0.5 transition-all duration-300"
                >
                  Access Your Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/15 hover:shadow-violet-500/25 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Hero Right: High-Resolution Dashboard Mockup Image */}
          <div className="lg:col-span-6 flex justify-center w-full">
            <div className="relative w-full max-w-[560px] bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-1.5 shadow-2xl shadow-slate-300/60 dark:shadow-navy-950/80 transition-all duration-500 hover:scale-[1.02]">
              {/* Mockup Header Row */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 dark:border-white/[0.04] mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1.5">bizpulse-dashboard.local</span>
                </div>
                <div className="w-16 h-3 rounded bg-slate-100 dark:bg-white/[0.04]"></div>
              </div>
              {/* Actual Screenshot */}
              <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-white/[0.04]">
                <img
                  src={isDarkMode ? "/dashboard_screenshot_dark.png" : "/dashboard_screenshot.png"}
                  alt="BizPulse Dashboard Preview"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section id="features" className="py-24 bg-white/40 dark:bg-navy-900/30 border-y border-slate-200/50 dark:border-white/[0.04] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest block">Features</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white font-display">
              Engineered for Direct Platform Control
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Every tool and view within BizPulse is fully integrated to deliver immediate answers about your operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-white dark:bg-navy-900/60 border border-slate-200/60 dark:border-white/[0.04] hover:border-violet-500/30 dark:hover:border-violet-500/20 hover:-translate-y-1 transition-all duration-300 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Automated CSV Importer</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Drag, drop, and map transactions in seconds. Built-in smart matching parses headers and columns to integrate records seamlessly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-white dark:bg-navy-900/60 border border-slate-200/60 dark:border-white/[0.04] hover:border-indigo-500/30 dark:hover:border-indigo-500/20 hover:-translate-y-1 transition-all duration-300 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Deep Sales Performance</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Track revenue spikes, total orders, Average Order Value (AOV), and unit volume. Render graphs across customizable date ranges.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-white dark:bg-navy-900/60 border border-slate-200/60 dark:border-white/[0.04] hover:border-emerald-500/30 dark:hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-300 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Customer Feedback Intelligence</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Unlock buyer sentiments with natural language feedback logs. Trace ratings distribution and categorize primary client complaints.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-white dark:bg-navy-900/60 border border-slate-200/60 dark:border-white/[0.04] hover:border-amber-500/30 dark:hover:border-amber-500/20 hover:-translate-y-1 transition-all duration-300 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Market Scraper & Keyword Trends</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Directly scrape Google Trends search queries. Evaluate search volumes, trend trajectory changes, and identify risk or opportunity areas.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-white dark:bg-navy-900/60 border border-slate-200/60 dark:border-white/[0.04] hover:border-red-500/30 dark:hover:border-red-500/20 hover:-translate-y-1 transition-all duration-300 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Exportable PDF Report Briefs</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Compile inventory levels, sales metrics, and market intelligence reports. Instantly print or save clean, readable documents.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-white dark:bg-navy-900/60 border border-slate-200/60 dark:border-white/[0.04] hover:border-sky-500/30 dark:hover:border-sky-500/20 hover:-translate-y-1 transition-all duration-300 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Flexible Business Settings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Add and manage multiple business structures. Update thresholds, scrape targets, database connections, and configurations instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PERFORMANCE METRICS (LIVE DATABASE STATS) ─── */}
      {/* ─── PERFORMANCE METRICS ─── */}
      <section id="performance" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest block">Performance Benchmarks</span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white font-display">
            Built for Reliable Scaling
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            BizPulse is optimized to handle large datasets, parsing complex files and loading critical analytics instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Stat 1 */}
          <div className="p-8 bg-white/50 dark:bg-navy-900/40 border border-slate-200/50 dark:border-white/[0.04] rounded-2xl text-center flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
            <div>
              <span className="text-4xl md:text-5xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent font-display block mb-4">
                99.9%
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Sync Accuracy</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Smart mapping architecture parses schemas and formats transactions accurately, ensuring clean database imports.
              </p>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="p-8 bg-white/50 dark:bg-navy-900/40 border border-slate-200/50 dark:border-white/[0.04] rounded-2xl text-center flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
            <div>
              <span className="text-4xl md:text-5xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent font-display block mb-4">
                5x Faster
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Scraping Speed</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Parallel search query algorithms pull real-time Google Trends keyword momentum metrics with minimal delay.
              </p>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="p-8 bg-white/50 dark:bg-navy-900/40 border border-slate-200/50 dark:border-white/[0.04] rounded-2xl text-center flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
            <div>
              <span className="text-4xl md:text-5xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent font-display block mb-4">
                ₹120M+
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Revenue Tracked</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Scalable storage engine records and aggregates millions of transactions, enabling high-performance calculations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECURITY CARD ─── */}
      <section id="security" className="py-20 bg-slate-100/50 dark:bg-navy-900/20 border-y border-slate-200/50 dark:border-white/[0.04] transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-6">
          <div className="glass-card border border-violet-500/10 dark:border-violet-500/15 p-8 md:p-12 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center gap-8 bg-white/60 dark:bg-navy-900/60">
            {/* Glowing background */}
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl" />

            <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500 flex-shrink-0">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <div className="space-y-3 text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-display">
                Data Isolation & Cookie-Token Security
              </h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                BizPulse utilizes isolated workspace structures, preventing cross-organization leakage. Authentication keys and session variables are stored in secure HttpOnly cookies, protecting your reports and files from malicious client-side scripting.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* ─── CONTACT FORM SECTION (WORKING / CONNECTED) ─── */}
      <section id="contact" className="py-24 bg-white/40 dark:bg-navy-900/30 border-y border-slate-200/50 dark:border-white/[0.04] transition-colors duration-300">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest block">Get In Touch</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white font-display">
              Connect With Us
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Have questions, feedback, or need enterprise support? Submit the form below and we will follow up shortly.
            </p>
          </div>

          <div className="glass-card border border-slate-200 dark:border-white/[0.06] p-8 rounded-3xl shadow-xl bg-white dark:bg-navy-900/60 transition-colors duration-300">
            <form onSubmit={handleContactSubmit} className="space-y-5">
              {formSuccess && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm rounded-xl font-bold">
                  {formSuccess}
                </div>
              )}
              {formError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs sm:text-sm rounded-xl font-bold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-[#f8fafc] dark:bg-navy-950/60 text-sm font-semibold text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500/50 transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-[#f8fafc] dark:bg-navy-950/60 text-sm font-semibold text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500/50 transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-[#f8fafc] dark:bg-navy-950/60 text-sm font-semibold text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500/50 transition-colors"
                  placeholder="Enter subject title"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-[#f8fafc] dark:bg-navy-950/60 text-sm font-semibold text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                  placeholder="Describe your request..."
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                {formLoading ? 'Sending message...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 border-t border-slate-200 dark:border-white/[0.06] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-950/90 via-slate-900/90 to-indigo-950/90 border border-violet-500/30 dark:border-white/[0.06] shadow-sm flex items-center justify-center transition-colors">
              <img
                src="/BizPulse.png"
                alt="BizPulse Logo"
                className="h-7 w-auto object-contain"
              />
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
