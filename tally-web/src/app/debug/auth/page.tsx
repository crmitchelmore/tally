"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import type { ClerkProbe } from "./client-info";

export default function AuthDebugPage() {
  const auth = useAuth();
  const [probe, setProbe] = useState<ClerkProbe | null>(null);

  const cookieNames = useMemo(() => {
    try {
      return document.cookie
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .filter(Boolean);
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchJson = async (path: string) => {
      const res = await fetch(path, { credentials: "include" });
      const contentType = res.headers.get("content-type") || "";
      const raw = contentType.includes("application/json") ? await res.json() : await res.text();
      return {
        status: res.status,
        body:
          typeof raw === "string"
            ? raw.slice(0, 500)
            : (raw as unknown),
      };
    };

    void (async () => {
      try {
        const w = window as unknown as { Clerk?: { loaded?: boolean; version?: string; client?: unknown } };

        const resourceUrls = performance
          .getEntriesByType("resource")
          .map((e) => ("name" in e ? String((e as PerformanceResourceTiming).name) : ""))
          .filter((u) => u.includes("__clerk") || u.includes("clerk"))
          .slice(0, 25);

        const health = await fetchJson("/__clerk/v1/health");
        const client = await fetchJson("/__clerk/v1/client");
        const environment = await fetchJson("/__clerk/v1/environment");

        type EnvironmentBody = {
          display_config?: {
            instance_environment_type?: unknown;
            clerk_js_version?: unknown;
            sign_in_url?: unknown;
            sign_up_url?: unknown;
            after_sign_in_url?: unknown;
          };
        };

        type ClientBody = {
          response?: {
            sessions?: unknown[];
            last_active_session_id?: unknown;
          };
        };

        const envBody: EnvironmentBody | null =
          environment.body && typeof environment.body === "object"
            ? (environment.body as EnvironmentBody)
            : null;

        const clientBody: ClientBody | null =
          client.body && typeof client.body === "object" ? (client.body as ClientBody) : null;

        const nextProbe: ClerkProbe = {
          url: window.location.href,
          userAgent: navigator.userAgent,
          typeofWindowClerk: typeof w.Clerk,
          clerkLoaded: w.Clerk ? Boolean(w.Clerk.loaded) : null,
          clerkVersion: w.Clerk?.version ?? null,
          resourceUrls,
          health: {
            status: health.status,
            body: health.body,
          },
          client: {
            status: client.status,
            body: clientBody
              ? {
                  sessionsCount: clientBody?.response?.sessions?.length ?? null,
                  lastActiveSessionId: clientBody?.response?.last_active_session_id ?? null,
                }
              : client.body,
          },
          environment: {
            status: environment.status,
            body: envBody
              ? {
                  instanceEnvironmentType: envBody?.display_config?.instance_environment_type,
                  clerkJsVersion: envBody?.display_config?.clerk_js_version,
                  signInUrl: envBody?.display_config?.sign_in_url,
                  signUpUrl: envBody?.display_config?.sign_up_url,
                  afterSignInUrl: envBody?.display_config?.after_sign_in_url,
                }
              : environment.body,
          },
        };

        if (!cancelled) setProbe(nextProbe);
      } catch {
        if (!cancelled)
          setProbe({
            url: typeof window !== "undefined" ? window.location.href : "(no-window)",
          });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      }}
    >
      <h1>Auth Debug</h1>
      <h2>Clerk hook state</h2>
      <pre>
        {JSON.stringify(
          {
            url: typeof window !== "undefined" ? window.location.href : "(no-window)",
            isLoaded: auth.isLoaded,
            isSignedIn: auth.isSignedIn,
            userId: auth.userId,
            sessionId: auth.sessionId,
          },
          null,
          2
        )}
      </pre>

      <h2>Client probe</h2>
      <pre>{JSON.stringify(probe, null, 2)}</pre>

      <h2>document.cookie names</h2>
      <pre>{JSON.stringify(cookieNames, null, 2)}</pre>
      <p>Note: HttpOnly cookies will not appear here (that’s expected).</p>
    </div>
  );
}
