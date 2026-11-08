import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import {
  GraduationCap,
  BookOpen,
  Award,
  GitBranch,
  ShieldCheck,
  LogOut,
  Layers,
  ShieldAlert,
  Building2,
  Sun,
  Moon
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, hasRole } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const isActive = (path: string) => location.pathname === path;

  // Header is displayed on the landing page and all authenticated pages; hidden only on signin/signup
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
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

            {/* Main Navigation */}
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
                  {/* Learner Links */}
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
                        to="/adaptive-path"
                        className={`h-[34px] px-3 rounded-sm text-xs font-medium inline-flex items-center space-x-1.5 transition-colors ${
                          isActive('/adaptive-path')
                            ? 'bg-slate-800 text-white border border-slate-700/60'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                        <span>Adaptive Path</span>
                      </Link>

                      <Link
                        to="/my-certificates"
                        className={`h-[34px] px-3 rounded-sm text-xs font-medium inline-flex items-center space-x-1.5 transition-colors ${
                          isActive('/my-certificates')
                            ? 'bg-slate-800 text-white border border-slate-700/60'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        <span>Credentials</span>
                      </Link>
                    </>
                  )}

                  {/* Instructor Links */}
                  {(hasRole('instructor') || hasRole('admin')) && (
                    <>
                      <div className="h-4 w-px bg-slate-800 mx-1.5" />
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
                    </>
                  )}

                  {/* HOD (Head of Department) Links */}
                  {(hasRole('hod') || hasRole('admin')) && (
                    <Link
                      to="/hod"
                      className={`h-[34px] px-3 rounded-sm text-xs font-medium inline-flex items-center space-x-1.5 transition-colors ${
                        location.pathname.startsWith('/hod')
                          ? 'bg-slate-800 text-white border border-slate-700/60'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Academic Oversight</span>
                    </Link>
                  )}

                  {/* Admin Links */}
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

          {/* User Profile / Auth State & Theme Switcher */}
          <div className="flex items-center space-x-3">
            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
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
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-medium text-slate-200 leading-tight">{user.full_name}</span>
                    <span className="text-[10px] font-mono text-slate-400 capitalize">{user.roles.map(r => r.name).join(', ')}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-sm transition-colors"
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
        </div>
      </div>
    </nav>
  );
};
