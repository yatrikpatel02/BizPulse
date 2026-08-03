import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Custom inline validations
    let valid = true;
    const errors = { email: '', password: '' };

    if (!email) {
      errors.email = 'Email address is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
      valid = false;
    }

    if (!password) {
      errors.password = 'Password is required';
      valid = false;
    }

    setFieldErrors(errors);
    if (!valid) return;

    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      const message = data?.detail || data?.non_field_errors?.[0] || 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Page Title */}
      <h2 className="text-xl font-semibold text-center text-white mb-6 tracking-tight">
        Welcome back
      </h2>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4.5">
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
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`w-full pl-11 pr-4 py-2.5 bg-[#13151b] border rounded-xl text-white placeholder-[#3e424e] focus:outline-none focus:border-[#c09e75] focus:ring-2 focus:ring-[#c09e75]/20 transition-all duration-200 text-sm ${
                  fieldErrors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10' : 'border-[#232731]'
                }`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                }}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-gray-400">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <Lock size={16} />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`w-full pl-11 pr-12 py-2.5 bg-[#13151b] border rounded-xl text-white placeholder-[#3e424e] focus:outline-none focus:border-[#c09e75] focus:ring-2 focus:ring-[#c09e75]/20 transition-all duration-200 text-sm ${
                  fieldErrors.password ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10' : 'border-[#232731]'
                }`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.password}</p>
            )}
          </div>
        </div>

        {/* Forgot Password Link */}
        <div className="flex justify-end pt-1">
          <Link to="/forgot-password" className="text-xs font-semibold text-[#c09e75] hover:text-[#d4b58e] transition-colors">
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#b08e65] hover:bg-[#c09e75] active:scale-[0.98] text-white font-semibold rounded-xl shadow-lg shadow-[#c09e75]/5 hover:shadow-[#c09e75]/15 focus:outline-none transition-all duration-200 text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Logging in...</span>
              </div>
            ) : (
              <>
                <span>Login</span>
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
        <GoogleLoginButton text="signin_with" />

        {/* Sign up Link */}
        <div className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-[#c09e75] hover:text-[#d4b58e] transition-colors">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}
