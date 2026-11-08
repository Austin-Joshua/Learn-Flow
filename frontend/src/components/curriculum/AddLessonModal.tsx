import React from 'react';
import { AdaptiveModal } from '../common/AdaptiveModal';

interface AddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  lessonTitle: string;
  setLessonTitle: (v: string) => void;
  lessonDuration: number;
  setLessonDuration: (v: number) => void;
  lessonBody: string;
  setLessonBody: (v: string) => void;
  selectedConceptId: string;
  setSelectedConceptId: (v: string) => void;
  concepts?: Array<{ id: string; name: string }>;
}

export const AddLessonModal: React.FC<AddLessonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  lessonTitle,
  setLessonTitle,
  lessonDuration,
  setLessonDuration,
  lessonBody,
  setLessonBody,
  selectedConceptId,
  setSelectedConceptId,
  concepts,
}) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Module Lesson"
      maxWidth="max-w-lg"
    >
      <p className="text-xs text-slate-500 mb-4">
        Lessons can be associated with a diagnostic concept to enable the Adaptive Recommendation engine.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Lesson Title
          </label>
          <input
            type="text"
            required
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            placeholder="e.g. Paxos Consensus Algorithm"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-accent min-h-[44px]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Concept Tag (For Adaptive Learning)
          </label>
          <select
            value={selectedConceptId}
            onChange={(e) => setSelectedConceptId(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-accent bg-white min-h-[44px]"
          >
            <option value="">No Concept (General Topic)</option>
            {concepts?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Duration (Minutes)
          </label>
          <input
            type="number"
            min={1}
            value={lessonDuration}
            onChange={(e) => setLessonDuration(parseInt(e.target.value) || 10)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-accent min-h-[44px]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Lesson Body
          </label>
          <textarea
            rows={4}
            value={lessonBody}
            onChange={(e) => setLessonBody(e.target.value)}
            placeholder="Write lesson text or guide..."
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-accent"
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
            className="px-5 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-bold shadow min-h-[44px]"
          >
            Save Lesson
          </button>
        </div>
      </form>
    </AdaptiveModal>
  );
};
