/**
 * Sentry-like error capture for Convex.
 * 
 * Convex actions run in a sandboxed environment where we can't use the full
 * Sentry Node SDK. Instead, we capture errors and send them via the Sentry
 * envelope API directly.
 * 
 * For queries/mutations (which run in a more restricted environment), errors
 * should be caught and logged, then re-thrown.
 */

const SENTRY_DSN = process.env.SENTRY_DSN;

interface SentryEvent {
  event_id: string;
  timestamp: string;
  platform: string;
  environment?: string;
  release?: string;
  tags?: Record<string, string>;
  exception?: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: Array<{
          filename?: string;
          function?: string;
          lineno?: number;
          colno?: number;
        }>;
      };
    }>;
  };
  extra?: Record<string, unknown>;
}

function generateEventId(): string {
  // Generate a random 32-character hex string
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseDsn(dsn: string): { publicKey: string; host: string; projectId: string } | null {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const host = url.host;
    const projectId = url.pathname.slice(1);
    return { publicKey, host, projectId };
  } catch {
    return null;
  }
}

function parseStackTrace(stack?: string): SentryEvent["exception"] {
  if (!stack) return undefined;

  const lines = stack.split("\n");
  const frames: Array<{
    filename?: string;
    function?: string;
    lineno?: number;
    colno?: number;
  }> = [];

  for (const line of lines.slice(1)) {
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      frames.push({
        function: match[1],
        filename: match[2],
        lineno: parseInt(match[3], 10),
        colno: parseInt(match[4], 10),
      });
    }
  }

  return {
    values: [
      {
        type: lines[0]?.split(":")[0] || "Error",
        value: lines[0]?.split(":").slice(1).join(":").trim() || "Unknown error",
        stacktrace: frames.length > 0 ? { frames: frames.reverse() } : undefined,
      },
    ],
  };
}

/**
 * Capture an exception and send it to Sentry.
 * Safe to call even if Sentry is not configured (will no-op).
 */
export async function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): Promise<string | null> {
  if (!SENTRY_DSN) {
    console.error("[Sentry disabled] Error captured:", error.message);
    return null;
  }

  const parsed = parseDsn(SENTRY_DSN);
  if (!parsed) {
    console.error("[Sentry] Invalid DSN");
    return null;
  }

  const eventId = generateEventId();
  const event: SentryEvent = {
    event_id: eventId,
    timestamp: new Date().toISOString(),
    platform: "node",
    environment: process.env.SENTRY_ENVIRONMENT || "development",
    tags: {
      app: "convex",
      ...context?.tags,
    },
    exception: parseStackTrace(error.stack),
    extra: context?.extra,
  };

  // Override exception values if we have better info
  if (event.exception?.values[0]) {
    event.exception.values[0].type = error.name || "Error";
    event.exception.values[0].value = error.message || "Unknown error";
  }

  const envelopeUrl = `https://${parsed.host}/api/${parsed.projectId}/envelope/`;
  const envelope = [
    JSON.stringify({
      event_id: eventId,
      sent_at: new Date().toISOString(),
      dsn: SENTRY_DSN,
    }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");

  try {
    const response = await fetch(envelopeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=convex-sentry/1.0.0, sentry_key=${parsed.publicKey}`,
      },
      body: envelope,
    });

    if (!response.ok) {
      console.error(`[Sentry] Failed to send event: ${response.status}`);
      return null;
    }

    return eventId;
  } catch (e) {
    console.error("[Sentry] Failed to send event:", e);
    return null;
  }
}

/**
 * Wrap an async function to capture any errors thrown.
 */
export function withSentry<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: {
    action?: string;
    tags?: Record<string, string>;
  }
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        await captureException(error, {
          tags: {
            action: context?.action || fn.name || "unknown",
            ...context?.tags,
          },
          extra: {
            args: args.length > 0 ? args : undefined,
          },
        });
      }
      throw error;
    }
  };
}
