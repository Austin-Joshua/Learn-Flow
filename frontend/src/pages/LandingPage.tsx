import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { Footer } from '../components/Footer';
import { LearnflowBrandLogo } from '../components/common/LearnflowBrandLogo';
import {
  BookOpen,
  ShieldCheck,
  ArrowRight,
  Layers,
  Clock,
  Compass,
  Bot,
  Sun,
  Moon,
  UserPlus,
} from 'lucide-react';
import {
  HeroSection,
  MetricsRibbonSection,
  DisciplinesSection,
  CoursesSection,
  JourneySection,
  AssessmentsSection,
  CopilotSection,
  VerifySection,
  WorkspacesSection,
  TrajectorySection,
  FeaturedCourse,
} from '../components/landing';

const FEATURED_COURSES: FeaturedCourse[] = [
  {
    id: 'system-design-distributed-architecture',
    title: 'Full-Stack System Design & Distributed Architecture',
    difficulty: 'Intermediate',
    modules: 6,
    lessons: 9,
    instructor: 'Alan Turing',
    description: 'Master high-concurrency systems, ACID transaction boundaries, distributed caching, database indexing, and event-driven patterns.',
    concepts: ['Distributed Caching', 'B-Tree Indexing', 'Advisory Locks', 'Transactional Outbox'],
  },
  {
    id: 'advanced-react-typescript-patterns',
    title: 'Advanced React & Modern TypeScript Patterns',
    difficulty: 'Advanced',
    modules: 2,
    lessons: 2,
    instructor: 'Alan Turing',
    description: 'Deep dive into React 19 concurrent features, TanStack Query server caching, Zustand state stores, and strict type-safe UI architecture.',
    concepts: ['React 19 Concurrency', 'Type-Safe Stores', 'useDeferredValue'],
  },
  {
    id: 'database-internals-concurrency-isolation',
    title: 'Database Internals & Concurrency Control',
    difficulty: 'Intermediate',
    modules: 2,
    lessons: 2,
    instructor: 'Alan Turing',
    description: 'Explore storage engines, write-ahead logging (WAL), multi-version concurrency control (MVCC), and distributed consensus mechanisms.',
    concepts: ['Storage Engines', 'WAL Protocols', 'SSI Isolation'],
  },
  {
    id: 'cloud-native-infrastructure-container-security',
    title: 'Cloud-Native Infrastructure & Container Security',
    difficulty: 'Beginner',
    modules: 2,
    lessons: 2,
    instructor: 'Alan Turing',
    description: 'Foundational architecture for containerized microservices: Linux cgroups, namespaces, image layer minimization, and Kubernetes RBAC.',
    concepts: ['Linux Namespaces', 'Cgroups v2', 'Container Security'],
  },
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated, getDefaultDashboardPath } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();

  const dashboardPath = getDefaultDashboardPath ? getDefaultDashboardPath() : '/my-learning';

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#04100C] text-slate-900 dark:text-[#f0f7f4] font-sans selection:bg-[#163E44] selection:text-[#E4F455] transition-colors duration-200">
      {/* 0. STICKY GLASS HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#04100C]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#E4F455]/20 text-slate-900 dark:text-[#f0f7f4] select-none transition-all duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-12 sm:h-[52px] flex items-center justify-between gap-2 sm:gap-4 xl:gap-8">
          {/* Logo & Brand Identity */}
          <Link to="/" className="flex items-center shrink-0 group">
            <LearnflowBrandLogo imgClassName="h-6 sm:h-8 w-auto object-contain" />
          </Link>

          {/* Spacious, High-Contrast Navigation Links with Matching Icons - Straight horizontal line */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs xl:text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0" aria-label="Landing page sections">
            <a
              href="#courses"
              onClick={(e) => handleSmoothScroll(e, 'courses')}
              className="group flex items-center space-x-1.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-[#163E44]/5 dark:hover:bg-[#163E44]/40 transition-all cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4 text-slate-500 group-hover:text-[#163E44] dark:text-slate-400 dark:group-hover:text-[#E4F455] transition-colors shrink-0" />
              <span className="whitespace-nowrap">Curriculum</span>
            </a>
            <a
              href="#journey"
              onClick={(e) => handleSmoothScroll(e, 'journey')}
              className="group flex items-center space-x-1.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-[#163E44]/5 dark:hover:bg-[#163E44]/40 transition-all cursor-pointer whitespace-nowrap"
            >
              <Compass className="w-4 h-4 text-slate-500 group-hover:text-[#163E44] dark:text-slate-400 dark:group-hover:text-[#E4F455] transition-colors shrink-0" />
              <span className="whitespace-nowrap">Learning Trail</span>
            </a>
            <a
              href="#assessments"
              onClick={(e) => handleSmoothScroll(e, 'assessments')}
              className="group flex items-center space-x-1.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-[#163E44]/5 dark:hover:bg-[#163E44]/40 transition-all cursor-pointer whitespace-nowrap"
            >
              <Clock className="w-4 h-4 text-slate-500 group-hover:text-[#163E44] dark:text-slate-400 dark:group-hover:text-[#E4F455] transition-colors shrink-0" />
              <span className="whitespace-nowrap">Timed Arena</span>
            </a>
            <a
              href="#copilot"
              onClick={(e) => handleSmoothScroll(e, 'copilot')}
              className="group flex items-center space-x-1.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-[#163E44]/5 dark:hover:bg-[#163E44]/40 transition-all cursor-pointer whitespace-nowrap"
            >
              <Bot className="w-4 h-4 text-slate-500 group-hover:text-[#163E44] dark:text-slate-400 dark:group-hover:text-[#E4F455] transition-colors shrink-0" />
              <span className="whitespace-nowrap">Study Copilot</span>
            </a>
            <a
              href="#verify"
              onClick={(e) => handleSmoothScroll(e, 'verify')}
              className="group flex items-center space-x-1.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-[#163E44]/5 dark:hover:bg-[#163E44]/40 transition-all cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4 text-slate-500 group-hover:text-[#163E44] dark:text-slate-400 dark:group-hover:text-[#E4F455] transition-colors shrink-0" />
              <span className="whitespace-nowrap">Verification</span>
            </a>
          </nav>

          {/* Action CTAs: Compact & Scaled for Mobile, Tablet & Desktop */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Theme Toggle Button with Citrus Yellow Highlight in Dark Mode */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Current mode: Dark (click for Light)' : 'Current mode: Light (click for Dark)'}
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-[#163E44] border border-slate-300 dark:bg-[#071914] dark:hover:bg-[#163E44] dark:text-[#E4F455] dark:border-[#E4F455]/30 dark:hover:border-[#E4F455] dark:hover:shadow-[0_0_12px_rgba(228,244,85,0.35)] flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E4F455]" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#163E44]" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Link
                  to={dashboardPath}
                  className="h-7 sm:h-9 px-2.5 sm:px-4 rounded-lg bg-[#163E44] hover:bg-[#102d32] dark:bg-[#E4F455] dark:hover:bg-[#d5e640] text-white dark:text-[#04100C] text-[11px] sm:text-xs font-semibold inline-flex items-center space-x-1 sm:space-x-1.5 transition-all duration-200 shadow-md active:scale-98 whitespace-nowrap"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Sign Up Button */}
                <Link
                  to="/register"
                  className="h-7 sm:h-9 px-2 sm:px-3 rounded-lg bg-white hover:bg-slate-100 text-[#163E44] border border-slate-300 dark:bg-[#071914] dark:hover:bg-[#163E44] dark:border-[#E4F455]/30 dark:hover:border-[#E4F455] dark:text-[#f0f7f4] text-[11px] sm:text-xs font-semibold inline-flex items-center space-x-1 transition-all shadow-xs cursor-pointer whitespace-nowrap active:scale-98"
                >
                  <UserPlus className="w-3 h-3 text-[#163E44] dark:text-[#E4F455] hidden xs:inline" />
                  <span>Sign Up</span>
                </Link>

                {/* Sign In Button */}
                <Link
                  to="/login"
                  className="h-7 sm:h-9 px-2.5 sm:px-3.5 rounded-lg bg-[#163E44] hover:bg-[#102d32] dark:bg-[#E4F455] dark:hover:bg-[#d5e640] text-white dark:text-[#04100C] text-[11px] sm:text-xs font-semibold inline-flex items-center space-x-1 transition-all duration-200 shadow-md dark:shadow-[0_0_16px_rgba(228,244,85,0.3)] cursor-pointer border border-[#163E44]/50 dark:border-[#E4F455] whitespace-nowrap active:scale-98"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3 h-3 hidden xs:inline" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION (Aurora drift, vertical scanbeam, precision headline, interactive live showcase) */}
      <HeroSection onExploreClick={(e) => handleSmoothScroll(e, 'courses')} />

      {/* 2. PLATFORM CAPABILITIES RIBBON (01 Question Types, 02 Roles, 03 Timed Assessments, 04 Verified Credentials) */}
      <MetricsRibbonSection />

      {/* 3. EIGHT DISCIPLINES & SECTORS */}
      <DisciplinesSection />

      {/* 4. FEATURED CURRICULUM */}
      <CoursesSection courses={FEATURED_COURSES} />

      {/* 5. SEQUENTIAL MOUNTAIN TRAIL JOURNEY */}
      <JourneySection />

      {/* 6. TIMED ASSESSMENTS ARENA */}
      <AssessmentsSection />

      {/* 7. ROLE-SCOPED AI STUDY COPILOT */}
      <CopilotSection />

      {/* 8. CRYPTOGRAPHIC VERIFICATION */}
      <VerifySection />

      {/* 9. MULTI-ROLE WORKSPACES */}
      <WorkspacesSection />

      {/* 10. TRAJECTORY: HOW WE GET BETTER (6-Step Core Principles) */}
      <TrajectorySection />

      {/* 11. "LET'S BUILD SOMETHING TOGETHER" CONVERSION CTA BANNER */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200 dark:border-[#E4F455]/20 relative overflow-hidden">
        <div className="card-uplift p-10 md:p-16 rounded-3xl bg-gradient-to-br from-slate-100 via-white to-emerald-50 dark:from-[#04100C] dark:via-[#071914] dark:to-[#163E44]/40 border border-slate-200 dark:border-[#E4F455]/30 text-center relative overflow-hidden shadow-xl">
          <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#163E44]/20 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#E4F455]/10 blur-[100px]" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <span className="text-label font-mono uppercase tracking-widest text-[#163E44] dark:text-[#E4F455] bg-[#163E44]/10 dark:bg-[#E4F455]/15 px-3 py-1 rounded-full border border-[#163E44]/20 dark:border-[#E4F455]/30">
              Academic Learning Platform · Learnflow
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight">
              Start your learning journey today.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-[#a0bdb6] leading-relaxed max-w-xl mx-auto">
              Master high-concurrency systems, distributed databases, and cloud infrastructure with verifiable progress and cryptographic credentials. Built as an internship assignment.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto h-12 px-8 rounded-lg bg-[#163E44] hover:bg-[#1f525a] dark:bg-[#E4F455] dark:hover:bg-[#d6e643] text-white dark:text-[#04100C] text-xs font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-md cursor-pointer"
              >
                <span>Launch Student &amp; Faculty Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/courses"
                className="w-full sm:w-auto h-12 px-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 dark:bg-[#071914] dark:hover:bg-[#163E44]/40 dark:text-[#f2f5f9] dark:border-[#E4F455]/25 text-xs font-semibold transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Explore Curriculum</span>
                <BookOpen className="w-4 h-4 text-slate-500 dark:text-[#a0bdb6]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 15. LANDING FOOTER */}
      <Footer />
    </div>
  );
};
