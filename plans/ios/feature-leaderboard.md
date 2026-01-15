# Feature: Leaderboard (iOS)

## Goal
Show real rankings across users.

## Scope
- Leaderboard list with time range filters.
- Global vs My Ranks tabs.

## Acceptance criteria
- Ranks are based on real aggregation.
- Empty states are calm and informative.

## Design philosophy integration
- Tactile: immediate feedback with ink-like motion and haptics where available.
- Focused: primary action is obvious; progressive disclosure for details.
- Honest: real totals and pace; no gamified noise.
- Friendly/fast/calm: subtle motion, reduced-motion support, large tap targets.
- Offline-first: local writes with clear sync state and retry.

## Architecture notes (SPM)
- Implement as a Swift package (e.g. `TallyFeatureLeaderboard`) and keep the app target as composition glue.
- Shared types/live in shared packages (e.g. `TallyCore`); avoid feature-to-feature dependencies.

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
