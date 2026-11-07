import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Lesson } from '../types';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  BookOpen,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export const LessonPlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);

  const loadLesson = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.curriculum.getLesson(id);
      setLesson(res.data);
    } catch (err) {
      console.error('Failed to load lesson', err);
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
    try {
      await api.curriculum.markComplete(id);
      setLesson((prev) => (prev ? { ...prev, is_completed: true } : null));
    } catch (err) {
      console.error('Failed to mark lesson complete', err);
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading || !lesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-96 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to={`/courses/${lesson.course_id}`}
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center space-x-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Syllabus</span>
        </Link>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{lesson.duration_minutes} min read</span>
        </div>
      </div>

      {/* Lesson Reader Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 mb-8">
        <div className="border-b border-slate-100 pb-6 mb-8">
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Lesson Content</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {lesson.title}
          </h1>
        </div>

        {/* Content Body */}
        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-4">
          {lesson.content_body ? (
            lesson.content_body.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="text-base text-slate-700 leading-relaxed">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-slate-500 italic">No content text available for this lesson.</p>
          )}
        </div>

        {/* Action Completion Bar */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {lesson.is_completed ? (
              <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Lesson Completed</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Marking this lesson complete updates your course progress and certificate eligibility.
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {!lesson.is_completed && (
              <button
                onClick={handleMarkComplete}
                disabled={isCompleting}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isCompleting ? 'Saving...' : 'Mark as Complete'}</span>
              </button>
            )}

            <Link
              to={`/courses/${lesson.course_id}`}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              <span>Course Syllabus</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

