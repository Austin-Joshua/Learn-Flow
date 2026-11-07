import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  GraduationCap,
  BookOpen,
  Award,
  Sparkles,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  Search
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, hasRole } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  Learnflow
                </span>
                <span className="text-[10px] text-indigo-400 font-medium tracking-wider uppercase">Enterprise LMS</span>
              </div>
            </Link>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/courses"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/courses') ? 'bg-slate-800 text-indigo-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4" />
                <span>Course Catalog</span>
              </span>
            </Link>

            <Link
              to="/verify"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/verify') ? 'bg-slate-800 text-indigo-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Credential</span>
              </span>
            </Link>

            {isAuthenticated && (
              <>
                {/* Learner Links */}
                {hasRole('learner') && (
                  <>
                    <Link
                      to="/my-learning"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/my-learning') ? 'bg-slate-800 text-indigo-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      My Courses
                    </Link>
                    <Link
                      to="/adaptive-path"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/adaptive-path') ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/50' : 'text-indigo-400 hover:bg-indigo-950/40'
                      }`}
                    >
                      <span className="flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Adaptive Path</span>
                      </span>
                    </Link>
                    <Link
                      to="/my-certificates"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/my-certificates') ? 'bg-slate-800 text-indigo-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="flex items-center space-x-1.5">
                        <Award className="w-4 h-4" />
                        <span>Certificates</span>
                      </span>
                    </Link>
                  </>
                )}

                {/* Instructor Links */}
                {(hasRole('instructor') || hasRole('admin')) && (
                  <>
                    <div className="h-4 w-px bg-slate-700 mx-2" />
                    <Link
                      to="/instructor/courses"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname.startsWith('/instructor') ? 'bg-slate-800 text-indigo-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      Instructor Studio
                    </Link>
                  </>
                )}

                {/* Admin Links */}
                {hasRole('admin') && (
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname.startsWith('/admin') ? 'bg-slate-800 text-amber-400' : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-800/60'
                    }`}
                  >
                    Admin Portal
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User actions */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 pl-3 border-l border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white uppercase shadow">
                    {user.first_name[0]}{user.last_name[0]}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-200">{user.full_name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{user.roles.map(r => r.name).join(', ')}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all hover:scale-102"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
