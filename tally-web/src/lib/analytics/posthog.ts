// PostHog analytics - client-side only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let posthog: any = null;

async function getPostHog() {
  if (typeof window === 'undefined') return null;
  if (!posthog) {
    const mod = await import('posthog-js');
    posthog = mod.default;
  }
  return posthog;
}

export async function initPostHog() {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  
  const ph = await getPostHog();
  if (!ph) return;
  
  ph.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
  });
}

export async function identifyUser(userId: string, properties?: Record<string, unknown>) {
  const ph = await getPostHog();
  ph?.identify(userId, properties);
}

export async function resetUser() {
  const ph = await getPostHog();
  ph?.reset();
}

async function capture(event: string, properties?: Record<string, unknown>) {
  const ph = await getPostHog();
  ph?.capture(event, properties);
}

export function trackSignUp(method: 'email' | 'google' | 'apple') {
  void capture('user_signed_up', { method });
}

export function trackSignIn(method: 'email' | 'google' | 'apple') {
  void capture('user_signed_in', { method });
}

export function trackSignOut() {
  void capture('user_signed_out');
}

export function trackChallengeCreated(properties: {
  challengeId: string;
  name: string;
  target: number;
  unit: string;
  isPublic: boolean;
}) {
  void capture('challenge_created', properties);
}

export function trackEntryLogged(properties: {
  challengeId: string;
  count: number;
  hasNote: boolean;
}) {
  void capture('entry_logged', properties);
}

export function trackChallengeCompleted(properties: {
  challengeId: string;
  name: string;
  daysToComplete: number;
}) {
  void capture('challenge_completed', properties);
}

export function trackDataExported() {
  void capture('data_exported');
}

export function trackDataImported(properties: {
  challengeCount: number;
  entryCount: number;
}) {
  void capture('data_imported', properties);
}

export function trackPageView(path: string) {
  void capture('$pageview', { $current_url: path });
}

export function trackFeatureUsed(feature: string, properties?: Record<string, unknown>) {
  void capture('feature_used', { feature, ...properties });
}
