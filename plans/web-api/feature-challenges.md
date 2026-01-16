# Feature: Challenges (web)

## Goal
Let users create, view, update, archive, and delete challenges.

## Scope
- Create dialog with name, target, timeframe (year | month | custom), color, icon, public toggle.
- Active list filtering (not archived; end date >= today or year >= current).
- Dashboard challenge cards: progress ring, total/target, pace status, and a mini activity heatmap.
- Detail view with settings, archive, delete.
  - Include the core “at-a-glance” header: total/target, remaining, days left, per-day required, and the pace callout.
  - Include the **yearly activity heatmap** with per-day drilldown.
- Public/private visibility rules.

## UX notes
- Minimal, focused inputs; strong defaults.
- Fast feedback on create/update; no blocking spinners.

## Acceptance criteria
- Challenge lifecycle works end-to-end.
- Timeframe rules match feature map.
- Public challenges are readable; private are owner-only.

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
