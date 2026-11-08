import React, { useState, useEffect } from 'react';
import { Question, CourseConcept } from '../../types';
import { HelpCircle, Plus, Trash2, X, AlertCircle } from 'lucide-react';

interface QuestionAuthoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    prompt: string;
    question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';
    points: number;
    concept_id?: string;
    options: { option_text: string; is_correct: boolean; order_index: number }[];
    accepted_answers: string[];
  }) => Promise<void>;
  concepts?: CourseConcept[];
  initialData?: Question | null;
}

export const QuestionAuthoringModal: React.FC<QuestionAuthoringModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  concepts = [],
  initialData,
}) => {
  const [prompt, setPrompt] = useState('');
  const [questionType, setQuestionType] = useState<'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer'>('single_choice');
  const [points, setPoints] = useState(1);
  const [conceptId, setConceptId] = useState('');
  const [options, setOptions] = useState<{ option_text: string; is_correct: boolean }[]>([
    { option_text: '', is_correct: true },
    { option_text: '', is_correct: false },
  ]);
  const [acceptedAnswersText, setAcceptedAnswersText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setPrompt(initialData.prompt);
      setQuestionType(initialData.question_type);
      setPoints(initialData.points);
      setConceptId(initialData.concept_id || '');
      if (initialData.question_type === 'short_answer') {
        setAcceptedAnswersText(initialData.accepted_answers ? initialData.accepted_answers.join(', ') : '');
        setOptions([]);
      } else {
        setOptions(
          initialData.options && initialData.options.length > 0
            ? initialData.options.map((o) => ({ option_text: o.option_text, is_correct: Boolean(o.is_correct) }))
            : [
                { option_text: '', is_correct: true },
                { option_text: '', is_correct: false },
              ]
        );
      }
    } else {
      setPrompt('');
      setQuestionType('single_choice');
      setPoints(1);
      setConceptId('');
      setOptions([
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
      ]);
      setAcceptedAnswersText('');
    }
    setError(null);
  }, [initialData, isOpen]);

  // Adjust defaults when question type switches
  const handleTypeChange = (newType: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer') => {
    setQuestionType(newType);
    setError(null);
    if (newType === 'true_false') {
      setOptions([
        { option_text: 'True', is_correct: true },
        { option_text: 'False', is_correct: false },
      ]);
    } else if (newType === 'short_answer') {
      setOptions([]);
      if (!acceptedAnswersText) setAcceptedAnswersText('');
    } else {
      if (options.length < 2) {
        setOptions([
          { option_text: '', is_correct: true },
          { option_text: '', is_correct: false },
        ]);
      }
    }
  };

  const handleAddOption = () => {
    setOptions([...options, { option_text: '', is_correct: false }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index].option_text = text;
    setOptions(updated);
  };

  const handleOptionCorrectChange = (index: number) => {
    if (questionType === 'single_choice' || questionType === 'true_false') {
      const updated = options.map((opt, i) => ({
        ...opt,
        is_correct: i === index,
      }));
      setOptions(updated);
    } else if (questionType === 'multiple_choice') {
      const updated = [...options];
      updated[index].is_correct = !updated[index].is_correct;
      setOptions(updated);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length < 3) {
      setError('Question prompt must be at least 3 characters.');
      return;
    }
    if (points <= 0) {
      setError('Points must be greater than 0.');
      return;
    }

    let finalOptions: { option_text: string; is_correct: boolean; order_index: number }[] = [];
    let finalAcceptedAnswers: string[] = [];

    // Client-side validations per requirement
    if (questionType === 'single_choice') {
      if (options.length < 2) {
        setError('Single choice question requires at least 2 options.');
        return;
      }
      if (options.some((o) => !o.option_text.trim())) {
        setError('All option choices must have non-empty text.');
        return;
      }
      const correctCount = options.filter((o) => o.is_correct).length;
      if (correctCount !== 1) {
        setError('Single choice question must have exactly one correct option.');
        return;
      }
      finalOptions = options.map((o, idx) => ({ option_text: o.option_text.trim(), is_correct: o.is_correct, order_index: idx + 1 }));
    } else if (questionType === 'multiple_choice') {
      if (options.length < 2) {
        setError('Multiple choice question requires at least 2 options.');
        return;
      }
      if (options.some((o) => !o.option_text.trim())) {
        setError('All option choices must have non-empty text.');
        return;
      }
      const correctCount = options.filter((o) => o.is_correct).length;
      if (correctCount < 1) {
        setError('Multiple choice question must have at least one correct option.');
        return;
      }
      finalOptions = options.map((o, idx) => ({ option_text: o.option_text.trim(), is_correct: o.is_correct, order_index: idx + 1 }));
    } else if (questionType === 'true_false') {
      if (options.length !== 2) {
        setError('True/False questions must have exactly two options.');
        return;
      }
      const correctCount = options.filter((o) => o.is_correct).length;
      if (correctCount !== 1) {
        setError('True/False question must designate exactly one correct answer.');
        return;
      }
      finalOptions = options.map((o, idx) => ({ option_text: o.option_text.trim(), is_correct: o.is_correct, order_index: idx + 1 }));
    } else if (questionType === 'short_answer') {
      const variants = acceptedAnswersText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (variants.length < 1) {
        setError('Short answer question must have at least one accepted answer variant.');
        return;
      }
      finalAcceptedAnswers = variants;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        prompt: prompt.trim(),
        question_type: questionType,
        points,
        concept_id: conceptId || undefined,
        options: finalOptions,
        accepted_answers: finalAcceptedAnswers,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save question.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
          <HelpCircle className="w-4 h-4" />
          <span>{initialData ? 'Edit Question' : 'Add Assessment Question'}</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {initialData ? 'Update Question & Answers' : 'Configure Question Details'}
        </h3>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Question Type
              </label>
              <select
                value={questionType}
                onChange={(e) => handleTypeChange(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              >
                <option value="single_choice">Single Choice (1 Correct)</option>
                <option value="multiple_choice">Multiple Choice (1+ Correct)</option>
                <option value="true_false">True / False</option>
                <option value="short_answer">Short Answer (Keywords)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Points
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={points}
                onChange={(e) => setPoints(parseFloat(e.target.value) || 1)}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Diagnostic Concept Tag (Optional)
            </label>
            <select
              value={conceptId}
              onChange={(e) => setConceptId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="">-- No Concept Assigned --</option>
              {concepts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Question Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="e.g. Which consensus protocol uses term numbers and heartbeat messages?"
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Options Section */}
          {questionType === 'short_answer' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Accepted Answer Variants (comma separated)
              </label>
              <input
                type="text"
                value={acceptedAnswersText}
                onChange={(e) => setAcceptedAnswersText(e.target.value)}
                placeholder="e.g. Raft, raft consensus, RAFT"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-meta font-mono text-slate-500 mt-1">
                Learners providing any of these matching strings (case-insensitive) will receive points.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Answer Options & Correct Answer
                </label>
                {questionType !== 'true_false' && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-500 flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Choice</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type={questionType === 'multiple_choice' ? 'checkbox' : 'radio'}
                      name="correct_choice"
                      checked={opt.is_correct}
                      onChange={() => handleOptionCorrectChange(idx)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 shrink-0"
                    />
                    <input
                      type="text"
                      value={opt.option_text}
                      onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                      disabled={questionType === 'true_false'}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                    />
                    {questionType !== 'true_false' && options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
