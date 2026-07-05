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
    return <div className="text-gray-500">Loading dashboard...</div>;
  }

  if (businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 text-center max-w-md transition-colors">
          <div className="text-4xl mb-4">🏢</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Welcome to BizPulse!</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">To get started, please create your first company to start analyzing data.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors w-full"
          >
            Create Company
          </button>
        </div>
        <AddCompanyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Executive Overview</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors">
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
