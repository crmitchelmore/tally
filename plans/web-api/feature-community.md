# Feature: Community (web)

## Goal
Support public challenges and following without gimmicks.

## Scope
- Public challenges list with search.
- Follow/unfollow; show followed section on dashboard.
- Replace placeholders with real totals and owner info.

## Acceptance criteria
- Follow/unfollow is immediate and reliable.
- Public list shows real totals and owner data.
- Private challenges never appear.

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
