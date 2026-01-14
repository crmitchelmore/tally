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
  // Prefer Clerk's documented proxy env var (full URL). This avoids subtle issues with relative paths
  // during OAuth redirects and matches Clerk's proxy docs.
  const proxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL;

  // In production, force sign-in/sign-up onto the canonical domain to avoid redirects to accounts.*
  const isProductionKey = publishableKey?.startsWith("pk_live_");
  const signInUrl = isProductionKey ? "https://tally-tracker.app/sign-in" : undefined;
  const signUpUrl = isProductionKey ? "https://tally-tracker.app/sign-up" : undefined;

  return (
    <ClerkProvider 
      publishableKey={publishableKey} 
      proxyUrl={proxyUrl}
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
