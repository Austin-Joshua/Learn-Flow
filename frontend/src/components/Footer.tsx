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
  Lock,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const location = useLocation();

  // Hidden on signin and signup pages per institutional layout requirements
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <footer className="bg-slate-100 dark:bg-[#020308] border-t border-slate-200 dark:border-white/10 text-slate-600 dark:text-[#8a94a6] font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-[#0082fb]/20 border border-[#0082fb]/40 flex items-center justify-center text-[#0082fb] dark:text-[#3aa0ff] group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold tracking-tight text-slate-900 dark:text-[#f2f5f9]">
                    Learnflow
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-[#0082fb]/15 text-[#0082fb] dark:text-[#3aa0ff] border border-[#0082fb]/30">
                    LMS
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-[#8a94a6]">
                  Built as an internship assignment
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-600 dark:text-[#8a94a6] leading-relaxed max-w-sm">
              Learnflow is an academic learning platform providing structured curricula, timed assessments with attempt limits and audit logs, and cryptographic HMAC-SHA256 credentials.
            </p>

            <div className="space-y-1 text-label font-mono text-slate-500 dark:text-[#8a94a6]">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0082fb] dark:text-[#3aa0ff] shrink-0" />
                <span>Academic LMS · Production Operational</span>
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-2 text-label font-mono text-slate-500 dark:text-[#8a94a6]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200/60 dark:bg-white/5 border border-slate-300 dark:border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span>Production Operational · Release 2.0</span>
              </span>
            </div>
          </div>

          {/* Academic Curricula */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-[#f2f5f9] font-mono">
              Academic Curricula
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/courses"
                  className="hover:text-slate-900 dark:hover:text-[#f2f5f9] transition-colors inline-flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-400 dark:text-[#8a94a6]" />
                  <span>Course Catalog</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/adaptive-path"
                  className="hover:text-slate-900 dark:hover:text-[#f2f5f9] transition-colors inline-flex items-center gap-1.5"
                >
                  <GitBranch className="w-3.5 h-3.5 text-slate-400 dark:text-[#8a94a6]" />
                  <span>Prerequisite Graph</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/verify"
                  className="hover:text-slate-900 dark:hover:text-[#f2f5f9] transition-colors inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 dark:text-[#8a94a6]" />
                  <span>Credential Verification</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Workspaces & Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-[#f2f5f9] font-mono">
              Role Workspaces
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/my-learning"
                  className="hover:text-slate-900 dark:hover:text-[#f2f5f9] transition-colors inline-flex items-center gap-1.5"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 dark:text-[#8a94a6]" />
                  <span>Student Portal</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/instructor/courses"
                  className="hover:text-slate-900 dark:hover:text-[#f2f5f9] transition-colors inline-flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-[#8a94a6]" />
                  <span>Faculty Studio</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/hod"
                  className="hover:text-slate-900 dark:hover:text-[#f2f5f9] transition-colors inline-flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-[#8a94a6]" />
                  <span>Department Oversight</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="hover:text-slate-900 dark:hover:text-[#f2f5f9] transition-colors inline-flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-[#8a94a6]" />
                  <span>Administration</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-[#f2f5f9] font-mono">
              Platform Features
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-500 dark:text-[#8a94a6]">
                <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-[#8a94a6]" />
                <span>Course Authoring Studio</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-500 dark:text-[#8a94a6]">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400 dark:text-[#8a94a6]" />
                <span>Timed Assessments &amp; Audit Logs</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-500 dark:text-[#8a94a6]">
                <Award className="w-3.5 h-3.5 text-slate-400 dark:text-[#8a94a6]" />
                <span>HMAC-SHA256 Verification</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-500 dark:text-[#8a94a6]">
                <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-[#8a94a6]" />
                <span>Department Analytics</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Horizontal Bar */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500 dark:text-[#8a94a6]">
            &copy; 2026 Learnflow LMS. Built as an internship assignment.
          </p>

          <div className="flex items-center space-x-6 text-slate-500 dark:text-[#8a94a6]">
            <span
              data-testid="git-sha"
              data-full-sha={typeof __APP_GIT_SHA__ !== 'undefined' ? __APP_GIT_SHA__ : 'dev'}
              className="text-label font-mono text-slate-500 dark:text-[#8a94a6]"
            >
              Build: {typeof __APP_GIT_SHA__ !== 'undefined' ? __APP_GIT_SHA__.substring(0, 7) : 'dev'}
            </span>
            <Link to="/courses" className="hover:text-slate-900 dark:hover:text-[#f2f5f9] transition-colors">
              Courses
            </Link>
            <Link to="/verify" className="hover:text-slate-900 dark:hover:text-[#f2f5f9] transition-colors">
              Verify Certificate
            </Link>
            <Link to="/login" className="hover:text-slate-900 dark:hover:text-[#f2f5f9] transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
