import React from 'react';
import { FolderTree, Search, SlidersHorizontal, ShieldCheck } from 'lucide-react';

interface GoogleSignInButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onClick,
  isLoading,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="gsi-material-button"
    >
      <div className="gsi-material-button-state" />
      <div className="gsi-material-button-content-wrapper">
        <div className="gsi-material-button-icon">
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            style={{ display: 'block' }}
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
        </div>
        <span className="gsi-material-button-contents">
          {isLoading ? 'Connecting...' : 'Sign in with Google'}
        </span>
        <span style={{ display: 'none' }}>Sign in with Google</span>
      </div>
    </button>
  );
};

interface AuthLandingProps {
  onSignIn: () => void;
  isLoggingIn: boolean;
  errorMessage: string | null;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({
  onSignIn,
  isLoggingIn,
  errorMessage,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="h-16 px-8 border-b border-slate-200 bg-white flex items-center justify-between gap-8">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          DriveFolio
        </span>
        <div className="text-xs text-slate-500 whitespace-nowrap shrink-0">
          Google Drive Workspace Organizer
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-medium tracking-wide text-blue-700">
                Google Drive Organization
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
                Categorize, filter, and organize your Drive in one place.
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Connect your Google Drive to assign custom categories to files and folders, filter
                instantly by file type or modified date, and move items into folders without clutter.
              </p>
            </div>

            <div className="pt-2 flex flex-col items-start gap-3">
              <GoogleSignInButton
                onClick={onSignIn}
                isLoading={isLoggingIn}
              />
              {errorMessage && (
                <p className="text-sm text-red-600" role="alert">
                  {errorMessage}
                </p>
              )}
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Your session token stays in memory only. Every change asks for your confirmation
                  first.
                </span>
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
            <div className="p-6 flex items-start gap-4">
              <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <FolderTree className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold text-slate-900">
                  Custom & Automatic Categories
                </h2>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  Automatically groups Docs, Sheets, Slides, PDFs, Media, and Folders while letting
                  you tag items with custom categories saved directly to Drive metadata.
                </p>
              </div>
            </div>

            <div className="p-6 flex items-start gap-4">
              <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold text-slate-900">
                  Instant Multi-Filter Search
                </h2>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  Search by file or folder name, narrow down by category, format, starred state, or
                  date range, and switch between folder hierarchy and flat Drive view.
                </p>
              </div>
            </div>

            <div className="p-6 flex items-start gap-4">
              <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold text-slate-900">
                  Bulk Organize with Explicit Review
                </h2>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  Select multiple files to categorize, move between folders, rename, or move to
                  trash—always with a clear confirmation preview before updating Drive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
