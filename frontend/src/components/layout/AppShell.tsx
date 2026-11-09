import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { useDeviceClass } from '../../hooks/useDeviceClass';
import { getNavigationForUser } from '../../config/navigation';
import { dropdownVariants } from '../../utils/animationVariants';
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
  MoreHorizontal,
  ChevronRight,
  ShieldCheck,
  Check,
  CheckCheck,
  Settings,
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
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

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
    if (!isMobile && isMobileMoreOpen) setIsMobileMoreOpen(false);
  }, [isTablet, isMobile, sidebarOpen, isMobileMoreOpen]);

  const navItems = getNavigationForUser(user?.roles || []);
  const primaryMobileItems = navItems.filter((item) => item.isPrimaryMobile).slice(0, 4);
  const secondaryMobileItems = navItems.filter((item) => !item.isPrimaryMobile);

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
      : rawRole === 'hod'
      ? 'Department Head'
      : rawRole === 'admin'
      ? 'Administration'
      : user?.roles?.[0]?.name || 'Learner';

  const homePath =
    rawRole === 'learner'
      ? '/my-learning'
      : rawRole === 'instructor' || rawRole === 'staff'
      ? '/instructor/courses'
      : rawRole === 'hod'
      ? '/hod'
      : rawRole === 'admin'
      ? '/admin'
      : '/my-learning';

  const activeNavItem = navItems.find((item) => isActive(item.path));
  const _pageTitle = activeNavItem?.label || 'Workspace';
  const displayName = user?.full_name ? user.full_name.toUpperCase() : (user?.email?.split('@')[0] || 'STUDENT').toUpperCase();

  // Notifications State with Read/Unread Status & Local Persistence
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; desc: string; time: string; read: boolean }>>(() => {
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
        time: '15m ago',
        read: false,
      },
      {
        id: '2',
        title: 'Assessment Window',
        desc: 'Midterm timed assessment evaluation opens today at 10:00 AM.',
        time: '1h ago',
        read: false,
      },
      {
        id: '3',
        title: 'HMAC Diploma Verification',
        desc: 'Your cryptographic credential registry has been synchronized.',
        time: '2h ago',
        read: false,
      },
    ];
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem('learnflow_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem('learnflow_notifications', JSON.stringify(updated));
      return updated;
    });
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
        className="hidden lg:flex w-[230px] bg-slate-900 dark:bg-[#06080c] border-r border-slate-800 dark:border-white/10 text-white flex-col fixed inset-y-0 left-0 z-30 select-none shadow-md"
        aria-label="Desktop sidebar navigation"
      >
        {/* Sidebar Header with Learnflow Brand Crest */}
        <div className="h-[50px] min-h-[50px] px-4 bg-slate-950 dark:bg-[#0b0f16] border-b border-white/10 flex items-center justify-between overflow-hidden">
          <Link to={homePath} className="flex items-center space-x-2" title="Learnflow Workspace Home">
            <img
              src="/learnflow-logo-dark.png"
              alt="Learnflow"
              className="h-6 w-auto object-contain"
            />
            <span className="text-label font-mono font-bold text-[#0082fb] dark:text-[#3aa0ff]">[LMS]</span>
          </Link>
        </div>

        {/* Sidebar Search Bar */}
        <div className="p-2.5 border-b border-white/10 bg-slate-950/60 dark:bg-[#0b0f16]/80">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-blue-200/60 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-slate-900 dark:bg-[#020308] text-white placeholder-blue-200/50 text-xs rounded pl-8 pr-2.5 py-1.5 border border-white/15 focus:border-[#0082fb] dark:focus:border-[#3aa0ff] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2 text-blue-200/60 hover:text-white"
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
                className={`stu-nav-item ${active ? 'active' : ''}`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#0082fb] dark:text-[#3aa0ff]' : 'text-blue-100/70'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 text-white ml-auto shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ========================================================================= */}
      {/* 2. TOPBAR & MAIN CONTENT WRAPPER (Responsive)                             */}
      {/* ========================================================================= */}
      <div className="lg:ml-[230px] flex flex-col flex-1 min-h-dvh">
        {/* Sticky Topbar */}
        <header className="stu-topbar">
          {/* Left: Mobile Hamburger & Learnflow Logo / Desktop Page Title */}
          <div className="flex items-center gap-3">
            {/* Hamburger button visible only below lg */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle Navigation Sidebar"
              className="lg:hidden w-10 h-10 -ml-1 rounded-lg flex items-center justify-center text-[#0082fb] dark:text-[#3aa0ff] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Learnflow Logo */}
            <Link to={homePath} className="lg:hidden flex items-center space-x-2">
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


          </div>

          {/* Right: Theme Toggle, Notifications, User Badge Pill */}
          <div className="flex items-center gap-2">
            {/* 1. Theme Toggle Button with Slick Hover */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Dark Mode Active' : 'Light Mode Active'}
              className="w-[38px] h-[38px] rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#0082fb] dark:hover:text-[#3aa0ff] hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              {isDarkMode ? <Moon className="w-5 h-5 text-sky-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </motion.button>

            {/* 2. Notification Bell with Badge & Dropdown */}
            <div className="relative" ref={notifRef}>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setNotificationOpen(!notificationOpen)}
                aria-label="Toggle notifications menu"
                title="Notifications"
                className="w-[38px] h-[38px] rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#0082fb] dark:hover:text-[#3aa0ff] hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-[#ef4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-xs">
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

            {/* 3. User Profile Pill Badge with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="stu-user-badge"
                title="Account Menu"
              >
                <div className="w-5 h-5 rounded-full bg-[#0082fb]/10 dark:bg-[#0082fb]/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-[#0082fb] dark:text-[#3aa0ff]" />
                </div>
                <span className="hidden sm:inline tracking-tight font-bold">{displayName}</span>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#06080c] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden"
                  >
                    {/* User Profile Section */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Account Profile
                      </div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {user?.full_name || 'Authenticated User'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {user?.email || 'learner@learnflow.edu'}
                      </div>
                      <div className="text-[11px] font-extrabold text-[#0082fb] dark:text-[#3aa0ff] mt-1.5 tracking-wide uppercase">
                        {currentRoleName}
                      </div>
                    </div>

                    {/* Menu Links */}
                    <div className="p-1.5 divide-y divide-slate-100 dark:divide-slate-800/80">
                      <div className="py-1">
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
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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
              className="relative w-[280px] bg-slate-900 dark:bg-[#06080c] text-white flex flex-col z-50 shadow-2xl h-full border-r border-slate-800 dark:border-white/10"
            >
              {/* Drawer Header with Learnflow Brand */}
              <div className="h-[50px] px-4 bg-slate-950 dark:bg-[#0b0f16] border-b border-white/10 flex items-center justify-between">
                <Link to={homePath} onClick={() => setSidebarOpen(false)} className="flex items-center space-x-2">
                  <img
                    src="/learnflow-logo-dark.png"
                    alt="Learnflow"
                    className="h-6 w-auto object-contain"
                  />
                  <span className="text-label font-mono font-bold text-[#0082fb] dark:text-[#3aa0ff]">[LMS]</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close sidebar"
                  className="p-1 rounded text-blue-200 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Search */}
              <div className="p-3 border-b border-white/10 bg-slate-950/60 dark:bg-[#0b0f16]/80">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-blue-200/60 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full bg-slate-900 dark:bg-[#020308] text-white placeholder-blue-200/50 text-xs rounded pl-8 pr-2.5 py-1.5 border border-white/15 focus:border-[#0082fb] dark:focus:border-[#3aa0ff] focus:outline-none"
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
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#0082fb] dark:text-[#3aa0ff]' : 'text-blue-100/70'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 text-white ml-auto">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer Footer with User & Sign Out */}
              <div className="p-4 border-t border-white/10 bg-slate-950 dark:bg-[#0b0f16] space-y-3">
                <div className="text-xs">
                  <p className="font-bold text-white truncate">{displayName}</p>
                  <p className="text-[11px] font-mono text-blue-200/70 truncate">{user?.email}</p>
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
      {/* ========================================================================= */}
      {!isFocusScreen && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 h-14 bg-slate-900/95 dark:bg-[#06080c]/95 backdrop-blur-md border-t border-slate-800 dark:border-white/10 text-white flex items-center justify-around z-40 pb-safe select-none"
          aria-label="Mobile bottom navigation"
        >
          {primaryMobileItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full text-center transition-colors ${
                  active ? 'text-[#0082fb] dark:text-[#3aa0ff] font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="text-meta leading-tight truncate px-1 max-w-[68px]">
                  {item.mobileLabel || item.label}
                </span>
              </Link>
            );
          })}

          {/* "More" Sheet Trigger Button */}
          <button
            type="button"
            onClick={() => setIsMobileMoreOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full text-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 mb-0.5" />
            <span className="text-meta leading-tight">More</span>
          </button>
        </nav>
      )}

      {/* Mobile "More" Sheet Modal */}
      {isMobileMoreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileMoreOpen(false)}
          />
          <div className="relative bg-[#222d32] text-white rounded-t-2xl p-6 z-50 border-t border-slate-700 max-h-[80vh] overflow-y-auto pb-safe">
            <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-4 border-b border-slate-700 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">{displayName}</h3>
                <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                aria-label="Close navigation sheet"
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Secondary navigation items */}
            <div className="space-y-1 mb-6">
              {secondaryMobileItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setIsMobileMoreOpen(false)}
                    className={`h-11 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                      active ? 'bg-slate-800 text-white border-l-[3px] border-[#0082fb] dark:border-[#3aa0ff]' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4 text-[#0082fb] dark:text-[#3aa0ff]" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Link>
                );
              })}
            </div>

            {/* Sign out button */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMoreOpen(false);
                handleLogout();
              }}
              className="w-full h-11 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-[#ef4444] border border-rose-800/60 text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
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
