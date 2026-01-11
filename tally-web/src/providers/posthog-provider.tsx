"use client";

import { ReactNode, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { getClerkPublishableKey } from "@/lib/clerk-public";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

export function PostHogProvider({ children }: { children: ReactNode }) {
  const clerkPublishableKey = getClerkPublishableKey();

  return clerkPublishableKey ? (
    <PostHogProviderWithClerk>{children}</PostHogProviderWithClerk>
  ) : (
    <PostHogProviderWithoutClerk>{children}</PostHogProviderWithoutClerk>
  );
}

function PostHogProviderWithoutClerk({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!posthogKey) return;

    void import("posthog-js").then(({ default: posthog }) => {
      posthog.init(posthogKey, {
        api_host: posthogHost ?? "https://eu.i.posthog.com",
        person_profiles: "identified_only",
      });
    });
  }, []);

  return <>{children}</>;
}

function PostHogProviderWithClerk({ children }: { children: ReactNode }) {
  const { user } = useUser();

  useEffect(() => {
    if (!posthogKey) return;

    void import("posthog-js").then(({ default: posthog }) => {
      posthog.init(posthogKey, {
        api_host: posthogHost ?? "https://eu.i.posthog.com",
        person_profiles: "identified_only",
      });

      if (user) {
        posthog.identify(user.id, {
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName ?? undefined,
        });
      } else {
        posthog.reset();
      }
    });
  }, [user]);

  return <>{children}</>;
}
