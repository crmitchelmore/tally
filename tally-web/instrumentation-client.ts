// This file is used to configure client-side instrumentation for Next.js.
// It's automatically loaded by Next.js when the app starts on the client.

import * as Sentry from "@sentry/nextjs";
import "./sentry.client.config";

// Export the router transition hook for navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
