/**
 * Telemetry wrapper for web platform
 *
 * Provides:
 * - Wide event logging (canonical log lines per loggingsucks.com)
 * - PostHog event capture with canonical properties
 * - OTel trace context propagation
 * - Tail-sampling for cost control
 *
 * Wide Event Pattern:
 * - One comprehensive event per request per service
 * - Include all context needed for debugging
 * - Tail-sampling: always keep errors/slow, sample healthy traffic
 *
 * Schema: plans/observability/schema.md
 */
import { trace, SpanStatusCode, type Span, type Attributes } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";

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

// Sampling config
const HEALTHY_SAMPLE_RATE = 0.05; // 5% of healthy traffic
const SLOW_REQUEST_THRESHOLD_MS = 2000;

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
  | "data_import_completed"
  | "api_request"; // Canonical request log line

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
 * Request-specific properties for wide events
 */
export interface RequestProperties {
  method?: string;
  path?: string;
  status_code?: number;
  duration_ms?: number;
  outcome?: "success" | "error";
  error?: {
    type: string;
    code?: string;
    message: string;
    retriable?: boolean;
  };
}

/**
 * Wide event log envelope for structured logging
 * Following loggingsucks.com canonical log line pattern
 */
export interface WideEvent {
  type: "wide_event";
  event: TelemetryEvent;
  timestamp: string;
  // All properties spread
  [key: string]: unknown;
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
 * Tail-sampling decision function
 * Per loggingsucks.com: always keep errors/slow, sample healthy traffic
 */
export function shouldSample(event: WideEvent): boolean {
  // Always keep errors (any 4xx/5xx or error field present)
  const statusCode = event.status_code as number | undefined;
  if (statusCode && statusCode >= 400) return true;
  if (event.error) return true;
  if (event.outcome === "error") return true;

  // Always keep slow requests
  if (typeof event.duration_ms === "number" && event.duration_ms > SLOW_REQUEST_THRESHOLD_MS) {
    return true;
  }

  // Random sample healthy traffic
  return Math.random() < HEALTHY_SAMPLE_RATE;
}

/**
 * OTel logger for structured logs to Honeycomb
 */
function getOTelLogger() {
  return logs.getLogger("tally-web", APP_VERSION);
}

/**
 * Emit a structured wide event log (canonical log line)
 * Sends to both stdout and OTel logs API (-> Honeycomb)
 */
export function logWideEvent(
  event: TelemetryEvent,
  common: CommonProperties,
  domain: DomainProperties = {},
  request: RequestProperties = {}
): void {
  const wideEvent: WideEvent = {
    type: "wide_event",
    event,
    timestamp: new Date().toISOString(),
    ...common,
    ...domain,
    ...request,
  };

  // Apply tail-sampling for non-error events
  if (!shouldSample(wideEvent)) {
    return;
  }

  // Structured JSON to stdout (for local dev / Vercel logs)
  console.log(JSON.stringify(wideEvent));

  // Also emit to OTel logs API (-> Honeycomb)
  const logger = getOTelLogger();
  const severity = wideEvent.outcome === "error" || wideEvent.error
    ? SeverityNumber.ERROR
    : SeverityNumber.INFO;

  logger.emit({
    severityNumber: severity,
    severityText: severity === SeverityNumber.ERROR ? "ERROR" : "INFO",
    body: event,
    attributes: wideEvent as unknown as Attributes,
  });
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
  domain: DomainProperties = {},
  request: RequestProperties = {}
): Promise<void> {
  const common = getCommonProperties(opts);

  // Log wide event (with tail-sampling)
  logWideEvent(event, common, domain, request);

  // PostHog capture (always capture for product analytics)
  const ph = await getPostHogNode();
  if (ph && opts.userId) {
    ph.capture({
      distinctId: opts.userId,
      event,
      properties: {
        ...common,
        ...domain,
        ...request,
      },
    });
  }
}

/**
 * Wide event builder for accumulating context during request
 * Following loggingsucks.com pattern: build during request, emit at end
 */
export class WideEventBuilder {
  private event: TelemetryEvent;
  private opts: { userId?: string; sessionId?: string; requestId?: string };
  private domain: DomainProperties = {};
  private request: RequestProperties = {};
  private startTime: number;

  constructor(event: TelemetryEvent, opts: { userId?: string; sessionId?: string; requestId?: string }) {
    this.event = event;
    this.opts = opts;
    this.startTime = Date.now();
  }

  /** Add domain-specific context */
  withDomain(props: DomainProperties): this {
    this.domain = { ...this.domain, ...props };
    return this;
  }

  /** Add request context */
  withRequest(props: Partial<RequestProperties>): this {
    this.request = { ...this.request, ...props };
    return this;
  }

  /** Mark request as successful */
  success(statusCode = 200): this {
    this.request.status_code = statusCode;
    this.request.outcome = "success";
    return this;
  }

  /** Mark request as failed with error details */
  error(err: { type: string; code?: string; message: string; retriable?: boolean }, statusCode = 500): this {
    this.request.status_code = statusCode;
    this.request.outcome = "error";
    this.request.error = err;
    return this;
  }

  /** Emit the wide event (call at end of request) */
  async emit(): Promise<void> {
    this.request.duration_ms = Date.now() - this.startTime;
    await captureEvent(this.event, this.opts, this.domain, this.request);
  }

  /** Synchronous emit for middleware (no PostHog) */
  emitSync(): void {
    this.request.duration_ms = Date.now() - this.startTime;
    const common = getCommonProperties(this.opts);
    logWideEvent(this.event, common, this.domain, this.request);
  }
}

/**
 * Create a wide event builder for a request
 */
export function wideEvent(
  event: TelemetryEvent,
  opts: { userId?: string; sessionId?: string; requestId?: string }
): WideEventBuilder {
  return new WideEventBuilder(event, opts);
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
  honeycombDataset: HONEYCOMB_DATASET,
  env: ENV,
  appVersion: APP_VERSION,
  buildNumber: BUILD_NUMBER,
  healthySampleRate: HEALTHY_SAMPLE_RATE,
  slowRequestThresholdMs: SLOW_REQUEST_THRESHOLD_MS,
} as const;
