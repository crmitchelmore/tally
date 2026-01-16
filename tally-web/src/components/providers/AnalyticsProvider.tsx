'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Lazy load analytics module (only on client)
const analyticsPromise = isBrowser 
  ? import('@/lib/analytics')
  : Promise.resolve(null);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  // Memoize the URL to track
  const currentUrl = useMemo(() => {
    if (!pathname) return null;
    const search = searchParams?.toString();
    return search ? pathname + '?' + search : pathname;
  }, [pathname, searchParams]);

  // Initialize PostHog on mount
  useEffect(() => {
    analyticsPromise.then(analytics => {
      if (analytics) void analytics.initPostHog();
    });
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!currentUrl) return;
    analyticsPromise.then(analytics => {
      if (analytics) analytics.trackPageView(currentUrl);
    });
  }, [currentUrl]);

  // Identify user when auth state changes
  useEffect(() => {
    if (!isLoaded) return;
    
    analyticsPromise.then(analytics => {
      if (!analytics) return;
      if (user) {
        void analytics.identifyUser(user.id, {
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName,
          createdAt: user.createdAt,
        });
      } else {
        void analytics.resetUser();
      }
    });
  }, [user, isLoaded]);

  return <>{children}</>;
}
