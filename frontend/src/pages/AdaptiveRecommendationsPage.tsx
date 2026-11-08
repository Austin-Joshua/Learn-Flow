import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { LearningRecommendation } from '../types';
import { PageHeader, EmptyState, Card } from '../components/ui';
import {
  GitBranch,
  ArrowRight,
  Zap,
  CheckCircle2
} from 'lucide-react';

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans min-h-[70vh]">
      <PageHeader
        badge={
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium mb-2">
            <GitBranch className="w-3.5 h-3.5 text-sky-500" />
            <span>Diagnostic Remediation Engine</span>
          </div>
        }
        title="Adaptive Review Pathways"
        subtitle="Targeted study recommendations generated automatically from assessment error diagnostics, pinpointing exactly where fundamentals need strengthening."
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <EmptyState
          icon={
            <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-800/60">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          }
          title="All Concept Benchmarks Satisfied"
          description="You currently have no outstanding weak concept recommendations. Taking course assessments will dynamically generate remedial paths whenever a score falls below 70%."
          action={
            <Link
              to="/courses"
              className="h-10 px-5 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-semibold inline-flex items-center transition-colors shadow-xs"
            >
              Explore Course Catalog
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card
              key={rec.id}
              className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start space-x-3.5">
                <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-xs ${
                  rec.priority === 1 ? 'bg-rose-500' : 'bg-amber-500'
                }`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-meta font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                      rec.priority === 1
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                    }`}>
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
      )}
    </div>
  );
};
