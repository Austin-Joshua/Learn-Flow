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
    metric: '4 Institutional Roles',
    label: 'Backend-Enforced Access',
    desc: 'Role-scoped permissions for Learner, Instructor, HOD, and Administrator personas.',
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
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200 dark:border-white/10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-xl bg-white dark:bg-[#06080c] border border-slate-200 dark:border-white/5 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition-all duration-300 relative group overflow-hidden shadow-xs"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-label font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                  {s.num}
                </span>
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 dark:text-[#8a94a6] dark:group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight">{s.metric}</div>
              <div className="text-xs font-semibold text-slate-700 dark:text-[#8a94a6] mt-1">{s.label}</div>
              <p className="text-label text-slate-500 dark:text-[#8a94a6]/80 mt-2 leading-relaxed">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
