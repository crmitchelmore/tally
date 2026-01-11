# Project 11 — UX, design system, and accessibility

## Objective
Build a consistent, accessible, “friendly/fun/fast” UI across web and future mobile.

## Observed signals
- `packages/design-tokens/` exists (good foundation).
- UI uses Radix + shadcn patterns.

## Problems
- Without a clear design system, UI consistency drifts quickly.
- Accessibility regressions are easy to introduce (focus states, contrast, motion).

## Proposed solution
1. **Design tokens as the source of truth**
   - Colors, typography, spacing, radii, motion.
   - Export to Tailwind + iOS/Android equivalents.
2. **Component contract**
   - Document how to use key components (forms, dialogs, toasts, empty states).
3. **Accessibility program**
   - Keyboard nav pass on every major page.
   - Add automated a11y checks where feasible (minimal, high-signal).

## Milestones
- M1: Token audit and naming conventions.
- M2: Standardize 10 core components.
- M3: a11y checks + manual QA checklist.

## Acceptance criteria
- Key flows are usable by keyboard and screen readers.
- Visual consistency across the app improves measurably.
- Motion respects prefers-reduced-motion.
