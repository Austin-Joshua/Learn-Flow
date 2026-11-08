import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Course } from '../types';
import { useAuthStore } from '../store/authStore';
import { ProgressRing } from '../components/common/ProgressRing';
import {
  GraduationCap,
  CheckCircle,
  Circle,
  PlayCircle,
  Award,
  AlertTriangle,
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [claimingCert, setClaimingCert] = useState<boolean>(false);
  const [certSuccess, setCertSuccess] = useState<string | null>(null);
  const [certError, setCertError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const { isAuthenticated, hasRole } = useAuthStore();
  const navigate = useNavigate();

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const courseRes = await api.courses.getDetail(id);
      setCourse(courseRes.data);

      if (isAuthenticated && hasRole('learner')) {
        const myCoursesRes = await api.enrollments.myCourses();
        const found = myCoursesRes.data.find((c) => c.id === id);
        if (found) {
          setIsEnrolled(true);
          if (found.progress_percentage !== undefined) {
            setCourse((prev) => (prev ? { ...prev, progress_percentage: found.progress_percentage } : null));
          }
        }
      }

      // Initialize accordion: open unlocked modules by default
      if (courseRes.data.modules) {
        const initialExpanded: Record<string, boolean> = {};
        courseRes.data.modules.forEach((mod, index) => {
          // Open the first module or unlocked modules
          initialExpanded[mod.id] = index === 0 || !mod.is_locked;
        });
        setExpandedModules(initialExpanded);
      }
    } catch (err) {
      console.error('Failed to load course details', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleEnroll = async () => {
    if (!id) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setEnrolling(true);
    setEnrollError(null);
    try {
      await api.enrollments.enroll(id);
      setIsEnrolled(true);
      await loadData();
    } catch (err: unknown) {
      setEnrollError(
        axios.isAxiosError(err) && err.response?.data?.detail
          ? String(err.response.data.detail)
          : 'Prerequisites not satisfied.'
      );
    } finally {
      setEnrolling(false);
    }
  };

  const handleClaimCertificate = async () => {
    if (!id) return;
    setClaimingCert(true);
    setCertError(null);
    try {
      const res = await api.certificates.claim(id);
      setCertSuccess(res.data.verification_code);
    } catch (err: unknown) {
      setCertError(
        axios.isAxiosError(err) && err.response?.data?.detail
          ? String(err.response.data.detail)
          : 'Eligibility criteria not met.'
      );
    } finally {
      setClaimingCert(false);
    }
  };

  if (isLoading || !course) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  // Find first uncompleted lesson in an unlocked module
  let nextLessonId: string | null = null;
  if (course.modules) {
    for (const mod of course.modules) {
      if (mod.is_locked) continue;
      for (const les of mod.lessons) {
        if (!les.is_completed) {
          nextLessonId = les.id;
          break;
        }
      }
      if (nextLessonId) break;
    }
  }

  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const completedLessons =
    course.modules?.reduce((acc, m) => {
      return acc + (m.lessons?.filter((l) => l.is_completed).length || 0);
    }, 0) || 0;

  const isEligibleForCert = (course.progress_percentage || 0) >= 100;

  const pageContent = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 font-sans pb-24 md:pb-10">
      {/* Course Banner */}
      <div className="bg-slate-900 rounded-3xl text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-800 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 z-10 relative">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <span className="capitalize">{course.difficulty} Level</span>
              <span>•</span>
              <span>Computer Science</span>
              {course.sequential_modules && (
                <>
                  <span>•</span>
                  <span className="text-slate-400 normal-case font-mono">Sequential progression</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-3 sm:mb-4">
              {course.title}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm lg:text-base leading-relaxed mb-6">
              {course.description}
            </p>

            {enrollError && (
              <div className="mb-6 bg-rose-950/70 border border-rose-800/80 rounded-xl p-4 text-rose-200 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold">Enrollment Prerequisite Alert</h4>
                  <p className="text-xs mt-0.5">{enrollError}</p>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3">
              {isEnrolled ? (
                <div className="flex flex-wrap items-center gap-3">
                  {nextLessonId ? (
                    <Link
                      to={`/lessons/${nextLessonId}`}
                      className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30 flex items-center space-x-2 transition-colors duration-150"
                    >
                      <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Continue Learning</span>
                    </Link>
                  ) : (
                    <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs sm:text-sm font-semibold">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                      <span>All Lessons Completed</span>
                    </div>
                  )}

                  <Link
                    to="/my-journey"
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 transition-colors"
                  >
                    View Journey Trail →
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30 transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                </button>
              )}
            </div>
          </div>

          {/* Large Progress Ring Card (Tablet & Desktop) */}
          {isEnrolled && (
            <div className="hidden sm:flex flex-col items-center justify-center p-6 bg-slate-800/60 border border-slate-700/60 rounded-2xl shrink-0 self-start lg:self-center">
              <ProgressRing
                value={course.progress_percentage || 0}
                size={96}
                strokeWidth={8}
                label="Overall Course Progress"
              />
              <div className="text-center mt-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Course Progress
                </div>
                <div className="font-mono text-xs text-sky-400 font-semibold mt-0.5">
                  {completedLessons} of {totalLessons} lessons
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Two-Pane Grid: Syllabus on left, Quick Sidebar on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Syllabus */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Curriculum Syllabus</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {course.modules?.length || 0} Modules • {totalLessons} Lessons
            </span>
          </div>

          {course.modules && course.modules.length > 0 ? (
            course.modules.map((module, modIndex) => {
              const isLocked = Boolean(module.is_locked);
              const isExpanded = Boolean(expandedModules[module.id]);
              const modTotal = module.total_lessons || module.lessons.length;
              const modCompleted = module.completed_lessons || module.lessons.filter((l) => l.is_completed).length;
              const modPct = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0;
              const prevModuleTitle = modIndex > 0 ? course.modules?.[modIndex - 1]?.title : null;

              return (
                <div
                  key={module.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                    isLocked
                      ? 'border-slate-200/70 dark:border-slate-800/70 opacity-80'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Module Header (Clickable Accordion) */}
                  <button
                    type="button"
                    onClick={() => toggleModule(module.id)}
                    className={`w-full text-left px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between transition-colors min-h-[52px] ${
                      isLocked
                        ? 'bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer'
                        : 'bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100/60 dark:hover:bg-slate-900/80 cursor-pointer'
                    }`}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {isLocked ? (
                        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="shrink-0">
                          <ProgressRing
                            value={modPct}
                            size={34}
                            strokeWidth={3}
                            showValue={false}
                            label={`Module ${modIndex + 1} progress`}
                          />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-label font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Module {modIndex + 1}
                          </span>
                          {isLocked && (
                            <span className="inline-flex items-center text-meta font-mono px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              Locked
                            </span>
                          )}
                        </div>
                        <h3
                          className={`text-sm font-bold truncate ${
                            isLocked ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {module.title}
                        </h3>
                        {isLocked && prevModuleTitle && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            Finish {prevModuleTitle} to unlock
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 ml-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                        {modCompleted}/{modTotal}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Collapsible Lesson List */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800">
                      {module.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className={`p-3.5 sm:p-4 px-5 sm:px-6 flex items-center justify-between transition-colors min-h-[48px] ${
                            isLocked
                              ? 'bg-slate-50/20 dark:bg-slate-950/20'
                              : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            {lesson.is_completed ? (
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
                            ) : isLocked ? (
                              <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 dark:text-slate-700 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-600 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <h4
                                className={`text-xs sm:text-sm font-semibold truncate ${
                                  isLocked
                                    ? 'text-slate-500 dark:text-slate-400 font-normal'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {lesson.title}
                              </h4>
                              <div className="flex items-center space-x-2 text-label text-slate-500 dark:text-slate-400 mt-0.5">
                                <span className="capitalize">{lesson.content_type}</span>
                                <span>•</span>
                                <span>{lesson.duration_minutes} mins</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            {isLocked ? (
                              <div className="flex items-center space-x-1.5 text-xs text-slate-400 dark:text-slate-500 px-2.5 py-1 font-mono">
                                <Lock className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Locked</span>
                              </div>
                            ) : isEnrolled ? (
                              <Link
                                to={`/lessons/${lesson.id}`}
                                className="px-3 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100/70 rounded-lg transition-colors inline-block"
                              >
                                {lesson.is_completed ? 'Review' : 'Start'}
                              </Link>
                            ) : (
                              <Lock className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No modules published yet for this course.</p>
          )}
        </div>

        {/* Right Column: Sticky Summary & Certificate */}
        <div className="space-y-6">
          {/* Certificate Claim Card */}
          {isEnrolled && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-md">
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-amber-300 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Verified Credential</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Requires 100% completion & passing assessment score.
                  </p>
                </div>
              </div>

              {certSuccess ? (
                <Link
                  to="/my-certificates"
                  className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Certificate Issued!</span>
                </Link>
              ) : (
                <button
                  onClick={handleClaimCertificate}
                  disabled={claimingCert || !isEligibleForCert}
                  className="w-full px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {claimingCert ? 'Evaluating...' : isEligibleForCert ? 'Claim Certificate' : 'Complete All Lessons First'}
                </button>
              )}

              {certError && (
                <p className="text-xs text-rose-400 mt-2 font-mono">{certError}</p>
              )}
            </div>
          )}

          {/* Quick Learning Stats */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Curriculum Overview
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <span>Total Modules</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{course.modules?.length || 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <span>Total Lessons</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{totalLessons}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <span>Completed Lessons</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{completedLessons}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                <span>Progression Rule</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {course.sequential_modules ? 'Sequential' : 'Open Access'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Continue Action Bar */}
      {isEnrolled && nextLessonId && (
        <div className={`sm:hidden fixed ${isAuthenticated ? 'bottom-16' : 'bottom-0'} left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-30 pb-safe shadow-lg`}>
          <Link
            to={`/lessons/${nextLessonId}`}
            className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-sm min-h-[48px]"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Continue Learning Next Lesson</span>
          </Link>
        </div>
      )}
    </div>
  );
};
