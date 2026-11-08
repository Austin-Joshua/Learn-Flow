import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { getNavigationForUser } from '../../config/navigation';
import {
  GraduationCap,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [isTabletDrawerOpen, setIsTabletDrawerOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  const navItems = getNavigationForUser(user?.roles || []);
  const primaryMobileItems = navItems.filter((item) => item.isPrimaryMobile).slice(0, 4);
  const secondaryMobileItems = navItems.filter((item) => !item.isPrimaryMobile);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = () => {
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

  // Get active page title for header
  const activeNavItem = navItems.find((item) => isActive(item.path));
  const pageTitle = activeNavItem?.label || 'Workspace';

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Skip to Content accessibility link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-sky-600 focus:text-white focus:rounded-md focus:shadow-md text-xs font-semibold"
      >
        Skip to main content
      </a>

      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW: Persistent Left Sidebar (>= 1024px)                      */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex w-full min-h-dvh">
        <aside
          className="w-64 bg-slate-900 border-r border-slate-800 text-white flex flex-col fixed inset-y-0 left-0 z-30 select-none"
          aria-label="Desktop sidebar navigation"
        >
          {/* Brand header */}
          <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-sm bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base font-semibold tracking-tight text-white">Learnflow</span>
                <span className="text-label font-mono text-slate-400">[LMS]</span>
              </div>
            </Link>
            <span className="text-label font-sans font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80">
              {currentRoleName}
            </span>
          </div>

          {/* Navigation Links list */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`h-9 px-3 rounded-md text-xs font-medium flex items-center justify-between transition-colors ${
                    active
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-meta font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Footer: User & Controls */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Authenticated User'}</p>
                <p className="text-label font-mono text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full h-8 px-3 rounded-md bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 border border-slate-700/60 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Desktop Main Content container */}
        <div className="flex-1 ml-64 flex flex-col min-h-dvh">
          <header className="h-14 px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white font-sans">
              {pageTitle}
            </h1>
            <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>{user?.email}</span>
            </div>
          </header>

          <main id="main-content" className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TABLET VIEW: Collapsed Icon Rail (768px - 1023px)                      */}
      {/* ========================================================================= */}
      <div className="hidden md:flex lg:hidden w-full min-h-dvh">
        <aside
          className="w-16 bg-slate-900 border-r border-slate-800 text-white flex flex-col fixed inset-y-0 left-0 z-30 select-none items-center py-4 justify-between"
          aria-label="Tablet collapsed icon rail"
        >
          <div className="flex flex-col items-center space-y-4">
            <Link to="/" className="w-9 h-9 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
              <GraduationCap className="w-5 h-5" />
            </Link>

            <button
              type="button"
              onClick={() => setIsTabletDrawerOpen(true)}
              aria-label="Expand tablet navigation drawer"
              className="w-9 h-9 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Icon Rail */}
            <nav className="space-y-2 pt-2">
              {navItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    title={item.label}
                    aria-label={item.label}
                    className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                      active
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col items-center space-y-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-9 h-9 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              className="w-9 h-9 rounded-md bg-slate-800 text-rose-400 flex items-center justify-center hover:bg-rose-950/60 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Tablet Overlay Drawer */}
        {isTabletDrawerOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setIsTabletDrawerOpen(false)}
            />
            <div className="relative w-72 bg-slate-900 text-white flex flex-col p-6 z-50 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-sm font-bold text-white tracking-tight">Navigation</span>
                <button
                  type="button"
                  onClick={() => setIsTabletDrawerOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsTabletDrawerOpen(false)}
                      className={`h-10 px-3 rounded-md text-xs font-semibold flex items-center space-x-3 transition-colors ${
                        active ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Tablet Content */}
        <div className="flex-1 ml-16 flex flex-col min-h-dvh">
          <header className="h-14 px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white font-sans">
              {pageTitle}
            </h1>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{user?.email}</span>
          </header>

          <main id="main-content" className="flex-1 p-6 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE VIEW: Top Bar + Bottom Tab Bar (< 768px)                         */}
      {/* ========================================================================= */}
      <div className="md:hidden flex flex-col min-h-dvh">
        {/* Top Bar with Safe Area */}
        <header className="h-14 px-4 bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 flex items-center justify-between pt-safe">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-sm bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Learnflow</span>
            <span className="text-xs text-slate-400 font-sans">({currentRoleName})</span>
          </Link>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Mobile Main Content */}
        <main
          id="main-content"
          className={`flex-1 px-4 py-6 ${isFocusScreen ? 'pb-8' : 'pb-24'} w-full overflow-x-hidden`}
        >
          {children}
        </main>

        {/* Bottom Tab Bar (Max 5 Items, 56px height, hidden on focus screens) */}
        {!isFocusScreen && (
          <nav
            className="fixed bottom-0 inset-x-0 h-14 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white flex items-center justify-around z-40 pb-safe select-none"
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
                    active ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
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
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div
              className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs"
              onClick={() => setIsMobileMoreOpen(false)}
            />
            <div className="relative bg-slate-900 text-white rounded-t-2xl p-6 z-50 border-t border-slate-800 max-h-[80vh] overflow-y-auto pb-safe">
              <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">{user?.full_name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMoreOpen(false)}
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
                        active ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4 text-sky-400" />
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
                className="w-full h-11 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out from Learnflow</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
