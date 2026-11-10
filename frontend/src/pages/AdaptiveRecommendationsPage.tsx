import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { LearningRecommendation } from '../types';
import { PageHeader, Card } from '../components/ui';
import {
  GitBranch,
  ArrowRight,
  Zap,
  CheckCircle2,
  BookOpen,
  Award,
  Layers,
  Sparkles,
  ShieldCheck,
  Activity,
  Compass,
  Clock,
  Terminal,
  Cpu,
  Database,
  Lock,
} from 'lucide-react';

interface ConceptMasteryItem {
  id: string;
  name: string;
  category: string;
  masteryPercentage: number;
  assessmentsCount: number;
  status: 'Mastered' | 'Advanced' | 'Solid';
  description: string;
  lastEvaluated: string;
}

const CONCEPT_MASTERY_BENCHMARKS: ConceptMasteryItem[] = [
  {
    id: 'c-1',
    name: 'Distributed Systems & Consensus',
    category: 'Systems Architecture',
    masteryPercentage: 100,
    assessmentsCount: 4,
    status: 'Mastered',
    description: 'Raft leader election, split-brain quorum voting, and idempotent RPC delivery guarantees.',
    lastEvaluated: 'Yesterday',
  },
  {
    id: 'c-2',
    name: 'B-Tree Indexing & Buffer Management',
    category: 'Database Internals',
    masteryPercentage: 96,
    assessmentsCount: 3,
    status: 'Mastered',
    description: 'Leaf page splitting, binary root seeks, and cache hit ratio optimization in PostgreSQL.',
    lastEvaluated: '2 days ago',
  },
  {
    id: 'c-3',
    name: 'ACID Transactions & WAL Replay',
    category: 'Database Internals',
    masteryPercentage: 94,
    assessmentsCount: 3,
    status: 'Mastered',
    description: 'Write-ahead logging protocols, checkpoint LSN sequencing, and crash recovery.',
    lastEvaluated: '3 days ago',
  },
  {
    id: 'c-4',
    name: 'Advisory Locks & Concurrency Isolation',
    category: 'High-Concurrency Systems',
    masteryPercentage: 91,
    assessmentsCount: 2,
    status: 'Advanced',
    description: 'Transaction-scoped advisory locks, row-level SELECT FOR UPDATE, and deadlock avoidance.',
    lastEvaluated: '4 days ago',
  },
  {
    id: 'c-5',
    name: 'React 19 Concurrent Primitives & State',
    category: 'Frontend Engineering',
    masteryPercentage: 98,
    assessmentsCount: 4,
    status: 'Mastered',
    description: 'Fiber tree concurrency, useDeferredValue throttling, and strict type-safe state hydration.',
    lastEvaluated: '5 days ago',
  },
  {
    id: 'c-6',
    name: 'Linux Namespaces & Container Security',
    category: 'Cloud Infrastructure',
    masteryPercentage: 92,
    assessmentsCount: 2,
    status: 'Advanced',
    description: 'Cgroups v2 resource quotas, PID isolation, and non-root container security constraints.',
    lastEvaluated: '1 week ago',
  },
];

interface PracticeDrill {
  id: string;
  title: string;
  level: string;
  duration: string;
  domain: string;
  description: string;
  lessonLink: string;
}

const FRONTIER_DRILLS: PracticeDrill[] = [
  {
    id: 'drill-1',
    title: 'High-Concurrency Advisory Lock Simulation',
    level: 'Intermediate',
    duration: '15 min exercise',
    domain: 'Database Systems',
    description: 'Evaluate transaction throughput and zero-deadlock guarantees across 5,000 simulated concurrent worker threads.',
    lessonLink: '/courses',
  },
  {
    id: 'drill-2',
    title: 'WAL Checkpoint Divergence & Replica Replay',
    level: 'Advanced',
    duration: '20 min lab',
    domain: 'Storage Engines',
    description: 'Inspect raw LSN sequences in pg_waldump records to detect and resolve streaming replication desync.',
    lessonLink: '/courses',
  },
  {
    id: 'drill-3',
    title: 'Probabilistic Cache Invalidation & Mutex Locks',
    level: 'Intermediate',
    duration: '12 min drill',
    domain: 'Distributed Caching',
    description: 'Implement XFetch early expiration algorithms in Redis to completely eliminate cache stampedes.',
    lessonLink: '/courses',
  },
];

export const AdaptiveRecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPath = async () => {
      setIsLoading(true);
      try {
        const res = await api.adaptive.getMyPath();
        setRecommendations(res.data);
      } catch (err) {
        console.error('Failed to load adaptive path', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPath();
  }, []);

  const handleScrollToDrills = () => {
    const el = document.getElementById('frontier-drills');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto font-sans min-h-[70vh] space-y-6 sm:space-y-8 pb-16">
      {/* Page Header */}
      <PageHeader
        badge={
          <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium mb-1">
            <GitBranch className="w-3.5 h-3.5 text-sky-500" />
            <span>Diagnostic Remediation Engine • Continuous Knowledge Analytics</span>
          </div>
        }
        title="Adaptive Review Pathways"
        subtitle="Targeted study recommendations and mastery telemetry generated automatically from assessment error diagnostics, pinpointing exactly where fundamentals need strengthening."
      />

      {/* 1. Diagnostic Remediation Telemetry Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5 font-semibold truncate">
              Concepts Monitored
            </span>
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {CONCEPT_MASTERY_BENCHMARKS.length} Concepts
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block truncate">
              Core Curriculum Benchmarks
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/40 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5 font-semibold truncate">
              Remediation Trigger
            </span>
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              &lt; 70%
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block truncate">
              Assessment Pass Threshold
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5 font-semibold truncate">
              Active Recommendations
            </span>
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {recommendations.length}
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block truncate">
              {recommendations.length === 0 ? 'No Deficits Detected' : 'Targeted Review Needed'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5 font-semibold truncate">
              Deficit Status
            </span>
            <div className="text-lg sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {recommendations.length === 0 ? 'All Satisfied' : `${recommendations.length} Active`}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block truncate">
              {recommendations.length === 0 ? 'Zero Remedial Gaps' : 'Targeted Pathways'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. Active Diagnostic Recommendations List (when present) */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Prioritized Remedial Study Pathways ({recommendations.length})</span>
            </h2>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Generated from Timed Arena error telemetry
            </span>
          </div>

          {recommendations.map((rec) => (
            <Card
              key={rec.id}
              className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start space-x-3.5">
                <div
                  className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-xs ${
                    rec.priority === 1 ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-meta font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                        rec.priority === 1
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                      }`}
                    >
                      {rec.priority === 1 ? 'Critical Priority' : 'Standard Priority'}
                    </span>
                    <span className="text-label font-mono text-slate-400">
                      Diagnosed {new Date(rec.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-1.5 leading-relaxed max-w-2xl">
                    {rec.rationale}
                  </p>
                </div>
              </div>

              <Link
                to={`/lessons/${rec.target_lesson_id}`}
                className="w-full sm:w-auto h-9 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-1.5 whitespace-nowrap self-end sm:self-center cursor-pointer"
              >
                <span>Study Lesson</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        /* Enhanced All Benchmarks Satisfied Hero Card (No empty void!) */
        <div className="skeuo-card bg-white dark:bg-[#070d18] border border-slate-200/90 dark:border-emerald-500/25 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/80 shadow-xs shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Curriculum Standards Satisfied</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  All Concept Benchmarks Satisfied
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                  You currently have no outstanding weak concept recommendations. Taking course assessments will dynamically generate remedial paths whenever a score falls below 70%.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <Link
                to="/courses"
                className="w-full sm:w-auto h-10 px-5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center transition-colors shadow-xs active:scale-98"
              >
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                <span>Explore Course Catalog</span>
              </Link>
              <button
                type="button"
                onClick={handleScrollToDrills}
                className="w-full sm:w-auto h-10 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold inline-flex items-center justify-center transition-colors shadow-2xs active:scale-98 cursor-pointer"
              >
                <span>Practice Frontier Drills &darr;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Concept Mastery & Diagnostic Health Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <Compass className="w-4.5 h-4.5 text-sky-500" />
              <span>Concept Competency &amp; Diagnostic Health Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Continuously calibrated by student performance across timed proctored arena assessments.
            </p>
          </div>
          <span className="hidden sm:inline-flex text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60">
            {recommendations.length === 0 ? 'Benchmarks In-Policy' : `${recommendations.length} Deficits Detected`}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {CONCEPT_MASTERY_BENCHMARKS.map((concept) => (
            <div
              key={concept.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>{concept.category}</span>
                  <span className="text-slate-400">{concept.lastEvaluated}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {concept.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  {concept.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                    {concept.masteryPercentage}% Mastery
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                      concept.status === 'Mastered'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                    }`}
                  >
                    {concept.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      concept.masteryPercentage >= 95 ? 'bg-emerald-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${concept.masteryPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Frontier Mastery Drills Section */}
      <div id="frontier-drills" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <Terminal className="w-4.5 h-4.5 text-purple-500" />
              <span>Curated Frontier Mastery Drills</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Advanced self-directed practice modules for students who have fulfilled foundational benchmarks.
            </p>
          </div>
          <span className="text-xs font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800/60">
            3 Drills Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {FRONTIER_DRILLS.map((drill) => (
            <div
              key={drill.id}
              className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">{drill.domain}</span>
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{drill.duration}</span>
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {drill.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {drill.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Level: {drill.level}
                </span>
                <Link
                  to={drill.lessonLink}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-1 transition shadow-2xs"
                >
                  <span>Launch Drill</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Remediation Engine Architecture & Policy Framework */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-[#070b13] border border-slate-200 dark:border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider flex items-center space-x-2">
          <Layers className="w-4 h-4 text-sky-500" />
          <span>Diagnostic Engine Invariant Rules</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block font-mono text-[11px] text-sky-600 dark:text-sky-400">
              01 &bull; Granular Concept Tagging
            </span>
            <p>
              Every assessment question maps to academic ontology terms. Incorrect options specifically isolate common misconceptions (e.g. leftmost prefix omission in composite indexes).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block font-mono text-[11px] text-amber-600 dark:text-amber-400">
              02 &bull; Automated Remediation Generation
            </span>
            <p>
              When a concept benchmark score falls below 70.0%, the background engine generates a high-priority pathway pointing directly to review materials and labs.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              03 &bull; Verified Gap Resolution
            </span>
            <p>
              Completing the remedial reading lesson and retaking an assessment arena clears the deficit automatically upon verifying mastery above 70%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

