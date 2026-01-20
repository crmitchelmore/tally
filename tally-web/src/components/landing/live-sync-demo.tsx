"use client";

import { useState, useEffect } from "react";

type SyncState = "offline" | "queued" | "syncing" | "synced";

interface DeviceState {
  id: string;
  label: string;
  count: number;
  syncState: SyncState;
}

/**
 * LiveSyncDemo - Shows sync states across simulated devices
 * States: offline, queued, syncing, up-to-date
 * Respects reduced-motion: shows static states without animation
 */
export function LiveSyncDemo() {
  const [devices, setDevices] = useState<DeviceState[]>([
    { id: "phone", label: "Phone", count: 12, syncState: "synced" },
    { id: "desktop", label: "Desktop", count: 12, syncState: "synced" },
  ]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Simulate adding a mark on phone and syncing to desktop
  const handleAddMark = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Step 1: Add mark on phone, show queued
    setDevices((prev) =>
      prev.map((d) =>
        d.id === "phone"
          ? { ...d, count: d.count + 1, syncState: "queued" }
          : { ...d, syncState: "synced" }
      )
    );

    // Step 2: Phone syncing
    setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === "phone" ? { ...d, syncState: "syncing" } : d
        )
      );
    }, 400);

    // Step 3: Desktop receives update
    setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) => ({
          ...d,
          count: d.id === "phone" ? d.count : prev[0].count,
          syncState: d.id === "phone" ? "synced" : "syncing",
        }))
      );
    }, 800);

    // Step 4: All synced
    setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) => ({ ...d, syncState: "synced" }))
      );
      setIsAnimating(false);
    }, 1200);
  };

  // Simulate going offline
  const handleOffline = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setDevices((prev) =>
      prev.map((d) =>
        d.id === "phone" ? { ...d, syncState: "offline" } : d
      )
    );

    // Reconnect after a moment
    setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === "phone" ? { ...d, syncState: "syncing" } : d
        )
      );
    }, 1500);

    setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) => ({ ...d, syncState: "synced" }))
      );
      setIsAnimating(false);
    }, 2000);
  };

  const getSyncLabel = (state: SyncState): string => {
    switch (state) {
      case "offline":
        return "Offline";
      case "queued":
        return "1 pending";
      case "syncing":
        return "Syncing…";
      case "synced":
        return "Up to date";
    }
  };

  const getSyncIcon = (state: SyncState): string => {
    switch (state) {
      case "offline":
        return "○"; // Empty circle
      case "queued":
        return "◔"; // Partially filled
      case "syncing":
        return "◐"; // Half circle
      case "synced":
        return "●"; // Filled circle
    }
  };

  return (
    <section className="live-sync-demo" aria-label="Live sync demonstration">
      <h2 className="sync-demo-heading">Sync everywhere, instantly</h2>
      <p className="sync-demo-subhead">
        Your marks appear across all devices the moment you&apos;re connected.
      </p>

      <div className="sync-demo-devices" role="group" aria-label="Device sync states">
        {devices.map((device) => (
          <div
            key={device.id}
            className={`sync-device sync-device-${device.syncState}`}
            aria-label={`${device.label}: ${device.count} marks, ${getSyncLabel(device.syncState)}`}
          >
            <div className="sync-device-icon" aria-hidden="true">
              {device.id === "phone" ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <line x1="12" y1="18" x2="12" y2="18.01" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              )}
            </div>
            <div className="sync-device-info">
              <span className="sync-device-label">{device.label}</span>
              <span className="sync-device-count">{device.count} marks</span>
            </div>
            <div 
              className={`sync-status sync-status-${device.syncState}`}
              aria-live="polite"
            >
              <span className="sync-status-icon" aria-hidden="true">
                {getSyncIcon(device.syncState)}
              </span>
              <span className="sync-status-label">{getSyncLabel(device.syncState)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tally marks visualization */}
      <div className="sync-tally-visual" aria-hidden="true">
        <div className="sync-tally-group">
          {/* Show 2 complete five-gates (10 marks) */}
          {[0, 1].map((gate) => (
            <div key={gate} className="sync-five-gate">
              <span className="sync-stroke" />
              <span className="sync-stroke" />
              <span className="sync-stroke" />
              <span className="sync-stroke" />
              <span className="sync-slash" />
            </div>
          ))}
          {/* Show remaining strokes */}
          <div className="sync-partial">
            {Array.from({ length: Math.min(devices[0].count - 10, 4) }).map((_, i) => (
              <span 
                key={i} 
                className={`sync-stroke ${i === devices[0].count - 11 && isAnimating ? "sync-stroke-new" : ""}`}
              />
            ))}
            {devices[0].count >= 15 && (
              <span className="sync-slash" />
            )}
          </div>
        </div>
      </div>

      <div className="sync-demo-actions">
        <button
          type="button"
          className="sync-add-btn"
          onClick={handleAddMark}
          disabled={isAnimating}
          aria-label="Add a mark to demonstrate sync"
        >
          <span className="sync-add-icon" aria-hidden="true">+</span>
          Add mark
        </button>
        <button
          type="button"
          className="sync-offline-btn"
          onClick={handleOffline}
          disabled={isAnimating}
          aria-label="Simulate going offline"
        >
          Go offline
        </button>
      </div>

      <p className="sync-demo-note">
        Works offline. Changes sync when reconnected.
      </p>
    </section>
  );
}
