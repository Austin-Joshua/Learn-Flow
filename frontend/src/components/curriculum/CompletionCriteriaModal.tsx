import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Assessment, Assignment, CompletionCriteria } from '../../types';
import { Award, CheckCircle2, AlertCircle, Save, X, Loader2 } from 'lucide-react';

interface CompletionCriteriaModalProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  assessments: Assessment[];
  assignments: Assignment[];
}

export const CompletionCriteriaModal: React.FC<CompletionCriteriaModalProps> = ({
  courseId,
  isOpen,
  onClose,
  assessments,
  assignments,
}) => {
  const [minLessonPct, setMinLessonPct] = useState<number>(100);
  const [requireAllAssignments, setRequireAllAssignments] = useState<boolean>(true);
  const [selectedAssessments, setSelectedAssessments] = useState<Record<string, number>>({});
  const [selectedAssignments, setSelectedAssignments] = useState<Record<string, number>>({});
  const [version, setVersion] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && courseId) {
      loadCriteria();
    }
  }, [isOpen, courseId]);

  const loadCriteria = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.certificates.getCompletionCriteria(courseId);
      const data = res.data;
      setMinLessonPct(data.min_lesson_completion_pct ?? 100);
      setRequireAllAssignments(data.require_all_assignments ?? true);
      setVersion(data.version ?? 1);

      const assessMap: Record<string, number> = {};
      (data.required_assessments || []).forEach((ra) => {
        assessMap[ra.assessment_id] = ra.min_score_pct;
      });
      setSelectedAssessments(assessMap);

      const assignMap: Record<string, number> = {};
      (data.required_assignments || []).forEach((ra) => {
        assignMap[ra.assignment_id] = ra.min_score_pct;
      });
      setSelectedAssignments(assignMap);
    } catch (err: unknown) {
      console.error('Failed to load criteria', err);
      setError('Could not load current completion criteria.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleToggleAssessment = (id: string, defaultMin: number = 70) => {
    setSelectedAssessments((prev) => {
      const copy = { ...prev };
      if (id in copy) {
        delete copy[id];
      } else {
        copy[id] = defaultMin;
      }
      return copy;
    });
  };

  const handleAssessmentScoreChange = (id: string, score: number) => {
    setSelectedAssessments((prev) => ({
      ...prev,
      [id]: Math.min(100, Math.max(0, score)),
    }));
  };

  const handleToggleAssignment = (id: string, defaultMin: number = 50) => {
    setSelectedAssignments((prev) => {
      const copy = { ...prev };
      if (id in copy) {
        delete copy[id];
      } else {
        copy[id] = defaultMin;
      }
      return copy;
    });
  };

  const handleAssignmentScoreChange = (id: string, score: number) => {
    setSelectedAssignments((prev) => ({
      ...prev,
      [id]: Math.min(100, Math.max(0, score)),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Partial<CompletionCriteria> = {
        min_lesson_completion_pct: minLessonPct,
        require_all_assignments: requireAllAssignments,
        required_assessments: Object.entries(selectedAssessments).map(([id, score]) => ({
          assessment_id: id,
          min_score_pct: score,
        })),
        required_assignments: !requireAllAssignments
          ? Object.entries(selectedAssignments).map(([id, score]) => ({
              assignment_id: id,
              min_score_pct: score,
            }))
          : [],
      };

      const res = await api.certificates.updateCompletionCriteria(courseId, payload);
      setVersion(res.data.version);
      setSuccess(`Criteria updated successfully to Version ${res.data.version}. Prior issued certificates preserve their historical snapshots.`);
    } catch (err: unknown) {
      console.error('Failed to save criteria', err);
      setError('Failed to save completion criteria.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-xl w-full p-6 sm:p-8 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Completion Criteria</h3>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-mono text-meta font-bold">
                  v{version}
                </span>
              </div>
              <p className="text-meta text-slate-400">Configures requirements for verifiable certificate issuance.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-1 space-y-6">
            {/* Minimum Lesson Completion % */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                Minimum Lesson Completion Percentage: {minLessonPct}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minLessonPct}
                onChange={(e) => setMinLessonPct(Number(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-meta text-slate-400 font-mono mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Required Assessments */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-2">
                Mandatory Assessments
              </h4>
              {assessments.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  No assessments authored for this course yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {assessments.map((a) => {
                    const isSelected = a.id in selectedAssessments;
                    return (
                      <div
                        key={a.id}
                        className={`p-3 rounded-xl border transition flex items-center justify-between text-xs ${
                          isSelected
                            ? 'bg-sky-50/50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800'
                            : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <label className="flex items-center space-x-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleAssessment(a.id, a.passing_score_percentage || 70)}
                            className="rounded text-sky-600 focus:ring-sky-500"
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{a.title}</span>
                        </label>

                        {isSelected && (
                          <div className="flex items-center space-x-1.5 font-mono">
                            <span className="text-meta text-slate-400">Min %:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={selectedAssessments[a.id]}
                              onChange={(e) => handleAssessmentScoreChange(a.id, Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-center text-xs text-slate-900 dark:text-white"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assignments Rule */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-2">
                Assignment Passing Requirements
              </h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireAllAssignments}
                    onChange={(e) => setRequireAllAssignments(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Require passing grades on ALL published assignments
                  </span>
                </label>

                {!requireAllAssignments && (
                  <div className="pl-2 space-y-2 mt-2">
                    <p className="text-meta text-slate-400">Select specific required assignments:</p>
                    {assignments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No assignments authored yet.</p>
                    ) : (
                      assignments.map((asg) => {
                        const isSelected = asg.id in selectedAssignments;
                        return (
                          <div
                            key={asg.id}
                            className={`p-3 rounded-xl border transition flex items-center justify-between text-xs ${
                              isSelected
                                ? 'bg-sky-50/50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800'
                                : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleAssignment(asg.id, 50)}
                                className="rounded text-sky-600 focus:ring-sky-500"
                              />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{asg.title}</span>
                            </label>

                            {isSelected && (
                              <div className="flex items-center space-x-1.5 font-mono">
                                <span className="text-meta text-slate-400">Min %:</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={selectedAssignments[asg.id]}
                                  onChange={(e) => handleAssignmentScoreChange(asg.id, Number(e.target.value))}
                                  className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-center text-xs text-slate-900 dark:text-white"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Completion Criteria (v{version + 1})</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
