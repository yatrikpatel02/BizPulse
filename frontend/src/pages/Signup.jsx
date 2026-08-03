import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Check, X, ArrowRight } from 'lucide-react';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { useTheme } from '../context/ThemeContext';

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
  const [fieldErrors, setFieldErrors] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    password_confirm: '',
  });
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
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Custom inline validations
    let valid = true;
    const errors = {
      first_name: '',
      last_name: '',
      email: '',
      username: '',
      password: '',
      password_confirm: '',
    };

    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
      valid = false;
    }
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
      valid = false;
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      valid = false;
    }
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
      valid = false;
    }
    if (!formData.password) {
      errors.password = 'Password is required';
      valid = false;
    } else if (!allChecksPassed) {
      errors.password = 'Password requirements not met';
      valid = false;
    }
    if (!formData.password_confirm) {
      errors.password_confirm = 'Please confirm your password';
      valid = false;
    } else if (!passwordsMatch) {
      errors.password_confirm = 'Passwords do not match';
      valid = false;
    }

    setFieldErrors(errors);
    if (!valid) return;

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

  return (
    <div>
      {/* Page Title */}
      <h2 className="text-xl font-semibold text-center text-white mb-6 tracking-tight">
        Create your account
      </h2>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3.5">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="first_name" className="text-xs font-semibold text-gray-400 mb-1 block">
                First name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <User size={14} />
                </span>
                <input
                  name="first_name"
                  type="text"
                  className={`w-full pl-9 pr-3 py-2 bg-[#13151b] border rounded-xl text-white placeholder-[#3e424e] focus:outline-none focus:border-[#c09e75] focus:ring-2 focus:ring-[#c09e75]/20 transition-all duration-200 text-sm ${
                    fieldErrors.first_name ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10' : 'border-[#232731]'
                  }`}
                  placeholder="First name"
                  value={formData.first_name}
                  onChange={handleChange}
                />
              </div>
              {fieldErrors.first_name && (
                <p className="mt-1 text-xs text-red-400 font-medium">{fieldErrors.first_name}</p>
              )}
            </div>
            <div>
              <label htmlFor="last_name" className="text-xs font-semibold text-gray-400 mb-1 block">
                Last name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <User size={14} />
                </span>
                <input
                  name="last_name"
                  type="text"
                  className={`w-full pl-9 pr-3 py-2 bg-[#13151b] border rounded-xl text-white placeholder-[#3e424e] focus:outline-none focus:border-[#c09e75] focus:ring-2 focus:ring-[#c09e75]/20 transition-all duration-200 text-sm ${
                    fieldErrors.last_name ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10' : 'border-[#232731]'
                  }`}
                  placeholder="Last name"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>
              {fieldErrors.last_name && (
                <p className="mt-1 text-xs text-red-400 font-medium">{fieldErrors.last_name}</p>
              )}
            </div>
          </div>

          {/* Email field */}
          <div>
            <label htmlFor="email" className="text-xs font-semibold text-gray-400 mb-1.5 block">
              Email address
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <Mail size={16} />
              </span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                className={`w-full pl-11 pr-4 py-2 bg-[#13151b] border rounded-xl text-white placeholder-[#3e424e] focus:outline-none focus:border-[#c09e75] focus:ring-2 focus:ring-[#c09e75]/20 transition-all duration-200 text-sm ${
                  fieldErrors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10' : 'border-[#232731]'
                }`}
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-400 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          {/* Username field */}
          <div>
            <label htmlFor="username" className="text-xs font-semibold text-gray-400 mb-1.5 block">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <User size={16} />
              </span>
              <input
                name="username"
                type="text"
                className={`w-full pl-11 pr-4 py-2 bg-[#13151b] border rounded-xl text-white placeholder-[#3e424e] focus:outline-none focus:border-[#c09e75] focus:ring-2 focus:ring-[#c09e75]/20 transition-all duration-200 text-sm ${
                  fieldErrors.username ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10' : 'border-[#232731]'
                }`}
                placeholder="username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            {fieldErrors.username && (
              <p className="mt-1 text-xs text-red-400 font-medium">{fieldErrors.username}</p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="text-xs font-semibold text-gray-400 mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <Lock size={16} />
              </span>
              <input
                name="password"
                type="password"
                className={`w-full pl-11 pr-4 py-2 bg-[#13151b] border rounded-xl text-white placeholder-[#3e424e] focus:outline-none focus:border-[#c09e75] focus:ring-2 focus:ring-[#c09e75]/20 transition-all duration-200 text-sm ${
                  fieldErrors.password ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10' : 'border-[#232731]'
                }`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-400 font-medium">{fieldErrors.password}</p>
            )}
            {formData.password && (
              <ul className="mt-2.5 space-y-1 text-xs bg-[#13151b] p-3 rounded-xl border border-[#232731] grid grid-cols-1 md:grid-cols-2 gap-x-4">
                {passwordChecks.map((c, i) => (
                  <li key={i} className={`flex items-center gap-1.5 ${c.passed ? 'text-green-400 font-medium' : 'text-[#5e6573]'}`}>
                    {c.passed ? <Check size={12} className="shrink-0" /> : <X size={12} className="shrink-0" />}
                    <span>{c.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Confirm Password field */}
          <div>
            <label htmlFor="password_confirm" className="text-xs font-semibold text-gray-400 mb-1.5 block">
              Confirm password
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <Lock size={16} />
              </span>
              <input
                name="password_confirm"
                type="password"
                className={`w-full pl-11 pr-4 py-2 bg-[#13151b] border rounded-xl text-white placeholder-[#3e424e] focus:outline-none focus:ring-2 focus:ring-[#c09e75]/20 transition-all duration-200 text-sm ${
                  fieldErrors.password_confirm ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10' : 'border-[#232731]'
                }`}
                placeholder="••••••••"
                value={formData.password_confirm}
                onChange={handleChange}
              />
            </div>
            {fieldErrors.password_confirm && (
              <p className="mt-1 text-xs text-red-400 font-medium">{fieldErrors.password_confirm}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#DFBA8A] via-[#C49B6D] to-[#8E673E] hover:brightness-105 active:scale-[0.98] text-gray-950 font-semibold rounded-xl shadow-lg shadow-[#c09e75]/5 hover:shadow-[#c09e75]/15 focus:outline-none transition-all duration-200 text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-gray-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Creating account...</span>
              </div>
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight size={16} className="mt-0.5" />
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#232731]"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-xs font-semibold uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-[#232731]"></div>
        </div>

        {/* Google Sign-in */}
        <GoogleLoginButton text="signup_with" />

        {/* Sign in Link */}
        <div className="text-sm text-center text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#c09e75] hover:text-[#d4b58e] transition-colors">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
