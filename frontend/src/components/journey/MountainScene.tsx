import React, { useState, useMemo } from 'react';
import {
  Award,
  Check,
  Lock,
  PlayCircle,
  Compass,
  Zap,
  Flag,
  Mountain,
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
  X,
  BookOpen,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useDeviceClass } from '../../hooks/useDeviceClass';
import { TrailGeometry, CourseStats, WaypointItem } from '../../hooks/useJourneyData';
import { JourneyModuleItem } from '../../types';

interface MountainSceneProps {
  trailGeometry: TrailGeometry;
  courseStats: CourseStats;
  selectedModuleId: string | null;
  activeModule: JourneyModuleItem | null;
  onSelectModule: (id: string | null) => void;
  onNavigate: (path: string) => void;
}

export const MountainScene: React.FC<MountainSceneProps> = ({
  trailGeometry,
  courseStats,
  selectedModuleId,
  activeModule: _activeModule,
  onSelectModule,
  onNavigate,
}) => {
  const { isDarkMode } = useTheme();
  const { isMobile } = useDeviceClass();

  // Mobile Map Zoom State: defaults to zoomed in (1.43x) on mobile devices for enhanced clarity
  const [zoomLevel, setZoomLevel] = useState<'panoramic' | 'zoomed'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('learnflow_mountain_zoom');
      if (saved === 'panoramic' || saved === 'zoomed') return saved;
      return window.innerWidth < 768 ? 'zoomed' : 'panoramic';
    }
    return 'zoomed';
  });

  const handleSetZoom = (level: 'panoramic' | 'zoomed') => {
    setZoomLevel(level);
    try {
      localStorage.setItem('learnflow_mountain_zoom', level);
    } catch {
      // ignore
    }
  };

  // Dynamic ViewBox:
  // - 'zoomed' (1.43x): crops the trail corridor (140 25 720 825) making road, nodes, and hiker 43% larger on mobile!
  // - 'panoramic' (1.0x): full 0 0 1000 850 landscape
  const activeViewBox = useMemo(() => {
    if (zoomLevel === 'zoomed') {
      return '140 25 720 825';
    }
    return `0 0 ${trailGeometry.width} ${trailGeometry.height}`;
  }, [zoomLevel, trailGeometry.width, trailGeometry.height]);

  const isAllComplete =
    courseStats.completedLessons === courseStats.totalLessons && courseStats.totalLessons > 0;

  // Selected Checkpoint for Reward Dossier - null by default so no obstructive box on load
  const [activeCheckpoint, setActiveCheckpoint] = useState<WaypointItem | null>(null);

  const handleNodeClick = (wp: WaypointItem) => {
    setActiveCheckpoint(wp);
    onSelectModule(wp.module.id);
  };

  const completedCheckpointsCount = trailGeometry.waypoints.filter((w) => w.isCompleted).length;
  const currentBiome =
    trailGeometry.waypoints.find((w) => w.isCurrent)?.checkpoint.biome ||
    (isAllComplete ? 'The Pinnacle of Knowledge' : 'Valley Foothills & Trailhead');

  return (
    <div className="relative rounded-3xl border overflow-hidden font-sans transition-colors duration-300 w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl">
      {/* =========================================================================
          TOP EXPEDITION TELEMETRY HUD RIBBON
          Responsive 2x2 on mobile, 4 columns on desktop/tablet
          ========================================================================= */}
      <div className="p-3 sm:p-4 border-b transition-colors duration-300 bg-slate-50/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 backdrop-blur-md">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
          {/* Telemetry 1: Current Elevation Altimeter */}
          <div className="p-2.5 sm:p-3 rounded-xl border transition-colors bg-white dark:bg-slate-950/70 border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase">
              <span className="flex items-center space-x-1">
                <Mountain className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Elevation</span>
              </span>
              <span className="text-sky-600 dark:text-sky-400 font-bold">{trailGeometry.currentElevation}m</span>
            </div>
            <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(6, trailGeometry.progressPercentage)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Peak Summit: 5,200m</span>
          </div>

          {/* Telemetry 2: Knowledge Mastery Progress */}
          <div className="p-2.5 sm:p-3 rounded-xl border transition-colors bg-white dark:bg-slate-950/70 border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase">
              <span className="flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Knowledge Gained</span>
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{trailGeometry.progressPercentage}%</span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">{currentBiome}</p>
            <span className="text-[10px] text-slate-500 block truncate">
              {courseStats.completedLessons} of {courseStats.totalLessons} lessons mastered
            </span>
          </div>

          {/* Telemetry 3: Checkpoints Reached */}
          <div className="p-2.5 sm:p-3 rounded-xl border transition-colors bg-white dark:bg-slate-950/70 border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase">
              <span className="flex items-center space-x-1">
                <Flag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Checkpoints</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {completedCheckpointsCount} / {trailGeometry.waypoints.length}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
              {isAllComplete ? 'Summit Conquered!' : `Station #${trailGeometry.currentCheckpointIndex + 1} Active`}
            </p>
            <span className="text-[10px] text-slate-500 block">Structured Curriculum Trail</span>
          </div>

          {/* Telemetry 4: Earned Knowledge XP & Setting Mode */}
          <div className="p-2.5 sm:p-3 rounded-xl border transition-colors bg-white dark:bg-slate-950/70 border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase">
              <span className="flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Knowledge XP</span>
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">
                {trailGeometry.earnedKnowledgeXp} XP
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 gap-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                Max {trailGeometry.totalKnowledgeXp} XP
              </span>
              <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                {isDarkMode ? <Moon className="w-3 h-3 text-sky-400" /> : <Sun className="w-3 h-3 text-amber-500" />}
                <span className="hidden sm:inline">{isDarkMode ? 'Alpine Night' : 'Alpine Daylight'}</span>
                <span className="sm:hidden">{isDarkMode ? 'Night' : 'Day'}</span>
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-mono">
              {isAllComplete ? 'Full Diploma XP Awarded' : '+1,000 XP Summit Bonus'}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CHECKPOINT REWARD DOSSIER DRAWER (Shown ONLY when a checkpoint is clicked)
          Matches actual course module & lessons from ledger 100%
          ========================================================================= */}
      {activeCheckpoint && (
        <div className="absolute top-20 sm:top-24 right-3 sm:right-6 z-30 w-[94%] sm:w-88 rounded-2xl p-4 sm:p-5 shadow-2xl transition-all border backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white max-h-[80vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider mb-1 bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400">
                <Compass className="w-3 h-3" />
                <span>Station {activeCheckpoint.index + 1} • Elev. {activeCheckpoint.checkpoint.elevation}m</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {activeCheckpoint.module.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 italic">
                {activeCheckpoint.checkpoint.biome}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveCheckpoint(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
            {activeCheckpoint.checkpoint.description}
          </p>

          {/* Reward Box */}
          <div className="mt-3 p-3 rounded-xl border space-y-2 bg-gradient-to-br from-amber-50/50 to-slate-50 dark:from-slate-800/90 dark:to-slate-900 border-amber-200 dark:border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                <span>Milestone Reward</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                activeCheckpoint.isCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}>
                {activeCheckpoint.isCompleted ? 'CLAIMED' : 'UNLOCKED AT MILESTONE'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 flex items-center justify-center text-amber-700 dark:text-amber-300">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block text-xs">{activeCheckpoint.checkpoint.rewardBadge}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">+{activeCheckpoint.checkpoint.rewardXp} Knowledge XP</span>
                </div>
              </div>
            </div>

            {/* Actual Module Lessons matching Ledger */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mb-1">
                Curriculum Lessons at this Station:
              </span>
              <div className="space-y-1">
                {activeCheckpoint.module.lessons.map((les, lIdx) => (
                  <div
                    key={lIdx}
                    className="flex items-center justify-between p-1.5 rounded bg-white/70 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 text-[11px]"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      {les.status === 'completed' ? (
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                      <span className={`truncate ${les.status === 'completed' ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                        {les.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1">
                      {les.duration_minutes}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Module Assessment Status (if present) */}
          {activeCheckpoint.module.assessment && (
            <div className="mt-3 p-2.5 rounded-xl border space-y-1.5 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60">
              <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                {activeCheckpoint.module.assessment.title}
              </div>
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                {activeCheckpoint.module.assessment.passed ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Passed ({activeCheckpoint.module.assessment.score_percentage || 0}%)</span>
                ) : activeCheckpoint.module.assessment.attempt_count > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400">Attempted ({activeCheckpoint.module.assessment.score_percentage || 0}%)</span>
                ) : (
                  <span>Not yet attempted</span>
                )}
              </div>
              {!activeCheckpoint.module.is_locked && (
                <button
                  type="button"
                  onClick={() => onNavigate(`/assessments/${activeCheckpoint.module.assessment?.assessment_id}`)}
                  className="w-full py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center justify-center space-x-1"
                >
                  <span>Launch Assessment</span>
                </button>
              )}
            </div>
          )}

          {/* Launch / Continue Action Button */}
          {!activeCheckpoint.isLocked && (
            <button
              type="button"
              onClick={() => {
                const nextLes = activeCheckpoint.module.lessons.find((l) => l.status !== 'completed') || activeCheckpoint.module.lessons[0];
                if (nextLes) {
                  onNavigate(`/lessons/${nextLes.id}`);
                } else {
                  onNavigate(`/courses`);
                }
              }}
              className="mt-3.5 w-full py-2 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Continue Hiking Ascent</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* =========================================================================
          MAIN MOUNTAIN SCENE SVG CANVAS (VIEWPORT)
          Edge-to-edge full width widescreen layout (1000 x 850)
          No black gaps, single document scroll, day/night atmospheric transitions!
          ========================================================================= */}
      <div className="w-full overflow-hidden relative">
        {/* Floating Zoom Map Controls (Enhanced Mobile Visuality) */}
        <div className="absolute top-3 left-3 z-20 flex items-center space-x-1 bg-slate-900/85 dark:bg-slate-900/90 text-white backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-md text-xs select-none">
          <button
            type="button"
            onClick={() => handleSetZoom('zoomed')}
            aria-label="Zoom in map on mobile"
            title="Zoomed Trail Focus (1.4x magnification for mobile visuality)"
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
              zoomLevel === 'zoomed'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ZoomIn className="w-3 h-3" />
            <span>1.4x Trail</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetZoom('panoramic')}
            aria-label="Panoramic full vista view"
            title="Panoramic Vista (1.0x wide landscape)"
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
              zoomLevel === 'panoramic'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ZoomOut className="w-3 h-3" />
            <span>1.0x Vista</span>
          </button>
        </div>

        <svg
          viewBox={activeViewBox}
          className="w-full h-auto block select-none transition-all duration-300 ease-out"
        >
          <defs>
            {/* Sky Atmosphere Gradient (Daylight Azure vs Night Celestial) */}
            {isDarkMode ? (
              <linearGradient id="skyAtmosphere" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#030712" />
                <stop offset="30%" stopColor="#0a1329" />
                <stop offset="60%" stopColor="#111c38" />
                <stop offset="100%" stopColor="#182a47" />
              </linearGradient>
            ) : (
              <linearGradient id="skyAtmosphere" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="35%" stopColor="#7dd3fc" />
                <stop offset="70%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#f0f9ff" />
              </linearGradient>
            )}

            {/* Sun / Alpenglow Radial Aura */}
            <radialGradient id="sunAlpenglow" cx="50%" cy="50%" r="50%">
              {isDarkMode ? (
                <>
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#0284c7" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#030712" stopOpacity="0" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.55" />
                  <stop offset="45%" stopColor="#fbbf24" stopOpacity="0.3" />
                  <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#f0f9ff" stopOpacity="0" />
                </>
              )}
            </radialGradient>

            {/* Far Mountain Gradient (Daylight Slate-Blue vs Night Midnight) */}
            <linearGradient id="farMountainGrad" x1="0" y1="0" x2="0" y2="1">
              {isDarkMode ? (
                <>
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="60%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#070d18" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="50%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </>
              )}
            </linearGradient>

            {/* Midground Mountain Gradient (Granite Ridge Crags) */}
            <linearGradient id="midMountainGrad" x1="0" y1="0" x2="0" y2="1">
              {isDarkMode ? (
                <>
                  <stop offset="0%" stopColor="#142a3d" />
                  <stop offset="50%" stopColor="#0c1d2b" />
                  <stop offset="100%" stopColor="#06111a" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="45%" stopColor="#64748b" />
                  <stop offset="85%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </>
              )}
            </linearGradient>

            {/* Foreground Slope Gradient (Lush Greenery) */}
            <linearGradient id="forestSlopeGrad" x1="0" y1="0" x2="0" y2="1">
              {isDarkMode ? (
                <>
                  <stop offset="0%" stopColor="#064e3b" />
                  <stop offset="60%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#022c22" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#047857" />
                  <stop offset="50%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#10b981" />
                </>
              )}
            </linearGradient>

            {/* Valley Floor Meadow Gradient */}
            <linearGradient id="valleyMeadowGrad" x1="0" y1="0" x2="0" y2="1">
              {isDarkMode ? (
                <>
                  <stop offset="0%" stopColor="#065f46" />
                  <stop offset="50%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#022c22" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#15803d" />
                  <stop offset="50%" stopColor="#16a34a" />
                  <stop offset="100%" stopColor="#22c55e" />
                </>
              )}
            </linearGradient>

            {/* Completed Trail Shimmer Gradient */}
            <linearGradient id="completedTrailGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="40%" stopColor="#06b6d4" />
              <stop offset="70%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>

            {/* Stream Gradient */}
            <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Reusable Pine Tree */}
            <g id="pineTree">
              <rect x="-2" y="14" width="4" height="8" fill="#78350f" />
              <polygon
                points="0,-18 10,-6 6,-6 13,4 8,4 16,14 -16,14 -8,4 -13,4 -6,-6 -10,-6"
                fill={isDarkMode ? '#064e3b' : '#15803d'}
              />
              <polygon
                points="0,-18 7,-6 4,-6 10,4 6,4 12,14 0,14"
                fill={isDarkMode ? '#047857' : '#22c55e'}
                opacity="0.5"
              />
            </g>

            {/* Reusable Grass Blades */}
            <g id="grassTuft">
              <path
                d="M 0 0 L -3 -9 L -1 -12 L 0 0 M 0 0 L 0 -14 L 2 -12 L 0 0 M 0 0 L 3 -10 L 4 -8 L 0 0"
                stroke={isDarkMode ? '#10b981' : '#22c55e'}
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </defs>

          {/* =================================================================
              1. EDGE-TO-EDGE SKY & ATMOSPHERE (0 to 1000)
              ================================================================= */}
          <rect width="1000" height="850" fill="url(#skyAtmosphere)" />

          {/* Sun (Daylight) or Alpenglow Moon Aura (Night) */}
          <circle cx="500" cy="90" r="140" fill="url(#sunAlpenglow)" />
          {!isDarkMode && (
            <g transform="translate(500, 85)">
              <circle cx="0" cy="0" r="45" fill="#f59e0b" opacity="0.3" filter="url(#softGlow)" />
              <circle cx="0" cy="0" r="32" fill="#fbbf24" />
              <circle cx="0" cy="0" r="24" fill="#fef08a" />
            </g>
          )}

          {/* Twinkling Stars in Dark Mode */}
          {isDarkMode &&
            [
              { cx: 70, cy: 35, r: 1.2 },
              { cx: 140, cy: 65, r: 1.4 },
              { cx: 210, cy: 40, r: 1.0 },
              { cx: 290, cy: 75, r: 1.3 },
              { cx: 360, cy: 30, r: 1.5 },
              { cx: 640, cy: 45, r: 1.2 },
              { cx: 710, cy: 70, r: 1.4 },
              { cx: 780, cy: 35, r: 1.0 },
              { cx: 860, cy: 60, r: 1.5 },
              { cx: 930, cy: 30, r: 1.1 },
            ].map((st, sIdx) => (
              <circle key={sIdx} cx={st.cx} cy={st.cy} r={st.r} fill="#ffffff" opacity="0.85" />
            ))}

          {/* Fluffy Mountain Clouds */}
          <path
            d="M 120 180 Q 180 160 240 175 Q 300 160 360 185 Q 300 200 240 190 Q 180 205 120 180 Z"
            fill="#ffffff"
            opacity={isDarkMode ? '0.08' : '0.4'}
          />
          <path
            d="M 640 190 Q 700 170 760 185 Q 820 170 880 195 Q 820 210 760 200 Q 700 215 640 190 Z"
            fill="#ffffff"
            opacity={isDarkMode ? '0.08' : '0.4'}
          />

          {/* =================================================================
              2. EDGE-TO-EDGE FAR MOUNTAIN PEAKS & SNOWCAPS
              ================================================================= */}
          {/* Far Peak Left: from x: 0 to 450 */}
          <polygon points="0,520 220,130 460,520" fill="url(#farMountainGrad)" opacity="0.9" />
          <polygon points="220,130 250,190 225,180 210,200 190,185 220,130" fill="#ffffff" />

          {/* Far Peak Right: from x: 540 to 1000 */}
          <polygon points="540,520 780,140 1000,520" fill="url(#farMountainGrad)" opacity="0.9" />
          <polygon points="780,140 810,200 785,190 770,210 750,195 780,140" fill="#ffffff" />

          {/* =================================================================
              3. EDGE-TO-EDGE CENTRAL SUMMIT MOUNTAIN (x: 0 to 1000)
              ================================================================= */}
          <polygon points="0,850 500,80 1000,850" fill="url(#midMountainGrad)" />

          {/* Summit Dazzling Snowcap */}
          <polygon points="500,80 540,150 515,140 495,165 475,145 460,160 500,80" fill="#ffffff" />
          <polygon points="500,80 525,145 500,135 485,150 500,80" fill="#bae6fd" opacity="0.6" />

          {/* Rock Strata Ridges */}
          <path d="M 500 80 L 490 260 L 520 480 L 480 700 L 500 850" stroke="#0f172a" strokeWidth="2.5" fill="none" opacity={isDarkMode ? '0.7' : '0.2'} />
          <path d="M 500 80 L 530 220 L 470 420 L 540 640" stroke="#0f172a" strokeWidth="2" fill="none" opacity={isDarkMode ? '0.6' : '0.15'} />

          {/* Cascading Crystalline Waterfall Stream */}
          <path
            d="M 495 240 Q 485 360 505 460 Q 525 560 480 660 Q 450 720 440 850"
            fill="none"
            stroke="url(#streamGrad)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M 495 240 Q 485 360 505 460 Q 525 560 480 660 Q 450 720 440 850"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeDasharray="6 5"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* =================================================================
              4. FOREGROUND TIMBERLINE SLOPES & VALLEY MEADOWS (x: 0 to 1000)
              ================================================================= */}
          {/* Left Forest Ridge */}
          <path d="M 0 540 Q 240 500 420 680 Q 240 850 0 850 Z" fill="url(#forestSlopeGrad)" opacity="0.95" />

          {/* Right Forest Ridge */}
          <path d="M 1000 500 Q 760 460 580 660 Q 760 850 1000 850 Z" fill="url(#forestSlopeGrad)" opacity="0.95" />

          {/* Bottom Valley Meadow Floor: edge-to-edge from 0 to 1000 */}
          <path d="M 0 710 Q 300 660 500 690 Q 700 660 1000 710 L 1000 850 L 0 850 Z" fill="url(#valleyMeadowGrad)" />

          {/* Trees across the base and switchbacks */}
          <use href="#pineTree" x="70" y="740" transform="scale(1.2)" />
          <use href="#pineTree" x="130" y="730" transform="scale(1.3)" />
          <use href="#pineTree" x="90" y="780" transform="scale(1.4)" />
          <use href="#pineTree" x="870" y="730" transform="scale(1.3)" />
          <use href="#pineTree" x="930" y="740" transform="scale(1.2)" />
          <use href="#pineTree" x="900" y="780" transform="scale(1.4)" />
          <use href="#pineTree" x="180" y="660" transform="scale(0.9)" />
          <use href="#pineTree" x="820" y="640" transform="scale(0.9)" />
          <use href="#pineTree" x="220" y="520" transform="scale(0.75)" />
          <use href="#pineTree" x="780" y="490" transform="scale(0.75)" />

          {/* Grass Tufts */}
          <use href="#grassTuft" x="180" y="790" />
          <use href="#grassTuft" x="320" y="800" />
          <use href="#grassTuft" x="660" y="790" />
          <use href="#grassTuft" x="800" y="810" />

          {/* =================================================================
              5. THE ROAD / HIKING TRAIL (ROAD CUM MOUNTAIN)
              ================================================================= */}
          {/* Outer Earthen Base Bed */}
          {trailGeometry.segments.map((seg, idx) => (
            <path
              key={`base-${idx}`}
              d={seg.d}
              fill="none"
              stroke={isDarkMode ? '#451a03' : '#78350f'}
              strokeWidth="11"
              strokeLinecap="round"
              opacity="0.9"
            />
          ))}

          {/* Inner Gravel Road Switchback */}
          {trailGeometry.segments.map((seg, idx) => (
            <path
              key={`inner-${idx}`}
              d={seg.d}
              fill="none"
              stroke={isDarkMode ? '#92400e' : '#ca8a04'}
              strokeWidth="7"
              strokeLinecap="round"
            />
          ))}

          {/* Active / Illuminated Path Segment */}
          {trailGeometry.segments.map((seg, idx) => {
            const isCompleted = seg.status === 'completed';
            const isLocked = seg.status === 'locked';

            return (
              <path
                key={`active-${idx}`}
                d={seg.d}
                fill="none"
                stroke={isCompleted ? 'url(#completedTrailGrad)' : isLocked ? (isDarkMode ? '#334155' : '#cbd5e1') : '#0284c7'}
                strokeWidth={isCompleted ? 4 : isLocked ? 2 : 3}
                strokeDasharray={isLocked ? '6 6' : undefined}
                strokeLinecap="round"
                filter={isCompleted ? 'url(#softGlow)' : undefined}
              />
            );
          })}

          {/* =================================================================
              6. THE TRAVELER (THE HIKER ASCENDING THE MOUNTAIN)
              ================================================================= */}
          <g
            transform={`translate(${trailGeometry.travelerPoint.x}, ${trailGeometry.travelerPoint.y})`}
            className="cursor-pointer group"
            onClick={() => {
              const currentWp = trailGeometry.waypoints.find((w) => w.isCurrent) || trailGeometry.waypoints[0];
              if (currentWp) handleNodeClick(currentWp);
            }}
          >
            <circle r="20" fill="#38bdf8" opacity="0.3" filter="url(#softGlow)" />
            <circle r="12" fill="#0284c7" opacity="0.4" />

            {/* Glowing Golden Footsteps */}
            <circle cx="-9" cy="7" r="2" fill="#facc15" opacity="0.75" />
            <circle cx="-16" cy="12" r="1.5" fill="#facc15" opacity="0.5" />

            {/* Hiker Illustration */}
            <g transform="translate(0, -17)">
              <line x1="7" y1="2" x2="12" y2="22" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
              <rect x="-10" y="4" width="7" height="10" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1" />
              <rect x="-5" y="4" width="10" height="11" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
              <rect x="-4" y="15" width="3" height="6" rx="1" fill="#1e293b" />
              <rect x="1" y="15" width="3" height="6" rx="1" fill="#1e293b" />
              <circle cx="0" cy="0" r="5" fill="#fed7aa" />
              <circle cx="0" cy="-3" r="4.5" fill="#0369a1" />
            </g>

            {/* Floating Hiker HUD Tooltip */}
            <g transform="translate(0, -50)" className="pointer-events-none select-none">
              <rect
                x="-75"
                y="-13"
                width="150"
                height="26"
                rx="13"
                fill={isDarkMode ? '#0f172a' : '#ffffff'}
                stroke={isDarkMode ? '#38bdf8' : '#0284c7'}
                strokeWidth="1.5"
                filter="url(#softGlow)"
              />
              <circle cx="-60" cy="0" r="3.5" fill="#38bdf8" className="animate-pulse" />
              <text
                x="-50"
                y="3"
                fill={isDarkMode ? '#ffffff' : '#0f172a'}
                fontSize="9"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                YOU ARE HERE
              </text>
              <text x="14" y="3" fill="#0284c7" fontSize="8" fontFamily="monospace" fontWeight="bold">
                {trailGeometry.currentElevation}m
              </text>
            </g>
          </g>

          {/* =================================================================
              7. STRUCTURED MILESTONE SLOTS (TICKS IN SLOTS)
              Matching course modules and ledger directly
              ================================================================= */}
          {trailGeometry.waypoints.map((wp, idx) => {
            const isSelected = selectedModuleId === wp.module.id || activeCheckpoint?.id === wp.id;

            return (
              <g
                key={wp.id}
                transform={`translate(${wp.point.x}, ${wp.point.y})`}
                tabIndex={0}
                role="button"
                aria-label={`Checkpoint ${idx + 1}: ${wp.checkpoint.name || wp.module.title}, Elevation ${wp.checkpoint.elevation}m, Reward: ${wp.checkpoint.rewardXp} XP`}
                onClick={() => handleNodeClick(wp)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNodeClick(wp);
                  }
                }}
                className="cursor-pointer focus:outline-hidden group"
              >
                {/* 1. Station Embossed Stone Base Pad */}
                <circle
                  r={22}
                  fill={isDarkMode ? '#0f172a' : '#f8fafc'}
                  stroke={isDarkMode ? '#334155' : '#cbd5e1'}
                  strokeWidth="2"
                  className="transition-transform duration-200 group-hover:scale-110"
                />

                {/* 2. Structured Slot Inner Station (with centered tick/lock) */}
                <circle
                  r={15}
                  fill={
                    wp.isCompleted
                      ? '#10b981'
                      : wp.isLocked
                      ? (isDarkMode ? '#1e293b' : '#e2e8f0')
                      : '#0284c7'
                  }
                  stroke={
                    isSelected
                      ? '#facc15'
                      : wp.isCompleted
                      ? '#059669'
                      : wp.isLocked
                      ? (isDarkMode ? '#475569' : '#94a3b8')
                      : '#38bdf8'
                  }
                  strokeWidth={isSelected ? 3 : 2}
                  filter={wp.isCompleted ? 'url(#softGlow)' : undefined}
                />

                {/* Centered Structured Tick / Lock in Slot */}
                {wp.isCompleted ? (
                  <Check x={-7} y={-7} className="w-3.5 h-3.5 text-white pointer-events-none" />
                ) : wp.isLocked ? (
                  <Lock
                    x={-6}
                    y={-6}
                    className={`w-3 h-3 pointer-events-none ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                  />
                ) : (
                  <text
                    x={0}
                    y={4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="select-none pointer-events-none"
                  >
                    {idx + 1}
                  </text>
                )}

                {/* 3. Structured Station Badge Card (Neatly aligned in slot below pad) */}
                <g transform="translate(0, 26)">
                  <rect
                    x="-80"
                    y="0"
                    width="160"
                    height="32"
                    rx="8"
                    fill={isDarkMode ? '#0f172a' : '#ffffff'}
                    stroke={isSelected ? '#38bdf8' : (isDarkMode ? '#334155' : '#cbd5e1')}
                    strokeWidth={isSelected ? 1.5 : 1}
                    className="shadow-xs"
                    opacity={isDarkMode ? 0.95 : 0.98}
                  />
                  <text
                    x="0"
                    y="13"
                    textAnchor="middle"
                    fill={isDarkMode ? '#ffffff' : '#0f172a'}
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                    className="select-none"
                  >
                    {wp.module.title.length > 22
                      ? `${wp.module.title.slice(0, 20)}...`
                      : wp.module.title}
                  </text>
                  <text
                    x="0"
                    y="24"
                    textAnchor="middle"
                    fill={isDarkMode ? '#38bdf8' : '#0284c7'}
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="semibold"
                    className="select-none"
                  >
                    {wp.checkpoint.name || `${wp.module.completed_lessons} of ${wp.module.total_lessons} Lessons`} • {wp.checkpoint.elevation}m
                  </text>
                </g>
              </g>
            );
          })}

          {/* =================================================================
              8. THE SUMMIT OF KNOWLEDGE (PINNACLE AT 5,200m)
              ================================================================= */}
          <g
            transform={`translate(${trailGeometry.summitPoint.x}, ${trailGeometry.summitPoint.y})`}
            className="cursor-pointer group"
            tabIndex={0}
            role="button"
            aria-label="The Pinnacle of Knowledge Summit: Claim Verified Institutional Diploma"
            onClick={() => onNavigate('/my-certificates')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigate('/my-certificates');
              }
            }}
          >
            {/* Radiant Victory Sunburst */}
            <circle r="34" fill="#f59e0b" opacity="0.25" filter="url(#softGlow)" />

            {/* Golden Summit Flag */}
            <g transform="translate(15, -34)">
              <line x1="0" y1="0" x2="0" y2="38" stroke="#f59e0b" strokeWidth="2.5" />
              <polygon points="0,0 22,6 0,12" fill="#f59e0b" filter="url(#softGlow)" />
            </g>

            {/* Summit Medal Disc */}
            <circle
              r={24}
              fill={isAllComplete ? '#0284c7' : (isDarkMode ? '#0f172a' : '#f8fafc')}
              stroke={isAllComplete ? '#facc15' : (isDarkMode ? '#334155' : '#cbd5e1')}
              strokeWidth={3}
              filter={isAllComplete ? 'url(#softGlow)' : undefined}
              className="transition-transform group-hover:scale-110"
            />

            <Award
              x={-11}
              y={-11}
              className={`w-6 h-6 pointer-events-none ${
                isAllComplete ? 'text-amber-300' : 'text-slate-400'
              }`}
            />

            {/* Summit Label Pill */}
            <g transform="translate(0, -42)" className="pointer-events-none select-none">
              <rect
                x="-70"
                y="-11"
                width="140"
                height="22"
                rx="11"
                fill={isDarkMode ? '#0f172a' : '#ffffff'}
                stroke={isAllComplete ? '#facc15' : '#38bdf8'}
                strokeWidth="1.5"
                opacity="0.95"
              />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fill={isAllComplete ? '#f59e0b' : (isDarkMode ? '#94a3b8' : '#0f172a')}
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                SUMMIT: 5,200m
              </text>
            </g>

            {/* Conqueror Banner if complete */}
            {isAllComplete && (
              <g transform="translate(0, 38)" className="pointer-events-none select-none">
                <rect x="-85" y="-11" width="170" height="22" rx="6" fill="#065f46" stroke="#34d399" strokeWidth="1.5" />
                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                  ★ KNOWLEDGE MASTERED ★
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* =========================================================================
          BOTTOM LEGEND & FOOTER
          ========================================================================= */}
      <div className="p-3 sm:p-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs font-mono transition-colors duration-300 bg-slate-50/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
            <span>Mastered Station</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-sky-300 animate-pulse" />
            <span>Active Hiker Altitude</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span>Upcoming Peak Station</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Summit Institutional Diploma</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          Click any station slot along the mountain road to review module curriculum lessons.
        </div>
      </div>
    </div>
  );
};
