import React, { useState } from 'react';
import KPICard from '../components/dashboard/KPICard';
import RecentActivity from '../components/dashboard/RecentActivity';
import AlertsWidget from '../components/dashboard/AlertsWidget';
import MonthlyRevenueTrend from '../components/dashboard/MonthlyRevenueTrend';
import RevenueByCategory from '../components/dashboard/RevenueByCategory';
import { useBusiness } from '../context/BusinessContext';
import AddCompanyModal from '../components/AddCompanyModal';

export default function Dashboard() {
  const { businesses, loading } = useBusiness();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Updated premium KPI card configurations matching the screenshots exactly
  const kpiData = [
    {
      title: 'Total Revenue',
      value: '₹45,231.89',
      subtitle: 'Gross business earnings',
      change: '+20.1%',
      isPositive: true,
      trendText: 'vs last month',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Total Sales',
      value: '2,345',
      subtitle: 'Volume of order checkouts',
      change: '+15.2%',
      isPositive: true,
      trendText: 'vs last month',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      title: 'Avg. Rating',
      value: '4.2 ★',
      subtitle: 'Customer satisfaction',
      change: '+0.4 pts',
      isPositive: true,
      trendText: 'vs last month',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.175 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 10.1c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    {
      title: 'Business Health',
      value: '81 / 100',
      subtitle: 'Good — Strong performance',
      change: '+3 pts',
      isPositive: true,
      trendText: 'vs last month',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
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
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-end">
        <button className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-300">
          Generate Report
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard 
            key={index}
            title={kpi.title}
            value={kpi.value}
            subtitle={kpi.subtitle}
            change={kpi.change}
            isPositive={kpi.isPositive}
            trendText={kpi.trendText}
            icon={kpi.icon}
          />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex">
          <MonthlyRevenueTrend />
        </div>
        <div className="lg:col-span-1 flex">
          <RevenueByCategory />
        </div>
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
