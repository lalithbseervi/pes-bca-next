import { useState, useEffect } from 'react';
import { setPostHogOptIn, isPostHogOptedIn } from '@/app/instrumentation_client';

export default function AnalyticsConsentBanner({ user, onChoice, forceVisible = false }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasChoice = localStorage.getItem('analytics_opted_in');
      // If parent forces visibility (e.g., Privacy Settings), honor that.
      setVisible(forceVisible ? true : !hasChoice);
    }
  }, [forceVisible]);

  const handleChoice = (optedIn) => {
    setPostHogOptIn(optedIn, user);
    localStorage.setItem('analytics_opted_in', optedIn ? '1' : '0');
    setVisible(false);
    if (onChoice) onChoice(optedIn);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000] bg-neutral-900 text-white px-4 py-3">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-3 text-center">
          <p className="text-sm md:text-base md:mr-4">
            We use analytics to improve your experience. Do you want to help us by sharing usage data?
          </p>
          <div className="flex w-full md:w-auto items-center justify-center gap-2">
            <button
              onClick={() => handleChoice(true)}
              className="hover:cursor-pointer rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => handleChoice(false)}
              className="hover:cursor-pointer rounded-md bg-neutral-700 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-600 transition-colors"
            >
              Deny
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
