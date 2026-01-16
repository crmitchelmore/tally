// PostHog analytics - client-side only
// Use dynamic import to prevent window access during SSR

let posthogModule: typeof import('posthog-js') | null = null;

async function getPostHog() {
  if (typeof window === 'undefined') return null;
  if (!posthogModule) {
    posthogModule = await import('posthog-js');
  }
  return posthogModule.default;
}

// Initialize PostHog only on client side
export async function initPostHog() {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  
  const posthog = await getPostHog();
  if (!posthog) return;
  
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
  });
}

// Set user identity after auth
export async function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const posthog = await getPostHog();
  posthog?.identify(userId, properties);
}

// Clear identity on logout
export async function resetUser() {
  if (typeof window === 'undefined') return;
  const posthog = await getPostHog();
  posthog?.reset();
}

// ============================================
// TALLY EVENT TAXONOMY (shared across platforms)
// ============================================

async function capture(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const posthog = await getPostHog();
  posthog?.capture(event, properties);
}

export function trackSignUp(method: 'email' | 'google' | 'apple') {
  capture('user_signed_up', { method });
}

export function trackSignIn(method: 'email' | 'google' | 'apple') {
  capture('user_signed_in', { method });
}

export function trackSignOut() {
  capture('user_signed_out');
}

export function trackChallengeCreated(properties: {
  challengeId: string;
  name: string;
  target: number;
  unit: string;
  isPublic: boolean;
}) {
  capture('challenge_created', properties);
}

export function trackEntryLogged(properties: {
  challengeId: string;
  count: number;
  hasNote: boolean;
}) {
  capture('entry_logged', properties);
}

export function trackChallengeCompleted(properties: {
  challengeId: string;
  name: string;
  daysToComplete: number;
}) {
  capture('challenge_completed', properties);
}

export function trackDataExported() {
  capture('data_exported');
}

export function trackDataImported(properties: {
  challengeCount: number;
  entryCount: number;
}) {
  capture('data_imported', properties);
}

export function trackPageView(path: string) {
  capture('$pageview', { $current_url: path });
}

export function trackFeatureUsed(feature: string, properties?: Record<string, unknown>) {
  capture('feature_used', { feature, ...properties });
}
