import React, { useEffect, useState } from 'react';
import { FolderPlus, X } from 'lucide-react';
import { CategoryDefinition, ConnectedAccount } from '../types/drive';

interface NewFolderModalProps {
  isOpen: boolean;
  currentFolderName: string;
  accounts: ConnectedAccount[];
  defaultAccountId: string;
  lockedAccountId?: string | null;
  categories: CategoryDefinition[];
  onClose: () => void;
  onSubmit: (name: string, category: string, accountId: string) => void;
}

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  currentFolderName,
  accounts,
  defaultAccountId,
  lockedAccountId,
  categories,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState(lockedAccountId || defaultAccountId);

  useEffect(() => {
    if (isOpen) {
      setAccountId(lockedAccountId || defaultAccountId);
    }
  }, [isOpen, lockedAccountId, defaultAccountId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !accountId) return;
    onSubmit(name.trim(), category, accountId);
    setName('');
    setCategory('');
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-folder-title"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <FolderPlus className="w-5 h-5 text-blue-700 shrink-0" />
            <h2
              id="new-folder-title"
              className="font-display text-base font-semibold text-slate-900 truncate"
            >
              Create New Folder
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close new folder dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 space-y-4">
            <p className="text-xs text-slate-500">
              Location: <span className="font-medium text-slate-700">{currentFolderName}</span>
              {selectedAccount ? ` (${selectedAccount.email})` : ''}
            </p>

            {accounts.length > 1 && !lockedAccountId && (
              <div>
                <label
                  htmlFor="folder-account-select"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Google Drive Account
                </label>
                <select
                  id="folder-account-select"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label
                htmlFor="folder-name-input"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Folder name
              </label>
              <input
                id="folder-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q4 Tax Records"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                autoFocus
                required
              />
            </div>

            <div>
              <label
                htmlFor="folder-category-select"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Category (optional)
              </label>
              <select
                id="folder-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
              >
                <option value="">Uncategorized</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
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
              disabled={!name.trim()}
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
