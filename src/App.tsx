import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronRight,
  FolderPlus,
  LogOut,
  Menu,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import {
  AutoFileType,
  CategoryDefinition,
  ConnectedAccount,
  DriveItem,
  PendingConfirmation,
  SidebarScope,
  SortDirection,
  SortField,
  TimeFilter,
  ViewMode,
} from './types/drive';
import {
  clearAccessToken,
  googleSignIn,
  initAuth,
  logout,
} from './services/auth';
import {
  createDriveFolder,
  DriveAuthError,
  fetchDriveAbout,
  listAllDriveItems,
  listDriveItemsByType,
  listFolderChildren,
  moveDriveItem,
  renameDriveItem,
  searchDriveItems,
  setDriveItemStarred,
  trashDriveItem,
  updateItemCategory,
} from './services/driveApi';
import {
  buildBreadcrumbs,
  CATEGORY_ACCENT_SWATCHES,
  classifyMimeType,
  DEFAULT_CATEGORIES,
  getEffectiveMimeType,
  getFolderKey,
  getItemCategory,
  isFolder,
  matchesTimeFilter,
} from './utils/categorize';
import { AuthLanding } from './components/GoogleSignInButton';
import { Sidebar } from './components/Sidebar';
import { FileToolbar } from './components/FileToolbar';
import { FileTable } from './components/FileTable';
import { FileDetailsDrawer } from './components/FileDetailsDrawer';
import { ConfirmActionModal } from './components/ConfirmActionModal';
import { MoveFolderModal } from './components/MoveFolderModal';
import { NewFolderModal } from './components/NewFolderModal';
import { RenameModal } from './components/RenameModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { AccountAccessHelpModal } from './components/AccountAccessHelpModal';

const STORAGE_CATEGORIES_KEY = 'drivefolio_categories_v1';

function loadSavedCategories(): CategoryDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_CATEGORIES_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fallback to defaults
  }
  return DEFAULT_CATEGORIES;
}

function mergeDriveItems(
  existing: DriveItem[],
  incoming: DriveItem[]
): DriveItem[] {
  if (incoming.length === 0) return existing;
  const map = new Map<string, DriveItem>();
  for (const item of existing) {
    map.set(getFolderKey(item.accountId, item.id), item);
  }
  for (const item of incoming) {
    map.set(getFolderKey(item.accountId, item.id), item);
  }
  return Array.from(map.values());
}

export default function App() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [items, setItems] = useState<DriveItem[]>([]);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [categories, setCategories] = useState<CategoryDefinition[]>(loadSavedCategories);
  const [scope, setScope] = useState<SidebarScope>({ type: 'all' });
  const [currentFolder, setCurrentFolder] = useState<{
    accountId: string;
    id: string;
  } | null>(null);
  const [flatView, setFlatView] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AutoFileType>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('any');
  const [sortField, setSortField] = useState<SortField>('modifiedTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [inspectedItemKey, setInspectedItemKey] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmation | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [moveTargets, setMoveTargets] = useState<DriveItem[] | null>(null);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DriveItem | null>(null);
  const [accountHelpError, setAccountHelpError] = useState<string | null>(null);
  const [isAccountHelpOpen, setIsAccountHelpOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const syncControllersRef = useRef<Map<string, AbortController>>(new Map());

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(categories));
    } catch {
      // Ignore storage quota errors
    }
  }, [categories]);

  const syncDiscoveredCategories = useCallback((files: DriveItem[]) => {
    const discoveredNames = new Set<string>();
    for (const file of files) {
      const cat = getItemCategory(file);
      if (cat) discoveredNames.add(cat);
    }
    if (discoveredNames.size > 0) {
      setCategories((prev) => {
        const existing = new Set(prev.map((c) => c.name.toLowerCase()));
        const additions: CategoryDefinition[] = [];
        let swatchIdx = prev.length;
        for (const name of discoveredNames) {
          if (!existing.has(name.toLowerCase())) {
            additions.push({
              name,
              accentHex:
                CATEGORY_ACCENT_SWATCHES[swatchIdx % CATEGORY_ACCENT_SWATCHES.length],
            });
            swatchIdx += 1;
          }
        }
        return additions.length > 0 ? [...prev, ...additions] : prev;
      });
    }
  }, []);

  const syncAccount = useCallback(
    async (accountId: string, email: string) => {
      const existingCtrl = syncControllersRef.current.get(accountId);
      if (existingCtrl) {
        existingCtrl.abort();
      }
      const controller = new AbortController();
      syncControllersRef.current.set(accountId, controller);

      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId ? { ...acc, isLoading: true, error: null } : acc
        )
      );

      // Fetch storage quota via Drive about.get
      fetchDriveAbout(accountId)
        .then((about) => {
          if (controller.signal.aborted) return;
          setAccounts((prev) =>
            prev.map((acc) =>
              acc.id === accountId
                ? {
                    ...acc,
                    storageQuota: about.storageQuota || acc.storageQuota,
                    displayName: about.user?.displayName || acc.displayName,
                  }
                : acc
            )
          );
        })
        .catch(() => {
          // Non-fatal if about endpoint fails independently
        });

      let firstBatchForAccount = true;

      try {
        const result = await listAllDriveItems(
          accountId,
          email,
          25,
          (batch) => {
            if (controller.signal.aborted) return;
            setItems((prev) => {
              const base = firstBatchForAccount
                ? prev.filter((item) => item.accountId !== accountId)
                : prev;
              firstBatchForAccount = false;
              return mergeDriveItems(base, batch);
            });
            syncDiscoveredCategories(batch);
          },
          controller.signal
        );

        if (!controller.signal.aborted) {
          if (result.files.length === 0 && firstBatchForAccount) {
            setItems((prev) => prev.filter((item) => item.accountId !== accountId));
          }
          setAccounts((prev) =>
            prev.map((acc) =>
              acc.id === accountId
                ? { ...acc, isLoading: false, hasMoreItems: result.hasMore }
                : acc
            )
          );
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : 'Unable to sync Google Drive.';
        if (err instanceof DriveAuthError) {
          setAccounts((prev) =>
            prev.map((acc) =>
              acc.id === accountId
                ? { ...acc, isLoading: false, error: message }
                : acc
            )
          );
          setDriveError(message);
        } else {
          setAccounts((prev) =>
            prev.map((acc) =>
              acc.id === accountId
                ? { ...acc, isLoading: false, error: message }
                : acc
            )
          );
          setDriveError(message);
        }
      }
    },
    [syncDiscoveredCategories]
  );

  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, accountId) => {
        const email = authedUser.email || accountId;
        const displayName = authedUser.displayName || email;
        setAccounts((prev) => {
          if (prev.some((a) => a.id === accountId)) return prev;
          return [
            ...prev,
            {
              id: accountId,
              email,
              displayName,
              photoURL: authedUser.photoURL,
              isLoading: true,
            },
          ];
        });
        setAuthError(null);
        syncAccount(accountId, email);
      },
      () => {
        setAccounts([]);
        setItems([]);
      }
    );
    return () => {
      unsubscribe();
      for (const ctrl of syncControllersRef.current.values()) {
        ctrl.abort();
      }
      syncControllersRef.current.clear();
    };
  }, [syncAccount]);

  const handleConnectAccount = async (forcePicker: boolean) => {
    setIsLoggingIn(true);
    setAuthError(null);
    setDriveError(null);
    try {
      const result = await googleSignIn(forcePicker);
      if (result) {
        const { accountId, email, displayName, photoURL } = result;
        setAccounts((prev) => {
          const exists = prev.some((a) => a.id === accountId);
          if (exists) {
            return prev.map((a) =>
              a.id === accountId
                ? { ...a, email, displayName, photoURL, error: null, isLoading: true }
                : a
            );
          }
          return [
            ...prev,
            { id: accountId, email, displayName, photoURL, isLoading: true },
          ];
        });
        await syncAccount(accountId, email);
        showToast(`Connected ${email}`);
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Google sign-in was cancelled or failed.';
      if (accounts.length === 0) {
        setAuthError(msg);
      } else {
        setAccountHelpError(msg);
        setIsAccountHelpOpen(true);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDisconnectAccount = (accountId: string) => {
    const ctrl = syncControllersRef.current.get(accountId);
    if (ctrl) {
      ctrl.abort();
      syncControllersRef.current.delete(accountId);
    }
    clearAccessToken(accountId);
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    setItems((prev) => prev.filter((i) => i.accountId !== accountId));
    if (selectedAccountId === accountId) {
      setSelectedAccountId('all');
    }
    if (currentFolder?.accountId === accountId) {
      setCurrentFolder(null);
    }
    setSelectedKeys(new Set());
    showToast(`Disconnected ${accountId}`);
  };

  const handleLogoutAll = async () => {
    for (const ctrl of syncControllersRef.current.values()) {
      ctrl.abort();
    }
    syncControllersRef.current.clear();
    await logout();
    setAccounts([]);
    setItems([]);
    setSelectedKeys(new Set());
    setInspectedItemKey(null);
    setCurrentFolder(null);
    setSelectedAccountId('all');
  };

  const handleRefreshAccounts = useCallback(() => {
    const targets =
      selectedAccountId === 'all'
        ? accounts
        : accounts.filter((a) => a.id === selectedAccountId);
    for (const acc of targets) {
      syncAccount(acc.id, acc.email);
    }
  }, [accounts, selectedAccountId, syncAccount]);

  const needsAuth = accounts.length === 0;
  const isLoadingAnyAccount = accounts.some((a) => a.isLoading);
  const hasMoreItems = accounts.some(
    (a) =>
      (selectedAccountId === 'all' || a.id === selectedAccountId) &&
      a.hasMoreItems
  );

  // Scope items by selected account (consolidated 'all' or individual account)
  const accountScopedItems = useMemo(() => {
    if (selectedAccountId === 'all') return items;
    return items.filter((item) => item.accountId === selectedAccountId);
  }, [items, selectedAccountId]);

  const accountItemCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of items) {
      map[item.accountId] = (map[item.accountId] || 0) + 1;
    }
    return map;
  }, [items]);

  const folderMap = useMemo(() => {
    const map = new Map<string, DriveItem>();
    for (const item of items) {
      if (isFolder(item)) {
        map.set(getFolderKey(item.accountId, item.id), item);
      }
    }
    return map;
  }, [items]);

  const allFolders = useMemo(
    () => items.filter((item) => isFolder(item)),
    [items]
  );

  const counts = useMemo(() => {
    let recent = 0;
    let folders = 0;
    let starred = 0;
    let uncategorized = 0;
    const byCategory: Record<string, number> = {};
    const nowMs = Date.now();

    for (const item of accountScopedItems) {
      if (matchesTimeFilter(item.modifiedTime, '24h', nowMs)) recent += 1;
      if (isFolder(item)) folders += 1;
      if (item.starred) starred += 1;
      const cat = getItemCategory(item);
      if (!cat) {
        uncategorized += 1;
      } else {
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      }
    }

    return {
      all: accountScopedItems.length,
      recent,
      folders,
      starred,
      uncategorized,
      byCategory,
    };
  }, [accountScopedItems]);

  const isFilteringGlobally =
    scope.type !== 'all' ||
    flatView ||
    searchQuery.trim().length > 0 ||
    typeFilter !== 'all' ||
    timeFilter !== 'any';

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const nowMs = Date.now();

    const filtered = accountScopedItems.filter((item) => {
      // 1. Sidebar Scope
      if (
        scope.type === 'recent' &&
        !matchesTimeFilter(item.modifiedTime, '24h', nowMs)
      ) {
        return false;
      }
      if (scope.type === 'folders' && !isFolder(item)) return false;
      if (scope.type === 'starred' && !item.starred) return false;
      if (scope.type === 'uncategorized' && getItemCategory(item) !== null)
        return false;
      if (scope.type === 'category' && getItemCategory(item) !== scope.category)
        return false;

      // 2. Folder Hierarchy scoping
      if (!isFilteringGlobally) {
        if (currentFolder === null) {
          const hasKnownParent = Boolean(
            item.parents &&
              item.parents.some((pid) =>
                folderMap.has(getFolderKey(item.accountId, pid))
              )
          );
          if (hasKnownParent) return false;
        } else {
          if (
            item.accountId !== currentFolder.accountId ||
            !item.parents ||
            !item.parents.includes(currentFolder.id)
          ) {
            return false;
          }
        }
      }

      // 3. MIME / Type filter
      if (typeFilter !== 'all') {
        if (classifyMimeType(getEffectiveMimeType(item)) !== typeFilter)
          return false;
      }

      // 4. Modified Timeframe filter
      if (timeFilter !== 'any') {
        if (!matchesTimeFilter(item.modifiedTime, timeFilter, nowMs))
          return false;
      }

      // 5. Search Query
      if (query) {
        const nameMatch = item.name.toLowerCase().includes(query);
        const catMatch = (getItemCategory(item) || '')
          .toLowerCase()
          .includes(query);
        const ownerMatch = (item.owners?.[0]?.displayName || '')
          .toLowerCase()
          .includes(query);
        const accountMatch = item.accountEmail.toLowerCase().includes(query);
        if (!nameMatch && !catMatch && !ownerMatch && !accountMatch)
          return false;
      }

      return true;
    });

    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const aFolder = isFolder(a);
      const bFolder = isFolder(b);
      if (sortField === 'name' || sortField === 'type') {
        if (aFolder !== bFolder) return aFolder ? -1 : 1;
      }

      if (sortField === 'name') {
        return a.name.localeCompare(b.name) * dir;
      }
      if (sortField === 'size') {
        const sizeA = Number(a.size || 0);
        const sizeB = Number(b.size || 0);
        return (sizeA - sizeB) * dir;
      }
      if (sortField === 'type') {
        return (
          getEffectiveMimeType(a).localeCompare(getEffectiveMimeType(b)) * dir
        );
      }
      const timeA = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
      const timeB = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
      return (timeA - timeB) * dir;
    });
  }, [
    accountScopedItems,
    scope,
    isFilteringGlobally,
    currentFolder,
    folderMap,
    typeFilter,
    timeFilter,
    searchQuery,
    sortField,
    sortDirection,
  ]);

  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(currentFolder, folderMap),
    [currentFolder, folderMap]
  );

  const inspectedItem = useMemo(() => {
    if (!inspectedItemKey) return null;
    return (
      items.find(
        (i) => getFolderKey(i.accountId, i.id) === inspectedItemKey
      ) || null
    );
  }, [items, inspectedItemKey]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    typeFilter !== 'all' ||
    timeFilter !== 'any' ||
    scope.type !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setTimeFilter('any');
    setScope({ type: 'all' });
    setCurrentFolder(null);
  };

  const handleSelectScope = (nextScope: SidebarScope) => {
    setScope(nextScope);
    setCurrentFolder(null);
    setSelectedKeys(new Set());
    if (nextScope.type === 'recent') {
      setTimeFilter('24h');
    } else if (timeFilter === '24h' && scope.type === 'recent') {
      setTimeFilter('any');
    }
  };

  const handleSelectAccount = (accountId: string | 'all') => {
    setSelectedAccountId(accountId);
    setCurrentFolder(null);
    setSelectedKeys(new Set());
  };

  // Fetch targeted items directly from Drive when filtering by type across active accounts
  useEffect(() => {
    if (needsAuth || typeFilter === 'all' || typeFilter === 'other') return;
    let cancelled = false;
    const targetAccounts =
      selectedAccountId === 'all'
        ? accounts
        : accounts.filter((a) => a.id === selectedAccountId);
    if (targetAccounts.length === 0) return;

    setIsLoadingFolder(true);
    Promise.allSettled(
      targetAccounts.map((acc) =>
        listDriveItemsByType(acc.id, acc.email, typeFilter)
      )
    )
      .then((results) => {
        if (cancelled) return;
        const merged: DriveItem[] = [];
        for (const res of results) {
          if (res.status === 'fulfilled') {
            merged.push(...res.value);
          }
        }
        if (merged.length > 0) {
          setItems((prev) => mergeDriveItems(prev, merged));
          syncDiscoveredCategories(merged);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingFolder(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    needsAuth,
    typeFilter,
    selectedAccountId,
    accounts,
    syncDiscoveredCategories,
  ]);

  // Fetch targeted search results directly from Drive when user searches
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (needsAuth || trimmed.length < 2) return;
    const targetAccounts =
      selectedAccountId === 'all'
        ? accounts
        : accounts.filter((a) => a.id === selectedAccountId);
    if (targetAccounts.length === 0) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      Promise.allSettled(
        targetAccounts.map((acc) =>
          searchDriveItems(acc.id, acc.email, trimmed)
        )
      ).then((results) => {
        if (cancelled) return;
        const merged: DriveItem[] = [];
        for (const res of results) {
          if (res.status === 'fulfilled') {
            merged.push(...res.value);
          }
        }
        if (merged.length > 0) {
          setItems((prev) => mergeDriveItems(prev, merged));
          syncDiscoveredCategories(merged);
        }
      });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    needsAuth,
    searchQuery,
    selectedAccountId,
    accounts,
    syncDiscoveredCategories,
  ]);

  const handleOpenFolder = useCallback(
    async (folder: DriveItem) => {
      const targetId = folder.shortcutDetails?.targetId || folder.id;
      setScope({ type: 'all' });
      setFlatView(false);
      setSearchQuery('');
      setTypeFilter('all');
      setTimeFilter('any');
      setCurrentFolder({ accountId: folder.accountId, id: targetId });
      setSelectedKeys(new Set());

      setIsLoadingFolder(true);
      try {
        const children = await listFolderChildren(
          folder.accountId,
          folder.accountEmail,
          targetId
        );
        setItems((prev) => mergeDriveItems(prev, children));
        syncDiscoveredCategories(children);
      } catch (err) {
        if (err instanceof DriveAuthError) {
          setDriveError(err.message);
        } else {
          setDriveError(
            err instanceof Error
              ? err.message
              : 'Unable to load contents of this folder.'
          );
        }
      } finally {
        setIsLoadingFolder(false);
      }
    },
    [syncDiscoveredCategories]
  );

  const handleAddCategory = (name: string, accentHex: string) => {
    setCategories((prev) => {
      if (prev.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
        return prev;
      }
      return [...prev, { name, accentHex }];
    });
    showToast(`Added category "${name}"`);
  };

  const handleRemoveCategory = (name: string) => {
    setCategories((prev) => prev.filter((c) => c.name !== name));
    if (scope.type === 'category' && scope.category === name) {
      setScope({ type: 'all' });
    }
    showToast(`Removed category "${name}"`);
  };

  const executeConfirmedAction = async () => {
    if (!pendingConfirm) return;
    setIsExecutingAction(true);
    try {
      await pendingConfirm.onConfirm();
      setPendingConfirm(null);
    } catch (err) {
      setDriveError(
        err instanceof Error ? err.message : 'Google Drive action failed.'
      );
      setPendingConfirm(null);
    } finally {
      setIsExecutingAction(false);
    }
  };

  const requestAssignCategory = (targets: DriveItem[], category: string | null) => {
    if (targets.length === 0) return;
    const actionText = category
      ? `Assign category "${category}"`
      : 'Remove category';
    setPendingConfirm({
      title:
        targets.length === 1
          ? `${actionText} for "${targets[0].name}"?`
          : `${actionText} for ${targets.length} items?`,
      description: category
        ? `This will save the "${category}" category tag to ${targets.length} item(s) in Google Drive.`
        : `This will clear the category tag from ${targets.length} item(s) in Google Drive.`,
      confirmLabel: category ? 'Save Category' : 'Remove Category',
      variant: 'primary',
      itemsPreview: targets.map((t) => t.name),
      onConfirm: async () => {
        const updatedMap = new Map<string, Partial<DriveItem>>();
        for (const target of targets) {
          const updated = await updateItemCategory(
            target.accountId,
            target.id,
            category
          );
          updatedMap.set(getFolderKey(target.accountId, target.id), updated);
        }
        setItems((prev) =>
          prev.map((item) => {
            const updated = updatedMap.get(getFolderKey(item.accountId, item.id));
            if (!updated) return item;
            return {
              ...item,
              modifiedTime: updated.modifiedTime || item.modifiedTime,
              appProperties: {
                ...item.appProperties,
                category: category || '',
              },
            };
          })
        );
        setSelectedKeys(new Set());
        showToast(
          category
            ? `Categorized ${targets.length} item(s) as "${category}"`
            : `Cleared category on ${targets.length} item(s)`
        );
      },
    });
  };

  const requestToggleStar = (item: DriveItem) => {
    const nextStarred = !item.starred;
    setPendingConfirm({
      title: nextStarred ? `Star "${item.name}"?` : `Remove star from "${item.name}"?`,
      description: nextStarred
        ? `This will mark the item as starred in ${item.accountEmail}.`
        : `This will remove the star from this item in ${item.accountEmail}.`,
      confirmLabel: nextStarred ? 'Star Item' : 'Remove Star',
      variant: 'primary',
      onConfirm: async () => {
        const updated = await setDriveItemStarred(
          item.accountId,
          item.id,
          nextStarred
        );
        const key = getFolderKey(item.accountId, item.id);
        setItems((prev) =>
          prev.map((i) =>
            getFolderKey(i.accountId, i.id) === key
              ? {
                  ...i,
                  starred: updated.starred ?? nextStarred,
                  modifiedTime: updated.modifiedTime || i.modifiedTime,
                }
              : i
          )
        );
        showToast(nextStarred ? `Starred "${item.name}"` : `Unstarred "${item.name}"`);
      },
    });
  };

  const handleSelectMoveDestination = (
    targetFolderId: string,
    targetFolderName: string
  ) => {
    if (!moveTargets || moveTargets.length === 0) return;
    const targets = [...moveTargets];
    setMoveTargets(null);

    setPendingConfirm({
      title: `Move ${targets.length} ${targets.length === 1 ? 'item' : 'items'} to "${targetFolderName}"?`,
      description: `The selected item(s) will be moved into "${targetFolderName}" in ${targets[0].accountEmail}.`,
      confirmLabel: 'Move Items',
      variant: 'primary',
      itemsPreview: targets.map((t) => t.name),
      onConfirm: async () => {
        const updatedMap = new Map<string, Partial<DriveItem>>();
        for (const target of targets) {
          const updated = await moveDriveItem(
            target.accountId,
            target.id,
            target.parents,
            targetFolderId
          );
          updatedMap.set(getFolderKey(target.accountId, target.id), updated);
        }
        setItems((prev) =>
          prev.map((item) => {
            const updated = updatedMap.get(getFolderKey(item.accountId, item.id));
            if (!updated) return item;
            return {
              ...item,
              parents: updated.parents || [targetFolderId],
              modifiedTime: updated.modifiedTime || item.modifiedTime,
            };
          })
        );
        setSelectedKeys(new Set());
        showToast(`Moved ${targets.length} item(s) to "${targetFolderName}"`);
      },
    });
  };

  const handleCreateFolderSubmit = (
    name: string,
    category: string,
    targetAccountId: string
  ) => {
    setIsNewFolderOpen(false);
    const acc = accounts.find((a) => a.id === targetAccountId) || accounts[0];
    if (!acc) return;

    const parentName = breadcrumbs[breadcrumbs.length - 1]?.name || 'My Drive';
    const parentId =
      currentFolder && currentFolder.accountId === acc.id
        ? currentFolder.id
        : null;

    setPendingConfirm({
      title: `Create folder "${name}"?`,
      description: category
        ? `A new folder named "${name}" will be created in "${parentName}" (${acc.email}) with category "${category}".`
        : `A new folder named "${name}" will be created in "${parentName}" (${acc.email}).`,
      confirmLabel: 'Create Folder',
      variant: 'primary',
      onConfirm: async () => {
        const created = await createDriveFolder(
          acc.id,
          acc.email,
          name,
          parentId,
          category || undefined
        );
        setItems((prev) => [created, ...prev]);
        showToast(`Created folder "${created.name}"`);
      },
    });
  };

  const handleRenameSubmit = (item: DriveItem, newName: string) => {
    setRenameTarget(null);
    setPendingConfirm({
      title: `Rename "${item.name}"?`,
      description: `This item will be renamed to "${newName}" in ${item.accountEmail}.`,
      confirmLabel: 'Rename',
      variant: 'primary',
      onConfirm: async () => {
        const updated = await renameDriveItem(item.accountId, item.id, newName);
        const key = getFolderKey(item.accountId, item.id);
        setItems((prev) =>
          prev.map((i) =>
            getFolderKey(i.accountId, i.id) === key
              ? {
                  ...i,
                  name: updated.name || newName,
                  modifiedTime: updated.modifiedTime || i.modifiedTime,
                }
              : i
          )
        );
        showToast(`Renamed to "${newName}"`);
      },
    });
  };

  const requestTrashItems = (targets: DriveItem[]) => {
    if (targets.length === 0) return;
    setPendingConfirm({
      title:
        targets.length === 1
          ? `Move "${targets[0].name}" to Trash?`
          : `Move ${targets.length} items to Trash?`,
      description:
        'These items will be moved to Google Drive Trash. You can restore them from Google Drive Trash if needed.',
      confirmLabel: 'Move to Trash',
      variant: 'danger',
      itemsPreview: targets.map((t) => t.name),
      onConfirm: async () => {
        const trashedKeys = new Set<string>();
        for (const target of targets) {
          await trashDriveItem(target.accountId, target.id);
          trashedKeys.add(getFolderKey(target.accountId, target.id));
        }
        setItems((prev) =>
          prev.filter(
            (item) => !trashedKeys.has(getFolderKey(item.accountId, item.id))
          )
        );
        setSelectedKeys(new Set());
        if (inspectedItemKey && trashedKeys.has(inspectedItemKey)) {
          setInspectedItemKey(null);
        }
        showToast(`Moved ${targets.length} item(s) to Trash`);
      },
    });
  };

  const toggleSelect = (compositeKey: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(compositeKey)) {
        next.delete(compositeKey);
      } else {
        next.add(compositeKey);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allSelected =
      visibleItems.length > 0 &&
      visibleItems.every((item) =>
        selectedKeys.has(getFolderKey(item.accountId, item.id))
      );
    if (allSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(
        new Set(visibleItems.map((item) => getFolderKey(item.accountId, item.id)))
      );
    }
  };

  if (needsAuth) {
    return (
      <AuthLanding
        onSignIn={() => handleConnectAccount(false)}
        isLoggingIn={isLoggingIn}
        errorMessage={authError}
      />
    );
  }

  const selectedItems = items.filter((item) =>
    selectedKeys.has(getFolderKey(item.accountId, item.id))
  );

  const scopeTitle = (() => {
    switch (scope.type) {
      case 'recent':
        return 'Recent (Last 24 Hours)';
      case 'folders':
        return 'All Folders';
      case 'starred':
        return 'Starred Items';
      case 'uncategorized':
        return 'Uncategorized Items';
      case 'category':
        return `Category: ${scope.category}`;
      default:
        return null;
    }
  })();

  const defaultFolderAccountId =
    currentFolder?.accountId ||
    (selectedAccountId !== 'all' ? selectedAccountId : accounts[0]?.id || '');

  return (
    <div className="h-screen flex bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onSelectAccount={handleSelectAccount}
        onAddAccount={() => handleConnectAccount(true)}
        onReconnectAccount={() => handleConnectAccount(true)}
        onDisconnectAccount={handleDisconnectAccount}
        accountItemCounts={accountItemCounts}
        scope={scope}
        onSelectScope={handleSelectScope}
        categories={categories}
        onAddCategory={handleAddCategory}
        onRemoveCategory={handleRemoveCategory}
        counts={counts}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Workspace Header */}
        <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {scopeTitle ? (
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="font-display text-base font-semibold text-slate-900 truncate">
                  {scopeTitle}
                </h1>
              </div>
            ) : (
              <nav
                aria-label="Folder breadcrumbs"
                className="flex items-center gap-1 text-sm min-w-0 overflow-x-auto"
              >
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={crumb.id || 'root'}>
                      {idx > 0 && (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (!crumb.id || !crumb.accountId) {
                            setCurrentFolder(null);
                          } else {
                            setCurrentFolder({
                              accountId: crumb.accountId,
                              id: crumb.id,
                            });
                          }
                          setFlatView(false);
                        }}
                        className={`px-1.5 py-1 rounded transition-colors whitespace-nowrap shrink-0 ${
                          isLast
                            ? 'font-semibold text-slate-900'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {crumb.name}
                      </button>
                    </React.Fragment>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />

            <button
              type="button"
              onClick={() => setIsNewFolderOpen(true)}
              className="px-3.5 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New Folder</span>
            </button>

            <button
              type="button"
              onClick={handleRefreshAccounts}
              disabled={isLoadingAnyAccount}
              className="p-2 text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="Refresh Google Drive"
              aria-label="Refresh Google Drive"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingAnyAccount ? 'animate-spin' : ''}`}
              />
            </button>

            <button
              type="button"
              onClick={handleLogoutAll}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              title="Sign out of all accounts"
              aria-label="Sign out of all accounts"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content + Inspector */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
            {driveError && (
              <div
                className="px-4 py-3 bg-red-50 border border-red-200 rounded-md flex items-start justify-between gap-3 text-sm text-red-800"
                role="alert"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="break-words">{driveError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDriveError(null)}
                  className="text-xs font-medium text-red-700 hover:underline whitespace-nowrap shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            <FileToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              timeFilter={scope.type === 'recent' ? '24h' : timeFilter}
              onTimeFilterChange={(val) => {
                setTimeFilter(val);
                if (scope.type === 'recent' && val !== '24h') {
                  setScope({ type: 'all' });
                }
              }}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={(field, dir) => {
                setSortField(field);
                setSortDirection(dir);
              }}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              flatView={flatView || isFilteringGlobally}
              onFlatViewChange={(flat) => {
                setFlatView(flat);
                if (!flat && scope.type !== 'all') {
                  setScope({ type: 'all' });
                }
              }}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleResetFilters}
              selectedCount={selectedKeys.size}
              categories={categories}
              onBulkAssignCategory={(cat) =>
                requestAssignCategory(selectedItems, cat)
              }
              onBulkMove={() => setMoveTargets(selectedItems)}
              onBulkTrash={() => requestTrashItems(selectedItems)}
              onClearSelection={() => setSelectedKeys(new Set())}
            />

            {!isOnline && (
              <div
                className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2 text-xs font-medium text-amber-800"
                role="status"
              >
                <WifiOff className="w-4 h-4 shrink-0" />
                <span>You are offline. Reconnect to sync or update Google Drive items.</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono tabular-nums">
                Showing {visibleItems.length} of {accountScopedItems.length} item(s)
                {accounts.length > 1 && selectedAccountId === 'all'
                  ? ` across ${accounts.length} accounts`
                  : ''}
                {isLoadingAnyAccount ? ' · Syncing Drive...' : ''}
                {!isLoadingAnyAccount && hasMoreItems
                  ? ' · More items available via search/filter'
                  : ''}
              </span>
              {isFilteringGlobally && scope.type === 'all' && (
                <span>Searching across all Drive folders</span>
              )}
            </div>

            <FileTable
              items={visibleItems}
              isLoading={isLoadingAnyAccount || isLoadingFolder}
              viewMode={viewMode}
              showAccountTag={accounts.length > 1 && selectedAccountId === 'all'}
              selectedIds={selectedKeys}
              activeDetailId={inspectedItemKey}
              categories={categories}
              folderMap={folderMap}
              hasActiveFilters={hasActiveFilters}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onOpenFolder={handleOpenFolder}
              onInspectItem={(item) => {
                setInspectedItemKey(getFolderKey(item.accountId, item.id));
              }}
              onAssignCategory={(item, cat) =>
                requestAssignCategory([item], cat)
              }
              onToggleStar={requestToggleStar}
              onRequestMove={(item) => setMoveTargets([item])}
              onRequestRename={(item) => setRenameTarget(item)}
              onRequestTrash={(item) => requestTrashItems([item])}
              onResetFilters={handleResetFilters}
              onCreateFolder={() => setIsNewFolderOpen(true)}
            />
          </main>

          {inspectedItem && (
            <FileDetailsDrawer
              item={inspectedItem}
              categories={categories}
              folderMap={folderMap}
              onClose={() => setInspectedItemKey(null)}
              onOpenFolder={handleOpenFolder}
              onAssignCategory={(item, cat) =>
                requestAssignCategory([item], cat)
              }
              onToggleStar={requestToggleStar}
              onRequestMove={(item) => setMoveTargets([item])}
              onRequestRename={(item) => setRenameTarget(item)}
              onRequestTrash={(item) => requestTrashItems([item])}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <MoveFolderModal
        isOpen={Boolean(moveTargets && moveTargets.length > 0)}
        itemsToMove={moveTargets || []}
        allFolders={allFolders}
        onClose={() => setMoveTargets(null)}
        onSelectDestination={handleSelectMoveDestination}
      />

      <NewFolderModal
        isOpen={isNewFolderOpen}
        currentFolderName={breadcrumbs[breadcrumbs.length - 1]?.name || 'My Drive'}
        accounts={accounts}
        defaultAccountId={defaultFolderAccountId}
        lockedAccountId={currentFolder?.accountId || null}
        categories={categories}
        onClose={() => setIsNewFolderOpen(false)}
        onSubmit={handleCreateFolderSubmit}
      />

      <RenameModal
        item={renameTarget}
        onClose={() => setRenameTarget(null)}
        onSubmit={handleRenameSubmit}
      />

      <ConfirmActionModal
        pending={pendingConfirm}
        isExecuting={isExecutingAction}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={executeConfirmedAction}
      />

      <AccountAccessHelpModal
        isOpen={isAccountHelpOpen}
        errorMessage={accountHelpError}
        onClose={() => setIsAccountHelpOpen(false)}
        onRetryAddAccount={() => handleConnectAccount(true)}
      />

      {toastMessage && (
        <div
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-medium rounded-md shadow-md"
          role="status"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
