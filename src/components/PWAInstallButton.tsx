import React, { useState } from 'react';
import { Download, MonitorDown, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isMacSafari, install } =
    usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        title="Install DriveFolio as a desktop app"
      >
        <Download className="w-3.5 h-3.5 text-blue-700" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  if (isIOS || isMacSafari) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          title="Keep as an app on your device"
        >
          <MonitorDown className="w-3.5 h-3.5 text-blue-700" />
          <span className="hidden sm:inline">
            {isMacSafari ? 'Add to Mac Dock' : 'Install App'}
          </span>
        </button>

        {showGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
                <h3 className="font-display text-sm font-semibold text-slate-900">
                  {isMacSafari ? 'Keep DriveFolio in Your Mac Dock' : 'Install on iPhone / iPad'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                  aria-label="Close guide"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 text-sm text-slate-600 space-y-2 leading-relaxed">
                {isMacSafari ? (
                  <>
                    <p>
                      1. In Safari&apos;s top menu bar, click <strong>File</strong>.
                    </p>
                    <p>
                      2. Select <strong>Add to Dock...</strong> and confirm.
                    </p>
                    <p className="text-xs text-slate-500 pt-1">
                      DriveFolio will open as its own Mac app window directly from your Dock or
                      Spotlight.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      1. Tap the <strong>Share</strong> button in Safari.
                    </p>
                    <p>
                      2. Scroll down and tap <strong>Add to Home Screen</strong>.
                    </p>
                  </>
                )}
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
