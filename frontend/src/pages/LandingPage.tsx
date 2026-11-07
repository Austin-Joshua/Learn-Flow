import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import {
  GraduationCap,
  ShieldCheck,
  GitBranch,
  Clock,
  Award,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronRight,
  Database,
  Cpu,
  Terminal,
  Activity,
  Compass,
  Users,
  Building2,
  Sparkles,
  Sun,
  Moon,
  ExternalLink,
  Code2,
  Server
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, getDefaultDashboardPath } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [verifyCode, setVerifyCode] = useState('');
  const [activeRoleTab, setActiveRoleTab] = useState<'learner' | 'instructor' | 'hod' | 'admin'>('learner');

  // Track scroll progress for the top indicator bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const progressPercentage = useTransform(scrollYProgress, (value) => Math.round(value * 100));
  const [progressVal, setProgressVal] = useState(0);

  scrollYProgress.on('change', (latest) => {
    setProgressVal(Math.round(latest * 100));
  });

  const dashboardPath = getDefaultDashboardPath ? getDefaultDashboardPath() : '/courses';

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.trim()) {
      navigate(`/verify/${verifyCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-sky-500 selection:text-white transition-colors duration-300 relative overflow-x-hidden">
      {/* 0. Top Hyper-Interactive Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <motion.div
          className="h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-emerald-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
          style={{ scaleX, transformOrigin: '0%' }}
        />
        {/* Dynamic Float Pill on right */}
        <div className="absolute top-2 right-4 hidden md:flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 dark:bg-slate-800/80 border border-slate-700/60 backdrop-blur-md text-[10px] font-mono text-slate-300 pointer-events-auto">
          <span className={`w-1.5 h-1.5 rounded-full ${progressVal >= 98 ? 'bg-emerald-400 animate-ping' : 'bg-sky-400'}`} />
          <span>{progressVal >= 98 ? '100% COMPLETED' : `${progressVal}% EXPLORED`}</span>
        </div>
      </div>

      {/* 1. Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-sm bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Learnflow
                </span>
                <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
                  [LMS]
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1 text-xs font-medium">
              <a
                href="#roles"
                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-white rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                4 Role Portals
              </a>
              <a
                href="#assessment-engine"
                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-white rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                Assessment Arena
              </a>
              <a
                href="#adaptive-dag"
                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-white rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                Adaptive DAG
              </a>
              <a
                href="#verification-vault"
                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-white rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                Cryptographic Credentials
              </a>
              <Link
                to="/courses"
                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-white rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                Catalog
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-amber-400 hover:text-sky-600 dark:hover:text-amber-300 transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="h-[34px] px-3.5 bg-sky-600 hover:bg-sky-500 text-white rounded-sm text-xs font-medium inline-flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <span>Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="h-[34px] px-3.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-sm inline-flex items-center transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="h-[34px] px-3.5 bg-sky-600 hover:bg-sky-500 text-white rounded-sm text-xs font-medium inline-flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <span>Get started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Appearing / Disappearing Scroll Transitions */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Subtle geometric background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-sky-400/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="text-center max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 dark:bg-sky-500/20 border border-sky-400/30 text-sky-700 dark:text-sky-300 text-xs font-mono"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            <span>LEARNFLOW PLATFORM 2.0 · FOUR ROLE-INTEGRATED ARCHITECTURE</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]"
          >
            Server-Authoritative <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-indigo-500 to-sky-400">
              Education & Assessment Platform
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto"
          >
            Rigorous learning with DAG prerequisite enforcement, 64-bit advisory concurrency-locked assessments, automated grading, and tamper-evident cryptographic credentials.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-2"
          >
            <Link
              to="/courses"
              className="h-11 px-6 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold inline-flex items-center space-x-2 transition-all shadow-md hover:shadow-sky-500/20"
            >
              <span>Explore Course Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="h-11 px-6 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold inline-flex items-center space-x-2 transition-colors shadow-xs"
            >
              <span>Authenticate Roles</span>
              <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </Link>
          </motion.div>

          {/* Quick Metrics Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left"
          >
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 backdrop-blur-sm">
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">64-bit</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Advisory Concurrency Lock</div>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 backdrop-blur-sm">
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">128-bit</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Verification Token Entropy</div>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 backdrop-blur-sm">
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">DAG</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Topological Mastery Graph</div>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 backdrop-blur-sm">
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">4 Roles</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Learner, Staff, HOD, Admin</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Section: 4 Connected Role Portals (Student, Staff/Faculty, HOD, Admin) */}
      <section id="roles" className="py-20 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-12 space-y-2"
          >
            <div className="text-xs font-mono text-sky-600 dark:text-sky-400 font-semibold uppercase tracking-wider">
              Role-Based Access Control (RBAC)
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Four Interconnected Workspaces
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tailored specifically to each tier of institutional education, with end-to-end operational synergy.
            </p>
          </motion.div>

          {/* Interactive Role Switcher Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
              <button
                onClick={() => setActiveRoleTab('learner')}
                className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center space-x-2 transition-all ${
                  activeRoleTab === 'learner'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student / Learner</span>
              </button>
              <button
                onClick={() => setActiveRoleTab('instructor')}
                className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center space-x-2 transition-all ${
                  activeRoleTab === 'instructor'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Staff / Faculty</span>
              </button>
              <button
                onClick={() => setActiveRoleTab('hod')}
                className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center space-x-2 transition-all ${
                  activeRoleTab === 'hod'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Head of Dept (HOD)</span>
              </button>
              <button
                onClick={() => setActiveRoleTab('admin')}
                className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center space-x-2 transition-all ${
                  activeRoleTab === 'admin'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Administrator</span>
              </button>
            </div>
          </div>

          {/* Active Role Content Card */}
          <div className="max-w-4xl mx-auto">
            {activeRoleTab === 'learner' && (
              <motion.div
                key="learner-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-subtle grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>ENROLLED SCHOLAR ENVIRONMENT</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Master Technical Concepts Sequentially
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Access self-paced technical lessons, real-time code execution, high-stakes timed assessment arena, and adaptive diagnostic remediation for knowledge gaps.
                  </p>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Sequential progression strictly enforcing course prerequisites.</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Single-attempt live exam timers with anti-tamper submission locks.</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Downloadable PDF diplomas verifiable with cryptographic verification tokens.</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      to="/my-learning"
                      className="inline-flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500"
                    >
                      <span>Explore Student Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-800 pb-2">
                    <span>STUDENT TELEMETRY</span>
                    <span className="text-emerald-400">STATUS: ON_TRACK</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-400 text-[11px]">Enrolled: CS-301 Distributed Systems</div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full w-3/4 rounded-full" />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Progress: 75%</span>
                      <span>Next: Raft Consensus Quiz</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-sky-300">
                    &bull; Adaptive Recommendation: Review Byzantine Fault Tolerance before taking Exam 3.
                  </div>
                </div>
              </motion.div>
            )}

            {activeRoleTab === 'instructor' && (
              <motion.div
                key="instructor-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-subtle grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-medium">
                    <Layers className="w-3.5 h-3.5" />
                    <span>INSTRUCTOR AUTHORING STUDIO</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Curate Curricula & Review Submissions
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Author structured modules, map granular concepts, build auto-graded assessment pools with random question sets, and grade open-ended code assignments.
                  </p>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>Visual course builder with module, lesson, and concept mapping.</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>Instant assignment grading queue with inline rubric feedback.</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>Cohort dropout funnel and concept mastery analytics.</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      to="/instructor/courses"
                      className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                    >
                      <span>Open Instructor Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-800 pb-2">
                    <span>GRADING QUEUE DISPATCH</span>
                    <span className="text-amber-400">3 PENDING</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                      <span>Assignment 2: Red-Black Trees</span>
                      <span className="text-sky-400 font-semibold">Under Review</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                      <span>Assignment 1: Memory Safety</span>
                      <span className="text-emerald-400 font-semibold">Auto-Graded</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeRoleTab === 'hod' && (
              <motion.div
                key="hod-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-subtle grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-mono font-medium">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>HEAD OF DEPARTMENT (HOD)</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Departmental Oversight & Curriculum Governance
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Oversee department course health, audit faculty grading turnaround times, track student at-risk dropouts, and ensure institutional syllabus compliance.
                  </p>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                      <span>Department faculty workload balancing & course distribution.</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                      <span>Cross-course completion velocities & pass-rate telemetry.</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                      <span>Direct auditing of assessment questions and grading backlogs.</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      to="/hod"
                      className="inline-flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500"
                    >
                      <span>Enter HOD Oversight Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-800 pb-2">
                    <span>DEPARTMENT KPI TELEMETRY</span>
                    <span className="text-emerald-400">CSE DEPT</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <div className="text-slate-500">Active Faculty</div>
                      <div className="text-white font-bold">12 Staff</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <div className="text-slate-500">Grading SLA</div>
                      <div className="text-emerald-400 font-bold">&le; 24h Avg</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeRoleTab === 'admin' && (
              <motion.div
                key="admin-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-subtle grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-mono font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>SYSTEM GOVERNANCE & SECURITY</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Platform Security & Cryptographic Auditing
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Manage users, elevate credentials, monitor tamper-evident SHA-256 audit log chains, and oversee database advisory lock contention.
                  </p>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Tamper-evident audit trail with SHA-256 hash chaining.</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Zero-trust role elevation with immutable audit logs.</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>System health and background session sweeper telemetry.</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      to="/admin"
                      className="inline-flex items-center space-x-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-500"
                    >
                      <span>Access Governance Console</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-800 pb-2">
                    <span>SECURITY AUDIT HASH CHAIN</span>
                    <span className="text-emerald-400">CHAIN: INTACT</span>
                  </div>
                  <div className="space-y-1.5 text-[10px] text-slate-400">
                    <div className="truncate">BLOCK 1042: SHA256: e3b0c44298fc1c149afbf4c8996fb924...</div>
                    <div className="truncate">BLOCK 1043: SHA256: 7f83b1657ff1fc53b92dc18148a1d65d...</div>
                    <div className="truncate text-emerald-400">BLOCK 1044: SHA256: 6b86b273ff34fce19d6b804eff5a3f57... (Verified)</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Semicircular / Circular Opening Left Showcase: Assessment Arena */}
      <section id="assessment-engine" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Left */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 space-y-5"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-mono font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>TIMED EXAMINATION ENGINE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Deterministic, Concurrency-Locked Assessments
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Eliminate exam race conditions and duplicate submissions. Learnflow uses 64-bit PostgreSQL transaction advisory locks to guarantee that once an attempt starts, timer expiry, draft auto-saves, and final grading are mathematically isolated.
            </p>

            <div className="space-y-3 pt-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 font-mono text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">Strict Single-Session Lock:</span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">Advisory locks serialized by student ID and assessment ID prevent parallel attempts across tabs.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 font-mono text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">Idempotent Final Submission:</span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">Network blips during submit return the cached score with zero score divergence.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Semicircular Opening Image / Interactive Arena Preview from Left */}
          <motion.div
            initial={{ opacity: 0, x: 80, rotate: 3 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 relative"
          >
            {/* Semicircular glowing decorative backdrop */}
            <div className="absolute -inset-4 bg-gradient-to-r from-sky-500/20 to-indigo-500/10 rounded-3xl blur-2xl -z-10" />

            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
              {/* Top simulation bar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center space-x-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                    EXAM RUNNER · CS-301
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-amber-400 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>24:18 REMAINING</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">LOCK: #64B_OK</div>
                </div>
              </div>

              {/* Question Simulation */}
              <div className="space-y-4">
                <div className="text-[11px] font-mono text-sky-400">QUESTION 4 OF 12 · 10 POINTS</div>
                <h4 className="text-base font-semibold text-slate-100">
                  In the Raft consensus algorithm, what state transition occurs when a follower does not receive a heartbeat before the election timeout?
                </h4>

                <div className="space-y-2 pt-2">
                  <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-500/50 flex items-center justify-between text-xs text-sky-200">
                    <span>A. Increments term, transitions to Candidate, and broadcasts RequestVote</span>
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>B. Immediately becomes Leader and writes to the commit log</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>C. Drops all pending uncommitted log entries and halts</span>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-800 text-xs">
                  <span className="text-emerald-400 font-mono text-[11px]">Draft state saved locally</span>
                  <div className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium cursor-pointer">
                    Submit Attempt
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. Semicircular / Circular Opening Right Showcase: Adaptive DAG Engine */}
      <section id="adaptive-dag" className="py-24 bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Visual Arc Simulation from Right */}
            <motion.div
              initial={{ opacity: 0, x: -80, rotate: -3 }}
              whileInView={{ opacity: 1, x: 0, rotate: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 order-2 lg:order-1 relative"
            >
              {/* Semicircular glowing decorative backdrop */}
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-sky-500/20 rounded-3xl blur-2xl -z-10" />

              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 sm:p-8 text-white shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-2">
                    <GitBranch className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-slate-200">
                      DIRECTED ACYCLIC GRAPH (DAG) · MASTERY TOPOLOGY
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    CYCLE-FREE
                  </span>
                </div>

                {/* Concept Nodes Representation */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/50 space-y-1">
                    <div className="text-[10px] text-emerald-400 font-semibold">STAGE 1 · PASSED</div>
                    <div className="font-bold text-white">Memory Allocation</div>
                    <div className="text-[10px] text-emerald-300">Score: 95%</div>
                  </div>

                  <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-500/50 space-y-1">
                    <div className="text-[10px] text-sky-400 font-semibold">STAGE 2 · CURRENT</div>
                    <div className="font-bold text-white">Pointer Aliasing</div>
                    <div className="text-[10px] text-sky-300">Active Module</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 opacity-60">
                    <div className="text-[10px] text-slate-500">STAGE 3 · LOCKED</div>
                    <div className="font-bold text-slate-400">Lock-Free Queues</div>
                    <div className="text-[10px] text-slate-500">Requires Stage 2</div>
                  </div>
                </div>

                {/* Remediation Callout */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3 text-xs">
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div className="font-semibold text-white">Adaptive Remediation Triggered</div>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      Based on question telemetry, concept &quot;Pointer Aliasing&quot; score was below 70%. Learnflow dynamically routed Lesson 4.2 (&quot;Borrow Checker Semantics&quot;) into the learner&apos;s active study plan.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Text Right */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 space-y-5 order-1 lg:order-2"
            >
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium">
                <GitBranch className="w-3.5 h-3.5" />
                <span>ADAPTIVE LEARNING ENGINE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Topological Mastery Without Knowledge Gaps
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Standard courses let students skate through with partial understanding. Learnflow turns course syllabi into directed acyclic graphs. When assessment errors occur, the recommendation engine calculates exact prerequisite ancestors and serves targeted review lessons.
              </p>

              <div className="pt-2">
                <Link
                  to="/adaptive-path"
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                >
                  <span>Inspect Adaptive Architecture</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. Center Circular Reveal: Verifiable Cryptographic Credentials */}
      <section id="verification-vault" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950 text-white rounded-2xl border border-slate-800 p-8 sm:p-12 relative overflow-hidden shadow-2xl"
        >
          <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-mono font-medium border border-sky-400/30">
              <Award className="w-3.5 h-3.5 text-sky-400" />
              <span>CRYPTOGRAPHIC CREDENTIAL VAULT</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Instant Public Verification · LF-Token Standard
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Every completed course issues an immutable diploma generated via ReportLab with 128 bits of verification-token entropy (<code className="font-mono text-sky-400">LF-&lt;32hex&gt;</code>) and versioned HMAC signatures.
            </p>

            {/* Live Instant Code Verification Form */}
            <form onSubmit={handleVerifySubmit} className="max-w-md mx-auto flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Enter token (e.g. LF-8e4b7c12f0...)"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 shrink-0"
              >
                <span>Verify</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono text-slate-400">
              <span>&bull; HMAC-SHA256 SIGNED</span>
              <span>&bull; REVOCATION CHECKING</span>
              <span>&bull; TAMPER-EVIDENT AUDITING</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 7. Institutional Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-sm bg-slate-900 dark:bg-slate-800 text-sky-400 flex items-center justify-center border border-slate-800">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">Learnflow LMS</div>
              <div className="text-[11px] font-mono text-slate-500">Autonomous Technical Education</div>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-xs">
            <Link to="/courses" className="hover:text-slate-900 dark:hover:text-white transition-colors">Catalog</Link>
            <Link to="/verify" className="hover:text-slate-900 dark:hover:text-white transition-colors">Public Verification</Link>
            <Link to="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">Portals</Link>
          </div>

          <div className="text-xs font-mono text-slate-500">
            &copy; 2026 Learnflow. Institutional Standard LF-v2.
          </div>
        </div>
      </footer>
    </div>
  );
};
