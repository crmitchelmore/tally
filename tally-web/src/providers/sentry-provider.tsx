"use client";

import { ReactNode } from "react";
import { useSentryUser } from "@/hooks/use-sentry-user";

interface SentryProviderProps {
  children: ReactNode;
}

/**
 * Provider to sync Clerk user identity with Sentry.
 * Place inside ClerkProvider to have access to user context.
 */
export function SentryProvider({ children }: SentryProviderProps) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

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
