import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Course, CourseAssessmentListItem } from '../types';
import { useAuthStore } from '../store/authStore';
import { CourseHeroBanner } from '../components/curriculum/CourseHeroBanner';
import { CourseModuleAccordion } from '../components/curriculum/CourseModuleAccordion';
import { CourseStatsSidebar } from '../components/curriculum/CourseStatsSidebar';
import { PlayCircle, Lock, Award, Clock } from 'lucide-react';

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
  const [assessments, setAssessments] = useState<CourseAssessmentListItem[]>([]);

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

      if (isAuthenticated) {
        try {
          const assessRes = await api.courses.getAssessments(id);
          setAssessments(assessRes.data);
        } catch {
          // Non-enrolled or no assessment permissions
        }
      }

      // Initialize accordion: open unlocked modules by default
      if (courseRes.data.modules) {
        const initialExpanded: Record<string, boolean> = {};
        courseRes.data.modules.forEach((mod, index) => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 font-sans pb-24 md:pb-10">
      {/* Course Hero Banner */}
      <CourseHeroBanner
        course={course}
        isEnrolled={isEnrolled}
        enrolling={enrolling}
        enrollError={enrollError}
        nextLessonId={nextLessonId}
        totalLessons={totalLessons}
        completedLessons={completedLessons}
        onEnroll={handleEnroll}
      />

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

          <CourseModuleAccordion
            modules={course.modules}
            isEnrolled={isEnrolled}
            expandedModules={expandedModules}
            toggleModule={toggleModule}
          />

          {/* Timed Assessments Section */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assessments & Quizzes</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Proctored timed assessments verifying competency across curriculum modules.
                </p>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {assessments.length} {assessments.length === 1 ? 'Quiz' : 'Quizzes'}
              </span>
            </div>

            {assessments.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isEnrolled ? 'No assessments currently scheduled for this course.' : 'Enroll to view course assessments and attempts.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assessments.map((a) => {
                  const isPassed = a.status === 'passed';
                  const isInProgress = a.status === 'in_progress';
                  const isMaxUsed = a.attempts_used >= a.max_attempts && !isPassed;

                  let buttonLabel = 'Take assessment';
                  if (isPassed) buttonLabel = 'View result';
                  else if (isInProgress) buttonLabel = 'Resume';
                  else if (a.attempts_used > 0) buttonLabel = 'Retake assessment';

                  return (
                    <div
                      key={a.id}
                      className={`p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 transition-all ${
                        a.is_locked
                          ? 'border-slate-200/60 dark:border-slate-800/60 opacity-80'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {a.title}
                            </h3>
                            {isPassed ? (
                              <span className="inline-flex items-center text-meta font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                Passed ({a.best_score?.toFixed(0)}%)
                              </span>
                            ) : isInProgress ? (
                              <span className="inline-flex items-center text-meta font-mono px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                                In Progress
                              </span>
                            ) : isMaxUsed ? (
                              <span className="inline-flex items-center text-meta font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                                Attempts Exhausted
                              </span>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                            <span>Time limit: {a.time_limit_minutes} min</span>
                            <span>•</span>
                            <span>Passing: {a.passing_score_percentage}%</span>
                            <span>•</span>
                            <span>Attempts: {a.attempts_used} / {a.max_attempts}</span>
                            {a.best_score !== null && (
                              <>
                                <span>•</span>
                                <span>Best: {a.best_score.toFixed(0)}%</span>
                              </>
                            )}
                          </div>

                          {a.is_locked && a.locked_reason && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-mono mt-2 flex items-center space-x-1">
                              <Lock className="w-3.5 h-3.5 shrink-0" />
                              <span>{a.locked_reason}</span>
                            </p>
                          )}
                        </div>

                        <div className="shrink-0">
                          {a.is_locked ? (
                            <button
                              type="button"
                              disabled
                              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl text-xs font-semibold cursor-not-allowed border border-slate-200 dark:border-slate-700 min-h-[40px]"
                            >
                              Locked
                            </button>
                          ) : (
                            <Link
                              to={`/assessments/${a.id}`}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors inline-flex items-center space-x-1.5 min-h-[40px] ${
                                isPassed
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs'
                              }`}
                            >
                              <span>{buttonLabel}</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Summary & Certificate */}
        <CourseStatsSidebar
          course={course}
          isEnrolled={isEnrolled}
          totalLessons={totalLessons}
          completedLessons={completedLessons}
          isEligibleForCert={isEligibleForCert}
          claimingCert={claimingCert}
          certSuccess={certSuccess}
          certError={certError}
          onClaimCertificate={handleClaimCertificate}
        />
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
