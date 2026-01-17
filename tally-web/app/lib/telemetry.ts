type TelemetryContext = {
  platform: "web";
  env: "development" | "preview" | "production";
  app_version?: string;
  build_number?: string;
  user_id?: string;
  is_signed_in?: boolean;
  session_id: string;
  trace_id?: string;
  span_id?: string;
  request_id?: string;
};

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;
const BUILD_NUMBER = process.env.NEXT_PUBLIC_BUILD_NUMBER;

let sessionId: string | null = null;

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function getSessionId() {
  if (sessionId) return sessionId;
  if (typeof window !== "undefined") {
    const existing = window.sessionStorage.getItem("tally_session_id");
    if (existing) {
      sessionId = existing;
      return existing;
    }
    const created = randomId();
    window.sessionStorage.setItem("tally_session_id", created);
    sessionId = created;
    return created;
  }
  sessionId = randomId();
  return sessionId;
}

function resolveEnv(): TelemetryContext["env"] {
  if (process.env.NODE_ENV === "production") {
    return "production";
  }
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "preview") return "preview";
  return "development";
}

export function createTraceContext() {
  return {
    trace_id: randomId(),
    span_id: randomId(),
    request_id: randomId(),
  };
}

export function buildTelemetryContext(options: {
  userId?: string;
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
    user_id: options.userId,
    is_signed_in: options.isSignedIn,
    session_id: getSessionId(),
    trace_id: options.traceId,
    span_id: options.spanId,
    request_id: options.requestId,
  };
}

export function logWideEvent(
  event: string,
  fields: Record<string, unknown>,
  options: { userId?: string; isSignedIn?: boolean } = {}
) {
  const context = buildTelemetryContext({
    userId: options.userId,
    isSignedIn: options.isSignedIn,
    traceId: fields.trace_id as string | undefined,
    spanId: fields.span_id as string | undefined,
    requestId: fields.request_id as string | undefined,
  });
  const payload = {
    type: "wide_event",
    event,
    timestamp: new Date().toISOString(),
    ...context,
    ...fields,
  };
  console.info(JSON.stringify(payload));
}

export async function captureEvent(
  event: string,
  properties: Record<string, unknown>,
  options: { userId?: string; isSignedIn?: boolean } = {}
) {
  if (!POSTHOG_KEY) return;
  const context = buildTelemetryContext({
    userId: options.userId,
    isSignedIn: options.isSignedIn,
  });
  const distinctId = options.userId || context.session_id;
  const payload = {
    api_key: POSTHOG_KEY,
    event,
    distinct_id: distinctId,
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
    keepalive: true,
  });
}
