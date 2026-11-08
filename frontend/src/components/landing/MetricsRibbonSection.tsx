import React from 'react';
import { BookOpen, Users, Award, ShieldCheck } from 'lucide-react';

const STATS = [
  {
    num: '01',
    metric: '24+ Curricula',
    label: 'Projects & Curricula Built',
    desc: 'Structured system design, concurrency, cloud-native & database internals.',
    icon: BookOpen,
  },
  {
    num: '02',
    metric: '12+ Campuses',
    label: 'Institutions Served',
    desc: 'Premier universities implementing tamper-proof academic proctoring.',
    icon: Users,
  },
  {
    num: '03',
    metric: '8,400+ Learners',
    label: 'Active Engineers',
    desc: 'Mastering computing disciplines through live sequential assessment.',
    icon: Award,
  },
  {
    num: '04',
    metric: '3,100+ Diplomas',
    label: 'HMAC-SHA256 Verified',
    desc: 'Tamper-proof credentials verified against the institutional registry.',
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
              className="p-6 rounded-xl bg-white dark:bg-[#06080c] border border-slate-200 dark:border-white/5 hover:border-[#0082fb]/50 dark:hover:border-[#0082fb]/30 transition-all duration-300 relative group overflow-hidden shadow-xs"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-label font-mono font-bold text-[#0082fb] bg-[#0082fb]/10 px-2 py-0.5 rounded border border-[#0082fb]/20">
                  {s.num}
                </span>
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-[#0082fb] dark:text-[#8a94a6] dark:group-hover:text-[#3aa0ff] transition-colors" />
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

