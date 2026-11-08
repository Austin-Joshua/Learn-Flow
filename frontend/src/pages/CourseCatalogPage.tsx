import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Course } from '../types';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { AppShell } from '../components/layout/AppShell';
import { Footer } from '../components/Footer';
import { AdaptiveGrid } from '../components/common/AdaptiveGrid';
import {
  GraduationCap,
  BookOpen,
  Search,
  Users,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  Sun,
  Moon,
} from 'lucide-react';

export const CourseCatalogPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const { isAuthenticated, hasRole } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const res = await api.courses.list({
        difficulty: difficultyFilter || undefined,
        search: searchQuery || undefined,
      });
      setCourses(res.data);

      if (isAuthenticated && hasRole('learner')) {
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
    setEnrollingId(courseId);
    setEnrollError(null);
    try {
      await api.enrollments.enroll(courseId);
      setEnrolledCourseIds(new Set([...enrolledCourseIds, courseId]));
      navigate(`/courses/${courseId}`);
    } catch (err: unknown) {
      setEnrollError(axios.isAxiosError(err) && err.response?.data?.detail ? String(err.response.data.detail) : 'Failed to enroll in course.');
    } finally {
      setEnrollingId(null);
    }
  };

  const catalogContent = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      {/* Hero Header */}
      <div className="mb-10 text-center sm:text-left sm:flex sm:items-end sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-8">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium mb-3">
            <BookOpen className="w-3.5 h-3.5 text-sky-500" />
            <span>Curated Computing Curricula</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Explore Courses & Learning Paths
          </h1>
          <p className="mt-2 text-base text-slate-600 dark:text-slate-300 max-w-2xl">
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search courses or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {['', 'beginner', 'intermediate', 'advanced'].map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                difficultyFilter === diff
                  ? 'bg-sky-600 text-white shadow-xs'
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
            return (
              <div
                key={course.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="h-28 bg-slate-900 border-b border-slate-800 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-meta font-mono font-semibold tracking-wider uppercase ${
                        course.difficulty === 'beginner'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : course.difficulty === 'intermediate'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {course.difficulty}
                      </span>
                      <div className="flex items-center space-x-1 text-slate-400 text-label font-mono">
                        <Users className="w-3.5 h-3.5" />
                        <span>{course.enrolled_count || 0} enrolled</span>
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight line-clamp-1">
                      {course.title}
                    </h3>
                  </div>

                  <div className="p-5">
                    <p className="text-slate-600 dark:text-slate-300 text-xs line-clamp-3 leading-relaxed">
                      {course.description || 'Structured enterprise-grade engineering curriculum.'}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                  <Link
                    to={`/courses/${course.id}`}
                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center space-x-1"
                  >
                    <span>View Syllabus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {isEnrolled ? (
                    <Link
                      to={`/courses/${course.id}`}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Enrolled</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollingId === course.id}
                      className="h-8 px-3.5 rounded-md text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
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
    </div>
  );

  if (isAuthenticated) {
    return <AppShell>{catalogContent}</AppShell>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-sm bg-slate-800 border border-slate-700/80 flex items-center justify-center text-sky-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-base font-semibold tracking-tight text-white">Learnflow</span>
              <span className="text-label font-mono text-slate-400">[LMS]</span>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>
            <Link to="/verify" className="text-xs text-slate-300 hover:text-white transition-colors">
              Verify
            </Link>
            <Link to="/login" className="h-8 px-3.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center transition-colors shadow-xs">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {catalogContent}
      </main>

      <Footer />
    </div>
  );
};
