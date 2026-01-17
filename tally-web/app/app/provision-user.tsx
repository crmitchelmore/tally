"use client";

import { useEffect, useState } from "react";

type ProvisionState = "idle" | "loading" | "ready" | "error";

export function ProvisionUser() {
  const [status, setStatus] = useState<ProvisionState>("idle");

  useEffect(() => {
    let alive = true;

    const ensureUser = async () => {
      setStatus("loading");
      try {
        const response = await fetch("/api/v1/auth/user", { method: "POST" });
        if (!response.ok) {
          throw new Error("Failed to provision user");
        }
        if (alive) {
          setStatus("ready");
        }
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
