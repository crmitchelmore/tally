"use client";

/**
 * PostHog client-side provider
 *
 * Wraps the app with PostHog for client-side analytics.
 * Events use the canonical schema from plans/observability/schema.md.
 */
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";
import type { ReactNode } from "react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

// Environment info for common properties
const ENV =
  process.env.NEXT_PUBLIC_VERCEL_ENV ||
  process.env.NODE_ENV ||
  "development";
const APP_VERSION = "0.1.0";
const BUILD_NUMBER =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local";

// Initialize PostHog on client
if (typeof window !== "undefined" && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // We'll handle this manually for SPA navigation
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    autocapture: false, // Explicit events only per schema
    // Respect user privacy preferences
    respect_dnt: true,
    // Sampling for cost control (keep 100% for now, can reduce later)
    // sample_rate: 1.0,
  });
}

/**
 * Common properties for all client events
 */
function getCommonProperties() {
  return {
    platform: "web" as const,
    env: ENV,
    app_version: APP_VERSION,
    build_number: BUILD_NUMBER,
  };
}

/**
 * Canonical event types
 */
export type ClientTelemetryEvent =
  | "app_opened"
  | "auth_signed_in"
  | "auth_signed_out"
  | "challenge_created"
  | "challenge_updated"
  | "challenge_archived"
  | "entry_created"
  | "entry_updated"
  | "entry_deleted"
  | "data_export_started"
  | "data_export_completed"
  | "data_import_started"
  | "data_import_completed";

/**
 * Capture a client-side event with common properties
 */
export function captureClientEvent(
  event: ClientTelemetryEvent,
  properties: Record<string, unknown> = {}
) {
  if (!POSTHOG_KEY) return;

  posthog.capture(event, {
    ...getCommonProperties(),
    ...properties,
  });
}

/**
 * Identify user after sign-in
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;

  posthog.identify(userId, {
    ...getCommonProperties(),
    ...traits,
  });
}

/**
 * Reset user on sign-out
 */
export function resetUser() {
  if (!POSTHOG_KEY) return;

  posthog.reset();
}

/**
 * PostHog Provider component
 */
export function TelemetryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Capture app_opened on mount
    if (POSTHOG_KEY) {
      captureClientEvent("app_opened");
    }
  }, []);

  if (!POSTHOG_KEY) {
    // No PostHog key, just render children
    return <>{children}</>;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
