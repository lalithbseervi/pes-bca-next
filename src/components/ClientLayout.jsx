"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import Nav from "@/components/nav";
import Footer from "@/components/footer";

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
    <SessionContext.Provider value={{ session, setSession }}>
      <div className="flex min-h-screen flex-col md:flex-row p-0 m-0">
        <Nav />
        <div className="flex-1 w-full overflow-x-hidden">
          <main>{children}</main>
          <Footer />
        </div>
      </div>
    </SessionContext.Provider>
  );
}
