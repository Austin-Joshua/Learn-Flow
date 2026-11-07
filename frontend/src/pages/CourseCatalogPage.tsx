import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Course } from '../types';
import { useAuthStore } from '../store/authStore';
import {
  BookOpen,
  Search,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  GraduationCap
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
    } catch (err: any) {
      setEnrollError(err.response?.data?.detail || 'Failed to enroll in course.');
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Header */}
      <div className="mb-10 text-center sm:text-left sm:flex sm:items-end sm:justify-between border-b border-slate-200 pb-8">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Computer Science Curriculum</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Explore Courses & Learning Paths
          </h1>
          <p className="mt-2 text-base text-slate-600 max-w-2xl">
            Master distributed systems, frontend engineering, database architectures, and algorithm design with verifiable credentials.
          </p>
        </div>
      </div>

      {enrollError && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3 text-rose-800">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
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
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {['', 'beginner', 'intermediate', 'advanced'].map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                difficultyFilter === diff
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {diff === '' ? 'All Levels' : diff}
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-72 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No courses found</h3>
          <p className="text-sm text-slate-500 mt-1">Try modifying your search or difficulty filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  <div className="h-32 bg-gradient-to-tr from-slate-900 to-indigo-950 p-5 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
                    <div className="flex items-center justify-between z-10">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
                        course.difficulty === 'beginner'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : course.difficulty === 'intermediate'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {course.difficulty}
                      </span>
                      <div className="flex items-center space-x-1 text-slate-400 text-xs">
                        <Users className="w-3.5 h-3.5" />
                        <span>{course.enrolled_count || 0} enrolled</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight line-clamp-1 z-10">
                      {course.title}
                    </h3>
                  </div>

                  <div className="p-5">
                    <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed mb-4">
                      {course.description || 'Structured enterprise-grade engineering curriculum.'}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <Link
                    to={`/courses/${course.id}`}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                  >
                    <span>View Syllabus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {isEnrolled ? (
                    <Link
                      to={`/courses/${course.id}`}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Enrolled</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollingId === course.id}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50"
                    >
                      {enrollingId === course.id ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
