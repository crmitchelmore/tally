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
 * 
 * The clerkJSUrl is set to load Clerk JS from Clerk's CDN directly instead of
 * the custom domain (clerk.tally-tracker.app) which can have DNS/SSL issues
 * due to Cloudflare for SaaS conflicts.
 */
export function ClerkProviderWrapper({ children, publishableKey }: ClerkProviderWrapperProps) {
  // Determine proxy URL on client side only
  const isProduction = 
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "production" && 
    publishableKey?.startsWith("pk_live_");
  
  const proxyUrl = isProduction ? "/__clerk" : undefined;
  
  // Load Clerk JS from CDN instead of custom domain to avoid Cloudflare conflicts
  // The custom domain (clerk.tally-tracker.app) can timeout due to Cloudflare for SaaS issues
  const clerkJSUrl = isProduction 
    ? "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js"
    : undefined;

  return (
    <ClerkProvider 
      publishableKey={publishableKey} 
      proxyUrl={proxyUrl}
      clerkJSUrl={clerkJSUrl}
    >
      {children}
    </ClerkProvider>
  );
}
