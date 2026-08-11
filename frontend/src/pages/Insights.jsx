import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { getInsights, updateInsight, deleteInsight } from '../services/analytics';

export default function Insights() {
  const { activeBusiness } = useBusiness();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('all'); // 'all', 'high', 'medium', 'low'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'revenue_declining', 'competitor_price_lower', 'growing_demand', 'declining_demand', 'high_demand', 'inventory_risk'

  // Action Modal State
  const [actionModal, setActionModal] = useState(null);

  // Load insights
  const fetchInsightsList = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getInsights({ business_id: activeBusiness.id });
      // DRF response can be paginated or raw array
      const dataArray = Array.isArray(res) 
        ? res 
        : (res.results || res.data || []);
      
      setInsights(dataArray);
    } catch (err) {
      console.error("Failed to load insights", err);
      setError("Failed to load insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsightsList();
  }, [activeBusiness]);

  // Handle Mark as Read (Dismiss)
  const handleDismiss = async (id) => {
    try {
      // Toggle read state or delete
      await deleteInsight(id);
      setInsights(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error("Failed to dismiss insight", err);
      alert("Failed to dismiss insight. Please try again.");
    }
  };

  // Helper to parse Problem/Reason/Recommendation from description
  const parseDescription = (desc) => {
    const result = { problem: '', reason: '', affectedProducts: '', recommendation: '' };
    if (!desc) return result;
    
    const parts = desc.split('\n\n');
    parts.forEach(part => {
      const cleanPart = part.trim();
      if (cleanPart.toLowerCase().startsWith('problem:')) {
        result.problem = cleanPart.substring(8).trim();
      } else if (cleanPart.toLowerCase().startsWith('reason:')) {
        result.reason = cleanPart.substring(7).trim();
      } else if (cleanPart.toLowerCase().startsWith('affected products:')) {
        result.affectedProducts = cleanPart.substring(18).trim();
      } else if (part.toLowerCase().startsWith('recommendation:')) {
        result.recommendation = cleanPart.substring(15).trim();
      }
    });
    
    // Fallback if not matching standard format
    if (!result.problem && !result.reason && !result.recommendation) {
      result.problem = desc;
    }
    return result;
  };

  const previewDescription = (desc) => {
    const parsed = parseDescription(desc);
    return [parsed.problem, parsed.affectedProducts].filter(Boolean).join(' ');
  };

  // Filter insights
  const filteredInsights = insights.filter(i => {
    const matchesSeverity = severityFilter === 'all' ? true : i.severity === severityFilter;
    const matchesType = typeFilter === 'all' ? true : i.insight_type === typeFilter;
    return matchesSeverity && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
          Actionable Business Insights
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Automatically generated recommendations answering: <span className="font-semibold text-violet-400">"What should I do?"</span>
        </p>
      </div>

      {/* Automated AI Recommendations — moved from Analytics Forecasts tab */}
      <div className="bg-navy-800/60 backdrop-blur-md border border-white/[0.06] rounded-3xl p-6 shadow-md">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Automated AI Recommendations</h3>
        <p className="text-xs text-slate-500 mb-6">Real-time decisions identified from sales and market intelligence data</p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <svg className="w-6 h-6 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : insights.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6 italic">No AI recommendations available yet. Import data to generate insights.</p>
        ) : (
          <div className="space-y-4">
            {insights.slice(0, 4).map((insight, idx) => (
              <div 
                key={insight.id || idx}
                className={`flex gap-4 p-4 rounded-2xl border transition-all duration-300 hover:shadow-md ${
                  insight.severity === 'high'
                    ? 'bg-rose-500/5 border-rose-500/20 dark:bg-rose-500/10'
                    : insight.severity === 'medium'
                    ? 'bg-amber-500/5 border-amber-500/20 dark:bg-amber-500/10'
                    : 'bg-indigo-500/5 border-indigo-500/20 dark:bg-violet-500/10'
                }`}
              >
                <div className="flex-shrink-0">
                  {insight.severity === 'high' ? (
                    <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                  ) : insight.severity === 'medium' ? (
                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  ) : (
                    <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-200">{insight.title}</h4>
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      insight.severity === 'high' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-600 dark:text-rose-400' 
                      : insight.severity === 'medium' ? 'bg-amber-500/10 text-amber-600 text-amber-400'
                      : 'bg-violet-500/10 text-violet-400'
                    }`}>
                      {insight.severity} Priority
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                    {previewDescription(insight.description)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-navy-800/60 backdrop-blur-md border border-white/[0.06] rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Severity Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Severity</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-navy-900/40 bg-navy-900/40 border border-white/[0.06] text-sm font-semibold rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-violet-500 text-slate-200 text-slate-300"
            >
              <option value="all">All Severities</option>
              <option value="high">High Severity</option>
              <option value="medium">Medium Severity</option>
              <option value="low">Low Severity</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Insight Category</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-navy-900/40 bg-navy-900/40 border border-white/[0.06] text-sm font-semibold rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-violet-500 text-slate-200 text-slate-300"
            >
              <option value="all">All Recommendation Types</option>
              <option value="revenue_declining">Revenue Decline</option>
              <option value="competitor_price_lower">Competitor Price Watch</option>
              <option value="growing_demand">Market Demand</option>
              <option value="declining_demand">Declining Demand</option>
              <option value="high_demand">High Demand</option>
              <option value="inventory_risk">Inventory Risks</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-bold text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-xl self-start lg:self-center">
          {filteredInsights.length} Recommendations Found
        </div>
      </div>

      {/* Insights Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
          <svg className="w-8 h-8 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-semibold">Analyzing your datasets...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 font-semibold">{error}</div>
      ) : filteredInsights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg className="w-14 h-14 text-violet-400/70 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h4 className="text-lg font-bold text-slate-300">All Clear! No alerts found</h4>
          <p className="text-sm text-slate-500 mt-1">
            Your operations are currently performing optimally. Try adjusting your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredInsights.map((insight) => {
            const parsed = parseDescription(insight.description);
            
            // Define styling colors based on severity
            const colorConfig = {
              high: {
                border: 'border-l-red-500 dark:border-l-red-500/80',
                badge: 'bg-red-500/10 text-red-700 text-red-400 border-red-200/50 dark:border-red-900/40',
                icon: (
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-600 text-red-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                )
              },
              medium: {
                border: 'border-l-amber-500 dark:border-l-amber-500/80',
                badge: 'bg-amber-500/10 text-amber-700 text-amber-400 border-amber-200/50 dark:border-amber-900/40',
                icon: (
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30 flex items-center justify-center text-amber-600 text-amber-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )
              },
              low: {
                border: 'border-l-indigo-500 dark:border-l-indigo-500/80',
                badge: 'bg-violet-500/10 text-indigo-700 dark:text-violet-400 border-violet-500/20',
                icon: (
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center text-violet-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                )
              }
            }[insight.severity] || { border: '', badge: '', icon: null };

            return (
              <div 
                key={insight.id}
                className={`bg-navy-800/60 border border-white/[0.06] border-l-4 ${colorConfig.border} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between`}
              >
                <div className="space-y-4">
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {colorConfig.icon}
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white leading-tight font-display">
                          {insight.title}
                        </h4>
                        <span className={`inline-flex items-center border text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5 ${colorConfig.badge}`}>
                          {insight.severity} severity
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDismiss(insight.id)}
                      className="p-1 text-slate-500 hover:text-slate-400 dark:hover:text-slate-300 rounded-lg hover:bg-navy-900/40 dark:hover:bg-slate-800 transition-colors self-start"
                      title="Dismiss Recommendation"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Body Text Sections */}
                  <div className="space-y-3 pt-2 text-xs leading-relaxed text-slate-300">
                    {/* Problem */}
                    {parsed.problem && (
                      <div>
                        <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wide block mb-0.5">Problem</span>
                        <p className="font-semibold text-slate-200">{parsed.problem}</p>
                      </div>
                    )}

                    {/* Reason */}
                    {parsed.reason && (
                      <div>
                        <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wide block mb-0.5">Reason</span>
                        <p>{parsed.reason}</p>
                      </div>
                    )}

                    {/* Affected Products */}
                    {parsed.affectedProducts && (
                      <div>
                        <span className="font-bold text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wide block mb-0.5">Affected Products</span>
                        <p>{parsed.affectedProducts}</p>
                      </div>
                    )}

                    {/* Recommendation */}
                    {parsed.recommendation && (
                      <div className="p-3.5 bg-violet-500/[0.07] border border-violet-500/10 rounded-xl">
                        <span className="font-bold text-[10px] text-violet-400 uppercase tracking-wide block mb-1">Recommendation</span>
                        <p className="font-medium text-slate-200">{parsed.recommendation}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Trigger Button */}
                <div className="mt-6 pt-4 border-t border-gray-150 border-white/[0.06] flex justify-end">
                  <button
                    onClick={() => setActionModal({ title: insight.title, recommendation: parsed.recommendation })}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Take Action
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Details Dialog Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-navy-800/60 glass-card rounded-2xl p-6 shadow-glass-lg space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white font-display flex items-center gap-2">
                <span className="text-xl">🚀</span> Action Strategy
              </h3>
              <button
                onClick={() => setActionModal(null)}
                className="p-1 text-slate-500 hover:text-slate-400 dark:hover:text-slate-200 hover:bg-navy-800/60/[0.05] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Target Area</span>
                <p className="font-semibold text-slate-200 text-sm">{actionModal.title}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Action Plan</span>
                <p className="text-xs leading-relaxed text-slate-300 p-3 bg-navy-900/40 bg-navy-900/40 rounded-xl border border-white/[0.04] border-white/[0.06]">
                  {actionModal.recommendation}
                </p>
              </div>

              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex gap-2">
                <span className="text-base">💡</span>
                <p className="font-medium">To proceed, you can export these details to your reports tab or discuss pricing strategies with your distributors immediately.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex justify-end">
              <button
                onClick={() => setActionModal(null)}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs rounded-xl hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-0.5 transition-all duration-300"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
