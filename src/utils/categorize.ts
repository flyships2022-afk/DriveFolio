import { AutoFileType, CategoryDefinition, DriveItem, TimeFilter } from '../types/drive';

export const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { name: 'Work', accentHex: '#1D4ED8' },
  { name: 'Projects', accentHex: '#0F766E' },
  { name: 'Finance', accentHex: '#B45309' },
  { name: 'Personal', accentHex: '#4338CA' },
  { name: 'Reference', accentHex: '#475569' },
  { name: 'Archive', accentHex: '#64748B' },
];

export const CATEGORY_ACCENT_SWATCHES = [
  '#1D4ED8',
  '#0F766E',
  '#B45309',
  '#4338CA',
  '#BE123C',
  '#0369A1',
  '#15803D',
  '#475569',
];

export const SHORTCUT_MIME_TYPE = 'application/vnd.google-apps.shortcut';

export function getEffectiveMimeType(item: DriveItem): string {
  if (
    item.mimeType === SHORTCUT_MIME_TYPE &&
    item.shortcutDetails?.targetMimeType
  ) {
    return item.shortcutDetails.targetMimeType;
  }
  return item.mimeType;
}

export function isFolder(item: DriveItem): boolean {
  return getEffectiveMimeType(item) === FOLDER_MIME_TYPE;
}

export function classifyMimeType(mimeType: string): Exclude<AutoFileType, 'all'> {
  if (mimeType === FOLDER_MIME_TYPE) return 'folder';

  if (
    mimeType === 'application/vnd.google-apps.document' ||
    mimeType.includes('wordprocessingml') ||
    mimeType.includes('opendocument.text') ||
    mimeType === 'application/msword' ||
    mimeType === 'text/plain' ||
    mimeType === 'text/markdown' ||
    mimeType === 'application/rtf'
  ) {
    return 'document';
  }

  if (
    mimeType === 'application/vnd.google-apps.spreadsheet' ||
    mimeType.includes('spreadsheetml') ||
    mimeType.includes('opendocument.spreadsheet') ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'text/csv' ||
    mimeType === 'text/tab-separated-values'
  ) {
    return 'spreadsheet';
  }

  if (
    mimeType === 'application/vnd.google-apps.presentation' ||
    mimeType.includes('presentationml') ||
    mimeType.includes('opendocument.presentation') ||
    mimeType === 'application/vnd.ms-powerpoint'
  ) {
    return 'presentation';
  }

  if (mimeType === 'application/pdf') {
    return 'pdf';
  }

  if (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/') ||
    mimeType === 'application/vnd.google-apps.photo' ||
    mimeType === 'application/vnd.google-apps.video' ||
    mimeType === 'application/vnd.google-apps.audio'
  ) {
    return 'media';
  }

  return 'other';
}

export function getTypeLabel(mimeType: string): string {
  switch (mimeType) {
    case FOLDER_MIME_TYPE:
      return 'Folder';
    case 'application/vnd.google-apps.document':
      return 'Google Doc';
    case 'application/vnd.google-apps.spreadsheet':
      return 'Google Sheet';
    case 'application/vnd.google-apps.presentation':
      return 'Google Slides';
    case 'application/vnd.google-apps.form':
      return 'Google Form';
    case 'application/vnd.google-apps.drawing':
      return 'Google Drawing';
    case 'application/pdf':
      return 'PDF';
    default: {
      const cat = classifyMimeType(mimeType);
      if (cat === 'document') return 'Document';
      if (cat === 'spreadsheet') return 'Spreadsheet';
      if (cat === 'presentation') return 'Presentation';
      if (cat === 'media') {
        if (mimeType.startsWith('image/')) return 'Image';
        if (mimeType.startsWith('video/')) return 'Video';
        if (mimeType.startsWith('audio/')) return 'Audio';
        return 'Media';
      }
      if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('tar')) {
        return 'Archive';
      }
      if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('html')) {
        return 'Code';
      }
      return 'File';
    }
  }
}

export function getItemCategory(item: DriveItem): string | null {
  const cat = item.appProperties?.category?.trim();
  return cat ? cat : null;
}

export function formatBytes(sizeStr?: string): string {
  if (!sizeStr) return '—';
  const bytes = Number(sizeStr);
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value >= 10 || i === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`;
}

export function formatDriveDate(isoDate?: string): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getFolderKey(accountId: string, folderId: string): string {
  return `${accountId}:${folderId}`;
}

export function matchesTimeFilter(
  modifiedTime: string | undefined,
  filter: TimeFilter,
  nowMs: number = Date.now()
): boolean {
  if (filter === 'any') return true;
  if (!modifiedTime) return false;
  const modMs = new Date(modifiedTime).getTime();
  if (!Number.isFinite(modMs) || modMs <= 0) return false;
  const ageMs = nowMs - modMs;
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;
  if (filter === '24h') return ageMs <= 24 * hourMs;
  if (filter === '7d') return ageMs <= 7 * dayMs;
  if (filter === '30d') return ageMs <= 30 * dayMs;
  if (filter === '90d') return ageMs <= 90 * dayMs;
  if (filter === '1y+') return ageMs > 365 * dayMs;
  return true;
}

export function getParentLocationLabel(
  item: DriveItem,
  folderMap: Map<string, DriveItem>
): string {
  if (!item.parents || item.parents.length === 0) return 'My Drive';
  const parent = folderMap.get(getFolderKey(item.accountId, item.parents[0]));
  return parent ? parent.name : 'My Drive';
}

export function buildBreadcrumbs(
  currentFolder: { accountId: string; id: string } | null,
  folderMap: Map<string, DriveItem>
): Array<{ accountId: string | null; id: string | null; name: string }> {
  if (!currentFolder) {
    return [{ accountId: null, id: null, name: 'My Drive' }];
  }

  const trail: Array<{ accountId: string | null; id: string | null; name: string }> = [];
  const visited = new Set<string>();
  let cursor: string | null = currentFolder.id;

  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    const folder = folderMap.get(getFolderKey(currentFolder.accountId, cursor));
    if (!folder) break;
    trail.unshift({ accountId: folder.accountId, id: folder.id, name: folder.name });
    cursor = folder.parents && folder.parents.length > 0 ? folder.parents[0] : null;
  }

  return [{ accountId: null, id: null, name: 'My Drive' }, ...trail];
}

