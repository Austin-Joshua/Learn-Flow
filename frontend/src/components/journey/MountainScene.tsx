import React, { useState } from 'react';
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
  ShieldCheck,
  Flame,
  Tent,
  X,
} from 'lucide-react';
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
  activeModule,
  onSelectModule,
  onNavigate,
}) => {
  const isAllComplete =
    courseStats.completedLessons === courseStats.totalLessons && courseStats.totalLessons > 0;

  // Selected Checkpoint for Reward Dossier
  const [activeCheckpoint, setActiveCheckpoint] = useState<WaypointItem | null>(() => {
    // Default to the traveler's current active checkpoint
    return (
      trailGeometry.waypoints.find((w) => w.isCurrent) ||
      trailGeometry.waypoints[0] ||
      null
    );
  });

  const handleNodeClick = (wp: WaypointItem) => {
    setActiveCheckpoint(wp);
    onSelectModule(wp.module.id);
  };

  const completedCheckpointsCount = trailGeometry.waypoints.filter((w) => w.isCompleted).length;
  const currentBiome =
    trailGeometry.waypoints.find((w) => w.isCurrent)?.checkpoint.biome ||
    (isAllComplete ? 'The Pinnacle of Knowledge' : 'Valley Foothills');

  return (
    <div className="relative bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden font-sans">
      {/* =========================================================================
          TOP EXPEDITION TELEMETRY HUD RIBBON
          ========================================================================= */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-3 sm:p-4 backdrop-blur-md">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Telemetry 1: Current Elevation Altimeter */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase">
              <span className="flex items-center space-x-1">
                <Mountain className="w-3 h-3 text-sky-400" />
                <span>Elevation</span>
              </span>
              <span className="text-sky-400 font-bold">{trailGeometry.currentElevation}m</span>
            </div>
            <div className="mt-1.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(6, trailGeometry.progressPercentage)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Peak Summit: 5,200m</span>
          </div>

          {/* Telemetry 2: Knowledge Mastery Progress */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase">
              <span className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Knowledge Gained</span>
              </span>
              <span className="text-amber-400 font-bold">{trailGeometry.progressPercentage}%</span>
            </div>
            <p className="text-xs font-bold text-white mt-1 truncate">{currentBiome}</p>
            <span className="text-[10px] text-slate-500 block truncate">
              {courseStats.completedLessons} of {courseStats.totalLessons} lessons mastered
            </span>
          </div>

          {/* Telemetry 3: Checkpoints Reached */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase">
              <span className="flex items-center space-x-1">
                <Flag className="w-3 h-3 text-emerald-400" />
                <span>Checkpoints</span>
              </span>
              <span className="text-emerald-400 font-bold">
                {completedCheckpointsCount} / {trailGeometry.waypoints.length}
              </span>
            </div>
            <p className="text-xs font-bold text-white mt-1">
              {isAllComplete ? 'Summit Conquered!' : `Milestone #${trailGeometry.currentCheckpointIndex + 1} Active`}
            </p>
            <span className="text-[10px] text-slate-500 block">7 Alpine Stages + Summit</span>
          </div>

          {/* Telemetry 4: Earned Knowledge XP */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase">
              <span className="flex items-center space-x-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Knowledge XP</span>
              </span>
              <span className="text-amber-400 font-bold font-mono">
                {trailGeometry.earnedKnowledgeXp} XP
              </span>
            </div>
            <p className="text-xs font-bold text-slate-200 mt-1">
              Max {trailGeometry.totalKnowledgeXp} XP Available
            </p>
            <span className="text-[10px] text-emerald-400 block font-mono">
              {isAllComplete ? 'Full Diploma XP Awarded' : '+1,000 XP Summit Bonus'}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CHECKPOINT REWARD DOSSIER DRAWER (Shown when a checkpoint is inspected)
          ========================================================================= */}
      {activeCheckpoint && (
        <div className="absolute top-20 sm:top-24 right-3 sm:right-6 z-30 w-[92%] sm:w-88 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xl text-white transition-all max-h-[85vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-sky-950/80 border border-sky-800 text-[10px] font-mono font-semibold text-sky-400 uppercase tracking-wider mb-1">
                <Compass className="w-3 h-3" />
                <span>Stage {activeCheckpoint.index + 1} • Elev. {activeCheckpoint.checkpoint.elevation}m</span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {activeCheckpoint.checkpoint.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 italic">
                {activeCheckpoint.checkpoint.biome}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveCheckpoint(null)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
            {activeCheckpoint.checkpoint.description}
          </p>

          {/* Reward Chest Box */}
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-900 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Checkpoint Rewards</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                activeCheckpoint.isCompleted
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {activeCheckpoint.isCompleted ? 'CLAIMED' : 'UNLOCKED AT MILESTONE'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block text-xs">{activeCheckpoint.checkpoint.rewardBadge}</span>
                  <span className="text-[10px] text-slate-400 font-mono">+{activeCheckpoint.checkpoint.rewardXp} Knowledge XP</span>
                </div>
              </div>
            </div>

            {/* Knowledge Skills Conquered */}
            <div className="pt-2 border-t border-slate-700/60">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">Skills Conquered at this Altitude:</span>
              <div className="flex flex-wrap gap-1">
                {activeCheckpoint.checkpoint.skills.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-2 py-0.5 rounded bg-slate-950/70 border border-slate-700 text-[10px] font-mono text-sky-300"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Mapped Course Module & Lessons */}
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
              <span>Associated Module:</span>
              <span className="font-semibold text-white">{activeCheckpoint.module.title}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
              <span>Lessons Mastered:</span>
              <span className="font-semibold text-sky-400">
                {activeCheckpoint.module.completed_lessons} of {activeCheckpoint.module.total_lessons}
              </span>
            </div>

            {/* Module Assessment Status */}
            {activeCheckpoint.module.assessment && (
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-200">
                  {activeCheckpoint.module.assessment.title}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {activeCheckpoint.module.assessment.passed ? (
                    <span className="text-emerald-400 font-semibold">Passed ({activeCheckpoint.module.assessment.score_percentage || 0}%)</span>
                  ) : activeCheckpoint.module.assessment.attempt_count > 0 ? (
                    <span className="text-amber-400">Attempted ({activeCheckpoint.module.assessment.score_percentage || 0}%)</span>
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
                    <span>Take Module Assessment</span>
                  </button>
                )}
              </div>
            )}
          </div>

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
          Rich alpine landscape with sky, multi-colored mountains, pine trees,
          wildflowers, cascading waterfalls, campfire, hiking road, checkpoints,
          and the traveling hiker ascending to the summit!
          ========================================================================= */}
      <div className="overflow-x-hidden max-h-[850px] overflow-y-auto">
        <svg
          viewBox={`0 0 ${trailGeometry.width} ${trailGeometry.height}`}
          className="w-full max-w-[850px] mx-auto select-none"
          style={{ minHeight: `${Math.min(800, trailGeometry.height)}px` }}
        >
          <defs>
            {/* Sky Atmosphere Gradient */}
            <linearGradient id="skyAtmosphere" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#050b17" />
              <stop offset="25%" stopColor="#0a182e" />
              <stop offset="50%" stopColor="#11294a" />
              <stop offset="75%" stopColor="#183b63" />
              <stop offset="100%" stopColor="#1e4d75" />
            </linearGradient>

            {/* Radiant Alpenglow Sun behind Summit */}
            <radialGradient id="sunAlpenglow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="40%" stopColor="#eab308" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#050b17" stopOpacity="0" />
            </radialGradient>

            {/* Far Background Mountain Gradient (Purple/Slate) */}
            <linearGradient id="farMountainGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#0a121e" />
            </linearGradient>

            {/* Midground Rocky Crags Gradient (Teal/Slate Granite) */}
            <linearGradient id="midMountainGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16334a" />
              <stop offset="40%" stopColor="#0f2638" />
              <stop offset="80%" stopColor="#091c2b" />
              <stop offset="100%" stopColor="#05121c" />
            </linearGradient>

            {/* Foreground Mountain Slopes (Alpine Forest Green) */}
            <linearGradient id="forestSlopeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#064e3b" />
              <stop offset="50%" stopColor="#047857" />
              <stop offset="85%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Lowland Valley Meadow Gradient (Lush Emerald & Spring Green) */}
            <linearGradient id="valleyMeadowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="30%" stopColor="#047857" />
              <stop offset="70%" stopColor="#15803d" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>

            {/* Completed Glowing Trail Gradient */}
            <linearGradient id="completedTrailGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="40%" stopColor="#06b6d4" />
              <stop offset="70%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>

            {/* Mountain Stream / Waterfall Gradient */}
            <linearGradient id="waterfallGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Glow Filters */}
            <filter id="softGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="lanternGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Reusable Pine Tree Symbol */}
            <g id="pineTree">
              <rect x="-2" y="14" width="4" height="8" fill="#451a03" />
              <polygon points="0,-18 10,-6 6,-6 13,4 8,4 16,14 -16,14 -8,4 -13,4 -6,-6 -10,-6" fill="#064e3b" />
              <polygon points="0,-18 7,-6 4,-6 10,4 6,4 12,14 0,14" fill="#047857" opacity="0.6" />
            </g>

            {/* Reusable Miniature Pine Tree Symbol */}
            <g id="pineTreeSmall">
              <rect x="-1" y="9" width="2" height="5" fill="#451a03" />
              <polygon points="0,-12 7,-4 4,-4 9,3 6,3 11,10 -11,10 -6,3 -9,3 -4,-4 -7,-4" fill="#064e3b" />
            </g>

            {/* Reusable Grass Blades Symbol */}
            <g id="grassTuft">
              <path d="M 0 0 L -3 -9 L -1 -12 L 0 0 M 0 0 L 0 -14 L 2 -12 L 0 0 M 0 0 L 3 -10 L 4 -8 L 0 0" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </g>

            {/* Reusable Alpine Wildflower Symbol */}
            <g id="wildflowerYellow">
              <circle cx="-3" cy="-4" r="1.5" fill="#facc15" />
              <circle cx="3" cy="-3" r="1.5" fill="#facc15" />
              <circle cx="0" cy="-6" r="1.8" fill="#facc15" />
              <circle cx="0" cy="-6" r="0.6" fill="#78350f" />
            </g>

            <g id="wildflowerBlue">
              <circle cx="-3" cy="-4" r="1.5" fill="#38bdf8" />
              <circle cx="3" cy="-3" r="1.5" fill="#38bdf8" />
              <circle cx="0" cy="-6" r="1.8" fill="#38bdf8" />
              <circle cx="0" cy="-6" r="0.6" fill="#ffffff" />
            </g>

            {/* Stacked Stone Cairn Symbol */}
            <g id="stoneCairn">
              <ellipse cx="0" cy="0" rx="9" ry="4" fill="#64748b" />
              <ellipse cx="0" cy="-4" rx="7" ry="3.5" fill="#94a3b8" />
              <ellipse cx="0" cy="-8" rx="5" ry="2.5" fill="#cbd5e1" />
              <ellipse cx="0" cy="-11" rx="3" ry="2" fill="#e2e8f0" />
            </g>
          </defs>

          {/* =================================================================
              1. CELESTIAL ALPINE SKY & ATMOSPHERE
              ================================================================= */}
          <rect width="800" height="1150" fill="url(#skyAtmosphere)" />

          {/* Golden Sun / Alpenglow behind Peak */}
          <circle cx="400" cy="115" r="180" fill="url(#sunAlpenglow)" />

          {/* Twinkling Star Field in Upper Sky */}
          {[
            { cx: 80, cy: 35, r: 1.2, op: 0.8 },
            { cx: 160, cy: 70, r: 1.5, op: 0.9 },
            { cx: 240, cy: 40, r: 1.0, op: 0.7 },
            { cx: 310, cy: 80, r: 1.3, op: 0.85 },
            { cx: 490, cy: 45, r: 1.4, op: 0.9 },
            { cx: 560, cy: 75, r: 1.0, op: 0.6 },
            { cx: 640, cy: 30, r: 1.6, op: 0.95 },
            { cx: 720, cy: 65, r: 1.2, op: 0.75 },
            { cx: 120, cy: 120, r: 1.0, op: 0.6 },
            { cx: 680, cy: 110, r: 1.3, op: 0.8 },
            { cx: 50, cy: 90, r: 1.1, op: 0.7 },
            { cx: 750, cy: 130, r: 1.4, op: 0.85 },
          ].map((star, sIdx) => (
            <circle
              key={sIdx}
              cx={star.cx}
              cy={star.cy}
              r={star.r}
              fill="#ffffff"
              opacity={star.op}
            />
          ))}

          {/* Soaring Alpine Eagles */}
          <g transform="translate(290, 85) scale(0.7)" opacity="0.6">
            <path d="M 0 0 Q 8 -6 16 0 Q 8 -1 0 0 M 0 0 Q -8 -6 -16 0 Q -8 -1 0 0" fill="#94a3b8" />
          </g>
          <g transform="translate(520, 105) scale(0.55)" opacity="0.5">
            <path d="M 0 0 Q 8 -6 16 0 Q 8 -1 0 0 M 0 0 Q -8 -6 -16 0 Q -8 -1 0 0" fill="#94a3b8" />
          </g>

          {/* =================================================================
              2. LAYER 1: FAR BACKGROUND ALPINE PEAKS & SNOWCAPS
              ================================================================= */}
          {/* Far Peak Left */}
          <polygon
            points="0,620 180,180 340,620"
            fill="url(#farMountainGrad)"
            opacity="0.85"
          />
          {/* Snowcap Peak Left */}
          <polygon
            points="180,180 205,250 185,240 170,260 155,245 180,180"
            fill="#e0f2fe"
            opacity="0.9"
          />

          {/* Far Peak Right */}
          <polygon
            points="460,650 620,190 800,650"
            fill="url(#farMountainGrad)"
            opacity="0.85"
          />
          {/* Snowcap Peak Right */}
          <polygon
            points="620,190 645,260 625,250 610,270 595,255 620,190"
            fill="#e0f2fe"
            opacity="0.9"
          />

          {/* Distant Ridge Silhouette */}
          <path
            d="M 0 520 L 120 380 L 260 480 L 400 320 L 540 460 L 680 370 L 800 500 L 800 1150 L 0 1150 Z"
            fill="#091829"
            opacity="0.9"
          />

          {/* =================================================================
              3. LAYER 2: MIDGROUND MOUNTAIN CRAGS & ROCK STRATA
              ================================================================= */}
          {/* Central Summit Mountain Body */}
          <polygon
            points="80,1150 400,90 720,1150"
            fill="url(#midMountainGrad)"
          />

          {/* Summit Glaciers & Crisp Ice Snowcaps */}
          <polygon
            points="400,90 440,170 415,160 395,185 375,165 360,180 400,90"
            fill="#ffffff"
            filter="url(#softGlow)"
          />
          <polygon
            points="400,90 425,170 400,160 385,175 400,90"
            fill="#bae6fd"
            opacity="0.8"
          />

          {/* Rocky Strata Shadows & Ridges */}
          <path
            d="M 400 90 L 390 320 L 420 540 L 380 780 L 400 1150"
            stroke="#0a1a29"
            strokeWidth="3"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M 400 90 L 430 260 L 360 450 L 450 680"
            stroke="#07131e"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />

          {/* High Altitude Drift Clouds */}
          <path
            d="M 280 260 Q 340 240 400 255 Q 460 240 520 265 Q 460 280 400 270 Q 340 285 280 260 Z"
            fill="#ffffff"
            opacity="0.12"
          />
          <path
            d="M 140 420 Q 210 400 280 415 Q 350 400 420 425 Q 350 440 280 430 Q 210 445 140 420 Z"
            fill="#ffffff"
            opacity="0.1"
          />
          <path
            d="M 480 460 Q 550 440 620 455 Q 690 440 760 465 Q 690 480 620 470 Q 550 485 480 460 Z"
            fill="#ffffff"
            opacity="0.08"
          />

          {/* =================================================================
              4. CASCADING WATERFALL & ALPINE MOUNTAIN STREAM
              ================================================================= */}
          {/* Stream descending from glacier down the rocky cleft */}
          <path
            d="M 390 310 Q 380 440 400 520 Q 425 610 370 710 Q 340 760 310 820 Q 280 900 260 1020 Q 250 1090 270 1150"
            fill="none"
            stroke="url(#waterfallGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.85"
          />
          {/* Waterfall Foam Spray Highlights */}
          <path
            d="M 390 310 Q 380 440 400 520 Q 425 610 370 710 Q 340 760 310 820 Q 280 900 260 1020 Q 250 1090 270 1150"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="8 6"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* =================================================================
              5. LAYER 3: FOREGROUND TIMBERLINE SLOPES & VALLEY MEADOWS
              ================================================================= */}
          {/* Forest Slopes Left (Green Gradient) */}
          <path
            d="M 0 740 Q 180 700 320 840 Q 200 980 0 1060 Z"
            fill="url(#forestSlopeGrad)"
            opacity="0.9"
          />

          {/* Forest Slopes Right (Green Gradient) */}
          <path
            d="M 800 680 Q 640 640 480 800 Q 620 950 800 1020 Z"
            fill="url(#forestSlopeGrad)"
            opacity="0.9"
          />

          {/* Bottom Foothills & Verdant Valley Meadow */}
          <path
            d="M 0 940 Q 240 880 420 930 Q 620 890 800 950 L 800 1150 L 0 1150 Z"
            fill="url(#valleyMeadowGrad)"
          />

          {/* =================================================================
              6. VEGETATION, TREES, GRASS & NATURAL STUFFS
              ================================================================= */}
          {/* Basecamp Forest Grove (Left Side) */}
          <use href="#pineTree" x="60" y="990" transform="scale(1.3)" />
          <use href="#pineTree" x="110" y="970" transform="scale(1.2)" />
          <use href="#pineTree" x="80" y="1030" transform="scale(1.4)" />
          <use href="#pineTree" x="140" y="1020" transform="scale(1.3)" />
          <use href="#pineTree" x="40" y="1060" transform="scale(1.5)" />
          <use href="#pineTree" x="100" y="1090" transform="scale(1.4)" />

          {/* Basecamp Forest Grove (Right Side) */}
          <use href="#pineTree" x="660" y="980" transform="scale(1.3)" />
          <use href="#pineTree" x="720" y="960" transform="scale(1.4)" />
          <use href="#pineTree" x="690" y="1030" transform="scale(1.5)" />
          <use href="#pineTree" x="750" y="1010" transform="scale(1.3)" />
          <use href="#pineTree" x="640" y="1070" transform="scale(1.4)" />
          <use href="#pineTree" x="710" y="1080" transform="scale(1.6)" />

          {/* Mid-Slope Pine Trees along Switchback Trails */}
          <use href="#pineTree" x="480" y="870" transform="scale(0.9)" />
          <use href="#pineTree" x="630" y="860" transform="scale(1.0)" />
          <use href="#pineTree" x="180" y="760" transform="scale(0.85)" />
          <use href="#pineTree" x="310" y="740" transform="scale(0.8)" />
          <use href="#pineTree" x="610" y="610" transform="scale(0.75)" />
          <use href="#pineTree" x="490" y="630" transform="scale(0.7)" />

          {/* High Altitude Miniature Pines (Clinging to Cliffs) */}
          <use href="#pineTreeSmall" x="220" y="500" />
          <use href="#pineTreeSmall" x="320" y="480" />
          <use href="#pineTreeSmall" x="580" y="370" />
          <use href="#pineTreeSmall" x="470" y="380" />

          {/* Grass Tufts in the Valley Floor */}
          {[
            { x: 190, y: 1060 },
            { x: 280, y: 1040 },
            { x: 340, y: 1080 },
            { x: 440, y: 1060 },
            { x: 520, y: 1050 },
            { x: 600, y: 1070 },
            { x: 160, y: 1110 },
            { x: 380, y: 1120 },
            { x: 500, y: 1130 },
          ].map((pt, gIdx) => (
            <use key={gIdx} href="#grassTuft" x={pt.x} y={pt.y} />
          ))}

          {/* Alpine Wildflower Clusters */}
          <use href="#wildflowerYellow" x="210" y="1045" />
          <use href="#wildflowerBlue" x="320" y="1065" />
          <use href="#wildflowerYellow" x="470" y="1045" />
          <use href="#wildflowerBlue" x="580" y="1060" />
          <use href="#wildflowerYellow" x="240" y="1100" />
          <use href="#wildflowerBlue" x="420" y="1110" />

          {/* Stone Trail Cairns at Bends */}
          <use href="#stoneCairn" x="590" y="895" />
          <use href="#stoneCairn" x="235" y="765" />
          <use href="#stoneCairn" x="575" y="635" />
          <use href="#stoneCairn" x="250" y="505" />
          <use href="#stoneCairn" x="545" y="375" />
          <use href="#stoneCairn" x="315" y="255" />

          {/* Basecamp Expedition Tent & Campfire at Foothills */}
          <g transform="translate(160, 995)">
            {/* Tent */}
            <polygon points="0,15 25,-15 50,15" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
            <polygon points="25,-15 50,15 35,15 15,15" fill="#0369a1" opacity="0.4" />
            <polygon points="12,15 25,-4 38,15" fill="#0f172a" />
            {/* Campfire */}
            <g transform="translate(68, 12)">
              {/* Logs */}
              <line x1="-8" y1="4" x2="8" y2="-2" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="-8" y1="-2" x2="8" y2="4" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
              {/* Fire Flame & Embers */}
              <circle cx="0" cy="0" r="8" fill="url(#sunAlpenglow)" opacity="0.8" />
              <polygon points="0,-12 4,-2 0,0 -4,-2" fill="#f97316" filter="url(#softGlow)" />
              <polygon points="0,-8 2,-2 0,0 -2,-2" fill="#facc15" />
            </g>
          </g>

          {/* Wooden Suspension Bridge at Checkpoint 3 (Stream Crossing) */}
          <g transform="translate(250, 755)">
            <rect x="-18" y="-4" width="36" height="8" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1" />
            <line x1="-16" y1="-7" x2="16" y2="-7" stroke="#92400e" strokeWidth="1.5" />
            <line x1="-14" y1="-7" x2="-14" y2="-4" stroke="#78350f" strokeWidth="1" />
            <line x1="0" y1="-7" x2="0" y2="-4" stroke="#78350f" strokeWidth="1" />
            <line x1="14" y1="-7" x2="14" y2="-4" stroke="#78350f" strokeWidth="1" />
          </g>

          {/* Wooden Trailhead Signpost at Basecamp */}
          <g transform="translate(290, 1010)">
            <rect x="-2" y="0" width="4" height="22" fill="#78350f" />
            <rect x="-28" y="-14" width="56" height="15" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1" />
            <text x="0" y="-4" textAnchor="middle" fill="#fef3c7" fontSize="6" fontFamily="monospace" fontWeight="bold">
              TRAILHEAD 600m
            </text>
          </g>

          {/* =================================================================
              7. THE ROAD / HIKING TRAIL (ROAD CUM MOUNTAIN)
              ================================================================= */}
          {/* Earthen Path Base Bed */}
          {trailGeometry.segments.map((seg, idx) => (
            <path
              key={`base-${idx}`}
              d={seg.d}
              fill="none"
              stroke="#451a03"
              strokeWidth="11"
              strokeLinecap="round"
              opacity="0.8"
            />
          ))}

          {/* Inner Gravel Trail Switchback Body */}
          {trailGeometry.segments.map((seg, idx) => (
            <path
              key={`inner-${idx}`}
              d={seg.d}
              fill="none"
              stroke="#92400e"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.9"
            />
          ))}

          {/* Active / Illuminated Trail Segment with Golden-Emerald Shimmer */}
          {trailGeometry.segments.map((seg, idx) => {
            const isCompleted = seg.status === 'completed';
            const isLocked = seg.status === 'locked';

            return (
              <path
                key={`active-${idx}`}
                d={seg.d}
                fill="none"
                stroke={isCompleted ? 'url(#completedTrailGrad)' : isLocked ? '#475569' : '#38bdf8'}
                strokeWidth={isCompleted ? 4 : isLocked ? 2 : 3}
                strokeDasharray={isLocked ? '6 6' : undefined}
                strokeLinecap="round"
                className="transition-colors duration-300"
                filter={isCompleted ? 'url(#softGlow)' : undefined}
              />
            );
          })}

          {/* =================================================================
              8. THE TRAVELER (THE HIKER ASCENDING THE MOUNTAIN)
              Positioned directly at travelerPoint along the switchback path!
              ================================================================= */}
          <g
            transform={`translate(${trailGeometry.travelerPoint.x}, ${trailGeometry.travelerPoint.y})`}
            className="cursor-pointer group"
            onClick={() => {
              if (activeCheckpoint) setActiveCheckpoint(activeCheckpoint);
            }}
          >
            {/* Radiant Ambient Aura Around Traveler */}
            <circle r="22" fill="#38bdf8" opacity="0.25" filter="url(#softGlow)" />
            <circle r="14" fill="#0284c7" opacity="0.35" />

            {/* Glowing Golden Footsteps Behind Traveler */}
            <circle cx="-10" cy="8" r="2.5" fill="#facc15" opacity="0.75" />
            <circle cx="-18" cy="14" r="2" fill="#facc15" opacity="0.5" />
            <circle cx="-26" cy="18" r="1.5" fill="#facc15" opacity="0.3" />

            {/* The Traveler Hiker Illustration */}
            <g transform="translate(0, -18)">
              {/* Walking Stick / Trekking Staff */}
              <line x1="8" y1="2" x2="14" y2="24" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
              <circle cx="8" cy="2" r="1.5" fill="#fef3c7" />

              {/* Traveler Backpack (Expedition Pack) */}
              <rect x="-11" y="4" width="7" height="11" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1" />
              <rect x="-12" y="1" width="9" height="3" rx="1.5" fill="#ea580c" />

              {/* Traveler Body & Alpine Jacket */}
              <rect x="-5" y="4" width="10" height="11" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
              {/* Climbing Boots / Legs */}
              <rect x="-4" y="15" width="3" height="7" rx="1" fill="#1e293b" />
              <rect x="1" y="15" width="3" height="7" rx="1" fill="#1e293b" />
              <ellipse cx="-2.5" cy="22" rx="2.5" ry="1.5" fill="#451a03" />
              <ellipse cx="2.5" cy="22" rx="2.5" ry="1.5" fill="#451a03" />

              {/* Traveler Head & Explorer Cap */}
              <circle cx="0" cy="0" r="5" fill="#fed7aa" />
              <path d="M -6 -1 Q 0 -6 6 -1 L 8 -1 Q 4 1 0 1 Z" fill="#f59e0b" />
              <circle cx="0" cy="-3" r="4.5" fill="#0369a1" />

              {/* Torch / Lantern of Knowledge Held in Hand */}
              <g transform="translate(8, 8)">
                <circle cx="0" cy="0" r="6" fill="#facc15" opacity="0.5" filter="url(#lanternGlow)" />
                <rect x="-2" y="-3" width="4" height="6" rx="1" fill="#f59e0b" />
                <polygon points="0,-4 2,-1 0,0 -2,-1" fill="#ffffff" />
              </g>
            </g>

            {/* Floating Hiker HUD Status Tooltip */}
            <g transform="translate(0, -56)" className="pointer-events-none select-none">
              <rect
                x="-80"
                y="-14"
                width="160"
                height="28"
                rx="14"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="1.5"
                filter="url(#softGlow)"
              />
              <circle cx="-64" cy="0" r="3.5" fill="#38bdf8" className="animate-pulse" />
              <text x="-54" y="3.5" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                YOU ARE HERE
              </text>
              <text x="14" y="3.5" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                {trailGeometry.currentElevation}m
              </text>
            </g>
          </g>

          {/* =================================================================
              9. CHECKPOINTS 1 TO 7 (REWARDING NODES ALONG THE ASCENT)
              ================================================================= */}
          {trailGeometry.waypoints.map((wp, idx) => {
            const isSelected = selectedModuleId === wp.module.id || activeCheckpoint?.id === wp.id;

            return (
              <g
                key={wp.id}
                transform={`translate(${wp.point.x}, ${wp.point.y})`}
                tabIndex={0}
                role="button"
                aria-label={`Checkpoint ${idx + 1}: ${wp.checkpoint.name}, Elevation ${wp.checkpoint.elevation}m, Reward: ${wp.checkpoint.rewardXp} XP`}
                onClick={() => handleNodeClick(wp)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNodeClick(wp);
                  }
                }}
                className="cursor-pointer focus:outline-hidden group"
              >
                {/* Active Checkpoint Halo Ring */}
                {wp.isCurrent && (
                  <circle
                    r="24"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="animate-spin-slow opacity-80"
                  />
                )}

                {/* Outer Elevation Ring */}
                <circle
                  r={isSelected ? 18 : 15}
                  fill={wp.isCompleted ? '#065f46' : wp.isLocked ? '#0f172a' : '#0369a1'}
                  stroke={
                    isSelected
                      ? '#ffffff'
                      : wp.isCompleted
                      ? '#34d399'
                      : wp.isLocked
                      ? '#334155'
                      : '#38bdf8'
                  }
                  strokeWidth={isSelected ? 3 : 2}
                  filter={wp.isCompleted ? 'url(#softGlow)' : undefined}
                  className="transition-all duration-200 group-hover:scale-110"
                />

                {/* Inner Icon */}
                {wp.isCompleted ? (
                  <Check x={-6} y={-6} className="w-3 h-3 text-white pointer-events-none" />
                ) : wp.isLocked ? (
                  <Lock x={-5} y={-5} className="w-2.5 h-2.5 text-slate-400 pointer-events-none" />
                ) : (
                  <text
                    x={0}
                    y={3.5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="select-none pointer-events-none"
                  >
                    {idx + 1}
                  </text>
                )}

                {/* Checkpoint Name & Altitude Label */}
                <g transform={`translate(${idx % 2 === 0 ? -24 : 24}, 0)`}>
                  {/* Background pill for text legibility */}
                  <rect
                    x={idx % 2 === 0 ? -145 : 0}
                    y="-12"
                    width="145"
                    height="28"
                    rx="6"
                    fill="#0f172a"
                    stroke={isSelected ? '#38bdf8' : '#334155'}
                    strokeWidth="1"
                    opacity="0.92"
                  />
                  <text
                    x={idx % 2 === 0 ? -138 : 7}
                    y="0"
                    textAnchor="start"
                    fill={wp.isLocked ? '#94a3b8' : '#ffffff'}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                    className="select-none"
                  >
                    {wp.checkpoint.name.length > 20
                      ? `${wp.checkpoint.name.slice(0, 18)}...`
                      : wp.checkpoint.name}
                  </text>
                  <text
                    x={idx % 2 === 0 ? -138 : 7}
                    y="10"
                    textAnchor="start"
                    fill="#38bdf8"
                    fontSize="8"
                    fontFamily="monospace"
                    className="select-none"
                  >
                    Elev. {wp.checkpoint.elevation}m • +{wp.checkpoint.rewardXp} XP
                  </text>
                </g>
              </g>
            );
          })}

          {/* =================================================================
              10. THE MOUNTAIN SUMMIT (PINNACLE OF KNOWLEDGE & OFFICIAL DIPLOMA)
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
            {/* Radiant Victory Sunburst from Summit Peak */}
            <circle
              r={36}
              fill={isAllComplete ? '#f59e0b' : '#0284c7'}
              opacity="0.25"
              filter="url(#softGlow)"
            />

            {/* Learnflow Golden Summit Flag Flapping in the Alpine Wind */}
            <g transform="translate(14, -36)">
              <line x1="0" y1="0" x2="0" y2="40" stroke="#f59e0b" strokeWidth="2.5" />
              <polygon points="0,0 24,7 0,14" fill="#f59e0b" filter="url(#softGlow)" />
              <circle cx="10" cy="7" r="2" fill="#ffffff" />
            </g>

            {/* Summit Medal Disc */}
            <circle
              r={25}
              fill={isAllComplete ? '#0284c7' : '#0f172a'}
              stroke={isAllComplete ? '#facc15' : '#334155'}
              strokeWidth={3}
              filter={isAllComplete ? 'url(#softGlow)' : undefined}
              className="transition-transform group-hover:scale-110"
            />

            {/* Summit Trophy / Award Icon */}
            <Award
              x={-11}
              y={-11}
              className={`w-6 h-6 pointer-events-none ${
                isAllComplete ? 'text-amber-300' : 'text-slate-400'
              }`}
            />

            {/* Summit Peak Label */}
            <g transform="translate(0, -44)" className="pointer-events-none select-none">
              <rect
                x="-75"
                y="-12"
                width="150"
                height="22"
                rx="11"
                fill="#0f172a"
                stroke={isAllComplete ? '#facc15' : '#38bdf8'}
                strokeWidth="1.5"
                opacity="0.95"
              />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fill={isAllComplete ? '#facc15' : '#94a3b8'}
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                SUMMIT: 5,200m
              </text>
            </g>

            {/* Triumphant Conqueror Banner if 100% Completed */}
            {isAllComplete && (
              <g transform="translate(0, 42)" className="pointer-events-none select-none">
                <rect
                  x="-90"
                  y="-12"
                  width="180"
                  height="24"
                  rx="6"
                  fill="#065f46"
                  stroke="#34d399"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  ★ KNOWLEDGE MASTERED ★
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* =========================================================================
          BOTTOM INSTRUCTIONS & EXPEDITION LEGEND FOOTER
          ========================================================================= */}
      <div className="bg-slate-900/90 border-t border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-2xs shadow-emerald-400/50" />
            <span>Mastered Checkpoint</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-sky-300 animate-pulse" />
            <span>Current Hiker Altitude</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            <span>Upcoming Peak Checkpoint</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Summit Institutional Diploma</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-500">
          Click any checkpoint to inspect altitude rewards and launch lessons.
        </div>
      </div>
    </div>
  );
};
