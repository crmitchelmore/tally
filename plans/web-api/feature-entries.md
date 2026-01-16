# Feature: Entries (web)

## Goal
Log progress with a tactile, fast flow.

## Scope
- Add Entry sheet (global) and detail sheet.
- Count or sets/reps; date (no future); optional note and feeling.
- Edit and delete entries.
- Per-day drilldown from heatmap.
- Delight: tally-mark ink stroke animation + light haptics (reduced-motion safe).

## Acceptance criteria
- Entries update stats immediately.
- Future dates blocked with clear error.
- Success feedback draws a tally-mark ink stroke; instant for reduced-motion.
- No confetti/emoji.

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
