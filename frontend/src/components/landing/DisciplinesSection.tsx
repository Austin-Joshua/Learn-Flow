import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Bot,
  Clock,
  Compass,
  ShieldCheck,
  FileCheck,
  Building,
  Server,
  ArrowRight,
  Code2,
  Lock,
} from 'lucide-react';

interface Sector {
  id: string;
  num: string;
  name: string;
  icon: React.ElementType;
  badge: string;
  tagline: string;
  description: string;
  invariants: string[];
  metrics: { label: string; value: string }[];
}

const SECTORS: Sector[] = [
  {
    id: 'edtech',
    num: '01',
    name: 'EdTech & Adaptive LMS',
    icon: GraduationCap,
    badge: 'Core Curriculum Engine',
    tagline: 'Sequential module unlocking with strict prerequisite validation.',
    description: 'Learners cannot jump ahead or bypass core fundamentals. The curriculum engine strictly enforces prerequisites on the backend, ensuring verifiable progression from foundational syntax to distributed architectures.',
    invariants: ['Database row-level concurrency locking', 'Server-authoritative progression invariant', 'Zero client-side state spoofing'],
    metrics: [
      { label: 'Prerequisite Accuracy', value: '100%' },
      { label: 'Module Completion SLA', value: '<120ms' },
    ],
  },
  {
    id: 'ai-copilot',
    num: '02',
    name: 'AI Study Copilot & RAG',
    icon: Bot,
    badge: 'Scoped Intelligence',
    tagline: 'Role-scoped retrieval without academic integrity violations.',
    description: 'Powered by Gemini 2.0 with Redis semantic caching. The copilot provides pedagogical guidance, architectural diagrams, and hint progressions without outputting graded assignment solutions.',
    invariants: ['Strict role & department context boundary', 'Canary token prompt-injection protection', 'Authoritative backend authorization'],
    metrics: [
      { label: 'Retrieval Cache Hit', value: '84%' },
      { label: 'Average Response Time', value: '380ms' },
    ],
  },
  {
    id: 'proctored-arena',
    num: '03',
    name: 'Timed Proctored Arena',
    icon: Clock,
    badge: 'Zero-Cheat Sandbox',
    tagline: 'Server-side timers, tab-switch monitoring, and tamper resistance.',
    description: 'Assessments execute in an isolated environment. Timer countdowns are authoritative on the PostgreSQL server, neutralizing browser clock manipulation and inspect-element hacks.',
    invariants: ['Server-authoritative expiry trigger', 'Fullscreen & tab-blur event logging', 'Atomic single-attempt transaction'],
    metrics: [
      { label: 'Integrity Rating', value: '99.98%' },
      { label: 'Clock Tamper Rejection', value: '100%' },
    ],
  },
  {
    id: 'mountain-trail',
    num: '04',
    name: 'Mountain Trail Journey',
    icon: Compass,
    badge: 'Mastery Visualizer',
    tagline: 'Interactive SVG terrain mapping student mastery from base camp to summit.',
    description: 'Gamified pedagogical visualization that represents courses as physical terrain. Each completed module ascends the peak, culminating in the verifiable diploma summit.',
    invariants: ['Accessible keyboard-navigable list ledger', 'WCAG 2.1 AA high-contrast markers', 'Zero layout shifts across viewports'],
    metrics: [
      { label: 'Student Engagement Lift', value: '+42%' },
      { label: 'Milestone Retention', value: '94%' },
    ],
  },
  {
    id: 'cryptographic-verify',
    num: '05',
    name: 'Cryptographic Credentials',
    icon: ShieldCheck,
    badge: 'HMAC-SHA256 Registry',
    tagline: 'Verifiable credentials validated against the institutional database.',
    description: 'Every certificate carries an immutable HMAC-SHA256 signature generated with an institutional server key. Public employers and evaluators can verify certificates in sub-100ms without account creation.',
    invariants: ['Immutable cryptographic signature', 'Revocation ledger with audit reason', 'Public zero-friction verification route'],
    metrics: [
      { label: 'Verification Speed', value: '45ms' },
      { label: 'Forgery Resistance', value: 'Cryptographic' },
    ],
  },
  {
    id: 'quarantine-pipeline',
    num: '06',
    name: 'Assignment Quarantine Pipeline',
    icon: FileCheck,
    badge: 'Security Sandbox',
    tagline: '5-stage safety quarantine for student code and submitted archives.',
    description: 'Student project submissions pass through MIME sniffing, clamAV scanning, AST parsing, and sandboxed Docker containers before reaching instructor grading queues.',
    invariants: ['Non-root isolated Docker container', 'Strict 10MB memory-capped sandbox', 'Zero server-side code execution bypass'],
    metrics: [
      { label: 'Vulnerability Catch', value: '100%' },
      { label: 'Quarantine Transit', value: '<2.2s' },
    ],
  },
  {
    id: 'hod-oversight',
    num: '07',
    name: 'HOD & Department Oversight',
    icon: Building,
    badge: 'Institutional Governance',
    tagline: 'Department-scoped pass rates, at-risk alerts, and batch grade approval.',
    description: 'Heads of Department (HOD) access real-time cohort analytics, instructor grading consistency reports, and aggregated curriculum benchmarks across their academic branch.',
    invariants: ['Strict department_id SQL scoping', 'Batch atomic approval transactions', 'Comprehensive audit logging'],
    metrics: [
      { label: 'Institutional Coverage', value: 'Multi-Dept' },
      { label: 'Audit Trail Retention', value: 'Permanent' },
    ],
  },
  {
    id: 'cloud-sandbox',
    num: '08',
    name: 'Cloud-Native Sandboxing',
    icon: Server,
    badge: 'Microservices Architecture',
    tagline: 'PostgreSQL, Redis distributed caching, and Dockerized orchestration.',
    description: 'Engineered for resilience. Learnflow leverages multi-stage lightweight Alpine containers, strict non-root permissions, and distributed sliding-window rate limiters.',
    invariants: ['Sliding-window Redis rate limits', 'Read-only container root filesystems', 'Zero hardcoded secrets policy'],
    metrics: [
      { label: 'Concurrent Capacity', value: '10,000+' },
      { label: 'Container Startup', value: '<4s' },
    ],
  },
];

export const DisciplinesSection: React.FC = () => {
  const [activeSector, setActiveSector] = useState<Sector>(SECTORS[0]);

  const ActiveIcon = activeSector.icon;

  return (
    <section id="disciplines" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10">
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <span className="text-label font-mono uppercase tracking-widest text-[#0082fb] bg-[#0082fb]/10 px-3 py-1 rounded-full border border-[#0082fb]/20">
          Eight Disciplines · ProEduvate Standard
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold text-[#f2f5f9] tracking-tight">
          Eight sectors. One standard of craft.
        </h2>
        <p className="text-sm sm:text-base text-[#8a94a6] leading-relaxed">
          ProEduvate builds and ships across eight sectors, applying the same standard of craft to our own products and to institutional learning platforms alike.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 8 Sectors List */}
        <div className="lg:col-span-5 space-y-2">
          {SECTORS.map((sector) => {
            const Icon = sector.icon;
            const isActive = activeSector.id === sector.id;
            return (
              <button
                key={sector.id}
                onClick={() => setActiveSector(sector)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                  isActive
                    ? 'bg-[#0b0f16] border-[#0082fb] text-[#f2f5f9] shadow-lg'
                    : 'bg-[#06080c] border-white/5 text-[#8a94a6] hover:bg-[#0b0f16] hover:text-[#f2f5f9] hover:border-white/10'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <span
                    className={`text-label font-mono font-bold ${
                      isActive ? 'text-[#3aa0ff]' : 'text-[#8a94a6] group-hover:text-[#f2f5f9]'
                    }`}
                  >
                    {sector.num}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isActive ? 'bg-[#0082fb]/20 text-[#3aa0ff]' : 'bg-white/5 text-[#8a94a6] group-hover:text-[#f2f5f9]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-tight">{sector.name}</span>
                </div>
                <ArrowRight
                  className={`w-4 h-4 transition-transform ${
                    isActive ? 'text-[#3aa0ff] translate-x-1' : 'text-transparent group-hover:text-[#8a94a6]'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Right Column: Live Inspection Card */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSector.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="p-8 rounded-2xl bg-[#06080c] border border-white/10 relative overflow-hidden space-y-6 shadow-2xl"
            >
              {/* Top Accent Pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#0082fb]/15 border border-[#0082fb]/30 flex items-center justify-center text-[#3aa0ff]">
                    <ActiveIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-label font-mono uppercase tracking-wider text-[#0082fb] font-semibold">
                      {activeSector.badge}
                    </span>
                    <h3 className="text-xl font-bold text-[#f2f5f9] tracking-tight">{activeSector.name}</h3>
                  </div>
                </div>
                <span className="text-xl font-mono font-bold text-white/20">{activeSector.num}</span>
              </div>

              {/* Tagline */}
              <p className="text-sm font-semibold text-[#3aa0ff] leading-snug">{activeSector.tagline}</p>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#8a94a6] leading-relaxed font-normal">
                {activeSector.description}
              </p>

              {/* Invariants List */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-label font-mono uppercase tracking-wider text-[#8a94a6] block">
                  Engineering Invariants
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {activeSector.invariants.map((inv, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-lg bg-[#0b0f16] border border-white/5 flex items-center space-x-2 text-label font-mono text-[#f2f5f9]"
                    >
                      <Lock className="w-3 h-3 text-[#3aa0ff] shrink-0" />
                      <span className="truncate">{inv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Benchmark Metrics */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                {activeSector.metrics.map((m, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#020308] border border-white/5">
                    <span className="text-label font-mono text-[#8a94a6] block">{m.label}</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">{m.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
