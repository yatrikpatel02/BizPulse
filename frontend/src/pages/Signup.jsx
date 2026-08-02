import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import SocialButtons from '../components/SocialButtons';

const checks = [
  { label: 'At least 8 chars', test: (p) => p.length >= 8 },
  { label: 'One uppercase', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special char', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function Signup() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    password_confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { setIsDarkMode } = useTheme();
  const navigate = useNavigate();

  // Restore theme to default light on mount
  useEffect(() => {
    setIsDarkMode(false);
  }, [setIsDarkMode]);

  const passwordChecks = useMemo(() => checks.map((c) => ({ ...c, passed: c.test(formData.password) })), [formData.password]);
  const allChecksPassed = passwordChecks.every((c) => c.passed);
  const passwordsMatch = formData.password === formData.password_confirm && formData.password_confirm !== '';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.entries(data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : val}`)
          .join(' • ');
        setError(messages);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "block w-full px-4 py-3 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-300";
  const labelClass = "block text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-2";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight font-display">Create your account</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Get started with your business intelligence suite</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm transition-all">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>First Name</label>
            <input
              name="first_name"
              type="text"
              required
              className={inputClass}
              placeholder="John"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass}>Last Name</label>
            <input
              name="last_name"
              type="text"
              required
              className={inputClass}
              placeholder="Doe"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Username</label>
          <input
            name="username"
            type="text"
            required
            className={inputClass}
            placeholder="johndoe"
            value={formData.username}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className={labelClass}>Email Address</label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            placeholder="john@company.com"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className={labelClass}>Password</label>
          <input
            name="password"
            type="password"
            required
            className={inputClass}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
          />
          {formData.password && (
            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-semibold text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/20 border border-gray-200 dark:border-slate-900 rounded-xl p-3">
              {passwordChecks.map((c, i) => (
                <li key={i} className={`flex items-center gap-1.5 ${c.passed ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'}`}>
                  <span className="text-xs">{c.passed ? '✓' : '•'}</span> {c.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className={labelClass}>Confirm Password</label>
          <input
            name="password_confirm"
            type="password"
            required
            className={`${inputClass} ${formData.password_confirm && !passwordsMatch ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            placeholder="••••••••"
            value={formData.password_confirm}
            onChange={handleChange}
          />
          {formData.password_confirm && !passwordsMatch && (
            <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">Passwords do not match.</p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !allChecksPassed || !passwordsMatch}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-300"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </div>

        <div className="text-xs text-center font-semibold">
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
            Already have an account? Sign in
          </Link>
        </div>

        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-x-0 h-px bg-gray-200 dark:bg-slate-800"></div>
          <span className="relative px-3 bg-white dark:bg-slate-900 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">or continue with</span>
        </div>

        <SocialButtons onSuccess={() => navigate('/dashboard')} onError={setError} />
      </form>
    </div>
  );
}
