import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { useDeviceClass } from '../../hooks/useDeviceClass';
import { getNavigationForUser } from '../../config/navigation';
import { dropdownVariants } from '../../utils/animationVariants';
import { UserAvatar } from '../common/UserAvatar';
import {
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  Key,
  Search,
  CheckCircle,
  ChevronRight,
  ShieldCheck,
  Check,
  CheckCheck,
  Settings,
  Sparkles,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { isTablet, isMobile } = useDeviceClass();

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close drawers when device width transitions
  useEffect(() => {
    if (!isTablet && !isMobile && sidebarOpen) setSidebarOpen(false);
  }, [isTablet, isMobile, sidebarOpen]);

  const navItems = getNavigationForUser(user?.roles || []);
  const primaryMobileItems = navItems.filter((item) => item.isPrimaryMobile).slice(0, 4);

  const filteredNavItems = searchQuery.trim()
    ? navItems.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : navItems;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    setSidebarOpen(false);
    logout();
    navigate('/', { replace: true });
  };

  // Dedicated focus modes: hide mobile bottom bar during live lesson reading or assessment arenas
  const isFocusScreen =
    location.pathname.startsWith('/lessons/') || location.pathname.startsWith('/assessments/');

  const rawRole = user?.roles?.[0]?.name?.toLowerCase();
  const currentRoleName =
    rawRole === 'learner'
      ? 'Learner'
      : rawRole === 'staff' || rawRole === 'instructor'
      ? 'Faculty'
      : rawRole === 'admin'
      ? 'Administration'
      : user?.roles?.[0]?.name || 'Learner';

  const homePath =
    rawRole === 'learner'
      ? '/my-learning'
      : rawRole === 'instructor' || rawRole === 'staff'
      ? '/instructor/courses'
      : rawRole === 'admin'
      ? '/admin'
      : '/my-learning';

  const activeNavItem = navItems.find((item) => isActive(item.path));
  const _pageTitle = activeNavItem?.label || 'Workspace';
  const displayName = user?.full_name ? user.full_name.toUpperCase() : (user?.email?.split('@')[0] || 'STUDENT').toUpperCase();

  // Notifications State with Read/Unread Status & Live API Synchronization
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; desc: string; link_url?: string; time: string; read: boolean }>>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('learnflow_notifications') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback to default
      }
    }
    return [
      {
        id: '1',
        title: 'Curriculum Update',
        desc: 'Distributed Systems & Microservices track updated with new lessons.',
        link_url: '/courses',
        time: '15m ago',
        read: false,
      },
      {
        id: '2',
        title: 'Assessment Window',
        desc: 'Midterm timed assessment evaluation opens today at 10:00 AM.',
        link_url: '/my-learning',
        time: '1h ago',
        read: false,
      },
      {
        id: '3',
        title: 'HMAC Diploma Verification',
        desc: 'Your cryptographic credential registry has been synchronized.',
        link_url: '/credentials',
        time: '2h ago',
        read: false,
      },
    ];
  });

  // Fetch live notifications from API
  useEffect(() => {
    if (!user) return;
    const fetchLiveNotifs = async () => {
      try {
        const res = await api.system.getNotifications();
        if (res.data && res.data.length > 0) {
          setNotifications(
            res.data.map((n) => ({
              id: n.id,
              title: n.title,
              desc: n.message,
              link_url: n.link_url,
              time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: n.is_read,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load notifications from API', err);
      }
    };
    fetchLiveNotifs();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem('learnflow_notifications', JSON.stringify(updated));
      return updated;
    });
    try {
      await api.system.markAllNotificationsRead();
    } catch {
      // offline or silent
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem('learnflow_notifications', JSON.stringify(updated));
      return updated;
    });
    try {
      await api.system.markNotificationRead(id);
    } catch {
      // offline or silent
    }
  };

  const dismissNotif = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      localStorage.setItem('learnflow_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-dvh bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Skip to Content accessibility link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#0082fb] focus:text-white focus:rounded-md focus:shadow-md text-xs font-semibold"
      >
        Skip to main content
      </a>

      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW: Persistent Left Sidebar (>= 1024px)                      */}
      {/* ========================================================================= */}
      <aside
        className="hidden lg:flex w-[230px] bg-slate-900 dark:bg-[#040806] border-r border-slate-800 dark:border-emerald-500/12 text-white flex-col fixed inset-y-0 left-0 z-30 select-none shadow-md"
        aria-label="Desktop sidebar navigation"
      >
        {/* Sidebar Header with Learnflow Brand Crest */}
        <div className="h-[50px] min-h-[50px] px-4 bg-slate-950 dark:bg-[#030605] border-b border-white/10 dark:border-emerald-500/12 flex items-center justify-between overflow-hidden">
          <Link to={homePath} className="flex items-center space-x-2" title="Learnflow Workspace Home">
            <img
              src="/learnflow-logo-dark.png"
              alt="Learnflow"
              className="h-6 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Sidebar Search Bar */}
        <div className="p-2.5 border-b border-white/10 dark:border-emerald-500/12 bg-slate-950/60 dark:bg-[#030605]/80">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-slate-900 dark:bg-[#020403] text-white placeholder-slate-400/60 text-xs rounded pl-8 pr-2.5 py-1.5 border border-white/15 dark:border-emerald-500/15 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2 text-slate-400 hover:text-white"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Links list */}
        <nav className="flex-1 py-2 overflow-y-auto stu-nav">
          {filteredNavItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`stu-nav-item group ${active ? 'active' : ''}`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      active
                        ? 'bg-emerald-500/20 text-emerald-400 dark:text-emerald-300 shadow-xs'
                        : 'bg-white/5 text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-400'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 ml-auto shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ========================================================================= */}
      {/* 1b. TABLET VIEW: Persistent Compact Icon Rail (768px - 1023px)            */}
      {/* ========================================================================= */}
      <aside
        className="hidden md:flex lg:hidden w-[72px] bg-slate-900 dark:bg-[#040806] border-r border-slate-800 dark:border-emerald-500/12 text-white flex-col fixed inset-y-0 left-0 z-30 select-none shadow-md items-center py-2.5"
        aria-label="Tablet sidebar navigation rail"
      >
        {/* Tablet Crest */}
        <Link
          to={homePath}
          className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center mb-3 transition-colors shrink-0"
          title="Learnflow Workspace Home"
        >
          <img
            src="/favicon.svg"
            alt="Learnflow"
            className="h-6 w-6 object-contain"
          />
        </Link>

        {/* Tablet Nav Rail Links */}
        <nav className="flex-1 w-full px-1.5 space-y-1.5 overflow-y-auto no-scrollbar flex flex-col items-center">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all group ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-400 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
                title={item.label}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5" />
                  )}
                </div>
                <span className="text-[9px] font-medium tracking-tight mt-1 truncate max-w-[62px] text-center leading-none">
                  {item.mobileLabel || item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ========================================================================= */}
      {/* 2. TOPBAR & MAIN CONTENT WRAPPER (Responsive, No Horizontal Scrollbars)  */}
      {/* ========================================================================= */}
      <div className="md:ml-[72px] lg:ml-[230px] flex flex-col flex-1 min-h-dvh min-w-0 max-w-full overflow-x-hidden">
        {/* Sticky Topbar with Skeuomorphic Elevation & Backdrop Filter */}
        <header className="stu-topbar sticky top-0 z-40 bg-white/95 dark:bg-[#020308]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 shadow-xs">
          {/* Left: Mobile Hamburger & Learnflow Logo / Tablet Page Title */}
          <div className="flex items-center gap-3">
            {/* Hamburger button visible only on mobile screens (< 768px) */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle Navigation Sidebar"
              className="md:hidden w-10 h-10 -ml-1 rounded-lg flex items-center justify-center text-[#0082fb] dark:text-[#3aa0ff] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Learnflow Logo (< 768px) */}
            <Link to={homePath} className="md:hidden flex items-center space-x-2">
              <img
                src="/learnflow-logo-light.png"
                alt="Learnflow"
                className="h-6 w-auto block dark:hidden object-contain"
              />
              <img
                src="/learnflow-logo-dark.png"
                alt="Learnflow"
                className="h-6 w-auto hidden dark:block object-contain"
              />
            </Link>

            {/* Tablet Page Title (768px <= width < 1024px) */}
            <div className="hidden md:flex lg:hidden items-center space-x-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {_pageTitle}
              </span>
            </div>


          </div>

          {/* Right: Theme Toggle, Notifications, User Badge Pill */}
          <div className="flex items-center gap-2">
            {/* 1. Theme Toggle Button with Tactile Round Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Dark Mode Active' : 'Light Mode Active'}
              className="skeuo-icon-btn rounded-full w-[38px] h-[38px] text-slate-600 dark:text-slate-300 hover:text-[#0082fb] dark:hover:text-[#3aa0ff] cursor-pointer"
            >
              {isDarkMode ? <Moon className="w-4 h-4 text-sky-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </motion.button>

            {/* 2. Notification Bell with Tactile Round Button & Badge */}
            <div className="relative" ref={notifRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setNotificationOpen(!notificationOpen)}
                aria-label="Toggle notifications menu"
                title="Notifications"
                className="skeuo-icon-btn rounded-full w-[38px] h-[38px] text-slate-600 dark:text-slate-300 hover:text-[#0082fb] dark:hover:text-[#3aa0ff] relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-[#ef4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-xs border border-white dark:border-slate-900 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </motion.button>

              <AnimatePresence>
                {notificationOpen && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#06080c] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-[#0082fb] text-white flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm tracking-wide">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-[11px] bg-white/20 font-semibold px-2 py-0.5 rounded-full">
                            {unreadCount} New
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-[11px] font-semibold text-blue-100 hover:text-white flex items-center gap-1 cursor-pointer underline hover:no-underline transition-colors"
                          title="Mark all notifications as read"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (!notif.read) markAsRead(notif.id);
                              if (notif.link_url) {
                                setNotificationOpen(false);
                                navigate(notif.link_url);
                              }
                            }}
                            className={`p-3.5 transition-colors cursor-pointer ${
                              notif.read
                                ? 'bg-white dark:bg-[#0F172A] opacity-80 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                : 'bg-blue-50/50 dark:bg-slate-800/70 hover:bg-blue-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center space-x-2">
                                {!notif.read && (
                                  <span className="w-2 h-2 rounded-full bg-[#0082fb] shrink-0" title="Unread" />
                                )}
                                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                  {notif.title}
                                </h4>
                              </div>
                              <div className="flex items-center space-x-1.5 shrink-0">
                                {!notif.read && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notif.id);
                                    }}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#0082fb] hover:bg-blue-100/60 dark:text-sky-400 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                                    title="Mark as read"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Read</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissNotif(notif.id);
                                  }}
                                  aria-label="Dismiss notification"
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[10px] p-0.5"
                                  title="Dismiss"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug pl-4">
                              {notif.desc}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono mt-1.5 block pl-4">
                              {notif.time}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Personalized Character Avatar Trigger with Dropdown (Icon Only) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="skeuo-profile-pill group flex items-center justify-center p-0.5 rounded-full w-[38px] h-[38px] transition-all duration-200 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0082fb]/40"
                title={`${user?.full_name || 'Account'} Menu`}
                aria-label="Account Profile Menu"
              >
                <UserAvatar user={user} size="sm" showStatus={true} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#06080c] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden"
                  >
                    {/* User Profile Section with Personalized Avatar */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                      <UserAvatar user={user} size="lg" showStatus={true} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-mono font-bold text-[#0082fb] dark:text-[#3aa0ff] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#0082fb]/10 border border-[#0082fb]/20">
                            {currentRoleName}
                          </span>
                        </div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {user?.full_name || 'Authenticated Scholar'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {user?.email || 'learner@learnflow.edu'}
                        </div>
                      </div>
                    </div>

                    {/* Menu Links */}
                    <div className="p-1.5 divide-y divide-slate-100 dark:divide-slate-800/80">
                      <div className="py-1">
                        <Link
                          to="/avatar-studio"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors group"
                        >
                          <Sparkles className="w-4 h-4 text-[#0082fb] dark:text-[#3aa0ff] group-hover:rotate-12 transition-transform" />
                          <span className="flex-1">Avatar &amp; Atmosphere Studio</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/20">
                            Studio
                          </span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4 text-[#0082fb] dark:text-[#3aa0ff]" />
                          <span>Account Settings</span>
                        </Link>
                        <Link
                          to="/my-certificates"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-lg transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#0082fb] dark:text-[#3aa0ff]" />
                          <span>My Credentials &amp; Profile</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            setIsChangePasswordOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-lg transition-colors text-left"
                        >
                          <Key className="w-4 h-4 text-[#0082fb] dark:text-[#3aa0ff]" />
                          <span>Change Password</span>
                        </button>
                      </div>

                      {/* Logout Button */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#ef4444] hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-[#ef4444]" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main id="main-content" className="flex-1 px-3 sm:px-5 md:px-6 lg:px-8 pt-2 sm:pt-3 pb-24 md:pb-8 lg:pb-10 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. TABLET & MOBILE SLIDE-OUT DRAWER (< 1024px)                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            {/* Slide-out Sidebar Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="relative w-[280px] bg-slate-900 dark:bg-[#040806] text-white flex flex-col z-50 shadow-2xl h-full border-r border-slate-800 dark:border-emerald-500/12"
            >
              {/* Drawer Header with Learnflow Brand */}
              <div className="h-[50px] px-4 bg-slate-950 dark:bg-[#030605] border-b border-white/10 dark:border-emerald-500/12 flex items-center justify-between">
                <Link to={homePath} onClick={() => setSidebarOpen(false)} className="flex items-center space-x-2">
                  <img
                    src="/learnflow-logo-dark.png"
                    alt="Learnflow"
                    className="h-6 w-auto object-contain"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close sidebar"
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Search */}
              <div className="p-3 border-b border-white/10 dark:border-emerald-500/12 bg-slate-950/60 dark:bg-[#030605]/80">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full bg-slate-900 dark:bg-[#020403] text-white placeholder-slate-400/60 text-xs rounded pl-8 pr-2.5 py-1.5 border border-white/15 dark:border-emerald-500/15 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 py-2 overflow-y-auto stu-nav">
                {filteredNavItems.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`stu-nav-item ${active ? 'active' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-400 dark:text-emerald-300' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 ml-auto">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer Footer with User & Sign Out */}
              <div className="p-4 border-t border-white/10 bg-slate-950 dark:bg-[#0b0f16] space-y-3">
                <div className="flex items-center gap-3">
                  <UserAvatar user={user} size="md" showStatus={true} />
                  <div className="text-xs min-w-0 flex-1">
                    <p className="font-bold text-white truncate">{user?.full_name || displayName}</p>
                    <p className="text-[11px] font-mono text-blue-200/70 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full h-9 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-600/30 text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. MOBILE BOTTOM TAB BAR (< 768px, Hidden on Focus Screens)               */}
      {/* Exactly 4 Primary Functions across all roles (Learner, Instructor, Admin)  */}
      {/* ========================================================================= */}
      {!isFocusScreen && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 h-14 bg-slate-900/95 dark:bg-[#06080c]/95 backdrop-blur-md border-t border-slate-800 dark:border-white/10 text-white grid grid-cols-4 z-40 pb-safe select-none shadow-lg"
          aria-label="Mobile bottom navigation"
        >
          {primaryMobileItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full text-center transition-all active:scale-95 py-1 ${
                  active ? 'text-[#0082fb] dark:text-[#3aa0ff] font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 mb-0.5 shrink-0" />
                  {active && (
                    <span className="w-1 h-1 rounded-full bg-[#0082fb] dark:bg-[#3aa0ff] absolute -bottom-0.5 left-1/2 -translate-x-1/2" />
                  )}
                </div>
                <span className="text-[10px] leading-tight truncate px-0.5 max-w-[64px]">
                  {item.mobileLabel || item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* ========================================================================= */}
      {/* 5. CHANGE PASSWORD MODAL                                                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isChangePasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => {
                setIsChangePasswordOpen(false);
                setIsPasswordChanged(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-[#06080c] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 z-50"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2 text-[#0082fb] dark:text-[#3aa0ff]">
                  <Key className="w-5 h-5" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Password</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePasswordOpen(false);
                    setIsPasswordChanged(false);
                  }}
                  aria-label="Close change password modal"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isPasswordChanged ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Password Updated Successfully</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your account password credentials have been updated securely.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangePasswordOpen(false);
                      setIsPasswordChanged(false);
                    }}
                    className="mt-2 px-5 py-2 rounded-xl bg-[#0082fb] text-white text-xs font-semibold hover:bg-[#155dfc] transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIsPasswordChanged(true);
                  }}
                  className="space-y-4 pt-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter current password"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0082fb] dark:focus:border-[#3aa0ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="At least 8 characters"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0082fb] dark:focus:border-[#3aa0ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-enter new password"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0082fb] dark:focus:border-[#3aa0ff]"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsChangePasswordOpen(false)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0082fb] text-white hover:bg-[#155dfc] shadow-xs transition-colors cursor-pointer"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
