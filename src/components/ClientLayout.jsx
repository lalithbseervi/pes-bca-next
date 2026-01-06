"use client";
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import ProfileCompletionModal from "@/components/ProfileCompletionModal";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import AnalyticsConsentBanner from "@/components/AnalyticsConsentBanner";
import { initPostHog, setPostHogOptIn } from '@/app/instrumentation_client';

const SessionContext = createContext(null);

export function useSession() {
  return useContext(SessionContext);
}

export default function ClientLayout({ children }) {
  const [session, setSession] = useLocalStorage("user_session", null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() || "";
  const redirectParam = searchParams?.get("redirect") || "/";
  const isAuthRoute = pathname === "/authenticate";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize PostHog when client mounts and when session changes.
  useEffect(() => {
    if (!mounted) return;
    // Run only in browser
    try {
      const opted = typeof window !== 'undefined' && localStorage.getItem('analytics_opted_in') === '1';
      initPostHog({ user: session, optedIn: opted });
      // Ensure opt-in/out flags are set in the running instance
      setPostHogOptIn(opted, session);
    } catch (err) {
      // don't block rendering on instrumentation failures
      // eslint-disable-next-line no-console
      console.warn('PostHog init failed', err);
    }
  }, [mounted, session]);

  useEffect(() => {
    if (!mounted) return;

    if (!session && !isAuthRoute) {
      const redirectTarget = search ? `${pathname}?${search}` : pathname;
      router.replace(`/authenticate?redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }

    if (session && isAuthRoute) {
      router.replace(redirectParam || "/");
    }
  }, [session, isAuthRoute, pathname, search, redirectParam, router, mounted]);

  if (!mounted) {
    return null;
  }

  if (!session && !isAuthRoute) {
    return null;
  }

  if (session && isAuthRoute) {
    return null;
  }

  return (
    <SessionContext.Provider value={useMemo(() => ({ session, setSession }), [session])}>
      <ServiceWorkerRegistration />
      <AnalyticsConsentBanner user={session} />
      <div className="flex min-h-screen flex-col md:flex-row p-0 m-0">
        <Nav />
        <div className="flex-1 w-full overflow-x-hidden">
          <ProfileCompletionModal />
          <main>{children}</main>
          <Footer />
        </div>
      </div>
    </SessionContext.Provider>
  );
}
