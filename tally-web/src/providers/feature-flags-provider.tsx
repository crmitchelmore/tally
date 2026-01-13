"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getClerkPublishableKey } from "@/lib/clerk-public";

const clientSideId = process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID;

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

// Dynamically import LaunchDarkly only on client side to avoid SSR window errors
let LDProviderComponent: typeof import("launchdarkly-react-client-sdk").LDProvider | null = null;
let useFlagsHook: typeof import("launchdarkly-react-client-sdk").useFlags | null = null;
let useLDClientHook: typeof import("launchdarkly-react-client-sdk").useLDClient | null = null;

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
  // Defer LaunchDarkly initialization to client-side only
  // This prevents SSR errors from the LDProvider accessing window
  const [LDProvider, setLDProvider] = useState<typeof LDProviderComponent>(null);
  
  useEffect(() => {
    // Dynamically import LaunchDarkly SDK only on the client
    import("launchdarkly-react-client-sdk").then((mod) => {
      LDProviderComponent = mod.LDProvider;
      useFlagsHook = mod.useFlags;
      useLDClientHook = mod.useLDClient;
      setLDProvider(() => mod.LDProvider);
    });
  }, []);
  
  if (!LDProvider) {
    // Render children without feature flags during SSR and initial load
    return <>{children}</>;
  }

  const clerkPublishableKey = getClerkPublishableKey();

  return clerkPublishableKey ? (
    <FeatureFlagsProviderWithClerk LDProvider={LDProvider}>{children}</FeatureFlagsProviderWithClerk>
  ) : (
    <FeatureFlagsProviderWithoutClerk LDProvider={LDProvider}>{children}</FeatureFlagsProviderWithoutClerk>
  );
}

interface ProviderWithLDProps extends FeatureFlagsProviderProps {
  LDProvider: typeof import("launchdarkly-react-client-sdk").LDProvider;
}

function FeatureFlagsProviderWithoutClerk({ children, LDProvider }: ProviderWithLDProps) {
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

function FeatureFlagsProviderWithClerk({ children, LDProvider }: ProviderWithLDProps) {
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
  // Use the dynamically imported hook if available
  if (!useFlagsHook) {
    return defaultValue;
  }
  const flags = useFlagsHook();
  return (flags[flagKey] as T) ?? defaultValue;
}

/**
 * Hook to get the LaunchDarkly client for advanced operations.
 */
export function useFeatureFlagsClient() {
  // Use the dynamically imported hook if available
  if (!useLDClientHook) {
    return null;
  }
  return useLDClientHook();
}
