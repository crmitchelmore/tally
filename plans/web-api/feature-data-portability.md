# Feature: Data portability (web)

## Goal
Let users export, import, or clear all data safely.

## Scope
- Export JSON/CSV with naming convention.
- Import JSON/CSV with validation; replace-all semantics.
- Clear all data action with confirmation.

## Acceptance criteria
- Export includes all challenges and entries.
- Import maps challenge IDs correctly and reports errors.
- Clear all removes challenges, entries, and follows.

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
