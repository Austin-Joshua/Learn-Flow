import React from 'react';
import { AdaptiveModal } from '../common/AdaptiveModal';

interface AddConceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  conceptName: string;
  setConceptName: (v: string) => void;
  conceptDesc: string;
  setConceptDesc: (v: string) => void;
}

export const AddConceptModal: React.FC<AddConceptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  conceptName,
  setConceptName,
  conceptDesc,
  setConceptDesc,
}) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Course Diagnostic Concept"
      maxWidth="max-w-md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Concept Name
          </label>
          <input
            type="text"
            required
            value={conceptName}
            onChange={(e) => setConceptName(e.target.value)}
            placeholder="e.g. Distributed Consensus"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-accent min-h-[44px]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={conceptDesc}
            onChange={(e) => setConceptDesc(e.target.value)}
            placeholder="Brief description of the concept..."
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
            Save Concept
          </button>
        </div>
      </form>
    </AdaptiveModal>
  );
};
