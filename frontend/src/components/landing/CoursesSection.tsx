import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { BookOpen, ArrowRight, PlayCircle, Award, Check, Layers } from 'lucide-react';
import { ProgressRing } from '../common/ProgressRing';

export interface FeaturedCourse {
  id: string;
  title: string;
  difficulty: string;
  modules: number;
  lessons: number;
  instructor: string;
  description: string;
  concepts: string[];
}

interface CoursesSectionProps {
  courses: FeaturedCourse[];
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({ courses }) => {
  const { isAuthenticated } = useAuthStore();
  const [viewMode, setViewMode] = useState<'enrolled' | 'catalog'>('enrolled');
  const [interactiveProgress, setInteractiveProgress] = useState<{ [id: string]: number }>({
    'cs101': 100,
    'cs201': 50,
    'cs301': 0,
  });

  const handleAdvance = (courseKey: string) => {
    setInteractiveProgress((prev) => {
      const current = prev[courseKey] || 0;
      const next = current >= 90 ? 30 : current + 20;
      return { ...prev, [courseKey]: next };
    });
  };

  return (
    <section id="courses" className="py-20 bg-slate-50 dark:bg-[#06080c] border-y border-slate-200 dark:border-white/10 text-slate-900 dark:text-[#f2f5f9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-medium">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Curated Computing Curriculum</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded">
                Sample data
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-[#f2f5f9]">
              Structured Engineering Pathways &bull; Real Progress Telemetry
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-[#8a94a6] max-w-xl">
              Every curriculum provides comprehensive theoretical rigor, verified code labs, and sequential assessment checkpoints with real-time completion telemetry.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center space-x-2 bg-slate-200/70 dark:bg-[#020308] p-1.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-semibold self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('enrolled')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'enrolled'
                  ? 'bg-[#0082fb] text-white shadow-xs glow-blue'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#8a94a6] dark:hover:text-[#f2f5f9]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Student Enrolled View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('catalog')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'catalog'
                  ? 'bg-[#0082fb] text-white shadow-xs glow-blue'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#8a94a6] dark:hover:text-[#f2f5f9]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Full Catalog</span>
            </button>
          </div>
        </div>

        {/* ENROLLED STUDENT VIEW (FROM USER SCREENSHOT media_1794124034292_7cc72923.png) */}
        {viewMode === 'enrolled' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: CS101 Completed */}
            <div className="bg-white dark:bg-[#0b0f16] rounded-xl border border-emerald-500/40 p-6 flex flex-col justify-between hover:border-emerald-500/70 transition-colors shadow-xs">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-meta font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 inline-block mb-2">
                      Beginner &bull; Completed
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                      CS101: Introduction to Computer Science
                    </h3>
                  </div>
                  <div className="shrink-0">
                    <ProgressRing value={interactiveProgress['cs101']} size={56} strokeWidth={5} label="Completed" />
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-[#8a94a6] leading-relaxed mb-4">
                  Foundations of computation, pointers, bitwise arithmetic, and formal asymptotic analysis.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {['Pointers', 'Big-O Proofs', 'Bitwise Logic'].map((c) => (
                    <span key={c} className="text-meta font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-[#8a94a6]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  <span>Review Syllabus</span>
                </span>
                <Link
                  to={isAuthenticated ? '/my-certificates' : '/login'}
                  className="h-8 px-3.5 rounded-md text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>View Certificate</span>
                </Link>
              </div>
            </div>

            {/* Card 2: CS201 In Progress (Interactive increment) */}
            <div className="bg-white dark:bg-[#0b0f16] rounded-xl border border-[#0082fb]/40 p-6 flex flex-col justify-between hover:border-[#0082fb]/70 transition-colors shadow-xs relative overflow-hidden">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-meta font-mono font-semibold uppercase tracking-wider text-[#0082fb] dark:text-[#3aa0ff] bg-[#0082fb]/10 px-2 py-0.5 rounded border border-[#0082fb]/30 inline-block mb-2">
                      Intermediate &bull; In Progress
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                      CS201: Data Structures and Algorithms
                    </h3>
                  </div>
                  <div className="shrink-0">
                    <ProgressRing value={interactiveProgress['cs201']} size={56} strokeWidth={5} label={`${interactiveProgress['cs201']}% complete`} />
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-[#8a94a6] leading-relaxed mb-4">
                  Self-balancing red-black trees, Dijkstra graph paths, topological sort, and amortized hash collisions.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {['Red-Black Trees', 'Dijkstra', 'Hash Collisions'].map((c) => (
                    <span key={c} className="text-meta font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-[#8a94a6]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0082fb] dark:text-[#3aa0ff] flex items-center gap-1">
                  <span>Open Syllabus</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <button
                  type="button"
                  onClick={() => handleAdvance('cs201')}
                  className="h-8 px-3.5 rounded-md text-xs font-semibold bg-[#0082fb] hover:bg-[#155dfc] text-white shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer glow-blue"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Continue ({interactiveProgress['cs201']}%)</span>
                </button>
              </div>
            </div>

            {/* Card 3: CS301 Not Started (Interactive start) */}
            <div className="bg-white dark:bg-[#0b0f16] rounded-xl border border-slate-200 dark:border-white/10 p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/20 transition-colors shadow-xs">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-meta font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-[#8a94a6] bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10 inline-block mb-2">
                      Advanced &bull; {interactiveProgress['cs301'] > 0 ? 'In Progress' : 'Not Started'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                      CS301: Database Internals &amp; Isolation
                    </h3>
                  </div>
                  <div className="shrink-0">
                    <ProgressRing value={interactiveProgress['cs301']} size={56} strokeWidth={5} label={`${interactiveProgress['cs301']}% complete`} />
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-[#8a94a6] leading-relaxed mb-4">
                  Write-ahead log recovery, multi-version concurrency control (MVCC), and distributed consensus protocols.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {['WAL Recovery', 'MVCC Snapshots', 'Raft Consensus'].map((c) => (
                    <span key={c} className="text-meta font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-[#8a94a6]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-[#8a94a6] flex items-center gap-1">
                  <span>Open Syllabus</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <button
                  type="button"
                  onClick={() => handleAdvance('cs301')}
                  className="h-8 px-3.5 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-[#f2f5f9] shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>{interactiveProgress['cs301'] === 0 ? 'Start Course' : `Continue (${interactiveProgress['cs301']}%)`}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* CATALOG VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white dark:bg-[#0b0f16] rounded-xl border border-slate-200 dark:border-white/10 p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/20 transition-colors shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-meta font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-[#8a94a6] font-semibold uppercase tracking-wider">
                      {course.difficulty}
                    </span>
                    <span className="text-label font-mono text-slate-500 dark:text-[#8a94a6]">
                      {course.modules} Modules &bull; {course.lessons} Lessons
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight line-clamp-2 mb-2">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-[#8a94a6] leading-relaxed line-clamp-3 mb-4 font-normal">
                    {course.description}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {course.concepts.map((concept) => (
                      <span
                        key={concept}
                        className="text-meta font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-[#8a94a6]"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs text-slate-600 dark:text-[#8a94a6]">
                    <span className="truncate">{course.instructor}</span>
                    <Link
                      to="/courses"
                      className="font-semibold text-[#0082fb] dark:text-[#3aa0ff] hover:underline flex items-center space-x-1"
                    >
                      <span>Enroll</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
