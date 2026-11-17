import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { PendingConfirmation } from '../types/drive';

interface ConfirmActionModalProps {
  pending: PendingConfirmation | null;
  isExecuting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  pending,
  isExecuting,
  onCancel,
  onConfirm,
}) => {
  if (!pending) return null;

  const isDanger = pending.variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {isDanger ? (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-blue-700 shrink-0" />
            )}
            <h2
              id="confirm-modal-title"
              className="font-display text-base font-semibold text-slate-900 truncate"
            >
              {pending.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isExecuting}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            aria-label="Close confirmation dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">{pending.description}</p>

          {pending.itemsPreview && pending.itemsPreview.length > 0 && (
            <div className="border border-slate-200 rounded-md bg-slate-50 max-h-40 overflow-y-auto divide-y divide-slate-200">
              {pending.itemsPreview.slice(0, 12).map((itemName, idx) => (
                <div
                  key={`${itemName}-${idx}`}
                  className="px-3 py-2 text-xs text-slate-700 truncate"
                >
                  {itemName}
                </div>
              ))}
              {pending.itemsPreview.length > 12 && (
                <div className="px-3 py-2 text-xs text-slate-500 font-mono tabular-nums">
                  +{pending.itemsPreview.length - 12} more item(s)
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isExecuting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isExecuting}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-700 hover:bg-blue-800'
            }`}
          >
            {isExecuting ? 'Applying...' : pending.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
