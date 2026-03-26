import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] bg-brand-600 rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-lg mx-auto animate-slide-down">
      <Download size={24} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Install PocketLedger</p>
        <p className="text-xs text-slate-300">Add to home screen for quick access</p>
      </div>
      <button onClick={handleInstall} className="btn-primary text-sm py-2 px-4">
        Install
      </button>
      <button onClick={dismiss} className="p-1 text-slate-300">
        <X size={18} />
      </button>
    </div>
  );
}
