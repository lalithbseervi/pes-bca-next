'use client';

import { useState, useEffect } from 'react';
import AnalyticsConsentBanner from './AnalyticsConsentBanner';

export default function PrivacySettings({ user }) {
  const [showBanner, setShowBanner] = useState(false);
  const [optedIn, setOptedIn] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem('analytics_opted_in');
      setOptedIn(val === '1');
    }
  }, []);

  const handleShowBanner = () => setShowBanner(true);
  const handleChoice = (choice) => {
    setOptedIn(choice);
    setShowBanner(false);
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '40px auto',
        padding: 24,
        background: '#f9f9f9',
        borderRadius: 8,
        color: '#111',
      }}
    >
      <h2 style={{ marginBottom: 8 }}>Privacy & Analytics Settings</h2>
      <p style={{ color: '#222' }}>
        Your analytics preference: <b style={{ color: optedIn ? '#176f3f' : '#222' }}>{optedIn === null ? 'No choice yet' : optedIn ? 'Opted In' : 'Opted Out'}</b>
      </p>

      <button
        className="hover:cursor-pointer"
        onClick={handleShowBanner}
        style={{
          marginTop: 16,
          background: '#176f3f',
          color: '#fff',
          border: 'none',
          padding: '8px 12px',
          borderRadius: 6,
        }}
      >
        Change Analytics Preference
      </button>

      {showBanner && (
        <div style={{ marginTop: 12 }}>
          <AnalyticsConsentBanner user={user} onChoice={handleChoice} forceVisible={showBanner} />
        </div>
      )}
    </div>
  );
}
