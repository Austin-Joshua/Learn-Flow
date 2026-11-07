import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Users,
  Award,
  ArrowLeft,
  Sparkles,
  TrendingUp
} from 'lucide-react';

export const CohortAnalyticsPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<any>(null);
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
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const completionPct = analytics.total_enrolled > 0
    ? Math.round((analytics.completed_count / analytics.total_enrolled) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link
        to="/instructor/courses"
        className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center space-x-1 mb-6 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Instructor Studio</span>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Cohort Learning Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Dropout funnel telemetry, conceptual mastery tracking, and grade distribution analysis.
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Enrolled Cohort</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{analytics.total_enrolled}</div>
          <span className="text-xs text-slate-500 mt-1 block">Active learners registered</span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Certificates Minted</span>
            <Award className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{analytics.completed_count}</div>
          <span className="text-xs text-slate-500 mt-1 block">Satisfied all criteria</span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completion Rate</span>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-indigo-600">{completionPct}%</div>
          <span className="text-xs text-slate-500 mt-1 block">Cohort graduation velocity</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lesson Drop-off Funnel */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h3 className="text-base font-bold text-slate-900 mb-1">Lesson Drop-off Funnel</h3>
          <p className="text-xs text-slate-500 mb-6">
            Track where learners stall or abandon progress along sequential lessons.
          </p>

          <div className="space-y-4">
            {analytics.drop_off_funnel && analytics.drop_off_funnel.length > 0 ? (
              analytics.drop_off_funnel.map((item: any, idx: number) => {
                const pct = analytics.total_enrolled > 0
                  ? Math.round((item.completed_count / analytics.total_enrolled) * 100)
                  : 0;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 line-clamp-1 max-w-[240px]">
                        {item.lesson_title}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {item.completed_count} completed ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
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
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center space-x-2 text-indigo-600 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">Concept Mastery Index</h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Average accuracy across assessment questions mapped to each core concept.
          </p>

          <div className="space-y-4">
            {analytics.concept_mastery && analytics.concept_mastery.length > 0 ? (
              analytics.concept_mastery.map((c: any, idx: number) => {
                const masteryPct = Math.round(c.mastery_percentage || 0);
                const isWeak = masteryPct < 70;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        {c.concept_name}
                      </span>
                      <span className={`font-mono font-bold ${isWeak ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {masteryPct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isWeak ? 'bg-rose-500' : 'bg-emerald-500'
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

