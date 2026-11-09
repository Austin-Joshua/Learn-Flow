import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { AssessmentAttempt, LearningRecommendation } from '../types';
import {
  CheckCircle2,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  AlertCircle,
} from 'lucide-react';

export const AssessmentResultPage: React.FC = () => {
  const { id: attemptId } = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!attemptId) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.assessments.getAttemptResult(attemptId);
        setAttempt(res.data);

        // Fetch adaptive recommendations
        const recRes = await api.adaptive.getMyPath();
        const related = recRes.data.filter((r) => r.source_attempt_id === attemptId);
        setRecommendations(related.length > 0 ? related : recRes.data);
      } catch (err) {
        console.error('Failed to load attempt result', err);
        setError('Failed to retrieve assessment results.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [attemptId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-rose-800">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold">Assessment Result Not Found</h3>
          <p className="text-sm mt-1 mb-6 text-rose-700">{error || 'Could not load results for this attempt.'}</p>
          <Link
            to="/my-learning"
            className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 inline-block"
          >
            Return to Courses
          </Link>
        </div>
      </div>
    );
  }

  const isPassed = attempt.is_passed;
  const scorePct = parseFloat(String(attempt.score_percentage || 0));

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Result Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-10 mb-10 text-center relative overflow-hidden">
        <div className={`inline-flex p-4 rounded-3xl mb-4 ${
          isPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {isPassed ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
        </div>

        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {isPassed ? 'Assessment Passed!' : 'Assessment Incomplete'}
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
          {isPassed
            ? 'Congratulations! You have satisfied the mastery threshold for this assessment.'
            : 'You did not achieve the required passing score. Review the adaptive recommendations below to reinforce weak concepts.'}
        </p>

        {/* Score Ring / Metric */}
        <div className="mt-8 flex items-center justify-center space-x-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 px-6 text-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Final Score</span>
            <div className={`text-3xl font-bold mt-1 ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
              {scorePct.toFixed(1)}%
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 px-6 text-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Points Earned</span>
            <div className="text-3xl font-bold text-slate-900 mt-1">
              {attempt.total_score || 0} pts
            </div>
          </div>
        </div>
      </div>

      {/* Adaptive Learning Path Recommendations (USP 1) */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center space-x-2 text-accent">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-bold tracking-tight">
            Adaptive Remedial Path (USP 1)
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Generated deterministically by evaluating concepts scoring under 70%. Prerequisite-checked and mapped to accessible lessons.
        </p>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 mt-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-accent-subtle/50 border border-sky-200 dark:border-sky-900 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Targeted Remedial Lesson
                    </h4>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed max-w-xl">
                      {rec.rationale}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/lessons/${rec.target_lesson_id}`}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5 whitespace-nowrap self-end sm:self-center"
                >
                  <span>Review Lesson</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-emerald-800 text-sm flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>No conceptual weaknesses detected! You demonstrated comprehensive mastery across all evaluated topics.</span>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <Link
          to="/courses"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          Return to Catalog
        </Link>
        <Link
          to="/my-learning"
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
        >
          My Courses
        </Link>
      </div>
    </div>
  );
};

