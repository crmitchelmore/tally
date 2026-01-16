'use client';

import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

// Lazy load entire posthog module at runtime
function usePostHog() {
  const posthogRef = useRef<typeof import('posthog-js').default | null>(null);
  
  useEffect(() => {
    // Only load in browser
    if (typeof window === 'undefined') return;
    
    import('posthog-js').then(mod => {
      const posthog = mod.default;
      posthogRef.current = posthog;
      
      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      if (key) {
        posthog.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
          person_profiles: 'identified_only',
          capture_pageview: false,
          capture_pageleave: true,
          autocapture: false,
        });
      }
    });
  }, []);
  
  return posthogRef;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const posthogRef = usePostHog();

  // Memoize the URL to track
  const currentUrl = useMemo(() => {
    if (!pathname) return null;
    const search = searchParams?.toString();
    return search ? pathname + '?' + search : pathname;
  }, [pathname, searchParams]);

  // Track page views on route change
  useEffect(() => {
    if (!currentUrl || !posthogRef.current) return;
    posthogRef.current.capture('$pageview', { $current_url: currentUrl });
  }, [currentUrl, posthogRef]);

  // Identify user when auth state changes
  useEffect(() => {
    if (!isLoaded || !posthogRef.current) return;
    
    if (user) {
      posthogRef.current.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        createdAt: user.createdAt,
      });
    } else {
      posthogRef.current.reset();
    }
  }, [user, isLoaded, posthogRef]);

  return <>{children}</>;
}
