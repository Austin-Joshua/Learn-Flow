import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Lesson, LearningResource } from '../types';
import { LessonContent } from '../components/curriculum/LessonContent';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Lock,
  AlertCircle,
  FileText,
  Download,
} from 'lucide-react';

export const LessonPlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLockedError, setIsLockedError] = useState<boolean>(false);

  const loadLesson = async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);
    setIsLockedError(false);
    try {
      const res = await api.curriculum.getLesson(id);
      setLesson(res.data);
      try {
        const resList = await api.curriculum.listResources(id);
        setResources(resList.data);
      } catch {
        // Resources might not exist or optional
        setResources([]);
      }
    } catch (err: unknown) {
      console.error('Failed to load lesson', err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const detail = err.response?.data?.detail;
        if (status === 403) {
          setIsLockedError(true);
          setErrorMessage(
            typeof detail === 'string'
              ? detail
              : 'This lesson is currently locked by course progression rules.'
          );
        } else {
          setErrorMessage(
            typeof detail === 'string'
              ? detail
              : 'Unable to load lesson contents. Please verify your enrollment.'
          );
        }
      } else {
        setErrorMessage('Failed to load lesson.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLesson();
  }, [id]);

  const handleMarkComplete = async () => {
    if (!id) return;
    setIsCompleting(true);
    setErrorMessage(null);
    try {
      await api.curriculum.markComplete(id);
      setLesson((prev) => (prev ? { ...prev, is_completed: true } : null));
    } catch (err: unknown) {
      console.error('Failed to mark lesson complete', err);
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setErrorMessage(String(err.response.data.detail));
      } else {
        setErrorMessage('Could not record lesson completion.');
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDownloadResource = async (resourceId: string, title: string) => {
    try {
      const res = await api.curriculum.getDownloadUrl(resourceId);
      window.open(res.data.download_url, '_blank');
    } catch (err: unknown) {
      console.error('Failed to get download URL', err);
      setErrorMessage(`Unable to download ${title}.`);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  // Graceful 403 / Locked Screen
  if (isLockedError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Module Locked
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 mb-6 leading-relaxed">
          {errorMessage || 'You must complete the preceding modules and assessments before accessing this lesson.'}
        </p>
        <div className="flex items-center justify-center space-x-3">
          <Link
            to="/my-learning"
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            My Courses
          </Link>
          <Link
            to="/my-journey"
            className="px-4 py-2 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-lg text-xs font-semibold transition-colors"
          >
            View Journey Trail
          </Link>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Lesson Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          {errorMessage || 'The requested lesson could not be retrieved.'}
        </p>
        <Link
          to="/my-learning"
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Return to My Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 font-sans pb-28 sm:pb-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to={`/courses/${lesson.course_id}`}
          className="text-xs font-semibold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 flex items-center space-x-1 transition-colors min-h-[44px] py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Syllabus</span>
        </Link>

        <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>{lesson.duration_minutes} min read</span>
        </div>
      </div>

      {errorMessage && !isLockedError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Lesson Reader Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-10 mb-8">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6 mb-8">
          <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Lesson Content</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {lesson.title}
          </h1>
        </div>

        {/* Content Body with 65-75 ch optimal line length */}
        <div className="max-w-[70ch] mx-auto text-slate-700 dark:text-slate-300 leading-relaxed text-base sm:text-lg">
          {lesson.content_body ? (
            <LessonContent markdown={lesson.content_body} />
          ) : (
            <p className="text-slate-500 italic">No content text available for this lesson.</p>
          )}
        </div>

        {/* Downloadable Resources Section */}
        {resources.length > 0 && (
          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-4 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Lesson Attachments & Resources ({resources.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resources.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{r.title}</p>
                      <p className="text-meta text-slate-400 font-mono">
                        {r.file_size_bytes ? `${Math.round(r.file_size_bytes / 1024)} KB` : 'Document'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadResource(r.id, r.title)}
                    className="ml-3 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-lg text-xs font-semibold flex items-center space-x-1 transition shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Completion Bar (Desktop / Tablet) */}
        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 hidden sm:flex items-center justify-between gap-4">
          <div>
            {lesson.is_completed ? (
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Lesson Completed</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Marking complete records progress and unlocks the next sequential material.
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {!lesson.is_completed && (
              <button
                onClick={handleMarkComplete}
                disabled={isCompleting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer min-h-[44px]"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isCompleting ? 'Saving...' : 'Mark as Complete'}</span>
              </button>
            )}

            <Link
              to={`/courses/${lesson.course_id}`}
              className="px-5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center space-x-1.5 min-h-[44px]"
            >
              <span>Course Syllabus</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-30 pb-safe shadow-lg flex items-center space-x-2">
        {!lesson.is_completed ? (
          <button
            onClick={handleMarkComplete}
            disabled={isCompleting}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm min-h-[48px] disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isCompleting ? 'Saving...' : 'Mark as Complete'}</span>
          </button>
        ) : (
          <div className="flex-1 py-3 px-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 min-h-[48px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Completed</span>
          </div>
        )}

        <Link
          to={`/courses/${lesson.course_id}`}
          className="py-3 px-4 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 min-h-[48px]"
        >
          <span>Syllabus</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
