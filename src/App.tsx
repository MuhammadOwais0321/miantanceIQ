/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { db, initDB } from './utils/db';
import { User, Notification, AssetHistoryEvent } from './types';
import PublicHome from './views/PublicHome';
import PublicAssetView from './views/PublicAssetView';
import TrackIssueView from './views/TrackIssueView';
import LoginSignup from './views/LoginSignup';
import AdminDashboard from './views/AdminDashboard';
import AdminWorkers from './views/AdminWorkers';
import { AnalyticsCharts } from './components/StatsCharts';
import WorkerDashboard from './views/WorkerDashboard';

// Lucide icons
import { 
  Menu, 
  X, 
  Bell, 
  Sun, 
  Moon, 
  Layers, 
  Wrench, 
  FolderKanban, 
  Calendar, 
  Users, 
  TrendingUp, 
  Settings, 
  LogOut, 
  QrCode, 
  Activity, 
  Home, 
  Info, 
  Shield, 
  Mail,
  Briefcase,
  AlertTriangle,
  Sparkles,
  FileText
} from 'lucide-react';

export default function App() {
  // --- DATABASE & SESSION BOOTSTRAP ---
  useEffect(() => {
    initDB();
  }, []);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('mq_current_user');
    return raw ? JSON.parse(raw) : null;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('mq_theme') === 'dark';
  });

  // Theme Sync effect
  useEffect(() => {
    const el = document.documentElement;
    if (isDarkMode) {
      el.classList.add('dark');
      el.setAttribute('data-theme', 'dark');
      localStorage.setItem('mq_theme', 'dark');
    } else {
      el.classList.remove('dark');
      el.setAttribute('data-theme', 'light');
      localStorage.setItem('mq_theme', 'light');
    }
  }, [isDarkMode]);

  // --- HASH ROUTING STATE ---
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
      setMobileMenuOpen(false);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // --- NOTIFICATIONS PANEL STATE ---
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Periodically sync notifications if user is active
  useEffect(() => {
    if (!currentUser) return;
    const fetchNotifs = () => {
      setNotifications(db.getNotifications(currentUser.id));
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const unreadNotifCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const handleMarkNotifRead = (id: string) => {
    db.markNotificationRead(id);
    if (currentUser) setNotifications(db.getNotifications(currentUser.id));
  };

  const handleMarkAllNotifRead = () => {
    if (!currentUser) return;
    db.markAllNotificationsRead(currentUser.id);
    setNotifications(db.getNotifications(currentUser.id));
  };

  // --- SIDEBAR SHELL STATES ---
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active Admin Sub-Menu Selectors
  const [adminSubTab, setAdminSubTab] = useState<'overview' | 'assets' | 'issues' | 'schedule' | 'workers' | 'analytics' | 'settings'>('overview');

  // --- SETTINGS FORMS STATE ---
  const [orgName, setOrgName] = useState('Global Logistics Hub');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AssetHistoryEvent[]>([]);

  // Fetch audit logs on admin settings tab active
  useEffect(() => {
    if (currentUser?.role === 'admin' && adminSubTab === 'settings') {
      setAuditLogs(db.getHistory());
    }
  }, [adminSubTab, currentUser]);

  // --- LOGOUT ACTION ---
  const handleLogout = () => {
    localStorage.removeItem('mq_current_user');
    setCurrentUser(null);
    setAdminSubTab('overview');
    window.location.hash = '#/login';
  };

  const handleLoginSuccess = (user: User) => {
    localStorage.setItem('mq_current_user', JSON.stringify(user));
    setCurrentUser(user);
    if (user.role === 'admin') setAdminSubTab('overview');
  };

  // --- ROUTE GUARD SECURITY MATRIX ---
  useEffect(() => {
    // If guest attempts /admin/* or /worker/* -> redirect
    const isAdminRoute = currentHash.startsWith('#/admin/');
    const isWorkerRoute = currentHash.startsWith('#/worker/');

    if (isAdminRoute && (!currentUser || currentUser.role !== 'admin')) {
      window.location.hash = '#/admin/login';
    }
    if (isWorkerRoute && (!currentUser || currentUser.role !== 'worker')) {
      window.location.hash = '#/worker/login';
    }
  }, [currentHash, currentUser]);

  // --- DYNAMIC VIEW COMPILING ---
  const renderCurrentView = () => {
    // Public routes
    if (currentHash === '#/' || currentHash === '#/features' || currentHash === '#/about' || currentHash === '#/contact' || currentHash === '#/scan') {
      return <PublicHome currentPath={currentHash} />;
    }

    if (currentHash === '#/login' || currentHash === '#/signup' || currentHash === '#/admin/login' || currentHash === '#/worker/login') {
      return <LoginSignup currentPath={currentHash} onLoginSuccess={handleLoginSuccess} />;
    }

    if (currentHash === '#/track') {
      return <TrackIssueView currentUser={currentUser} />;
    }

    if (currentHash.startsWith('#/asset/')) {
      const assetCode = currentHash.replace('#/asset/', '');
      return <PublicAssetView assetCode={assetCode} currentUser={currentUser} />;
    }

    // Role-Guarded: Admin routes
    if (currentHash === '#/admin/dashboard') {
      if (adminSubTab === 'workers') {
        return <AdminWorkers />;
      }
      if (adminSubTab === 'analytics') {
        return <AnalyticsCharts />;
      }
      if (adminSubTab === 'settings') {
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Settings Configuration Card */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xs space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider">Enterprise Configurations</h3>
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-500 uppercase mb-1.5">Organization Site Name</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl">
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-300">Rule-Based AI Diagnostics</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Toggle local smart diagnostics on public ticket reporting.</p>
                    </div>
                    <button
                      onClick={() => setAiEnabled(!aiEnabled)}
                      className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                        aiEnabled ? 'bg-brand-600' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${
                        aiEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Policy Card */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xs space-y-3.5 text-xs text-slate-500">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider">Security clearance Protocols</h3>
                <p className="leading-relaxed">This system runs inside isolated secure containers. Credentials and data maps are processed completely client-side in the secure sandboxed context of your browser local cache.</p>
                <p className="leading-relaxed"><b>Access Policy:</b> Only designated field engineers are clear to update hardware status and log parts cost billing entries.</p>
              </div>
            </div>

            {/* Audit Logs panel */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-slate-400 animate-pulse" />
                Immutable System Audit Trail (History)
              </h3>
              
              <div className="overflow-y-auto max-h-96 space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl text-xs flex items-center justify-between gap-4 font-mono">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-700 dark:text-slate-300">{log.action}</p>
                      <p className="text-[10px] text-slate-400">Actor: {log.actorName} (ID: {log.actorId})</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{new Date(log.date).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      return (
        <AdminDashboard 
          currentTab={adminSubTab as 'overview' | 'assets' | 'issues' | 'schedule'} 
          currentUser={currentUser} 
          onTabChange={setAdminSubTab}
        />
      );
    }

    // Role-Guarded: Worker routes
    if (currentHash === '#/worker/dashboard') {
      return <WorkerDashboard currentUser={currentUser} />;
    }

    // Fallback search
    return <PublicHome currentPath="#/" />;
  };

  // Determine if we are on a dashboard shell page (requires admin sidebar or worker layout)
  const isDashboardView = currentUser && (currentHash === '#/admin/dashboard' || currentHash === '#/worker/dashboard');

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* 🚀 --- SIDEBAR SHELL FOR DASHBOARD USERS --- */}
      {isDashboardView && (
        <>
          {/* Desktop Sidebar */}
          <aside className={`hidden md:flex flex-col bg-slate-900 text-slate-400 border-r border-slate-800 transition-all duration-300 shrink-0 ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}>
            
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                  M
                </div>
                {!sidebarCollapsed && (
                  <span className="font-extrabold text-white text-base tracking-tight">MaintainIQ</span>
                )}
              </div>
              
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto text-xs font-semibold">
              {currentUser?.role === 'admin' ? (
                /* Admin Sidebar Options */
                <>
                  <button
                    onClick={() => setAdminSubTab('overview')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                      adminSubTab === 'overview' ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Home className="w-4.5 h-4.5" />
                    {!sidebarCollapsed && <span>Dashboard Overview</span>}
                  </button>

                  <button
                    onClick={() => setAdminSubTab('assets')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                      adminSubTab === 'assets' ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Layers className="w-4.5 h-4.5" />
                    {!sidebarCollapsed && <span>Assets Inventory</span>}
                  </button>

                  <button
                    onClick={() => setAdminSubTab('issues')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                      adminSubTab === 'issues' ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Wrench className="w-4.5 h-4.5" />
                    {!sidebarCollapsed && <span>Service Tickets</span>}
                  </button>

                  <button
                    onClick={() => setAdminSubTab('schedule')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                      adminSubTab === 'schedule' ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-4.5 h-4.5" />
                    {!sidebarCollapsed && <span>Maintenance Schedule</span>}
                  </button>

                  <button
                    onClick={() => setAdminSubTab('workers')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                      adminSubTab === 'workers' ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Users className="w-4.5 h-4.5" />
                    {!sidebarCollapsed && <span>Active Roster</span>}
                  </button>

                  <button
                    onClick={() => setAdminSubTab('analytics')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                      adminSubTab === 'analytics' ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-4.5 h-4.5" />
                    {!sidebarCollapsed && <span>Analytics & Charts</span>}
                  </button>

                  <button
                    onClick={() => setAdminSubTab('settings')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                      adminSubTab === 'settings' ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Settings className="w-4.5 h-4.5" />
                    {!sidebarCollapsed && <span>System Settings</span>}
                  </button>
                </>
              ) : (
                /* Technician Sidebar Options */
                <div className="space-y-4">
                  <div className="px-4 py-2 text-[10px] text-slate-500 uppercase font-bold tracking-widest border-b border-slate-850">
                    Technician Hub
                  </div>
                  <div className="px-4 py-1.5 bg-slate-800/40 rounded-xl border border-slate-800 text-[10px] leading-relaxed text-slate-400">
                    Use sub-tabs on main dashboard to update tasks and log repair notes.
                  </div>
                </div>
              )}
            </nav>

            {/* Logout panel footer */}
            <div className="p-4 border-t border-slate-800 shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs hover:bg-red-950/40 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4.5 h-4.5 shrink-0 text-red-500" />
                {!sidebarCollapsed && <span>Sign Out</span>}
              </button>
            </div>

          </aside>
        </>
      )}

      {/* ================= MAIN DYNAMIC CONTENT CONTAINER ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOPBAR HEADER SHELL */}
        <header className="h-16 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-40 shadow-2xs">
          
          {/* Logo / Brand or Collapsible controls */}
          <div className="flex items-center gap-3">
            {isDashboardView && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-500 md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {!isDashboardView && (
              <a href="#/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                  M
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">MaintainIQ</span>
              </a>
            )}

            {/* Marketing static pages header links */}
            {!isDashboardView && (
              <nav className="hidden md:flex items-center gap-5 pl-8 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <a href="#/features" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Features</a>
                <a href="#/about" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">About</a>
                <a href="#/contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Contact</a>
                <a href="#/track" className="hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 transition-colors">
                  <Activity className="w-3.5 h-3.5" /> Track Repairs
                </a>
              </nav>
            )}
          </div>

          {/* Right action control panel */}
          <div className="flex items-center gap-2.5">
            {/* Global Light/Dark Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all"
              title="Toggle color theme"
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Notifications Bell for authorized users */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all relative"
                  title="Notifications panel"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </button>

                {/* 🚀 --- EMBEDDED NOTIFICATIONS FLOATING PANEL --- */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2.5 w-72 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden z-50 py-1 text-xs text-slate-600 dark:text-slate-400">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">Notifications</span>
                      <button 
                        onClick={handleMarkAllNotifRead}
                        className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline font-bold"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                      {notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleMarkNotifRead(n.id)}
                          className={`p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-750 cursor-pointer transition-colors ${
                            !n.read ? 'bg-brand-50/20 dark:bg-brand-950/10 font-medium' : ''
                          }`}
                        >
                          <p className="text-slate-700 dark:text-slate-300 leading-normal">{n.message}</p>
                          <span className="text-[9px] text-slate-400 mt-1 block">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <p className="p-4 text-center italic text-slate-400 text-xs">No active notifications.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Avatar / Portal Entry links */}
            {currentUser ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-100 dark:border-slate-700">
                <div className="text-right hidden sm:block text-[10px]">
                  <p className="font-bold text-slate-700 dark:text-slate-300 leading-none">{currentUser.name}</p>
                  <p className="text-slate-400 mt-0.5 leading-none capitalize">{currentUser.role} Account</p>
                </div>
                <div className="relative group">
                  <div className="w-8.5 h-8.5 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm cursor-pointer shadow-2xs border border-brand-100 dark:border-brand-900">
                    {currentUser.name.charAt(0)}
                  </div>
                  
                  {/* Embedded Dropdown Menu */}
                  <div className="hidden group-hover:block absolute right-0 mt-1.5 w-40 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden z-50 text-xs py-1">
                    {currentUser.role === 'admin' && (
                      <a href="#/admin/dashboard" className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-750 block font-semibold text-slate-700 dark:text-slate-300">Admin Panel</a>
                    )}
                    {currentUser.role === 'worker' && (
                      <a href="#/worker/dashboard" className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-750 block font-semibold text-slate-700 dark:text-slate-300">Worker Panel</a>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0 text-red-500" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <a
                href="#/login"
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-xs hover:shadow-sm transition-all"
              >
                Log In
              </a>
            )}
          </div>

        </header>

        {/* MOBILE SIDEBAR EXPANDED MENU DRAWER */}
        {mobileMenuOpen && isDashboardView && (
          <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/60 backdrop-blur-xs">
            <div className="w-64 bg-slate-900 text-slate-400 flex flex-col p-5 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-extrabold text-white text-base">MaintainIQ</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-grow space-y-2 text-xs font-semibold">
                {currentUser?.role === 'admin' ? (
                  <>
                    <button onClick={() => { setAdminSubTab('overview'); setMobileMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800">Dashboard Overview</button>
                    <button onClick={() => { setAdminSubTab('assets'); setMobileMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800">Assets Inventory</button>
                    <button onClick={() => { setAdminSubTab('issues'); setMobileMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800">Service Tickets</button>
                    <button onClick={() => { setAdminSubTab('schedule'); setMobileMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800">Maintenance Schedule</button>
                    <button onClick={() => { setAdminSubTab('workers'); setMobileMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800">Active Roster</button>
                    <button onClick={() => { setAdminSubTab('analytics'); setMobileMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800">Analytics</button>
                    <button onClick={() => { setAdminSubTab('settings'); setMobileMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800">Settings</button>
                  </>
                ) : (
                  <p className="p-3 text-slate-500 italic">Field Worker controls active on screen view tabs.</p>
                )}
              </nav>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 border border-slate-800 text-red-400 hover:bg-red-950/20 rounded-xl"
              >
                <LogOut className="w-4 h-4 shrink-0 text-red-500" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* VIEW MAIN CONTAINER */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderCurrentView()}
        </main>

        {/* SITE BOTTOM FOOTER */}
        <footer className="py-5 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 bg-white dark:bg-slate-800 shrink-0 uppercase tracking-widest font-mono">
          © 2026 MaintainIQ Inc. • Secure Facility Cloud Maintenance Engine
        </footer>

      </div>
    </div>
  );
}
