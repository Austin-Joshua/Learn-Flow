import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { CohortAnalytics, FunnelItem, ConceptMasteryItem, CourseAtRiskResponse } from '../types';
import { AdaptiveGrid } from '../components/common/AdaptiveGrid';
import { PageHeader, StatTile } from '../components/ui';
import {
  Users,
  Award,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const CohortAnalyticsPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<CohortAnalytics | null>(null);
  const [atRiskData, setAtRiskData] = useState<CourseAtRiskResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!courseId) return;
      setIsLoading(true);
      try {
        const res = await api.analytics.getCourseAnalytics(courseId);
        setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to load course analytics', err);
      }

      try {
        const atRiskRes = await api.analytics.getCourseAtRisk(courseId);
        setAtRiskData(atRiskRes.data);
      } catch (err) {
        console.error('Failed to load at-risk learners', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [courseId]);

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  const completionPct =
    analytics.total_enrolled > 0
      ? Math.round(((analytics.completed_count || 0) / analytics.total_enrolled) * 100)
      : 0;

  return (
    <div className="space-y-4 sm:space-y-5 font-sans pb-10">
      <Link
        to="/instructor/courses"
        className="text-xs font-semibold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 flex items-center space-x-1 transition-colors mb-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Instructor Studio</span>
      </Link>

      <PageHeader
        title="Cohort Learning Analytics"
        subtitle="Telemetry for learner retention, lesson drop-off velocity, and conceptual mastery."
      />

      {/* Top Stats with AdaptiveGrid */}
      <AdaptiveGrid variant="compact">
        <StatTile
          label="Enrolled Cohort"
          value={analytics.total_enrolled || 0}
          icon={<Users className="w-5 h-5" />}
          subtext="Active learners registered"
        />
        <StatTile
          label="Certificates Minted"
          value={analytics.completed_count || 0}
          icon={<Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          subtext="Satisfied all criteria"
        />
        <StatTile
          label="Completion Velocity"
          value={`${completionPct}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          subtext="Cohort graduation rate"
        />
        <StatTile
          label="Needing Support"
          value={atRiskData?.at_risk_count ?? 0}
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          subtext="Explainable intervention indicators"
        />
      </AdaptiveGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lesson Drop-off Funnel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Lesson Progression Funnel
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Track where learners complete or stall along sequential lessons.
          </p>

          <div className="space-y-4">
            {analytics.drop_off_funnel && analytics.drop_off_funnel.length > 0 ? (
              analytics.drop_off_funnel.map((item: FunnelItem, idx: number) => {
                const completed = item.completed_count || 0;
                const pct =
                  analytics.total_enrolled > 0
                    ? Math.round((completed / analytics.total_enrolled) * 100)
                    : 0;

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                        {item.lesson_title}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-label">
                        {completed} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-sky-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 italic">No funnel data available yet.</p>
            )}
          </div>
        </div>

        {/* Concept Mastery Rates */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Concept Mastery Index</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Assessment question accuracy mapped to core curricular concepts.
          </p>

          <div className="space-y-4">
            {analytics.concept_mastery && analytics.concept_mastery.length > 0 ? (
              analytics.concept_mastery.map((c: ConceptMasteryItem, idx: number) => {
                const masteryPct = Math.round(c.mastery_percentage || 0);
                const isWeak = masteryPct < 70;

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{c.concept_name}</span>
                      <span className={`font-mono font-bold text-label ${isWeak ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {masteryPct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isWeak ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${masteryPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 italic">No concept assessment data recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Learners Needing Support (Explainable Interventions) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Learners Needing Academic Support ({atRiskData?.at_risk_count ?? 0})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Explainable, rule-based indicators: pace deceleration, failed attempts, and missed deadlines.
              </p>
            </div>
          </div>
          {atRiskData && atRiskData.at_risk_count > 0 && (
            <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-meta font-bold rounded-full uppercase tracking-wider font-mono">
              Action Required
            </span>
          )}
        </div>

        {!atRiskData || atRiskData.learners.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              All active cohort learners are currently on pace and in good academic standing.
            </p>
            <p className="text-meta text-slate-400 mt-0.5">
              No failed attempts, missed deadlines, or pace stalls detected.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {atRiskData.learners.map((learner) => (
              <div key={learner.user_id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {learner.full_name}
                    </span>
                    <span className="text-meta text-slate-400 font-mono">
                      &lt;{learner.email}&gt;
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-meta font-bold font-mono uppercase tracking-wider ${
                        learner.risk_level === 'high'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                      }`}
                    >
                      {learner.risk_level} risk
                    </span>
                  </div>

                  {/* Explainable Reasons */}
                  <ul className="space-y-1 pt-1">
                    {learner.risk_reasons.map((reason, rIdx) => (
                      <li key={rIdx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start space-x-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Risk Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {learner.risk_tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-meta font-mono"
                      >
                        #{tag.toLowerCase().replace('_', '-')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress Mini Meter */}
                <div className="sm:w-44 shrink-0 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex justify-between text-meta font-mono mb-1">
                    <span className="text-slate-400">Progress</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{learner.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-sky-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, learner.progress_percentage)}%` }}
                    />
                  </div>
                  <p className="text-meta text-slate-400 font-mono mt-2">
                    Enrolled {new Date(learner.enrolled_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
