import posthog from 'posthog-js';

// Initialize PostHog only on client side
export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // We'll handle this manually for SPA
    capture_pageleave: true,
    autocapture: false, // Explicit events only for cleaner data
  });
}

// Set user identity after auth
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.identify(userId, properties);
}

// Clear identity on logout
export function resetUser() {
  if (typeof window === 'undefined') return;
  posthog.reset();
}

// ============================================
// TALLY EVENT TAXONOMY (shared across platforms)
// ============================================

/**
 * Capture: User signed up
 * Fired when a new user completes registration
 */
export function trackSignUp(method: 'email' | 'google' | 'apple') {
  posthog.capture('user_signed_up', { method });
}

/**
 * Capture: User signed in
 */
export function trackSignIn(method: 'email' | 'google' | 'apple') {
  posthog.capture('user_signed_in', { method });
}

/**
 * Capture: User signed out
 */
export function trackSignOut() {
  posthog.capture('user_signed_out');
}

/**
 * Capture: Challenge created
 */
export function trackChallengeCreated(properties: {
  challengeId: string;
  name: string;
  target: number;
  unit: string;
  isPublic: boolean;
}) {
  posthog.capture('challenge_created', properties);
}

/**
 * Capture: Entry logged
 */
export function trackEntryLogged(properties: {
  challengeId: string;
  count: number;
  hasNote: boolean;
}) {
  posthog.capture('entry_logged', properties);
}

/**
 * Capture: Challenge completed (100% progress)
 */
export function trackChallengeCompleted(properties: {
  challengeId: string;
  name: string;
  daysToComplete: number;
}) {
  posthog.capture('challenge_completed', properties);
}

/**
 * Capture: Data exported
 */
export function trackDataExported() {
  posthog.capture('data_exported');
}

/**
 * Capture: Data imported
 */
export function trackDataImported(properties: {
  challengeCount: number;
  entryCount: number;
}) {
  posthog.capture('data_imported', properties);
}

/**
 * Capture: Page view (for SPA navigation)
 */
export function trackPageView(path: string) {
  posthog.capture('$pageview', { $current_url: path });
}

/**
 * Capture: Feature used
 * Generic event for tracking feature engagement
 */
export function trackFeatureUsed(feature: string, properties?: Record<string, unknown>) {
  posthog.capture('feature_used', { feature, ...properties });
}
