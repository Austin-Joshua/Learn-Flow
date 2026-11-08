import React from 'react';
import { ExternalLink, Layers, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

const PRODUCTS = [
  {
    name: 'Learnflow',
    status: 'Live Flagship',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    desc: 'AI-native academic LMS featuring sequential module unlocks, anti-cheat assessments, and HMAC diplomas.',
    link: '#',
  },
  {
    name: 'HackZen',
    status: 'Beta',
    statusColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    desc: 'Full-lifecycle hackathon platform with real-time judging rubrics and team code sync.',
    link: 'https://www.proeduvate.in/',
  },
  {
    name: 'TestSync',
    status: 'Live',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    desc: 'Automated test suite orchestration with containerized grading runners.',
    link: 'https://www.proeduvate.in/',
  },
  {
    name: 'ProIntern',
    status: 'Beta',
    statusColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    desc: 'Verified university-to-industry engineering internship pipeline.',
    link: 'https://www.proeduvate.in/',
  },
  {
    name: 'MinAnalyzer',
    status: 'Beta',
    statusColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    desc: 'Static AST code complexity and cyclomatic vulnerability scanner.',
    link: 'https://www.proeduvate.in/',
  },
  {
    name: 'CodoAI',
    status: 'Live',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    desc: 'Context-aware AI tutor engine powering verified student comprehension.',
    link: 'https://www.proeduvate.in/',
  },
];

const SERVICES = [
  {
    name: 'Custom EdTech Platform Development',
    desc: 'End-to-end learning management architectures designed for academic institutions.',
  },
  {
    name: 'AI/ML Solution Development',
    desc: 'Fine-tuned RAG pipelines, semantic vector search, and agentic workflows.',
  },
  {
    name: 'Enterprise Software Engineering',
    desc: 'High-concurrency distributed platforms with zero-trust security postures.',
  },
  {
    name: 'UI/UX & Product Design',
    desc: 'Deliberate typography, WCAG 2.1 AA accessibility, and bespoke visual craft.',
  },
  {
    name: 'Cloud & DevOps Infrastructure',
    desc: 'Dockerized microservices, Kubernetes orchestration, and sliding-window rate limiters.',
  },
  {
    name: 'Data Engineering & Analytics',
    desc: 'Real-time student mastery metrics, cohort reporting, and institutional data pipelines.',
  },
];

export const ProEduvateHubSection: React.FC = () => {
  return (
    <section id="proeduvate-hub" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200 dark:border-white/10">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <span className="text-label font-mono uppercase tracking-widest text-[#8457f5] bg-[#8457f5]/10 px-3 py-1 rounded-full border border-[#8457f5]/20">
          Products &amp; Services · ProEduvate Hub
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight">
          One hub. Two branches.
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-[#8a94a6] leading-relaxed">
          Everything we run in Learnflow and everything we build for clients comes out of the same team and the same standard of craft.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Branch 1: Products We Run */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0082fb]/20 text-[#0082fb] dark:text-[#3aa0ff] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-[#f2f5f9]">Products We Run</h3>
            </div>
            <span className="text-label font-mono text-slate-500 dark:text-[#8a94a6]">7 AI-Native Products</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRODUCTS.map((prod, idx) => (
              <a
                key={idx}
                href={prod.link}
                target={prod.link.startsWith('http') ? '_blank' : '_self'}
                rel="noreferrer"
                className="p-4 rounded-xl bg-white dark:bg-[#06080c] border border-slate-200 dark:border-white/5 hover:border-[#0082fb]/40 transition-all duration-200 block group shadow-sm dark:shadow-none"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-[#f2f5f9] group-hover:text-[#0082fb] dark:group-hover:text-[#3aa0ff] transition-colors">
                    {prod.name}
                  </span>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${prod.statusColor}`}>
                    {prod.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-[#8a94a6] leading-relaxed line-clamp-2">{prod.desc}</p>
                <div className="mt-3 flex items-center text-label font-mono text-[#0082fb] dark:text-[#3aa0ff] space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Explore product</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Branch 2: Services We Deliver */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#8457f5]/20 text-[#8457f5] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-[#f2f5f9]">Services We Deliver</h3>
            </div>
            <span className="text-label font-mono text-slate-500 dark:text-[#8a94a6]">Enterprise Client Practice</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SERVICES.map((serv, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white dark:bg-[#06080c] border border-slate-200 dark:border-white/5 hover:border-[#8457f5]/40 transition-all duration-200 shadow-sm dark:shadow-none"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#8457f5] shrink-0" />
                  <span className="text-sm font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight">{serv.name}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-[#8a94a6] leading-relaxed line-clamp-2">{serv.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-xl bg-slate-100 dark:bg-[#0b0f16] border border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-[#f2f5f9] block">Partner with ProEduvate Engineering</span>
              <span className="text-label text-slate-600 dark:text-[#8a94a6]">Need the same craft applied to your institution or software?</span>
            </div>
            <a
              href="https://www.proeduvate.in/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg bg-[#8457f5] hover:bg-[#7042e0] text-white text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors glow-purple"
            >
              <span>Consultation</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

