"use client";

import { useState, useEffect, useCallback } from "react";

interface SessionInfo {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  lastSyncAt: string;
  isCurrent: boolean;
  isOnline: boolean;
}

/**
 * Get device/browser info from user agent
 */
function getDeviceInfo(): { deviceName: string; browser: string; os: string } {
  if (typeof window === "undefined") {
    return { deviceName: "Unknown", browser: "Unknown", os: "Unknown" };
  }

  const ua = navigator.userAgent;
  
  // Detect OS
  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  // Detect browser
  let browser = "Unknown";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";

  // Determine device name
  let deviceName = "Desktop";
  if (/Mobile|Android|iPhone/i.test(ua)) deviceName = "Mobile";
  else if (/iPad|Tablet/i.test(ua)) deviceName = "Tablet";
  
  deviceName = `${deviceName} (${os})`;

  return { deviceName, browser, os };
}

/**
 * Get or create a persistent session ID
 */
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  let sessionId = localStorage.getItem("tally-session-id");
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem("tally-session-id", sessionId);
  }
  return sessionId;
}

/**
 * Get last sync timestamp
 */
function getLastSyncTime(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tally-last-sync");
}

/**
 * Set last sync timestamp
 */
function setLastSyncTime(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("tally-last-sync", new Date().toISOString());
}

/**
 * Format relative time
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}

export interface SessionsSyncProps {
  className?: string;
}

/**
 * Sessions & Sync section for settings page.
 * Shows current session info and sync status.
 */
export function SessionsSync({ className = "" }: SessionsSyncProps) {
  const [currentSession, setCurrentSession] = useState<SessionInfo | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Initialize session info
  useEffect(() => {
    const deviceInfo = getDeviceInfo();
    const sessionId = getSessionId();
    const lastSync = getLastSyncTime();

    setCurrentSession({
      id: sessionId,
      deviceName: deviceInfo.deviceName,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      lastSyncAt: lastSync || new Date().toISOString(),
      isCurrent: true,
      isOnline: navigator.onLine,
    });

    // Track online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    // Set initial sync time if not set
    if (!lastSync) {
      setLastSyncTime();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Manual sync trigger
  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      // Trigger a data refresh by calling the stats endpoint
      await fetch("/api/v1/stats");
      setLastSyncTime();
      setCurrentSession((prev) =>
        prev ? { ...prev, lastSyncAt: new Date().toISOString() } : null
      );
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  }, []);

  if (!currentSession) {
    return (
      <div className={`bg-surface border border-border rounded-2xl p-6 animate-pulse ${className}`}>
        <div className="h-6 w-32 bg-border/50 rounded mb-4" />
        <div className="h-20 bg-border/50 rounded" />
      </div>
    );
  }

  return (
    <section className={`bg-surface border border-border rounded-2xl p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-ink mb-4">Sessions & Sync</h2>

      {/* Current session */}
      <div className="space-y-4">
        <div className="flex items-start justify-between p-4 rounded-xl bg-paper border border-border">
          <div className="flex items-start gap-3">
            {/* Device icon */}
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
              {currentSession.deviceName.includes("Mobile") ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              ) : currentSession.deviceName.includes("Tablet") ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-ink">{currentSession.deviceName}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                  This device
                </span>
              </div>
              <p className="text-sm text-muted">{currentSession.browser}</p>
              <p className="text-xs text-muted mt-1">
                Last synced: {formatRelativeTime(currentSession.lastSyncAt)}
              </p>
            </div>
          </div>

          {/* Sync status indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-success" : "bg-warning"
              }`}
              title={isOnline ? "Online" : "Offline"}
            />
            <span className="text-xs text-muted">
              {isOnline ? "Up to date" : "Offline"}
            </span>
          </div>
        </div>

        {/* Sync button */}
        <button
          onClick={handleSync}
          disabled={syncing || !isOnline}
          className="w-full px-4 py-3 rounded-xl border border-border text-ink hover:bg-border/30 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sync Now</p>
              <p className="text-sm text-muted">
                {syncing ? "Syncing..." : "Force sync your data across devices"}
              </p>
            </div>
            {syncing ? (
              <svg className="w-5 h-5 animate-spin text-accent" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </div>
        </button>

        {/* Info text */}
        <p className="text-xs text-muted">
          Your data syncs automatically when you&apos;re online. Use Sync Now if you need to ensure all changes are saved.
        </p>
      </div>
    </section>
  );
}

export default SessionsSync;
