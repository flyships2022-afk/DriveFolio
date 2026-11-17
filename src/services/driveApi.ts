import { AutoFileType, DriveItem, DriveStorageQuota } from '../types/drive';
import { getAccessToken, clearAccessToken } from './auth';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_ABOUT_URL =
  'https://www.googleapis.com/drive/v3/about?fields=storageQuota,user(displayName,emailAddress,photoLink)';

export class DriveAuthError extends Error {
  accountId?: string;
  constructor(
    message = 'Your Google Drive session has expired. Please reconnect your account.',
    accountId?: string
  ) {
    super(message);
    this.name = 'DriveAuthError';
    this.accountId = accountId;
  }
}

export class DriveApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'DriveApiError';
    this.status = status;
  }
}

async function driveFetch<T>(
  url: string,
  accountId: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken(accountId);
  if (!token) {
    throw new DriveAuthError(
      `Session expired for ${accountId}. Please reconnect this account.`,
      accountId
    );
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...init, headers });

  if (response.status === 401) {
    clearAccessToken(accountId);
    throw new DriveAuthError(
      `Session expired for ${accountId}. Please reconnect this account.`,
      accountId
    );
  }

  if (!response.ok) {
    let errorMessage = `Google Drive request failed (${response.status})`;
    try {
      const errBody = await response.json();
      if (errBody?.error?.message) {
        errorMessage = errBody.error.message;
      }
    } catch {
      // Ignore parse failures on non-JSON error responses
    }
    throw new DriveApiError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

const FILE_FIELDS =
  'nextPageToken,files(id,name,mimeType,parents,size,createdTime,modifiedTime,starred,trashed,webViewLink,iconLink,thumbnailLink,owners(displayName,emailAddress,photoLink),description,shortcutDetails(targetId,targetMimeType),appProperties)';

export interface ListFilesResult {
  files: DriveItem[];
  hasMore: boolean;
}

export interface DriveAboutResponse {
  storageQuota?: DriveStorageQuota;
  user?: {
    displayName?: string;
    emailAddress?: string;
    photoLink?: string;
  };
}

export async function fetchDriveAbout(
  accountId: string
): Promise<DriveAboutResponse> {
  return driveFetch<DriveAboutResponse>(DRIVE_ABOUT_URL, accountId);
}

function tagItemsWithAccount(
  rawFiles: Omit<DriveItem, 'accountId' | 'accountEmail'>[],
  accountId: string,
  accountEmail: string
): DriveItem[] {
  return rawFiles.map((f) => ({
    ...f,
    accountId,
    accountEmail,
  }));
}

async function listByDriveQuery(
  accountId: string,
  accountEmail: string,
  q: string,
  maxPages = 10,
  onBatchLoaded?: (batch: DriveItem[], totalSoFar: number) => void,
  signal?: AbortSignal
): Promise<ListFilesResult> {
  const allFiles: DriveItem[] = [];
  let pageToken: string | undefined;
  let pageCount = 0;

  do {
    if (signal?.aborted) break;

    const params = new URLSearchParams({
      q,
      pageSize: '1000',
      fields: FILE_FIELDS,
      orderBy: 'modifiedTime desc',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const data = await driveFetch<{
      files?: Omit<DriveItem, 'accountId' | 'accountEmail'>[];
      nextPageToken?: string;
    }>(`${DRIVE_API_BASE}?${params.toString()}`, accountId, { signal });

    if (data.files && data.files.length > 0) {
      const tagged = tagItemsWithAccount(data.files, accountId, accountEmail);
      allFiles.push(...tagged);
      if (onBatchLoaded) {
        onBatchLoaded(tagged, allFiles.length);
      }
    }

    pageToken = data.nextPageToken;
    pageCount += 1;
  } while (pageToken && pageCount < maxPages);

  return {
    files: allFiles,
    hasMore: Boolean(pageToken),
  };
}

export async function listAllDriveItems(
  accountId: string,
  accountEmail: string,
  maxPages = 25,
  onBatchLoaded?: (batch: DriveItem[], totalSoFar: number) => void,
  signal?: AbortSignal
): Promise<ListFilesResult> {
  return listByDriveQuery(
    accountId,
    accountEmail,
    'trashed = false',
    maxPages,
    onBatchLoaded,
    signal
  );
}

export async function listFolderChildren(
  accountId: string,
  accountEmail: string,
  folderId: string
): Promise<DriveItem[]> {
  const escapedId = folderId.replace(/'/g, "\\'");
  const result = await listByDriveQuery(
    accountId,
    accountEmail,
    `'${escapedId}' in parents and trashed = false`,
    10
  );
  return result.files;
}

export async function listDriveItemsByType(
  accountId: string,
  accountEmail: string,
  type: AutoFileType
): Promise<DriveItem[]> {
  let typeClause = '';
  switch (type) {
    case 'folder':
      typeClause = "mimeType = 'application/vnd.google-apps.folder'";
      break;
    case 'document':
      typeClause =
        "(mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/msword' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType = 'text/plain' or mimeType = 'text/markdown' or mimeType = 'application/rtf')";
      break;
    case 'spreadsheet':
      typeClause =
        "(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.ms-excel' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType = 'text/csv')";
      break;
    case 'presentation':
      typeClause =
        "(mimeType = 'application/vnd.google-apps.presentation' or mimeType = 'application/vnd.ms-powerpoint' or mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation')";
      break;
    case 'pdf':
      typeClause = "mimeType = 'application/pdf'";
      break;
    case 'media':
      typeClause =
        "(mimeType contains 'image/' or mimeType contains 'video/' or mimeType contains 'audio/' or mimeType = 'application/vnd.google-apps.photo' or mimeType = 'application/vnd.google-apps.video' or mimeType = 'application/vnd.google-apps.audio')";
      break;
    default:
      return [];
  }

  const result = await listByDriveQuery(
    accountId,
    accountEmail,
    `${typeClause} and trashed = false`,
    5
  );
  return result.files;
}

export async function searchDriveItems(
  accountId: string,
  accountEmail: string,
  queryText: string
): Promise<DriveItem[]> {
  const clean = queryText.trim().replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  if (!clean) return [];
  const result = await listByDriveQuery(
    accountId,
    accountEmail,
    `name contains '${clean}' and trashed = false`,
    5
  );
  return result.files;
}

export async function createDriveFolder(
  accountId: string,
  accountEmail: string,
  name: string,
  parentId?: string | null,
  category?: string
): Promise<DriveItem> {
  const body: Record<string, unknown> = {
    name: name.trim(),
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentId && parentId !== 'root') {
    body.parents = [parentId];
  }

  if (category) {
    body.appProperties = { category };
  }

  const params = new URLSearchParams({
    fields:
      'id,name,mimeType,parents,size,createdTime,modifiedTime,starred,trashed,webViewLink,iconLink,owners(displayName,emailAddress,photoLink),appProperties',
    supportsAllDrives: 'true',
  });

  const created = await driveFetch<Omit<DriveItem, 'accountId' | 'accountEmail'>>(
    `${DRIVE_API_BASE}?${params.toString()}`,
    accountId,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
  return { ...created, accountId, accountEmail };
}

export async function updateItemCategory(
  accountId: string,
  fileId: string,
  category: string | null
): Promise<Partial<DriveItem>> {
  const params = new URLSearchParams({
    fields: 'id,appProperties,modifiedTime',
    supportsAllDrives: 'true',
  });

  return driveFetch<Partial<DriveItem>>(
    `${DRIVE_API_BASE}/${fileId}?${params.toString()}`,
    accountId,
    {
      method: 'PATCH',
      body: JSON.stringify({
        appProperties: {
          category: category || null,
        },
      }),
    }
  );
}

export async function moveDriveItem(
  accountId: string,
  fileId: string,
  currentParents: string[] | undefined,
  targetFolderId: string
): Promise<Partial<DriveItem>> {
  const params = new URLSearchParams({
    addParents: targetFolderId,
    fields: 'id,parents,modifiedTime',
    supportsAllDrives: 'true',
  });

  if (currentParents && currentParents.length > 0) {
    params.set('removeParents', currentParents.join(','));
  }

  return driveFetch<Partial<DriveItem>>(
    `${DRIVE_API_BASE}/${fileId}?${params.toString()}`,
    accountId,
    {
      method: 'PATCH',
      body: JSON.stringify({}),
    }
  );
}

export async function renameDriveItem(
  accountId: string,
  fileId: string,
  newName: string
): Promise<Partial<DriveItem>> {
  const params = new URLSearchParams({
    fields: 'id,name,modifiedTime',
    supportsAllDrives: 'true',
  });

  return driveFetch<Partial<DriveItem>>(
    `${DRIVE_API_BASE}/${fileId}?${params.toString()}`,
    accountId,
    {
      method: 'PATCH',
      body: JSON.stringify({ name: newName.trim() }),
    }
  );
}

export async function setDriveItemStarred(
  accountId: string,
  fileId: string,
  starred: boolean
): Promise<Partial<DriveItem>> {
  const params = new URLSearchParams({
    fields: 'id,starred,modifiedTime',
    supportsAllDrives: 'true',
  });

  return driveFetch<Partial<DriveItem>>(
    `${DRIVE_API_BASE}/${fileId}?${params.toString()}`,
    accountId,
    {
      method: 'PATCH',
      body: JSON.stringify({ starred }),
    }
  );
}

export async function trashDriveItem(
  accountId: string,
  fileId: string
): Promise<Partial<DriveItem>> {
  const params = new URLSearchParams({
    fields: 'id,trashed',
    supportsAllDrives: 'true',
  });

  return driveFetch<Partial<DriveItem>>(
    `${DRIVE_API_BASE}/${fileId}?${params.toString()}`,
    accountId,
    {
      method: 'PATCH',
      body: JSON.stringify({ trashed: true }),
    }
  );
}
