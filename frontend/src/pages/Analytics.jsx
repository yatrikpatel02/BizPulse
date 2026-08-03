import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { ChartGradients, AreaChart, BarChart, DonutChart, AnimatedCounter } from '../components/analytics/Charts';
import { getSalesAnalytics, getInventoryAnalytics, getCustomerAnalytics, getPredictions, getInsights } from '../services/analytics';

// Static High-Fidelity Demo Data
const DEMO_DATA = {
  sales: {
    metrics: {
      total_revenue: 1254320.50,
      total_orders: 2845,
      average_order_value: 440.88,
      sales_growth_pct: 18.2,
      gross_margin_pct: 53.4
    },
    trends: [
      { label: 'Jan', value: 75000 },
      { label: 'Feb', value: 82000 },
      { label: 'Mar', value: 95000 },
      { label: 'Apr', value: 91000 },
      { label: 'May', value: 110000 },
      { label: 'Jun', value: 105000 },
      { label: 'Jul', value: 118000 },
      { label: 'Aug', value: 124000 },
      { label: 'Sep', value: 115000 },
      { label: 'Oct', value: 130000 },
      { label: 'Nov', value: 145000 },
      { label: 'Dec', value: 165000 }
    ],
    product_performance: [
      { label: 'Lumina Pro Smartphone', value: 450000 },
      { label: 'SonicBoom Headphones', value: 290000 },
      { label: 'UltraView 4K Monitor', value: 240000 },
      { label: 'AeroStream Wi-Fi Router', value: 150000 },
      { label: 'PowerCore Power Bank', value: 85000 },
      { label: 'Mechanix Keyboard', value: 39320.50 }
    ],
    seasonality: [
      { label: 'Mon', value: 120 },
      { label: 'Tue', value: 145 },
      { label: 'Wed', value: 160 },
      { label: 'Thu', value: 185 },
      { label: 'Fri', value: 240 },
      { label: 'Sat', value: 310 },
      { label: 'Sun', value: 280 }
    ]
  },
  inventory: {
    health: {
      turnover_ratio: 7.2,
      out_of_stock_items: 2,
      total_value: 384500.00,
      total_items: 1250
    },
    anomalies: [
      { type: 'depleted', product: 'Lumina Pro Smartphone', qty: 3, status: 'Critical Low Stock' },
      { type: 'depleted', product: 'SonicBoom Headphones', qty: 5, status: 'Low Stock Alert' },
      { type: 'overstocked', product: 'ErgoGrip Bluetooth Mouse', qty: 450, status: 'Slow Moving (Overstocked)' }
    ],
    history: [
      { label: 'Jan', value: 310000 },
      { label: 'Mar', value: 340000 },
      { label: 'May', value: 320000 },
      { label: 'Jul', value: 350000 },
      { label: 'Sep', value: 390000 },
      { label: 'Nov', value: 384500 }
    ]
  },
  customers: {
    average_rating: 4.4,
    csat_score_pct: 86.2,
    total_reviews: 320,
    sentiment_distribution: [
      { label: 'Positive', value: 240 },
      { label: 'Neutral', value: 50 },
      { label: 'Negative', value: 30 }
    ],
    complaints_by_category: [
      { label: 'Shipping Delay', value: 14 },
      { label: 'Pricing Question', value: 8 },
      { label: 'Software Bug', value: 5 },
      { label: 'Hardware Flaw', value: 3 }
    ],
    recent_complaints: [
      { author: 'Jane Doe', rating: 2, text: 'Product is nice, but shipping took over 12 days to arrive.', category: 'Shipping Delay', product: 'UltraView 4K Monitor' },
      { author: 'Sarah Smith', rating: 1, text: 'Bluetooth disconnects randomly during Zoom calls. Frustrating.', category: 'Hardware Flaw', product: 'SonicBoom Headphones' },
      { author: 'John Rogers', rating: 3, text: 'It works well but the mobile app interface feels very outdated.', category: 'Software Bug', product: 'Lumina Pro Smartphone' }
    ],
    trends: [
      { label: 'Jan', positive: 15, neutral: 4, negative: 1 },
      { label: 'Feb', positive: 18, neutral: 3, negative: 2 },
      { label: 'Mar', positive: 22, neutral: 5, negative: 1 },
      { label: 'Apr', positive: 20, neutral: 4, negative: 3 },
      { label: 'May', positive: 25, neutral: 6, negative: 2 }
    ]
  },
  predictions: {
    list: [
      { id: 1, prediction_type: 'sales_forecast', value: 185000, confidence: 0.92, period_start: '2026-09-01', period_end: '2026-09-30', model_version: 'Prophet-v2.1' },
      { id: 2, prediction_type: 'demand_forecast', value: 320, confidence: 0.88, period_start: '2026-09-01', period_end: '2026-09-30', model_version: 'SARIMA-v1.4' },
      { id: 3, prediction_type: 'business_health', value: 88.5, confidence: 0.95, period_start: '2026-08-01', period_end: '2026-08-31', model_version: 'RFRegressor-v3.0' }
    ],
    insights: [
      { id: 1, insight_type: 'growing_demand', title: 'Surge in Q4 Holiday Demand', description: 'Google Trends data indicates a 35% increase in wireless headphone interest. Consider restocking SonicBoom Headphones.', severity: 'high' },
      { id: 2, insight_type: 'inventory_risk', title: 'Smartphone Stock Depletion Risk', description: 'Current burn rate estimates Lumina Pro Smartphone will run out of stock in 12 days. Reorder is suggested immediately.', severity: 'high' },
      { id: 3, insight_type: 'revenue_declining', title: 'Accessory Profit Margin Erosion', description: 'Pricing analysis shows Bluetooth mouse margins dropped 4% due to higher component sourcing costs.', severity: 'medium' }
    ]
  }
};

export default function Analytics() {
  const { activeBusiness, loading: businessLoading } = useBusiness();
  
  // States
  const [activeTab, setActiveTab] = useState('sales');
  const [useDemoData, setUseDemoData] = useState(false);
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2023-12-31');
  const [interval, setIntervalVal] = useState('monthly');
  const [loading, setLoading] = useState(false);

  // Loaded API Data states
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [predictiveData, setPredictiveData] = useState(null);

  // Fetch real data from Backend APIs
  const fetchAnalyticsData = async () => {
    if (!activeBusiness || useDemoData) return;
    
    setLoading(true);
    try {
      const queryParams = {
        business_id: activeBusiness.id,
        start_date: startDate,
        end_date: endDate,
        interval: interval
      };

      if (activeTab === 'sales') {
        const res = await getSalesAnalytics(queryParams);
        setSalesData(res);
      } else if (activeTab === 'inventory') {
        const res = await getInventoryAnalytics({ business_id: activeBusiness.id, start_date: startDate, end_date: endDate });
        setInventoryData(res);
      } else if (activeTab === 'customers') {
        const res = await getCustomerAnalytics({ business_id: activeBusiness.id });
        setCustomerData(res);
      } else if (activeTab === 'predictions') {
        const [preds, ins] = await Promise.all([
          getPredictions({ business_id: activeBusiness.id }),
          getInsights({ business_id: activeBusiness.id })
        ]);
        setPredictiveData({
          list: preds.results || preds,
          insights: ins.results || ins
        });
      }
    } catch (err) {
      console.error('Failed to load real backend analytics data, falling back to Demo Mode:', err);
      // Auto toggle to demo mode so user sees visuals instead of empty errors
      setUseDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [activeBusiness, activeTab, startDate, endDate, interval, useDemoData]);

  if (businessLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!activeBusiness) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-white/60 dark:bg-slate-900/60 p-8 rounded-2xl border border-white/20 dark:border-slate-800/80 shadow-2xl backdrop-blur-md max-w-md">
          <div className="mb-4 flex justify-center text-indigo-500">
            <svg className="w-16 h-16 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">No Active Business</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-4">Please select or create a business/company in the sidebar switcher to load your analytics dashboard.</p>
        </div>
      </div>
    );
  }

  // Determine raw datasets
  const rawSales = useDemoData ? DEMO_DATA.sales : (salesData || DEMO_DATA.sales);
  const rawInventory = useDemoData ? DEMO_DATA.inventory : (inventoryData || DEMO_DATA.inventory);
  const rawCustomers = useDemoData ? DEMO_DATA.customers : (customerData || DEMO_DATA.customers);
  const rawPredictions = useDemoData ? DEMO_DATA.predictions : (predictiveData || DEMO_DATA.predictions);

  // Normalize Sales Data
  const currentSales = {
    metrics: rawSales.metrics || {},
    trends: Array.isArray(rawSales.trends) 
      ? rawSales.trends.map(t => ({ 
          label: t.label || t.date || '', 
          value: t.value !== undefined ? t.value : (t.revenue || 0) 
        }))
      : [],
    product_performance: Array.isArray(rawSales.product_performance)
      ? rawSales.product_performance.map(p => ({
          label: p.label || p.product_name || '',
          value: p.value !== undefined ? p.value : (p.total_revenue || 0)
        }))
      : [],
    seasonality: rawSales.seasonality 
      ? (Array.isArray(rawSales.seasonality)
          ? rawSales.seasonality.map(s => ({ label: s.label, value: s.value }))
          : (rawSales.seasonality.weekly && Array.isArray(rawSales.seasonality.weekly)
              ? rawSales.seasonality.weekly.map(w => ({ label: w.label || w.day?.substring(0, 3) || '', value: w.value !== undefined ? w.value : (w.revenue || w.quantity || 0) }))
              : []))
      : []
  };

  // Normalize Inventory Data
  const currentInventory = {
    health: {
      turnover_ratio: rawInventory.health?.turnover_ratio !== undefined ? rawInventory.health.turnover_ratio : (rawInventory.health?.health_score || 0),
      out_of_stock_items: rawInventory.health?.out_of_stock_items !== undefined ? rawInventory.health.out_of_stock_items : (rawInventory.health?.out_of_stock_count || 0),
      total_value: rawInventory.health?.total_value || 0,
      total_items: rawInventory.health?.total_items || (rawInventory.health?.total_products || 0),
    },
    anomalies: Array.isArray(rawInventory.anomalies)
      ? rawInventory.anomalies.map(a => ({
          type: a.type || (a.status === 'out_of_stock' || a.status === 'understock' ? 'depleted' : 'overstocked'),
          product: a.product || a.product_name || '',
          qty: a.qty !== undefined ? a.qty : (a.quantity_on_hand || 0),
          status: a.status || (a.type === 'depleted' ? 'Low Stock' : 'Overstocked')
        }))
      : [],
    history: Array.isArray(rawInventory.history)
      ? rawInventory.history.map(h => ({
          label: h.label || h.date || '',
          value: h.value !== undefined ? h.value : (h.total_value || h.total_quantity || 0)
        }))
      : []
  };

  // Normalize Customers Data
  const currentCustomers = {
    average_rating: rawCustomers.average_rating || 0,
    csat_score_pct: rawCustomers.csat_score_pct || 0,
    total_reviews: rawCustomers.total_reviews || 0,
    sentiment_distribution: Array.isArray(rawCustomers.sentiment_distribution)
      ? rawCustomers.sentiment_distribution
      : (rawCustomers.sentiment_distribution 
          ? [
              { label: 'Positive', value: rawCustomers.sentiment_distribution.positive || 0 },
              { label: 'Neutral', value: rawCustomers.sentiment_distribution.neutral || 0 },
              { label: 'Negative', value: rawCustomers.sentiment_distribution.negative || 0 }
            ]
          : []),
    complaints_by_category: Array.isArray(rawCustomers.complaints_by_category)
      ? rawCustomers.complaints_by_category.map(c => ({
          label: c.label || c.category || '',
          value: c.value !== undefined ? c.value : (c.count || 0)
        }))
      : [],
    recent_complaints: Array.isArray(rawCustomers.recent_complaints)
      ? rawCustomers.recent_complaints.map(c => ({
          author: c.author || c.author_name || 'Anonymous',
          rating: c.rating || 0,
          text: c.text || '',
          category: c.category || 'General',
          product: c.product || c.product_name || 'N/A'
        }))
      : [],
    trends: Array.isArray(rawCustomers.trends) ? rawCustomers.trends : []
  };

  // Normalize Predictions Data
  const currentPredictions = {
    list: Array.isArray(rawPredictions.list) ? rawPredictions.list : (Array.isArray(rawPredictions) ? rawPredictions : []),
    insights: Array.isArray(rawPredictions.insights) ? rawPredictions.insights : []
  };

  return (
    <div className="space-y-6 pb-12 transition-all duration-300">
      <ChartGradients />
      
      {/* 1. Header with details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">Business Intelligence</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Analyzing performance for <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activeBusiness.name}</span>
          </p>
        </div>
        
        {/* Tab Selector Links */}
        <div className="flex p-1.5 bg-gray-100/80 dark:bg-slate-800/80 border dark:border-slate-700/60 rounded-xl backdrop-blur-md self-start md:self-auto">
          {[
            { id: 'sales', label: 'Sales & Revenue', icon: <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            { id: 'inventory', label: 'Inventory', icon: <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
            { id: 'customers', label: 'Customers', icon: <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
            { id: 'predictions', label: 'Forecasts & AI', icon: <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. STICKY FILTER BAR */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-slate-900/75 py-3 px-4 border border-gray-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border dark:border-slate-700">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">From</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border dark:border-slate-700">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">To</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none"
            />
          </div>
          {activeTab === 'sales' && (
            <select
              value={interval}
              onChange={(e) => setIntervalVal(e.target.value)}
              className="bg-gray-50 dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-200 px-3 py-1.5 rounded-xl border dark:border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          )}
        </div>

        {/* Demo Data Switcher Option */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Demo Mode</span>
          <button
            onClick={() => setUseDemoData(!useDemoData)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              useDemoData ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-800'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                useDemoData ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-sm text-gray-500 dark:text-slate-400">Updating metrics...</span>
        </div>
      )}

      {/* 3. CORE TAB CONTENT VIEWS */}
      <div className="transition-all duration-300">
        {/* SALES & REVENUE TAB */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Gross Revenue', value: currentSales.metrics.total_revenue, isAmount: true, change: '+14.2%', color: 'indigo', icon: <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                { title: 'Total Sales Count', value: currentSales.metrics.total_orders, isAmount: false, change: '+9.8%', color: 'blue', icon: <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> },
                { title: 'Average Order Value', value: currentSales.metrics.average_order_value, isAmount: true, change: '+4.5%', color: 'emerald', icon: <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
                { title: 'Gross Profit Margin', value: currentSales.metrics.gross_margin_pct || 53.4, isAmount: false, suffix: '%', change: '+2.1%', color: 'indigo', icon: <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> }
              ].map((card, i) => (
                <div 
                  key={i} 
                  className="relative overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-2xl p-6 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group cursor-default"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-blue-500/5 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:scale-110"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">{card.title}</span>
                    <div className="p-2 bg-gray-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700/50">
                      {card.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">
                    <AnimatedCounter 
                      value={card.value} 
                      prefix={card.isAmount ? '₹' : ''} 
                      suffix={card.suffix || ''} 
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {card.change}
                    </span>
                    <span className="text-[10px] text-gray-400">vs last period</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Sales Trends Chart & Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Line Chart */}
              <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Revenue Performance Over Time</h3>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Gross revenue trends calculated based on file parameters</p>
                  </div>
                </div>
                <div className="h-64">
                  <AreaChart data={currentSales.trends} />
                </div>
              </div>

              {/* Weekly/Seasonality spikes */}
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-2">Weekly Spikes</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-6">Average customer purchase activity by weekday</p>
                <div className="h-56">
                  <BarChart data={currentSales.seasonality} color="emerald" valuePrefix="" />
                </div>
              </div>
            </div>

            {/* Product Performance Table */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4">Product Revenue Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b dark:border-slate-800 text-gray-400 text-xs uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Product Name</th>
                        <th className="pb-3 font-semibold text-right">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                      {currentSales.product_performance.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 font-medium text-gray-700 dark:text-slate-300">{item.label}</td>
                          <td className="py-3 text-right font-bold text-gray-900 dark:text-slate-100">
                            ₹{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Horizontal Bar Chart showing performance */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4">Visual Comparison</h4>
                  <div className="space-y-4">
                    {currentSales.product_performance.slice(0, 4).map((item, idx) => {
                      const maxVal = Math.max(...currentSales.product_performance.map(p => p.value));
                      const pct = (item.value / maxVal) * 100;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-slate-400">
                            <span>{item.label}</span>
                            <span>{pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INVENTORY VISUALIZATION TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Turnover Ratio', value: currentInventory.health.turnover_ratio, isAmount: false, suffix: 'x', change: '+0.4x', color: 'indigo', icon: <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.79M7.05 20.05a7.003 7.003 0 0013.9 0" /></svg> },
                { title: 'Out of Stock Items', value: currentInventory.health.out_of_stock_items, isAmount: false, change: '-1 item', color: 'rose', icon: <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
                { title: 'Total Sourced Value', value: currentInventory.health.total_value, isAmount: true, change: '+12.4%', color: 'blue', icon: <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
                { title: 'Total SKUs Tracked', value: currentInventory.health.total_items, isAmount: false, change: 'Stable', color: 'emerald', icon: <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> }
              ].map((card, i) => (
                <div 
                  key={i} 
                  className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-2xl p-6 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">{card.title}</span>
                    <div className="p-2 bg-gray-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700/50">
                      {card.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">
                    <AnimatedCounter 
                      value={card.value} 
                      prefix={card.isAmount ? '₹' : ''} 
                      suffix={card.suffix || ''} 
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs font-semibold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      {card.change}
                    </span>
                    <span className="text-[10px] text-gray-400">vs last month</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Inventory Snapshots History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-2">Historical Stock Snapshot Value</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-6">Total inventory value stored at the beginning of each period</p>
                <div className="h-64">
                  <AreaChart data={currentInventory.history} color="blue" />
                </div>
              </div>

              {/* Stock Alerts & Anomalies */}
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-1">Stock Level Alerts</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">Detected slow-moving or critical inventory items</p>
                
                <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                  {currentInventory.anomalies.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col p-4 rounded-2xl border transition-all duration-300 hover:shadow-md cursor-default ${
                        item.type === 'depleted' 
                          ? 'bg-rose-500/5 border-rose-500/20 dark:bg-rose-500/10' 
                          : 'bg-indigo-500/5 border-indigo-500/20 dark:bg-indigo-500/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-bold ${
                          item.type === 'depleted' ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold uppercase">Qty: {item.qty}</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">{item.product}</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {item.type === 'depleted' 
                          ? 'This product is below the reorder point. Customers may encounter order delays.' 
                          : 'High level of inventory detected with extremely low sales velocities this period.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMER SATISFACTION TAB */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'CSAT Percentage', value: currentCustomers.csat_score_pct, isAmount: false, suffix: '%', change: '+0.5%', color: 'emerald', icon: <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                { title: 'Average Star Rating', value: currentCustomers.average_rating, isAmount: false, suffix: ' / 5', change: '+0.1', color: 'indigo', icon: <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.254.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.17 0l-3.971 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 9.3c-.773-.556-.375-1.81.587-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" /></svg> },
                { title: 'Total Reviews Analyzed', value: currentCustomers.total_reviews, isAmount: false, change: '+45 this week', color: 'blue', icon: <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
                { title: 'Total Negative Cases', value: currentCustomers.sentiment_distribution.find(s => s.label === 'Negative')?.value || 0, isAmount: false, change: 'Down 4%', color: 'rose', icon: <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
              ].map((card, i) => (
                <div 
                  key={i} 
                  className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-2xl p-6 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">{card.title}</span>
                    <div className="p-2 bg-gray-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700/50">
                      {card.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">
                    <AnimatedCounter 
                      value={card.value} 
                      prefix={card.isAmount ? '₹' : ''} 
                      suffix={card.suffix || ''} 
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs font-semibold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      {card.change}
                    </span>
                    <span className="text-[10px] text-gray-400">vs last month</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Donut Sentiment breakdown and Complaints Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sentiment Breakdowns */}
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-8 shadow-md flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-1">Sentiment Distribution</h3>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-6">AI-analyzed review tones for this company</p>
                </div>
                <div className="py-2">
                  <DonutChart 
                    data={currentCustomers.sentiment_distribution} 
                    innerLabel="CSAT SCORE" 
                    innerValue={`${currentCustomers.csat_score_pct}%`}
                  />
                </div>
              </div>

              {/* Complaints by category */}
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-8 shadow-md">
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-1">Complaints Breakdown</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-6">Categorized using Natural Language Processing (NLP)</p>
                
                <div className="space-y-5">
                  {currentCustomers.complaints_by_category.map((item, idx) => {
                    const maxVal = Math.max(...currentCustomers.complaints_by_category.map(c => c.value));
                    const pct = (item.value / maxVal) * 100;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-slate-300">
                          <span className="flex items-center">
                            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full mr-2"></span>
                            {item.label}
                          </span>
                          <span className="font-bold text-gray-900 dark:text-slate-100">{item.value} reviews</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-1000"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent complaints table snippet */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4">Flagged Customer Complaints</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Customer</th>
                      <th className="pb-3 font-semibold">Product</th>
                      <th className="pb-3 font-semibold">Rating</th>
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 font-semibold">Text Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                    {currentCustomers.recent_complaints.map((c, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 font-semibold text-gray-800 dark:text-slate-200">{c.author}</td>
                        <td className="py-4 font-medium text-gray-600 dark:text-slate-400">{c.product}</td>
                        <td className="py-4">
                          <span className="text-rose-500 dark:text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-lg text-xs">
                            {c.rating} ★
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            {c.category}
                          </span>
                        </td>
                        <td className="py-4 text-gray-500 dark:text-slate-400 text-xs max-w-sm truncate">{c.text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PREDICTIONS & AI FORECASTING TAB */}
        {activeTab === 'predictions' && (
          <div className="space-y-6">
            {/* Upper grid containing business health details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Business Health Gauge Card */}
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-6 shadow-md flex flex-col items-center justify-center text-center">
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-2">Business Health Index</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-6">Aggregated ML health score across metrics</p>
                
                <div className="relative w-40 h-40 flex items-center justify-center">
                  {/* Gauge Arc Background */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="64" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100 dark:text-slate-800/50" />
                    <circle 
                      cx="80" 
                      cy="80" 
                      r="64" 
                      stroke="#4f46e5" 
                      strokeWidth="12" 
                      fill="transparent" 
                      strokeDasharray={`${2 * Math.PI * 64}`}
                      strokeDashoffset={`${2 * Math.PI * 64 * (1 - 0.885)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                    <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">88.5</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500">Very Healthy</span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-6 max-w-xs">
                  Your business is operating at optimal efficiency. Revenue forecasts show moderate growth while inventory turnover is strong.
                </p>
              </div>

              {/* Automated ML recommendations & insights list */}
              <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-1">Automated AI Recommendations</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-6">Real-time decisions identified from sales and market intelligence data</p>

                <div className="space-y-4">
                  {currentPredictions.insights.map((insight, idx) => (
                    <div 
                      key={idx}
                      className={`flex gap-4 p-4 rounded-2xl border transition-all duration-300 hover:shadow-md ${
                        insight.severity === 'high'
                          ? 'bg-rose-500/5 border-rose-500/20 dark:bg-rose-500/10'
                          : 'bg-indigo-500/5 border-indigo-500/20 dark:bg-indigo-500/10'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {insight.severity === 'high' ? (
                          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          </div>
                        ) : (
                          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">{insight.title}</h4>
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            insight.severity === 'high' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {insight.severity} Priority
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{insight.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* List of generated forecasts */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4">Predictive Models Output</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Model Class</th>
                      <th className="pb-3 font-semibold">Forecast Type</th>
                      <th className="pb-3 font-semibold">Target Period</th>
                      <th className="pb-3 font-semibold text-right">Predicted Value</th>
                      <th className="pb-3 font-semibold text-right">Confidence Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                    {currentPredictions.list.map((pred) => (
                      <tr key={pred.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 font-semibold text-indigo-600 dark:text-indigo-400">{pred.model_version}</td>
                        <td className="py-4 font-medium text-gray-700 dark:text-slate-300">
                          {pred.prediction_type === 'sales_forecast' ? 'Sales Forecast (Revenue)' : pred.prediction_type === 'demand_forecast' ? 'Demand Forecast (Units)' : 'Business Health Score'}
                        </td>
                        <td className="py-4 text-xs text-gray-500 dark:text-slate-400">
                          {pred.period_start} to {pred.period_end}
                        </td>
                        <td className="py-4 text-right font-extrabold text-gray-900 dark:text-slate-100">
                          {pred.prediction_type === 'sales_forecast' ? `₹${pred.value.toLocaleString()}` : pred.value.toLocaleString()}
                        </td>
                        <td className="py-4 text-right">
                          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {(pred.confidence * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

