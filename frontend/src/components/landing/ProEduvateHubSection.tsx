import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ShieldCheck, ArrowRight, CheckCircle2, Award, Clock, FileCheck2, BarChart3, Lock, Users } from 'lucide-react';

const ACADEMIC_CAPABILITIES = [
  {
    name: 'Course Authoring Studio',
    status: 'Live',
    statusColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    desc: 'Structured curriculum design with sequential module unlocking, prerequisite DAG validation, and lesson resources.',
    link: '/instructor/courses',
    icon: Layers,
  },
  {
    name: 'Timed Assessments Arena',
    status: 'Live',
    statusColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    desc: 'Server-authoritative timers, attempt limits, four question types, and automated scoring with detailed explanations.',
    link: '/courses',
    icon: Clock,
  },
  {
    name: 'Assignment Quarantine Pipeline',
    status: 'Live',
    statusColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    desc: 'Multi-stage validation: MIME type sniffing, extension checking, antivirus scanning, and instructor rubric grading.',
    link: '/courses',
    icon: FileCheck2,
  },
  {
    name: 'HMAC-SHA256 Certificates',
    status: 'Live',
    statusColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    desc: 'Cryptographically signed diplomas with public zero-friction verification and tamper-evident revocation tracking.',
    link: '/verify',
    icon: Award,
  },
  {
    name: 'At-Risk Cohort Analytics',
    status: 'Live',
    statusColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    desc: 'Automated, explainable detection of struggling students based on pacing, failed attempts, and low scores.',
    link: '/hod',
    icon: BarChart3,
  },
  {
    name: 'Role-Scoped AI Copilot',
    status: 'Live',
    statusColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    desc: 'Academic study assistant grounded strictly in verified enrolled course materials with zero hallucinated syllabus.',
    link: '/courses',
    icon: Users,
  },
];

const PLATFORM_INVARIANTS = [
  {
    name: 'Server-Authoritative Evaluation',
    desc: 'Timed assessments, attempt limits, and passing criteria are calculated and locked server-side.',
  },
  {
    name: 'Row-Level Concurrency & Locking',
    desc: 'PostgreSQL row locks (with_for_update) prevent race conditions on attempts, enrollments, and submissions.',
  },
  {
    name: 'Distributed Redis Rate Limiting',
    desc: 'Sliding-window limiter with fail-closed semantics protects endpoints against automated abuse.',
  },
  {
    name: 'Role-Based Access Control (RBAC)',
    desc: 'Strict object-level authorization across Learner, Staff, HOD, and Admin workspaces.',
  },
  {
    name: 'Comprehensive Audit Logging',
    desc: 'Security events, submissions, grading actions, and role changes are recorded in an immutable ledger.',
  },
  {
    name: 'WCAG 2.1 AA Accessibility',
    desc: 'Semantic HTML, high-contrast dark and light modes, keyboard navigation, and screen reader compliance.',
  },
];

export const ProEduvateHubSection: React.FC = () => {
  return (
    <section id="platform-capabilities" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200 dark:border-white/10">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <span className="text-label font-mono uppercase tracking-widest text-[#0082fb] dark:text-[#3aa0ff] bg-[#0082fb]/10 px-3 py-1 rounded-full border border-[#0082fb]/20">
          Platform Architecture · Learnflow LMS
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight">
          One system. Verified learning.
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-[#8a94a6] leading-relaxed">
          Learnflow combines sequential curricula, timed assessments with attempt limits and audit logs, role-scoped AI tutoring, and cryptographic credentials into a unified academic platform.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Branch 1: Academic Capabilities */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0082fb]/20 text-[#0082fb] dark:text-[#3aa0ff] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-[#f2f5f9]">Academic Modules</h3>
            </div>
            <span className="text-label font-mono text-slate-500 dark:text-[#8a94a6]">6 Verified Capabilities</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACADEMIC_CAPABILITIES.map((cap, idx) => {
              const CapIcon = cap.icon;
              return (
                <Link
                  key={idx}
                  to={cap.link}
                  className="p-4 rounded-xl bg-white dark:bg-[#06080c] border border-slate-200 dark:border-white/5 hover:border-[#0082fb]/40 transition-all duration-200 block group shadow-sm dark:shadow-none"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <CapIcon className="w-4 h-4 text-[#0082fb] dark:text-[#3aa0ff]" />
                      <span className="text-sm font-bold text-slate-900 dark:text-[#f2f5f9] group-hover:text-[#0082fb] dark:group-hover:text-[#3aa0ff] transition-colors">
                        {cap.name}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#8a94a6] leading-relaxed line-clamp-2">{cap.desc}</p>
                  <div className="mt-3 flex items-center text-label font-mono text-[#0082fb] dark:text-[#3aa0ff] space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View capability</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Branch 2: Security & Architecture Invariants */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-[#f2f5f9]">Security Invariants</h3>
            </div>
            <span className="text-label font-mono text-slate-500 dark:text-[#8a94a6]">Server-Enforced Standards</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLATFORM_INVARIANTS.map((inv, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white dark:bg-[#06080c] border border-slate-200 dark:border-white/5 hover:border-emerald-500/40 transition-all duration-200 shadow-sm dark:shadow-none"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight">{inv.name}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-[#8a94a6] leading-relaxed line-clamp-2">{inv.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-xl bg-slate-100 dark:bg-[#0b0f16] border border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-[#f2f5f9] block">Verify an Issued Credential</span>
              <span className="text-label text-slate-600 dark:text-[#8a94a6]">Instant public verification using HMAC-SHA256 signature tokens.</span>
            </div>
            <Link
              to="/verify"
              className="px-4 py-2 rounded-lg bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors glow-blue"
            >
              <span>Verify Credential</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

