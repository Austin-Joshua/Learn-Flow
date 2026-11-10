import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { Course } from '../types';
import { useAuthStore } from '../store/authStore';
import { AdaptiveGrid } from '../components/common/AdaptiveGrid';
import { dataCache } from '../utils/dataCache';
import { getCourseCoverImage, handleCourseImageError } from '../utils/courseImages';
import { getCourseDetailUrl } from '../utils/courseUrls';
import {
  BookOpen,
  Search,
  Users,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  Layers,
  Sparkles,
} from 'lucide-react';

export const CourseCatalogPage: React.FC = () => {
  const cachedCourses = dataCache.get<Course[]>('catalog_list');
  const [courses, setCourses] = useState<Course[]>(() => cachedCourses || []);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(!cachedCourses);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const { user, isAuthenticated, hasRole } = useAuthStore();
  const navigate = useNavigate();

  const fetchCourses = async () => {
    if (!difficultyFilter && !searchQuery && !dataCache.get('catalog_list')) {
      setIsLoading(true);
    } else if (difficultyFilter || searchQuery) {
      setIsLoading(true);
    }
    try {
      const res = await api.courses.list({
        difficulty: difficultyFilter || undefined,
        search: searchQuery || undefined,
      });
      setCourses(res.data);
      if (!difficultyFilter && !searchQuery) {
        dataCache.set('catalog_list', res.data);
      }

      if (isAuthenticated) {
        const myRes = await api.enrollments.myCourses();
        setEnrolledCourseIds(new Set(myRes.data.map((c) => c.id)));
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [difficultyFilter, searchQuery]);

  const handleEnroll = async (courseId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const targetCourse = courses.find((c) => c.id === courseId);
    if (user && targetCourse && targetCourse.instructor_id === user.id) {
      setEnrollError('Faculty policy restriction: Instructors cannot enroll in their own courses. You may only enroll in courses authored by other faculty.');
      return;
    }
    setEnrollingId(courseId);
    setEnrollError(null);
    try {
      await api.enrollments.enroll(courseId);
      setEnrolledCourseIds(new Set([...enrolledCourseIds, courseId]));
      const enrolledCourse = courses.find((c) => c.id === courseId);
      navigate(getCourseDetailUrl(enrolledCourse || courseId));
    } catch (err: unknown) {
      setEnrollError(axios.isAxiosError(err) && err.response?.data?.detail ? String(err.response.data.detail) : 'Failed to enroll in course.');
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-7xl mx-auto font-sans"
    >
      {/* Hero Header */}
      <div className="mb-3 sm:mb-4 text-left sm:flex sm:items-end sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5 sm:pb-3">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-medium mb-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Curated Computing Curriculum</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Explore Courses &amp; Learning Paths
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            Master distributed systems, frontend engineering, database architectures, and algorithm design with verifiable credentials.
          </p>
        </div>
      </div>

      {enrollError && (
        <div className="mb-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 flex items-start space-x-3 text-rose-800 dark:text-rose-300">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Enrollment Prerequisite Alert</h4>
            <p className="text-xs mt-0.5">{enrollError}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center mb-6 sm:mb-8">
        <div className="relative w-full sm:w-72 lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search courses or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {['', 'beginner', 'intermediate', 'advanced'].map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer shrink-0 ${
                difficultyFilter === diff
                  ? 'bg-sky-600 text-white shadow-xs font-semibold'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {diff === '' ? 'All Levels' : diff}
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <AdaptiveGrid variant="normal">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-72 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </AdaptiveGrid>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No courses found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try modifying your search or difficulty filter.</p>
        </div>
      ) : (
        <AdaptiveGrid variant="normal">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            const isOwnCourse = !!(user && user.id === course.instructor_id);
            const coverImage = getCourseCoverImage(course);

            return (
              <div
                key={course.id}
                className="skeuo-card group relative rounded-2xl border border-slate-200/90 dark:border-white/10 hover:border-[#0082fb]/50 dark:hover:border-sky-400/50 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden bg-white dark:bg-[#070c14] select-none"
              >
                <div>
                  {/* Thematic Cover Photo Banner with Glassmorphic Badges */}
                  <div className="h-40 sm:h-44 md:h-48 w-full relative overflow-hidden bg-slate-900">
                    <img
                      src={coverImage}
                      alt={course.title}
                      loading="lazy"
                      onError={(e) => handleCourseImageError(e, course.title)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Dark gradient scrim for strong text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent pointer-events-none" />

                    {/* Floating Top Badges */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md shadow-xs border ${
                        course.difficulty === 'beginner'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : course.difficulty === 'intermediate'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                          : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                      }`}>
                        {course.difficulty}
                      </span>

                      <div className="flex items-center space-x-1.5 backdrop-blur-md bg-slate-900/80 border border-white/15 px-2.5 py-0.5 rounded-full text-slate-200 text-[10px] font-mono shadow-xs">
                        <Users className="w-3 h-3 text-sky-400" />
                        <span>{course.enrolled_count || 0} enrolled</span>
                      </div>
                    </div>

                    {/* Bottom Title Overlay on Gradient */}
                    <div className="absolute bottom-3 inset-x-3.5 z-10 pointer-events-none">
                      <span className="text-[10px] font-mono text-sky-400 font-semibold uppercase tracking-wider block mb-1">
                        Accredited Curriculum Track
                      </span>
                      <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug line-clamp-2 drop-shadow-sm group-hover:text-sky-200 transition-colors">
                        {course.title}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body with Author attribution */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <p className="text-slate-600 dark:text-slate-300 text-xs line-clamp-2 leading-relaxed">
                      {course.description || 'Structured computer science curriculum track.'}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-400">Author:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {course.instructor_name || 'Faculty Colleague'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Layers className="w-3 h-3 text-sky-500" />
                        <span>{course.modules && course.modules.length > 0 ? `${course.modules.length}M` : '6M'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tactile Action Bar */}
                <div className="p-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-3 mt-auto bg-slate-50/50 dark:bg-white/[0.02]">
                  <Link
                    to={getCourseDetailUrl(course)}
                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>View Syllabus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {isOwnCourse ? (
                    <span
                      className="h-9 sm:h-8 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 flex items-center space-x-1.5 cursor-default select-none"
                      title="You authored this curriculum. Instructors learn through other faculty courses."
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Authored by You</span>
                    </span>
                  ) : isEnrolled ? (
                    <Link
                      to={getCourseDetailUrl(course)}
                      className="h-9 sm:h-8 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1.5 shadow-xs cursor-pointer hover:bg-emerald-100/60 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Enrolled</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollingId === course.id}
                      className="h-9 sm:h-8 px-4 rounded-xl text-xs font-semibold bg-[#0082fb] hover:bg-[#155dfc] text-white shadow-md glow-blue transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {enrollingId === course.id ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </AdaptiveGrid>
      )}
    </motion.div>
  );
};
