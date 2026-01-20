# Feature: Theme & App Structure (Web)

## Summary
Establish the foundational design system, tally-mark visualisation component, and app shell structure following web best practices (Next.js App Router patterns, responsive desktop-first layout).

## Visual identity: Fractal Completion Tallies

> Reference: `assets/identity/fractal-completion-tallies-reference.png`

A hierarchical tally-mark system that stays intuitive at any scale by collapsing detail at exact completion thresholds.

### Counting primitives
| Count | Visual representation |
|-------|----------------------|
| 1–4 | Vertical strokes (pencil-like) |
| 5 | 4 vertical strokes + diagonal slash (the "5-gate") |
| 6–24 | 5-gates arranged in X layout (center, NE/NW/SE/SW) |
| 25 | Full 25-unit with bold **X overlay** (accent color) |
| 26–99 | 2×2 grid of 25-units; completed units show X overlay |
| 100 | Collapse to **X + square outline**; hide stroke detail |
| 101–999 | Row of up to 10 "100-blocks"; partial block may expand |
| 1,000 | 10 squares + **horizontal line** through all; hide X marks |
| 1,001–9,999 | Stack up to 10 rows of 1,000-cap form |
| 10,000 | Add **diagonal closure stroke** across entire 10×10 block |

### Color system (max 3, cycle by layer)
- **C1 (base):** literal tallies / 5-gates
- **C2 (mid cap):** 25-cap X overlay
- **C3 (high cap):** 100-cap box outline

Cap marks appear **only** at exact completion thresholds.

## App structure (Next.js best practices 2025–2026)

### Routing & layout
- Use App Router with nested layouts (`app/layout.tsx`, `app/(auth)/layout.tsx`, etc.)
- Desktop-first responsive: design for wide screens, adapt down
- Shared shell: persistent nav, sync indicator, user menu

### Design system tokens
- OKLCH color tokens (light/dark themes)
- Typography scale with readable, high-contrast defaults
- Motion tokens with reduced-motion fallbacks
- Spacing and radius tokens (shadcn New York foundation)

### Component library
- `<TallyMark count={n} />` — renders fractal completion tallies
- `<TallyMark count={n} animated />` — draws strokes on count change
- Shell components: `<AppNav />`, `<SyncIndicator />`, `<UserMenu />`

## Acceptance criteria
- [ ] `<TallyMark />` component renders correctly for counts 1–10,000+
- [ ] Tally animations respect `prefers-reduced-motion`
- [ ] Design tokens defined and documented (colors, type, motion, spacing)
- [ ] App shell structure matches Next.js App Router best practices
- [ ] Desktop-first layout verified at 1280px+, adapts to mobile
- [ ] Light/dark theme toggle works correctly
- [ ] Accessibility: sufficient contrast, focus states, screen reader labels

## Implementation order
1. Define design tokens (OKLCH colors, type scale, motion, spacing)
2. Build `<TallyMark />` component with unit tests for all thresholds
3. Add animation support with reduced-motion fallback
4. Create app shell layout (nav, sync indicator, user menu)
5. Wire up light/dark theme toggle
6. Document component usage in Storybook or equivalent

## Dependencies
- None (foundational feature)

## Testing focus
- Visual regression tests for tally mark thresholds (1, 5, 24, 25, 100, 1000, 10000)
- Animation timing and reduced-motion behavior
- Theme switching (light ↔ dark)
- Layout responsiveness (desktop → tablet → mobile)
