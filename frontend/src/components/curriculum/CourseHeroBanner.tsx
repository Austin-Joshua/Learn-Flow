import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../../types';
import { ProgressRing } from '../common/ProgressRing';
import { AlertTriangle, CheckCircle, PlayCircle } from 'lucide-react';

interface CourseHeroBannerProps {
  course: Course;
  isEnrolled: boolean;
  enrolling: boolean;
  enrollError: string | null;
  nextLessonId: string | null;
  totalLessons: number;
  completedLessons: number;
  onEnroll: () => void;
}

export const CourseHeroBanner: React.FC<CourseHeroBannerProps> = ({
  course,
  isEnrolled,
  enrolling,
  enrollError,
  nextLessonId,
  totalLessons,
  completedLessons,
  onEnroll,
}) => {
  return (
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
                onClick={onEnroll}
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
  );
};
