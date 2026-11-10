import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Course } from '../../types';
import { getCourseCoverImage, handleCourseImageError } from '../../utils/courseImages';
import { getCourseDetailUrl } from '../../utils/courseUrls';
import {
  X,
  BookOpen,
  PlayCircle,
  Award,
  Layers,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  ListTree
} from 'lucide-react';

interface CourseQuickPeekModalProps {
  course: Course | null;
  isOpen: boolean;
  initialTab?: 'syllabus' | 'continue';
  onClose: () => void;
  onContinue?: (course: Course) => void;
  onViewSyllabus?: (course: Course) => void;
}

export const CourseQuickPeekModal: React.FC<CourseQuickPeekModalProps> = ({
  course,
  isOpen,
  initialTab = 'continue',
  onClose,
  onContinue,
  onViewSyllabus,
}) => {
  const [activeTab, setActiveTab] = useState<'syllabus' | 'continue'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, course]);

  if (!course) return null;

  const pct = Math.round(course.progress_percentage || 0);
  const isCompleted = pct >= 100;
  const modulesCount = course.modules && course.modules.length > 0 ? course.modules.length : 6;
  const totalLessons = course.modules && course.modules.length > 0
    ? course.modules.reduce((acc, m) => acc + (m.lessons?.length || 3), 0)
    : 18;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-6 select-none">
          {/* Tactile Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          />

          {/* Detailed Description & Interactive Mini-Summary Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="skeuo-card relative w-full max-w-xl bg-white dark:bg-[#070c14] border border-slate-200/90 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] sm:max-h-[85vh]"
          >
            {/* Mobile Sheet Drag Indicator */}
            <div className="sm:hidden w-10 h-1 bg-white/40 rounded-full mx-auto my-2 absolute top-0 inset-x-0 z-30 pointer-events-none" />

            {/* Thematic Cover Photo Header */}
            <div className="h-28 sm:h-36 w-full relative overflow-hidden bg-slate-900 shrink-0">
              <img
                src={getCourseCoverImage(course)}
                alt={course.title}
                onError={(e) => handleCourseImageError(e, course.title)}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="absolute top-3 right-3 skeuo-icon-btn rounded-full w-8 h-8 text-white bg-slate-950/70 hover:bg-slate-950 transition-colors cursor-pointer shrink-0 z-20 flex items-center justify-center border border-white/20 shadow-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Header Deck */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 via-sky-50/30 to-slate-50 dark:from-[#09121e] dark:via-[#0c1828] dark:to-[#09121e] border-b border-slate-200 dark:border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/20 inline-flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>{course.difficulty}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {modulesCount} Modules &bull; {totalLessons} Lessons
                    </span>
                    {pct > 0 && (
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                      }`}>
                        {pct}% Completed
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                    {course.title}
                  </h3>
                </div>
              </div>

              {/* Two-Zone Interactive Toggle Tabs */}
              <div className="flex items-center gap-2 mt-4 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-xl border border-slate-300/80 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveTab('continue')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'continue'
                      ? 'bg-white dark:bg-[#0f172a] text-[#0082fb] dark:text-[#3aa0ff] shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Overview & Progress</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('syllabus')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'syllabus'
                      ? 'bg-white dark:bg-[#0f172a] text-[#0082fb] dark:text-[#3aa0ff] shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ListTree className="w-3.5 h-3.5" />
                  <span>Syllabus Preview</span>
                </button>
              </div>
            </div>

            {/* Scrollable Body Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed flex-1">
              {activeTab === 'continue' ? (
                <>
                  {/* Detailed Description */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5">
                      Curriculum Description
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-[13px] leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  {/* Progress & Milestone Track */}
                  <div className="skeuo-card bg-slate-50 dark:bg-[#0a101b] p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                        <span>Sequential Milestone Completion</span>
                      </span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        {pct}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          isCompleted
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-sky-500 to-[#0082fb]'
                        }`}
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isCompleted
                        ? 'All course modules mastered. Verified institutional certificate issued.'
                        : pct > 0
                        ? 'Your draft progress and code choices are saved. Resume right where you left off.'
                        : 'Curriculum unlocked. Begin Module 1 to start your learning telemetry trail.'}
                    </p>
                  </div>

                  {/* Academic Highlights */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-sky-500 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Total Duration</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">~4-6 Hours</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 flex items-center gap-2.5">
                      <Award className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Credential</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">HMAC-SHA256 Token</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Syllabus Modules Outline */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2.5">
                      Syllabus & Module Hierarchy
                    </h4>

                    {course.modules && course.modules.length > 0 ? (
                      <div className="space-y-2.5">
                        {course.modules.map((m, idx) => (
                          <div
                            key={m.id || idx}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-[#0a101b] border border-slate-200/80 dark:border-white/5 space-y-1.5"
                          >
                            <div className="flex items-center justify-between font-semibold text-xs text-slate-900 dark:text-white">
                              <span className="flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                <span>{m.title}</span>
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {m.lessons?.length || 2} Lessons
                              </span>
                            </div>

                            {m.lessons && m.lessons.length > 0 && (
                              <ul className="pl-5 space-y-1 text-[11px] text-slate-500 dark:text-slate-400 list-disc">
                                {m.lessons.map((l, lIdx) => (
                                  <li key={l.id || lIdx} className="truncate">
                                    {l.title}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 dark:text-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Structured Diagnostic Concept Mastery</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Sequential theoretical lectures, code analysis notebooks, and timed mastery assessments.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-[#060a12] border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  if (onViewSyllabus) {
                    onViewSyllabus(course);
                  } else {
                    window.location.href = getCourseDetailUrl(course);
                  }
                }}
                className="h-10 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer order-2 sm:order-1"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                <span>Full Syllabus Page</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onContinue) {
                    onContinue(course);
                  } else {
                    window.location.href = getCourseDetailUrl(course);
                  }
                }}
                className="h-10 px-5 rounded-xl text-xs font-semibold bg-[#0082fb] hover:bg-[#155dfc] text-white flex items-center justify-center gap-2 shadow-md glow-blue cursor-pointer transition-all active:scale-98 order-1 sm:order-2"
              >
                {isCompleted ? (
                  <>
                    <Award className="w-4 h-4 text-amber-200" />
                    <span>View Certificate</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    <span>Continue Learning</span>
                  </>
                )}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

