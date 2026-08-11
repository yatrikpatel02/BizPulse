import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBusiness } from '../context/BusinessContext';
import AddCompanyModal from './AddCompanyModal';

export default function CompanySwitcher() {
  const { businesses, activeBusiness, changeActiveBusiness, removeBusiness } = useBusiness();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full px-3 py-2.5 border-b border-white/[0.06]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-navy-800/60 hover:bg-navy-700/60 px-3 py-2 rounded-xl border border-white/[0.06] text-sm font-medium text-slate-300 transition-all duration-200"
      >
        <span className="truncate flex-1 text-left">
          {activeBusiness ? activeBusiness.name : 'No Company Selected'}
        </span>
        <svg className={`w-4 h-4 ml-2 transition-transform duration-200 text-slate-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-3 right-3 mt-1 bg-navy-800/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-glass-lg z-50 overflow-hidden animate-fade-in">
          <div className="max-h-60 overflow-y-auto divide-y divide-white/[0.04]">
            {businesses.length === 0 ? (
              <div className="px-4 py-2 text-sm text-slate-500 italic">No companies found</div>
            ) : (
              businesses.map(business => (
                <div key={business.id} className="flex items-center group">
                  <button
                    onClick={() => {
                      changeActiveBusiness(business.id);
                      setIsOpen(false);
                    }}
                    className={`flex-1 text-left px-4 py-2.5 text-sm transition-colors ${
                      activeBusiness?.id === business.id 
                        ? 'text-violet-400 font-semibold bg-violet-500/10' 
                        : 'text-slate-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="truncate block">{business.name}</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompanyToDelete(business);
                    }}
                    className="px-3 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                    title="Delete Company"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-white/[0.06]">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsModalOpen(true);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-violet-400 hover:bg-violet-500/10 font-medium transition-colors flex items-center"
            >
              <span className="mr-2">+</span> Add Company
            </button>
          </div>
        </div>
      )}

      <AddCompanyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Custom Delete Confirmation Modal */}
      {companyToDelete && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 transition-opacity">
          <div className="bg-navy-800/95 backdrop-blur-xl rounded-2xl shadow-glass-lg w-full max-w-sm overflow-hidden animate-scale-up border border-white/[0.08]">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-500/10 rounded-xl mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-center text-white mb-2 font-display">Delete Company</h3>
              <p className="text-sm text-center text-slate-400">
                 Are you sure you want to delete <span className="font-semibold text-slate-200">&quot;{companyToDelete.name}&quot;</span>? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-center space-x-3">
                <button
                  onClick={() => setCompanyToDelete(null)}
                  className="px-4 py-2 border border-white/[0.08] rounded-xl text-sm font-medium text-slate-300 bg-navy-700/60 hover:bg-navy-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    removeBusiness(companyToDelete.id);
                    setCompanyToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-500 focus:outline-none transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
