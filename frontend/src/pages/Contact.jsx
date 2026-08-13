import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

export default function Contact() {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post('/accounts/contact/', {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccess(res.data.detail || 'Thank you! Your message has been sent successfully.');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error('Failed to submit contact form', err);
      setError(err.response?.data?.detail || 'Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6fa] dark:bg-navy-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden font-sans flex flex-col justify-between">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Decorative Glow Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 dark:bg-violet-600/[0.05] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 dark:bg-indigo-600/[0.05] rounded-full blur-[120px] pointer-events-none" />

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
            <Link to="/contact" className="text-violet-600 dark:text-violet-400 font-bold transition-colors">Contact</Link>
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
      <main className="flex-grow pt-28 pb-16 px-6 max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Side: Contact Info & Value Prop */}
        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-28">
          <div>
            <span className="text-xs font-bold tracking-wider text-violet-600 dark:text-violet-400 uppercase bg-violet-500/10 px-3 py-1 rounded-full">
              Get in Touch
            </span>
            <h1 className="text-4xl lg:text-5xl font-black font-display tracking-tight text-slate-950 dark:text-white mt-4 leading-tight">
              Let's build something <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">together</span>.
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-4 leading-relaxed text-sm lg:text-base">
              Have questions about how BizPulse can scale your business intelligence, optimize your pricing pipelines, or track competitor moves? Fill out the form or reach out directly.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="space-y-4">
            {/* Email Card */}
            <div className="p-4 rounded-2xl bg-white/50 dark:bg-navy-900/40 border border-slate-200/50 dark:border-white/[0.04] flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-600/10 dark:bg-violet-600/20 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Email Us</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Our support team replies within 24 hours.</p>
                <a href="mailto:support@bizpulse.com" className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline mt-2 inline-block">
                  support@bizpulse.com
                </a>
              </div>
            </div>

            {/* Support Call Card */}
            <div className="p-4 rounded-2xl bg-white/50 dark:bg-navy-900/40 border border-slate-200/50 dark:border-white/[0.04] flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-600/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Call Support</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mon-Fri from 9 AM to 6 PM IST.</p>
                <a href="tel:+919100007878" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">
                  +91 9100007878
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="lg:col-span-7 bg-white/80 dark:bg-navy-900/50 backdrop-blur-md border border-slate-200 dark:border-white/[0.06] rounded-3xl p-8 lg:p-10 shadow-xl shadow-slate-100 dark:shadow-none">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Send Us a Message</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">We will review your inquiry and get in touch with you shortly.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Alerts */}
            {success && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold leading-relaxed">
                {success}
              </div>
            )}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold leading-relaxed">
                {error}
              </div>
            )}

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Yatrik Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-navy-950/50 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-slate-800 dark:text-slate-100 transition-all duration-300 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="yatrik@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-navy-950/50 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-slate-800 dark:text-slate-100 transition-all duration-300 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Subject
              </label>
              <input
                type="text"
                placeholder="How can we help you?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-navy-950/50 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-slate-800 dark:text-slate-100 transition-all duration-300 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Your Message
              </label>
              <textarea
                rows={5}
                placeholder="Write your details here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-navy-950/50 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-slate-800 dark:text-slate-100 transition-all duration-300 text-sm resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Sending Message...' : 'Send Message'}
              {!loading && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </button>
          </form>
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
            <Link to="/#features" className="hover:text-violet-600 transition-colors">Privacy Policy</Link>
            <Link to="/#features" className="hover:text-violet-600 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
