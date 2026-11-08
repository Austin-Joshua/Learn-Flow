import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useJourneyData } from '../hooks/useJourneyData';
import { MountainScene } from '../components/journey/MountainScene';
import { JourneyLedger } from '../components/journey/JourneyLedger';
import { ProgressRing } from '../components/common/ProgressRing';
import { Mountain, List, Compass } from 'lucide-react';

export const MyJourneyPage: React.FC = () => {
  const {
    courses,
    selectedCourseId,
    setSelectedCourseId,
    selectedModuleId,
    setSelectedModuleId,
    activeTab,
    setActiveTab,
    isLoading,
    error,
    currentCourse,
    courseStats,
    trailGeometry,
    activeModule,
  } = useJourneyData();

  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse mb-8" />
        <div className="h-[600px] bg-slate-100 dark:bg-slate-900 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error || courses.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 mx-auto mb-4">
          <Mountain className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          {error ? 'Unable to Load Journey' : 'No Enrolled Courses Yet'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
          {error
            ? 'We encountered an issue fetching your learning progression.'
            : 'Enroll in an institutional course to unlock your mountain learning trail and track your milestones.'}
        </p>
        <Link
          to="/courses"
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Top Header & Course Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive Mountain Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Learning Journey
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Climb through sequential modules from base camp to verified diploma summit.
          </p>
        </div>

        {/* Course Dropdown Selector */}
        <div className="flex items-center space-x-3 self-start lg:self-auto">
          <label htmlFor="course-select" className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Active Course:
          </label>
          {courses.length > 1 ? (
            <select
              id="course-select"
              value={currentCourse?.course_id || selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedModuleId(null);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            >
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.title || c.slug || 'Course'}
                </option>
              ))}
            </select>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700">
              {currentCourse?.title || 'Active Course'}
            </span>
          )}
        </div>
      </div>

      {currentCourse && (
        <>
          {/* Progress Overview Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 mb-4 sm:mb-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <ProgressRing
                value={currentCourse.progress_percentage || 0}
                size={70}
                strokeWidth={6}
                label="Course Progress"
              />
              <div>
                <span className="text-meta font-mono font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded border border-sky-100 dark:border-sky-900/60 inline-block mb-1">
                  {currentCourse.difficulty}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {currentCourse.title}
                </h2>
                <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  <span>
                    {courseStats.completedLessons} of {courseStats.totalLessons} lessons
                  </span>
                  <span>•</span>
                  <span>
                    {courseStats.completedModules} of {courseStats.totalModules} modules
                  </span>
                </div>
              </div>
            </div>

            {/* View Switcher Tabs (Accessible) */}
            <div
              className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-stretch md:self-auto justify-center"
              role="tablist"
              aria-label="Journey view mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'trail'}
                onClick={() => setActiveTab('trail')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'trail'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Mountain className="w-3.5 h-3.5" />
                <span>Mountain Trail</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'ledger'}
                onClick={() => setActiveTab('ledger')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'ledger'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Structured Ledger</span>
              </button>
            </div>
          </div>

          {/* TAB 1: MOUNTAIN TRAIL SVG VIEW */}
          {activeTab === 'trail' && trailGeometry && (
            <MountainScene
              trailGeometry={trailGeometry}
              courseStats={courseStats}
              selectedModuleId={selectedModuleId}
              activeModule={activeModule}
              onSelectModule={setSelectedModuleId}
              onNavigate={navigate}
            />
          )}

          {/* TAB 2: STRUCTURED LEDGER VIEW (ACCESSIBLE LIST) */}
          {activeTab === 'ledger' && (
            <JourneyLedger currentCourse={currentCourse} />
          )}
        </>
      )}
    </div>
  );
};
