"use client";

import { ReactNode } from "react";
import { getClerkPublishableKey } from "@/lib/clerk-public";
import { useSentryUser } from "@/hooks/use-sentry-user";

interface SentryProviderProps {
  children: ReactNode;
}

/**
 * Provider to sync Clerk user identity with Sentry.
 * Place inside ClerkProvider to have access to user context.
 */
export function SentryProvider({ children }: SentryProviderProps) {
  const clerkPublishableKey = getClerkPublishableKey();

  return clerkPublishableKey ? (
    <SentryProviderWithClerk>{children}</SentryProviderWithClerk>
  ) : (
    <>{children}</>
  );
}

function SentryProviderWithClerk({ children }: SentryProviderProps) {
  useSentryUser();
  return <>{children}</>;
}
