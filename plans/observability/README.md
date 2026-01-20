# Observability (post-product stage)

This stage happens **after** the landing page + web app + iOS + Android are feature-complete.

Goal: add consistent telemetry across platforms so we can answer: **what happened**, **to whom**, **where**, and **why**—without log spam.

## Targets
- **Traces (Honeycomb):** OpenTelemetry (OTel) spans/traces exported to Honeycomb.
- **User analytics (PostHog):** consistent event names + properties across platforms.
- **Logs:** structured logs shaped as **wide events / canonical log line** (per https://loggingsucks.com/).

Canonical schema (source of truth): `plans/observability/schema.md`.

## Logging philosophy (loggingsucks.com)
- Prefer **one context-rich event** per request / user action over many small log lines.
- Optimize logs for **querying**, not writing: high-cardinality fields (user, ids) + high-dimensional context.
- Always include correlation ids: `trace_id`, `span_id`, `request_id`.
- Use **tail sampling** (keep errors + slow requests; sample the rest) to control cost while retaining the events that matter.

## Canonical context (apply everywhere)
Include these fields on logs and PostHog events wherever available:
- `platform`: `web | ios | android`
- `env`: `development | preview | production`
- `app_version` / `build_number`
- `user_id` (Clerk subject or stable internal id) and `is_signed_in`
- `session_id` (stable per app boot)
- `trace_id`, `span_id`, `request_id`
- Domain ids when relevant: `challenge_id`, `entry_id`

## PostHog event taxonomy (cross-platform)
Keep names and property keys **identical** across platforms.

Core events (minimum):
- `app_opened`
- `auth_signed_in`
- `auth_signed_out`
- `challenge_created`
- `challenge_updated`
- `challenge_archived`
- `entry_created`
- `entry_updated`
- `entry_deleted`
- `data_export_started` / `data_export_completed`
- `data_import_started` / `data_import_completed`

Recommended common properties:
- `platform`, `env`, `app_version`, `build_number`
- `user_id`, `session_id`
- `challenge_id`, `timeframe_unit`, `target_number`
- `entry_count`, `has_note`, `has_sets`, `feeling`

## Feature plan
- feature-observability.md

## Key references (canonical docs)
PostHog:
- iOS SDK: https://posthog.com/docs/libraries/ios
- Android SDK: https://posthog.com/docs/libraries/android
- Capturing events: https://posthog.com/docs/product-analytics/capture-events

Honeycomb + OpenTelemetry:
- Send iOS data: https://docs.honeycomb.io/send-data/ios/
- Send Android data: https://docs.honeycomb.io/send-data/android/
- Send data with OpenTelemetry: https://docs.honeycomb.io/send-data/opentelemetry/
- OTLP exporter configuration: https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/
