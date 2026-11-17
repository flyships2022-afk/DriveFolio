import React from 'react';
import {
  X,
  ExternalLink,
  FolderInput,
  Pencil,
  Star,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import { CategoryDefinition, DriveItem } from '../types/drive';
import {
  formatBytes,
  formatDriveDate,
  getEffectiveMimeType,
  getItemCategory,
  getParentLocationLabel,
  getTypeLabel,
  isFolder,
} from '../utils/categorize';

interface FileDetailsDrawerProps {
  item: DriveItem | null;
  categories: CategoryDefinition[];
  folderMap: Map<string, DriveItem>;
  onClose: () => void;
  onOpenFolder: (folder: DriveItem) => void;
  onAssignCategory: (item: DriveItem, category: string | null) => void;
  onToggleStar: (item: DriveItem) => void;
  onRequestMove: (item: DriveItem) => void;
  onRequestRename: (item: DriveItem) => void;
  onRequestTrash: (item: DriveItem) => void;
}

export const FileDetailsDrawer: React.FC<FileDetailsDrawerProps> = ({
  item,
  categories,
  folderMap,
  onClose,
  onOpenFolder,
  onAssignCategory,
  onToggleStar,
  onRequestMove,
  onRequestRename,
  onRequestTrash,
}) => {
  if (!item) return null;

  const folder = isFolder(item);
  const effectiveMime = getEffectiveMimeType(item);
  const category = getItemCategory(item) || '';
  const owner = item.owners && item.owners[0];

  return (
    <aside
      className="w-full sm:w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 h-full overflow-y-auto"
      aria-label="Item details"
    >
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold text-slate-900 truncate">
          Item Details
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close details panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-6 flex-1">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-900 break-words">
            {item.name}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {getTypeLabel(effectiveMime)} · {folder ? 'Folder' : formatBytes(item.size)}
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="inspector-category-select"
            className="block text-xs font-medium text-slate-500"
          >
            Assigned Category
          </label>
          <select
            id="inspector-category-select"
            value={category}
            onChange={(e) =>
              onAssignCategory(item, e.target.value ? e.target.value : null)
            }
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
          >
            <option value="">Uncategorized</option>
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-200 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Account</span>
            <span className="font-medium text-slate-800 truncate max-w-[160px]">
              {item.accountEmail}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Location</span>
            <span className="font-medium text-slate-800 truncate max-w-[160px]">
              {getParentLocationLabel(item, folderMap)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Modified</span>
            <span className="font-mono tabular-nums text-slate-800">
              {formatDriveDate(item.modifiedTime)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Created</span>
            <span className="font-mono tabular-nums text-slate-800">
              {formatDriveDate(item.createdTime)}
            </span>
          </div>
          {owner && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Owner</span>
              <span className="text-slate-800 truncate max-w-[160px]">
                {owner.displayName || owner.emailAddress || 'Me'}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-3 border-t border-slate-200">
          {folder && (
            <button
              type="button"
              onClick={() => onOpenFolder(item)}
              className="w-full px-3 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 flex items-center justify-center gap-2 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Open Folder</span>
            </button>
          )}

          {item.webViewLink && (
            <a
              href={item.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Google Drive</span>
            </a>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onToggleStar(item)}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Star
                className={`w-3.5 h-3.5 ${item.starred ? 'text-amber-500' : ''}`}
                fill={item.starred ? 'currentColor' : 'none'}
              />
              <span>{item.starred ? 'Unstar' : 'Star'}</span>
            </button>

            <button
              type="button"
              onClick={() => onRequestMove(item)}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span>Move</span>
            </button>

            <button
              type="button"
              onClick={() => onRequestRename(item)}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Rename</span>
            </button>

            <button
              type="button"
              onClick={() => onRequestTrash(item)}
              className="px-3 py-2 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-md hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Trash</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
