import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';

export default function AddCompanyModal({ isOpen, onClose }) {
  const { addBusiness } = useBusiness();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await addBusiness({ name, industry });
      // Reset form and close on success
      setName('');
      setIndustry('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create business.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 transition-opacity">
      <div className="bg-navy-800/95 backdrop-blur-xl rounded-2xl shadow-glass-lg w-full max-w-md overflow-hidden animate-scale-up border border-slate-200 dark:border-slate-200 dark:border-white/[0.08]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-200 dark:border-white/[0.06] flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white font-display">Add New Company</h3>
          <button 
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 focus:outline-none transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-500/10 text-red-400 p-3 rounded-xl text-sm border border-red-500/20">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Company Name <span className="text-red-400">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-navy-900/40 border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus-glow sm:text-sm rounded-xl transition-all"
                placeholder="e.g. Acme Corp"
              />
            </div>
            
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Industry
              </label>
              <input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-navy-900/40 border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus-glow sm:text-sm rounded-xl transition-all"
                placeholder="e.g. Retail, Tech, Manufacturing"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 glass-surface hover:bg-slate-100 dark:hover:bg-navy-700 focus:outline-none transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-glow-purple-sm focus:outline-none disabled:opacity-50 transition-all"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Creating...' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
