import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { CohortAnalytics, FunnelItem, ConceptMasteryItem } from '../types';
import { AdaptiveGrid } from '../components/common/AdaptiveGrid';
import { PageHeader, StatTile } from '../components/ui';
import {
  Users,
  Award,
  ArrowLeft,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export const CohortAnalyticsPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<CohortAnalytics | null>(null);
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
    <div className="space-y-8 font-sans">
      <Link
        to="/instructor/courses"
        className="text-xs font-semibold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 flex items-center space-x-1 transition-colors"
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
    </div>
  );
};
