# Feature: Stats + insights (Android)

## Goal
Show clear pace and progress.

## Scope
- Challenge stats (pace, streaks, averages).
- Challenge detail highlights: remaining, days left, per-day required, and a plain-English “catch up / ahead” callout.
- Yearly activity heatmap (grid) + charts.
- Dashboard highlights (fast scan): total marks, today, best streak, and ahead/on-pace/behind status.
- Personal records (highlights): best single day, longest streak, highest daily average, most active days, biggest single entry, max reps in a single set.
- Weekly summary view.

## Acceptance criteria
- Charts show latest data.
- Pace status is accurate and easy to read.

## Design philosophy integration
- Tactile: immediate feedback with ink-like motion and haptics where available.
- Focused: primary action is obvious; progressive disclosure for details.
- Honest: real totals and pace; no gamified noise.
- Friendly/fast/calm: subtle motion, reduced-motion support, large tap targets.
- Tally marks: show a visual tally alongside key counts (grouped by 5); use the red slash sparingly.
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
