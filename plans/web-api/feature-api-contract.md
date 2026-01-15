# Feature: API v1 contract (web)

## Goal
Provide a stable HTTP API for mobile clients.

## Scope
- Base /api/v1 with Bearer JWT auth.
- Endpoints: auth/user, challenges, entries, followed, public challenges, leaderboard.
- Consistent error model and pagination where needed.
- Maintain legacy /api aliases until deprecation plan exists.

## Acceptance criteria
- Endpoints match docs/API.md.
- Auth failures return clear 401/403 errors.
- Versioned changes do not break clients.

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
