import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { AppShell } from './AppShell';
import { Footer } from '../Footer';
import { GraduationCap, Sun, Moon, LogIn, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';

export interface ShellRouteWrapperProps {
  children?: React.ReactNode;
}

export const ShellRouteWrapper: React.FC<ShellRouteWrapperProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();

  const content = children || <Outlet />;

  if (isAuthenticated) {
    return <AppShell>{content}</AppShell>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020308] text-slate-900 dark:text-[#f2f5f9] flex flex-col font-sans transition-colors duration-200">
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#020308] backdrop-blur-md border-b border-slate-200 dark:border-white/10 text-slate-900 dark:text-[#f2f5f9] select-none transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center space-x-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-[#0082fb]/20 border border-[#0082fb]/40 flex items-center justify-center text-[#0082fb] dark:text-[#3aa0ff] glow-blue shadow-inner group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-[#f2f5f9]">Learnflow</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0082fb]/20 text-[#0082fb] dark:text-[#3aa0ff] border border-[#0082fb]/40">[LMS]</span>
              </div>
              <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">Academic LMS Platform</span>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Link
              to="/courses"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
            >
              <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Courses Catalog</span>
            </Link>
            <Link
              to="/verify"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Verify Diploma</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Current mode: Dark (click for Light)' : 'Current mode: Light (click for Dark)'}
              className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-white/10 dark:hover:bg-white/15 dark:text-slate-200 dark:border-white/15 flex items-center justify-center transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
            <Link
              to="/login"
              className="h-10 px-4 rounded-lg bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-white text-xs sm:text-sm font-semibold inline-flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer active:scale-98"
            >
              <LogIn className="w-3.5 h-3.5 text-[#0082fb] dark:text-[#3aa0ff]" />
              <span>Sign In</span>
            </Link>
            <Link
              to="/login"
              className="h-10 px-5 rounded-lg bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs sm:text-sm font-semibold inline-flex items-center space-x-1.5 transition-all duration-200 glow-blue shadow-md cursor-pointer border border-[#0082fb]/50 active:scale-98"
            >
              <span>Access Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {content}
      </main>

      <Footer />
    </div>
  );
};
