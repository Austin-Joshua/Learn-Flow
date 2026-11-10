import React from 'react';
import { Link } from 'react-router-dom';
import { Course, CompletionStatus } from '../../types';
import { getCourseDetailUrl } from '../../utils/courseUrls';
import { Award, CheckCircle2, AlertCircle, Check, X, Download } from 'lucide-react';

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
  completionStatus?: CompletionStatus | null;
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
  completionStatus,
}) => {
  const isEligible = completionStatus ? completionStatus.is_eligible : isEligibleForCert;
  const existingCert = completionStatus?.certificate;

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
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">Verified Credential</h3>
                {completionStatus?.version && (
                  <span className="text-meta font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
                    v{completionStatus.version}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Cryptographically verifiable diploma with SHA-256 criteria snapshot.
              </p>
            </div>
          </div>

          {/* Existing Certificate / Newly Issued */}
          {existingCert || certSuccess ? (
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <p className="font-semibold">Certificate Issued!</p>
                  <p className="font-mono text-meta text-emerald-400 truncate">
                    Code: {existingCert?.verification_code || certSuccess}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  to="/my-certificates"
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>My Certificates</span>
                </Link>
                {existingCert?.download_url && (
                  <a
                    href={existingCert.download_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {/* Evaluated Completion Checklist */}
              {completionStatus && (
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Lessons Completed:</span>
                    <span className="font-mono flex items-center space-x-1">
                      {completionStatus.lessons_passed ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      <span className={completionStatus.lessons_passed ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                        {completionStatus.actual_lesson_completion_pct}% / {completionStatus.min_lesson_completion_pct}%
                      </span>
                    </span>
                  </div>

                  {completionStatus.required_assessments.length > 0 && (
                    <div className="pt-1 border-t border-slate-800/80 space-y-1">
                      <p className="text-meta text-slate-400 uppercase font-mono font-bold">Required Assessments:</p>
                      {completionStatus.required_assessments.map((ra) => (
                        <div key={ra.assessment_id} className="flex items-center justify-between text-meta">
                          <span className="text-slate-300 truncate max-w-[150px]">{ra.title}</span>
                          <span className="font-mono flex items-center space-x-1 shrink-0">
                            {ra.passed ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <X className="w-3 h-3 text-rose-400" />
                            )}
                            <span className={ra.passed ? 'text-emerald-400' : 'text-slate-400'}>
                              {ra.best_score_pct}% (min {ra.min_score_pct}%)
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {completionStatus.required_assignments.length > 0 && (
                    <div className="pt-1 border-t border-slate-800/80 space-y-1">
                      <p className="text-meta text-slate-400 uppercase font-mono font-bold">Required Assignments:</p>
                      {completionStatus.required_assignments.map((asg) => (
                        <div key={asg.assignment_id} className="flex items-center justify-between text-meta">
                          <span className="text-slate-300 truncate max-w-[150px]">{asg.title}</span>
                          <span className="font-mono flex items-center space-x-1 shrink-0">
                            {asg.passed ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <X className="w-3 h-3 text-rose-400" />
                            )}
                            <span className={asg.passed ? 'text-emerald-400' : 'text-slate-400 capitalize'}>
                              {asg.passed ? 'Passed' : asg.status.replace('_', ' ')}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Missing items breakdown if any */}
                  {completionStatus.missing_requirements.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-rose-950/60 bg-rose-950/20 p-2 rounded-lg text-rose-300 space-y-1">
                      <p className="font-semibold text-meta flex items-center space-x-1 text-rose-400">
                        <AlertCircle className="w-3 h-3" />
                        <span>Pending Requirements:</span>
                      </p>
                      <ul className="list-disc pl-3 text-meta space-y-0.5 text-rose-200">
                        {completionStatus.missing_requirements.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={onClaimCertificate}
                disabled={claimingCert || !isEligible}
                className="w-full px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {claimingCert
                  ? 'Evaluating Criteria...'
                  : isEligible
                  ? 'Claim Certificate'
                  : 'Requirements Incomplete'}
              </button>
            </div>
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

      {/* Course Prerequisites Card */}
      {course.prerequisite_courses && course.prerequisite_courses.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
            <span>Course Prerequisites</span>
            <span className="font-mono text-slate-400 font-normal">
              {course.prerequisite_courses.length} Required
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Institutional curriculum prerequisites required prior to enrollment:
          </p>
          <div className="space-y-2">
            {course.prerequisite_courses.map((p) => (
              <Link
                key={p.id}
                to={getCourseDetailUrl(p)}
                className="block p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition truncate">
                    {p.title}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-slate-400 shrink-0 ml-2">
                    {p.difficulty}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
