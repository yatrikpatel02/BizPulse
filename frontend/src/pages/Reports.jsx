import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { getReports, createReport, deleteReport } from '../services/reports';
import { getSalesAnalytics, getInventoryAnalytics, getCustomerAnalytics } from '../services/analytics';
import api from '../services/api';

export default function Reports() {
  const { activeBusiness } = useBusiness();
  const [activeTab, setActiveTab] = useState('generate'); // 'generate', 'history'
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate form state
  const [generationModal, setGenerationModal] = useState(null);
  const [formData, setFormData] = useState({
    startDate: '2023-01-01',
    endDate: '2025-12-31',
    format: 'PDF'
  });
  const [generating, setGenerating] = useState(false);

  // Report Viewer state
  const [reportViewer, setReportViewer] = useState(null);
  const [viewerData, setViewerData] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);

  // List of report templates
  const reportTemplates = [
    {
      id: 'executive',
      title: 'Executive Report',
      description: "A bird's-eye view of your company's performance, summarizing revenue growth, inventory health, and customer sentiment.",
      icon: (
        <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'sales',
      title: 'Sales Report',
      description: "Detailed analysis of transaction count, checkout volumes, average order values, and category-level revenue share.",
      icon: (
        <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'inventory',
      title: 'Inventory Report',
      description: "Full audit of sourced stock valuations, turnover ratio, out-of-stock items, and safety stock reorder thresholds.",
      icon: (
        <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      id: 'customer',
      title: 'Customer Report',
      description: "Detailed breakdown of feedback sentiment analysis, average star ratings, review distribution, and complaints classification.",
      icon: (
        <svg className="w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      id: 'market',
      title: 'Market Report',
      description: "External demand indicators, keyword interest volumes, search patterns, and competitive price positioning analyses.",
      icon: (
        <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    }
  ];

  // Fetch report history
  const fetchReportHistory = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getReports({ business_id: activeBusiness.id });
      const raw = res.data || res;
      const dataArray = Array.isArray(raw) ? raw : (raw.results || []);
      setReports(dataArray);
    } catch (err) {
      console.error("Failed to load reports history", err);
      setError("Failed to load reports history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchReportHistory();
    }
  }, [activeTab, activeBusiness]);

  // Handle Generate Submission
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!activeBusiness || !generationModal) return;

    setGenerating(true);
    try {
      const payload = {
        report_type: generationModal.id,
        parameters: {
          start_date: formData.startDate,
          end_date: formData.endDate,
          file_format: formData.format
        }
      };

      await createReport(payload);
      setGenerationModal(null);
      setActiveTab('history');
      fetchReportHistory();
    } catch (err) {
      console.error("Report generation failed", err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Handle Delete Report
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report from history?")) return;
    try {
      await deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Failed to delete report", err);
      alert("Failed to delete report from history.");
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Format currency
  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Fetch REAL data when user clicks "View" on a report
  const handleViewReport = async (report) => {
    setReportViewer(report);
    setViewerLoading(true);
    setViewerData(null);

    const params = {
      start_date: report.parameters?.start_date || '2023-01-01',
      end_date: report.parameters?.end_date || '2025-12-31',
    };

    try {
      const data = {};

      if (report.report_type === 'sales' || report.report_type === 'executive') {
        try {
          data.sales = await getSalesAnalytics(params);
        } catch (e) { data.sales = null; }
      }
      if (report.report_type === 'inventory' || report.report_type === 'executive') {
        try {
          data.inventory = await getInventoryAnalytics(params);
        } catch (e) { data.inventory = null; }
      }
      if (report.report_type === 'customer' || report.report_type === 'executive') {
        try {
          data.customer = await getCustomerAnalytics(params);
        } catch (e) { data.customer = null; }
      }
      if (report.report_type === 'market') {
        try {
          const res = await api.get('/analytics/market-insights/', { params: { keywords: 'electronics,apparel,headphones' } });
          data.market = res.data;
        } catch (e) { data.market = null; }
      }

      setViewerData(data);
    } catch (err) {
      console.error("Failed to load report data", err);
    } finally {
      setViewerLoading(false);
    }
  };

  // ─── Render Section-Specific Report Body ───
  const renderSalesSection = (sales) => {
    if (!sales) return <p className="text-xs text-gray-400 italic">Sales data unavailable for this period.</p>;
    const metrics = sales.metrics || sales;
    const products = sales.product_performance || [];
    
    // Calculate AOV
    const totalOrders = metrics.transaction_count || 0;
    const avgOrderValue = totalOrders > 0 ? (metrics.total_revenue / totalOrders) : 0;

    return (
      <div className="space-y-3">
        <h5 className="font-bold text-gray-800 dark:text-slate-200">📊 Sales Performance</h5>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Revenue</span>
            <span className="text-sm font-extrabold text-gray-900 dark:text-white">{formatCurrency(metrics.total_revenue)}</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Orders</span>
            <span className="text-sm font-extrabold text-gray-900 dark:text-white">{Number(totalOrders).toLocaleString()}</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Avg. Order Value</span>
            <span className="text-sm font-extrabold text-gray-900 dark:text-white">{formatCurrency(avgOrderValue)}</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Quantity Sold</span>
            <span className="text-sm font-extrabold text-gray-900 dark:text-white">{Number(metrics.total_quantity || 0).toLocaleString()}</span>
          </div>
        </div>
        {/* Top Products */}
        {products.length > 0 && (
          <div>
            <h6 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mt-3 mb-2">Top Selling Products</h6>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b dark:border-slate-800">
                  <th className="text-left py-1.5 font-bold text-gray-400">Product</th>
                  <th className="text-right py-1.5 font-bold text-gray-400">Revenue</th>
                  <th className="text-right py-1.5 font-bold text-gray-400">Qty</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((p, i) => (
                  <tr key={i} className="border-b dark:border-slate-800/40">
                    <td className="py-1.5 font-semibold text-gray-700 dark:text-slate-300">{p.product_name || `Product ${i+1}`}</td>
                    <td className="py-1.5 text-right text-gray-600 dark:text-slate-400">{formatCurrency(p.total_revenue)}</td>
                    <td className="py-1.5 text-right text-gray-600 dark:text-slate-400">{p.total_quantity || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderInventorySection = (inv) => {
    if (!inv) return <p className="text-xs text-gray-400 italic">Inventory data unavailable for this period.</p>;
    const summary = inv.health || {};
    const anomalies = inv.anomalies || [];
    return (
      <div className="space-y-3">
        <h5 className="font-bold text-gray-800 dark:text-slate-200">📦 Inventory Health</h5>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Products Tracked</span>
            <span className="text-sm font-extrabold text-gray-900 dark:text-white">{summary.total_products != null ? summary.total_products : '-'}</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Stock Value</span>
            <span className="text-sm font-extrabold text-gray-900 dark:text-white">{formatCurrency(summary.total_value)}</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Out of Stock Items</span>
            <span className="text-sm font-extrabold text-red-600 dark:text-red-400">{summary.out_of_stock_count || 0}</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Low Stock Alerts</span>
            <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{summary.understock_count || 0}</span>
          </div>
        </div>
        {/* Anomalies */}
        {anomalies.length > 0 && (
          <div>
            <h6 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mt-3 mb-2">Stock Anomalies</h6>
            <ul className="space-y-1.5 text-xs">
              {anomalies.slice(0, 5).map((a, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.quantity_on_hand === 0 ? 'bg-red-500' : 'bg-amber-400'}`}></span>
                  <span className="font-semibold">{a.product__name || a.product_name || `Item ${i+1}`}</span>
                  <span className="text-gray-400">— Qty: {a.quantity_on_hand ?? a.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderCustomerSection = (cust) => {
    if (!cust) return <p className="text-xs text-gray-400 italic">Customer data unavailable for this period.</p>;
    const summary = cust;
    const sentiments = cust.sentiment_distribution || {};
    const complaints = cust.complaints_by_category || [];
    return (
      <div className="space-y-3">
        <h5 className="font-bold text-gray-800 dark:text-slate-200">💬 Customer Feedback Intelligence</h5>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Reviews</span>
            <span className="text-sm font-extrabold text-gray-900 dark:text-white">{summary.total_reviews != null ? summary.total_reviews : '-'}</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Average Rating</span>
            <span className="text-sm font-extrabold text-gray-900 dark:text-white">{Number(summary.average_rating || 0).toFixed(1)} ⭐</span>
          </div>
        </div>
        {/* Sentiment Breakdown */}
        {Object.keys(sentiments).length > 0 && (
          <div>
            <h6 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mt-3 mb-2">Sentiment Distribution</h6>
            <div className="flex flex-wrap gap-2">
              {Object.entries(sentiments).map(([key, val]) => {
                if (key.endsWith('_pct')) return null;
                return (
                  <span key={key} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    key.toLowerCase().includes('positive') ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/40' :
                    key.toLowerCase().includes('negative') ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200/40' :
                    'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200/40'
                  }`}>
                    {key}: {val} ({sentiments[`${key}_pct`]}%)
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {/* Complaints */}
        {complaints.length > 0 && (
          <div>
            <h6 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mt-3 mb-2">Top Complaint Categories</h6>
            <ul className="space-y-1 text-xs">
              {complaints.slice(0, 5).map((c, i) => (
                <li key={i} className="text-gray-700 dark:text-slate-300 font-medium">
                  • {c.category} — {c.count} reports
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderMarketSection = (market) => {
    if (!market) return <p className="text-xs text-gray-400 italic">Market data unavailable.</p>;
    const insights = market.insights || market.results || [];
    return (
      <div className="space-y-3">
        <h5 className="font-bold text-gray-800 dark:text-slate-200">📈 Market Trend Insights</h5>
        {insights.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No market trend data available for the analyzed keywords.</p>
        ) : (
          <div className="space-y-3">
            {insights.map((ins, i) => (
              <div key={i} className="p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800 dark:text-white capitalize">{ins.keyword || ins.term}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    ins.insight_type === 'Opportunity' || ins.insight_type === 'Positive Trend' ? 'bg-emerald-100 text-emerald-700' :
                    ins.insight_type === 'Risk' || ins.insight_type === 'Warning' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{ins.insight_type}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{ins.recommendation || ins.description || ''}</p>
                {ins.pct_change != null && (
                  <span className="text-[10px] font-bold text-gray-400 mt-1 block">Trend Change: {Number(ins.pct_change).toFixed(1)}%</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight font-display">
            Business Reports
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Generate structured reports with real analytics data from your business.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-gray-50/80 dark:bg-slate-950/60 border border-gray-100 dark:border-slate-900 p-1.5 rounded-xl self-start sm:self-center">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
              activeTab === 'generate'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
          >
            Generate Report
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* GENERATE TAB */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 hover:-translate-y-1 hover:shadow-xl rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all duration-300 group"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-slate-800/65 rounded-xl border dark:border-slate-700/50 group-hover:scale-105 transition-transform duration-300">
                    {template.icon}
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white font-display text-base">
                    {template.title}
                  </h4>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                  {template.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-150 dark:border-slate-800/80 flex justify-end">
                <button
                  onClick={() => setGenerationModal(template)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all duration-300"
                >
                  Generate PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-2xl shadow-md overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-slate-400 space-y-3">
              <svg className="w-8 h-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-semibold">Loading report history...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 font-semibold">{error}</div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg className="w-12 h-12 text-gray-300 dark:text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h4 className="text-lg font-bold text-gray-700 dark:text-slate-300">No reports generated yet</h4>
              <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                Go to the Generate tab to create and export your first business report.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-150 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-900/50">
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Report Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Generated Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40">
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-indigo-50/10 dark:hover:bg-slate-800/20 transition-colors cursor-default"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white capitalize">
                          {report.report_type} Report
                        </div>
                        <div className="text-xs text-gray-400 font-medium">
                          Range: {report.parameters?.start_date || '-'} to {report.parameters?.end_date || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-600 dark:text-slate-300">
                        {formatDate(report.generated_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          report.status === 'completed'
                            ? 'bg-emerald-100/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/40'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleViewReport(report)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-all duration-200"
                            title="View Report with Real Data"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all duration-200"
                            title="Delete Report"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog for PDF generation settings */}
      {generationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b dark:border-slate-800/80 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">
                Generate {generationModal.title}
              </h3>
              <button
                onClick={() => setGenerationModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Start Date</label>
                <input
                  type="date" value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm outline-none text-gray-900 dark:text-white transition-all duration-200"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">End Date</label>
                <input
                  type="date" value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm outline-none text-gray-900 dark:text-white transition-all duration-200"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Export Format</label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm outline-none text-gray-800 dark:text-slate-300 font-semibold transition-all duration-200"
                >
                  <option value="PDF">Adobe PDF (.pdf)</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-slate-800/80">
                <button type="button" onClick={() => setGenerationModal(null)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-semibold text-sm rounded-xl transition-all duration-200">
                  Cancel
                </button>
                <button type="submit" disabled={generating}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 transition-all duration-300">
                  {generating ? 'Exporting...' : 'Export Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Viewer Modal — shows REAL data */}
      {reportViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b dark:border-slate-800/80 pb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display capitalize flex items-center gap-2">
                <span>📄</span> {reportViewer.report_type} Report
              </h3>
              <button onClick={() => { setReportViewer(null); setViewerData(null); }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Document Content */}
            <div id="report-print-area" className="space-y-6 text-sm text-gray-700 dark:text-slate-300 p-6 bg-gray-50/50 dark:bg-slate-950/40 rounded-2xl border border-gray-100 dark:border-slate-800/80">
              {/* Report Header */}
              <div className="flex justify-between items-start border-b dark:border-slate-800 pb-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white font-display capitalize">{reportViewer.report_type} Report</h4>
                  <p className="text-xs text-gray-400">
                    Period: <strong>{reportViewer.parameters?.start_date || '2023-01-01'}</strong> to <strong>{reportViewer.parameters?.end_date || '2025-12-31'}</strong>
                  </p>
                  <p className="text-xs text-gray-400">Generated on {formatDate(reportViewer.generated_at)}</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">BIZPULSE</span>
              </div>

              {/* Data Loading State */}
              {viewerLoading ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <svg className="w-7 h-7 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-xs font-semibold text-gray-400">Fetching real analytics data...</span>
                </div>
              ) : viewerData ? (
                <div className="space-y-6">
                  {/* Executive = all sections */}
                  {reportViewer.report_type === 'executive' && (
                    <>
                      {renderSalesSection(viewerData.sales)}
                      <hr className="dark:border-slate-800" />
                      {renderInventorySection(viewerData.inventory)}
                      <hr className="dark:border-slate-800" />
                      {renderCustomerSection(viewerData.customer)}
                    </>
                  )}

                  {reportViewer.report_type === 'sales' && renderSalesSection(viewerData.sales)}
                  {reportViewer.report_type === 'inventory' && renderInventorySection(viewerData.inventory)}
                  {reportViewer.report_type === 'customer' && renderCustomerSection(viewerData.customer)}
                  {reportViewer.report_type === 'market' && renderMarketSection(viewerData.market)}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic text-center py-8">No data could be loaded for this report.</p>
              )}

              {/* Sign-off */}
              <div className="pt-6 border-t dark:border-slate-800 flex justify-between items-center text-[10px] text-gray-400">
                <span>© 2026 BizPulse Analytics</span>
                <span>Auto-generated from live database</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t dark:border-slate-800/80 flex items-center justify-end gap-3">
              <button onClick={() => { setReportViewer(null); setViewerData(null); }}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all duration-200">
                Close
              </button>
              <button onClick={() => window.print()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all duration-300">
                🖨️ Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
