import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '' });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Custom inline validations
    let valid = true;
    const errors = { email: '' };

    if (!email) {
      errors.email = 'Email address is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
      valid = false;
    }

    setFieldErrors(errors);
    if (!valid) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Page Title & Subtitle */}
      <h2 className="text-xl font-semibold text-center text-white tracking-tight">
        Reset your password
      </h2>
      <p className="mt-2 text-center text-sm text-gray-400 mb-6 leading-relaxed">
        Enter your email and we will send you a reset link.
      </p>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
            <span>Check your email for reset instructions.</span>
          </div>
        )}

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
              className={`w-full pl-11 pr-4 py-2.5 bg-[#13151b] border rounded-xl text-white placeholder-[#3e424e] focus:outline-none focus:border-[#c09e75] focus:ring-2 focus:ring-[#c09e75]/20 transition-all duration-200 text-sm ${
                fieldErrors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10' : 'border-[#232731]'
              }`}
              placeholder="name@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors({ email: '' });
              }}
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.email}</p>
          )}
        </div>

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
                <span>Sending...</span>
              </div>
            ) : (
              <>
                <span>Send reset link</span>
                <ArrowRight size={16} className="mt-0.5" />
              </>
            )}
          </button>
        </div>

        <div className="text-sm text-center text-gray-400 mt-6">
          <Link to="/login" className="font-semibold text-[#c09e75] hover:text-[#d4b58e] transition-colors">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
