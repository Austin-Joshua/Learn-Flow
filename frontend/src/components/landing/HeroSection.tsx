import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Lock,
  Sparkles,
  Layers,
  PlayCircle,
  Award,
  Clock,
  Check,
  FileCheck2,
  Code2,
  Bot,
  BookOpen,
} from 'lucide-react';
import { ProgressRing } from '../common/ProgressRing';

interface HeroSectionProps {
  onExploreClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick }) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'arena' | 'verify' | 'copilot'>('courses');

  // Interactive Course Progress States (Replicating User Screenshot media_1794124034292_7cc72923.png)
  const [course2Progress, setCourse2Progress] = useState(50);
  const [course3Progress, setCourse3Progress] = useState(0);

  // Interactive Live Arena Test Suite Runner
  const [testStatus, setTestStatus] = useState<('idle' | 'running' | 'passed')>('idle');
  const [activeTestIndex, setActiveTestIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1458); // 24:18 in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 1458));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const runArenaTests = () => {
    setTestStatus('running');
    setActiveTestIndex(1);
    setTimeout(() => setActiveTestIndex(2), 350);
    setTimeout(() => setActiveTestIndex(3), 700);
    setTimeout(() => {
      setActiveTestIndex(4);
      setTestStatus('passed');
    }, 1100);
  };

  // Interactive Public Verification Token State (Replicating User Screenshot media_1794124093746_cf00e67f.png)
  const [verifyToken, setVerifyToken] = useState('LF-8E487C12F0');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<boolean | null>(true);

  const handleSimulateVerify = () => {
    setIsVerifying(true);
    setVerifiedResult(null);
    setTimeout(() => {
      setIsVerifying(false);
      setVerifiedResult(true);
    }, 600);
  };

  // Interactive AI Copilot Streaming Q&A State
  const COPILOT_PRESETS = [
    {
      q: 'Why does composite index (tenant_id, created_at) fail if tenant_id is omitted?',
      a: 'Under the B-Tree leftmost prefix rule, the composite index is ordered hierarchically by tenant_id first, then created_at. Omitting tenant_id prevents binary root seeks, triggering a full heap scan.',
      ref: 'Lesson 1.2 • PostgreSQL B-Tree Index Optimization §2.1',
    },
    {
      q: 'How does Learnflow prevent advisory lock deadlocks under high worker concurrency?',
      a: 'We enforce strictly sorted resource IDs before transaction acquisition, with row-level pg_advisory_xact_lock bounds and fail-closed transaction timeouts at 5,000ms.',
      ref: 'Lesson 3.4 • Concurrency Isolation & Distributed Locking §4.8',
    },
    {
      q: 'Provide a hint for the WAL replay exercise without giving away the answer.',
      a: 'Inspect the LSN sequence in pg_waldump. Notice where checkpoint record divergence occurs between tenant node replicas.',
      ref: 'Lesson 4.1 • Storage Engines & WAL Protocols §1.3',
    },
  ];

  const [copilotPresetIdx, setCopilotPresetIdx] = useState(0);
  const [copilotAnswer, setCopilotAnswer] = useState(COPILOT_PRESETS[0].a);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSelectCopilotPreset = (idx: number) => {
    setCopilotPresetIdx(idx);
    setIsStreaming(true);
    setCopilotAnswer('');
    const fullText = COPILOT_PRESETS[idx].a;
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx += 3;
      if (currentIdx >= fullText.length) {
        setCopilotAnswer(fullText);
        setIsStreaming(false);
        clearInterval(interval);
      } else {
        setCopilotAnswer(fullText.slice(0, currentIdx));
      }
    }, 18);
  };
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Aurora Drift Ambient Glows */}
      <div className="pointer-events-none absolute -top-1/4 -left-1/4 h-[70vh] w-[70vh] rounded-full blur-[130px] bg-[#0082fb]/15 animate-aurora" />
      <div className="pointer-events-none absolute -right-1/4 -bottom-1/4 h-[60vh] w-[60vh] rounded-full blur-[140px] bg-[#8457f5]/15 animate-aurora-slow" />

      {/* Hero Scan Beam */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#3aa0ff]/80 to-transparent animate-hero-scan" />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto space-y-6">
        {/* Floating 3D Isometric Tech Cube Visual */}
        <div className="flex justify-center -mb-2">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center animate-cube-bob select-none">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#0082fb]/25 to-[#8457f5]/25 border border-white/20 backdrop-blur-md transform rotate-12 shadow-lg glow-blue" />
            <div className="relative z-10 w-9 h-9 rounded-xl bg-[#06080c] border border-[#3aa0ff]/50 flex items-center justify-center text-[#3aa0ff] shadow-inner">
              <Layers className="w-4 h-4 animate-pulse" />
            </div>
            {/* Orbiting Tech Dots */}
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#0082fb] animate-ping" />
            <span className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-[#8457f5]" />
          </div>
        </div>

        {/* Bracket Pulse Ecosystem Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#06080c] border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-800 dark:text-[#f2f5f9] shadow-xs"
        >
          <span className="text-[#0082fb] font-bold animate-bracket-pulse">[</span>
          <Sparkles className="w-3.5 h-3.5 text-[#0082fb] dark:text-[#3aa0ff]" />
          <span className="tracking-wide">AI-Powered EdTech LMS · Academic Excellence</span>
          <span className="text-[#0082fb] font-bold animate-bracket-pulse">]</span>
        </motion.div>

        {/* Main Precision Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-[#f2f5f9] leading-[1.1] sm:leading-[1.1]"
        >
          Building the future of{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0082fb] via-[#3aa0ff] to-[#7cc2ff]">
            learning &amp; verified
          </span>{' '}
          engineering technology.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="text-base sm:text-lg text-slate-600 dark:text-[#8a94a6] max-w-2xl mx-auto leading-relaxed font-normal"
        >
          Learnflow is an academic learning platform built as an internship assignment—combining sequential curricula, timed assessments with attempt limits and audit logs, role-scoped AI tutoring, and cryptographic HMAC-SHA256 diplomas into one system of intelligence.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <a
            href="#courses"
            onClick={onExploreClick}
            className="w-full sm:w-auto h-12 px-7 rounded-lg bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs font-semibold transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer glow-blue shadow-md"
          >
            <span>Explore Curricula</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <Link
            to="/login"
            className="w-full sm:w-auto h-12 px-7 rounded-lg bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 dark:bg-[#0b0f16] dark:hover:bg-[#101828] dark:text-[#f2f5f9] dark:border-white/10 dark:hover:border-white/20 text-xs font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-xs"
          >
            <Terminal className="w-4 h-4 text-[#0082fb] dark:text-[#3aa0ff]" />
            <span>Launch Student Portal</span>
          </Link>

          <a
            href="#platform-capabilities"
            className="w-full sm:w-auto h-12 px-6 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 hover:text-slate-900 dark:text-[#8a94a6] dark:hover:text-[#f2f5f9] text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
          >
            <Layers className="w-4 h-4 text-[#0082fb] dark:text-[#3aa0ff]" />
            <span>Capabilities</span>
          </a>
        </motion.div>

        {/* Invariant Signals */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-meta font-mono text-slate-600 dark:text-[#8a94a6]">
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Sequential Module Invariants</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Timed Assessments &amp; Audit Logs</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>HMAC-SHA256 Signed Certificates</span>
          </span>
        </div>

        {/* Interactive Live Showcase Window */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="mt-10 rounded-2xl bg-white dark:bg-[#06080c] border border-slate-200 dark:border-white/10 overflow-hidden text-left shadow-2xl relative"
        >
          {/* Mac-style Window Titlebar with Interactive Navigation Tabs */}
          <div className="bg-slate-100 dark:bg-[#0b0f16] border-b border-slate-200 dark:border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-label font-mono text-slate-500 dark:text-[#8a94a6] hidden sm:inline">
                learnflow://live-showcase/{activeTab}
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 px-2 py-0.5 rounded ml-2">
                Sample data
              </span>
            </div>

            {/* Interactive Showcase Mode Switcher */}
            <div className="flex items-center space-x-1 bg-slate-200/70 dark:bg-[#020308] p-1 rounded-lg border border-slate-300 dark:border-white/10 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('courses')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'courses'
                    ? 'bg-[#0082fb] text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#8a94a6] dark:hover:text-[#f2f5f9]'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Enrolled Courses</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('arena')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'arena'
                    ? 'bg-[#0082fb] text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#8a94a6] dark:hover:text-[#f2f5f9]'
                }`}
              >
                <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                <span>Timed Arena</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('verify')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'verify'
                    ? 'bg-[#0082fb] text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#8a94a6] dark:hover:text-[#f2f5f9]'
                }`}
              >
                <FileCheck2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                <span>Verify Token</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('copilot')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'copilot'
                    ? 'bg-[#0082fb] text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#8a94a6] dark:hover:text-[#f2f5f9]'
                }`}
              >
                <Bot className="w-3 h-3 text-[#0082fb] dark:text-[#7cc2ff]" />
                <span>AI Copilot</span>
              </button>
            </div>
          </div>

          {/* TAB 1: ENROLLED COURSES & REAL PROGRESS RINGS (REPLICATING SCREENSHOT media_1794124034292_7cc72923.png) */}
          {activeTab === 'courses' && (
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight">
                      My Enrolled Courses &bull; Active Academic Session
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#8a94a6] mt-0.5">
                    Live interactive student dashboard replicating verified student portal state.
                  </p>
                </div>
                <div className="text-meta font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20 self-start sm:self-auto">
                  Status: 3 Courses Active
                </div>
              </div>

              {/* The 3 Course Cards from media_1794124034292_7cc72923.png */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Course 1: CS101 Completed */}
                <div className="rounded-xl bg-white dark:bg-[#020308] border border-emerald-500/40 p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/70 transition-colors shadow-sm">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-meta font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                        Beginner
                      </span>
                      <ProgressRing value={100} size={54} strokeWidth={5} label="Completed" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                      CS101: Introduction to Computer Science
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-[#8a94a6] mt-2 line-clamp-2 leading-relaxed">
                      Algorithmic complexity, memory pointers, bit manipulation, and sequential execution proofs.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="text-meta font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Completed
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('verify')}
                      className="h-8 px-3 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span>Certificate</span>
                    </button>
                  </div>
                </div>

                {/* Course 2: CS201 In Progress (Interactive increment) */}
                <div className="rounded-xl bg-white dark:bg-[#020308] border border-[#0082fb]/40 p-5 flex flex-col justify-between space-y-4 hover:border-[#0082fb]/70 transition-colors shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#0082fb]/10 rounded-full blur-xl pointer-events-none" />
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-meta font-mono px-2 py-0.5 rounded bg-[#0082fb]/10 border border-[#0082fb]/30 text-[#0082fb] dark:text-[#3aa0ff] font-semibold uppercase">
                        Intermediate
                      </span>
                      <ProgressRing value={course2Progress} size={54} strokeWidth={5} label={`${course2Progress}% complete`} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                      CS201: Data Structures and Algorithms
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-[#8a94a6] mt-2 line-clamp-2 leading-relaxed">
                      Self-balancing trees, graph shortest-paths, dynamic programming, and amortized complexity.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="text-meta font-mono text-[#0082fb] dark:text-[#3aa0ff] font-semibold">
                      In Progress ({course2Progress}%)
                    </span>
                    <button
                      type="button"
                      onClick={() => setCourse2Progress((prev) => (prev >= 90 ? 50 : prev + 15))}
                      className="h-8 px-3 rounded bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs font-semibold transition-all flex items-center space-x-1 cursor-pointer glow-blue active:scale-95"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>{course2Progress >= 80 ? 'Final Exam' : 'Continue'}</span>
                    </button>
                  </div>
                </div>

                {/* Course 3: CS301 Database Systems (Interactive enroll) */}
                <div className="rounded-xl bg-white dark:bg-[#020308] border border-slate-200 dark:border-white/10 p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-white/20 transition-colors shadow-sm">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-meta font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-[#8a94a6] font-semibold uppercase">
                        Advanced
                      </span>
                      <ProgressRing value={course3Progress} size={54} strokeWidth={5} label={`${course3Progress}% complete`} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                      CS301: Database Internals &amp; Isolation
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-[#8a94a6] mt-2 line-clamp-2 leading-relaxed">
                      WAL protocols, B-Tree buffer pools, MVCC snapshot isolation, and deadlock graphs.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="text-meta font-mono text-slate-600 dark:text-[#8a94a6]">
                      {course3Progress > 0 ? `Started (${course3Progress}%)` : 'Not Started'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCourse3Progress((prev) => (prev === 0 ? 25 : prev >= 75 ? 0 : prev + 25))}
                      className="h-8 px-3 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-[#f2f5f9] text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{course3Progress === 0 ? 'Start Course' : 'Resume'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIMED ARENA WITH LIVE TEST EXECUTION */}
          {activeTab === 'arena' && (
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/5">
                <div>
                  <span className="text-label font-mono uppercase tracking-wider text-[#0082fb] dark:text-[#3aa0ff] bg-[#0082fb]/10 px-2 py-0.5 rounded border border-[#0082fb]/20">
                    Timed Assessment Arena &bull; Midterm 2
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    Distributed PostgreSQL Advisory Locks &amp; ACID Boundaries
                  </h3>
                </div>
                <div className="flex items-center space-x-3 font-mono text-xs">
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded bg-amber-50 dark:bg-[#0b0f16] border border-amber-500/40 text-amber-700 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTimer(timeLeft)}</span>
                  </div>
                  <span className="text-label text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                    Audit Log: Active
                  </span>
                </div>
              </div>

              {/* Code Snippet & Test Suite */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
                {/* Code Editor Window */}
                <div className="bg-slate-50 dark:bg-[#020308] rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-2">
                  <div className="flex items-center justify-between text-meta text-slate-500 dark:text-[#8a94a6] pb-2 border-b border-slate-200 dark:border-white/5">
                    <span>solution.py</span>
                    <span className="text-[#0082fb] dark:text-[#3aa0ff]">Python 3.12 (Sandbox)</span>
                  </div>
                  <pre className="text-slate-800 dark:text-slate-300 leading-relaxed overflow-x-auto">
                    <code>{`async def acquire_distributed_lock(conn, resource_id: int):
    # Enforce strictly ordered lock hierarchy
    sorted_id = int(hashlib.sha256(str(resource_id).encode()).hexdigest(), 16) % (2**31)
    # Server-side transaction advisory lock
    await conn.execute("SELECT pg_advisory_xact_lock($1)", sorted_id)
    return True`}</code>
                  </pre>
                </div>

                {/* Test Runner Suite */}
                <div className="bg-slate-50 dark:bg-[#020308] rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-meta text-slate-500 dark:text-[#8a94a6] pb-2 border-b border-slate-200 dark:border-white/5">
                      <span>Test Execution Matrix</span>
                      <span className="text-emerald-600 dark:text-emerald-400">4 Invariants</span>
                    </div>

                    <div className="mt-3 space-y-2 text-xs">
                      {[
                        { title: 'Concurrent Race Conditions (500 workers)', time: '+14ms' },
                        { title: 'Deadlock Graph Prevention', time: '+28ms' },
                        { title: 'Automatic Lock Release on Rollback', time: '+42ms' },
                        { title: 'Server Keystroke Telemetry Validation', time: '+58ms' },
                      ].map((t, idx) => {
                        const isDone = activeTestIndex > idx || testStatus === 'passed';
                        const isCurrent = activeTestIndex === idx + 1 && testStatus === 'running';
                        return (
                          <div
                            key={t.title}
                            className={`p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                              isDone
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                : isCurrent
                                ? 'bg-[#0082fb]/10 border-[#0082fb] text-slate-900 dark:text-white animate-pulse'
                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-[#8a94a6]'
                            }`}
                          >
                            <span className="flex items-center space-x-2">
                              {isDone ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                              ) : isCurrent ? (
                                <span className="w-3.5 h-3.5 border-2 border-[#0082fb] dark:border-[#3aa0ff] border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-white/10" />
                              )}
                              <span>{t.title}</span>
                            </span>
                            <span className="text-meta opacity-70">{t.time}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={runArenaTests}
                    disabled={testStatus === 'running'}
                    className="w-full h-10 mt-2 rounded-lg bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 shadow-xs glow-blue"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>{testStatus === 'running' ? 'Executing Test Workers...' : testStatus === 'passed' ? 'Re-Run Test Suite' : 'Execute Test Suite (Live)'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PUBLIC VERIFICATION SCANNER (REPLICATING SCREENSHOT media_1794124093746_cf00e67f.png) */}
          {activeTab === 'verify' && (
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/5">
                <div>
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight">
                      Public Digital Credential Verification Registry
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#8a94a6] mt-0.5">
                    Instantly authenticate accredited engineering diplomas against the HMAC-SHA256 registry.
                  </p>
                </div>
                <div className="text-meta font-mono text-[#0082fb] dark:text-[#3aa0ff] bg-[#0082fb]/10 px-3 py-1 rounded border border-[#0082fb]/20 self-start sm:self-auto">
                  Registry Root: Key Ring 2026-v2
                </div>
              </div>

              {/* Token Input & Trigger */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl">
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  placeholder="Enter Token (e.g. LF-8E487C12F0)"
                  className="flex-1 h-11 px-4 rounded-lg bg-white dark:bg-[#020308] border border-slate-300 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#8a94a6] uppercase focus:outline-none focus:border-[#0082fb] focus:ring-1 focus:ring-[#0082fb]"
                />
                <button
                  type="button"
                  onClick={handleSimulateVerify}
                  disabled={isVerifying}
                  className="h-11 px-5 rounded-lg bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer glow-blue shadow-xs disabled:opacity-50"
                >
                  {isVerifying ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Verify Certificate</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Verified Certificate Modal Card (From User Screenshot media_1794124093746_cf00e67f.png) */}
              {verifiedResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl bg-white dark:bg-[#020308] border border-emerald-500/40 p-5 space-y-4 shadow-lg text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5 gap-2">
                    <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      <FileCheck2 className="w-4 h-4" />
                      <span>HMAC-SHA256 SIGNATURE VERIFIED &bull; CREDENTIAL AUTHENTIC</span>
                    </div>
                    <span className="text-meta font-mono px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                      STATUS: OFFICIAL PASS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-meta font-mono text-slate-500 dark:text-[#8a94a6] uppercase block">Learner Name</span>
                      <strong className="text-slate-900 dark:text-white text-sm mt-0.5 block">Ada Lovelace</strong>
                    </div>
                    <div>
                      <span className="text-meta font-mono text-slate-500 dark:text-[#8a94a6] uppercase block">Accredited Track</span>
                      <strong className="text-[#0082fb] dark:text-[#3aa0ff] text-sm mt-0.5 block">Full-Stack System Design</strong>
                    </div>
                    <div>
                      <span className="text-meta font-mono text-slate-500 dark:text-[#8a94a6] uppercase block">Issuance Date</span>
                      <span className="text-slate-800 dark:text-[#f2f5f9] mt-0.5 block">November 8, 2026</span>
                    </div>
                    <div>
                      <span className="text-meta font-mono text-slate-500 dark:text-[#8a94a6] uppercase block">Grade Level</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold mt-0.5 block">High Distinction (Sample)</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between text-meta font-mono text-slate-500 dark:text-[#8a94a6]">
                    <span>Token: {verifyToken}</span>
                    <span>HMAC: 0x7c89f2a0b12e... (Verified against learnflow.edu authority)</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* TAB 4: AI STUDY COPILOT STREAMING SIMULATION */}
          {activeTab === 'copilot' && (
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/5">
                <div>
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-[#0082fb] dark:text-[#7cc2ff]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight">
                      Role-Scoped AI Study Copilot (Gemini 2.0 Flash)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#8a94a6] mt-0.5">
                    Grounded in enrolled syllabus context with zero leakage of exam answer keys.
                  </p>
                </div>
                <div className="text-meta font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20 self-start sm:self-auto">
                  Redis Latency: 1.2ms
                </div>
              </div>

              {/* Preset Clickable Prompts */}
              <div className="flex flex-wrap gap-2 text-xs">
                {COPILOT_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.q}
                    type="button"
                    onClick={() => handleSelectCopilotPreset(idx)}
                    className={`px-3 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                      copilotPresetIdx === idx
                        ? 'bg-[#0082fb]/20 border-[#0082fb] text-slate-900 dark:text-white font-medium shadow-xs'
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-700 dark:text-[#8a94a6] hover:text-slate-900 dark:hover:text-[#f2f5f9] hover:border-slate-300 dark:hover:border-white/10'
                    }`}
                  >
                    {preset.q}
                  </button>
                ))}
              </div>

              {/* Streaming Output Box */}
              <div className="rounded-xl bg-white dark:bg-[#020308] border border-slate-200 dark:border-white/10 p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between text-meta font-mono text-slate-500 dark:text-[#8a94a6] pb-2 border-b border-slate-200 dark:border-white/5">
                  <span className="flex items-center space-x-1.5 text-[#0082fb] dark:text-[#3aa0ff]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Study Copilot Output</span>
                  </span>
                  <span>{COPILOT_PRESETS[copilotPresetIdx].ref}</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                  {copilotAnswer}
                  {isStreaming && <span className="inline-block w-1.5 h-3.5 bg-[#0082fb] dark:bg-[#3aa0ff] ml-1 animate-pulse" />}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};
