import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Course } from '../types';
import { useAuthStore } from '../store/authStore';
import {
  CheckCircle,
  Circle,
  PlayCircle,
  Award,
  AlertTriangle,
  Lock,
  CheckCircle2
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
          // Update progress if present
          if (found.progress_percentage !== undefined) {
            setCourse((prev) => (prev ? { ...prev, progress_percentage: found.progress_percentage } : null));
          }
        }
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
      setEnrollError(axios.isAxiosError(err) && err.response?.data?.detail ? String(err.response.data.detail) : 'Prerequisites not satisfied.');
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
      setCertError(axios.isAxiosError(err) && err.response?.data?.detail ? String(err.response.data.detail) : 'Eligibility criteria not met.');
    } finally {
      setClaimingCert(false);
    }
  };

  if (isLoading || !course) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-64 bg-slate-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  // Find first uncompleted lesson
  let nextLessonId: string | null = null;
  if (course.modules) {
    for (const mod of course.modules) {
      for (const les of mod.lessons) {
        if (!les.is_completed) {
          nextLessonId = les.id;
          break;
        }
      }
      if (nextLessonId) break;
    }
  }

  const isEligibleForCert = (course.progress_percentage || 0) >= 100;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Course Banner */}
      <div className="bg-slate-900 rounded-3xl text-white p-8 sm:p-10 shadow-xl border border-slate-800 mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl z-10 relative">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="capitalize">{course.difficulty} Level</span>
            <span>•</span>
            <span>Computer Science</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            {course.title}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
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
          <div className="flex flex-wrap items-center gap-4">
            {isEnrolled ? (
              <div className="flex items-center space-x-4">
                {nextLessonId ? (
                  <Link
                    to={`/lessons/${nextLessonId}`}
                    className="px-6 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition"
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>Continue Learning</span>
                  </Link>
                ) : (
                  <div className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-semibold">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>All Lessons Completed!</span>
                  </div>
                )}

                <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/60">
                  <div className="text-xs text-slate-400">Course Progress</div>
                  <div className="text-sm font-bold text-indigo-300">
                    {course.progress_percentage || 0}%
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="px-8 py-3.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
              >
                {enrolling ? 'Enrolling...' : 'Enroll in Course'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Claim Card */}
      {isEnrolled && (
        <div className="mb-10 bg-gradient-to-r from-indigo-900 to-slate-900 border border-indigo-700/50 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300 flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Course Certificate of Completion</h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                Complete 100% of lessons, passing score on required assessments, and approved assignments to mint your verified credential.
              </p>
            </div>
          </div>

          <div>
            {certSuccess ? (
              <Link
                to="/my-certificates"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition flex items-center space-x-1.5 whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Certificate Issued! View Code</span>
              </Link>
            ) : (
              <button
                onClick={handleClaimCertificate}
                disabled={claimingCert || !isEligibleForCert}
                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {claimingCert ? 'Evaluating...' : isEligibleForCert ? 'Claim Certificate' : 'Criteria Incomplete'}
              </button>
            )}
          </div>
        </div>
      )}

      {certError && (
        <div className="mb-8 bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 text-sm">
          <strong>Cannot Mint Certificate:</strong> {certError}
        </div>
      )}

      {/* Curriculum Syllabus */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Curriculum Syllabus</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {course.modules?.length || 0} Modules •{' '}
            {course.modules?.reduce((acc, m) => acc + m.lessons.length, 0) || 0} Lessons
          </span>
        </div>

        {course.modules && course.modules.length > 0 ? (
          course.modules.map((module) => (
            <div key={module.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="bg-slate-50 dark:bg-slate-950/60 px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {module.title}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{module.lessons.length} lessons</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {module.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                  >
                    <div className="flex items-center space-x-3">
                      {lesson.is_completed ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
                      )}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{lesson.title}</h4>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="capitalize">{lesson.content_type}</span>
                          <span>•</span>
                          <span>{lesson.duration_minutes} mins</span>
                        </div>
                      </div>
                    </div>

                    {isEnrolled ? (
                      <Link
                        to={`/lessons/${lesson.id}`}
                        className="px-3 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100/70 rounded-lg transition"
                      >
                        {lesson.is_completed ? 'Review' : 'Start'}
                      </Link>
                    ) : (
                      <Lock className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">No modules published yet for this course.</p>
        )}
      </div>
    </div>
  );
};

