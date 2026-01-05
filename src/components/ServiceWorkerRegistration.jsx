"use client";

import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });

          // Check for updates periodically
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;

            newWorker?.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // Optionally notify user about update
              }
            });
          });
        } catch (error) {
          console.error("Service Worker registration failed:", error);
        }
      };

      registerSW();
    }
  }, []);
}

export default function ServiceWorkerRegistration() {
  useServiceWorker();
  return null;
}
