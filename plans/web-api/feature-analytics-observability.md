# Feature: Analytics + observability (web)

## Goal
Capture core usage and errors without slowing the app.

## Scope
- PostHog events aligned with docs/ANALYTICS.md.
- Sentry error reporting with Clerk user context.
- LaunchDarkly flags for safe rollout.
- Opt-out in dev/local.

## Acceptance criteria
- Key flows emit events (create challenge, add entry, export/import).
- Sentry captures errors with user context.
- Feature flags gate risky changes.

## Design philosophy integration
- Tactile: immediate feedback on actions (optimistic UI, crisp motion).
- Focused: primary action is prominent; progressive disclosure for secondary details.
- Honest: real counts and pace; no gamified noise.
- Friendly/fast/calm: subtle motion, reduced-motion support, readable contrast.
- Offline-first: clear sync state for queued writes and retries.

## Implementation order
1. Define states (loading, empty, error, offline, permission).
2. Build UI layout with design system components.
3. Wire Convex queries/mutations and validation.
4. Add optimistic updates and sync indicators.
5. Accessibility and performance pass.

## Behavioral tests
- Happy path from action to data persistence.
- Offline/slow network queues work and later sync.
- Reduced-motion disables nonessential animation.
- Error and empty states provide clear next actions.
