// Opt-in smoke test: sends one clearly labelled event to each configured service.
// Run from tally-web with NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_SENTRY_DSN set.
import { randomUUID } from 'node:crypto';
import { PostHog } from 'posthog-node';
import { createRequire } from 'node:module';
const Sentry = createRequire(import.meta.url)('@sentry/nextjs');

const verificationRun = randomUUID();
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (!key || !dsn) throw new Error('Set NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_SENTRY_DSN');
const posthog = new PostHog(key, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
  flushAt: 1, flushInterval: 0, requestTimeout: 5000, fetchRetryCount: 0,
});
await posthog.captureImmediate({
  distinctId: `telemetry-verification-${verificationRun}`,
  event: 'telemetry_verification',
  properties: { verification_run: verificationRun, env: 'verification', platform: 'web', source: 'verification', $process_person_profile: false },
});
await posthog.shutdown();
Sentry.init({ dsn, environment: 'verification', sendDefaultPii: false, tracesSampleRate: 0 });
Sentry.setTag('verification_run', verificationRun);
const eventId = Sentry.captureMessage('Tally telemetry verification', 'info');
if (!await Sentry.flush(5000)) throw new Error('Sentry delivery did not flush within five seconds');
await Sentry.close(1000);
console.log(JSON.stringify({ verificationRun, posthog: 'request completed', sentryEventId: eventId, sentry: 'queue flushed; confirm event in dashboard' }));
