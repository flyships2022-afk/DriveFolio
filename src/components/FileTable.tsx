import React from 'react';
import {
  Folder,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileImage,
  File as FileIcon,
  Star,
  ExternalLink,
  FolderInput,
  Pencil,
  Trash2,
  Info,
  FolderPlus,
} from 'lucide-react';
import { CategoryDefinition, DriveItem, ViewMode } from '../types/drive';
import {
  classifyMimeType,
  formatBytes,
  formatDriveDate,
  getEffectiveMimeType,
  getFolderKey,
  getItemCategory,
  getParentLocationLabel,
  getTypeLabel,
  isFolder,
} from '../utils/categorize';

interface FileTableProps {
  items: DriveItem[];
  isLoading: boolean;
  viewMode: ViewMode;
  showAccountTag: boolean;
  selectedIds: Set<string>;
  activeDetailId: string | null;
  categories: CategoryDefinition[];
  folderMap: Map<string, DriveItem>;
  hasActiveFilters: boolean;
  onToggleSelect: (compositeKey: string) => void;
  onToggleSelectAll: () => void;
  onOpenFolder: (folder: DriveItem) => void;
  onInspectItem: (item: DriveItem) => void;
  onAssignCategory: (item: DriveItem, category: string | null) => void;
  onToggleStar: (item: DriveItem) => void;
  onRequestMove: (item: DriveItem) => void;
  onRequestRename: (item: DriveItem) => void;
  onRequestTrash: (item: DriveItem) => void;
  onResetFilters: () => void;
  onCreateFolder: () => void;
}

function ItemTypeIcon({ mimeType }: { mimeType: string }) {
  const kind = classifyMimeType(mimeType);
  switch (kind) {
    case 'folder':
      return <Folder className="w-4 h-4 text-blue-700 shrink-0" />;
    case 'document':
      return <FileText className="w-4 h-4 text-slate-600 shrink-0" />;
    case 'spreadsheet':
      return <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />;
    case 'presentation':
      return <Presentation className="w-4 h-4 text-amber-700 shrink-0" />;
    case 'pdf':
      return <FileText className="w-4 h-4 text-red-600 shrink-0" />;
    case 'media':
      return <FileImage className="w-4 h-4 text-indigo-600 shrink-0" />;
    default:
      return <FileIcon className="w-4 h-4 text-slate-500 shrink-0" />;
  }
}

export const FileTable: React.FC<FileTableProps> = ({
  items,
  isLoading,
  viewMode,
  showAccountTag,
  selectedIds,
  activeDetailId,
  categories,
  folderMap,
  hasActiveFilters,
  onToggleSelect,
  onToggleSelectAll,
  onOpenFolder,
  onInspectItem,
  onAssignCategory,
  onToggleStar,
  onRequestMove,
  onRequestRename,
  onRequestTrash,
  onResetFilters,
  onCreateFolder,
}) => {
  const categoryColorMap = new Map(categories.map((c) => [c.name, c.accentHex]));

  if (isLoading && items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-[44px] px-4 flex items-center justify-between gap-4 animate-pulse"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-4 h-4 rounded bg-slate-200" />
              <div className="w-4 h-4 rounded bg-slate-200" />
              <div className="h-3.5 w-48 rounded bg-slate-200" />
            </div>
            <div className="hidden md:block h-3.5 w-24 rounded bg-slate-100" />
            <div className="hidden sm:block h-3.5 w-20 rounded bg-slate-100" />
            <div className="h-3.5 w-16 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg px-6 py-16 text-center">
        <p className="font-display text-base font-semibold text-slate-900">
          {hasActiveFilters ? 'No items match your current filters' : 'This folder is empty'}
        </p>
        <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">
          {hasActiveFilters
            ? 'Try adjusting your search keywords, file type, or category selection.'
            : 'Create a new folder or switch to All Items to organize files across your Drive.'}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
            >
              Reset Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={onCreateFolder}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors inline-flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Folder</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const allSelected =
    items.length > 0 &&
    items.every((item) => selectedIds.has(getFolderKey(item.accountId, item.id)));

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((item) => {
          const itemKey = getFolderKey(item.accountId, item.id);
          const folder = isFolder(item);
          const effectiveMime = getEffectiveMimeType(item);
          const category = getItemCategory(item);
          const catHex = category ? categoryColorMap.get(category) || '#475569' : null;
          const isSelected = selectedIds.has(itemKey);
          const isInspected = activeDetailId === itemKey;

          return (
            <div
              key={itemKey}
              className={`bg-white border rounded-lg p-4 flex flex-col justify-between gap-3 transition-colors ${
                isSelected || isInspected
                  ? 'border-blue-600 bg-blue-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(itemKey)}
                    aria-label={`Select ${item.name}`}
                    className="mt-1 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                  />
                  <div className="min-w-0">
                    {folder ? (
                      <button
                        type="button"
                        onClick={() => onOpenFolder(item)}
                        className="flex items-center gap-2 text-left group min-w-0"
                      >
                        <ItemTypeIcon mimeType={effectiveMime} />
                        <span className="text-sm font-medium text-slate-900 group-hover:text-blue-700 truncate">
                          {item.name}
                        </span>
                      </button>
                    ) : item.webViewLink ? (
                      <a
                        href={item.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-left group min-w-0"
                      >
                        <ItemTypeIcon mimeType={effectiveMime} />
                        <span className="text-sm font-medium text-slate-900 group-hover:text-blue-700 truncate">
                          {item.name}
                        </span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onInspectItem(item)}
                        className="flex items-center gap-2 text-left group min-w-0"
                      >
                        <ItemTypeIcon mimeType={effectiveMime} />
                        <span className="text-sm font-medium text-slate-900 group-hover:text-blue-700 truncate">
                          {item.name}
                        </span>
                      </button>
                    )}
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <span>{getTypeLabel(effectiveMime)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">
                        {getParentLocationLabel(item, folderMap)}
                      </span>
                      {showAccountTag && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate text-slate-400">{item.accountEmail}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleStar(item)}
                  className={`p-1 rounded transition-colors shrink-0 ${
                    item.starred
                      ? 'text-amber-500 hover:text-amber-600'
                      : 'text-slate-300 hover:text-slate-500'
                  }`}
                  aria-label={item.starred ? 'Remove star' : 'Add star'}
                >
                  <Star className="w-4 h-4" fill={item.starred ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {catHex && (
                    <span
                      className="w-2 h-2 rounded-sm shrink-0"
                      style={{ backgroundColor: catHex }}
                    />
                  )}
                  <select
                    value={category || ''}
                    onChange={(e) =>
                      onAssignCategory(item, e.target.value ? e.target.value : null)
                    }
                    aria-label={`Category for ${item.name}`}
                    className="text-xs text-slate-700 bg-transparent hover:text-slate-900 focus:outline-none cursor-pointer truncate max-w-[130px]"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onRequestMove(item)}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Move to folder"
                    aria-label={`Move ${item.name}`}
                  >
                    <FolderInput className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onInspectItem(item)}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Details"
                    aria-label={`Details for ${item.name}`}
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  {item.webViewLink && (
                    <a
                      href={item.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-50"
                      title="Open in Google Drive"
                      aria-label={`Open ${item.name} in Google Drive`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
              <th className="w-10 py-2.5 pl-4 pr-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all visible items"
                  className="rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                />
              </th>
              <th className="py-2.5 px-3">Name</th>
              <th className="py-2.5 px-3 w-40">Category</th>
              <th className="py-2.5 px-3 hidden md:table-cell w-36">Location</th>
              <th className="py-2.5 px-3 hidden lg:table-cell w-28">Type</th>
              <th className="py-2.5 px-3 hidden sm:table-cell w-32 text-right">Modified</th>
              <th className="py-2.5 px-3 hidden xl:table-cell w-24 text-right">Size</th>
              <th className="py-2.5 pl-2 pr-4 w-36 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {items.map((item) => {
              const itemKey = getFolderKey(item.accountId, item.id);
              const folder = isFolder(item);
              const effectiveMime = getEffectiveMimeType(item);
              const category = getItemCategory(item);
              const catHex = category ? categoryColorMap.get(category) || '#475569' : null;
              const isSelected = selectedIds.has(itemKey);
              const isInspected = activeDetailId === itemKey;

              return (
                <tr
                  key={itemKey}
                  className={`h-[44px] transition-colors group ${
                    isSelected
                      ? 'bg-blue-50/40'
                      : isInspected
                      ? 'bg-slate-50'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="pl-4 pr-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(itemKey)}
                      aria-label={`Select ${item.name}`}
                      className="rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                    />
                  </td>

                  <td className="px-3 max-w-[260px] sm:max-w-[340px]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ItemTypeIcon mimeType={effectiveMime} />
                      {folder ? (
                        <button
                          type="button"
                          onClick={() => onOpenFolder(item)}
                          className="text-left font-medium text-slate-900 hover:text-blue-700 truncate transition-colors"
                        >
                          {item.name}
                        </button>
                      ) : item.webViewLink ? (
                        <a
                          href={item.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-left font-medium text-slate-900 hover:text-blue-700 truncate transition-colors"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onInspectItem(item)}
                          className="text-left font-medium text-slate-900 hover:text-blue-700 truncate transition-colors"
                        >
                          {item.name}
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="px-3">
                    <div className="flex items-center gap-1.5">
                      {catHex ? (
                        <span
                          className="w-2 h-2 rounded-sm shrink-0"
                          style={{ backgroundColor: catHex }}
                        />
                      ) : (
                        <span className="w-2 h-2 rounded-sm bg-slate-200 shrink-0" />
                      )}
                      <select
                        value={category || ''}
                        onChange={(e) =>
                          onAssignCategory(item, e.target.value ? e.target.value : null)
                        }
                        aria-label={`Category for ${item.name}`}
                        className={`text-xs bg-transparent focus:outline-none cursor-pointer truncate max-w-[120px] ${
                          category ? 'text-slate-800 font-medium' : 'text-slate-400'
                        }`}
                      >
                        <option value="">Uncategorized</option>
                        {categories.map((cat) => (
                          <option key={cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>

                  <td className="px-3 hidden md:table-cell text-xs text-slate-500 max-w-[180px]">
                    <div className="truncate">
                      {getParentLocationLabel(item, folderMap)}
                    </div>
                    {showAccountTag && (
                      <div className="text-[11px] text-slate-400 truncate">
                        {item.accountEmail}
                      </div>
                    )}
                  </td>

                  <td className="px-3 hidden lg:table-cell text-xs text-slate-500 whitespace-nowrap">
                    {getTypeLabel(effectiveMime)}
                  </td>

                  <td className="px-3 hidden sm:table-cell text-xs text-slate-500 text-right font-mono tabular-nums whitespace-nowrap">
                    {formatDriveDate(item.modifiedTime)}
                  </td>

                  <td className="px-3 hidden xl:table-cell text-xs text-slate-500 text-right font-mono tabular-nums whitespace-nowrap">
                    {folder ? '—' : formatBytes(item.size)}
                  </td>

                  <td className="pl-2 pr-4 text-right">
                    <div className="inline-flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        onClick={() => onInspectItem(item)}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Item details"
                        aria-label={`Details for ${item.name}`}
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStar(item)}
                        className={`p-1.5 rounded transition-colors ${
                          item.starred
                            ? 'text-amber-500 hover:text-amber-600'
                            : 'text-slate-300 hover:text-slate-600'
                        }`}
                        title={item.starred ? 'Unstar' : 'Star'}
                        aria-label={item.starred ? `Unstar ${item.name}` : `Star ${item.name}`}
                      >
                        <Star
                          className="w-3.5 h-3.5"
                          fill={item.starred ? 'currentColor' : 'none'}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => onRequestMove(item)}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Move to folder"
                        aria-label={`Move ${item.name}`}
                      >
                        <FolderInput className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onRequestRename(item)}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Rename"
                        aria-label={`Rename ${item.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onRequestTrash(item)}
                        className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Move to Trash"
                        aria-label={`Move ${item.name} to Trash`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {item.webViewLink && (
                        <a
                          href={item.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Open in Google Drive"
                          aria-label={`Open ${item.name} in Google Drive`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
