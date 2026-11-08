import React from 'react';
import { AdaptiveModal } from '../common/AdaptiveModal';
import { Course } from '../../types';
import { AlertTriangle, Check } from 'lucide-react';

interface PrerequisitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  allCourses: Course[];
  selectedPrereqIds: string[];
  setSelectedPrereqIds: (ids: string[]) => void;
  prereqError: string | null;
}

export const PrerequisitesModal: React.FC<PrerequisitesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  allCourses,
  selectedPrereqIds,
  setSelectedPrereqIds,
  prereqError,
}) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Course Prerequisites"
      maxWidth="max-w-lg"
    >
      <p className="text-xs text-slate-500 mb-4">
        Select upstream courses that must be completed before a learner can enroll. Validated with cycle detection algorithms.
      </p>

      {prereqError && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{prereqError}</span>
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
        {allCourses.map((c) => {
          const isSelected = selectedPrereqIds.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                if (isSelected) {
                  setSelectedPrereqIds(selectedPrereqIds.filter((id) => id !== c.id));
                } else {
                  setSelectedPrereqIds([...selectedPrereqIds, c.id]);
                }
              }}
              className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition min-h-[44px] ${
                isSelected
                  ? 'bg-accent-subtle border-accent text-accent-hover'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span>{c.title}</span>
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  isSelected ? 'bg-accent border-accent text-white' : 'border-slate-300'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </div>
            </button>
          );
        })}
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
          onClick={onSave}
          className="px-5 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-bold shadow min-h-[44px]"
        >
          Save Prerequisites
        </button>
      </div>
    </AdaptiveModal>
  );
};
