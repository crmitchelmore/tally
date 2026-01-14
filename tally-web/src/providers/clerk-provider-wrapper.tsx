"use client";

import { ReactNode, useEffect } from "react";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";

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
function AuthDebug() {
  const { isLoaded: authLoaded, isSignedIn, sessionId, userId } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_AUTH_DEBUG !== "true") return;
    // eslint-disable-next-line no-console
    console.log("[auth-debug]", {
      url: typeof window !== "undefined" ? window.location.href : "(no-window)",
      authLoaded,
      userLoaded,
      isSignedIn,
      sessionId,
      userId,
      clerkUserId: user?.id,
    });
  }, [authLoaded, userLoaded, isSignedIn, sessionId, userId, user?.id]);

  return null;
}

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
      {process.env.NEXT_PUBLIC_AUTH_DEBUG === "true" ? <AuthDebug /> : null}
      {children}
    </ClerkProvider>
  );
}
