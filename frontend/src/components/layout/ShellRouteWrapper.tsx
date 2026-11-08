import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { AppShell } from './AppShell';
import { Footer } from '../Footer';
import { GraduationCap, Sun, Moon } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-sm bg-slate-800 border border-slate-700/80 flex items-center justify-center text-sky-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-base font-semibold tracking-tight text-white">Learnflow</span>
              <span className="text-label font-mono text-slate-400">[LMS]</span>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>
            <Link to="/courses" className="text-xs text-slate-300 hover:text-white transition-colors">
              Courses
            </Link>
            <Link to="/verify" className="text-xs text-slate-300 hover:text-white transition-colors">
              Verify
            </Link>
            <Link to="/login" className="h-8 px-3.5 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-semibold inline-flex items-center transition-colors shadow-xs">
              Sign In
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
