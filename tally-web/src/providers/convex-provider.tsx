"use client";

import { ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { getClerkPublishableKey } from "@/lib/clerk-public";

/**
 * Convex client provider that uses Clerk authentication when available.
 * Falls back to unauthenticated ConvexProvider when Clerk is not configured.
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const clerkEnabled = Boolean(getClerkPublishableKey());

  // Keep builds/prerendering from crashing when local env isn't configured.
  const effectiveUrl = url ?? "https://invalid.local";

  const convex = useMemo(() => new ConvexReactClient(effectiveUrl), [effectiveUrl]);

  // Use authenticated provider when Clerk is available, otherwise fall back to basic provider
  if (clerkEnabled) {
    return (
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
