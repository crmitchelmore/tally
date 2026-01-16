'use client';

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// Load AnalyticsProvider only on client to avoid posthog-js SSR issues
const AnalyticsProvider = dynamic(
  () => import("./AnalyticsProvider").then(mod => mod.AnalyticsProvider),
  { ssr: false }
);

export function ClientAnalyticsProvider({ children }: { children: ReactNode }) {
  return <AnalyticsProvider>{children}</AnalyticsProvider>;
}
