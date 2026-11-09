import React from 'react';
import { AdaptiveModal } from './AdaptiveModal';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <AdaptiveModal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {message}
        </p>
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded-lg text-white shadow-xs transition-colors ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-accent hover:bg-accent-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </AdaptiveModal>
  );
};

