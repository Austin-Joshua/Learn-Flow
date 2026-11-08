import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../../types';
import { Award, CheckCircle2 } from 'lucide-react';

interface CourseStatsSidebarProps {
  course: Course;
  isEnrolled: boolean;
  totalLessons: number;
  completedLessons: number;
  isEligibleForCert: boolean;
  claimingCert: boolean;
  certSuccess: string | null;
  certError: string | null;
  onClaimCertificate: () => void;
}

export const CourseStatsSidebar: React.FC<CourseStatsSidebarProps> = ({
  course,
  isEnrolled,
  totalLessons,
  completedLessons,
  isEligibleForCert,
  claimingCert,
  certSuccess,
  certError,
  onClaimCertificate,
}) => {
  return (
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
              onClick={onClaimCertificate}
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
  );
};
