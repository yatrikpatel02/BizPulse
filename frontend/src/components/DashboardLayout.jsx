import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useBusiness } from '../context/BusinessContext';
import { getUserSettings } from '../services/auth';
import { getInventoryAnalytics, getInsights, getCustomerReviews } from '../services/analytics';

export default function DashboardLayout({ children }) {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  
  // Default to open on desktop, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);
  const { activeBusiness } = useBusiness();
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Helper to format relative time dynamically
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const now = new Date();
      const date = new Date(dateString);
      const seconds = Math.floor((now - date) / 1000);
      
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days === 1) return 'Yesterday';
      return `${days}d ago`;
    } catch (e) {
      return 'Just now';
    }
  };

  useEffect(() => {
    const loadDynamicNotifications = async () => {
      if (!activeBusiness?.id) return;
      setLoadingNotifications(true);
      try {
        // 1. Fetch user settings for safety stock and star rating thresholds
        let thresholds = { safetyStock: 50, starRating: 4.0 };
        try {
          const settings = await getUserSettings();
          thresholds = {
            safetyStock: settings.safety_stock || 50,
            starRating: parseFloat(settings.star_rating) || 4.0,
          };
        } catch (e) {
          console.error("Failed to load user settings, using default thresholds", e);
        }

        const list = [];

        // 2. Fetch inventory stock alerts/anomalies
        try {
          const invData = await getInventoryAnalytics({ business_id: activeBusiness.id });
          const anomalies = invData?.anomalies || [];
          anomalies.forEach((prod) => {
            const qty = prod.quantity_on_hand || 0;
            const reorderThreshold = thresholds.safetyStock;
            if (qty <= reorderThreshold) {
              list.push({
                id: `low-stock-${prod.product_id}-${qty}`,
                title: qty === 0 ? 'Out of Stock Alert' : 'Low Stock Alert',
                desc: `${prod.product_name} is down to ${qty} units (Safety Threshold: ${reorderThreshold}).`,
                time: 'Just now',
                unread: true,
                type: 'warning',
                date: new Date() // for sorting
              });
            }
          });
        } catch (e) {
          console.error("Failed to fetch inventory stock alerts", e);
        }

        // 3. Fetch customer reviews and alert if rating is below threshold
        try {
          const reviews = await getCustomerReviews({ business_id: activeBusiness.id });
          if (Array.isArray(reviews)) {
            reviews.forEach((review) => {
              const rating = parseFloat(review.rating) || 0;
              if (rating <= thresholds.starRating) {
                list.push({
                  id: `review-${review.id}`,
                  title: `Low Review Alert (${rating}★)`,
                  desc: `"${review.comment_text || 'No comment'}" on ${review.product_name || 'Product'}`,
                  time: formatTimeAgo(review.created_at),
                  unread: true,
                  type: 'info',
                  date: new Date(review.created_at) // for sorting
                });
              }
            });
          }
        } catch (e) {
          console.error("Failed to fetch customer reviews alerts", e);
        }

        // 4. Fetch ML insights and competitor price mismatches
        try {
          const insights = await getInsights({ business_id: activeBusiness.id });
          if (Array.isArray(insights)) {
            insights.forEach((insight) => {
              let alertType = 'info';
              if (insight.severity === 'high') alertType = 'warning';
              else if (insight.insight_type === 'growing_demand') alertType = 'success';
              
              list.push({
                id: `insight-${insight.id}`,
                title: insight.title,
                desc: insight.description,
                time: formatTimeAgo(insight.generated_at),
                unread: !insight.is_read,
                type: alertType,
                date: new Date(insight.generated_at) // for sorting
              });
            });
          }
        } catch (e) {
          console.error("Failed to fetch ML insights", e);
        }

        // Sort all alerts chronologically (latest first)
        list.sort((a, b) => b.date - a.date);

        // Remove the temporary date object before setting state
        const sanitizedList = list.map(({ date, ...rest }) => rest);
        setNotifications(sanitizedList);

      } catch (err) {
        console.error("Error generating notifications:", err);
      } finally {
        setLoadingNotifications(false);
      }
    };

    loadDynamicNotifications();
  }, [activeBusiness?.id]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    handleResize(); // check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  const getHeaderDetails = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
      case '/':
        return {
          title: 'Dashboard',
          subtitle: 'Overview of your business performance'
        };
      case '/data':
        return {
          title: 'Data Management',
          subtitle: 'Import your business data to generate insights.'
        };
      case '/data/records':
        return {
          title: 'View Records',
          subtitle: 'Browse and search your imported business datasets.'
        };
      case '/products':
        return {
          title: 'Products',
          subtitle: 'Manage your catalog of items and pricing.'
        };
      case '/analytics':
        return {
          title: 'Analytics',
          subtitle: 'Deeper visual statistical breakdowns.'
        };
      case '/insights':
        return {
          title: 'Insights',
          subtitle: 'System-generated machine learning recommendations.'
        };
      case '/reports':
        return {
          title: 'Reports',
          subtitle: 'Exportable business performance summaries.'
        };
      case '/profile':
        return {
          title: 'Profile Management',
          subtitle: 'Manage your user profile settings, password, and registered companies.'
        };
      case '/settings':
        return {
          title: 'Settings',
          subtitle: 'Configure your company details, alert thresholds, and security preferences.'
        };
      default:
        return {
          title: 'BizPulse',
          subtitle: 'Business Intelligence Suite'
        };
    }
  };

  const { title, subtitle } = getHeaderDetails();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#090d16] transition-colors duration-200 overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden w-full relative z-10 grid-bg">
        {/* Top Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-800/60 z-40 relative transition-colors duration-200">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-gray-800 dark:text-slate-200 font-display leading-tight">{title}</h2>
              <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium hidden sm:block mt-0.5 leading-none">{subtitle}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors focus:outline-none relative cursor-pointer"
                title="Notifications"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl shadow-xl z-50 py-3 animate-fade-in">
                    <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-gray-800 dark:text-slate-100 font-display">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold bg-rose-500/10 text-rose-500 dark:text-rose-400 px-1.5 py-0.5 rounded">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[10px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/40">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 dark:text-slate-500 text-xs">
                          All caught up! No notifications.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 flex gap-3 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors text-left ${
                              notif.unread ? 'bg-indigo-50/10 dark:bg-indigo-950/5' : ''
                            }`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {notif.type === 'warning' && (
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                </div>
                              )}
                              {notif.type === 'info' && (
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              )}
                              {notif.type === 'success' && (
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
                                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold ${notif.unread ? 'text-gray-800 dark:text-slate-100' : 'text-gray-600 dark:text-slate-400'}`}>
                                  {notif.title}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-slate-500">{notif.time}</span>
                              </div>
                              <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">{notif.desc}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="px-4 pt-2 mt-2 border-t border-gray-100 dark:border-slate-800/60 flex justify-end">
                        <button
                          onClick={clearNotifications}
                          className="text-[10px] text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 font-bold transition-colors cursor-pointer"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <Link to="/profile" className="flex items-center space-x-2 border-l border-gray-200/60 dark:border-slate-800/60 pl-4 hover:opacity-80 transition-opacity">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover ring-1 ring-indigo-500/20 shadow-sm" />
              ) : (
                <div className="w-8 h-8 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold uppercase ring-1 ring-indigo-500/20 shadow-sm text-xs">
                  {(user?.first_name?.charAt(0) || '') + (user?.last_name?.charAt(0) || '') || user?.username?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 hidden sm:block">
                {user?.first_name || user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username}
              </span>
            </Link>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
