import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSalesRecords, getInventorySnapshots, getCustomerReviews } from '../services/analytics';
import { useBusiness } from '../context/BusinessContext';

// --- Icons ---
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const ChevronLeft = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);
const UploadIcon = () => (
  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
);

// --- Star Rating ---
function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`w-4 h-4 ${i <= rating ? 'text-amber-400' : 'text-gray-200 dark:text-slate-700'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// --- Empty State ---
function EmptyState({ type, onUpload }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-indigo-300 dark:text-indigo-800 mb-4"><UploadIcon /></div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">No {type} data yet</h3>
      <p className="text-sm text-slate-500 mb-6">Upload a {type.toLowerCase()} CSV file to get started.</p>
      <button
        onClick={onUpload}
        className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
      >
        Upload Data
      </button>
    </div>
  );
}

// --- Pagination ---
function Pagination({ page, numPages, onPageChange }) {
  if (numPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-200 dark:border-white/[0.06]">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Page <span className="font-medium">{page}</span> of <span className="font-medium">{numPages}</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-md border border-slate-200 dark:border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 hover:glass-surface dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= numPages}
          className="p-1.5 rounded-md border border-slate-200 dark:border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 hover:glass-surface dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}

// --- Sales Table ---
function SalesTable({ data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="glass-surface/60 border-b border-slate-200 dark:border-slate-200 dark:border-white/[0.06]">
            {['Product', 'Date', 'Quantity', 'Unit Price', 'Revenue'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
          {data.map(row => (
            <tr key={row.id} className="hover:glass-surface dark:hover:bg-slate-800/40 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{row.product_name}</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.date}</td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.quantity}</td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                {row.unit_price != null ? `₹${parseFloat(row.unit_price).toFixed(2)}` : '—'}
              </td>
              <td className="px-4 py-3 font-semibold text-emerald-600 text-emerald-600 dark:text-emerald-600 dark:text-emerald-600 dark:text-emerald-400">
                ₹{parseFloat(row.revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Inventory Table ---
function InventoryTable({ data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="glass-surface/60 border-b border-slate-200 dark:border-slate-200 dark:border-white/[0.06]">
            {['Product', 'Date', 'Qty on Hand', 'Reorder Point', 'Status'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
          {data.map(row => {
            const low = row.reorder_point != null && row.quantity_on_hand <= row.reorder_point;
            return (
              <tr key={row.id} className="hover:glass-surface dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{row.product_name}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.date}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">{row.quantity_on_hand}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.reorder_point ?? '—'}</td>
                <td className="px-4 py-3">
                  {low
                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 bg-red-500/10 text-red-700 text-red-400">⚠ Low Stock</span>
                    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-600 dark:text-emerald-600 dark:text-emerald-400 text-emerald-600 dark:text-emerald-600 dark:text-emerald-600 dark:text-emerald-400">✓ OK</span>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// --- Reviews Table ---
function ReviewsTable({ data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="glass-surface/60 border-b border-slate-200 dark:border-slate-200 dark:border-white/[0.06]">
            {['Rating', 'Product', 'Author', 'Date', 'Review'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
          {data.map(row => (
            <tr key={row.id} className="hover:glass-surface dark:hover:bg-slate-800/40 transition-colors">
              <td className="px-4 py-3"><StarRating rating={row.rating} /></td>
              <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{row.product_name ?? '—'}</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.author_name || '—'}</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.review_date}</td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={row.text}>{row.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Main DataViewer Component ---
const TABS = [
  { key: 'sales', label: 'Sales', color: 'emerald' },
  { key: 'inventory', label: 'Inventory', color: 'blue' },
  { key: 'reviews', label: 'Reviews', color: 'amber' },
];

export default function DataViewer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeBusiness } = useBusiness();
  const [activeTab, setActiveTab] = useState('sales');

  useEffect(() => {
    setActiveTab('sales');
  }, [location.key]);

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!activeBusiness) return;
    setLoading(true);
    setError(null);
    try {
      const params = { page, page_size: 20, search, date_from: dateFrom, date_to: dateTo };
      let result;
      if (activeTab === 'sales') result = await getSalesRecords(params);
      else if (activeTab === 'inventory') result = await getInventorySnapshots(params);
      else result = await getCustomerReviews({ ...params, rating: ratingFilter });
      setData(result);
    } catch (e) {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, activeTab, page, search, dateFrom, dateTo, ratingFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page and filters when the active business changes
  useEffect(() => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setRatingFilter('');
    setPage(1);
  }, [activeBusiness]);

  // Reset page when tab or filters change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setRatingFilter('');
    setPage(1);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const tabColor = {
    sales: 'emerald',
    inventory: 'blue',
    reviews: 'amber',
  }[activeTab];

  const activeStyle = {
    emerald: 'border-emerald-500 text-emerald-600 dark:text-emerald-400',
    blue: 'border-blue-500 text-blue-600 dark:text-blue-400',
    amber: 'border-amber-500 text-amber-600 dark:text-amber-400',
  }[tabColor];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => navigate('/data')}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload More Data
        </button>
      </div>

      {/* Card */}
      <div className="glass-card rounded-xl border border-slate-200 dark:border-slate-200 dark:border-white/[0.06] shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-200 dark:border-white/[0.06] px-4">
          <div className="flex gap-0">
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? activeStyle + ' border-current'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {tab.label}
                  {data && isActive && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full glass-surface text-slate-700 dark:text-slate-300">
                      {data.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-200 dark:border-white/[0.06] glass-surface/30">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
            <input
              type="text"
              placeholder={activeTab === 'reviews' ? 'Search text or product...' : 'Search product...'}
              value={search}
              onChange={handleSearch}
              className="w-full pl-9 pr-3 py-2 text-sm glass-card border border-slate-200 dark:border-slate-200 dark:border-white/[0.06] rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-slate-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm glass-card border border-slate-200 dark:border-slate-200 dark:border-white/[0.06] rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-slate-700 dark:text-slate-200"
            title="From date"
          />
          <span className="text-slate-500 text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm glass-card border border-slate-200 dark:border-slate-200 dark:border-white/[0.06] rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-slate-700 dark:text-slate-200"
            title="To date"
          />

          {/* Rating filter (reviews only) */}
          {activeTab === 'reviews' && (
            <select
              value={ratingFilter}
              onChange={e => { setRatingFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm glass-card border border-slate-200 dark:border-slate-200 dark:border-white/[0.06] rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-slate-700 dark:text-slate-200"
            >
              <option value="">All Ratings</option>
              {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{'★'.repeat(r)} ({r} star)</option>)}
            </select>
          )}

          {/* Clear filters */}
          {(search || dateFrom || dateTo || ratingFilter) && (
            <button
              onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setRatingFilter(''); setPage(1); }}
              className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-700 dark:text-slate-200 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <svg className="animate-spin h-8 w-8 text-violet-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500 text-red-400 text-sm">{error}</div>
        ) : !data || data.count === 0 ? (
          <EmptyState type={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} onUpload={() => navigate('/data')} />
        ) : (
          <>
            {activeTab === 'sales' && <SalesTable data={data.results} />}
            {activeTab === 'inventory' && <InventoryTable data={data.results} />}
            {activeTab === 'reviews' && <ReviewsTable data={data.results} />}
            <Pagination page={data.current_page} numPages={data.num_pages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
