"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { analytics } from "@/lib/analytics";

/**
 * AnalyticsProvider initializes analytics and tracks page views.
 * Should be placed high in the component tree, after auth providers.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();

  // Initialize analytics on mount
  useEffect(() => {
    analytics.init();
  }, []);

  // Identify user when they sign in
  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      analytics.identify(user.id);
    } else {
      analytics.reset();
    }
  }, [user, isLoaded]);

  // Track page views on navigation
  useEffect(() => {
    if (pathname) {
      analytics.page(pathname);
    }
  }, [pathname]);

  return <>{children}</>;
}
