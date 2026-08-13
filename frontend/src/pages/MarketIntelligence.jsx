import React, { useState, useEffect, useRef } from 'react';
import { useBusiness } from '../context/BusinessContext';
import {
  getMarketKeywords,
  createMarketKeyword,
  deleteMarketKeyword,
  analyzeMarketIntelligence,
} from '../services/integrations';
import { getProducts } from '../services/products';
import { collectCompetitorData } from '../services/competitor';

export default function MarketIntelligence() {
  const { activeBusiness } = useBusiness();
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  const [steps, setSteps] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [scrapeMode, setScrapeMode] = useState('selected');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [scrapeError, setScrapeError] = useState(null);

  const fetchKeywords = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMarketKeywords({ business_id: activeBusiness.id });
      setKeywords(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error('Failed to load market keywords', err);
      setError('Failed to load market keywords. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!activeBusiness) return;
    try {
      const res = await getProducts();
      const dataArray = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      const businessProducts = dataArray.filter(p => p.business === activeBusiness.id);
      setProducts(businessProducts);
    } catch (err) {
      console.error('Failed to load products', err);
    }
  };

  useEffect(() => {
    fetchKeywords();
    fetchProducts();
  }, [activeBusiness]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newKeyword.trim() || !activeBusiness) return;
    try {
      await createMarketKeyword({ keyword: newKeyword.trim(), business_id: activeBusiness.id });
      setNewKeyword('');
      fetchKeywords();
    } catch (err) {
      console.error('Failed to add keyword', err);
      setError(err.response?.data?.keyword || 'Failed to add keyword.');
    }
  };

  const handleRemove = async (id) => {
    try {
      await deleteMarketKeyword(id);
      fetchKeywords();
    } catch (err) {
      console.error('Failed to remove keyword', err);
      setError('Failed to remove keyword.');
    }
  };

  const handleAnalyze = async () => {
    if (!activeBusiness) return;
    setAnalyzing(true);
    setAnalysisStatus(null);
    setSteps([]);
    setElapsed(0);
    setError(null);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      const result = await analyzeMarketIntelligence({ business_id: activeBusiness.id });
      setSteps(result.steps || []);
      const failedSteps = (result.steps || []).filter(s => s.status === 'failed');
      if (failedSteps.length > 0) {
        setAnalysisStatus({
          type: 'error',
          message: `Analysis completed with ${failedSteps.length} failed step(s). Check details below.`,
        });
      } else {
        setAnalysisStatus({
          type: 'success',
          message: result.detail || 'Market intelligence analysis completed successfully.',
        });
      }
    } catch (err) {
      console.error('Failed to trigger analysis', err);
      setAnalysisStatus({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to trigger market analysis.',
      });
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setAnalyzing(false);
    }
  };

  const handleScrape = async () => {
    if (!activeBusiness) return;
    setScraping(true);
    setScrapeResult(null);
    setScrapeError(null);

    try {
      let payload = {};
      if (scrapeMode === 'all') {
        payload = { all_products: true };
      } else {
        if (selectedProductIds.length === 0) {
          setScrapeError('Please select at least one product.');
          setScraping(false);
          return;
        }
        payload = { product_ids: selectedProductIds };
      }

      const result = await collectCompetitorData(payload);
      setScrapeResult({
        ...result,
        product_ids: scrapeMode === 'all' ? null : selectedProductIds,
      });
      setSelectedProductIds([]);
    } catch (err) {
      console.error('Failed to scrape competitor data', err);
      setScrapeError(err.response?.data?.detail || 'Failed to scrape competitor data.');
    } finally {
      setScraping(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight font-display">
          Market Intelligence
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Monitor market demand for your products and potential expansion opportunities.
        </p>
      </div>

      {/* Opportunity Keywords */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-6 shadow-md">
        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-1">Market Opportunities</h3>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
          Products you are currently monitoring for potential expansion.
        </p>

        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Enter product keyword..."
            className="flex-1 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 text-sm font-semibold rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 dark:text-slate-300"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all duration-300"
          >
            Add
          </button>
        </form>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <svg className="w-5 h-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : keywords.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-4 italic">
            No opportunity keywords yet. Add keywords above to start monitoring market demand.
          </p>
        ) : (
          <div className="space-y-2">
            {keywords.map((kw) => (
              <div
                key={kw.id}
                className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800/60 rounded-xl"
              >
                <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">{kw.keyword}</span>
                <button
                  onClick={() => handleRemove(kw.id)}
                  className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  title="Remove keyword"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Analyze */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-6 shadow-md">
        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-1">Run Market Analysis</h3>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
          Trigger a background analysis for all your products and opportunity keywords.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? 'Analyzing...' : 'Analyze Market'}
          </button>

          {analyzing && (
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
              {elapsed}s elapsed
            </span>
          )}
        </div>

        {analysisStatus && (
          <div
            className={`mt-4 p-3 text-xs rounded-xl ${
              analysisStatus.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400'
            }`}
          >
            {analysisStatus.message}
          </div>
        )}

        {steps.length > 0 && (
          <div className="mt-4 space-y-2">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs ${
                  step.status === 'completed'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-50/50 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/30 text-red-700 dark:text-red-400'
                }`}
              >
                <div className="flex-shrink-0">
                  {step.status === 'completed' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold capitalize">{step.step.replace(/_/g, ' ')}</p>
                  {step.status === 'completed' && step.keywords_collected && (
                    <p className="mt-0.5 opacity-80">
                      Collected {Object.values(step.records_per_keyword || {}).reduce((a, b) => a + b, 0)} records for {step.keywords_collected.length} keywords
                    </p>
                  )}
                  {step.status === 'completed' && step.insights_created && (
                    <p className="mt-0.5 opacity-80">Created {step.insights_created} insights</p>
                  )}
                  {step.status === 'completed' && step.insights_generated !== undefined && (
                    <p className="mt-0.5 opacity-80">Generated {step.insights_generated} market insights</p>
                  )}
                  {step.status === 'failed' && step.error && (
                    <p className="mt-0.5 opacity-80">{step.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
          Detailed results will appear in the <span className="font-semibold text-indigo-600 dark:text-indigo-400">Insights</span> tab once analysis completes.
        </p>
      </div>

      {/* Scrape Competitor Data */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-6 shadow-md">
        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-1">Scrape Competitor Data</h3>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
          Fetch live competitor prices for your products from Amazon, Flipkart, and Google Shopping.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <select
            value={scrapeMode}
            onChange={(e) => {
              setScrapeMode(e.target.value);
              setSelectedProductIds([]);
            }}
            className="bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 text-sm font-semibold rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 dark:text-slate-300"
          >
            <option value="selected">Selected Products</option>
            <option value="all">All Products</option>
          </select>

          {scrapeMode === 'selected' && (
            <div className="flex flex-wrap gap-2">
              {products.length === 0 && (
                <span className="text-xs text-gray-400 dark:text-slate-500">No products available</span>
              )}
              {products.map((product) => {
                const checked = selectedProductIds.includes(product.id);
                return (
                  <label
                    key={product.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all duration-200 ${
                      checked
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60'
                        : 'bg-gray-50/50 dark:bg-slate-950/40 border-gray-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...selectedProductIds, product.id]
                          : selectedProductIds.filter(id => id !== product.id);
                        setSelectedProductIds(next);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-gray-800 dark:text-slate-200">{product.name}</span>
                  </label>
                );
              })}
            </div>
          )}

          <button
            onClick={handleScrape}
            disabled={scraping}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {scraping ? 'Scraping...' : 'Scrape Competitor Data'}
          </button>
        </div>

        {scraping && (
          <div className="mb-4 p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 text-xs rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="font-semibold">Scraping in progress...</span>
            <span className="opacity-80">This may take a moment while we fetch live competitor prices.</span>
          </div>
        )}

        {scrapeError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs rounded-xl">
            {scrapeError}
          </div>
        )}

        {scrapeResult && (
          <div className="mt-4 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Scrape completed successfully
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-slate-400">
              Collected <span className="font-semibold">{scrapeResult.records_collected}</span> competitor records across <span className="font-semibold">{scrapeResult.products_collected}</span> product(s).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
