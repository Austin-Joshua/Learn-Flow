import React from 'react';
import { Lightbulb, Gem, TrendingUp, ShieldCheck, Palette, Zap } from 'lucide-react';

const STEPS = [
  {
    step: 'Step 01',
    title: 'Innovation',
    desc: "We build what's next, not what's safe.",
    detail: 'Pushing beyond passive videos to active, timed assessments with attempt limits and audit logs.',
    icon: Lightbulb,
    color: 'text-amber-400',
  },
  {
    step: 'Step 02',
    title: 'Quality',
    desc: 'Craft over shortcuts, always.',
    detail: 'Strict row locking, zero-trust container sandboxes, and immutable HMAC signatures.',
    icon: Gem,
    color: 'text-[#3aa0ff]',
  },
  {
    step: 'Step 03',
    title: 'Impact',
    desc: 'Outcomes over vanity metrics.',
    detail: 'Verifiable engineering competency rather than inflated participation certificates.',
    icon: TrendingUp,
    color: 'text-emerald-400',
  },
  {
    step: 'Step 04',
    title: 'Integrity',
    desc: "Honest about what AI can and can't do.",
    detail: 'AI assists and guides; server-side determinism grades and verifies.',
    icon: ShieldCheck,
    color: 'text-[#8457f5]',
  },
  {
    step: 'Step 05',
    title: 'Craft',
    desc: 'The details are the product.',
    detail: 'Every keystroke, timer tick, and database commit is deliberate and measured.',
    icon: Palette,
    color: 'text-pink-400',
  },
  {
    step: 'Step 06',
    title: 'Speed',
    desc: 'Momentum is a feature.',
    detail: 'Sub-150ms API endpoints, instant search, and real-time student telemetry.',
    icon: Zap,
    color: 'text-yellow-400',
  },
];

export const TrajectorySection: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200 dark:border-white/10">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <span className="text-label font-mono uppercase tracking-widest text-[#0082fb] dark:text-[#3aa0ff] bg-[#0082fb]/10 px-3 py-1 rounded-full border border-[#0082fb]/20">
          Core Principles · Trajectory
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight">
          How we get better.
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-[#8a94a6] leading-relaxed">
          Not a list of features. This is the engineering philosophy—ensuring academic rigor, determinism, and software that matters.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white dark:bg-[#06080c] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 relative group overflow-hidden shadow-sm dark:shadow-none"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-label font-mono font-bold text-slate-500 dark:text-[#8a94a6]">{s.step}</span>
                <div className={`w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight mb-1">{s.title}</h3>
              <div className="text-xs font-semibold text-[#0082fb] dark:text-[#3aa0ff] mb-2">{s.desc}</div>
              <p className="text-xs text-slate-600 dark:text-[#8a94a6] leading-relaxed">{s.detail}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

