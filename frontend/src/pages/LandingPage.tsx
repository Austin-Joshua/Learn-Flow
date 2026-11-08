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
  ProEduvateHubSection,
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
    <div className="min-h-screen bg-[#020308] text-[#f2f5f9] font-sans selection:bg-[#0082fb] selection:text-white transition-colors duration-200">
      {/* 0. PROEDUVATE SIGNATURE STICKY GLASS HEADER */}
      <header className="sticky top-0 z-50 bg-[#020308]/90 backdrop-blur-md border-b border-white/10 text-[#f2f5f9] select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center space-x-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#0082fb]/20 border border-[#0082fb]/40 flex items-center justify-center text-[#3aa0ff] glow-blue">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-bold tracking-tight text-[#f2f5f9]">Learnflow</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-[#0082fb]/15 text-[#3aa0ff] border border-[#0082fb]/30">
                  LMS
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8a94a6]">ProEduvate Product Ecosystem</span>
            </div>
          </Link>

          {/* Underlined Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 text-xs font-medium text-[#8a94a6]" aria-label="Landing page sections">
            <a
              href="#disciplines"
              onClick={(e) => handleSmoothScroll(e, 'disciplines')}
              className="relative px-3 py-1.5 hover:text-[#f2f5f9] transition-colors after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-[#0082fb] after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
            >
              Eight Sectors
            </a>
            <a
              href="#courses"
              onClick={(e) => handleSmoothScroll(e, 'courses')}
              className="relative px-3 py-1.5 hover:text-[#f2f5f9] transition-colors after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-[#0082fb] after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
            >
              Curricula
            </a>
            <a
              href="#journey"
              onClick={(e) => handleSmoothScroll(e, 'journey')}
              className="relative px-3 py-1.5 hover:text-[#f2f5f9] transition-colors after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-[#0082fb] after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
            >
              Mountain Trail
            </a>
            <a
              href="#assessments"
              onClick={(e) => handleSmoothScroll(e, 'assessments')}
              className="relative px-3 py-1.5 hover:text-[#f2f5f9] transition-colors after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-[#0082fb] after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
            >
              Arena
            </a>
            <a
              href="#copilot"
              onClick={(e) => handleSmoothScroll(e, 'copilot')}
              className="relative px-3 py-1.5 hover:text-[#f2f5f9] transition-colors after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-[#0082fb] after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
            >
              Study Copilot
            </a>
            <a
              href="#verify"
              onClick={(e) => handleSmoothScroll(e, 'verify')}
              className="relative px-3 py-1.5 hover:text-[#f2f5f9] transition-colors after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-[#0082fb] after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
            >
              Verify
            </a>
            <a
              href="#proeduvate-hub"
              onClick={(e) => handleSmoothScroll(e, 'proeduvate-hub')}
              className="relative px-3 py-1.5 hover:text-[#f2f5f9] transition-colors after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-[#8457f5] after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
            >
              Products Hub
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center space-x-3">
            <a
              href="https://www.proeduvate.in/"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-mono text-[#8a94a6] hover:text-[#f2f5f9] border border-white/5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8457f5]" />
              <span>proeduvate.in</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
            </a>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#8a94a6] hover:text-[#f2f5f9] flex items-center justify-center transition-colors cursor-pointer border border-white/5"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#8a94a6]" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link
                  to={dashboardPath}
                  className="h-9 px-4 rounded-lg bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs font-semibold inline-flex items-center space-x-1.5 transition-all duration-200 glow-blue shadow-lg"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Open Portal</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/courses"
                  className="hidden sm:inline-flex text-xs font-medium text-[#8a94a6] hover:text-[#f2f5f9] px-2.5 py-1.5 transition-colors"
                >
                  Catalog
                </Link>
                <Link
                  to="/login"
                  className="h-9 px-4 rounded-lg bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs font-semibold inline-flex items-center space-x-1.5 transition-all duration-200 glow-blue shadow-lg"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3 h-3" />
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

      {/* 4. EIGHT DISCIPLINES & SECTORS (ProEduvate 8-sector interactive inspection showcase) */}
      <DisciplinesSection />

      {/* 5. FEATURED CURRICULA */}
      <CoursesSection courses={FEATURED_COURSES} />

      {/* 6. SEQUENTIAL MOUNTAIN TRAIL JOURNEY */}
      <JourneySection />

      {/* 7. TIMED PROCTORED ARENA */}
      <AssessmentsSection />

      {/* 8. ROLE-SCOPED AI STUDY COPILOT */}
      <CopilotSection />

      {/* 9. CRYPTOGRAPHIC VERIFICATION */}
      <VerifySection />

      {/* 10. MULTI-ROLE WORKSPACES */}
      <WorkspacesSection />

      {/* 11. PROEDUVATE HUB: ONE HUB. TWO BRANCHES. (Products & Services) */}
      <ProEduvateHubSection />

      {/* 12. TRAJECTORY: HOW WE GET BETTER (6-Step Core Principles) */}
      <TrajectorySection />

      {/* 13. TESTIMONIALS: WHAT OUR ENGINEERS & INTERNS SAY */}
      <TestimonialsSection />

      {/* 14. "LET'S BUILD SOMETHING TOGETHER" CONVERSION CTA BANNER */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10 relative overflow-hidden">
        <div className="p-10 md:p-16 rounded-3xl bg-gradient-to-br from-[#06080c] via-[#0b0f16] to-[#081c3a] border border-[#0082fb]/30 text-center relative overflow-hidden glow-blue">
          <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#0082fb]/20 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#8457f5]/20 blur-[100px]" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <span className="text-label font-mono uppercase tracking-widest text-[#3aa0ff] bg-[#0082fb]/15 px-3 py-1 rounded-full border border-[#0082fb]/30">
              ProEduvate Ecosystem · Learnflow LMS
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-[#f2f5f9] tracking-tight">
              Let&apos;s build something together.
            </h2>
            <p className="text-sm sm:text-base text-[#8a94a6] leading-relaxed max-w-xl mx-auto">
              Whether you are an engineering student preparing for high-concurrency architecture, an academic institution deploying tamper-proof assessments, or an enterprise seeking our craft—we are ready.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto h-12 px-8 rounded-lg bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs font-semibold transition-all duration-200 flex items-center justify-center space-x-2 glow-blue"
              >
                <span>Launch Student &amp; Faculty Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://www.proeduvate.in/"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto h-12 px-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#f2f5f9] border border-white/10 text-xs font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <span>Visit ProEduvate Headquarters</span>
                <ExternalLink className="w-4 h-4 text-[#8a94a6]" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 15. LANDING FOOTER */}
      <Footer />
    </div>
  );
};
