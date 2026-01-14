# Tally Observability Guide

This document describes the observability stack across all Tally platforms (web, iOS, Android).

## Overview

| Component | Purpose | Web | iOS | Android |
|-----------|---------|-----|-----|---------|
| **Sentry** | Error tracking, performance monitoring | ✅ | ✅ | ✅ |
| **PostHog** | Product analytics, user tracking | ✅ | ✅ | ✅ |
| **OpenTelemetry** | Distributed tracing | ✅ | ✅ | ✅ |
| **TallyLogger** | Structured logging (wide events) | ✅ | ✅ | ✅ |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interaction                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │   Web    │    │   iOS    │    │ Android  │
    │ Next.js  │    │  Swift   │    │  Kotlin  │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         └───────────────┴───────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    ▼                    ▼                    ▼
┌────────┐          ┌─────────┐         ┌──────────┐
│ Sentry │          │ PostHog │         │ Grafana  │
│ Errors │          │Analytics│         │  Cloud   │
└────────┘          └─────────┘         │  (OTel)  │
                                        └──────────┘
```

## Sentry (Error Tracking)

### Configuration

All platforms use consistent settings:

| Setting | Value | Notes |
|---------|-------|-------|
| Traces sample rate | 10% | Performance monitoring |
| PII scrubbing | email, username | Privacy first |
| Auto session tracking | enabled | Crash-free metrics |
| Release tracking | version+build | For regression tracking |

### Usage

**Web:**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.captureException(error, {
  extra: { userId: hashedId, context: "payment" }
});
```

**iOS:**
```swift
import Sentry

SentrySDK.capture(error: error)
TallyAnalytics.shared.captureError(error, context: ["key": value])
```

**Android:**
```kotlin
import io.sentry.Sentry

Sentry.captureException(error)
TallyAnalytics.captureException(error, mapOf("key" to value))
```

## PostHog (Analytics)

See `docs/ANALYTICS.md` for the full event taxonomy.

### Key Principles

1. **Privacy first**: Only hashed user IDs, no PII
2. **Explicit tracking**: No auto-capture, manual events only
3. **Consistent events**: Same event names across all platforms
4. **Platform tag**: Every event includes `platform: "web" | "ios" | "android"`

### Usage

**Web:**
```typescript
import { analytics } from "@/lib/analytics";

analytics.track({
  event: "entry_created",
  properties: { count: 10, has_note: true }
});
```

**iOS:**
```swift
TallyAnalytics.shared.track("entry_created", properties: [
  "count": 10,
  "has_note": true
])
```

**Android:**
```kotlin
TallyAnalytics.track("entry_created", mapOf(
  "count" to 10,
  "has_note" to true
))
```

## OpenTelemetry (Distributed Tracing)

Traces are exported to Grafana Cloud via OTLP HTTP.

### Configuration

| Setting | Value |
|---------|-------|
| Endpoint | `OTEL_EXPORTER_OTLP_ENDPOINT` |
| Auth | Basic (instance_id:token) |
| Instance ID | 1491410 (hardcoded) |
| Token | `GRAFANA_CLOUD_OTLP_TOKEN` |

### Resource Attributes

All spans include:
- `service.name`: tally-web, tally-ios, tally-android
- `service.namespace`: tally
- `deployment.environment`: development/production
- `service.version`: app version
- `os.type`, `os.name`, `os.version`

### Usage

**Web:**
```typescript
// Handled by otel.node.ts auto-instrumentation
```

**iOS:**
```swift
TallyTelemetry.shared.trace(
  name: "fetchChallenges",
  kind: .client,
  attributes: ["count": .int(10)]
) {
  try await api.fetchChallenges()
}
```

**Android:**
```kotlin
TallyTelemetry.trace(
  name = "fetchChallenges",
  kind = SpanKind.CLIENT,
  attributes = mapOf("count" to 10L)
) {
  api.fetchChallenges()
}
```

## TallyLogger (Structured Logging)

Wide-event / canonical log lines with correlation and context.

### Log Levels

| Level | Use Case |
|-------|----------|
| `debug` | Development only, verbose debugging |
| `info` | Normal operations, canonical log lines |
| `warn` | Recoverable issues, degraded state |
| `error` | Failures, automatically reported to Sentry |

### Log Context

Every log can include:

```typescript
{
  // Correlation
  traceId?: string;
  spanId?: string;
  requestId?: string;
  
  // User (hashed only)
  userId?: string;
  
  // Operation
  operation?: string;
  duration_ms?: number;
  
  // Error
  error?: Error;
  
  // Custom
  [key: string]: any;
}
```

### Usage

**Web:**
```typescript
import { logger } from "@/lib/logger";

// Simple log
logger.info("User signed in", { userId: "u_abc123" });

// Wide event (canonical log line)
logger.info("api.request.completed", {
  operation: "createChallenge",
  duration_ms: 150,
  userId: "u_abc123",
  statusCode: 200,
});

// Error with context
logger.error("Failed to create entry", {
  error: err,
  userId: "u_abc123",
  challengeId: "ch_xyz",
});

// Child logger with preset context
const reqLogger = logger.child({ requestId: "req_123", userId: "u_abc" });
reqLogger.info("Processing request");
```

**iOS:**
```swift
import TallyCore

// Simple log
TallyLogger.shared.info("User signed in", context: LogContext(userId: "u_abc123"))

// Wide event
TallyLogger.shared.info("api.request.completed", context: LogContext(
  operation: "createChallenge",
  durationMs: 150,
  userId: "u_abc123",
  extras: ["statusCode": 200]
))

// Error with context
TallyLogger.shared.error("Failed to create entry", context: LogContext(
  error: err,
  userId: "u_abc123",
  extras: ["challengeId": "ch_xyz"]
))

// Child logger
let reqLogger = TallyLogger.shared.child(context: LogContext(
  requestId: "req_123",
  userId: "u_abc"
))
reqLogger.info("Processing request")
```

**Android:**
```kotlin
import app.tally.observability.TallyLogger
import app.tally.observability.LogContext

// Simple log
TallyLogger.info("User signed in", LogContext(userId = "u_abc123"))

// Wide event
TallyLogger.info("api.request.completed", LogContext(
  operation = "createChallenge",
  durationMs = 150L,
  userId = "u_abc123",
  extras = mapOf("statusCode" to 200)
))

// Error with context
TallyLogger.error("Failed to create entry", LogContext(
  error = ex,
  userId = "u_abc123",
  extras = mapOf("challengeId" to "ch_xyz")
))

// Child logger
val reqLogger = TallyLogger.child(LogContext(
  requestId = "req_123",
  userId = "u_abc"
))
reqLogger.info("Processing request")
```

## Privacy

### DO collect:
- Hashed user IDs (`u_` prefix)
- Feature usage events
- Performance metrics
- Error events and stack traces
- Device info (OS version, device model)

### DO NOT collect:
- Email addresses
- Full names
- Raw user IDs (always hash)
- IP addresses (configure services to strip)
- Passwords or tokens

### PII Stripping

All loggers automatically strip these fields:
- `email`
- `password`
- `token`
- `secret`
- `apiKey`

## Environment Variables

| Variable | Purpose | Where Used |
|----------|---------|------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog API key | Web |
| `POSTHOG_API_KEY` | PostHog API key | iOS, Android |
| `SENTRY_DSN` | Sentry project DSN | All |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Grafana Cloud endpoint | All |
| `GRAFANA_CLOUD_OTLP_TOKEN` | Grafana auth token | All |

## Dashboards

### Sentry
- Error rates by platform
- Crash-free user rate
- Performance issues (slow transactions)
- Release health

### PostHog
- DAU/WAU/MAU by platform
- Feature adoption funnels
- User activation metrics
- A/B test results

### Grafana Cloud
- Request latency percentiles
- Error rates
- Throughput
- Service dependency map
