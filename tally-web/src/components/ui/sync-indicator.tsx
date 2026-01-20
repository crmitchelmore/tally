"use client";

type SyncState = "offline" | "syncing" | "synced" | "error";

interface SyncIndicatorProps {
  state: SyncState;
  pendingCount?: number;
  className?: string;
}

/**
 * Shows current sync status with clear visual feedback.
 * States: offline, syncing, synced, error
 */
export function SyncIndicator({
  state,
  pendingCount = 0,
  className = "",
}: SyncIndicatorProps) {
  const configs: Record<SyncState, { label: string; color: string; icon: string }> = {
    offline: {
      label: "Offline",
      color: "text-muted",
      icon: "○",
    },
    syncing: {
      label: pendingCount > 0 ? `Syncing ${pendingCount}…` : "Syncing…",
      color: "text-accent",
      icon: "◐",
    },
    synced: {
      label: "Synced",
      color: "text-success",
      icon: "●",
    },
    error: {
      label: "Sync error",
      color: "text-error",
      icon: "◌",
    },
  };

  const config = configs[state];

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 text-xs font-medium
        ${config.color} ${className}
      `}
      role="status"
      aria-live="polite"
    >
      <span
        className={`
          ${state === "syncing" ? "animate-spin" : ""}
        `}
        aria-hidden="true"
      >
        {config.icon}
      </span>
      <span className="sr-only sm:not-sr-only">{config.label}</span>
    </div>
  );
}

export default SyncIndicator;
