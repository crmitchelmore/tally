# Feature: Theme & App Structure (iOS)

## Summary
Establish the foundational design system, tally-mark visualisation component, and app shell structure following iOS/SwiftUI best practices (NavigationStack, tab-based navigation, system appearance support).

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

## App structure (iOS/SwiftUI best practices 2025–2026)

### Navigation pattern
- Use `NavigationStack` (not deprecated `NavigationView`)
- Tab-based primary navigation (`TabView`) for main sections
- Modal sheets for creation flows and settings
- Deep linking support via `.navigationDestination`

### Design system
- System colors with light/dark appearance support
- SF Symbols for iconography where appropriate
- Dynamic Type support throughout
- Custom `TallyMarkView` for the signature visual

### Component library (TallyDesign package)
- `TallyMarkView(count:)` — renders fractal completion tallies
- `TallyMarkView(count:animated:)` — animates stroke drawing
- Shell components: `TallyTabView`, `SyncStatusView`, `ProfileButton`

### SwiftUI patterns
- `@Environment(\.colorScheme)` for theme adaptation
- `@Environment(\.accessibilityReduceMotion)` for animation control
- `@ScaledMetric` for Dynamic Type-aware sizing
- Prefer `@Observable` (Swift 5.9+) over `@ObservableObject`

## Acceptance criteria
- [ ] `TallyMarkView` renders correctly for counts 1–10,000+
- [ ] Tally animations respect Reduce Motion accessibility setting
- [ ] Design tokens defined as SwiftUI extensions (Color, Font, etc.)
- [ ] App shell uses NavigationStack + TabView per Apple HIG
- [ ] Dynamic Type works at all text sizes (accessibility)
- [ ] Light/dark appearance adapts automatically
- [ ] VoiceOver labels are meaningful for tally marks

## Implementation order
1. Create TallyDesign Swift Package with color/font/spacing tokens
2. Build `TallyMarkView` with SwiftUI Canvas or Shape
3. Add animation support with `withAnimation` + reduce motion check
4. Create app shell (TabView + NavigationStack structure)
5. Add SyncStatusView for offline indicator
6. Document component usage and preview in Xcode Previews

## Dependencies
- None (foundational feature)

## Testing focus
- Snapshot tests for tally mark thresholds (1, 5, 24, 25, 100, 1000, 10000)
- Animation timing and Reduce Motion behavior
- Dynamic Type rendering at all sizes
- VoiceOver accessibility audit
- Light/dark mode transitions
