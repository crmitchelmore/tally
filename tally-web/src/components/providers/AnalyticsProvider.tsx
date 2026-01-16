'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

// Lazy load analytics to avoid SSR issues
let analyticsLoaded = false;
let initPostHog: () => Promise<void>;
let identifyUser: (userId: string, properties?: Record<string, unknown>) => Promise<void>;
let resetUser: () => Promise<void>;
let trackPageView: (path: string) => void;

async function loadAnalytics() {
  if (analyticsLoaded || typeof window === 'undefined') return;
  analyticsLoaded = true;
  
  const analytics = await import('@/lib/analytics');
  initPostHog = analytics.initPostHog;
  identifyUser = analytics.identifyUser;
  resetUser = analytics.resetUser;
  trackPageView = analytics.trackPageView;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [isClient, setIsClient] = useState(false);

  // Only run on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize PostHog on mount (client only)
  useEffect(() => {
    if (!isClient) return;
    loadAnalytics().then(() => {
      if (initPostHog) void initPostHog();
    });
  }, [isClient]);

  // Track page views on route change
  useEffect(() => {
    if (!isClient || !pathname) return;
    loadAnalytics().then(() => {
      if (trackPageView) {
        const search = searchParams?.toString();
        const url = search ? pathname + '?' + search : pathname;
        trackPageView(url);
      }
    });
  }, [pathname, searchParams, isClient]);

  // Identify user when auth state changes
  useEffect(() => {
    if (!isClient || !isLoaded) return;
    
    loadAnalytics().then(() => {
      if (user && identifyUser) {
        void identifyUser(user.id, {
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName,
          createdAt: user.createdAt,
        });
      } else if (resetUser) {
        void resetUser();
      }
    });
  }, [user, isLoaded, isClient]);

  return <>{children}</>;
}
