"use client";

import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

export default function AuthDebugPage() {
  const auth = useAuth();
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

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      }}
    >
      <h1>Auth Debug</h1>
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
      <h2>document.cookie names</h2>
      <pre>{JSON.stringify(cookieNames, null, 2)}</pre>
      <p>Note: HttpOnly cookies will not appear here (that’s expected).</p>
    </div>
  );
}
