import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function FAQ() {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How does the Google Trends integration work?",
      a: "BizPulse queries search indexes for your configured keywords, retrieving live trend comparisons and keyword demand momentum. This helps you identify emerging market opportunities instantly."
    },
    {
      q: "What file formats does the data importer support?",
      a: "Our smart CSV importer supports standard Comma-Separated Values files. It automatically maps fields like Transaction ID, Product Name, SKU, Revenue, Quantity, and Dates to your business database."
    },
    {
      q: "Can I download and print reports as PDFs?",
      a: "Yes! Every Sales, Inventory, and Customer report includes a print button that generates a beautifully formatted, high-contrast, print-ready document which you can save directly to PDF."
    },
    {
      q: "Is my data secure and private?",
      a: "Absolutely. BizPulse uses enterprise-level encryption for data transmissions and state management. Your information is isolated within your selected company settings and visible only to you."
    },
    {
      q: "How do I add multiple businesses or companies?",
      a: "You can manage and swap your companies directly via the Business Settings or the dropdown selector in the main sidebar. Each company operates in its own isolated database scope."
    },
    {
      q: "What metrics are analyzed in Customer Intelligence?",
      a: "BizPulse evaluates total review logs, calculates average scores, traces positive/negative rating distributions, and groups customer reports into primary complaint categories using natural language text matching."
    }
  ];

  // Filter FAQs based on search
  const filteredFaqs = faqs.filter(
    faq => faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
           faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Link to="/#features" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Features</Link>
            <Link to="/faq" className="text-violet-600 dark:text-violet-400 font-bold transition-colors">FAQ</Link>
            <Link to="/#contact" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Contact</Link>
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

      {/* ─── BODY CONTENT ─── */}
      <main className="flex-1 pt-32 pb-24 max-w-4xl mx-auto px-6 w-full relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest block">FAQ</span>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white font-display">
            Common Inquiries
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Quick responses to essential technical questions regarding the dashboard.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative max-w-md mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or keywords..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-navy-900 text-sm font-semibold text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500/50 shadow-sm transition-colors"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* FAQ Accordion list */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="border border-slate-200/60 dark:border-white/[0.04] bg-white dark:bg-navy-900 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-sm sm:text-base text-slate-800 dark:text-white hover:bg-slate-50/50 dark:hover:bg-navy-900/60 transition-colors focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <svg 
                    className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${openFaq === idx ? 'transform rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    openFaq === idx ? 'max-h-[200px] border-t border-slate-100 dark:border-white/[0.04] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <p className="px-6 py-5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50/[0.01]">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-slate-500 italic py-8 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200/60 dark:border-white/[0.04]">
              No matching questions found. Try search query e.g. "CSV" or "Google".
            </p>
          )}
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 border-t border-slate-200 dark:border-white/[0.06] transition-colors duration-300 bg-white/20 dark:bg-navy-900/10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="px-2.5 py-1.5 rounded-lg bg-gradient-to-tr from-violet-950/90 via-slate-900/90 to-indigo-950/90 border border-violet-500/30 dark:border-white/[0.06] shadow-sm flex items-center justify-center transition-colors">
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
            <Link to="/#features" className="hover:text-violet-600 transition-colors">Privacy Policy</Link>
            <Link to="/#features" className="hover:text-violet-600 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
