"use client";

import { ReactNode, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { LDProvider, useLDClient, useFlags } from "launchdarkly-react-client-sdk";
import { getClerkPublishableKey } from "@/lib/clerk-public";

const clientSideId = process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID;

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

/**
 * FeatureFlagsProvider wraps the LaunchDarkly React SDK.
 * It automatically identifies the user based on Clerk authentication.
 *
 * Context attributes follow the strategy in launchdarkly.md:
 * - key: clerkId (authenticated) or anonymous session
 * - platform: "web"
 * - env: derived from deployment URL
 */
export function FeatureFlagsProvider({ children }: FeatureFlagsProviderProps) {
  const clerkPublishableKey = getClerkPublishableKey();

  return clerkPublishableKey ? (
    <FeatureFlagsProviderWithClerk>{children}</FeatureFlagsProviderWithClerk>
  ) : (
    <FeatureFlagsProviderWithoutClerk>{children}</FeatureFlagsProviderWithoutClerk>
  );
}

function FeatureFlagsProviderWithoutClerk({ children }: FeatureFlagsProviderProps) {
  const ldContext = useMemo(() => {
    const env =
      typeof window !== "undefined"
        ? window.location.hostname.includes("localhost")
          ? "dev"
          : window.location.hostname.includes("vercel.app")
            ? "preview"
            : "prod"
        : "dev";

    return {
      kind: "user" as const,
      key: "anonymous",
      anonymous: true,
      platform: "web",
      env,
    };
  }, []);

  if (!clientSideId) return <>{children}</>;

  return (
    <LDProvider
      clientSideID={clientSideId}
      context={ldContext}
      options={{
        bootstrap: "localStorage",
      }}
    >
      {children}
    </LDProvider>
  );
}

function FeatureFlagsProviderWithClerk({ children }: FeatureFlagsProviderProps) {
  const { user } = useUser();

  const ldContext = useMemo(() => {
    const env =
      typeof window !== "undefined"
        ? window.location.hostname.includes("localhost")
          ? "dev"
          : window.location.hostname.includes("vercel.app")
            ? "preview"
            : "prod"
        : "dev";

    if (user) {
      return {
        kind: "user" as const,
        key: user.id,
        name: user.fullName ?? undefined,
        email: user.primaryEmailAddress?.emailAddress,
        anonymous: false,
        platform: "web",
        env,
      };
    }

    return {
      kind: "user" as const,
      key: "anonymous",
      anonymous: true,
      platform: "web",
      env,
    };
  }, [user]);

  if (!clientSideId) return <>{children}</>;

  return (
    <LDProvider
      clientSideID={clientSideId}
      context={ldContext}
      options={{
        bootstrap: "localStorage",
      }}
    >
      {children}
    </LDProvider>
  );
}

/**
 * Hook to get a specific feature flag value.
 * Returns the flag value or the provided default if not available.
 */
export function useFlag<T>(flagKey: string, defaultValue: T): T {
  const flags = useFlags();
  return (flags[flagKey] as T) ?? defaultValue;
}

/**
 * Hook to get the LaunchDarkly client for advanced operations.
 */
export function useFeatureFlagsClient() {
  return useLDClient();
}
