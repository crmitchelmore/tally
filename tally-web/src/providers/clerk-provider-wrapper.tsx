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
  // Check if this is a production key (works both server and client side)
  const isProductionKey = publishableKey?.startsWith("pk_live_");

  // proxyUrl must be set for both SSR and client-side so Clerk uses /__clerk 
  // instead of the custom domain (clerk.tally-tracker.app) which has CORS issues
  // due to Cloudflare for SaaS conflict
  const proxyUrl = isProductionKey ? "/__clerk" : undefined;

  // Load Clerk JS from CDN instead of custom domain to avoid Cloudflare conflicts
  // This must be set for SSR as well so the script tag uses the CDN URL
  const clerkJSUrl = isProductionKey 
    ? "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js"
    : undefined;

  // In production, force sign-in/sign-up onto the canonical domain to avoid redirects to accounts.*
  const signInUrl = isProductionKey ? "https://tally-tracker.app/sign-in" : undefined;
  const signUpUrl = isProductionKey ? "https://tally-tracker.app/sign-up" : undefined;

  return (
    <ClerkProvider 
      publishableKey={publishableKey} 
      proxyUrl={proxyUrl}
      clerkJSUrl={clerkJSUrl}
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      signInFallbackRedirectUrl="/app"
      signUpFallbackRedirectUrl="/app"
    >
      {children}
    </ClerkProvider>
  );
}
