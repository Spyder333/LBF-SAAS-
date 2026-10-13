import React, { useState } from 'react';
import { Download, Monitor, CheckCircle2, X, Laptop } from 'lucide-react';
import { usePWAInstall } from '../lib/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'modal' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  // If already running as an installed standalone desktop PWA, hide or show badge
  if (isInstalled) {
    if (variant === 'modal') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Installed on Desktop (100% Offline Ready)</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowDesktopGuide(true);
    }
  };

  if (variant === 'modal') {
    return (
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-industrial uppercase tracking-wider text-amber-400">
              Install Offline App to Workshop Desktop
            </h4>
            <p className="text-[11px] text-stone-400">
              Run full screen without browser tabs &bull; Works 100% disconnected from the internet
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstallClick}
          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isInstallable ? 'Install to Desktop' : 'Installation Guide'}</span>
        </button>

        {showDesktopGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4">
            <div className="bg-stone-900 border border-stone-700 rounded-2xl p-6 max-w-md w-full shadow-2xl text-stone-100">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold uppercase">Install on Workshop Desktop</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDesktopGuide(false)}
                  className="text-stone-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 space-y-2.5 text-xs text-stone-300 leading-relaxed">
                <p>
                  <strong>Google Chrome or Microsoft Edge:</strong>
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-stone-300">
                  <li>Look at the top-right of your browser address bar.</li>
                  <li>Click the <strong>Install icon</strong> (an arrow inside a computer screen or puzzle).</li>
                  <li>Click <strong>Install</strong> to add LBF Solutions directly to your Windows desktop and taskbar.</li>
                </ol>
                <p className="pt-2 text-stone-400 border-t border-stone-800">
                  Once installed, you can launch the app directly from your Windows Desktop with zero internet connection!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDesktopGuide(false)}
                className="mt-4 w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-xl transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Navbar button
  return (
    <>
      <button
        id="pwa-desktop-install-btn"
        type="button"
        onClick={handleInstallClick}
        title="Install LBF Solutions onto your Workshop PC for offline standalone use"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-amber-400 hover:text-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
      >
        <Monitor className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install Desktop App</span>
        <span className="sm:hidden">Install</span>
      </button>

      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 backdrop-blur-sm p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl p-6 max-w-md w-full shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold uppercase font-industrial">Install on Workshop PC</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDesktopGuide(false)}
                className="text-stone-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2.5 text-xs text-stone-300 leading-relaxed">
              <p className="font-semibold text-white">To install on your Workshop Desktop:</p>
              <ol className="list-decimal pl-5 space-y-1.5">
                <li>Look at the top-right of your browser address bar.</li>
                <li>Click the <strong>Install</strong> or <strong>App Available</strong> icon.</li>
                <li>Click <strong>Install</strong> to pin LBF Solutions to your Windows desktop and taskbar.</li>
              </ol>
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] mt-2">
                After installation, LBF Solutions functions 100% offline from your desktop, saving all invoices and client files locally, while still allowing server sync anytime you reconnect!
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDesktopGuide(false)}
              className="mt-4 w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};
