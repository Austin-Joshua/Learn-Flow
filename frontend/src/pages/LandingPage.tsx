import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { Footer } from '../components/Footer';
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  Layers,
  Clock,
  Compass,
  Bot,
  Sun,
  Moon,
  ExternalLink,
  Sparkles,
  Zap,
  LogIn,
} from 'lucide-react';
import {
  HeroSection,
  PartnerMarqueeSection,
  MetricsRibbonSection,
  DisciplinesSection,
  CoursesSection,
  JourneySection,
  AssessmentsSection,
  CopilotSection,
  VerifySection,
  WorkspacesSection,
  TrajectorySection,
  TestimonialsSection,
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#020308] text-slate-900 dark:text-[#f2f5f9] font-sans selection:bg-[#0082fb] selection:text-white transition-colors duration-200">
      {/* 0. STICKY GLASS HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#020308]/92 backdrop-blur-md border-b border-slate-200 dark:border-white/10 text-slate-900 dark:text-[#f2f5f9] select-none transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          {/* Logo & Brand Identity */}
          <Link to="/" className="flex items-center space-x-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-[#0082fb]/20 border border-[#0082fb]/40 flex items-center justify-center text-[#0082fb] dark:text-[#3aa0ff] glow-blue shadow-inner group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-[#f2f5f9]">Learnflow</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0082fb]/20 text-[#0082fb] dark:text-[#3aa0ff] border border-[#0082fb]/40">
                  LMS
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-[#8a94a6]">Academic LMS Platform</span>
            </div>
          </Link>

          {/* Spacious, De-congested Navigation Links with Matching Icons */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2.5 text-xs font-medium text-slate-600 dark:text-[#8a94a6]" aria-label="Landing page sections">
            <a
              href="#courses"
              onClick={(e) => handleSmoothScroll(e, 'courses')}
              className="group flex items-center space-x-2 px-3.5 py-2 rounded-lg hover:text-slate-900 dark:hover:text-[#f2f5f9] hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-slate-500 group-hover:text-[#0082fb] dark:text-[#8a94a6] dark:group-hover:text-[#3aa0ff] transition-colors" />
              <span>Curricula</span>
            </a>
            <a
              href="#journey"
              onClick={(e) => handleSmoothScroll(e, 'journey')}
              className="group flex items-center space-x-2 px-3.5 py-2 rounded-lg hover:text-slate-900 dark:hover:text-[#f2f5f9] hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4 text-slate-500 group-hover:text-[#0082fb] dark:text-[#8a94a6] dark:group-hover:text-[#3aa0ff] transition-colors" />
              <span>Learning Trail</span>
            </a>
            <a
              href="#assessments"
              onClick={(e) => handleSmoothScroll(e, 'assessments')}
              className="group flex items-center space-x-2 px-3.5 py-2 rounded-lg hover:text-slate-900 dark:hover:text-[#f2f5f9] hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <Clock className="w-4 h-4 text-slate-500 group-hover:text-[#0082fb] dark:text-[#8a94a6] dark:group-hover:text-[#3aa0ff] transition-colors" />
              <span>Timed Arena</span>
            </a>
            <a
              href="#copilot"
              onClick={(e) => handleSmoothScroll(e, 'copilot')}
              className="group flex items-center space-x-2 px-3.5 py-2 rounded-lg hover:text-slate-900 dark:hover:text-[#f2f5f9] hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4 text-slate-500 group-hover:text-[#0082fb] dark:text-[#8a94a6] dark:group-hover:text-[#3aa0ff] transition-colors" />
              <span>Study Copilot</span>
            </a>
            <a
              href="#verify"
              onClick={(e) => handleSmoothScroll(e, 'verify')}
              className="group flex items-center space-x-2 px-3.5 py-2 rounded-lg hover:text-slate-900 dark:hover:text-[#f2f5f9] hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-slate-500 group-hover:text-[#0082fb] dark:text-[#8a94a6] dark:group-hover:text-[#3aa0ff] transition-colors" />
              <span>Verification</span>
            </a>
          </nav>

          {/* Action CTAs: Properly Aligned Buttons with Clear Color Distinction */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Current mode: Dark (click for Light)' : 'Current mode: Light (click for Dark)'}
              className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-[#8a94a6] dark:hover:text-[#f2f5f9] dark:border-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to={dashboardPath}
                  className="h-10 px-5 rounded-lg bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs sm:text-sm font-semibold inline-flex items-center space-x-2 transition-all duration-200 glow-blue shadow-md active:scale-98"
                >
                  <Layers className="w-4 h-4" />
                  <span>Access Portal</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Distinct Color 1: Sign In (Sleek Bordered Button) */}
                <Link
                  to="/login"
                  className="h-10 px-4 rounded-lg bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 dark:bg-[#0d121c] dark:hover:bg-[#161f30] dark:border-white/15 dark:hover:border-white/30 dark:text-white text-xs sm:text-sm font-semibold inline-flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer active:scale-98"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#0082fb] dark:text-[#3aa0ff]" />
                  <span>Sign In</span>
                </Link>

                {/* Distinct Color 2: Access Portal (Vibrant Electric Blue Primary CTA Button) */}
                <Link
                  to="/login"
                  className="h-10 px-5 rounded-lg bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs sm:text-sm font-semibold inline-flex items-center space-x-1.5 transition-all duration-200 glow-blue shadow-md cursor-pointer border border-[#0082fb]/50 active:scale-98"
                >
                  <span>Access Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION (Aurora drift, vertical scanbeam, precision headline, interactive live showcase) */}
      <HeroSection onExploreClick={(e) => handleSmoothScroll(e, 'courses')} />

      {/* 2. INSTITUTIONAL PARTNERS MARQUEE (Continuous infinite scroll) */}
      <PartnerMarqueeSection />

      {/* 3. METRICS RIBBON (01 Projects, 02 Campuses, 03 Active Learners, 04 Verified Credentials) */}
      <MetricsRibbonSection />

      {/* 4. EIGHT DISCIPLINES & SECTORS */}
      <DisciplinesSection />

      {/* 5. FEATURED CURRICULA */}
      <CoursesSection courses={FEATURED_COURSES} />

      {/* 6. SEQUENTIAL MOUNTAIN TRAIL JOURNEY */}
      <JourneySection />

      {/* 7. TIMED ASSESSMENTS ARENA */}
      <AssessmentsSection />

      {/* 8. ROLE-SCOPED AI STUDY COPILOT */}
      <CopilotSection />

      {/* 9. CRYPTOGRAPHIC VERIFICATION */}
      <VerifySection />

      {/* 10. MULTI-ROLE WORKSPACES */}
      <WorkspacesSection />

      {/* 11. TRAJECTORY: HOW WE GET BETTER (6-Step Core Principles) */}
      <TrajectorySection />

      {/* 13. TESTIMONIALS: WHAT OUR ENGINEERS & INTERNS SAY */}
      <TestimonialsSection />

      {/* 14. "LET'S BUILD SOMETHING TOGETHER" CONVERSION CTA BANNER */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200 dark:border-white/10 relative overflow-hidden">
        <div className="p-10 md:p-16 rounded-3xl bg-gradient-to-br from-slate-100 via-white to-sky-50 dark:from-[#06080c] dark:via-[#0b0f16] dark:to-[#081c3a] border border-slate-200 dark:border-[#0082fb]/30 text-center relative overflow-hidden shadow-xl dark:glow-blue">
          <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#0082fb]/20 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#8457f5]/20 blur-[100px]" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <span className="text-label font-mono uppercase tracking-widest text-[#0082fb] dark:text-[#3aa0ff] bg-[#0082fb]/10 dark:bg-[#0082fb]/15 px-3 py-1 rounded-full border border-[#0082fb]/30">
              Academic LMS Platform · Learnflow
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-[#f2f5f9] tracking-tight">
              Start your learning journey today.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-[#8a94a6] leading-relaxed max-w-xl mx-auto">
              Master high-concurrency systems, distributed databases, and cloud infrastructure with verifiable progress and cryptographic credentials. Built as an internship assignment.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto h-12 px-8 rounded-lg bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs font-semibold transition-all duration-200 flex items-center justify-center space-x-2 glow-blue shadow-md"
              >
                <span>Launch Student &amp; Faculty Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/courses"
                className="w-full sm:w-auto h-12 px-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 dark:bg-white/5 dark:hover:bg-white/10 dark:text-[#f2f5f9] dark:border-white/10 text-xs font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <span>Explore Curricula</span>
                <BookOpen className="w-4 h-4 text-slate-500 dark:text-[#8a94a6]" />
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
