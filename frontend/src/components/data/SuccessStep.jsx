import React, { useState, useEffect, useRef } from 'react';
import { commitImport } from '../../services/integrations';
import { useNavigate } from 'react-router-dom';

export default function SuccessStep({ tempFileId, sourceType, mapping, originalFilename, onReset }) {
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const importStarted = useRef(false);

  useEffect(() => {
    // importStarted ref prevents React StrictMode from firing this twice.
    // We intentionally do NOT use an isMounted flag here — if we did, the
    // StrictMode cleanup would set isMounted=false before the API resolves,
    // meaning setStatus('success') would never be called and the spinner
    // would spin forever even though the backend returned 201.
    if (importStarted.current) return;
    importStarted.current = true;

    const executeImport = async () => {
      try {
        const response = await commitImport(tempFileId, sourceType, mapping, originalFilename);
        setResult(response);
        setStatus('success');
      } catch (err) {
        setError(err.response?.data?.detail || "An error occurred while importing your data.");
        setStatus('error');
      }
    };

    executeImport();
  }, []);

  return (
    <div className="max-w-2xl mx-auto glass-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-200 dark:border-white/[0.06] p-12 text-center">
      {status === 'processing' && (
        <>
          <svg className="animate-spin mx-auto h-12 w-12 text-indigo-600 mb-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Importing Your Data...</h2>
          <p className="text-slate-500 text-slate-500 dark:text-slate-500 dark:text-slate-400">Please wait while we save these records to your database. This might take a few moments.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Import Successful!</h2>
          <p className="text-slate-500 text-slate-500 dark:text-slate-500 dark:text-slate-400 mb-6">
            {result?.records_imported} records were successfully imported into your {sourceType} database.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onReset}
              className="px-6 py-2.5 glass-card border border-slate-200/80 dark:border-slate-200 dark:border-slate-200 dark:border-white/[0.06] hover:bg-slate-150/50 dark:hover:bg-navy-700 text-slate-750 dark:text-slate-300 font-medium rounded-lg transition-colors"
            >
              Upload Another File
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 bg-red-500/10 mb-6">
            <svg className="h-8 w-8 text-red-600 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Import Failed</h2>
          <div className="p-4 bg-red-50 bg-red-500/10 text-red-700 text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800/50 mb-6 mx-auto max-w-md">
            {error}
          </div>
          <button
            onClick={onReset}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
          >
            Start Over
          </button>
        </>
      )}
    </div>
  );
}
