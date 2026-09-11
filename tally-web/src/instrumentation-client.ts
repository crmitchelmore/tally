import * as Sentry from "@sentry/nextjs";
import { isUnsupportedClerkChrome116SyntaxError } from "@/lib/sentry-filter";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  sendDefaultPii: false,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
  beforeSend(event) {
    const userAgent = globalThis.navigator?.userAgent ?? "";
    return isUnsupportedClerkChrome116SyntaxError(event, userAgent) ? null : event;
  },
  integrations: [
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
