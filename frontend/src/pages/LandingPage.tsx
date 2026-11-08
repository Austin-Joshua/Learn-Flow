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
} from 'lucide-react';
import {
  HeroSection,
  CoursesSection,
  JourneySection,
  AssessmentsSection,
  CopilotSection,
  VerifySection,
  WorkspacesSection,
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-sky-500 selection:text-white transition-colors duration-200">
      {/* 0. DEDICATED LANDING TOP BAR */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center space-x-2.5 shrink-0">
            <div className="w-8 h-8 rounded-sm bg-slate-800 border border-slate-700/80 flex items-center justify-center text-sky-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="flex items-baseline space-x-1.5 whitespace-nowrap">
              <span className="text-base font-semibold tracking-tight text-white">Learnflow</span>
              <span className="text-label font-mono text-slate-400 tracking-normal hidden sm:inline">[LMS]</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-1" aria-label="Landing page sections">
            <a
              href="#courses"
              onClick={(e) => handleSmoothScroll(e, 'courses')}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center space-x-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Courses</span>
            </a>
            <a
              href="#journey"
              onClick={(e) => handleSmoothScroll(e, 'journey')}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center space-x-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Mountain Trail</span>
            </a>
            <a
              href="#assessments"
              onClick={(e) => handleSmoothScroll(e, 'assessments')}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center space-x-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Arena</span>
            </a>
            <a
              href="#copilot"
              onClick={(e) => handleSmoothScroll(e, 'copilot')}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center space-x-1.5"
            >
              <Bot className="w-3.5 h-3.5 text-sky-400" />
              <span>Study Copilot</span>
            </a>
            <a
              href="#verify"
              onClick={(e) => handleSmoothScroll(e, 'verify')}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Verify</span>
            </a>
          </nav>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link
                  to={dashboardPath}
                  className="h-8 px-3.5 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Open Workspace</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/courses"
                  className="hidden sm:inline-flex text-xs font-medium text-slate-300 hover:text-white px-2.5 py-1.5 transition-colors"
                >
                  Catalog
                </Link>
                <Link
                  to="/login"
                  className="h-8 px-3.5 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Landing Sections */}
      <HeroSection onExploreClick={(e) => handleSmoothScroll(e, 'courses')} />
      <CoursesSection courses={FEATURED_COURSES} />
      <JourneySection />
      <AssessmentsSection />
      <CopilotSection />
      <VerifySection />
      <WorkspacesSection />

      {/* Landing Footer */}
      <Footer />
    </div>
  );
};
