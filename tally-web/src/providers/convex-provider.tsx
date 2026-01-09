"use client";

import { ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;

  // Keep builds/prerendering from crashing when local env isn't configured.
  const effectiveUrl = url ?? "https://invalid.local";
  if (!url && process.env.NODE_ENV !== "production") {
    console.warn("Missing NEXT_PUBLIC_CONVEX_URL; Convex disabled");
  }

  const convex = useMemo(() => new ConvexReactClient(effectiveUrl), [effectiveUrl]);
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
