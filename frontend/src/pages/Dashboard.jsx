import React, { useState } from 'react';
import KPICard from '../components/dashboard/KPICard';
import RecentActivity from '../components/dashboard/RecentActivity';
import AlertsWidget from '../components/dashboard/AlertsWidget';
import { useBusiness } from '../context/BusinessContext';
import AddCompanyModal from '../components/AddCompanyModal';

export default function Dashboard() {
  const { businesses, loading } = useBusiness();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock Data
  const kpis = [
    { title: 'Total Revenue', value: '₹45,231.89', change: '+20.1%', isPositive: true },
    { title: 'Total Sales', value: '2,345', change: '+15.2%', isPositive: true },
    { title: 'Active Products', value: '142', change: '-2.4%', isPositive: false },
    { title: 'Customer Satisfaction', value: '4.8/5', change: '+0.2', isPositive: true },
  ];

  const recentActivities = [
    { title: 'Uploaded Q3_Sales.csv', time: '2 hours ago' },
    { title: 'Updated pricing for "Wireless Earbuds"', time: '5 hours ago' },
    { title: 'Generated Monthly Report', time: '1 day ago' },
    { title: 'Mapped new inventory columns', time: '2 days ago' },
  ];

  const alerts = [
    { type: 'critical', title: 'Low Inventory', message: 'SKU-892 (Smart Watch) is below reorder threshold.' },
    { type: 'warning', title: 'Revenue Drop', message: 'Unusual drop in weekend sales detected.' },
  ];

  if (loading) {
    return <div className="text-gray-500 font-semibold text-sm">Loading dashboard...</div>;
  }

  if (businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] relative">
        <div className="absolute w-[250px] h-[250px] bg-indigo-600/10 glow-orb"></div>
        <div className="glass-card p-10 rounded-2xl shadow-xl text-center max-w-md border border-white/10 z-10">
          <div className="mb-6 flex justify-center text-indigo-500">
            <svg className="w-16 h-16 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight font-display mb-3">Welcome to BizPulse</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-8 leading-relaxed">To get started, please create your first company to start analyzing data.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all duration-300"
          >
            Create Company
          </button>
        </div>
        <AddCompanyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight font-display">Executive Overview</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">High-level view of your current business performance metrics</p>
        </div>
        <button className="self-start sm:self-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-300">
          Generate Report
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <KPICard 
            key={index}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            isPositive={kpi.isPositive}
          />
        ))}
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivities} />
        </div>
        <div className="lg:col-span-1">
          <AlertsWidget alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
