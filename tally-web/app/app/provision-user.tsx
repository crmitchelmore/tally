"use client";

import { useEffect, useState } from "react";
import { captureEvent, logWideEvent } from "../lib/telemetry";

type ProvisionState = "idle" | "loading" | "ready" | "error";

export function ProvisionUser() {
  const [status, setStatus] = useState<ProvisionState>("idle");

  useEffect(() => {
    let alive = true;

    const ensureUser = async () => {
      setStatus("loading");
      const startedAt = Date.now();
      try {
        const response = await fetch("/api/v1/auth/user", { method: "POST" });
        if (!response.ok) {
          throw new Error("Failed to provision user");
        }
        const payload = (await response.json()) as { userId?: string };
        if (alive) {
          setStatus("ready");
        }
        await captureEvent(
          "auth_signed_in",
          { duration_ms: Date.now() - startedAt },
          { userId: payload.userId, isSignedIn: true }
        );
        logWideEvent("auth_signed_in", {
          duration_ms: Date.now() - startedAt,
          user_id: payload.userId,
          is_signed_in: true,
        });
      } catch {
        if (alive) {
          setStatus("error");
        }
      }
    };

    void ensureUser();
    return () => {
      alive = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <p style={{ margin: 0, color: "#6b6b6b", fontSize: "14px" }}>
        Syncing your account…
      </p>
    );
  }

  if (status === "error") {
    return (
      <p style={{ margin: 0, color: "#b21f24", fontSize: "14px" }}>
        We could not sync your account yet. Refresh to try again.
      </p>
    );
  }

  return (
    <p style={{ margin: 0, color: "#6b6b6b", fontSize: "14px" }}>
      Account synced.
    </p>
  );
}
