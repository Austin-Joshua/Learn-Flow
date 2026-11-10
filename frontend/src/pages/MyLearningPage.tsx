import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { Course } from '../types';
import { ProgressRing } from '../components/common/ProgressRing';
import { AdaptiveGrid } from '../components/common/AdaptiveGrid';
import { CourseQuickPeekModal } from '../components/course/CourseQuickPeekModal';
import { useAuthStore } from '../store/authStore';
import { dataCache } from '../utils/dataCache';
import { getCourseCoverImage } from '../utils/courseImages';
import { getCourseDetailUrl } from '../utils/courseUrls';
import {
  BookOpen,
  PlayCircle,
  ArrowRight,
  Compass,
  Award,
  Sparkles,
  PlusCircle,
  AlertCircle,
  Loader2,
  Zap,
  Layers,
  Search,
  SlidersHorizontal,
  Flame,
  TrendingUp,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  ListTree
} from 'lucide-react';

export const MyLearningPage: React.FC = () => {
  const { user, hasRole } = useAuthStore();
  const navigate = useNavigate();

  const cachedMyCourses = dataCache.get<Course[]>('my_courses');
  const cachedCatalog = dataCache.get<Course[]>('catalog_courses');

  const [courses, setCourses] = useState<Course[]>(() => cachedMyCourses || []);
  const [catalogCourses, setCatalogCourses] = useState<Course[]>(() => cachedCatalog || []);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedMyCourses);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  // Quick-Peek Detailed Modal State
  const [peekCourse, setPeekCourse] = useState<Course | null>(null);
  const [peekTab, setPeekTab] = useState<'syllabus' | 'continue'>('continue');

  // Classification & Filtering States for Newly Added / Valued Courses
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchData = async () => {
    if (!dataCache.get('my_courses')) {
      setIsLoading(true);
    }
    try {
      const [myRes, catalogRes] = await Promise.all([
        api.enrollments.myCourses(),
        api.courses.list().catch(() => ({ data: [] })),
      ]);
      setCourses(myRes.data);
      setCatalogCourses(catalogRes.data);
      dataCache.set('my_courses', myRes.data);
      dataCache.set('catalog_courses', catalogRes.data);
    } catch (err) {
      console.error('Failed to load portal data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const enrolledIds = useMemo(() => new Set(courses.map((c) => c.id)), [courses]);
  const availableCourses = useMemo(
    () => catalogCourses.filter((c) => !enrolledIds.has(c.id)),
    [catalogCourses, enrolledIds]
  );

  // User Academic Mastery & Progress Calculations
  const completedCourses = useMemo(
    () => courses.filter((c) => (c.progress_percentage || 0) >= 100),
    [courses]
  );
  const inProgressCourses = useMemo(
    () => courses.filter((c) => (c.progress_percentage || 0) < 100),
    [courses]
  );
  const overallCompletionPct = useMemo(() => {
    if (courses.length === 0) return 0;
    const total = courses.reduce((acc, c) => acc + (c.progress_percentage || 0), 0);
    return Math.round(total / courses.length);
  }, [courses]);

  // Contextual "What to Read Next" Candidate based on active reading
  const nextReadingCandidate = useMemo(() => {
    if (inProgressCourses.length === 0) return null;
    // Prefer course with highest active non-100% progress
    const sorted = [...inProgressCourses].sort(
      (a, b) => (b.progress_percentage || 0) - (a.progress_percentage || 0)
    );
    const topCourse = sorted[0];
    const firstModule = topCourse.modules?.[0];
    const firstLesson = firstModule?.lessons?.[0];
    return {
      course: topCourse,
      moduleTitle: firstModule?.title || 'Active Curriculum Track',
      lessonTitle: firstLesson?.title || 'Sequential Course Module',
      lessonId: firstLesson?.id,
      duration: firstLesson?.duration_minutes || 25,
    };
  }, [inProgressCourses]);

  // Two-Zone Card Touch Interaction Handler
  const handleCardInteraction = (
    e: React.MouseEvent<HTMLDivElement>,
    course: Course
  ) => {
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button')) {
      return; // allow direct button/link actions without opening modal
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeft = clickX < rect.width * 0.42;

    setPeekTab(isLeft ? 'syllabus' : 'continue');
    setPeekCourse(course);
  };

  const handlePeekContinue = (course: Course) => {
    setPeekCourse(null);
    if ((course.progress_percentage || 0) >= 100) {
      navigate('/my-certificates');
    } else if (course.modules?.[0]?.lessons?.[0]?.id) {
      navigate(`/lessons/${course.modules[0].lessons[0].id}`);
    } else {
      navigate(getCourseDetailUrl(course));
    }
  };

  const handlePeekSyllabus = (course: Course) => {
    setPeekCourse(null);
    navigate(getCourseDetailUrl(course));
  };

  const handleQuickEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    setEnrollError(null);
    const targetCourse = availableCourses.find((c) => c.id === courseId);
    if (user && targetCourse && targetCourse.instructor_id === user.id) {
      setEnrollError('Faculty policy restriction: Instructors cannot enroll in their own courses. You may only enroll in courses authored by other faculty.');
      setEnrollingId(null);
      return;
    }
    try {
      await api.enrollments.enroll(courseId);
      await fetchData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : 'Failed to enroll in course.';
      setEnrollError(String(msg || 'Failed to enroll in course.'));
    } finally {
      setEnrollingId(null);
    }
  };

  // Domain Categorization Classifier
  const matchDomain = (course: Course, domain: string): boolean => {
    if (domain === 'all') return true;
    const s = `${course.title} ${course.slug} ${course.description}`.toLowerCase();
    switch (domain) {
      case 'programming':
        return s.includes('python') || s.includes('java') || s.includes('c ') || s.includes('c programming') || s.includes('typescript') || s.includes('react');
      case 'dsa':
        return s.includes('data structure') || s.includes('algorithm') || s.includes('graph') || s.includes('tree');
      case 'oop':
        return s.includes('oop') || s.includes('object-oriented') || s.includes('design pattern') || s.includes('architecture');
      case 'systems':
        return s.includes('operating system') || s.includes('kernel') || s.includes('database') || s.includes('system design') || s.includes('concurrency');
      case 'cloud':
        return s.includes('cloud') || s.includes('container') || s.includes('kubernetes') || s.includes('sre') || s.includes('microservice');
      default:
        return true;
    }
  };

  // Filter & Sort Available Courses
  const filteredAvailableCourses = useMemo(() => {
    return availableCourses
      .filter((c) => {
        // Faculty policy: Instructors learn from peer courses, exclude own authored courses from recommendations
        if (user && hasRole('instructor') && c.instructor_id === user.id) return false;
        if (!matchDomain(c, selectedDomain)) return false;
        if (selectedDifficulty !== 'all' && c.difficulty?.toLowerCase() !== selectedDifficulty) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches = c.title.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'alpha_asc':
            return a.title.localeCompare(b.title);
          case 'alpha_desc':
            return b.title.localeCompare(a.title);
          case 'difficulty_asc': {
            const diffMap: { [k: string]: number } = { beginner: 1, intermediate: 2, advanced: 3 };
            return (diffMap[a.difficulty?.toLowerCase()] || 2) - (diffMap[b.difficulty?.toLowerCase()] || 2);
          }
          case 'difficulty_desc': {
            const diffMap: { [k: string]: number } = { beginner: 1, intermediate: 2, advanced: 3 };
            return (diffMap[b.difficulty?.toLowerCase()] || 2) - (diffMap[a.difficulty?.toLowerCase()] || 2);
          }
          case 'popularity':
            return (b.modules?.length || 0) - (a.modules?.length || 0);
          case 'relevance':
          default:
            return 0;
        }
      });
  }, [availableCourses, selectedDomain, selectedDifficulty, sortBy, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-7xl mx-auto font-sans space-y-4 sm:space-y-5"
    >
      {/* ========================================================================= */}
      {/* 1. ACADEMIC MASTERY & CREDENTIAL SHOWCASE (Replaces Old Image 2 & Image 3) */}
      {/* ========================================================================= */}
      <div className="skeuo-card bg-white dark:bg-[#060b13] border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 sm:pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-medium mb-1.5 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Academic Milestone Ledger</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Personalized Learning Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Sequential course progression, verifiable credential collection, and personalized curriculum tracks.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 w-full sm:w-auto shrink-0">
            <Link
              to="/my-journey"
              className="skeuo-button-secondary inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-sky-500" />
              <span>Mountain Trail</span>
            </Link>
            <Link
              to="/my-certificates"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-all shadow-xs cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Credentials ({completedCourses.length})</span>
            </Link>
            <Link
              to="/courses"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0082fb] hover:bg-[#155dfc] text-white transition-all glow-blue shadow-md cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Course Catalog</span>
            </Link>
          </div>
        </div>

        {/* 4-Metric Tactile Visual Analytics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-5">
          {/* 1. Overall Completion Progress */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09101b] border border-slate-200/80 dark:border-white/5 flex items-center gap-3">
            <div className="shrink-0">
              <ProgressRing
                value={overallCompletionPct}
                size={46}
                strokeWidth={4.5}
                label="Overall Completion"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Completion</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {overallCompletionPct}% Overall
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {courses.length} Active Course{courses.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* 2. Certificate Collection */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09101b] border border-slate-200/80 dark:border-white/5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Certificates</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {completedCourses.length} Minted
              </div>
              <Link to="/my-certificates" className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-semibold block truncate">
                View Ledger &rarr;
              </Link>
            </div>
          </div>

          {/* 3. Learning Momentum / Streak */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09101b] border border-slate-200/80 dark:border-white/5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-500 flex items-center justify-center shrink-0 shadow-xs">
              <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Study Streak</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                5 Days Active
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                &bull; Velocity High
              </div>
            </div>
          </div>

          {/* 4. Next Milestone Gateway */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09101b] border border-slate-200/80 dark:border-white/5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-500 flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-purple-500" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Next Gateway</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {inProgressCourses.length > 0 ? 'Diagnostic Check' : 'Summit Achieved'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                Sequential Path
              </div>
            </div>
          </div>
        </div>
      </div>

      {enrollError && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-4 flex items-start space-x-3 text-amber-900 dark:text-amber-200 text-xs shadow-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <strong className="font-semibold">Enrollment Notice:</strong> {enrollError}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WHAT TO READ NEXT (Context-Aware Recommendation based on Active Reading) */}
      {/* ========================================================================= */}
      {nextReadingCandidate && (
        <div className="skeuo-card bg-gradient-to-r from-sky-500/10 via-emerald-500/5 to-transparent border border-sky-500/20 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#0082fb]/20 text-[#0082fb] dark:text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400 font-bold bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-500/20">
                  What to Read Next
                </span>
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{nextReadingCandidate.duration} min read</span>
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {nextReadingCandidate.course.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                Continue reading: <span className="font-semibold text-sky-600 dark:text-sky-300">{nextReadingCandidate.lessonTitle}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setPeekTab('syllabus');
                setPeekCourse(nextReadingCandidate.course);
              }}
              className="skeuo-button-secondary px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
            >
              <span>Peek Syllabus</span>
            </button>

            <button
              type="button"
              onClick={() => handlePeekContinue(nextReadingCandidate.course)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0082fb] hover:bg-[#155dfc] text-white flex items-center gap-1.5 shadow-md glow-blue cursor-pointer transition-all active:scale-98"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Resume Reading</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ACTIVE CURRICULUM (Renamed from Curricula; Two-Zone Touch & Hover Card) */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Active Curriculum
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Touch the left side to preview syllabus; touch center/right to view progress details and continue.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
            {courses.length} Active Track{courses.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading ? (
          <AdaptiveGrid variant="normal">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-60 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
            ))}
          </AdaptiveGrid>
        ) : courses.length === 0 ? (
          <div className="skeuo-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <BookOpen className="w-12 h-12 text-[#0082fb] mx-auto mb-2 opacity-80" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">You have no active enrollments yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Explore our comprehensive course catalog below to personalize your curriculum and begin your sequential learning path.
            </p>
          </div>
        ) : (
          <AdaptiveGrid variant="normal">
            {courses.map((course) => {
              const pct = Math.round(course.progress_percentage || 0);
              const isCompleted = pct === 100;

              const coverImage = getCourseCoverImage(course);

              return (
                <div
                  key={course.id}
                  onClick={(e) => handleCardInteraction(e, course)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setPeekTab('continue');
                      setPeekCourse(course);
                    }
                  }}
                  className="skeuo-card group relative rounded-2xl border border-slate-200/90 dark:border-white/10 hover:border-[#0082fb]/50 dark:hover:border-sky-400/50 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden bg-white dark:bg-[#070c14] cursor-pointer select-none"
                >
                  {/* Two-Zone Visual Hover Hint Overlay (Touch Zones) */}
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <div className="col-span-2 bg-sky-500/[0.04] border-r border-sky-500/20 flex items-start p-2">
                      <span className="text-[9px] font-mono font-bold text-sky-600 dark:text-sky-300 bg-white/95 dark:bg-slate-950/95 px-1.5 py-0.5 rounded shadow-2xs">
                        &larr; Touch for Syllabus
                      </span>
                    </div>
                    <div className="col-span-3 bg-emerald-500/[0.03] flex items-start justify-end p-2">
                      <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-300 bg-white/95 dark:bg-slate-950/95 px-1.5 py-0.5 rounded shadow-2xs">
                        Touch for Continue &rarr;
                      </span>
                    </div>
                  </div>

                  <div>
                    {/* Thematic Cover Photo Banner with Glassmorphic Difficulty & Progress */}
                    <div className="h-40 sm:h-44 w-full relative overflow-hidden bg-slate-900">
                      <img
                        src={coverImage}
                        alt={course.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent pointer-events-none" />

                      {/* Top Badges Overlay */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md shadow-xs border ${
                          course.difficulty?.toLowerCase() === 'beginner'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                            : course.difficulty?.toLowerCase() === 'intermediate'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                            : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                        }`}>
                          {course.difficulty}
                        </span>

                        <div className="backdrop-blur-md bg-slate-950/80 p-1 rounded-full border border-white/20 shadow-xs">
                          <ProgressRing
                            value={pct}
                            size={40}
                            strokeWidth={4}
                            label={`${course.title} progress`}
                          />
                        </div>
                      </div>

                      {/* Bottom Title Overlay on Gradient */}
                      <div className="absolute bottom-3 inset-x-3.5 z-10 pointer-events-none">
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase tracking-wider block mb-0.5">
                          {isCompleted ? 'Milestone Complete' : `${pct}% Sequential Progress`}
                        </span>
                        <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug line-clamp-1 drop-shadow-sm group-hover:text-sky-200 transition-colors">
                          {course.title}
                        </h3>
                      </div>
                    </div>

                    {/* Description Body */}
                    <div className="p-4 sm:p-5 space-y-2">
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 pt-1">
                        <Layers className="w-3.5 h-3.5 text-sky-500" />
                        <span>{course.modules ? `${course.modules.length} Modules` : 'Sequential Modules'}</span>
                        <span>•</span>
                        <span>Verifiable Credential</span>
                      </div>
                    </div>
                  </div>

                  {/* Tactile Bottom Action Bar with Direct Click Interceptors */}
                  <div className="p-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2 mt-auto bg-slate-50/50 dark:bg-white/[0.02]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPeekTab('syllabus');
                        setPeekCourse(course);
                      }}
                      className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center space-x-1 cursor-pointer py-1"
                    >
                      <ListTree className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'Review Syllabus' : 'Open Syllabus'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePeekContinue(course);
                      }}
                      className={`h-8 px-3.5 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
                        isCompleted
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-[#0082fb] hover:bg-[#155dfc] text-white glow-blue shadow-md'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <Award className="w-3.5 h-3.5 text-amber-200" />
                          <span>Certificate</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Continue</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </AdaptiveGrid>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. VALUED & NEWLY ADDED COURSES (Multi-Aspect Filterable Catalog)         */}
      {/* ========================================================================= */}
      <div className="pt-7 border-t border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 text-xs font-mono font-medium mb-1.5 border border-sky-500/20">
              <Zap className="w-3.5 h-3.5 text-sky-500" />
              <span>Institutional Catalog Track</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Valued & Newly Added Courses
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Explore C, Python, Java, Data Structures, OOP, Operating Systems, and Cloud Computing from easy to masterclass.
            </p>
          </div>

          <Link
            to="/courses"
            className="text-xs font-semibold text-[#0082fb] dark:text-[#3aa0ff] hover:underline flex items-center gap-1 self-start md:self-auto cursor-pointer"
          >
            <span>Full Catalog View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Aspects Filter & Classification Deck */}
        <div className="skeuo-card bg-slate-50 dark:bg-[#070c14] border border-slate-200/80 dark:border-white/5 rounded-2xl p-3.5 sm:p-4 space-y-3">
          {/* Top Row: Search Input + Aspect Sorters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses by concept, language, or system..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0082fb]"
              />
            </div>

            {/* Sorter Selector */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <label htmlFor="sort-aspect" className="text-[11px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-sky-500" />
                <span>Sort Aspect:</span>
              </label>
              <select
                id="sort-aspect"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0082fb] cursor-pointer"
              >
                <option value="relevance">Relevance (Recommended)</option>
                <option value="popularity">Most Popular</option>
                <option value="alpha_asc">Title: A to Z</option>
                <option value="alpha_desc">Title: Z to A</option>
                <option value="difficulty_asc">Level: Easy to Masterclass</option>
                <option value="difficulty_desc">Level: Masterclass to Easy</option>
              </select>
            </div>
          </div>

          {/* Domain Category Filter Pills */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'All Curriculum' },
              { id: 'programming', label: 'C, Python & Java' },
              { id: 'dsa', label: 'Data Structures & Algorithms' },
              { id: 'oop', label: 'OOP & Clean Architecture' },
              { id: 'systems', label: 'Operating Systems & Kernels' },
              { id: 'cloud', label: 'Cloud Computing & Distributed' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDomain(d.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  selectedDomain === d.id
                    ? 'bg-[#0082fb] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/5'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtered Courses Grid with Interactive Touch & Quick-Peek */}
        {filteredAvailableCourses.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            No matching courses found for this criteria. Try selecting "All Curriculum" or clearing your search query.
          </div>
        ) : (
          <AdaptiveGrid variant="normal">
            {filteredAvailableCourses.map((c) => {
              const coverImage = getCourseCoverImage(c);

              return (
                <div
                  key={c.id}
                  onClick={(e) => handleCardInteraction(e, c)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setPeekTab('syllabus');
                      setPeekCourse(c);
                    }
                  }}
                  className="skeuo-card group relative rounded-2xl border border-slate-200/90 dark:border-white/10 hover:border-[#0082fb]/50 dark:hover:border-sky-400/50 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden bg-white dark:bg-[#070c14] cursor-pointer select-none"
                >
                  {/* Two-Zone Hover Hint */}
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <div className="bg-sky-500/[0.04] border-r border-sky-500/20 p-2">
                      <span className="text-[9px] font-mono text-sky-600 dark:text-sky-300 font-bold bg-white/95 dark:bg-slate-950/95 px-1.5 py-0.5 rounded shadow-2xs">
                        Syllabus Peek
                      </span>
                    </div>
                    <div className="bg-emerald-500/[0.02] p-2 flex justify-end">
                      <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-300 font-bold bg-white/95 dark:bg-slate-950/95 px-1.5 py-0.5 rounded shadow-2xs">
                        Quick Details
                      </span>
                    </div>
                  </div>

                  <div>
                    {/* Thematic Cover Photo Banner */}
                    <div className="h-40 sm:h-44 w-full relative overflow-hidden bg-slate-900">
                      <img
                        src={coverImage}
                        alt={c.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent pointer-events-none" />

                      {/* Floating Badges */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md shadow-xs border ${
                          c.difficulty?.toLowerCase() === 'beginner'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                            : c.difficulty?.toLowerCase() === 'intermediate'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                            : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                        }`}>
                          {c.difficulty}
                        </span>

                        <div className="backdrop-blur-md bg-slate-900/80 border border-white/15 px-2.5 py-0.5 rounded-full text-slate-200 text-[10px] font-mono shadow-xs">
                          <span>{c.modules ? `${c.modules.length} Modules` : 'Accredited Track'}</span>
                        </div>
                      </div>

                      {/* Bottom Title Overlay on Gradient */}
                      <div className="absolute bottom-3 inset-x-3.5 z-10 pointer-events-none">
                        <span className="text-[10px] font-mono text-sky-400 font-semibold uppercase tracking-wider block mb-0.5">
                          Featured Curriculum
                        </span>
                        <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug line-clamp-1 drop-shadow-sm group-hover:text-sky-200 transition-colors">
                          {c.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 space-y-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-1">
                        <div className="flex items-center gap-1 truncate">
                          <span className="text-slate-400">Author:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                            {c.instructor_name || 'Faculty Colleague'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Layers className="w-3 h-3 text-sky-500" />
                          <span>{c.modules ? `${c.modules.length}M` : '6M'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2 mt-auto bg-slate-50/50 dark:bg-white/[0.02]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPeekTab('syllabus');
                        setPeekCourse(c);
                      }}
                      className="text-xs text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ListTree className="w-3.5 h-3.5" />
                      <span>View Syllabus</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickEnroll(c.id);
                      }}
                      disabled={enrollingId === c.id}
                      className="h-8 px-4 rounded-xl text-xs font-semibold bg-[#0082fb] hover:bg-[#155dfc] text-white flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-60 shadow-md glow-blue active:scale-95"
                    >
                      {enrollingId === c.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Enrolling...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Enroll Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </AdaptiveGrid>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE COURSE QUICK-PEEK MODAL                                    */}
      {/* ========================================================================= */}
      <CourseQuickPeekModal
        course={peekCourse}
        isOpen={Boolean(peekCourse)}
        initialTab={peekTab}
        onClose={() => setPeekCourse(null)}
        onContinue={handlePeekContinue}
        onViewSyllabus={handlePeekSyllabus}
      />
    </motion.div>
  );
};
