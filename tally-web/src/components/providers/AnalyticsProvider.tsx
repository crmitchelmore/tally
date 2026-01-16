'use client';

// Analytics provider - PostHog integration temporarily disabled
// due to SSR compatibility issues with Next.js 16 Turbopack
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // TODO: Re-enable PostHog integration when SSR issues are resolved
  // See: posthog-js accesses window on import which breaks static generation
  return <>{children}</>;
}
