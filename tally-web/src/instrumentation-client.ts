import * as Sentry from "@sentry/nextjs";
import { isUnsupportedClerkChrome116SyntaxError } from "@/lib/sentry-filter";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
  beforeSend(event) {
    const userAgent = globalThis.navigator?.userAgent ?? "";
    return isUnsupportedClerkChrome116SyntaxError(event, userAgent) ? null : event;
  },
  integrations: [
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
  ],
});
