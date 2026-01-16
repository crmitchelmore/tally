# Feature: Stats + insights (web)

## Goal
Provide honest progress visualization and pace guidance.

## Scope
- Challenge stats: totals, remaining, pace, streaks, best day, averages.
- Challenge detail highlights: remaining, days left, per-day required, and a plain-English “catch up / ahead” callout.
- Charts: **yearly heatmap** (activity grid) + cumulative progress + weekly average.
- Dashboard highlights (top-level, fast scan): total marks, today, best streak, and ahead/on-pace/behind status.
- Dashboard personal records (highlights): best single day, longest streak, highest daily average, most active days, biggest single entry, max reps in a single set.
- Weekly summary modal with navigation.

## Acceptance criteria
- Pace status is accurate (ahead/on-pace/behind) and drives the “catch up / ahead” callout.
- Yearly heatmap renders and updates after entry changes; clicking a day opens the per-day drilldown.
- Dashboard highlights (total marks / today / best streak / pace status) are correct.
- Personal records are correct and update after entry changes.
- Weekly summary matches selected week.

## Design philosophy integration
- Tactile: immediate feedback on actions (optimistic UI, crisp motion).
- Focused: primary action is prominent; progressive disclosure for secondary details.
- Honest: real counts and pace; no gamified noise.
- Friendly/fast/calm: subtle motion, reduced-motion support, readable contrast.
- Tally marks: show a visual tally alongside key counts (grouped by 5); use the red slash sparingly.
- Offline-first: clear sync state for queued writes and retries.

## Implementation order
1. Define states (loading, empty, error, offline, permission).
2. Build dashboard highlights + personal records layout (desktop-first).
3. Build challenge detail highlights + yearly heatmap layout.
4. Wire Convex queries/mutations and validation.
5. Add optimistic updates and sync indicators.
6. Accessibility and performance pass.

## Behavioral tests
- Happy path from action to data persistence.
- Offline/slow network queues work and later sync.
- Reduced-motion disables nonessential animation.
- Error and empty states provide clear next actions.
