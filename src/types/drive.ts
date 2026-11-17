export interface DriveOwner {
  displayName?: string;
  emailAddress?: string;
  photoLink?: string;
}

export interface DriveStorageQuota {
  limit?: string;
  usage: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
}

export interface ConnectedAccount {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  storageQuota?: DriveStorageQuota | null;
  isLoading?: boolean;
  hasMoreItems?: boolean;
  error?: string | null;
}

export interface DriveItem {
  id: string;
  accountId: string;
  accountEmail: string;
  name: string;
  mimeType: string;
  parents?: string[];
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  starred?: boolean;
  trashed?: boolean;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  owners?: DriveOwner[];
  description?: string;
  shortcutDetails?: {
    targetId?: string;
    targetMimeType?: string;
  };
  appProperties?: {
    category?: string;
    [key: string]: string | undefined;
  };
}

export type AutoFileType =
  | 'all'
  | 'folder'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'media'
  | 'other';

export type TimeFilter = 'any' | '24h' | '7d' | '30d' | '90d' | '1y+';

export type SortField = 'name' | 'modifiedTime' | 'size' | 'type';
export type SortDirection = 'asc' | 'desc';

export type ViewMode = 'list' | 'grid';

export type SidebarScope =
  | { type: 'all' }
  | { type: 'recent' }
  | { type: 'folders' }
  | { type: 'starred' }
  | { type: 'uncategorized' }
  | { type: 'category'; category: string };

export interface CategoryDefinition {
  name: string;
  accentHex: string;
}

export interface PendingConfirmation {
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'primary' | 'danger';
  itemsPreview?: string[];
  onConfirm: () => Promise<void>;
}
