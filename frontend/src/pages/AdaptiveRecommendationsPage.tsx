import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { LearningRecommendation } from '../types';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Award,
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
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Unique Selling Proposition 1</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Adaptive Learning Path
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
          Deterministic, explainable diagnostic engine mapping missed assessment questions to prerequisite-checked remedial lessons. Zero third-party LLM latency or hallucination.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">All Conceptual Targets Satisfied</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6 max-w-sm mx-auto leading-relaxed">
            You currently have no outstanding weak concept recommendations. Taking course assessments will dynamically generate remedial paths whenever a score falls below 70%.
          </p>
          <Link
            to="/courses"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Explore More Assessments
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:border-indigo-300 transition"
            >
              <div className="flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm ${
                  rec.priority === 1 ? 'bg-rose-500 shadow-rose-500/20' : 'bg-amber-500 shadow-amber-500/20'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      rec.priority === 1 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {rec.priority === 1 ? 'Critical Priority' : 'Standard Priority'}
                    </span>
                    <span className="text-xs text-slate-400">
                      Diagnosed {new Date(rec.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-slate-800 font-medium mt-2 leading-relaxed max-w-2xl">
                    {rec.rationale}
                  </p>
                </div>
              </div>

              <Link
                to={`/lessons/${rec.target_lesson_id}`}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-2 whitespace-nowrap self-end sm:self-center"
              >
                <span>Study Lesson</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
