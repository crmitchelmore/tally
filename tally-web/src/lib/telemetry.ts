/**
 * Telemetry wrapper for web platform
 *
 * Provides:
 * - PostHog event capture with canonical properties
 * - Structured wide-event logging
 * - OTel trace context propagation
 *
 * Schema: plans/observability/schema.md
 */
import { trace, context, SpanStatusCode, type Span } from "@opentelemetry/api";

// Environment detection
const ENV =
  process.env.VERCEL_ENV ||
  process.env.NODE_ENV ||
  "development";
const APP_VERSION = process.env.npm_package_version || "0.1.0";
const BUILD_NUMBER = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local";

// PostHog config (from env)
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

// Honeycomb config
const HONEYCOMB_API_KEY = process.env.HONEYCOMB_API_KEY;
const HONEYCOMB_DATASET = process.env.HONEYCOMB_DATASET || "tally-web";

/**
 * Canonical event names per observability schema
 */
export type TelemetryEvent =
  | "app_opened"
  | "auth_signed_in"
  | "auth_signed_out"
  | "challenge_created"
  | "challenge_updated"
  | "challenge_archived"
  | "entry_created"
  | "entry_updated"
  | "entry_deleted"
  | "data_export_started"
  | "data_export_completed"
  | "data_import_started"
  | "data_import_completed";

/**
 * Common properties included on every event
 */
export interface CommonProperties {
  platform: "web";
  env: string;
  app_version: string;
  build_number: string;
  user_id?: string;
  is_signed_in: boolean;
  session_id?: string;
  trace_id?: string;
  span_id?: string;
  request_id?: string;
}

/**
 * Domain-specific properties (optional)
 */
export interface DomainProperties {
  challenge_id?: string;
  timeframe_unit?: string;
  target_number?: number;
  entry_id?: string;
  entry_count?: number;
  has_note?: boolean;
  has_sets?: boolean;
  feeling?: string;
}

/**
 * Get common properties for all events
 */
export function getCommonProperties(opts: {
  userId?: string;
  sessionId?: string;
  requestId?: string;
}): CommonProperties {
  const span = trace.getActiveSpan();
  const spanContext = span?.spanContext();

  return {
    platform: "web",
    env: ENV,
    app_version: APP_VERSION,
    build_number: BUILD_NUMBER,
    user_id: opts.userId,
    is_signed_in: !!opts.userId,
    session_id: opts.sessionId,
    trace_id: spanContext?.traceId,
    span_id: spanContext?.spanId,
    request_id: opts.requestId,
  };
}

/**
 * Wide event log envelope for structured logging
 */
export interface WideEvent {
  type: "wide_event";
  event: TelemetryEvent;
  timestamp: string;
  // Common + domain properties spread
  [key: string]: unknown;
}

/**
 * Emit a structured wide event log (canonical log line)
 */
export function logWideEvent(
  event: TelemetryEvent,
  common: CommonProperties,
  domain: DomainProperties = {}
): void {
  const wideEvent: WideEvent = {
    type: "wide_event",
    event,
    timestamp: new Date().toISOString(),
    ...common,
    ...domain,
  };

  // In production, this would go to a log aggregator
  // For now, structured JSON to stdout
  console.log(JSON.stringify(wideEvent));
}

/**
 * Server-side PostHog capture (for API routes)
 */
// PostHog instance (typed loosely for dynamic import compatibility)
let posthogNode: {
  capture: (opts: { distinctId: string; event: string; properties?: Record<string, unknown> }) => void;
} | null = null;

async function getPostHogNode() {
  if (!POSTHOG_KEY) return null;
  if (!posthogNode) {
    const { PostHog } = await import("posthog-node");
    posthogNode = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      flushAt: 10,
      flushInterval: 5000,
    });
  }
  return posthogNode;
}

/**
 * Capture an event server-side (for API routes)
 */
export async function captureEvent(
  event: TelemetryEvent,
  opts: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
  },
  domain: DomainProperties = {}
): Promise<void> {
  const common = getCommonProperties(opts);

  // Log wide event
  logWideEvent(event, common, domain);

  // PostHog capture
  const ph = await getPostHogNode();
  if (ph && opts.userId) {
    ph.capture({
      distinctId: opts.userId,
      event,
      properties: {
        ...common,
        ...domain,
      },
    });
  }
}

/**
 * OTel tracer for API routes
 */
export const tracer = trace.getTracer("tally-web", APP_VERSION);

/**
 * Wrap an async function with a trace span
 */
export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean> = {},
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      // Add attributes
      Object.entries(attributes).forEach(([k, v]) => {
        span.setAttribute(k, v);
      });

      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Generate a request ID for correlation
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Check if observability is enabled
 */
export function isObservabilityEnabled(): boolean {
  return !!(POSTHOG_KEY || HONEYCOMB_API_KEY);
}

/**
 * Export config for debugging
 */
export const telemetryConfig = {
  posthogEnabled: !!POSTHOG_KEY,
  honeycombEnabled: !!HONEYCOMB_API_KEY,
  env: ENV,
  appVersion: APP_VERSION,
  buildNumber: BUILD_NUMBER,
} as const;
