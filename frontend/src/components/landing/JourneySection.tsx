import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Award, Check, Lock } from 'lucide-react';

export const JourneySection: React.FC = () => {
  const [activeTrailNode, setActiveTrailNode] = useState<number>(2);

  return (
    <section id="journey" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-mono font-medium mb-3">
          <Compass className="w-3.5 h-3.5 text-sky-500" />
          <span>Sequential Mountain Trail</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Ascend Through Sequential Modules
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          A learner moves through the course module by module. Module N unlocks strictly when Module N-1 is complete, culminating in the verified diploma summit.
        </p>
      </div>

      {/* Mock Interactive Mountain Trail Preview Card */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-sky-950/20 via-slate-950 to-slate-950 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Left: Trail Explanation & Invariants */}
          <div className="space-y-6 lg:col-span-1">
            <div>
              <span className="text-meta font-mono uppercase tracking-wider text-sky-400 font-semibold">
                Course Progression Invariant
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Full-Stack System Design Mountain Path
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Click any checkpoint on the mountain trail to inspect module mastery criteria, prerequisites, and server-side unlocking rules.
              </p>
            </div>

            {/* Active Checkpoint Detail Box */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-meta font-mono uppercase text-sky-400 font-semibold">
                  Checkpoint {activeTrailNode + 1} of 6
                </span>
                <span className={`text-meta font-mono px-2 py-0.5 rounded font-semibold ${
                  activeTrailNode < 2
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : activeTrailNode === 2
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {activeTrailNode < 2 ? 'PASSED & MASTERED' : activeTrailNode === 2 ? 'ACTIVE CHECKPOINT' : 'LOCKED BY SERVER'}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white">
                {activeTrailNode === 0 && 'Module 1: High-Performance Data Access & Indexing'}
                {activeTrailNode === 1 && 'Module 2: Scalable Caching & Invalidation'}
                {activeTrailNode === 2 && 'Module 3: Event-Driven Architecture & Outbox Pattern'}
                {activeTrailNode === 3 && 'Module 4: ACID Boundaries & Distributed Consensus'}
                {activeTrailNode === 4 && 'Module 5: Distributed Observability & Chaos Engineering'}
                {activeTrailNode === 5 && 'Module 6: Capstone Architecture Defense & Final Review'}
              </h4>

              <p className="text-xs text-slate-400 leading-relaxed">
                {activeTrailNode === 0 && 'Mastered B-Tree index optimization and advisory locks. Score: 95% on midterm assessment.'}
                {activeTrailNode === 1 && 'Completed cache-aside patterns and stampede mitigation with Redis distributed locks.'}
                {activeTrailNode === 2 && 'Current active focus: Debezium CDC pipeline and transactional outbox event streams.'}
                {activeTrailNode === 3 && 'Locked: Unlocks immediately when Module 3 assessment and lesson tasks are submitted.'}
                {activeTrailNode === 4 && 'Locked: Requires successful completion of Module 4 consensus exercises.'}
                {activeTrailNode === 5 && 'Summit Defense: Final evaluation presented to the faculty academic review board.'}
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Enter Mountain Trail in Student Portal</span>
              </Link>
            </div>
          </div>

          {/* Right: SVG Mountain Trail Mockup */}
          <div className="lg:col-span-2 relative">
            <svg viewBox="0 0 600 420" className="w-full max-w-[600px] mx-auto select-none">
              <defs>
                <linearGradient id="landingTrailGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>

              {/* Mountain Terrain Contours */}
              <path d="M 50 400 L 300 60 L 550 400 Z" fill="none" stroke="#1e293b" strokeWidth="2" opacity="0.6" />
              <path d="M 120 400 L 300 90 L 480 400" fill="none" stroke="#1e293b" strokeWidth="1" opacity="0.5" />
              <path d="M 300 60 L 300 400" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />

              {/* Trail Segments */}
              <path d="M 160 360 C 220 340, 380 340, 440 300" fill="none" stroke="url(#landingTrailGrad)" strokeWidth="4" />
              <path d="M 440 300 C 380 260, 220 260, 180 230" fill="none" stroke="url(#landingTrailGrad)" strokeWidth="4" />
              <path d="M 180 230 C 220 190, 380 190, 420 160" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 6" />
              <path d="M 420 160 C 380 130, 240 130, 200 110" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="6 6" />
              <path d="M 200 110 C 240 85, 270 85, 300 65" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="6 6" />

              {/* Summit Waypoint */}
              <g transform="translate(300, 65)">
                <circle r="18" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <Award x={-7} y={-7} className="w-3.5 h-3.5 text-amber-300" />
                <text x={0} y={-24} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  DIPLOMA SUMMIT
                </text>
              </g>

              {/* Checkpoint Nodes */}
              {[
                { x: 160, y: 360, label: 'Mod 1', status: 'completed' },
                { x: 440, y: 300, label: 'Mod 2', status: 'completed' },
                { x: 180, y: 230, label: 'Mod 3', status: 'current' },
                { x: 420, y: 160, label: 'Mod 4', status: 'locked' },
                { x: 200, y: 110, label: 'Mod 5', status: 'locked' },
              ].map((node, idx) => {
                const isSelected = activeTrailNode === idx;
                return (
                  <g
                    key={idx}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer"
                    onClick={() => setActiveTrailNode(idx)}
                  >
                    {/* Active Ring */}
                    {node.status === 'current' && (
                      <circle r="18" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
                    )}

                    <circle
                      r={isSelected ? 13 : 11}
                      fill={node.status === 'completed' ? '#0284c7' : node.status === 'current' ? '#0369a1' : '#0f172a'}
                      stroke={isSelected ? '#ffffff' : node.status === 'completed' || node.status === 'current' ? '#38bdf8' : '#334155'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />

                    {node.status === 'completed' ? (
                      <Check x={-5} y={-5} className="w-2.5 h-2.5 text-white" />
                    ) : node.status === 'locked' ? (
                      <Lock x={-4} y={-4} className="w-2 h-2 text-slate-500" />
                    ) : (
                      <text x={0} y={3} textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        {idx + 1}
                      </text>
                    )}

                    <text
                      x={idx % 2 === 0 ? -16 : 16}
                      y={4}
                      textAnchor={idx % 2 === 0 ? 'end' : 'start'}
                      fill={isSelected ? '#ffffff' : '#94a3b8'}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};
