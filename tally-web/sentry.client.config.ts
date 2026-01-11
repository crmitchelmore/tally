// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Release tracking - ties errors to specific deployments
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay (privacy-first defaults)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

  // Enable Sentry logs
  enableLogs: true,

  integrations: [
    Sentry.replayIntegration({
      // Privacy-first: mask all text and block all media
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Environment and release
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,

  // Don't send errors in development unless DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Ignore common non-actionable errors
  ignoreErrors: [
    // Browser extensions
    /^chrome-extension:/,
    /^moz-extension:/,
    // Network errors
    "Network request failed",
    "Failed to fetch",
    "Load failed",
    // ResizeObserver (benign)
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
  ],

  // beforeSend hook to scrub PII
  beforeSend(event) {
    // Remove any email addresses that might leak through
    if (event.user?.email) {
      delete event.user.email;
    }
    if (event.user?.username) {
      delete event.user.username;
    }
    return event;
  },
});
