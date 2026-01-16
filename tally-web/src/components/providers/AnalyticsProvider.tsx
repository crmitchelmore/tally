'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { initPostHog, identifyUser, resetUser, trackPageView } from '@/lib/analytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  // Initialize PostHog on mount
  useEffect(() => {
    void initPostHog();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      const search = searchParams?.toString();
      const url = search ? pathname + '?' + search : pathname;
      trackPageView(url);
    }
  }, [pathname, searchParams]);

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
