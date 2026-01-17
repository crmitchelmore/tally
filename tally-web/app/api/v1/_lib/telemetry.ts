import {
  context as otelContext,
  createContextKey,
  propagation,
  SpanStatusCode,
  trace,
  type TextMapGetter,
  type TextMapSetter,
} from "@opentelemetry/api";
import { NextResponse } from "next/server";

type TelemetryContext = {
  platform: "web";
  env: "development" | "preview" | "production";
  app_version?: string;
  build_number?: string;
  user_id?: string;
  is_signed_in?: boolean;
  session_id?: string;
  trace_id: string;
  span_id: string;
  request_id: string;
};

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;
const BUILD_NUMBER = process.env.NEXT_PUBLIC_BUILD_NUMBER;
const REQUEST_ID_KEY = createContextKey("tally.request_id");
const tracer = trace.getTracer("tally-web");

const headersGetter: TextMapGetter<Headers> = {
  get(carrier, key) {
    return carrier.get(key) ?? undefined;
  },
  keys(carrier) {
    return Array.from(carrier.keys());
  },
};

const headersSetter: TextMapSetter<Headers> = {
  set(carrier, key, value) {
    carrier.set(key, value);
  },
};

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function resolveEnv(): TelemetryContext["env"] {
  if (process.env.NODE_ENV === "production") {
    return "production";
  }
  if (process.env.VERCEL_ENV === "preview") return "preview";
  return "development";
}

export function createTraceContext() {
  return {
    trace_id: randomId(),
    span_id: randomId(),
    request_id: randomId(),
  };
}

export function getActiveTraceContext() {
  const spanContext = trace.getSpan(otelContext.active())?.spanContext();
  const requestId = otelContext.active().getValue(REQUEST_ID_KEY) as string | undefined;
  if (!spanContext && !requestId) return null;
  return {
    trace_id: spanContext?.traceId ?? randomId(),
    span_id: spanContext?.spanId ?? randomId(),
    request_id: requestId ?? randomId(),
  };
}

export function applyTraceHeaders(response: NextResponse) {
  const traceContext = getActiveTraceContext();
  if (!traceContext) return response;
  response.headers.set("x-trace-id", traceContext.trace_id);
  response.headers.set("x-span-id", traceContext.span_id);
  response.headers.set("x-request-id", traceContext.request_id);
  propagation.inject(otelContext.active(), response.headers, headersSetter);
  return response;
}

export async function withApiTrace<T>(
  request: Request | null,
  spanName: string,
  handler: () => Promise<T>
) {
  const extracted = request
    ? propagation.extract(otelContext.active(), request.headers, headersGetter)
    : otelContext.active();
  const requestId = randomId();
  const span = tracer.startSpan(
    spanName,
    {
      attributes: {
        "http.method": request?.method,
        "http.route": request ? new URL(request.url).pathname : undefined,
      },
    },
    extracted
  );
  const ctxWithSpan = trace.setSpan(extracted, span);
  const ctxWithRequestId = ctxWithSpan.setValue(REQUEST_ID_KEY, requestId);
  return otelContext.with(ctxWithRequestId, async () => {
    try {
      return await handler();
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}

export function buildTelemetryContext(options: {
  userId?: string | null;
  isSignedIn?: boolean;
  traceId?: string;
  spanId?: string;
  requestId?: string;
} = {}): TelemetryContext {
  return {
    platform: "web",
    env: resolveEnv(),
    app_version: APP_VERSION,
    build_number: BUILD_NUMBER,
    user_id: options.userId ?? undefined,
    is_signed_in: options.isSignedIn,
    session_id: options.userId ?? undefined,
    trace_id: options.traceId ?? randomId(),
    span_id: options.spanId ?? randomId(),
    request_id: options.requestId ?? randomId(),
  };
}

export async function captureEvent(
  event: string,
  properties: Record<string, unknown>,
  context: TelemetryContext
) {
  if (!POSTHOG_KEY) return;
  const payload = {
    api_key: POSTHOG_KEY,
    event,
    distinct_id: context.user_id ?? context.request_id,
    properties: {
      ...context,
      ...properties,
    },
    timestamp: new Date().toISOString(),
  };
  await fetch(`${POSTHOG_HOST.replace(/\/$/, "")}/capture`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function logWideEvent(event: string, fields: Record<string, unknown>, context: TelemetryContext) {
  const payload = {
    type: "wide_event",
    event,
    timestamp: new Date().toISOString(),
    ...context,
    ...fields,
  };
  console.info(JSON.stringify(payload));
}

export function jsonOkWithTelemetry(
  request: Request | null,
  data: unknown,
  options: {
    status?: number;
    userId?: string | null;
    event?: string;
    properties?: Record<string, unknown>;
  } = {}
) {
  const traceContext = getActiveTraceContext() ?? createTraceContext();
  const context = buildTelemetryContext({
    userId: options.userId,
    isSignedIn: Boolean(options.userId),
    traceId: traceContext.trace_id,
    spanId: traceContext.span_id,
    requestId: traceContext.request_id,
  });
  if (options.event) {
    void captureEvent(options.event, options.properties ?? {}, context);
    logWideEvent(options.event, options.properties ?? {}, context);
  }
  const response = NextResponse.json(data, { status: options.status ?? 200 });
  return applyTraceHeaders(response);
}
