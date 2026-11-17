import React, { useState } from 'react';
import {
  Clock,
  Folder,
  HardDrive,
  Plus,
  Star,
  Tag,
  HelpCircle,
  Trash2,
  UserPlus,
  Users,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  CategoryDefinition,
  ConnectedAccount,
  SidebarScope,
} from '../types/drive';
import { CATEGORY_ACCENT_SWATCHES, formatBytes } from '../utils/categorize';

interface SidebarProps {
  accounts: ConnectedAccount[];
  selectedAccountId: string | 'all';
  onSelectAccount: (accountId: string | 'all') => void;
  onAddAccount: () => void;
  onReconnectAccount: (accountId: string) => void;
  onDisconnectAccount: (accountId: string) => void;
  accountItemCounts: Record<string, number>;
  scope: SidebarScope;
  onSelectScope: (scope: SidebarScope) => void;
  categories: CategoryDefinition[];
  onAddCategory: (name: string, accentHex: string) => void;
  onRemoveCategory: (name: string) => void;
  counts: {
    all: number;
    recent: number;
    folders: number;
    starred: number;
    uncategorized: number;
    byCategory: Record<string, number>;
  };
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onAddAccount,
  onReconnectAccount,
  onDisconnectAccount,
  accountItemCounts,
  scope,
  onSelectScope,
  categories,
  onAddCategory,
  onRemoveCategory,
  counts,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_ACCENT_SWATCHES[0]);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddCategory(trimmed, selectedColor);
    setNewName('');
    setIsAdding(false);
  };

  const navItemClass = (active: boolean) =>
    `w-full px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 transition-colors ${
      active
        ? 'bg-blue-50 text-blue-800 font-medium'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
    }`;

  // Compute storage summary for active account or consolidated across all accounts
  const storageSummary = (() => {
    const targetAccounts =
      selectedAccountId === 'all'
        ? accounts
        : accounts.filter((a) => a.id === selectedAccountId);

    let totalUsed = 0;
    let totalLimit = 0;
    let hasKnownLimit = false;
    let hasUnlimitedAccount = false;
    let hasQuotaData = false;

    for (const acc of targetAccounts) {
      if (acc.storageQuota) {
        hasQuotaData = true;
        totalUsed += Number(acc.storageQuota.usage || 0);
        if (acc.storageQuota.limit) {
          hasKnownLimit = true;
          totalLimit += Number(acc.storageQuota.limit);
        } else {
          hasUnlimitedAccount = true;
        }
      }
    }

    const percent =
      hasKnownLimit && totalLimit > 0
        ? Math.min(100, Math.round((totalUsed / totalLimit) * 1000) / 10)
        : 0;

    return {
      hasQuotaData,
      totalUsed,
      totalLimit,
      hasKnownLimit,
      hasUnlimitedAccount,
      percent,
    };
  })();

  const totalAcrossAccounts = Object.values(accountItemCounts).reduce(
    (sum, n) => sum + n,
    0
  );

  const progressBarColor =
    storageSummary.percent >= 95
      ? 'bg-red-600'
      : storageSummary.percent >= 80
      ? 'bg-amber-600'
      : 'bg-blue-700';

  const content = (
    <div className="h-full flex flex-col bg-white border-r border-slate-200 w-[268px] shrink-0">
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between gap-3">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          DriveFolio
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
          aria-label="Close navigation menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Accounts Switcher & Consolidation */}
        <div className="space-y-1">
          <div className="px-3 pb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Drive Accounts</span>
            <button
              type="button"
              onClick={onAddAccount}
              className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              title="Add another Google Drive account"
              aria-label="Add Google Drive account"
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {accounts.length > 1 && (
            <button
              type="button"
              onClick={() => {
                onSelectAccount('all');
                onCloseMobile();
              }}
              className={navItemClass(selectedAccountId === 'all')}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Users className="w-4 h-4 shrink-0" />
                <span className="truncate">All Accounts</span>
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {totalAcrossAccounts}
              </span>
            </button>
          )}

          {accounts.map((acc) => {
            const isSelected = selectedAccountId === acc.id;
            const itemCount = accountItemCounts[acc.id] || 0;
            return (
              <div key={acc.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectAccount(acc.id);
                    onCloseMobile();
                  }}
                  className={navItemClass(isSelected)}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center justify-center shrink-0 uppercase">
                      {(acc.displayName || acc.email).slice(0, 1)}
                    </span>
                    <span className="truncate text-xs">{acc.email}</span>
                  </span>
                  <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                    {acc.isLoading ? '...' : itemCount}
                  </span>
                </button>

                {acc.error ? (
                  <button
                    type="button"
                    onClick={() => onReconnectAccount(acc.id)}
                    className="p-1 rounded text-amber-600 hover:bg-amber-50 shrink-0"
                    title="Reconnect this Google account"
                    aria-label={`Reconnect ${acc.email}`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDisconnectAccount(acc.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-600 transition-opacity shrink-0"
                      title={`Remove ${acc.email}`}
                      aria-label={`Remove ${acc.email}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={onAddAccount}
            className="w-full mt-1 px-3 py-1.5 rounded-md text-xs font-medium text-blue-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Add Drive Account</span>
          </button>
        </div>

        {/* Workspace Views */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-xs font-medium text-slate-500">Workspace</div>

          <button
            type="button"
            onClick={() => {
              onSelectScope({ type: 'all' });
              onCloseMobile();
            }}
            className={navItemClass(scope.type === 'all')}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <HardDrive className="w-4 h-4 shrink-0" />
              <span className="truncate">All Drive</span>
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectScope({ type: 'recent' });
              onCloseMobile();
            }}
            className={navItemClass(scope.type === 'recent')}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Clock className="w-4 h-4 shrink-0" />
              <span className="truncate">Recent (24h)</span>
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {counts.recent}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectScope({ type: 'folders' });
              onCloseMobile();
            }}
            className={navItemClass(scope.type === 'folders')}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Folder className="w-4 h-4 shrink-0" />
              <span className="truncate">Folders</span>
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {counts.folders}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectScope({ type: 'starred' });
              onCloseMobile();
            }}
            className={navItemClass(scope.type === 'starred')}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Star className="w-4 h-4 shrink-0" />
              <span className="truncate">Starred</span>
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {counts.starred}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectScope({ type: 'uncategorized' });
              onCloseMobile();
            }}
            className={navItemClass(scope.type === 'uncategorized')}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">Uncategorized</span>
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {counts.uncategorized}
            </span>
          </button>
        </div>

        {/* Categories */}
        <div className="space-y-1">
          <div className="px-3 pb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Categories</span>
            <button
              type="button"
              onClick={() => setIsAdding((prev) => !prev)}
              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Create new category"
              title="New category"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isAdding && (
            <form
              onSubmit={handleCreateCategory}
              className="mx-1 mb-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md space-y-2.5"
            >
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name..."
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                autoFocus
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {CATEGORY_ACCENT_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setSelectedColor(hex)}
                    className={`w-4 h-4 rounded-sm transition-transform ${
                      selectedColor === hex
                        ? 'ring-2 ring-offset-1 ring-slate-900 scale-110'
                        : ''
                    }`}
                    style={{ backgroundColor: hex }}
                    aria-label={`Select color ${hex}`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewName('');
                  }}
                  className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="px-2.5 py-1 text-xs font-medium text-white bg-blue-700 rounded hover:bg-blue-800 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </form>
          )}

          {categories.map((cat) => {
            const isActive =
              scope.type === 'category' && scope.category === cat.name;
            const count = counts.byCategory[cat.name] || 0;
            return (
              <div key={cat.name} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectScope({ type: 'category', category: cat.name });
                    onCloseMobile();
                  }}
                  className={navItemClass(isActive)}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: cat.accentHex }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {count}
                  </span>
                </button>
                {count === 0 && (
                  <button
                    type="button"
                    onClick={() => onRemoveCategory(cat.name)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-slate-400 hover:text-red-600 transition-opacity shrink-0"
                    title={`Remove empty category ${cat.name}`}
                    aria-label={`Remove category ${cat.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Storage Quota & Categorized Summary Footer */}
      <div className="px-4 py-3.5 border-t border-slate-200 bg-slate-50 space-y-3">
        {storageSummary.hasQuotaData && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">
                {selectedAccountId === 'all' && accounts.length > 1
                  ? 'Total Storage'
                  : 'Drive Storage'}
              </span>
              {storageSummary.hasKnownLimit && (
                <span className="font-mono tabular-nums text-slate-600">
                  {storageSummary.percent}%
                </span>
              )}
            </div>

            <div
              className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={storageSummary.hasKnownLimit ? storageSummary.percent : 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Google Drive storage usage"
            >
              <div
                className={`h-full transition-all duration-300 ${progressBarColor}`}
                style={{
                  width: storageSummary.hasKnownLimit
                    ? `${Math.max(storageSummary.percent, storageSummary.totalUsed > 0 ? 2 : 0)}%`
                    : '25%',
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500">
              <span>{formatBytes(String(storageSummary.totalUsed))} used</span>
              <span>
                {storageSummary.hasKnownLimit
                  ? `${formatBytes(String(storageSummary.totalLimit))} total${
                      storageSummary.hasUnlimitedAccount ? '+' : ''
                    }`
                  : 'Unlimited quota'}
              </span>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Categorized</span>
          </span>
          <span className="font-mono tabular-nums text-slate-700 font-medium">
            {counts.all - counts.uncategorized} / {counts.all}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block h-full">{content}</aside>
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 h-full">{content}</aside>
        </div>
      )}
    </>
  );
};
