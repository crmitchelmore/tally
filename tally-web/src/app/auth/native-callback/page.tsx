"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

/**
 * Native app auth callback page.
 * After Clerk auth completes, this page extracts the JWT and redirects
 * back to the native app with the token via deep link.
 * 
 * Flow:
 * 1. Android app opens /sign-in?redirect_url=/auth/native-callback
 * 2. User signs in via Clerk
 * 3. Clerk redirects to this page
 * 4. This page gets JWT and redirects to tally://auth/callback?token=xxx
 */
export default function NativeCallbackPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    async function handleCallback() {
      if (!isLoaded) return;
      
      if (!isSignedIn) {
        setError("Not signed in. Please sign in first.");
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          setError("Failed to get authentication token");
          return;
        }

        // Get the redirect scheme from URL params or default to tally://
        const params = new URLSearchParams(window.location.search);
        const scheme = params.get("scheme") || "tally";
        
        // Redirect to native app with token
        setRedirecting(true);
        const redirectUrl = `${scheme}://auth/callback?token=${encodeURIComponent(token)}`;
        window.location.href = redirectUrl;
      } catch (err) {
        console.error("Native callback error:", err);
        setError("Failed to complete authentication");
      }
    }

    handleCallback();
  }, [isLoaded, isSignedIn, getToken]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper px-4">
      <div className="text-center">
        {!isLoaded && (
          <>
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-ink">Loading...</p>
          </>
        )}
        
        {isLoaded && !isSignedIn && !error && (
          <>
            <p className="text-ink mb-4">Redirecting to sign in...</p>
            <a href="/sign-in" className="text-accent hover:underline">
              Click here if not redirected
            </a>
          </>
        )}
        
        {redirecting && (
          <>
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-ink">Opening app...</p>
            <p className="text-muted text-sm mt-2">
              If the app doesn&apos;t open, you may need to install it first.
            </p>
          </>
        )}
        
        {error && (
          <>
            <p className="text-red-600 mb-4">{error}</p>
            <a href="/sign-in" className="text-accent hover:underline">
              Try signing in again
            </a>
          </>
        )}
      </div>
    </div>
  );
}
