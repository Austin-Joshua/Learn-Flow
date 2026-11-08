import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
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
  Users,
  Building2,
  Sparkles,
  BookOpen,
  Star
} from 'lucide-react';

interface FeaturedCourse {
  id: string;
  title: string;
  track: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  modules: number;
  lessons: number;
  duration: string;
  instructor: string;
  rating: number;
  students: number;
  description: string;
  concepts: string[];
}

const FEATURED_COURSES: FeaturedCourse[] = [
  {
    id: 'system-design-distributed-architecture',
    title: 'Full-Stack System Design & Distributed Architecture',
    track: 'Distributed Systems',
    difficulty: 'Intermediate',
    modules: 3,
    lessons: 8,
    duration: '16 Hours',
    instructor: 'Prof. Alan Turing',
    rating: 4.9,
    students: 342,
    description: 'Master high-concurrency systems, ACID transaction boundaries, distributed caching, database indexing, and event-driven patterns.',
    concepts: ['Distributed Caching', 'B-Tree Indexing', 'Pub/Sub Messaging']
  },
  {
    id: 'advanced-relational-data-modeling',
    title: 'Advanced Relational Modeling & Index Optimization',
    track: 'Database Systems',
    difficulty: 'Advanced',
    modules: 4,
    lessons: 12,
    duration: '22 Hours',
    instructor: 'Dr. Grace Hopper',
    rating: 4.8,
    students: 285,
    description: 'Deep dive into storage engine internals, composite indexing strategies, query execution plans, and transaction isolation levels.',
    concepts: ['Index-Only Scans', 'Write-Ahead Logging', 'Deadlock Detection']
  },
  {
    id: 'memory-safety-and-concurrency',
    title: 'Operating Systems, Memory Safety & Concurrency',
    track: 'Systems Programming',
    difficulty: 'Intermediate',
    modules: 3,
    lessons: 9,
    duration: '18 Hours',
    instructor: 'Prof. Margaret Hamilton',
    rating: 5.0,
    students: 210,
    description: 'Explore kernel-level memory management, thread synchronization, mutual exclusion locks, and formal race condition prevention.',
    concepts: ['Memory Allocation', 'Mutex Locks', 'Thread Pools']
  }
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated, getDefaultDashboardPath } = useAuthStore();
  const navigate = useNavigate();
  const [verifyCode, setVerifyCode] = useState('');
  const [activeRoleTab, setActiveRoleTab] = useState<'learner' | 'instructor' | 'hod' | 'admin'>('learner');

  const dashboardPath = getDefaultDashboardPath ? getDefaultDashboardPath() : '/courses';

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.trim()) {
      navigate(`/verify/${verifyCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-sky-500 selection:text-white transition-colors duration-200">
      {/* 1. Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Learnflow LMS 2.0 · Computer Science Education</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.14]"
          >
            Modern Computer Science <br />
            <span className="text-sky-600 dark:text-sky-400">
              Education &amp; Verified Assessment
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto"
          >
            A university-grade learning management platform with sequential curricula, proctored examinations, adaptive review pathways, and cryptographic certificates.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-3"
          >
            <Link
              to="/courses"
              className="h-11 px-6 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold inline-flex items-center space-x-2 transition-all shadow-sm"
            >
              <span>Explore Course Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="h-11 px-6 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold inline-flex items-center space-x-2 transition-colors shadow-xs"
              >
                <span>Go to Workspace</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="h-11 px-6 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold inline-flex items-center space-x-2 transition-colors shadow-xs"
              >
                <span>Sign In to Portals</span>
                <Users className="w-4 h-4 text-slate-400" />
              </Link>
            )}
          </motion.div>

          {/* Core Institutional Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left"
          >
            <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400 mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">Curricula</span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">Sequential Paths</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enforced lesson prerequisites</div>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">Exams</span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">Proctored Timers</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Single-attempt session locks</div>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-1">
                <GitBranch className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">Adaptive</span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">Review Routing</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Targeted concept remediation</div>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 mb-1">
                <Award className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">Diplomas</span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">Verified Tokens</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tamper-evident public registry</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Featured Courses Section */}
      <section className="py-16 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div className="space-y-1">
              <div className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                Featured Programs
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Featured Computer Science Curricula
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Rigorous coursework authored and reviewed by university faculty.
              </p>
            </div>
            <Link
              to="/courses"
              className="mt-4 md:mt-0 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 inline-flex items-center gap-1"
            >
              <span>View all courses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_COURSES.map((course) => (
              <motion.div
                key={course.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-medium">
                      {course.track}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {course.difficulty}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug mb-2">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {course.concepts.map((concept, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{course.instructor}</span>
                    <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {course.rating.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{course.modules} Modules · {course.lessons} Lessons</span>
                    <span>{course.duration}</span>
                  </div>

                  <Link
                    to={`/courses`}
                    className="w-full mt-2 py-2 px-3 rounded-md bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold text-center block transition-colors"
                  >
                    View Syllabus &amp; Enroll
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Four Role Workspaces Section */}
      <section id="workspaces" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            Connected Workspaces
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tailored Portals for Every Academic Role
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            A cohesive environment where students learn, faculty teach, department heads supervise, and administrators govern.
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
            <button
              onClick={() => setActiveRoleTab('learner')}
              className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
                activeRoleTab === 'learner'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student</span>
            </button>
            <button
              onClick={() => setActiveRoleTab('instructor')}
              className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
                activeRoleTab === 'instructor'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Faculty</span>
            </button>
            <button
              onClick={() => setActiveRoleTab('hod')}
              className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
                activeRoleTab === 'hod'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Department Chair (HOD)</span>
            </button>
            <button
              onClick={() => setActiveRoleTab('admin')}
              className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
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

        {/* Tab Cards */}
        <div className="max-w-4xl mx-auto">
          {activeRoleTab === 'learner' && (
            <motion.div
              key="learner-card"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student Experience</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Guided Technical Mastery
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Enroll in accredited computer science courses, complete reading and coding lessons, test knowledge in timed examinations, and earn verifiable certificates.
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Progress sequentially with enforced lesson prerequisites.</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Take single-attempt assessments with anti-tamper countdown timers.</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Claim tamper-evident certificates with public verification tokens.</span>
                  </li>
                </ul>
                <div className="pt-2">
                  <Link
                    to="/my-learning"
                    className="inline-flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500"
                  >
                    <span>Open Student Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-3 font-sans">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-semibold text-slate-200">Active Course Progress</span>
                  <span className="text-emerald-400 font-mono text-[10px]">IN PROGRESS</span>
                </div>
                <div className="space-y-1.5">
                  <div className="text-slate-300 text-xs font-medium">Full-Stack System Design</div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full w-3/4 rounded-full" />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Progress: 75% Complete</span>
                    <span>Next: Lesson 1.3</span>
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-900 border border-slate-800 text-[11px] text-sky-300">
                  Adaptive Guidance: Complete the B-Tree Indexing review before taking Assessment 1.
                </div>
              </div>
            </motion.div>
          )}

          {activeRoleTab === 'instructor' && (
            <motion.div
              key="instructor-card"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Faculty Studio</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Curriculum Authoring &amp; Grading
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Design structured courses with modules and lessons, configure assessment question banks, and evaluate student assignment submissions.
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Visual curriculum editor with prerequisite concept links.</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Centralized assignment grading queue with inline rubric feedback.</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Cohort analytics on lesson completion and quiz performance.</span>
                  </li>
                </ul>
                <div className="pt-2">
                  <Link
                    to="/instructor/courses"
                    className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                  >
                    <span>Open Faculty Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-3 font-sans">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-semibold text-slate-200">Assignment Review Queue</span>
                  <span className="text-amber-400 font-mono text-[10px]">2 PENDING</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-200">Assignment 1: Memory Buffer Overflow</div>
                      <div className="text-[10px] text-slate-400">Student: Ada Lovelace</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono">Needs Grade</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-200">Assignment 2: Distributed Lock Manager</div>
                      <div className="text-[10px] text-slate-400">Student: Grace Hopper</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">Graded 96%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeRoleTab === 'hod' && (
            <motion.div
              key="hod-card"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-medium">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Academic Leadership</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Department Oversight &amp; Quality
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Monitor departmental course completion rates, faculty grading turnaround times, and curriculum alignment across academic semesters.
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Real-time department metrics on course enrollments and completions.</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Faculty grading turnaround SLAs and evaluation timeliness.</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Curriculum health auditing and student completion velocity.</span>
                  </li>
                </ul>
                <div className="pt-2">
                  <Link
                    to="/hod"
                    className="inline-flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500"
                  >
                    <span>Open Department Oversight</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-3 font-sans">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-semibold text-slate-200">Department Performance</span>
                  <span className="text-emerald-400 font-mono text-[10px]">CSE FACULTY</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded border border-slate-800">
                    <div className="text-[11px] text-slate-400">Total Enrolled</div>
                    <div className="text-lg font-bold text-white mt-0.5">837 Scholars</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded border border-slate-800">
                    <div className="text-[11px] text-slate-400">Avg Grading Turnaround</div>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5">18.4 Hours</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeRoleTab === 'admin' && (
            <motion.div
              key="admin-card"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Platform Governance</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Security, Auditing &amp; Administration
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Manage user accounts, assign role permissions, inspect immutable audit activity logs, and administer certificate integrity.
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Role-based access control with administrative delegation.</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Immutable security audit logging with tamper detection.</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Active session monitoring and automated token rotation.</span>
                  </li>
                </ul>
                <div className="pt-2">
                  <Link
                    to="/admin"
                    className="inline-flex items-center space-x-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-500"
                  >
                    <span>Open Governance Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-3 font-sans">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-semibold text-slate-200">Security Audit Activity</span>
                  <span className="text-emerald-400 font-mono text-[10px]">VERIFIED</span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 truncate">
                    EVENT: USER_LOGIN · Ada Lovelace (Learner) · SUCCESS
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 truncate">
                    EVENT: CERT_ISSUED · LF-8e4b7c12f0 · SIGNATURE_OK
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* 4. Interactive Learning Architecture & Adaptive DAG */}
      <section className="py-20 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                <GitBranch className="w-3.5 h-3.5" />
                <span>Adaptive Learning Engine</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Mastery Without Knowledge Gaps
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Standard courses let students advance with missing fundamentals. Learnflow structures curricula into directed concept networks. When assessment errors occur, the diagnostic engine automatically identifies weakness and provides targeted review recommendations.
              </p>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">Diagnostic Question Mapping:</span>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">Every assessment question is mapped to specific course concepts.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">Prerequisite Tree Traversal:</span>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">Identifies the root lesson where conceptual misunderstanding originated.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/adaptive-path"
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                >
                  <span>Explore Adaptive Prerequisite Graph</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Visual Prerequisite Diagram */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between text-xs border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="font-semibold text-slate-900 dark:text-white">Diagnostic Concept Tree</span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">ACTIVE REMEDIATION</span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Node 1 */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">1. B-Tree Data Structure Fundamentals</div>
                      <div className="text-[11px] text-slate-500">Lesson 1.1 · Score: 95% (Mastered)</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">PASSED</span>
                </div>

                <div className="flex justify-center -my-1">
                  <div className="w-0.5 h-4 bg-slate-300 dark:bg-slate-700" />
                </div>

                {/* Node 2 */}
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">2. Composite Index Leftmost Prefix Rule</div>
                      <div className="text-[11px] text-slate-500">Lesson 1.2 · Score: 62% (Needs Review)</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">REVIEW</span>
                </div>

                <div className="flex justify-center -my-1">
                  <div className="w-0.5 h-4 bg-slate-300 dark:bg-slate-700" />
                </div>

                {/* Node 3 */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between opacity-60">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">3. Advanced Query Execution &amp; Buffer Tuning</div>
                      <div className="text-[11px] text-slate-500">Assessment 1.3 · Locked until review completed</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-semibold">LOCKED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Public Credential Verification Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-mono font-medium border border-sky-400/30">
            <Award className="w-3.5 h-3.5 text-sky-400" />
            <span>Digital Credential Registry</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Instant Public Certificate Verification
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
            Every completed course issues an official diploma signed with a unique cryptographic verification token. Employers and academic institutions can verify credentials instantly.
          </p>

          <form onSubmit={handleVerifySubmit} className="max-w-md mx-auto flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Enter certificate token (e.g. LF-8e4b7c12f0...)"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 shrink-0 cursor-pointer"
            >
              <span>Verify</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono text-slate-400">
            <span>&bull; Cryptographically Signed</span>
            <span>&bull; Instant Verification</span>
            <span>&bull; Tamper-Evident Record</span>
          </div>
        </div>
      </section>
    </div>
  );
};
