# Feature: Observability (cross-platform)

## Goal
Add production-grade observability across web + iOS + Android with consistent:
- **OTel traces → Honeycomb**
- **PostHog events** (identical taxonomy across platforms)
- **Structured wide-event logs** that share the same key context and correlate with traces

## Scope
- Define and enforce a shared event/attribute taxonomy.
- Web (Next.js/Convex): instrument key request + mutation/query paths; propagate trace context.
- iOS/Android: instrument app lifecycle + key user flows; include trace/span ids in logs where available.
- PostHog: capture the core user events listed in `plans/observability/README.md`.

## Non-goals
- Rebuilding the product.
- Adding CI gating (CI remains a separate final project).

## Acceptance criteria
- Honeycomb shows traces for the core flows (auth, create challenge, log entry, stats load, export/import) with consistent span naming and shared attributes.
- PostHog receives the same event names + property keys from web/iOS/Android for the same user actions.
- Logs are queryable by `user_id`, `session_id`, `trace_id`, `challenge_id`, and `request_id`.

## Implementation order
1. Define the canonical schema (event names, property keys, log fields) and commit it (this folder).
2. Add OTel baseline setup + exporters for Honeycomb (per platform). Ensure production secrets/config are in GitHub/Vercel.
3. Add a thin telemetry wrapper per platform so we don’t scatter vendor calls throughout UI/business logic.
4. Instrument the highest-value flows first (auth → create challenge → log entry).
5. Add PostHog capture for the cross-platform event list.
6. Validate correlation end-to-end:
   - user action → PostHog event
   - same action → trace/span in Honeycomb
   - logs include the same `trace_id`/`request_id`
7. Add sampling rules (keep errors + slow; sample healthy traffic).

## Behavioral tests
- Perform a full “happy path” session on each platform; confirm the same event sequence appears in PostHog.
- Induce a controlled failure (network off / auth expired) and confirm:
  - error event is retained (not sampled out)
  - traces + logs include enough context to diagnose.

## Web notes (migrated)

This section was migrated from the old web analytics/observability plan so observability guidance lives in one place.

### Goal
Capture core usage and errors without slowing the app.

### Scope
- PostHog events aligned with docs/ANALYTICS.md.
- Sentry error reporting with Clerk user context.
- LaunchDarkly flags for safe rollout.
- Opt-out in dev/local.

### Acceptance criteria
- Key flows emit events (create challenge, add entry, export/import).
- Sentry captures errors with user context.
- Feature flags gate risky changes.

### Design philosophy integration
- Tactile: immediate feedback on actions (optimistic UI, crisp motion).
- Focused: primary action is prominent; progressive disclosure for secondary details.
- Honest: real counts and pace; no gamified noise.
- Friendly/fast/calm: subtle motion, reduced-motion support, readable contrast.
- Offline-first: clear sync state for queued writes and retries.

### Implementation order
1. Define states (loading, empty, error, offline, permission).
2. Build UI layout with design system components.
3. Wire Convex queries/mutations and validation.
4. Add optimistic updates and sync indicators.
5. Accessibility and performance pass.

### Behavioral tests
- Happy path from action to data persistence.
- Offline/slow network queues work and later sync.
- Reduced-motion disables nonessential animation.
- Error and empty states provide clear next actions.
