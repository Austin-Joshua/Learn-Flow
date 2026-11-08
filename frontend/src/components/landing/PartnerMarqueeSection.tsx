import React from 'react';
import { Building2, ShieldCheck, Award, GraduationCap, University } from 'lucide-react';

const PARTNERS = [
  { name: 'Agni College of Technology', tag: 'Academic Partner', icon: GraduationCap },
  { name: 'Rajalakshmi Institute of Technology', tag: 'Digital Twin Partner', icon: University },
  { name: 'Vel Tech Rangarajan Dr. Sagunthala R&D Institute', tag: 'Accreditation Partner', icon: Building2 },
  { name: 'Learnflow Academic Consortium', tag: 'Verifiable Standards', icon: ShieldCheck },
  { name: 'National Board of Accreditation Standards', tag: 'Quality Framework', icon: Award },
];

export const PartnerMarqueeSection: React.FC = () => {
  return (
    <div className="relative border-y border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-[#06080c] py-6 overflow-hidden select-none transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 mb-3 text-center">
        <span className="text-label font-mono uppercase tracking-widest text-slate-500 dark:text-[#8a94a6]">
          Trusted by Premier Academic Institutions &amp; Enterprise Partners
        </span>
      </div>

      {/* Marquee Track */}
      <div className="relative flex overflow-x-hidden">
        <div className="animate-marquee flex items-center space-x-8 shrink-0 py-2">
          {PARTNERS.concat(PARTNERS).map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="flex items-center space-x-3 px-5 py-2.5 rounded-lg bg-white dark:bg-[#0b0f16] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 transition-colors whitespace-nowrap shadow-xs"
              >
                <div className="w-8 h-8 rounded-md bg-[#0082fb]/10 flex items-center justify-center text-[#0082fb] dark:text-[#3aa0ff]">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight">{p.name}</span>
                  <span className="text-meta font-mono text-slate-500 dark:text-[#8a94a6]">{p.tag}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="animate-marquee flex items-center space-x-8 shrink-0 py-2" aria-hidden="true">
          {PARTNERS.concat(PARTNERS).map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="flex items-center space-x-3 px-5 py-2.5 rounded-lg bg-white dark:bg-[#0b0f16] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 transition-colors whitespace-nowrap shadow-xs"
              >
                <div className="w-8 h-8 rounded-md bg-[#0082fb]/10 flex items-center justify-center text-[#0082fb] dark:text-[#3aa0ff]">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight">{p.name}</span>
                  <span className="text-meta font-mono text-slate-500 dark:text-[#8a94a6]">{p.tag}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

