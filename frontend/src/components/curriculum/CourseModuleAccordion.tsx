import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../../types';
import { ProgressRing } from '../common/ProgressRing';
import { CheckCircle, Circle, ChevronDown, ChevronUp, Lock } from 'lucide-react';

interface CourseModuleAccordionProps {
  modules?: Course['modules'];
  isEnrolled: boolean;
  expandedModules: Record<string, boolean>;
  toggleModule: (moduleId: string) => void;
}

export const CourseModuleAccordion: React.FC<CourseModuleAccordionProps> = ({
  modules,
  isEnrolled,
  expandedModules,
  toggleModule,
}) => {
  if (!modules || modules.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No modules published yet for this course.</p>;
  }

  return (
    <div className="space-y-6">
      {modules.map((module, modIndex) => {
        const isLocked = Boolean(module.is_locked);
        const isExpanded = Boolean(expandedModules[module.id]);
        const modTotal = module.total_lessons || module.lessons.length;
        const modCompleted = module.completed_lessons || module.lessons.filter((l) => l.is_completed).length;
        const modPct = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0;
        const prevModuleTitle = modIndex > 0 ? modules[modIndex - 1]?.title : null;

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
      })}
    </div>
  );
};
