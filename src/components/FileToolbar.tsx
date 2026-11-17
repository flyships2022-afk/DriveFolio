import React, { useRef, useEffect } from 'react';
import {
  Search,
  X,
  LayoutList,
  LayoutGrid,
  FolderInput,
  Tag,
  Trash2,
  ArrowUpDown,
  FolderTree,
  ListFilter,
} from 'lucide-react';
import {
  AutoFileType,
  CategoryDefinition,
  SortDirection,
  SortField,
  TimeFilter,
  ViewMode,
} from '../types/drive';

interface FileToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  typeFilter: AutoFileType;
  onTypeFilterChange: (value: AutoFileType) => void;
  timeFilter: TimeFilter;
  onTimeFilterChange: (value: TimeFilter) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  flatView: boolean;
  onFlatViewChange: (flat: boolean) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  selectedCount: number;
  categories: CategoryDefinition[];
  onBulkAssignCategory: (category: string | null) => void;
  onBulkMove: () => void;
  onBulkTrash: () => void;
  onClearSelection: () => void;
}

const TYPE_OPTIONS: Array<{ value: AutoFileType; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: 'folder', label: 'Folders' },
  { value: 'document', label: 'Docs' },
  { value: 'spreadsheet', label: 'Sheets' },
  { value: 'presentation', label: 'Slides' },
  { value: 'pdf', label: 'PDFs' },
  { value: 'media', label: 'Media' },
  { value: 'other', label: 'Other' },
];

export const FileToolbar: React.FC<FileToolbarProps> = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  timeFilter,
  onTimeFilterChange,
  sortField,
  sortDirection,
  onSortChange,
  viewMode,
  onViewModeChange,
  flatView,
  onFlatViewChange,
  hasActiveFilters,
  onResetFilters,
  selectedCount,
  categories,
  onBulkAssignCategory,
  onBulkMove,
  onBulkTrash,
  onClearSelection,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-3">
      {/* Row 1: Search, Sort, Browse Mode, View Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files, folders, categories, or owners (press /)"
            className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-md">
            <button
              type="button"
              onClick={() => onFlatViewChange(false)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                !flatView
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Browse inside current folder"
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Folders</span>
            </button>
            <button
              type="button"
              onClick={() => onFlatViewChange(true)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                flatView
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Show all matching items across Drive"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>All Items</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={`${sortField}:${sortDirection}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split(':') as [
                  SortField,
                  SortDirection,
                ];
                onSortChange(field, dir);
              }}
              aria-label="Sort items"
              className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="modifiedTime:desc">Modified (Newest)</option>
              <option value="modifiedTime:asc">Modified (Oldest)</option>
              <option value="name:asc">Name (A–Z)</option>
              <option value="name:desc">Name (Z–A)</option>
              <option value="size:desc">Size (Largest)</option>
              <option value="type:asc">Type</option>
            </select>
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-md">
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              aria-label="List view"
              title="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Segmented Type Filters & Modified Timeframe */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-md overflow-x-auto max-w-full">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onTypeFilterChange(opt.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                typeFilter === opt.value
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeFilter}
            onChange={(e) => onTimeFilterChange(e.target.value as TimeFilter)}
            aria-label="Filter by modified date"
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
          >
            <option value="any">Modified: Any time</option>
            <option value="24h">Modified: Last 24 hours</option>
            <option value="7d">Modified: Last 7 days</option>
            <option value="30d">Modified: Last 30 days</option>
            <option value="90d">Modified: Last 90 days</option>
            <option value="1y+">Modified: Older than 1 year</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Row 3: Contextual Bulk Action Bar */}
      {selectedCount > 0 && (
        <div className="px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-blue-900 font-mono tabular-nums">
              {selectedCount} selected
            </span>
            <button
              type="button"
              onClick={onClearSelection}
              className="text-xs text-blue-700 hover:text-blue-900 underline underline-offset-2 whitespace-nowrap shrink-0"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white border border-blue-200 rounded-md px-2.5 py-1">
              <Tag className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <select
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__clear__') {
                    onBulkAssignCategory(null);
                  } else if (val) {
                    onBulkAssignCategory(val);
                  }
                }}
                aria-label="Assign category to selected items"
                className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="" disabled>
                  Assign Category...
                </option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
                <option value="__clear__">Remove Category</option>
              </select>
            </div>

            <button
              type="button"
              onClick={onBulkMove}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span>Move to Folder</span>
            </button>

            <button
              type="button"
              onClick={onBulkTrash}
              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-md hover:bg-red-50 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Move to Trash</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
