"use client";

import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

interface ClerkProviderWrapperProps {
  children: ReactNode;
  publishableKey: string;
}

/**
 * Client-side wrapper for ClerkProvider that conditionally sets proxyUrl.
 * 
 * The proxyUrl is needed in production to bypass Cloudflare for SaaS conflict.
 * We must set it on the client side only because setting it during SSR
 * causes "window is not defined" errors during static page generation.
 */
export function ClerkProviderWrapper({ children, publishableKey }: ClerkProviderWrapperProps) {
  // Determine proxy URL on client side only
  const isProduction = 
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "production" && 
    publishableKey?.startsWith("pk_live_");
  
  const proxyUrl = isProduction ? "/__clerk" : undefined;

  return (
    <ClerkProvider publishableKey={publishableKey} proxyUrl={proxyUrl}>
      {children}
    </ClerkProvider>
  );
}
