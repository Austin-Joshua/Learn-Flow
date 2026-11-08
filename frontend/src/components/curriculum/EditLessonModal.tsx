import React, { useState, useEffect } from 'react';
import { AdaptiveModal } from '../common/AdaptiveModal';
import { Lesson, CourseConcept } from '../../types';

interface EditLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content_body?: string; duration_minutes: number; concept_id?: string }) => Promise<void>;
  lesson: Lesson | null;
  concepts?: CourseConcept[];
}

export const EditLessonModal: React.FC<EditLessonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  lesson,
  concepts = [],
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [duration, setDuration] = useState(10);
  const [conceptId, setConceptId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setBody(lesson.content_body || '');
      setDuration(lesson.duration_minutes || 10);
      setConceptId(lesson.concept_id || '');
    }
    setError(null);
  }, [lesson, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Lesson title is required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        content_body: body,
        duration_minutes: duration,
        concept_id: conceptId || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update lesson.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Lesson Content"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Lesson Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-accent min-h-[44px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Estimated Duration (Mins)
            </label>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-accent min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Diagnostic Concept Tag
            </label>
            <select
              value={conceptId}
              onChange={(e) => setConceptId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-accent min-h-[44px]"
            >
              <option value="">-- No Concept Mapped --</option>
              {concepts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Lesson Body (Markdown Supported)
          </label>
          <textarea
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow min-h-[44px]"
          >
            {isSubmitting ? 'Saving...' : 'Update Lesson'}
          </button>
        </div>
      </form>
    </AdaptiveModal>
  );
};
