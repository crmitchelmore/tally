"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useSyncExternalStore } from "react";

// Singleton client
let globalClient: ConvexReactClient | null = null;

function getConvexClient() {
  if (typeof window === 'undefined') return null;
  
  if (!globalClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      console.error("Missing NEXT_PUBLIC_CONVEX_URL");
      return null;
    }
    globalClient = new ConvexReactClient(url);
  }
  return globalClient;
}

// Subscribe function for useSyncExternalStore (no-op since client never changes)
function subscribe() {
  return () => {};
}

// Server snapshot always returns null
function getServerSnapshot() {
  return null;
}

// Client snapshot returns the global client
function getClientSnapshot() {
  return getConvexClient();
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // Use useSyncExternalStore to safely get client without setState in effect
  const client = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  // During SSR or before client is ready, show loading
  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
