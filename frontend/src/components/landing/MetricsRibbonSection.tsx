import React from 'react';
import { BookOpen, Users, Clock, ShieldCheck } from 'lucide-react';

const STATS = [
  {
    num: '01',
    metric: '4 Question Types',
    label: 'Autograded Assessments',
    desc: 'Single choice, multiple choice, true/false, and short answer with autograding.',
    icon: BookOpen,
  },
  {
    num: '02',
    metric: '3 Institutional Roles',
    label: 'Backend-Enforced Access',
    desc: 'Role-scoped permissions for Learner, Instructor, and Administrator personas.',
    icon: Users,
  },
  {
    num: '03',
    metric: 'Timed Assessments',
    label: 'Server-Enforced Controls',
    desc: 'Attempt limits, server-side timers and audit logs.',
    icon: Clock,
  },
  {
    num: '04',
    metric: 'Signed Credentials',
    label: 'Public Verification',
    desc: 'Signed credentials with public verification against the central registry.',
    icon: ShieldCheck,
  },
];

export const MetricsRibbonSection: React.FC = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200 dark:border-[#E4F455]/20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="card-uplift p-6 rounded-xl bg-white dark:bg-[#071914] border border-slate-200 dark:border-[#E4F455]/20 hover:border-[#163E44]/40 dark:hover:border-[#E4F455]/60 transition-all duration-300 relative group overflow-hidden shadow-xs"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-label font-mono font-bold text-[#163E44] dark:text-[#E4F455] bg-[#163E44]/10 dark:bg-[#E4F455]/15 px-2 py-0.5 rounded border border-[#163E44]/20 dark:border-[#E4F455]/30">
                  {s.num}
                </span>
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-[#163E44] dark:text-[#a0bdb6] dark:group-hover:text-[#E4F455] transition-colors" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight">{s.metric}</div>
              <div className="text-xs font-semibold text-slate-700 dark:text-[#a0bdb6] mt-1">{s.label}</div>
              <p className="text-label text-slate-500 dark:text-[#a0bdb6]/80 mt-2 leading-relaxed">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
