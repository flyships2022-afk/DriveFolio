import React, { useEffect, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { DriveItem } from '../types/drive';

interface RenameModalProps {
  item: DriveItem | null;
  onClose: () => void;
  onSubmit: (item: DriveItem, newName: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({ item, onClose, onSubmit }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name);
    }
  }, [item]);

  if (!item) return null;

  const trimmed = name.trim();
  const isUnchanged = trimmed === item.name || trimmed.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnchanged) return;
    onSubmit(item, trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-modal-title"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Pencil className="w-4 h-4 text-blue-700 shrink-0" />
            <h2
              id="rename-modal-title"
              className="font-display text-base font-semibold text-slate-900 truncate"
            >
              Rename Item
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close rename dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 space-y-3">
            <label
              htmlFor="rename-input"
              className="block text-sm font-medium text-slate-700"
            >
              New name for <span className="font-semibold text-slate-900">{item.name}</span>
            </label>
            <input
              id="rename-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
              autoFocus
              required
            />
          </div>

          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUnchanged}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
