import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Assessment, AssessmentAttempt, Question } from '../types';
import { AdaptiveModal } from '../components/common/AdaptiveModal';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Shield,
  Send,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export const AssessmentArenaPage: React.FC = () => {
  const { id: assessmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, { selected_option_ids?: string[]; text_response?: string }>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const initArena = async () => {
      if (!assessmentId) return;
      setIsLoading(true);
      try {
        const assessRes = await api.assessments.getDetail(assessmentId);
        setAssessment(assessRes.data);
        setQuestions(assessRes.data.questions || []);

        // Start or resume attempt
        const attemptRes = await api.assessments.startAttempt(assessmentId);
        const att = attemptRes.data;
        setAttempt(att);

        // Prepopulate existing answers if resuming
        if (att.answers && att.answers.length > 0) {
          const preloaded: Record<string, { selected_option_ids?: string[]; text_response?: string }> = {};
          for (const a of att.answers) {
            preloaded[a.question_id] = {
              selected_option_ids: a.selected_option_ids || [],
              text_response: a.text_response || '',
            };
          }
          setAnswers(preloaded);
        }

        // Calculate time remaining based on server expires_at
        const expiresAtMs = new Date(att.expires_at).getTime();
        const nowMs = Date.now();
        const diffSeconds = Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));
        setTimeLeftSeconds(diffSeconds);
      } catch (err: unknown) {
        setErrorMsg(axios.isAxiosError(err) && err.response?.data?.detail ? String(err.response.data.detail) : 'Failed to start assessment attempt.');
      } finally {
        setIsLoading(false);
      }
    };

    initArena();
  }, [assessmentId]);

  const handleSubmitAttempt = async () => {
    if (!attempt || isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    // Format payload
    const payload = Object.entries(answers).map(([qId, ans]) => ({
      question_id: qId,
      selected_option_ids: ans.selected_option_ids || [],
      text_response: ans.text_response || '',
    }));

    const idempotencyKey = `sub-${attempt.id}-${Date.now()}`;
    try {
      const res = await api.assessments.submitAttempt(attempt.id, payload, idempotencyKey);
      navigate(`/attempts/${res.data.id}/result`);
    } catch (err: unknown) {
      setErrorMsg(axios.isAxiosError(err) && err.response?.data?.detail ? String(err.response.data.detail) : 'Submission failed. Please retry.');
      setIsSubmitting(false);
    }
  };

  // Server-authoritative timer countdown
  useEffect(() => {
    if (timeLeftSeconds <= 0 && attempt && !isSubmitting) {
      if (attempt.status === 'in_progress') {
        // Auto submit on time expiry
        handleSubmitAttempt();
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeftSeconds, attempt, isSubmitting]);

  const handleSelectSingleChoice = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { selected_option_ids: [optionId] },
    }));
  };

  const handleToggleMultiSelect = (questionId: string, optionId: string) => {
    const currentList = answers[questionId]?.selected_option_ids || [];
    const exists = currentList.includes(optionId);
    const updated = exists ? currentList.filter((id) => id !== optionId) : [...currentList, optionId];
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { selected_option_ids: updated },
    }));
  };

  const handleShortAnswerChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { text_response: text },
    }));
  };

  if (isLoading || !assessment) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-base font-semibold text-slate-700">Initializing Assessment Security Arena...</h3>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-rose-800">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold">Assessment Error</h3>
          <p className="text-sm mt-1 mb-6 text-rose-700">{errorMsg}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timerWarning = timeLeftSeconds < 120; // 2 minutes remaining

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Security Arena Header (Sticky on mobile) */}
      <div className="sticky top-0 sm:static z-20 bg-slate-900/95 sm:bg-slate-900 backdrop-blur-md border border-slate-800 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 shadow-md">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Secure Timed Assessment Arena</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{assessment.title}</h1>
        </div>

        {/* Server Clock & Mobile Counter */}
        <div className="flex items-center space-x-3">
          <span className="sm:hidden text-xs font-mono text-slate-400">
            Q{currentIdx + 1}/{questions.length}
          </span>
          <div
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border flex items-center space-x-2.5 font-mono text-base sm:text-lg font-bold tracking-wider ${
              timerWarning
                ? 'bg-rose-950/80 border-rose-600 text-rose-400 animate-pulse'
                : 'bg-slate-800/80 border-slate-700 text-emerald-400'
            }`}
          >
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Question Panel */}
        <div className="lg:col-span-3 space-y-6">
          {currentQ ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent-subtle text-accent-hover border border-sky-200 dark:border-sky-900">
                  {currentQ.points} Points
                </span>
              </div>

              {/* Prompt */}
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 leading-snug mb-6">
                {currentQ.prompt}
              </h2>

              {/* Input Types */}
              {/* 1. Single Choice & 3. True / False */}
              {(currentQ.question_type === 'single_choice' || currentQ.question_type === 'true_false') && (
                <div className="space-y-3">
                  {currentQ.options?.map((opt) => {
                    const isSelected = answers[currentQ.id]?.selected_option_ids?.[0] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectSingleChoice(currentQ.id, opt.id)}
                        className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-accent-subtle border-accent text-accent-hover shadow-sm'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>{opt.option_text}</span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-accent bg-accent text-white' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. Multi-Select (Partial Credit) */}
              {currentQ.question_type === 'multiple_choice' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 mb-2 italic">
                    Select all that apply. Weighted partial credit is awarded.
                  </p>
                  {currentQ.options?.map((opt) => {
                    const isChecked = answers[currentQ.id]?.selected_option_ids?.includes(opt.id) || false;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleToggleMultiSelect(currentQ.id, opt.id)}
                        className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition flex items-center justify-between ${
                          isChecked
                            ? 'bg-accent-subtle border-accent text-accent-hover shadow-sm'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>{opt.option_text}</span>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                            isChecked ? 'border-accent bg-accent text-white' : 'border-slate-300'
                          }`}
                        >
                          {isChecked && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 4. Symbol-Preserving Short Answer */}
              {currentQ.question_type === 'short_answer' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Type your answer below. Technical symbols such as <code className="bg-slate-100 px-1 py-0.5 rounded text-accent">C++</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-accent">.NET</code>, and <code className="bg-slate-100 px-1 py-0.5 rounded text-accent">HTTP/2</code> are strictly preserved.
                  </p>
                  <input
                    type="text"
                    value={answers[currentQ.id]?.text_response || ''}
                    onChange={(e) => handleShortAnswerChange(currentQ.id, e.target.value)}
                    placeholder="Type your exact technical answer..."
                    className="w-full p-3.5 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent focus:border-accent shadow-sm"
                  />
                </div>
              )}

              {/* Pagination Controls */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-8">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                    className="px-5 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Assessment</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-sm text-slate-500">No questions available in this assessment.</p>
            </div>
          )}
        </div>

        {/* Sidebar Navigation */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Question Navigator
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const isAnswered =
                  (answers[q.id]?.selected_option_ids && answers[q.id].selected_option_ids!.length > 0) ||
                  (answers[q.id]?.text_response && answers[q.id].text_response!.trim().length > 0);
                const isCurrent = currentIdx === idx;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                      isCurrent
                        ? 'ring-2 ring-accent ring-offset-2 bg-accent text-white'
                        : isAnswered
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Answered: {answeredCount}/{questions.length}</span>
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="text-accent font-bold hover:text-accent-hover"
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AdaptiveModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Submit Assessment?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            You have answered <span className="font-semibold text-slate-900 dark:text-white">{answeredCount}</span> out of <span className="font-semibold text-slate-900 dark:text-white">{questions.length}</span> questions. Once submitted, your answers will be automatically graded and cannot be modified.
          </p>
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition min-h-[44px]"
            >
              Continue Quiz
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitAttempt}
              className="px-5 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? 'Grading...' : 'Confirm Submission'}
            </button>
          </div>
        </div>
      </AdaptiveModal>
    </div>
  );
};
