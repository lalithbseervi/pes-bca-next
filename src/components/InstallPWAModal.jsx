"use client";

import { useEffect, useState } from "react";

export default function InstallPWAModal({ visible, onClose, onInstall }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-700 bg-neutral-900 shadow-2xl p-6 space-y-4">
        <header className="space-y-1">
          <h2 className="text-xl font-bold">Install LMS App</h2>
          <p className="text-sm text-neutral-300">
            Install this app on your device for quick access and a better experience.
          </p>
        </header>

        <div className="space-y-2 text-sm text-neutral-400">
          <p>Benefits of installing:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Access from your home screen</li>
            <li>Works offline</li>
            <li>Faster loading times</li>
            <li>Full-screen experience</li>
          </ul>
        </div>

        <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          <button
            className="rounded border border-gray-300 dark:border-neutral-700 px-4 py-2 text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            onClick={onClose}
          >
            Maybe Later
          </button>
          <button
            className="rounded bg-emerald-600 dark:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
            onClick={onInstall}
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  );
}

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) {
      return false;
    }

    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    setInstallPrompt(null);
    setIsInstallable(false);
    return result.outcome === "accepted";
  };

  return {
    isInstallable,
    promptInstall,
  };
}
