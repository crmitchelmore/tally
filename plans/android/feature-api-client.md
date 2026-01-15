# Feature: API client + sync (Android)

## Goal
Provide reliable API access and offline-friendly sync.

## Scope
- Typed API client for /api/v1 endpoints (Retrofit or Ktor).
- Room cache for challenges and entries.
- Queue writes offline and sync with WorkManager.
- Conflict rules: server is source of truth; surface errors.

## Acceptance criteria
- App works read-only offline.
- Queued writes sync when online.
- Errors are visible and recoverable.

## Design philosophy integration
- Tactile: immediate feedback with ink-like motion and haptics where available.
- Focused: primary action is obvious; progressive disclosure for details.
- Honest: real totals and pace; no gamified noise.
- Friendly/fast/calm: subtle motion, reduced-motion support, large tap targets.
- Offline-first: local writes with clear sync state and retry.

## Implementation order
1. Define screen states (loading, empty, error, offline).
2. Build native UI layout and navigation.
3. Wire API client and local persistence.
4. Add optimistic updates and sync indicators.
5. Accessibility and performance pass.

## Behavioral tests
- Primary flow works end-to-end (create, log, view, update).
- Offline actions queue and sync when online.
- Reduced-motion disables nonessential animation.
- Error and empty states explain next actions.
