'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from '@/components/ClientLayout';

const PrivacySettings = dynamic(() => import('@/components/PrivacySettings'), { ssr: false });

export default function PrivacySettingsPage() {
  const { session } = useSession();
  const user = session;

  useEffect(() => {
    document.title = "Privacy Settings | LMS";
  }, []);

  return <PrivacySettings user={user} />;
}
