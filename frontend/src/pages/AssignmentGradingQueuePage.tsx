import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { AssignmentSubmission } from '../types';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { AdaptiveModal } from '../components/common/AdaptiveModal';
import {
  ClipboardList,
  ShieldCheck,
  ArrowLeft,
  Check,
  FileCode,
} from 'lucide-react';

export const AssignmentGradingQueuePage: React.FC = () => {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Grade modal
  const [selectedSub, setSelectedSub] = useState<AssignmentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(100);
  const [gradeComments, setGradeComments] = useState<string>(
    'Excellent implementation meeting rubric specifications.'
  );
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

  const columns: ColumnDef<AssignmentSubmission>[] = [
    {
      key: 'student',
      header: 'Learner & File',
      isPrimary: true,
      priority: 'always',
      render: (sub) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white leading-tight">
            {sub.student_name || 'Enrolled Student'}
          </div>
          <div className="text-label font-mono text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-1">
            <FileCode className="w-3 h-3 text-sky-500" />
            <span className="truncate max-w-[200px]">{sub.file_name}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Quarantine Status',
      isStatus: true,
      priority: 'always',
      render: (sub) => (
        <span
          className={`text-meta font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1 ${
            sub.status === 'clean'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : sub.status === 'graded'
              ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
          }`}
        >
          {sub.status === 'clean' && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
          <span>{sub.status}</span>
        </span>
      ),
    },
    {
      key: 'submitted_at',
      header: 'Submitted',
      priority: 'desktop-only',
      render: (sub) => (
        <span className="text-slate-500 dark:text-slate-400 font-mono text-label">
          {new Date(sub.submitted_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Evaluation',
      isAction: true,
      priority: 'always',
      align: 'right',
      render: (sub) => (
        <button
          type="button"
          onClick={() => {
            setSelectedSub(sub);
            setGradeScore(sub.score || 100);
            setGradeComments(sub.feedback?.comments || 'Great submission.');
          }}
          className="px-3.5 py-2 min-h-[38px] bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          {sub.status === 'graded' ? 'Edit Grade' : 'Grade & Feedback'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <Link
        to="/instructor/courses"
        className="text-xs font-semibold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 flex items-center space-x-1 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Instructor Studio</span>
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Assignment Grading Queue
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Review learner submissions, verify virus scan quarantine status, and assign rubric scores and qualitative feedback.
        </p>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <DataTable
          data={submissions}
          columns={columns}
          keyExtractor={(sub) => sub.id}
          emptyMessage="Grading queue is clear. All submissions have been evaluated."
          emptyIcon={<ClipboardList className="w-8 h-8 text-slate-300" />}
        />
      )}

      {/* Adaptive Grade Feedback Modal (Centered Dialog on Desktop, Bottom Sheet on Mobile) */}
      <AdaptiveModal
        isOpen={Boolean(selectedSub)}
        onClose={() => setSelectedSub(null)}
        title="Grade Assignment Submission"
        description={`Student: ${selectedSub?.student_name || 'Enrolled Student'} • File: ${selectedSub?.file_name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleGradeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Score Awarded (0 - 100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              required
              value={gradeScore}
              onChange={(e) => setGradeScore(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Qualitative Feedback / Rubric Notes
            </label>
            <textarea
              rows={4}
              required
              value={gradeComments}
              onChange={(e) => setGradeComments(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedSub(null)}
              className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
            >
              {isSubmitting ? 'Recording Grade...' : 'Save Evaluation'}
            </button>
          </div>
        </form>
      </AdaptiveModal>
    </div>
  );
};
