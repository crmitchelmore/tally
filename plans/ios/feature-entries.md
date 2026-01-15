# Feature: Entries (iOS)

## Goal
Log progress quickly with honest feedback.

## Scope
- Add entry flow (count or sets/reps).
- Edit/delete entry.
- Date picker (no future dates), note, feeling.
- Per-day drilldown from heatmap.

## UX notes
- Light haptics on submit; respect reduced motion.
- Immediate UI update.

## Acceptance criteria
- Entry edits update stats without delay.
- Reduced-motion disables confetti-like effects.

## Design philosophy integration
- Tactile: immediate feedback with ink-like motion and haptics where available.
- Focused: primary action is obvious; progressive disclosure for details.
- Honest: real totals and pace; no gamified noise.
- Friendly/fast/calm: subtle motion, reduced-motion support, large tap targets.
- Offline-first: local writes with clear sync state and retry.

## Architecture notes (SPM)
- Implement as a Swift package (e.g. `TallyFeatureEntries`) and keep the app target as composition glue.
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
