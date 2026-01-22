"use client";

import { ConvexProvider as BaseConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, JSX } from "react";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export function ConvexClientProvider({ children }: { children: ReactNode }): JSX.Element {
  // Type assertion needed due to React 19 compatibility with Convex types
  const Provider = BaseConvexProvider as React.ComponentType<{
    client: ConvexReactClient;
    children: ReactNode;
  }>;
  return <Provider client={convex}>{children}</Provider>;
}

// Export the client for server-side use
export { convex };
