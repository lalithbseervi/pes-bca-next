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
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#222', color: '#fff', padding: 16, zIndex: 1000, textAlign: 'center' }}>
      <span style={{ marginRight: 16 }}>
        We use analytics to improve your experience. Do you want to help us by sharing usage data?
      </span>
      <button
        onClick={() => handleChoice(true)}
        style={{ marginRight: 8, background: '#176f3f', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6 }}
        className='hover:cursor-pointer'
      >
        Accept
      </button>
      <button
        onClick={() => handleChoice(false)}
        style={{ background: '#444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6 }}
        className='hover:cursor-pointer'
      >
        Deny
      </button>
    </div>
  );
}
