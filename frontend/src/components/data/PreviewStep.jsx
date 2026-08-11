import React, { useState, useEffect } from 'react';
import { getImportPreview } from '../../services/integrations';

export default function PreviewStep({ tempFileId, sourceType, mapping, onPreviewComplete, onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [validationReport, setValidationReport] = useState({});
  const [stats, setStats] = useState({ total: 0, cleaned: 0, invalid: 0 });

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const data = await getImportPreview(tempFileId, sourceType, mapping);
        setPreviewData(data.preview_data);
        setValidationReport(data.validation_report);
        setStats({
          total: data.total_rows,
          cleaned: data.cleaned_rows_count,
          invalid: data.invalid_rows_count
        });
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to generate data preview.");
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [tempFileId, sourceType, mapping]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto glass-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-200 dark:border-white/[0.06] p-12 text-center">
        <svg className="animate-spin mx-auto h-10 w-10 text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h3 className="text-lg font-medium text-slate-800 dark:text-white">Analyzing Your Data...</h3>
        <p className="text-slate-500 text-slate-500 dark:text-slate-400 mt-2">Checking data types and formatting</p>
      </div>
    );
  }

  const hasCriticalErrors = validationReport.missing_columns?.length > 0;

  return (
    <div className="max-w-5xl mx-auto glass-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-200 dark:border-white/[0.06] p-8">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Preview & Validate</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 bg-red-500/10 text-red-700 text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800/50">
          {error}
        </div>
      )}

      {hasCriticalErrors ? (
        <div className="mb-6 p-4 bg-red-50 bg-red-500/10 text-red-700 text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800/50">
          <p className="font-bold mb-2">Critical Errors Detected:</p>
          <ul className="list-disc pl-5">
            {validationReport.missing_columns?.map((col, i) => (
              <li key={i}>Missing required mapping for: {col}</li>
            ))}
          </ul>
          <p className="mt-2">Please go back and adjust your column mapping.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-surface p-4 rounded-lg border border-slate-200/50 dark:border-slate-200/50 dark:border-white/[0.04] border-slate-200 dark:border-slate-200 dark:border-white/[0.06] text-center">
              <p className="text-sm text-slate-500 text-slate-500 dark:text-slate-400 mb-1">Total Rows</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800/30 text-center">
              <p className="text-sm text-green-600 dark:text-green-400 mb-1">Valid Rows to Import</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.cleaned}</p>
            </div>
            <div className={`p-4 rounded-lg border text-center ${stats.invalid > 0 ? 'bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800/30' : 'glass-surface border-slate-200/50 dark:border-slate-200/50 dark:border-white/[0.04] border-slate-200 dark:border-slate-200 dark:border-white/[0.06]'}`}>
              <p className={`text-sm mb-1 ${stats.invalid > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 text-slate-500 dark:text-slate-400'}`}>Invalid Rows (Will be skipped)</p>
              <p className={`text-2xl font-bold ${stats.invalid > 0 ? 'text-orange-700 dark:text-orange-300' : 'text-slate-800 dark:text-white'}`}>{stats.invalid}</p>
            </div>
          </div>

          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-3">Data Preview</h3>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-200 dark:border-slate-200 dark:border-white/[0.06] rounded-lg mb-8">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="glass-surface">
                <tr>
                  {previewData.length > 0 && Object.keys(previewData[0]).map((key) => (
                    <th key={key} scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="glass-card divide-y divide-gray-200 dark:divide-slate-700">
                {previewData.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((val, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                        {val !== null ? String(val) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
                {previewData.length === 0 && (
                  <tr>
                    <td colSpan="100%" className="px-6 py-4 text-center text-slate-500">No valid data found to preview.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 glass-card border border-slate-200/80 dark:border-slate-200 dark:border-slate-200 dark:border-white/[0.06] hover:bg-slate-150/50 dark:hover:bg-navy-700 text-slate-750 dark:text-slate-300 font-medium rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onPreviewComplete}
          disabled={hasCriticalErrors || stats.cleaned === 0}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Import Data
        </button>
      </div>
    </div>
  );
}
