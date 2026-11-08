import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  JourneyCourseItem,
  JourneyModuleItem,
  JourneyLessonItem,
} from '../types';
import { ProgressRing } from '../components/common/ProgressRing';
import {
  Mountain,
  CheckCircle2,
  Lock,
  PlayCircle,
  Award,
  List,
  Compass,
  Check,
} from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

export const MyJourneyPage: React.FC = () => {
  const [courses, setCourses] = useState<JourneyCourseItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trail' | 'ledger'>('trail');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchJourney = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.learners.getJourney();
        const courseList = res.data.courses || [];
        setCourses(courseList);
        if (courseList.length > 0) {
          setSelectedCourseId(courseList[0].course_id);
        }
      } catch (err) {
        console.error('Failed to load learner journey', err);
        setError('Could not retrieve learning journey data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJourney();
  }, []);

  const currentCourse = useMemo(() => {
    return courses.find((c) => c.course_id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  // Compute total statistics
  const courseStats = useMemo(() => {
    if (!currentCourse) return { totalLessons: 0, completedLessons: 0, totalModules: 0, completedModules: 0 };
    const totalModules = currentCourse.modules.length;
    let completedModules = 0;
    let totalLessons = 0;
    let completedLessons = 0;

    for (const mod of currentCourse.modules) {
      const isModComplete = mod.lessons.length > 0 && mod.lessons.every((l) => l.status === 'completed');
      if (isModComplete) completedModules++;
      totalLessons += mod.total_lessons || mod.lessons.length;
      completedLessons += mod.completed_lessons || mod.lessons.filter((l) => l.status === 'completed').length;
    }

    return { totalLessons, completedLessons, totalModules, completedModules };
  }, [currentCourse]);

  // Mountain trail geometry computation
  const trailGeometry = useMemo(() => {
    if (!currentCourse || currentCourse.modules.length === 0) {
      return null;
    }

    const mods = currentCourse.modules;
    const numMods = mods.length;

    // Dimensions
    const width = 800;
    const rowStep = Math.max(130, Math.min(180, 720 / Math.max(1, numMods)));
    const topPadding = 120;
    const bottomPadding = 100;
    const height = topPadding + bottomPadding + numMods * rowStep;

    // Waypoint coordinates (climbing upward from bottom to summit)
    // Module 0 is near the base (bottom), Module N-1 is highest, Summit is at top center
    const waypoints: Array<{
      module: JourneyModuleItem;
      point: Point;
      isCompleted: boolean;
      isCurrent: boolean;
      isLocked: boolean;
      lessons: Array<{ lesson: JourneyLessonItem; point: Point }>;
    }> = [];

    // Base Y is near bottom
    const baseY = height - bottomPadding;

    mods.forEach((mod, index) => {
      // Switchback zigzag horizontal position (alternates between 220 and 580)
      const progressFromBottom = index / Math.max(1, numMods);
      const isEven = index % 2 === 0;
      // As we climb, switchbacks narrow slightly towards the summit peak
      const spread = 200 * (1 - progressFromBottom * 0.35);
      const x = isEven ? 400 - spread : 400 + spread;
      const y = baseY - index * rowStep;

      const isCompleted = mod.lessons.length > 0 && mod.lessons.every((l) => l.status === 'completed');
      const isLocked = mod.is_locked;
      const isCurrent = !isLocked && !isCompleted;

      // Lesson marker points interpolated between this module and the next (or offset)
      const lessonPoints: Array<{ lesson: JourneyLessonItem; point: Point }> = [];
      const numLessons = mod.lessons.length;

      mod.lessons.forEach((les, lesIdx) => {
        // Offset along a subtle arc
        const fraction = (lesIdx + 1) / (numLessons + 1);
        const nextX = index < numMods - 1 ? (isEven ? 400 + spread : 400 - spread) : 400;

        // Linear interpolation with a calm horizontal arc
        const lx = x + (nextX - x) * fraction * 0.45;
        const ly = y - rowStep * fraction * 0.4;
        lessonPoints.push({ lesson: les, point: { x: lx, y: ly } });
      });

      waypoints.push({
        module: mod,
        point: { x, y },
        isCompleted,
        isCurrent,
        isLocked,
        lessons: lessonPoints,
      });
    });

    // Summit point at top center
    const summitPoint: Point = { x: 400, y: topPadding - 40 };

    // Build switchback trail segments
    // Path string from Module 0 up to Summit
    const segments: Array<{
      d: string;
      status: 'completed' | 'current' | 'locked';
      fromIndex: number;
    }> = [];

    for (let i = 0; i < waypoints.length; i++) {
      const currentPt = waypoints[i].point;
      const nextPt = i < waypoints.length - 1 ? waypoints[i + 1].point : summitPoint;

      // Switchback curve using cubic bezier
      const dy = nextPt.y - currentPt.y;
      const cp1: Point = { x: currentPt.x, y: currentPt.y + dy * 0.45 };
      const cp2: Point = { x: nextPt.x, y: currentPt.y + dy * 0.55 };

      const d = `M ${currentPt.x} ${currentPt.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${nextPt.x} ${nextPt.y}`;

      const status: 'completed' | 'current' | 'locked' =
        waypoints[i].isCompleted ? 'completed' : waypoints[i].isLocked ? 'locked' : 'current';

      segments.push({ d, status, fromIndex: i });
    }

    // Mountain background contours (quiet stylized terrain lines)
    const mountainContours = [
      `M 80 ${height} L 400 ${topPadding - 60} L 720 ${height} Z`,
      `M 160 ${height} L 400 ${topPadding - 20} L 640 ${height}`,
      `M 240 ${height} L 360 ${topPadding + 140} L 560 ${height}`,
      `M 400 ${topPadding - 60} L 400 ${height}`, // subtle central ridge
    ];

    return {
      width,
      height,
      waypoints,
      segments,
      summitPoint,
      mountainContours,
    };
  }, [currentCourse]);

  // Determine active popup details
  const activeModule = useMemo(() => {
    if (!currentCourse || !selectedModuleId) return null;
    return currentCourse.modules.find((m) => m.id === selectedModuleId) || null;
  }, [currentCourse, selectedModuleId]);

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
        {courses.length > 1 && (
          <div className="flex items-center space-x-3 self-start lg:self-auto">
            <label htmlFor="course-select" className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Active Course:
            </label>
            <select
              id="course-select"
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedModuleId(null);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            >
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {currentCourse && (
        <>
          {/* Progress Overview Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <ProgressRing
                value={currentCourse.progress_percentage || 0}
                size={70}
                strokeWidth={6}
                label="Course Progress"
              />
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded border border-sky-100 dark:border-sky-900/60 inline-block mb-1">
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
            <div className="relative bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden p-4 sm:p-8">
              {/* Quiet Atmospheric Background Gradient */}
              <div className="absolute inset-0 bg-radial from-sky-950/20 via-slate-950 to-slate-950 pointer-events-none" />

              {/* Waypoint Detail Drawer / Card (Shown when a module is selected) */}
              {activeModule && (
                <div className="absolute top-6 right-6 z-20 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-5 shadow-2xl text-white transition-all">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400">
                        Module {activeModule.order_index + 1}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-0.5">
                        {activeModule.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedModuleId(null)}
                      className="text-slate-400 hover:text-white text-xs p-1"
                      aria-label="Close details"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2 mb-4 text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-mono">
                      <span>Status:</span>
                      <span className="font-semibold text-white">
                        {activeModule.is_locked
                          ? 'Locked'
                          : activeModule.completed_lessons >= activeModule.total_lessons
                          ? 'Completed'
                          : 'In Progress'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300 font-mono">
                      <span>Lessons:</span>
                      <span className="font-semibold text-sky-400">
                        {activeModule.completed_lessons} of {activeModule.total_lessons}
                      </span>
                    </div>

                    {activeModule.assessment && (
                      <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 mt-2">
                        <div className="text-[11px] font-semibold text-slate-200">
                          {activeModule.assessment.title}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {activeModule.assessment.passed ? (
                            <span className="text-emerald-400">Passed ({activeModule.assessment.score_percentage || 0}%)</span>
                          ) : activeModule.assessment.attempt_count > 0 ? (
                            <span className="text-amber-400">Attempted ({activeModule.assessment.score_percentage || 0}%)</span>
                          ) : (
                            <span>Not yet attempted</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {!activeModule.is_locked && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextLes = activeModule.lessons.find((l) => l.status !== 'completed') || activeModule.lessons[0];
                        if (nextLes) {
                          navigate(`/lessons/${nextLes.id}`);
                        }
                      }}
                      className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Continue Module</span>
                    </button>
                  )}
                </div>
              )}

              {/* Scrollable Container for Tall Trails */}
              <div className="overflow-x-auto max-h-[800px] overflow-y-auto pr-2">
                <svg
                  viewBox={`0 0 ${trailGeometry.width} ${trailGeometry.height}`}
                  className="w-full max-w-[800px] mx-auto select-none"
                  style={{ minHeight: `${Math.min(700, trailGeometry.height)}px` }}
                >
                  <defs>
                    <linearGradient id="completedTrailGrad" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#0284c7" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* 1. Mountain Ridges (Quiet Contours) */}
                  {trailGeometry.mountainContours.map((contour, idx) => (
                    <path
                      key={idx}
                      d={contour}
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth={idx === 0 ? '2' : '1'}
                      className="opacity-70"
                    />
                  ))}

                  {/* 2. Switchback Trail Segments */}
                  {trailGeometry.segments.map((seg, idx) => {
                    const isCompleted = seg.status === 'completed';
                    const isLocked = seg.status === 'locked';

                    return (
                      <path
                        key={idx}
                        d={seg.d}
                        fill="none"
                        stroke={isCompleted ? 'url(#completedTrailGrad)' : isLocked ? '#334155' : '#0284c7'}
                        strokeWidth={isCompleted ? 4 : isLocked ? 2 : 3}
                        strokeDasharray={isLocked ? '6 6' : undefined}
                        strokeLinecap="round"
                        className="transition-colors duration-300"
                        filter={isCompleted ? 'url(#softGlow)' : undefined}
                      />
                    );
                  })}

                  {/* 3. Lesson Micro-Stones along Trail */}
                  {trailGeometry.waypoints.map((wp) =>
                    wp.lessons.map((les) => {
                      const isLesCompleted = les.lesson.status === 'completed';
                      return (
                        <circle
                          key={les.lesson.id}
                          cx={les.point.x}
                          cy={les.point.y}
                          r={3.5}
                          fill={isLesCompleted ? '#38bdf8' : wp.isLocked ? '#1e293b' : '#64748b'}
                          stroke={isLesCompleted ? '#0284c7' : '#0f172a'}
                          strokeWidth={1}
                          className="transition-all"
                        >
                          <title>{`${les.lesson.title} (${les.lesson.status})`}</title>
                        </circle>
                      );
                    })
                  )}

                  {/* 4. Summit Certificate Waypoint */}
                  <g
                    transform={`translate(${trailGeometry.summitPoint.x}, ${trailGeometry.summitPoint.y})`}
                    className="cursor-pointer"
                    onClick={() => navigate('/my-certificates')}
                  >
                    <circle
                      r={24}
                      fill={courseStats.completedLessons === courseStats.totalLessons ? '#0284c7' : '#0f172a'}
                      stroke={courseStats.completedLessons === courseStats.totalLessons ? '#38bdf8' : '#334155'}
                      strokeWidth={2}
                      filter={courseStats.completedLessons === courseStats.totalLessons ? 'url(#softGlow)' : undefined}
                    />
                    <Award
                      x={-10}
                      y={-10}
                      className={`w-5 h-5 ${
                        courseStats.completedLessons === courseStats.totalLessons
                          ? 'text-amber-300'
                          : 'text-slate-500'
                      }`}
                    />
                    <text
                      x={0}
                      y={38}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      SUMMIT DIPLOMA
                    </text>
                  </g>

                  {/* 5. Module Waypoints (Interactive Nodes) */}
                  {trailGeometry.waypoints.map((wp, idx) => {
                    const isSelected = selectedModuleId === wp.module.id;

                    return (
                      <g
                        key={wp.module.id}
                        transform={`translate(${wp.point.x}, ${wp.point.y})`}
                        tabIndex={0}
                        role="button"
                        aria-label={`Module ${idx + 1}: ${wp.module.title}, ${wp.module.completed_lessons} of ${
                          wp.module.total_lessons
                        } lessons complete`}
                        onClick={() => setSelectedModuleId(wp.module.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedModuleId(wp.module.id);
                          }
                        }}
                        className="cursor-pointer focus:outline-hidden group"
                      >
                        {/* Outer Pulse Ring for Current Active Module */}
                        {wp.isCurrent && (
                          <circle
                            r={20}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth={1.5}
                            className="animate-ping opacity-40 origin-center"
                          />
                        )}

                        {/* Waypoint Disc */}
                        <circle
                          r={14}
                          fill={wp.isCompleted ? '#0284c7' : wp.isLocked ? '#0f172a' : '#0369a1'}
                          stroke={
                            isSelected
                              ? '#ffffff'
                              : wp.isCompleted
                              ? '#38bdf8'
                              : wp.isLocked
                              ? '#334155'
                              : '#38bdf8'
                          }
                          strokeWidth={isSelected ? 3 : 2}
                          className="transition-all duration-150 group-hover:scale-110"
                        />

                        {/* Waypoint Icon */}
                        {wp.isCompleted ? (
                          <Check x={-6} y={-6} className="w-3 h-3 text-white pointer-events-none" />
                        ) : wp.isLocked ? (
                          <Lock x={-5} y={-5} className="w-2.5 h-2.5 text-slate-500 pointer-events-none" />
                        ) : (
                          <span
                            className="text-[10px] font-mono font-bold text-white select-none pointer-events-none"
                            style={{ transform: 'translate(-4px, 4px)' }}
                          >
                            {idx + 1}
                          </span>
                        )}

                        {/* Module Label beside node */}
                        <text
                          x={idx % 2 === 0 ? -22 : 22}
                          y={4}
                          textAnchor={idx % 2 === 0 ? 'end' : 'start'}
                          fill={wp.isLocked ? '#64748b' : '#e2e8f0'}
                          fontSize="11"
                          fontWeight={isSelected ? 'bold' : 'normal'}
                          className="select-none font-sans"
                        >
                          {wp.module.title.length > 22
                            ? `${wp.module.title.slice(0, 20)}...`
                            : wp.module.title}
                        </text>
                        <text
                          x={idx % 2 === 0 ? -22 : 22}
                          y={18}
                          textAnchor={idx % 2 === 0 ? 'end' : 'start'}
                          fill="#94a3b8"
                          fontSize="9"
                          fontFamily="monospace"
                          className="select-none"
                        >
                          {wp.module.completed_lessons} of {wp.module.total_lessons}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Bottom Instructions Footer */}
              <div className="mt-4 pt-4 border-t border-slate-800 text-center text-xs text-slate-400 font-mono flex items-center justify-center space-x-6">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>Completed Waypoint</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-600 ring-2 ring-sky-400" />
                  <span>Current Module</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                  <span>Locked Waypoint</span>
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: STRUCTURED LEDGER VIEW (ACCESSIBLE LIST) */}
          {activeTab === 'ledger' && (
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
                              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Module {modIdx + 1}
                              </span>
                              {mod.is_locked && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
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
                                <span className="font-mono text-slate-400 text-[11px] hidden sm:inline">
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
                                <span className="text-slate-400 font-mono text-[11px]">Locked</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* Assessment Summary if available */}
                      {mod.assessment && (
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Assessment: {mod.assessment.title}
                          </span>
                          <span className="font-mono text-[11px]">
                            {mod.assessment.passed ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                Passed ({mod.assessment.score_percentage}%)
                              </span>
                            ) : mod.assessment.attempt_count > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400">
                                Attempted ({mod.assessment.score_percentage}%)
                              </span>
                            ) : (
                              <span className="text-slate-400">Pending passing score</span>
                            )}
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
};
