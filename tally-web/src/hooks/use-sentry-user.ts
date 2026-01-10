"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import * as Sentry from "@sentry/nextjs";

/**
 * Hook to sync Clerk user identity with Sentry.
 * Sets Sentry user context with the Clerk user ID (no PII).
 * Call this in your root layout or app provider.
 */
export function useSentryUser() {
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn && user?.id) {
      // Set Sentry user with ID only (no email/name for privacy)
      Sentry.setUser({ id: user.id });
      Sentry.setTag("app", "web");
    } else {
      // Clear user when signed out
      Sentry.setUser(null);
    }
  }, [isSignedIn, user?.id]);
}
