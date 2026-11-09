import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { Course } from '../types';
import { ProgressRing } from '../components/common/ProgressRing';
import { AdaptiveGrid } from '../components/common/AdaptiveGrid';
import { UserAvatar } from '../components/common/UserAvatar';
import { PersonalizedProgressTelemetry } from '../components/dashboard/PersonalizedProgressTelemetry';
import { PageHeader, Card } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { dataCache } from '../utils/dataCache';
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
} from 'lucide-react';

export const MyLearningPage: React.FC = () => {
  const { user } = useAuthStore();
  const cachedMyCourses = dataCache.get<Course[]>('my_courses');
  const cachedCatalog = dataCache.get<Course[]>('catalog_courses');

  const [courses, setCourses] = useState<Course[]>(() => cachedMyCourses || []);
  const [catalogCourses, setCatalogCourses] = useState<Course[]>(() => cachedCatalog || []);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedMyCourses);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const fetchData = async () => {
    // Only show loading spinner if no cached data exists
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

  const enrolledIds = new Set(courses.map((c) => c.id));
  const availableCourses = catalogCourses.filter((c) => !enrolledIds.has(c.id));

  const handleQuickEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    setEnrollError(null);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans space-y-8"
    >
      {/* Personalized Welcome Banner with Character Avatar */}
      <div className="bg-gradient-to-r from-sky-500/10 via-[#0082fb]/5 to-transparent border border-[#0082fb]/20 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          <UserAvatar
            user={user}
            size="xl"
            showStatus={true}
            className="ring-4 ring-[#0082fb]/20 shadow-md shrink-0 hidden sm:inline-flex"
          />
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#0082fb]/10 text-[#0082fb] dark:text-[#3aa0ff] text-xs font-mono font-medium mb-2.5 border border-[#0082fb]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Student Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome, {user?.first_name || 'Learner'}!
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Track your sequential progress, climb the mountain trail, and access your verified course certificates.
            </p>
          </div>
        </div>

        {courses.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/my-journey"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#0082fb] hover:bg-[#155dfc] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors glow-blue cursor-pointer"
            >
              <Compass className="w-4 h-4 text-white" />
              <span>Mountain Trail</span>
            </Link>
            <Link
              to="/courses"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/10 rounded-lg text-xs font-semibold transition-colors"
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Full Catalog</span>
            </Link>
          </div>
        )}
      </div>

      {enrollError && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-4 flex items-start space-x-3 text-amber-900 dark:text-amber-200 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <strong className="font-semibold">Enrollment Notice:</strong> {enrollError}
          </div>
        </div>
      )}

      {/* Personalized Telemetry & Visual Analytics Section */}
      {!isLoading && (
        <PersonalizedProgressTelemetry user={user} courses={courses} />
      )}

      {/* Active Enrolled Courses Section */}
      <div>
        <PageHeader
          title="Active Curricula"
          subtitle="Your actively enrolled curricula and milestone completion status."
        />

        {isLoading ? (
          <AdaptiveGrid variant="normal">
            {[1, 2].map((n) => (
              <div key={n} className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
            ))}
          </AdaptiveGrid>
        ) : courses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
            <BookOpen className="w-12 h-12 text-[#0082fb] mx-auto mb-2 opacity-80" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">You have no active enrollments yet</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Choose your target curriculum below to personalize your learning path and unlock lessons, code labs, and AI study guidance.
            </p>
          </div>
        ) : (
          <AdaptiveGrid variant="normal">
            {courses.map((course) => {
              const pct = Math.round(course.progress_percentage || 0);
              return (
                <Card
                  key={course.id}
                  className="p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-meta font-mono font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded border border-sky-100 dark:border-sky-900/60 inline-flex items-center gap-1">
                            {course.difficulty?.toLowerCase() === 'beginner' ? (
                              <Zap className="w-3 h-3 text-sky-500" />
                            ) : course.difficulty?.toLowerCase() === 'advanced' ? (
                              <Award className="w-3 h-3 text-amber-500" />
                            ) : (
                              <Layers className="w-3 h-3 text-sky-500" />
                            )}
                            <span>{course.difficulty}</span>
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                          {course.title}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 block">
                          {pct === 100 ? 'Milestone Complete' : `${pct}% Sequential Progress`}
                        </span>
                      </div>

                      <div className="shrink-0">
                        <ProgressRing
                          value={pct}
                          size={56}
                          strokeWidth={5}
                          label={`${course.title} progress`}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <Link
                      to={`/courses/${course.id}`}
                      className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center space-x-1"
                    >
                      <span>{pct === 100 ? 'Review Syllabus' : 'Open Syllabus'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      to={pct === 100 ? '/my-certificates' : `/courses/${course.id}`}
                      className={`h-8 px-3.5 rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer ${
                        pct === 100
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-[#0082fb] hover:bg-[#155dfc] text-white glow-blue'
                      }`}
                    >
                      {pct === 100 ? (
                        <>
                          <Award className="w-3.5 h-3.5 text-amber-200" />
                          <span>View Certificate</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Continue</span>
                        </>
                      )}
                    </Link>
                  </div>
                </Card>
              );
            })}
          </AdaptiveGrid>
        )}
      </div>

      {/* Available Curricula to Personalize Content */}
      {availableCourses.length > 0 && (
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Personalize Your Curricula
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select and add new courses directly to your personalized learning path.
              </p>
            </div>
            <Link
              to="/courses"
              className="text-xs font-semibold text-[#0082fb] dark:text-[#3aa0ff] hover:underline flex items-center gap-1"
            >
              <span>Explore all catalog tracks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <AdaptiveGrid variant="normal">
            {availableCourses.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-xl bg-white dark:bg-[#06080c] border border-slate-200 dark:border-white/10 flex flex-col justify-between hover:border-[#0082fb]/50 transition-colors shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-meta font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400">
                      {c.difficulty}
                    </span>
                    <span className="text-meta font-mono text-slate-400">
                      {c.modules ? `${c.modules.length} Modules` : 'Accredited Track'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {c.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <Link
                    to={`/courses/${c.id}`}
                    className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    View Syllabus
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleQuickEnroll(c.id)}
                    disabled={enrollingId === c.id}
                    className="h-8 px-3.5 rounded-md text-xs font-semibold bg-[#0082fb] hover:bg-[#155dfc] text-white flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-60 shadow-xs"
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
            ))}
          </AdaptiveGrid>
        </div>
      )}
    </motion.div>
  );
};
