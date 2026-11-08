import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { Footer } from '../components/Footer';
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Layers,
  Clock,
  Lock,
  Award,
  Compass,
  Bot,
  Sun,
  Moon,
  Check,
  FileCheck2,
} from 'lucide-react';

interface FeaturedCourse {
  id: string;
  slug: string;
  title: string;
  track: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  modules: number;
  lessons: number;
  instructor: string;
  department: string;
  description: string;
  concepts: string[];
}

const FEATURED_COURSES: FeaturedCourse[] = [
  {
    id: 'system-design-distributed-architecture',
    slug: 'system-design-distributed-architecture',
    title: 'Full-Stack System Design & Distributed Architecture',
    track: 'Distributed Systems',
    difficulty: 'Intermediate',
    modules: 6,
    lessons: 9,
    instructor: 'Alan Turing',
    department: 'Department of CSE',
    description: 'Master high-concurrency systems, ACID transaction boundaries, distributed caching, database indexing, and event-driven patterns.',
    concepts: ['Distributed Caching', 'B-Tree Indexing', 'Advisory Locks', 'Transactional Outbox']
  },
  {
    id: 'advanced-react-typescript-patterns',
    slug: 'advanced-react-typescript-patterns',
    title: 'Advanced React & Modern TypeScript Patterns',
    track: 'Frontend Architecture',
    difficulty: 'Advanced',
    modules: 2,
    lessons: 2,
    instructor: 'Alan Turing',
    department: 'Department of CSE',
    description: 'Deep dive into React 19 concurrent features, TanStack Query server caching, Zustand state stores, and strict type-safe UI architecture.',
    concepts: ['React 19 Concurrency', 'Type-Safe Stores', 'useDeferredValue']
  },
  {
    id: 'database-internals-concurrency-isolation',
    slug: 'database-internals-concurrency-isolation',
    title: 'Database Internals & Concurrency Control',
    track: 'Database Systems',
    difficulty: 'Intermediate',
    modules: 2,
    lessons: 2,
    instructor: 'Alan Turing',
    department: 'Department of CSE',
    description: 'Explore storage engines, write-ahead logging (WAL), multi-version concurrency control (MVCC), and distributed consensus mechanisms.',
    concepts: ['Storage Engines', 'WAL Protocols', 'SSI Isolation']
  },
  {
    id: 'cloud-native-infrastructure-container-security',
    slug: 'cloud-native-infrastructure-container-security',
    title: 'Cloud-Native Infrastructure & Container Security',
    track: 'Systems & Cloud',
    difficulty: 'Beginner',
    modules: 2,
    lessons: 2,
    instructor: 'Alan Turing',
    department: 'Department of CSE',
    description: 'Foundational architecture for containerized microservices: Linux cgroups, namespaces, image layer minimization, and Kubernetes RBAC.',
    concepts: ['Linux Namespaces', 'Cgroups v2', 'Container Security']
  }
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated, getDefaultDashboardPath } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();

  const [verifyCode, setVerifyCode] = useState('');
  const [mockVerifiedToken, setMockVerifiedToken] = useState<string | null>(null);
  const [activeRoleTab, setActiveRoleTab] = useState<'learner' | 'instructor' | 'hod' | 'admin'>('learner');
  const [arenaSelectedAnswer, setArenaSelectedAnswer] = useState<number | null>(null);
  const [activeTrailNode, setActiveTrailNode] = useState<number>(2); // Default to Module 3 (Active)

  const dashboardPath = getDefaultDashboardPath ? getDefaultDashboardPath() : '/my-learning';

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = verifyCode.trim();
    if (token) {
      setMockVerifiedToken(token);
    }
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-sky-500 selection:text-white transition-colors duration-200">
      {/* ========================================================================= */}
      {/* 0. DEDICATED LANDING TOP BAR (Clean, Mock Features Anchor Navigation)     */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Brand Mark */}
          <Link to="/" className="flex items-center space-x-2.5 shrink-0">
            <div className="w-8 h-8 rounded-sm bg-slate-800 border border-slate-700/80 flex items-center justify-center text-sky-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="flex items-baseline space-x-1.5 whitespace-nowrap">
              <span className="text-base font-semibold tracking-tight text-white">Learnflow</span>
              <span className="text-label font-mono text-slate-400 tracking-normal hidden sm:inline">[LMS]</span>
            </div>
          </Link>

          {/* Anchor Links to Sections of this Same Landing Page */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Landing page sections">
            <a
              href="#courses"
              onClick={(e) => handleSmoothScroll(e, 'courses')}
              className="h-8 px-3 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 inline-flex items-center space-x-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Curricula</span>
            </a>

            <a
              href="#journey"
              onClick={(e) => handleSmoothScroll(e, 'journey')}
              className="h-8 px-3 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 inline-flex items-center space-x-1.5 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Learning Trail</span>
            </a>

            <a
              href="#assessments"
              onClick={(e) => handleSmoothScroll(e, 'assessments')}
              className="h-8 px-3 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 inline-flex items-center space-x-1.5 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Timed Arena</span>
            </a>

            <a
              href="#copilot"
              onClick={(e) => handleSmoothScroll(e, 'copilot')}
              className="h-8 px-3 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 inline-flex items-center space-x-1.5 transition-colors"
            >
              <Bot className="w-3.5 h-3.5 text-sky-400" />
              <span>Study Copilot</span>
            </a>

            <a
              href="#verify"
              onClick={(e) => handleSmoothScroll(e, 'verify')}
              className="h-8 px-3 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 inline-flex items-center space-x-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verification</span>
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle visual theme"
              className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="h-8 px-4 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <span>My Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="h-8 px-3.5 rounded-md text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="h-8 px-3.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center space-x-1 transition-colors shadow-xs"
                >
                  <span>Access Portal</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative pt-16 pb-16 md:pt-24 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium"
          >
            <GraduationCap className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Learnflow LMS &bull; Department of Computer Science &amp; Engineering</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight sm:leading-none"
          >
            Verifiable Computer Science Education.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Master distributed systems, concurrency protocols, and modern web architectures. Featuring server-side sequential module unlocking, tamper-proof timed assessments, and cryptographically verified diplomas.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            <a
              href="#courses"
              onClick={(e) => handleSmoothScroll(e, 'courses')}
              className="w-full sm:w-auto h-11 px-6 rounded-md bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
            >
              <span>Explore Curricula</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              to="/login"
              className="w-full sm:w-auto h-11 px-6 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <span>Access Student Portal</span>
            </Link>
          </motion.div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-label font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sequential Module Invariant</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>HMAC-SHA256 Signed Diplomas</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero-Tracker Proctoring Integrity</span>
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CURRICULA & COURSES SHOWCASE SECTION (#courses)                        */}
      {/* ========================================================================= */}
      <section id="courses" className="py-20 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium mb-3">
                <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                <span>Curated Computing Curricula</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Four Foundational Computer Science Tracks
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                Every curriculum provides comprehensive theoretical rigor, verified code labs, and sequential assessment checkpoints.
              </p>
            </div>

            <Link
              to="/courses"
              className="mt-4 md:mt-0 inline-flex items-center space-x-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors"
            >
              <span>View Full Course Catalog</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_COURSES.map((course) => (
              <div
                key={course.id}
                className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-meta font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider">
                      {course.difficulty}
                    </span>
                    <span className="text-label font-mono text-slate-500">
                      {course.modules} Modules &bull; {course.lessons} Lessons
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight line-clamp-2 mb-2">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 mb-4 font-normal">
                    {course.description}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {course.concepts.map((concept) => (
                      <span
                        key={concept}
                        className="text-meta font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate">{course.instructor}</span>
                    <Link
                      to="/login"
                      className="font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center space-x-1"
                    >
                      <span>Enroll</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE MOUNTAIN TRAIL SHOWCASE (#journey)                         */}
      {/* ========================================================================= */}
      <section id="journey" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-mono font-medium mb-3">
            <Compass className="w-3.5 h-3.5 text-sky-500" />
            <span>Sequential Mountain Trail</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ascend Through Sequential Modules
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            A learner moves through the course module by module. Module N unlocks strictly when Module N-1 is complete, culminating in the verified diploma summit.
          </p>
        </div>

        {/* Mock Interactive Mountain Trail Preview Card */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-sky-950/20 via-slate-950 to-slate-950 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Left: Trail Explanation & Invariants */}
            <div className="space-y-6 lg:col-span-1">
              <div>
                <span className="text-meta font-mono uppercase tracking-wider text-sky-400 font-semibold">
                  Course Progression Invariant
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Full-Stack System Design Mountain Path
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Click any checkpoint on the mountain trail to inspect module mastery criteria, prerequisites, and server-side unlocking rules.
                </p>
              </div>

              {/* Active Checkpoint Detail Box */}
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-meta font-mono uppercase text-sky-400 font-semibold">
                    Checkpoint {activeTrailNode + 1} of 6
                  </span>
                  <span className={`text-meta font-mono px-2 py-0.5 rounded font-semibold ${
                    activeTrailNode < 2
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : activeTrailNode === 2
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {activeTrailNode < 2 ? 'PASSED & MASTERED' : activeTrailNode === 2 ? 'ACTIVE CHECKPOINT' : 'LOCKED BY SERVER'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">
                  {activeTrailNode === 0 && 'Module 1: High-Performance Data Access & Indexing'}
                  {activeTrailNode === 1 && 'Module 2: Scalable Caching & Invalidation'}
                  {activeTrailNode === 2 && 'Module 3: Event-Driven Architecture & Outbox Pattern'}
                  {activeTrailNode === 3 && 'Module 4: ACID Boundaries & Distributed Consensus'}
                  {activeTrailNode === 4 && 'Module 5: Distributed Observability & Chaos Engineering'}
                  {activeTrailNode === 5 && 'Module 6: Capstone Architecture Defense & Final Review'}
                </h4>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {activeTrailNode === 0 && 'Mastered B-Tree index optimization and advisory locks. Score: 95% on midterm assessment.'}
                  {activeTrailNode === 1 && 'Completed cache-aside patterns and stampede mitigation with Redis distributed locks.'}
                  {activeTrailNode === 2 && 'Current active focus: Debezium CDC pipeline and transactional outbox event streams.'}
                  {activeTrailNode === 3 && 'Locked: Unlocks immediately when Module 3 assessment and lesson tasks are submitted.'}
                  {activeTrailNode === 4 && 'Locked: Requires successful completion of Module 4 consensus exercises.'}
                  {activeTrailNode === 5 && 'Summit Defense: Final evaluation presented to the faculty academic review board.'}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Enter Mountain Trail in Student Portal</span>
                </Link>
              </div>
            </div>

            {/* Right: SVG Mountain Trail Mockup */}
            <div className="lg:col-span-2 relative">
              <svg viewBox="0 0 600 420" className="w-full max-w-[600px] mx-auto select-none">
                <defs>
                  <linearGradient id="landingTrailGrad" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>

                {/* Mountain Terrain Contours */}
                <path d="M 50 400 L 300 60 L 550 400 Z" fill="none" stroke="#1e293b" strokeWidth="2" opacity="0.6" />
                <path d="M 120 400 L 300 90 L 480 400" fill="none" stroke="#1e293b" strokeWidth="1" opacity="0.5" />
                <path d="M 300 60 L 300 400" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />

                {/* Trail Segments */}
                <path d="M 160 360 C 220 340, 380 340, 440 300" fill="none" stroke="url(#landingTrailGrad)" strokeWidth="4" />
                <path d="M 440 300 C 380 260, 220 260, 180 230" fill="none" stroke="url(#landingTrailGrad)" strokeWidth="4" />
                <path d="M 180 230 C 220 190, 380 190, 420 160" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 6" />
                <path d="M 420 160 C 380 130, 240 130, 200 110" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="6 6" />
                <path d="M 200 110 C 240 85, 270 85, 300 65" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="6 6" />

                {/* Summit Waypoint */}
                <g transform="translate(300, 65)">
                  <circle r="18" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                  <Award x={-7} y={-7} className="w-3.5 h-3.5 text-amber-300" />
                  <text x={0} y={-24} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    DIPLOMA SUMMIT
                  </text>
                </g>

                {/* Checkpoint Nodes */}
                {[
                  { x: 160, y: 360, label: 'Mod 1', status: 'completed' },
                  { x: 440, y: 300, label: 'Mod 2', status: 'completed' },
                  { x: 180, y: 230, label: 'Mod 3', status: 'current' },
                  { x: 420, y: 160, label: 'Mod 4', status: 'locked' },
                  { x: 200, y: 110, label: 'Mod 5', status: 'locked' },
                ].map((node, idx) => {
                  const isSelected = activeTrailNode === idx;
                  return (
                    <g
                      key={idx}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="cursor-pointer"
                      onClick={() => setActiveTrailNode(idx)}
                    >
                      {/* Active Ring */}
                      {node.status === 'current' && (
                        <circle r="18" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
                      )}

                      <circle
                        r={isSelected ? 13 : 11}
                        fill={node.status === 'completed' ? '#0284c7' : node.status === 'current' ? '#0369a1' : '#0f172a'}
                        stroke={isSelected ? '#ffffff' : node.status === 'completed' || node.status === 'current' ? '#38bdf8' : '#334155'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                      />

                      {node.status === 'completed' ? (
                        <Check x={-5} y={-5} className="w-2.5 h-2.5 text-white" />
                      ) : node.status === 'locked' ? (
                        <Lock x={-4} y={-4} className="w-2 h-2 text-slate-500" />
                      ) : (
                        <text x={0} y={3} textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">
                          {idx + 1}
                        </text>
                      )}

                      <text
                        x={idx % 2 === 0 ? -16 : 16}
                        y={4}
                        textAnchor={idx % 2 === 0 ? 'end' : 'start'}
                        fill={isSelected ? '#ffffff' : '#94a3b8'}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECURE TIMED ASSESSMENT ARENA SHOWCASE (#assessments)                  */}
      {/* ========================================================================= */}
      <section id="assessments" className="py-20 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium mb-3">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Assessment Architecture</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Secure Timed Assessment Arena
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Zero client-side proctoring gimmicks. Server-side timestamp bounds, anti-replay token rotation, and rigorous academic integrity verification.
            </p>
          </div>

          {/* Interactive Exam Simulation Card */}
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            {/* Arena Top Toolbar */}
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-meta font-mono text-sky-400 uppercase tracking-wider">Exam Environment &bull; Midterm</span>
                <h3 className="text-sm font-bold text-white">PostgreSQL Concurrency &amp; Storage Architecture</h3>
              </div>

              <div className="flex items-center space-x-4 font-mono text-xs">
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded bg-slate-800 border border-slate-700 text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>24:18 remaining</span>
                </div>
                <span className="text-label text-slate-400">Question 3 of 10</span>
              </div>
            </div>

            {/* Question Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">QUESTION 3 (SINGLE CHOICE &bull; 2.0 PTS)</span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  Which scan type in PostgreSQL query execution plans confirms that all requested columns were resolved directly from the index tree without reading the table heap?
                </h4>
              </div>

              {/* Code Snippet Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs">
                <div className="text-slate-500 mb-1">-- Execution Plan Inspection</div>
                <code>EXPLAIN (ANALYZE, BUFFERS) SELECT user_id, tenant_id FROM users WHERE tenant_id = 42;</code>
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-2.5">
                {[
                  { id: 1, text: 'Sequential Scan (Seq Scan)', correct: false },
                  { id: 2, text: 'Bitmap Heap Scan', correct: false },
                  { id: 3, text: 'Index Only Scan (Heap Fetches: 0)', correct: true },
                  { id: 4, text: 'TID Scan', correct: false },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setArenaSelectedAnswer(opt.id)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      arenaSelectedAnswer === opt.id
                        ? opt.correct
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200'
                        : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span>{opt.text}</span>
                    {arenaSelectedAnswer === opt.id && (
                      <span className={`text-meta font-mono font-semibold px-2 py-0.5 rounded ${
                        opt.correct ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                      }`}>
                        {opt.correct ? 'CORRECT ANSWER' : 'INCORRECT'}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Proctoring Honesty Note */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-start space-x-3">
                <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Academic Integrity Statement:</strong> Learnflow enforces time boundaries on the backend database transaction. We log focus and blur telemetry for instructor review, avoiding invasive client-side webcam proctoring.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CONTEXT-AWARE AI STUDY COPILOT SHOWCASE (#copilot)                     */}
      {/* ========================================================================= */}
      <section id="copilot" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-mono font-medium">
              <Bot className="w-3.5 h-3.5 text-sky-500" />
              <span>Role-Scoped AI Assistant</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Learnflow AI Study Copilot
            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              An intelligent tutoring assistant grounded strictly in your enrolled curriculum. Powered by retrieval-augmented generation (RAG) with multi-instance Redis caching and prompt-injection defense.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-start space-x-2.5 text-slate-600 dark:text-slate-300">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Enrolled-course boundary: Never leaks other departments or answer keys.</span>
              </div>
              <div className="flex items-start space-x-2.5 text-slate-600 dark:text-slate-300">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Distributed Redis semantic caching for sub-millisecond answer retrieval.</span>
              </div>
              <div className="flex items-start space-x-2.5 text-slate-600 dark:text-slate-300">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Hands-free voice recognition with automatic Web Speech fallback.</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs"
              >
                <span>Try Study Copilot in Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Interactive Chat Mockup Card */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Study Copilot</h4>
                  <span className="text-meta font-mono text-emerald-400">Context: Full-Stack System Design &bull; Mod 1</span>
                </div>
              </div>
              <span className="text-meta font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                Redis Cached
              </span>
            </div>

            {/* Chat Transcript */}
            <div className="space-y-3 text-xs">
              <div className="bg-slate-800/80 rounded-xl p-3.5 text-slate-200 border border-slate-700/60">
                <span className="text-meta font-mono text-slate-400 block mb-1">Ada Lovelace (Student):</span>
                Why does the composite index (tenant_id, created_at) fail to optimize a query filtering only on created_at?
              </div>

              <div className="bg-sky-950/40 rounded-xl p-3.5 text-sky-200 border border-sky-800/60 space-y-2">
                <span className="text-meta font-mono text-sky-400 block">Study Copilot:</span>
                <p className="leading-relaxed">
                  Under the <strong>B-Tree leftmost prefix rule</strong>, the composite index is sorted primarily by <code>tenant_id</code> and secondarily by <code>created_at</code>. A query filtering only on <code>created_at</code> lacks the root partitioning key and cannot perform a binary tree seek.
                </p>
                <div className="pt-1 text-label font-mono text-sky-400">
                  Ref: Lesson 1.1 &bull; PostgreSQL B-Tree Index Optimization &sect;2.1
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. PUBLIC CREDENTIAL VERIFICATION SHOWCASE (#verify)                      */}
      {/* ========================================================================= */}
      <section id="verify" className="py-20 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6 shadow-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 font-mono">
              <Award className="w-3.5 h-3.5 text-sky-400" />
              <span>Digital Credential Registry</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Instant Public Certificate Verification
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto font-normal">
              Every completed curriculum issues an official academic diploma signed with HMAC-SHA256 and an institutional verification token. Anyone can verify credentials instantly against the registry.
            </p>

            <form onSubmit={handleVerifySubmit} className="max-w-lg mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Enter certificate token (e.g. LF-8E4B7C12F0...)"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="flex-1 h-10 px-3.5 rounded-md bg-slate-950 border border-slate-700 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 uppercase"
              />
              <button
                type="submit"
                className="h-10 px-5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <span>Verify Token</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setVerifyCode('LF-DEMO-9X82F1');
                  setMockVerifiedToken('LF-DEMO-9X82F1');
                }}
                className="text-label font-mono text-sky-400 hover:underline cursor-pointer"
              >
                Click to load sample token: LF-DEMO-9X82F1
              </button>
            </div>

            {/* Mock Verified Certificate Preview Card */}
            {mockVerifiedToken && (
              <div className="mt-6 p-6 rounded-xl bg-slate-950 border border-emerald-500/40 text-left space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-semibold">
                    <FileCheck2 className="w-4 h-4" />
                    <span>HMAC-SHA256 SIGNATURE AUTHENTICATED</span>
                  </div>
                  <span className="text-meta font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    STATUS: VALID
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-meta font-mono text-slate-500 uppercase">Credential Holder</span>
                    <p className="font-bold text-white text-sm mt-0.5">Ada Lovelace</p>
                  </div>
                  <div>
                    <span className="text-meta font-mono text-slate-500 uppercase">Curriculum Track</span>
                    <p className="font-bold text-sky-400 text-sm mt-0.5">Full-Stack System Design &amp; Distributed Architecture</p>
                  </div>
                  <div>
                    <span className="text-meta font-mono text-slate-500 uppercase">Issuance Date</span>
                    <p className="font-medium text-slate-300 mt-0.5">November 8, 2026</p>
                  </div>
                  <div>
                    <span className="text-meta font-mono text-slate-500 uppercase">Issuing Authority</span>
                    <p className="font-medium text-slate-300 mt-0.5">Learnflow Academic Directorate &bull; Dept of CSE</p>
                  </div>
                </div>

                <div className="pt-2 text-label font-mono text-slate-500">
                  Token: {mockVerifiedToken} &bull; Signature verified against institutional root key ring.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. ROLE WORKSPACES TAB SECTION                                            */}
      {/* ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium mb-3">
            <Layers className="w-3.5 h-3.5 text-sky-500" />
            <span>Role-Based Access Control</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Designed for Every Academic Stakeholder
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Sign in to experience the tailored workspace designed for your academic role.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            {[
              { id: 'learner', label: 'Student Portal' },
              { id: 'instructor', label: 'Faculty Studio' },
              { id: 'hod', label: 'Department Oversight' },
              { id: 'admin', label: 'System Administration' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveRoleTab(tab.id as 'learner' | 'instructor' | 'hod' | 'admin')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeRoleTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs text-center space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {activeRoleTab === 'learner' && 'Learner Workspace (Student Portal)'}
            {activeRoleTab === 'instructor' && 'Instructor Studio & Assessment Builder'}
            {activeRoleTab === 'hod' && 'Head of Department (HOD) Portal'}
            {activeRoleTab === 'admin' && 'System Administration & Security Console'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
            {activeRoleTab === 'learner' && 'Track sequential course progression, climb the mountain trail, practice in the timed arena, and consult the AI study copilot.'}
            {activeRoleTab === 'instructor' && 'Author courses, assemble 4-type question assessments, review the quarantined assignment grading queue, and inspect cohort retention drop-offs.'}
            {activeRoleTab === 'hod' && 'Oversee faculty teaching workloads, review department curriculum completion rates, and verify academic criteria compliance across your discipline.'}
            {activeRoleTab === 'admin' && 'Manage role provisioning, inspect security audit logs, monitor rate-limiting metrics, and safeguard institutional credentials.'}
          </p>

          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Sign In with Demo Persona</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. LANDING PAGE FOOTER                                                    */}
      {/* ========================================================================= */}
      <Footer />
    </div>
  );
};
