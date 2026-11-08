import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  GitBranch,
  Award,
  Layers,
  Building2,
  Lock
} from 'lucide-react';

export const Footer: React.FC = () => {
  const location = useLocation();

  // Hidden on signin and signup pages per institutional layout requirements
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & Mission Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-sm bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Learnflow
                </span>
                <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
                  [LMS]
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              A comprehensive academic learning platform designed for computer science education. Providing structured curricula, server-side timed assessments, and verifiable student credentials.
            </p>

            <div className="pt-2 flex items-center space-x-2 text-[11px] font-mono text-slate-500">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>System Operational · Release 2.0</span>
              </span>
            </div>
          </div>

          {/* Academic Curricula */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 font-mono">
              Academic Curricula
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/courses"
                  className="hover:text-sky-600 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Course Catalog</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/adaptive-path"
                  className="hover:text-sky-600 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                  <span>Prerequisite Graph</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/verify"
                  className="hover:text-sky-600 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Credential Verification</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Workspaces & Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 font-mono">
              Role Workspaces
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/my-learning"
                  className="hover:text-sky-600 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>Student Portal</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/instructor/courses"
                  className="hover:text-sky-600 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Faculty Studio</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/hod"
                  className="hover:text-sky-600 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Department Oversight</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="hover:text-sky-600 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Administration</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Governance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 font-mono">
              Academic Standards
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Award className="w-3.5 h-3.5 text-slate-400" />
                <span>Verified Certificates</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Academic Honor Code</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Protected Assessments</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Horizontal Bar */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            &copy; 2026 Learnflow LMS · Department of Computer Science &amp; Engineering. All rights reserved.
          </p>

          <div className="flex items-center space-x-6 text-slate-500 dark:text-slate-400">
            <span
              data-testid="git-sha"
              data-full-sha={typeof __APP_GIT_SHA__ !== 'undefined' ? __APP_GIT_SHA__ : 'dev'}
              className="text-[11px] font-mono text-slate-400 dark:text-slate-500"
            >
              Build: {typeof __APP_GIT_SHA__ !== 'undefined' ? __APP_GIT_SHA__.substring(0, 7) : 'dev'}
            </span>
            <Link to="/courses" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Courses
            </Link>
            <Link to="/verify" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Verify Certificate
            </Link>
            <Link to="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
