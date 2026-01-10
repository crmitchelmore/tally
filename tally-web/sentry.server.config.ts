// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable Sentry logs
  enableLogs: true,

  // Environment and release
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,

  // Don't send errors in development unless DSN is set
  enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),

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
