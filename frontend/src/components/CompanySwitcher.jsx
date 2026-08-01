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
    <div className="relative w-full px-4 py-2 border-b dark:border-slate-800" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 px-3 py-2 rounded-md border dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 transition-colors"
      >
        <span className="truncate flex-1 text-left">
          {activeBusiness ? activeBusiness.name : 'No Company Selected'}
        </span>
        <svg className={`w-4 h-4 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-4 right-4 mt-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md shadow-lg z-50 overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1">
            {businesses.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-slate-400 italic">No companies found</div>
            ) : (
              businesses.map(business => (
                <div key={business.id} className="flex items-center group px-1 py-0.5">
                  <button
                    onClick={() => {
                      changeActiveBusiness(business.id);
                      setIsOpen(false);
                    }}
                    className={`flex-1 text-left px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      activeBusiness?.id === business.id 
                        ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/30 border-black dark:border-white' 
                        : 'border-transparent text-gray-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="truncate block">{business.name}</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompanyToDelete(business);
                    }}
                    className="px-3 py-2 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
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
          <div className="border-t dark:border-slate-700">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsModalOpen(true);
              }}
              className="w-full text-left px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-medium transition-colors flex items-center"
            >
              <span className="mr-2">+</span> Add Company
            </button>
          </div>
        </div>
      )}

      <AddCompanyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Custom Delete Confirmation Modal */}
      {companyToDelete && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 bg-opacity-50 dark:bg-opacity-80 px-4 transition-opacity">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in border dark:border-slate-800">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-center text-gray-900 dark:text-slate-100 mb-2">Delete Company</h3>
              <p className="text-sm text-center text-gray-500 dark:text-slate-400">
                Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-slate-200">"{companyToDelete.name}"</span>? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-center space-x-3">
                <button
                  onClick={() => setCompanyToDelete(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    removeBusiness(companyToDelete.id);
                    setCompanyToDelete(null);
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none transition-colors"
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
