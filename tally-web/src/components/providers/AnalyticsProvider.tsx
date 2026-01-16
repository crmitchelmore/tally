'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { initPostHog, identifyUser, resetUser, trackPageView } from '@/lib/analytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  const currentUrl = useMemo(() => {
    if (!pathname) return null;
    const search = searchParams?.toString();
    return search ? pathname + '?' + search : pathname;
  }, [pathname, searchParams]);

  // Initialize PostHog on mount
  useEffect(() => {
    void initPostHog();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (currentUrl) {
      trackPageView(currentUrl);
    }
  }, [currentUrl]);

  // Identify user when auth state changes
  useEffect(() => {
    if (!isLoaded) return;
    
    if (user) {
      void identifyUser(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        createdAt: user.createdAt,
      });
    } else {
      void resetUser();
    }
  }, [user, isLoaded]);

  return <>{children}</>;
}
