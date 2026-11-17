import React from 'react';
import { ExternalLink, ShieldAlert, X } from 'lucide-react';
import { OAUTH_PROJECT_ID } from '../services/auth';

interface AccountAccessHelpModalProps {
  isOpen: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onRetryAddAccount: () => void;
}

export const AccountAccessHelpModal: React.FC<AccountAccessHelpModalProps> = ({
  isOpen,
  errorMessage,
  onClose,
  onRetryAddAccount,
}) => {
  if (!isOpen) return null;

  const audienceUrl = `https://console.cloud.google.com/auth/audience?project=${OAUTH_PROJECT_ID}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-access-help-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <h2
              id="account-access-help-title"
              className="font-display text-base font-semibold text-slate-900 truncate"
            >
              Allow Additional Google Account
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close help dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            Google blocked sign-in for the second account (
            <span className="font-mono text-xs text-slate-800">Error 403: access_denied</span>)
            because your Google Cloud project&apos;s OAuth app is currently in{' '}
            <strong className="text-slate-900">Testing</strong> mode, which restricts login to
            approved Test Users.
          </p>

          {errorMessage && (
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 font-mono break-words">
              {errorMessage}
            </div>
          )}

          <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-md p-4">
            <div className="text-xs font-semibold text-slate-900">
              How to enable your other Drive account (takes ~15 seconds):
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700">
              <li>
                Open{' '}
                <strong className="text-slate-900">
                  Google Cloud Console → Google Auth Platform → Audience
                </strong>{' '}
                for project <span className="font-mono">{OAUTH_PROJECT_ID}</span>.
              </li>
              <li>
                Under <strong className="text-slate-900">Test users</strong>, click{' '}
                <strong className="text-slate-900">+ Add users</strong> and enter the Gmail address
                of your second Drive account.
              </li>
              <li>Save, return here, and click Retry Add Account.</li>
            </ol>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <a
            href={audienceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-md hover:bg-blue-50 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Google Cloud Test Users</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRetryAddAccount();
              }}
              className="px-3.5 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
            >
              Retry Add Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
