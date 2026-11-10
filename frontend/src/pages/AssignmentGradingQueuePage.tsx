import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { AssignmentSubmission, InstructorQuizAttemptItem } from '../types';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { AdaptiveModal } from '../components/common/AdaptiveModal';
import {
  ClipboardList,
  ShieldCheck,
  ArrowLeft,
  Check,
  FileCode,
  GraduationCap,
  MessageSquare,
  Award,
} from 'lucide-react';

export const AssignmentGradingQueuePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assignments' | 'quizzes'>('assignments');
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<InstructorQuizAttemptItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Grade assignment modal
  const [selectedSub, setSelectedSub] = useState<AssignmentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(100);
  const [gradeComments, setGradeComments] = useState<string>(
    'Excellent implementation meeting rubric specifications.'
  );

  // Quiz feedback modal
  const [selectedAttempt, setSelectedAttempt] = useState<InstructorQuizAttemptItem | null>(null);
  const [quizFeedbackText, setQuizFeedbackText] = useState<string>('');
  const [quizScoreOverride, setQuizScoreOverride] = useState<number | undefined>(undefined);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchQueues = async () => {
    setIsLoading(true);
    try {
      const [subRes, quizRes] = await Promise.all([
        api.assignments.getInstructorQueue(),
        api.assessments.getInstructorQueue(),
      ]);
      setSubmissions(subRes.data);
      setQuizAttempts(quizRes.data);
    } catch (err) {
      console.error('Failed to load grading queues', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
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
      setSuccessMessage('Assignment submission evaluated and feedback recorded.');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchQueues();
    } catch (err) {
      console.error('Failed to grade submission', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuizFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttempt) return;
    setIsSubmitting(true);
    try {
      await api.assessments.submitFeedback(selectedAttempt.attempt_id, {
        instructor_feedback: quizFeedbackText,
        score_override: quizScoreOverride,
      });
      setSelectedAttempt(null);
      setSuccessMessage('Faculty review and guidance posted to student assessment portal.');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchQueues();
    } catch (err) {
      console.error('Failed to record quiz feedback', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignmentColumns: ColumnDef<AssignmentSubmission>[] = [
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
          className="px-3.5 py-2 min-h-[38px] bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          {sub.status === 'graded' ? 'Edit Grade' : 'Grade & Feedback'}
        </button>
      ),
    },
  ];

  const quizColumns: ColumnDef<InstructorQuizAttemptItem>[] = [
    {
      key: 'learner',
      header: 'Learner & Quiz',
      isPrimary: true,
      priority: 'always',
      render: (att) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white leading-tight">
            {att.learner_name}
          </div>
          <div className="text-meta text-slate-400 font-mono">
            {att.learner_email}
          </div>
          <div className="text-label text-sky-600 dark:text-sky-400 font-semibold mt-0.5">
            {att.assessment_title} <span className="text-slate-400 font-normal">({att.course_title})</span>
          </div>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Score & Mastery',
      priority: 'always',
      render: (att) => (
        <div className="space-y-1">
          <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
            {att.score_percentage.toFixed(1)}%
          </div>
          <span
            className={`text-meta font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
              att.is_passed
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {att.is_passed ? 'Passed' : 'Needs Review'}
          </span>
        </div>
      ),
    },
    {
      key: 'review_status',
      header: 'Faculty Review',
      priority: 'always',
      render: (att) => (
        <div>
          {att.instructor_feedback ? (
            <div className="space-y-0.5 max-w-[240px]">
              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-meta font-bold rounded-full uppercase tracking-wider">
                Reviewed
              </span>
              <p className="text-meta text-slate-600 dark:text-slate-300 line-clamp-1 italic mt-1">
                "{att.instructor_feedback}"
              </p>
            </div>
          ) : (
            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-meta font-bold rounded-full uppercase tracking-wider">
              Pending Review
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'submitted_at',
      header: 'Submitted',
      priority: 'desktop-only',
      render: (att) => (
        <span className="text-slate-500 dark:text-slate-400 font-mono text-label">
          {att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : 'Active'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      isAction: true,
      priority: 'always',
      align: 'right',
      render: (att) => (
        <button
          type="button"
          onClick={() => {
            setSelectedAttempt(att);
            setQuizFeedbackText(att.instructor_feedback || 'Solid conceptual understanding demonstrated.');
            setQuizScoreOverride(att.score_percentage);
          }}
          className="px-3.5 py-2 min-h-[38px] bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center space-x-1"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>{att.instructor_feedback ? 'Edit Feedback' : 'Review & Feedback'}</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 font-sans pb-10">
      <Link
        to="/instructor/courses"
        className="text-xs font-semibold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 flex items-center space-x-1 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Instructor Studio</span>
      </Link>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Instructor Evaluation & Grading Queue
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Review learner submissions across assignments and quiz attempts, inspect quarantine status, and provide rubric guidance.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'assignments'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Assignment Submissions ({submissions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quizzes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'quizzes'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Quiz Attempts Review ({quizAttempts.length})</span>
        </button>
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
      ) : activeTab === 'assignments' ? (
        <DataTable
          data={submissions}
          columns={assignmentColumns}
          keyExtractor={(sub) => sub.id}
          emptyMessage="Assignment grading queue is clear. All submissions have been evaluated."
          emptyIcon={<ClipboardList className="w-8 h-8 text-slate-300" />}
        />
      ) : (
        <DataTable
          data={quizAttempts}
          columns={quizColumns}
          keyExtractor={(att) => att.attempt_id}
          emptyMessage="No completed student quiz attempts waiting for review."
          emptyIcon={<Award className="w-8 h-8 text-slate-300" />}
        />
      )}

      {/* Assignment Grade Modal */}
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
              className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Recording Grade...' : 'Save Evaluation'}
            </button>
          </div>
        </form>
      </AdaptiveModal>

      {/* Quiz Attempt Feedback Modal */}
      <AdaptiveModal
        isOpen={Boolean(selectedAttempt)}
        onClose={() => setSelectedAttempt(null)}
        title="Faculty Quiz Review & Guidance"
        description={`Student: ${selectedAttempt?.learner_name} • Quiz: ${selectedAttempt?.assessment_title} (${selectedAttempt?.course_title})`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleQuizFeedbackSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Current Score:</span>
              <span className="font-mono font-bold ml-1 text-slate-900 dark:text-white">
                {selectedAttempt?.score_percentage.toFixed(1)}%
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-meta font-bold uppercase font-mono ${
                selectedAttempt?.is_passed
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
              }`}
            >
              {selectedAttempt?.is_passed ? 'Mastery Passed' : 'Below Threshold'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Faculty Guidance & Pedagogical Feedback
            </label>
            <textarea
              rows={4}
              required
              value={quizFeedbackText}
              onChange={(e) => setQuizFeedbackText(e.target.value)}
              placeholder="Provide constructive diagnostic feedback for the learner..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Adjusted Score Percentage (Optional)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={quizScoreOverride ?? ''}
              onChange={(e) => setQuizScoreOverride(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Leave blank to keep auto-graded score"
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedAttempt(null)}
              className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              <span>{isSubmitting ? 'Posting Feedback...' : 'Post Faculty Review'}</span>
            </button>
          </div>
        </form>
      </AdaptiveModal>
    </div>
  );
};

