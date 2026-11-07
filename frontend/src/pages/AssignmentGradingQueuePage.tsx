import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { AssignmentSubmission } from '../types';
import {
  ClipboardList,
  CheckCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  FileText,
  ArrowLeft,
  Check,
  MessageSquare
} from 'lucide-react';

export const AssignmentGradingQueuePage: React.FC = () => {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Grade modal
  const [selectedSub, setSelectedSub] = useState<AssignmentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(100);
  const [gradeComments, setGradeComments] = useState<string>('Excellent implementation meeting rubric specifications.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const res = await api.assignments.getInstructorQueue();
      setSubmissions(res.data);
    } catch (err) {
      console.error('Failed to load grading queue', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setIsSubmitting(true);
    try {
      await api.assignments.gradeSubmission(selectedSub.id, {
        score: gradeScore,
        comments: gradeComments,
      });
      setSelectedSub(null);
      setSuccessMessage('Submission evaluated and feedback recorded.');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchQueue();
    } catch (err) {
      console.error('Failed to grade submission', err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Assignment Grading Queue
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Review learner submissions, verify quarantine status, and assign rubric scores and qualitative feedback.
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Queue is clear!</h3>
          <p className="text-xs text-slate-500 mt-1">
            All submitted learner assignments have been evaluated.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-5 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                      sub.status === 'clean'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : sub.status === 'graded'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {sub.status === 'clean' && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                      <span>{sub.status}</span>
                    </span>

                    <span className="text-xs text-slate-400">
                      Submitted {new Date(sub.submitted_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    {sub.student_name || 'Enrolled Student'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    File: <span className="font-mono text-indigo-600">{sub.file_name}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setSelectedSub(sub);
                      setGradeScore(sub.score || 100);
                      setGradeComments(sub.feedback?.comments || 'Great submission.');
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                  >
                    {sub.status === 'graded' ? 'Edit Grade' : 'Grade & Feedback'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grade Feedback Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Grade Submission</h3>
            <p className="text-xs text-slate-500 mb-4">
              Student: <span className="font-semibold text-slate-800">{selectedSub.student_name}</span>
            </p>

            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rubric Score (0 - 100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={gradeScore}
                  onChange={(e) => setGradeScore(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Instructor Qualitative Feedback
                </label>
                <textarea
                  rows={4}
                  required
                  value={gradeComments}
                  onChange={(e) => setGradeComments(e.target.value)}
                  placeholder="Feedback on architecture, design patterns, and testing..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  {isSubmitting ? 'Recording...' : 'Publish Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

