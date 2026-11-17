import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Folder, Search, X } from 'lucide-react';
import { DriveItem } from '../types/drive';

interface MoveFolderModalProps {
  isOpen: boolean;
  itemsToMove: DriveItem[];
  allFolders: DriveItem[];
  onClose: () => void;
  onSelectDestination: (targetFolderId: string, targetFolderName: string) => void;
}

export const MoveFolderModal: React.FC<MoveFolderModalProps> = ({
  isOpen,
  itemsToMove,
  allFolders,
  onClose,
  onSelectDestination,
}) => {
  const [query, setQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root');

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedFolderId('root');
    }
  }, [isOpen]);

  const distinctAccounts = useMemo(
    () => new Set(itemsToMove.map((item) => item.accountId)),
    [itemsToMove]
  );

  const hasMixedAccounts = distinctAccounts.size > 1;
  const targetAccountId = itemsToMove[0]?.accountId;
  const targetAccountEmail = itemsToMove[0]?.accountEmail;

  const excludedIds = useMemo(
    () => new Set(itemsToMove.map((item) => item.id)),
    [itemsToMove]
  );

  const filteredFolders = useMemo(() => {
    if (hasMixedAccounts || !targetAccountId) return [];
    const q = query.trim().toLowerCase();
    return allFolders
      .filter((folder) => folder.accountId === targetAccountId)
      .filter((folder) => !excludedIds.has(folder.id))
      .filter((folder) => !q || folder.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allFolders, excludedIds, hasMixedAccounts, targetAccountId, query]);

  if (!isOpen) return null;

  const selectedFolderName =
    selectedFolderId === 'root'
      ? 'My Drive'
      : filteredFolders.find((f) => f.id === selectedFolderId)?.name ||
        'Selected Folder';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-modal-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="move-modal-title"
              className="font-display text-base font-semibold text-slate-900 truncate"
            >
              Move {itemsToMove.length} {itemsToMove.length === 1 ? 'item' : 'items'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {targetAccountEmail
                ? `Destination folders in ${targetAccountEmail}`
                : 'Choose a destination folder in Google Drive'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close move dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {hasMixedAccounts ? (
          <div className="p-5 flex items-start gap-3 text-sm text-amber-800 bg-amber-50">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              The selected items belong to different Google Drive accounts. Please select items
              from a single account to move them into a folder.
            </p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search folders..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              <button
                type="button"
                onClick={() => setSelectedFolderId('root')}
                className={`w-full px-5 py-2.5 flex items-center gap-3 text-left text-sm transition-colors ${
                  selectedFolderId === 'root'
                    ? 'bg-blue-50 text-blue-800 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Folder className="w-4 h-4 shrink-0 text-slate-500" />
                <span className="truncate">My Drive (Root)</span>
              </button>

              {filteredFolders.map((folder) => {
                const isSelected = selectedFolderId === folder.id;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`w-full px-5 py-2.5 flex items-center justify-between gap-3 text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-800 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Folder className="w-4 h-4 shrink-0 text-slate-500" />
                      <span className="truncate">{folder.name}</span>
                    </div>
                    {folder.appProperties?.category && (
                      <span className="text-xs text-slate-500 shrink-0">
                        {folder.appProperties.category}
                      </span>
                    )}
                  </button>
                );
              })}

              {filteredFolders.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-slate-500">
                  No matching folders found.
                </div>
              )}
            </div>
          </>
        )}

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            Cancel
          </button>
          {!hasMixedAccounts && (
            <button
              type="button"
              onClick={() => onSelectDestination(selectedFolderId, selectedFolderName)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
            >
              Review Move
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
