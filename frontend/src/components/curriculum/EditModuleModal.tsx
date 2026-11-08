import React, { useState, useEffect } from 'react';
import { AdaptiveModal } from '../common/AdaptiveModal';
import { Module } from '../../types';

interface EditModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
  module: Module | null;
}

export const EditModuleModal: React.FC<EditModuleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  module: mod,
}) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mod) {
      setTitle(mod.title);
    }
    setError(null);
  }, [mod, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Module title is required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(title.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update module.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Sequential Module"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Module Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-accent min-h-[44px]"
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
            {isSubmitting ? 'Saving...' : 'Update Module'}
          </button>
        </div>
      </form>
    </AdaptiveModal>
  );
};
