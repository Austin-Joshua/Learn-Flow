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
    name: 'EdTech & Adaptive Learning',
    icon: GraduationCap,
    badge: 'Core Curriculum Engine',
    tagline: 'Sequential module unlocking with strict prerequisite validation.',
    description: 'Students cannot jump ahead or bypass core fundamentals. The curriculum engine strictly enforces prerequisites on the backend, ensuring verifiable progression from foundational syntax to distributed architectures.',
    invariants: ['Database row-level concurrency locking', 'Server-authoritative progression invariant', 'Zero client-side state spoofing'],
    metrics: [
      { label: 'Enforcement', value: 'Server-Side' },
      { label: 'Progression', value: 'Sequential' },
    ],
  },
  {
    id: 'ai-copilot',
    num: '02',
    name: 'AI Study Copilot & RAG',
    icon: Bot,
    badge: 'Scoped Intelligence',
    tagline: 'Role-scoped retrieval without academic integrity violations.',
    description: 'Powered by Gemini with Redis semantic caching. The copilot provides pedagogical guidance, architectural diagrams, and hint progressions without outputting graded assignment solutions.',
    invariants: ['Strict role & department context boundary', 'Canary token prompt-injection protection', 'Authoritative backend authorization'],
    metrics: [
      { label: 'Caching Tier', value: 'Redis-Partitioned' },
      { label: 'Context Boundary', value: 'Role-Scoped' },
    ],
  },
  {
    id: 'timed-assessments',
    num: '03',
    name: 'Timed Assessments Arena',
    icon: Clock,
    badge: 'Timed Arena',
    tagline: 'Server-side timers, attempt limits, and audit logs.',
    description: 'Assessments execute in an isolated environment. Timer countdowns and attempt limits are authoritative on the PostgreSQL server, neutralizing browser clock manipulation and inspect-element hacks.',
    invariants: ['Server-authoritative expiry trigger', 'Fullscreen & tab-blur event logging', 'Atomic single-attempt transaction'],
    metrics: [
      { label: 'Question Formats', value: '4 Types' },
      { label: 'Countdown Timer', value: 'Server-Authoritative' },
    ],
  },
  {
    id: 'mountain-trail',
    num: '04',
    name: 'Mountain Trail Journey',
    icon: Compass,
    badge: 'Mastery Visualizer',
    tagline: 'Interactive SVG terrain mapping student mastery from base camp to summit.',
    description: 'Gamified pedagogical visualization that represents courses as physical terrain. Each completed module ascends the peak, culminating in the verifiable certificate summit.',
    invariants: ['Accessible keyboard-navigable list ledger', 'WCAG 2.1 AA high-contrast markers', 'Zero layout shifts across viewports'],
    metrics: [
      { label: 'Visual Engine', value: 'Interactive SVG' },
      { label: 'Accessibility', value: 'WCAG 2.1 AA' },
    ],
  },
  {
    id: 'cryptographic-verify',
    num: '05',
    name: 'Cryptographic Credentials',
    icon: ShieldCheck,
    badge: 'HMAC-SHA256 Registry',
    tagline: 'Signed credentials with public verification against the central registry.',
    description: 'Every certificate carries an HMAC-SHA256 signature generated with an institutional server key. Public employers and evaluators can verify certificates directly against the central registry without account creation.',
    invariants: ['Immutable cryptographic signature', 'Revocation ledger with audit reason', 'Public zero-friction verification route'],
    metrics: [
      { label: 'Algorithm', value: 'HMAC-SHA256' },
      { label: 'Verification Path', value: 'Public Registry' },
    ],
  },
  {
    id: 'quarantine-pipeline',
    num: '06',
    name: 'Assignment Quarantine Pipeline',
    icon: FileCheck,
    badge: 'Security Sandbox',
    tagline: 'Quarantine storage bucket for student code and submitted archives.',
    description: 'Student project submissions are stored in an isolated quarantine storage bucket with MIME and magic byte verification before promotion to accessible storage.',
    invariants: ['Isolated quarantine storage bucket', 'Strict file size and extension controls', 'Role-scoped instructor access'],
    metrics: [
      { label: 'Storage Mode', value: 'Quarantine Bucket' },
      { label: 'Validation', value: 'Magic Byte & MIME' },
    ],
  },
  {
    id: 'admin-governance',
    num: '07',
    name: 'Academic Administration & Governance',
    icon: Building,
    badge: 'Institutional Governance',
    tagline: 'Platform-scoped pass rates, integrity audits, and authoritative role administration.',
    description: 'Platform administrators oversee multi-department metrics, curriculum standards, cryptographic credential audits, and role governance across the institution.',
    invariants: ['Strict single-admin access policy', 'Append-only audit trail', 'Authoritative role governance'],
    metrics: [
      { label: 'Institutional Coverage', value: 'Platform-Wide' },
      { label: 'Audit Log Storage', value: 'Append-Only' },
    ],
  },
  {
    id: 'cloud-sandbox',
    num: '08',
    name: 'Cloud-Native Architecture',
    icon: Server,
    badge: 'Service Architecture',
    tagline: 'PostgreSQL, Redis distributed caching, and Dockerized orchestration.',
    description: 'Engineered for resilience. Learnflow leverages multi-stage lightweight Alpine containers, strict non-root permissions, and distributed sliding-window rate limiters.',
    invariants: ['Sliding-window Redis rate limits', 'Read-only container root filesystems', 'Zero hardcoded secrets policy'],
    metrics: [
      { label: 'Orchestration', value: 'Docker Compose' },
      { label: 'Access Control', value: '4 Roles' },
    ],
  },
];

export const DisciplinesSection: React.FC = () => {
  const [activeSector, setActiveSector] = useState<Sector>(SECTORS[0]);

  const ActiveIcon = activeSector.icon;

  return (
    <section id="disciplines" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200 dark:border-[#E4F455]/20">
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <span className="text-label font-mono uppercase tracking-widest text-[#163E44] dark:text-[#E4F455] bg-[#163E44]/10 dark:bg-[#E4F455]/15 px-3 py-1 rounded-full border border-[#163E44]/20 dark:border-[#E4F455]/30">
          Eight Core Disciplines · Architecture Standard
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight">
          Eight sectors. One standard of craft.
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-[#a0bdb6] leading-relaxed">
          Learnflow implements eight core engineering disciplines, establishing high standards of reliability and security for academic and institutional learning.
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
                    ? 'bg-white dark:bg-[#071914] border-[#163E44] dark:border-[#E4F455] text-slate-900 dark:text-[#f2f5f9] shadow-md ring-1 ring-[#163E44]/30 dark:ring-[#E4F455]/30'
                    : 'bg-slate-50 dark:bg-[#04100C] border-slate-200 dark:border-[#E4F455]/15 text-slate-600 dark:text-[#a0bdb6] hover:bg-white dark:hover:bg-[#071914] hover:text-slate-900 dark:hover:text-[#E4F455] hover:border-slate-300 dark:hover:border-[#E4F455]/40'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <span
                    className={`text-label font-mono font-bold ${
                      isActive ? 'text-[#163E44] dark:text-[#E4F455]' : 'text-slate-400 dark:text-[#a0bdb6] group-hover:text-slate-900 dark:group-hover:text-[#E4F455]'
                    }`}
                  >
                    {sector.num}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isActive ? 'bg-[#163E44]/20 text-[#163E44] dark:bg-[#E4F455]/20 dark:text-[#E4F455]' : 'bg-slate-200/60 dark:bg-white/5 text-slate-600 dark:text-[#a0bdb6] group-hover:text-slate-900 dark:group-hover:text-[#E4F455]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-tight">{sector.name}</span>
                </div>
                <ArrowRight
                  className={`w-4 h-4 transition-transform ${
                    isActive ? 'text-[#163E44] dark:text-[#E4F455] translate-x-1' : 'text-transparent group-hover:text-slate-400 dark:group-hover:text-[#a0bdb6]'
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
              className="card-uplift p-8 rounded-2xl bg-white dark:bg-[#071914] border border-slate-200 dark:border-[#E4F455]/25 relative overflow-hidden space-y-6 shadow-2xl"
            >
              {/* Top Accent Pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#163E44]/15 border border-[#163E44]/30 flex items-center justify-center text-[#163E44] dark:text-[#E4F455]">
                    <ActiveIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-label font-mono uppercase tracking-wider text-[#163E44] dark:text-[#E4F455] font-semibold">
                      {activeSector.badge}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight">{activeSector.name}</h3>
                  </div>
                </div>
                <span className="text-xl font-mono font-bold text-slate-300 dark:text-white/20">{activeSector.num}</span>
              </div>

              {/* Tagline */}
              <p className="text-sm font-semibold text-[#163E44] dark:text-[#E4F455] leading-snug">{activeSector.tagline}</p>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#a0bdb6] leading-relaxed font-normal">
                {activeSector.description}
              </p>

              {/* Invariants List */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#E4F455]/15">
                <span className="text-label font-mono uppercase tracking-wider text-slate-500 dark:text-[#a0bdb6] block">
                  Engineering Invariants
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {activeSector.invariants.map((inv, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#04100C] border border-slate-200 dark:border-[#E4F455]/15 flex items-center space-x-2 text-label font-mono text-slate-800 dark:text-[#f2f5f9]"
                    >
                      <Lock className="w-3 h-3 text-[#163E44] dark:text-[#E4F455] shrink-0" />
                      <span className="truncate">{inv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Benchmark Metrics */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-[#E4F455]/15">
                {activeSector.metrics.map((m, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-[#04100C] border border-slate-200 dark:border-[#E4F455]/15">
                    <span className="text-label font-mono text-slate-500 dark:text-[#a0bdb6] block">{m.label}</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">{m.value}</span>
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
