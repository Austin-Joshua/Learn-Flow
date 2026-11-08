import React from 'react';
import { Award, Check, Lock, PlayCircle } from 'lucide-react';
import { TrailGeometry, CourseStats } from '../../hooks/useJourneyData';
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

  return (
    <div className="relative bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden p-4 sm:p-8">
      {/* Quiet Atmospheric Background Gradient */}
      <div className="absolute inset-0 bg-radial from-sky-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Waypoint Detail Drawer / Card (Shown when a module is selected) */}
      {activeModule && (
        <div className="absolute top-4 sm:top-6 left-4 sm:left-auto right-4 sm:right-6 z-20 w-auto sm:w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xl text-white transition-all">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <span className="text-meta font-mono uppercase tracking-wider text-sky-400">
                Module {activeModule.order_index + 1}
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {activeModule.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onSelectModule(null)}
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
                <div className="text-label font-semibold text-slate-200">
                  {activeModule.assessment.title}
                </div>
                <div className="text-meta font-mono text-slate-400 mt-0.5">
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
                  onNavigate(`/lessons/${nextLes.id}`);
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

          {/* 3. Summit Certificate Waypoint */}
          <g
            transform={`translate(${trailGeometry.summitPoint.x}, ${trailGeometry.summitPoint.y})`}
            className="cursor-pointer group"
            tabIndex={0}
            role="button"
            aria-label="Summit Diploma: View Credentials"
            onClick={() => onNavigate('/my-certificates')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigate('/my-certificates');
              }
            }}
          >
            <circle
              r={24}
              fill={isAllComplete ? '#0284c7' : '#0f172a'}
              stroke={isAllComplete ? '#38bdf8' : '#334155'}
              strokeWidth={2}
              filter={isAllComplete ? 'url(#softGlow)' : undefined}
              className="transition-transform group-hover:scale-105"
            />
            <Award
              x={-10}
              y={-10}
              className={`w-5 h-5 pointer-events-none ${
                isAllComplete ? 'text-amber-300' : 'text-slate-500'
              }`}
            />
            <text
              x={0}
              y={-34}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
              className="select-none pointer-events-none"
            >
              SUMMIT DIPLOMA
            </text>
          </g>

          {/* 4. Module Waypoints (Interactive Nodes) */}
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
                onClick={() => onSelectModule(wp.module.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectModule(wp.module.id);
                  }
                }}
                className="cursor-pointer focus:outline-hidden group"
              >
                {/* Distinct Halo Ring for Current Active Module */}
                {wp.isCurrent && (
                  <circle
                    r={20}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    opacity={0.8}
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
  );
};
