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
  const [timeTicker, setTimeTicker] = useState(0);

  // Live ticking loop to force React to update relative timestamps on-screen
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTicker(prev => prev + 1);
    }, 30000); // Tick every 30 seconds
    return () => clearInterval(timer);
  }, []);

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
      if (days < 7) return `${days}d ago`;
      
      // Return absolute formatted date for older items
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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
            safetyStock: settings.safety_stock !== undefined ? settings.safety_stock : 50,
            starRating: settings.star_rating !== undefined ? parseFloat(settings.star_rating) : 4.0,
          };
          console.log("BizPulse Notification System: Loaded user thresholds", thresholds);
        } catch (e) {
          console.error("Failed to load user settings, using default thresholds", e);
        }

        const list = [];

        // 2. Fetch inventory stock alerts/anomalies
        try {
          const invData = await getInventoryAnalytics({ business_id: activeBusiness.id });
          const anomalies = invData?.anomalies || [];
          console.log("BizPulse Notification System: Loaded stock anomalies count:", anomalies.length);
          
          anomalies.forEach((prod) => {
            const qty = prod.quantity_on_hand || 0;
            // Respect user-defined Safety Stock threshold
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
          const reviewsData = await getCustomerReviews({ business_id: activeBusiness.id });
          // Handle DRF paginated responses (object with results key)
          const reviews = Array.isArray(reviewsData) ? reviewsData : (reviewsData?.results || []);
          console.log("BizPulse Notification System: Loaded customer reviews count:", reviews.length);
          
          reviews.forEach((review) => {
            const rating = parseFloat(review.rating) || 0;
            if (rating <= thresholds.starRating) {
              list.push({
                id: `review-${review.id}`,
                title: `Low Review Alert (${rating}★)`,
                desc: `"${review.comment_text || 'No comment'}" on ${review.product_name || 'Product'}`,
                time: 'Just now', // Triggered now by current threshold scan
                unread: true,
                type: 'info',
                date: new Date() // Triggered now
              });
            }
          });
        } catch (e) {
          console.error("Failed to fetch customer reviews alerts", e);
        }

        // 4. Fetch ML insights and competitor price mismatches
        try {
          const insightsData = await getInsights({ business_id: activeBusiness.id });
          // Handle DRF paginated responses (object with results key)
          const insights = Array.isArray(insightsData) ? insightsData : (insightsData?.results || []);
          console.log("BizPulse Notification System: Loaded ML insights count:", insights.length);
          
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
              date: new Date(insight.generated_at || Date.now()) // for sorting
            });
          });
        } catch (e) {
          console.error("Failed to fetch ML insights", e);
        }

        // Sort all alerts chronologically (latest first)
        list.sort((a, b) => b.date - a.date);

        // Keep the date object to evaluate relative time on the fly during render
        setNotifications(list);
        console.log("BizPulse Notification System: Dynamic notifications populated. Count:", list.length);

      } catch (err) {
        console.error("Error generating notifications:", err);
      } finally {
        setLoadingNotifications(false);
      }
    };

    loadDynamicNotifications();

    const handleSettingsUpdate = () => {
      console.log("BizPulse Notification System: Settings updated event received. Refreshing notifications...");
      loadDynamicNotifications();
    };
    window.addEventListener('bizpulse-settings-updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('bizpulse-settings-updated', handleSettingsUpdate);
    };
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
      case '/market-intelligence':
        return {
          title: 'Market Intelligence',
          subtitle: 'Monitor market demand and expansion opportunities.'
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
    <div className="flex h-screen bg-[#f3f6fa] dark:bg-navy-950 transition-colors duration-200 overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden w-full relative z-10 grid-bg">
        {/* Top Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-3.5 bg-white/80 dark:bg-navy-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.06] z-40 relative transition-colors duration-200">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.05] focus:outline-none transition-colors"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-slate-800 dark:text-white font-display leading-tight">{title}</h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 font-medium hidden sm:block mt-0.5 leading-none">{subtitle}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.05] transition-colors focus:outline-none relative cursor-pointer"
                title="Notifications"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500 ring-2 ring-navy-900"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-navy-800/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-md dark:shadow-glass-lg z-50 py-3 animate-fade-in">
                    <div className="flex items-center justify-between px-4 pb-2 border-b border-white/[0.06]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold bg-violet-500/15 text-violet-400 px-1.5 py-0.5 rounded">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[10px] text-violet-400 hover:text-violet-300 font-bold hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-150 dark:divide-slate-150 dark:divide-slate-150 dark:divide-white/[0.04]">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-xs">
                          All caught up! No notifications.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-50 dark:hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors text-left ${
                              notif.unread ? 'bg-violet-500/[0.03]' : ''
                            }`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {notif.type === 'warning' && (
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                </div>
                              )}
                              {notif.type === 'info' && (
                                <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              )}
                              {notif.type === 'success' && (
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-600 dark:text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold ${notif.unread ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                  {notif.title}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-slate-500">{formatTimeAgo(notif.date)}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{notif.desc}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="px-4 pt-2 mt-2 border-t border-white/[0.06] flex justify-end">
                        <button
                          onClick={clearNotifications}
                          className="text-[10px] text-slate-500 hover:text-red-400 font-bold transition-colors cursor-pointer"
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
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.05] transition-colors focus:outline-none"
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

            <Link to="/profile" className="flex items-center space-x-2 border-l border-slate-200 dark:border-white/[0.08] pl-3 hover:opacity-80 transition-opacity">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-500/30 shadow-glow-purple-sm" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold uppercase ring-2 ring-violet-500/20 shadow-glow-purple-sm text-xs">
                  {(user?.first_name?.charAt(0) || '') + (user?.last_name?.charAt(0) || '') || user?.username?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 hidden sm:block">
                {user?.first_name || user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username}
              </span>
            </Link>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto flex flex-col ${location.pathname === '/analytics' ? 'px-6 sm:px-8 pb-6 sm:pb-8 pt-0' : 'p-6 sm:p-8'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
