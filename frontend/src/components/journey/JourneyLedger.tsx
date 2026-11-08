import React from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckCircle2, Lock } from 'lucide-react';
import { JourneyCourseItem } from '../../types';

interface JourneyLedgerProps {
  currentCourse: JourneyCourseItem;
}

export const JourneyLedger: React.FC<JourneyLedgerProps> = ({ currentCourse }) => {
  return (
    <div className="space-y-6">
      <ol className="space-y-4" role="list">
        {currentCourse.modules.map((mod, modIdx) => {
          const isModCompleted =
            mod.lessons.length > 0 && mod.lessons.every((l) => l.status === 'completed');

          return (
            <li
              key={mod.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-6 transition-all ${
                mod.is_locked
                  ? 'border-slate-200/60 dark:border-slate-800/60 opacity-75'
                  : 'border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                      isModCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : mod.is_locked
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        : 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400'
                    }`}
                  >
                    {isModCompleted ? <Check className="w-4 h-4" /> : mod.is_locked ? <Lock className="w-3.5 h-3.5" /> : modIdx + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-meta font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Module {modIdx + 1}
                      </span>
                      {mod.is_locked && (
                        <span className="text-meta font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Locked
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {mod.title}
                    </h3>
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {mod.completed_lessons} of {mod.total_lessons} lessons completed
                </div>
              </div>

              {/* Lesson Items */}
              <ul className="mt-4 space-y-2.5">
                {mod.lessons.map((les) => (
                  <li
                    key={les.id}
                    className="flex items-center justify-between text-xs py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {les.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : mod.is_locked ? (
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 inline-block shrink-0" />
                      )}
                      <span
                        className={`font-medium ${
                          les.status === 'completed'
                            ? 'text-slate-900 dark:text-white'
                            : mod.is_locked
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {les.title}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4">
                      {les.completed_at && (
                        <span className="font-mono text-slate-400 text-label hidden sm:inline">
                          {new Date(les.completed_at).toLocaleDateString()}
                        </span>
                      )}

                      {!mod.is_locked ? (
                        <Link
                          to={`/lessons/${les.id}`}
                          className="text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                        >
                          {les.status === 'completed' ? 'Review' : 'Start'}
                        </Link>
                      ) : (
                        <span className="text-slate-400 font-mono text-label">Locked</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Assessment Summary if available */}
              {mod.assessment && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Assessment: {mod.assessment.title}
                    </span>
                    <span className="font-mono text-label">
                      {mod.assessment.passed ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          (Passed {mod.assessment.score_percentage}%)
                        </span>
                      ) : mod.assessment.attempt_count > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400">
                          (Attempted {mod.assessment.score_percentage}%)
                        </span>
                      ) : null}
                    </span>
                  </div>

                  <div>
                    {mod.is_locked ? (
                      <span className="text-slate-400 font-mono text-label">Locked</span>
                    ) : (
                      <Link
                        to={`/assessments/${mod.assessment.assessment_id}`}
                        className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        {mod.assessment.passed
                          ? 'View result'
                          : mod.assessment.attempt_count > 0
                          ? 'Resume'
                          : 'Take assessment'}
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
