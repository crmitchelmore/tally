"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useEffect, useState, useRef } from "react";

// Singleton client to prevent recreation
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

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ConvexReactClient | null>(() => {
    // Try to get client on initial render (client-side only)
    if (typeof window !== 'undefined') {
      return getConvexClient();
    }
    return null;
  });

  useEffect(() => {
    // Ensure client is available after hydration
    if (!client) {
      setClient(getConvexClient());
    }
  }, [client]);

  // During SSR or before client is ready, render a minimal placeholder
  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
