"use client";

import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getClerkPublishableKey } from "@/lib/clerk-public";

const clientSideId = process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID;

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

// Types for LaunchDarkly hooks
type LDFlags = Record<string, unknown>;
type LDClient = ReturnType<typeof import("launchdarkly-react-client-sdk").useLDClient> | null;

// Context to expose LaunchDarkly state without conditional hook calls
interface FeatureFlagsContextValue {
  flags: LDFlags;
  client: LDClient;
  isLoaded: boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  flags: {},
  client: null,
  isLoaded: false,
});

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
  const [LDProvider, setLDProvider] = useState<typeof import("launchdarkly-react-client-sdk").LDProvider | null>(null);
  
  useEffect(() => {
    // Dynamically import LaunchDarkly SDK only on the client
    import("launchdarkly-react-client-sdk").then((mod) => {
      setLDProvider(() => mod.LDProvider);
    });
  }, []);
  
  if (!LDProvider) {
    // Render children without feature flags during SSR and initial load
    return (
      <FeatureFlagsContext.Provider value={{ flags: {}, client: null, isLoaded: false }}>
        {children}
      </FeatureFlagsContext.Provider>
    );
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

  if (!clientSideId) {
    return (
      <FeatureFlagsContext.Provider value={{ flags: {}, client: null, isLoaded: false }}>
        {children}
      </FeatureFlagsContext.Provider>
    );
  }

  return (
    <LDProvider
      clientSideID={clientSideId}
      context={ldContext}
      options={{
        bootstrap: "localStorage",
      }}
    >
      <LDContextBridge>{children}</LDContextBridge>
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

  if (!clientSideId) {
    return (
      <FeatureFlagsContext.Provider value={{ flags: {}, client: null, isLoaded: false }}>
        {children}
      </FeatureFlagsContext.Provider>
    );
  }

  return (
    <LDProvider
      clientSideID={clientSideId}
      context={ldContext}
      options={{
        bootstrap: "localStorage",
      }}
    >
      <LDContextBridge>{children}</LDContextBridge>
    </LDProvider>
  );
}

/**
 * Bridge component that runs inside LDProvider to access LD hooks
 * and expose them via our context (avoiding conditional hook calls)
 */
function LDContextBridge({ children }: { children: ReactNode }) {
  const [contextValue, setContextValue] = useState<FeatureFlagsContextValue>({
    flags: {},
    client: null,
    isLoaded: false,
  });

  useEffect(() => {
    // Dynamically import the hooks inside the LDProvider tree
    import("launchdarkly-react-client-sdk").then(() => {
      // Mark as loaded once SDK is available
      setContextValue((prev) => ({ ...prev, isLoaded: true }));
    });
  }, []);

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      {contextValue.isLoaded ? <LDHooksBridge setContextValue={setContextValue}>{children}</LDHooksBridge> : children}
    </FeatureFlagsContext.Provider>
  );
}

/**
 * Inner bridge that actually calls the LD hooks (always renders inside LDProvider)
 */
function LDHooksBridge({ 
  children, 
  setContextValue 
}: { 
  children: ReactNode; 
  setContextValue: React.Dispatch<React.SetStateAction<FeatureFlagsContextValue>>;
}) {
  const [LDHooks, setLDHooks] = useState<{
    useFlags: typeof import("launchdarkly-react-client-sdk").useFlags;
    useLDClient: typeof import("launchdarkly-react-client-sdk").useLDClient;
  } | null>(null);

  useEffect(() => {
    import("launchdarkly-react-client-sdk").then((mod) => {
      setLDHooks({ useFlags: mod.useFlags, useLDClient: mod.useLDClient });
    });
  }, []);

  if (!LDHooks) {
    return <>{children}</>;
  }

  return (
    <LDHooksConsumer LDHooks={LDHooks} setContextValue={setContextValue}>
      {children}
    </LDHooksConsumer>
  );
}

/**
 * Component that actually calls the LD hooks unconditionally
 */
function LDHooksConsumer({
  children,
  LDHooks,
  setContextValue,
}: {
  children: ReactNode;
  LDHooks: {
    useFlags: typeof import("launchdarkly-react-client-sdk").useFlags;
    useLDClient: typeof import("launchdarkly-react-client-sdk").useLDClient;
  };
  setContextValue: React.Dispatch<React.SetStateAction<FeatureFlagsContextValue>>;
}) {
  // These hooks are always called unconditionally
  const flags = LDHooks.useFlags();
  const client = LDHooks.useLDClient();

  useEffect(() => {
    setContextValue({ flags, client, isLoaded: true });
  }, [flags, client, setContextValue]);

  return <>{children}</>;
}

/**
 * Hook to get a specific feature flag value.
 * Returns the flag value or the provided default if not available.
 */
export function useFlag<T>(flagKey: string, defaultValue: T): T {
  const { flags, isLoaded } = useContext(FeatureFlagsContext);
  if (!isLoaded) {
    return defaultValue;
  }
  return (flags[flagKey] as T) ?? defaultValue;
}

/**
 * Hook to get the LaunchDarkly client for advanced operations.
 */
export function useFeatureFlagsClient() {
  const { client } = useContext(FeatureFlagsContext);
  return client;
}
