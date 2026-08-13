import React, { useState, useCallback, useEffect, useRef } from 'react';
import { uploadFile } from '../../services/integrations';

export default function UploadStep({ onUploadSuccess, initialFile, onFileSelect, initialSourceType }) {
  const [file, setFile] = useState(initialFile || null);
  const [sourceType, setSourceType] = useState(initialSourceType || 'sales');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { value: 'sales', label: 'Sales Records' },
    { value: 'inventory', label: 'Inventory Snapshots' },
    { value: 'reviews', label: 'Customer Reviews' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (onFileSelect) onFileSelect(selected);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      if (onFileSelect) onFileSelect(selected);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const data = await uploadFile(file, sourceType);
      // data contains temp_file_id, headers, suggested_mappings
      onUploadSuccess({
        tempFileId: data.temp_file_id,
        headers: data.headers,
        suggestedMappings: data.suggested_mappings,
        sourceType,
        originalFilename: file.name
      });
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto glass-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-200 dark:border-white/[0.06] p-8">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">Upload Business Data</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 bg-red-500/10 text-red-700 text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800/50">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-650 dark:text-slate-300 mb-2">
            What type of data are you uploading?
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full px-4 py-2.5 glass-surface border border-slate-200/80 dark:border-white/[0.06] rounded-lg focus:ring-2 focus:ring-violet-500 text-slate-700 dark:text-slate-200 outline-none transition-all flex items-center justify-between text-sm font-semibold shadow-sm hover:border-slate-300 dark:hover:border-white/10"
            >
              <span>{options.find(opt => opt.value === sourceType)?.label}</span>
              <svg className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/[0.06] rounded-lg shadow-xl dark:shadow-none z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                {options.map((option) => {
                  const isSelected = sourceType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSourceType(option.value);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-violet-600 text-white'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      {option.label}
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
            file ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200/80 dark:border-slate-200 dark:border-slate-200 dark:border-white/[0.06] hover:border-indigo-400 dark:hover:border-indigo-500 glass-surface/50'
          }`}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <input
            id="file-upload"
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
            onChange={handleFileChange}
          />
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`p-4 rounded-full ${file ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-gray-100 glass-surface'}`}>
              <svg className={`w-8 h-8 ${file ? 'text-indigo-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            {file ? (
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{file.name}</p>
                <p className="text-xs text-slate-500 text-slate-500 dark:text-slate-400 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-slate-500 text-slate-500 dark:text-slate-400 mt-1">
                  CSV or Excel files only
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={!file || loading}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              'Upload and Continue'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
