# Feature: Theme & App Structure (Android)

## Summary
Establish the foundational design system, tally-mark visualisation component, and app shell structure following Android/Jetpack Compose best practices (Material 3, Navigation Compose, adaptive layouts).

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

## App structure (Android/Compose best practices 2025–2026)

### Navigation pattern
- Navigation Compose with type-safe routes (Kotlin Serialization)
- Bottom navigation bar for primary sections
- Modal bottom sheets for creation flows
- Deep linking support via NavHost configuration

### Design system (Material 3)
- Dynamic color (Material You) with fallback palette
- Custom `TallyTheme` wrapping `MaterialTheme`
- Typography scale following Material 3 guidelines
- Motion tokens using `AnimationSpec` definitions

### Component library (:core:design module)
- `TallyMark(count: Int)` — renders fractal completion tallies
- `TallyMark(count: Int, animated: Boolean)` — animates stroke drawing
- Shell components: `TallyScaffold`, `SyncStatusIndicator`, `ProfileAvatar`

### Compose patterns
- `LocalReduceMotion` CompositionLocal for animation control
- `isSystemInDarkTheme()` for theme detection
- `WindowSizeClass` for adaptive layouts
- Prefer `collectAsStateWithLifecycle()` for StateFlow

## Acceptance criteria
- [ ] `TallyMark` composable renders correctly for counts 1–10,000+
- [ ] Tally animations respect "Remove animations" accessibility setting
- [ ] Design tokens defined in `TallyTheme` (colors, typography, shapes)
- [ ] App shell uses Navigation Compose + bottom nav per Material guidelines
- [ ] Large text accessibility works throughout
- [ ] Light/dark theme adapts to system setting
- [ ] TalkBack content descriptions are meaningful for tally marks

## Implementation order
1. Create :core:design module with TallyTheme, colors, typography
2. Build `TallyMark` composable using Canvas drawing
3. Add animation support with `Animatable` + reduce motion check
4. Create app shell (Scaffold + NavHost + bottom nav)
5. Add SyncStatusIndicator for offline/syncing states
6. Document component usage with Compose Previews

## Dependencies
- None (foundational feature)

## Testing focus
- Screenshot tests for tally mark thresholds (1, 5, 24, 25, 100, 1000, 10000)
- Animation timing and accessibility motion settings
- Large text rendering at all scales
- TalkBack accessibility audit
- Light/dark theme transitions
- Adaptive layout on different screen sizes
