import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Compass,
  GitBranch,
  Award,
  Layers,
  Building2,
  ShieldAlert,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, hasRole } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/', { replace: true });
  };

  const isActive = (path: string) => location.pathname === path;

  // Header is displayed on public pages; on signed-in workspaces AppShell provides the navigation
  const isPublicPage =
    location.pathname === '/' ||
    location.pathname === '/courses' ||
    location.pathname.startsWith('/courses/') ||
    location.pathname.startsWith('/verify');

  if (!isPublicPage) {
    return null;
  }

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Mark */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-sm bg-slate-800 border border-slate-700/80 flex items-center justify-center text-sky-400">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-base font-semibold tracking-tight text-white">
                  Learnflow
                </span>
                <span className="text-[11px] font-mono text-slate-400 tracking-normal">
                  [LMS]
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/courses"
                className={`h-[34px] px-3 rounded-sm text-xs font-medium inline-flex items-center space-x-1.5 transition-colors ${
                  isActive('/courses')
                    ? 'bg-slate-800 text-white border border-slate-700/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Courses</span>
              </Link>

              <Link
                to="/verify"
                className={`h-[34px] px-3 rounded-sm text-xs font-medium inline-flex items-center space-x-1.5 transition-colors ${
                  isActive('/verify')
                    ? 'bg-slate-800 text-white border border-slate-700/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Verification</span>
              </Link>

              {isAuthenticated && (
                <>
                  {hasRole('learner') && (
                    <>
                      <Link
                        to="/my-learning"
                        className={`h-[34px] px-3 rounded-sm text-xs font-medium inline-flex items-center space-x-1.5 transition-colors ${
                          isActive('/my-learning')
                            ? 'bg-slate-800 text-white border border-slate-700/60'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <span>My Learning</span>
                      </Link>

                      <Link
                        to="/my-journey"
                        className={`h-[34px] px-3 rounded-sm text-xs font-medium inline-flex items-center space-x-1.5 transition-colors ${
                          isActive('/my-journey')
                            ? 'bg-slate-800 text-white border border-slate-700/60'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <Compass className="w-3.5 h-3.5 text-sky-400" />
                        <span>My Journey</span>
                      </Link>
                    </>
                  )}

                  {(hasRole('instructor') || hasRole('admin')) && (
                    <Link
                      to="/instructor/courses"
                      className={`h-[34px] px-3 rounded-sm text-xs font-medium inline-flex items-center space-x-1.5 transition-colors ${
                        location.pathname.startsWith('/instructor')
                          ? 'bg-slate-800 text-white border border-slate-700/60'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Instructor Studio</span>
                    </Link>
                  )}

                  {(hasRole('hod') || hasRole('admin')) && (
                    <Link
                      to="/hod"
                      className={`h-[34px] px-3 rounded-sm text-xs font-medium inline-flex items-center space-x-1.5 transition-colors ${
                        location.pathname.startsWith('/hod')
                          ? 'bg-slate-800 text-white border border-slate-700/60'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>HOD Portal</span>
                    </Link>
                  )}

                  {hasRole('admin') && (
                    <Link
                      to="/admin"
                      className={`h-[34px] px-3 rounded-sm text-xs font-medium inline-flex items-center space-x-1.5 transition-colors ${
                        location.pathname.startsWith('/admin')
                          ? 'bg-slate-800 text-white border border-slate-700/60'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                      <span>Governance</span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Desktop User Controls */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 pl-3 border-l border-slate-800">
                  <div className="w-7 h-7 rounded-sm bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-[11px] font-medium text-slate-200">
                    {user.first_name[0]}{user.last_name[0]}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-medium text-slate-200 leading-tight">{user.full_name}</span>
                    <span className="text-[10px] font-mono text-slate-400 capitalize">{user.roles.map((r) => r.name).join(', ')}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-sm transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="h-[34px] px-3.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-sm inline-flex items-center transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="h-[34px] px-3.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-sm inline-flex items-center transition-colors"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Theme Toggle & Hamburger */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile navigation menu"
              className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-Over Sheet Menu for Public / Top Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-slate-900 text-white flex flex-col p-6 z-50 shadow-2xl h-full border-l border-slate-800 pt-safe pb-safe">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <span className="text-sm font-bold text-white tracking-tight">Learnflow Menu</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              <Link
                to="/courses"
                onClick={() => setMobileMenuOpen(false)}
                className="h-10 px-3 rounded-md text-xs font-semibold flex items-center space-x-3 text-slate-300 hover:bg-slate-800"
              >
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>Course Catalog</span>
              </Link>

              <Link
                to="/verify"
                onClick={() => setMobileMenuOpen(false)}
                className="h-10 px-3 rounded-md text-xs font-semibold flex items-center space-x-3 text-slate-300 hover:bg-slate-800"
              >
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Verify Credentials</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <div className="pt-4 pb-2 border-t border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Your Workspace
                  </div>
                  {hasRole('learner') && (
                    <>
                      <Link
                        to="/my-learning"
                        onClick={() => setMobileMenuOpen(false)}
                        className="h-10 px-3 rounded-md text-xs font-semibold flex items-center space-x-3 text-slate-300 hover:bg-slate-800"
                      >
                        <BookOpen className="w-4 h-4 text-sky-400" />
                        <span>My Learning</span>
                      </Link>
                      <Link
                        to="/my-journey"
                        onClick={() => setMobileMenuOpen(false)}
                        className="h-10 px-3 rounded-md text-xs font-semibold flex items-center space-x-3 text-slate-300 hover:bg-slate-800"
                      >
                        <Compass className="w-4 h-4 text-sky-400" />
                        <span>My Journey</span>
                      </Link>
                      <Link
                        to="/my-certificates"
                        onClick={() => setMobileMenuOpen(false)}
                        className="h-10 px-3 rounded-md text-xs font-semibold flex items-center space-x-3 text-slate-300 hover:bg-slate-800"
                      >
                        <Award className="w-4 h-4 text-sky-400" />
                        <span>Credentials</span>
                      </Link>
                    </>
                  )}
                  {hasRole('instructor') && (
                    <Link
                      to="/instructor/courses"
                      onClick={() => setMobileMenuOpen(false)}
                      className="h-10 px-3 rounded-md text-xs font-semibold flex items-center space-x-3 text-slate-300 hover:bg-slate-800"
                    >
                      <Layers className="w-4 h-4 text-sky-400" />
                      <span>Instructor Studio</span>
                    </Link>
                  )}
                  {hasRole('hod') && (
                    <Link
                      to="/hod"
                      onClick={() => setMobileMenuOpen(false)}
                      className="h-10 px-3 rounded-md text-xs font-semibold flex items-center space-x-3 text-slate-300 hover:bg-slate-800"
                    >
                      <Building2 className="w-4 h-4 text-sky-400" />
                      <span>HOD Portal</span>
                    </Link>
                  )}
                  {hasRole('admin') && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="h-10 px-3 rounded-md text-xs font-semibold flex items-center space-x-3 text-slate-300 hover:bg-slate-800"
                    >
                      <ShieldAlert className="w-4 h-4 text-sky-400" />
                      <span>Governance</span>
                    </Link>
                  )}
                </>
              ) : (
                <div className="pt-6 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full h-10 px-4 rounded-md text-xs font-semibold flex items-center justify-center bg-slate-800 text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full h-10 px-4 rounded-md text-xs font-semibold flex items-center justify-center bg-sky-600 text-white"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </nav>

            {isAuthenticated && (
              <div className="pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full h-10 px-4 rounded-md text-xs font-semibold flex items-center justify-center space-x-2 text-rose-300 bg-rose-950/40 border border-rose-900/60"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
