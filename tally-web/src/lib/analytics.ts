/**
 * Tally Analytics
 *
 * Provides a unified interface for tracking analytics events across the app.
 * Uses PostHog for event tracking with privacy-first defaults.
 *
 * See docs/ANALYTICS.md for the full event taxonomy.
 */

// Event types following the taxonomy
export type AnalyticsEvent =
  // Auth events
  | { event: "user_signed_up"; properties: { method: "oauth" | "email" } }
  | { event: "user_signed_in"; properties: { method: "oauth" | "email" } }
  | { event: "user_signed_out"; properties: Record<string, never> }
  // Challenge events
  | {
      event: "challenge_created";
      properties: {
        timeframe_unit: string;
        target_number: number;
        is_public: boolean;
      };
    }
  | { event: "challenge_updated"; properties: { fields_changed: string[] } }
  | {
      event: "challenge_archived";
      properties: { total_entries: number; completion_pct: number };
    }
  | { event: "challenge_deleted"; properties: Record<string, never> }
  | {
      event: "challenge_viewed";
      properties: { challenge_id: string; is_own: boolean };
    }
  | { event: "challenge_shared"; properties: { share_method: string } }
  // Entry events
  | {
      event: "entry_created";
      properties: {
        count: number;
        has_note: boolean;
        has_sets: boolean;
        has_feeling: boolean;
      };
    }
  | { event: "entry_updated"; properties: { fields_changed: string[] } }
  | { event: "entry_deleted"; properties: Record<string, never> }
  // Streak/milestone events
  | {
      event: "streak_achieved";
      properties: { streak_days: number; challenge_id: string };
    }
  | {
      event: "milestone_reached";
      properties: { milestone_type: "25%" | "50%" | "75%" | "100%" };
    }
  | { event: "goal_completed"; properties: { days_to_complete: number } }
  // Social events
  | { event: "challenge_followed"; properties: { challenge_id: string } }
  | { event: "challenge_unfollowed"; properties: { challenge_id: string } }
  | { event: "leaderboard_viewed"; properties: Record<string, never> }
  // Navigation
  | { event: "page_viewed"; properties: { path: string; referrer?: string } };

// Standard properties added to every event
interface StandardProperties {
  platform: "web" | "ios" | "android";
  app_version: string;
  experiment_variants?: Record<string, string>;
}

// Get app version from environment or package.json
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";

/**
 * Hash a user ID for privacy
 * Uses a simple hash - in production consider using SHA-256
 */
function hashUserId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `u_${Math.abs(hash).toString(36)}`;
}

/**
 * Analytics singleton
 *
 * Usage:
 * ```
 * import { analytics } from '@/lib/analytics';
 *
 * analytics.track({ event: 'entry_created', properties: { count: 10, ... } });
 * analytics.identify(userId);
 * ```
 */
class Analytics {
  private initialized = false;
  private posthog: typeof import("posthog-js").default | null = null;

  /**
   * Initialize PostHog (call once in app layout)
   */
  async init(): Promise<void> {
    if (this.initialized || typeof window === "undefined") return;

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!posthogKey) {
      console.log("[Analytics] PostHog key not configured, skipping init");
      return;
    }

    try {
      const posthog = (await import("posthog-js")).default;
      posthog.init(posthogKey, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
        // Privacy-first defaults
        disable_session_recording: true,
        capture_pageview: false, // We'll do this manually
        capture_pageleave: false,
        autocapture: false, // Explicit tracking only
        persistence: "localStorage",
        // Don't track during development
        loaded: (ph) => {
          if (process.env.NODE_ENV === "development") {
            ph.opt_out_capturing();
          }
        },
      });

      this.posthog = posthog;
      this.initialized = true;
      console.log("[Analytics] Initialized");
    } catch (error) {
      console.error("[Analytics] Failed to initialize:", error);
    }
  }

  /**
   * Identify the current user (with hashed ID for privacy)
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.posthog) return;

    const hashedId = hashUserId(userId);
    this.posthog.identify(hashedId, {
      platform: "web",
      ...traits,
    });
  }

  /**
   * Clear user identity on sign out
   */
  reset(): void {
    if (!this.posthog) return;
    this.posthog.reset();
  }

  /**
   * Track an analytics event
   */
  track<T extends AnalyticsEvent>(
    { event, properties }: T,
    extraProperties?: Partial<StandardProperties>
  ): void {
    if (!this.posthog) {
      // Log in development for debugging
      if (process.env.NODE_ENV === "development") {
        console.log(`[Analytics] ${event}`, properties);
      }
      return;
    }

    const standardProps: StandardProperties = {
      platform: "web",
      app_version: APP_VERSION,
      ...extraProperties,
    };

    this.posthog.capture(event, {
      ...properties,
      ...standardProps,
    });
  }

  /**
   * Track a page view
   */
  page(path: string, referrer?: string): void {
    this.track({
      event: "page_viewed",
      properties: { path, referrer },
    });
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.initialized && this.posthog !== null;
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Also export types for consumers
export type { StandardProperties };
