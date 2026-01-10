# Redesign plan (Web + iOS + Android)

This document audits the current UI against our design guidelines (see `docs/DESIGN-PHILOSOPHY.md`) and lists the concrete changes required to make **web, iOS, and Android** feel like the *same product*: **friendly, fun, fast**, with **calm + accessible** visuals and **"Ink + Momentum"** styling.

## 0) Design guidelines we must meet (source of truth)
From `docs/DESIGN-PHILOSOPHY.md`:
- Friendly & playful (but not noisy)
- Effortless defaults + progressive disclosure
- Fast perceived performance (instant feedback, minimal spinners)
- Calm + accessible (high contrast, readable type, sensible motion, respect reduced motion)
- Visual direction: **Ink + Momentum**
  - Neutral base, lots of whitespace
  - **One warm accent** (the 5th tally slash) used sparingly
  - Subtle tally texture (2–4% opacity)
  - Rounded 2xl cards, soft borders, gentle shadows

## 1) Current state: gaps & inconsistencies

### Cross-platform
- **No shared design system** (tokens + components) across web/iOS/Android.
- **Accent discipline not enforced**: many one-off colors exist (especially on web), and mobile uses platform defaults.
- **Semantic meaning colors** (ahead/on-pace/behind) are hardcoded and not shared.
- **Motion consistency**: web uses Framer Motion in some places but doesn’t consistently respect reduced-motion; mobile has little/no motion spec.
- **Typography consistency**: web uses Geist + Geist Mono; iOS/Android mostly default platform text styles with occasional hardcoded sizes.

### Web (`tally-web/`)
Good:
- OKLCH-based theme tokens in `tally-web/src/app/globals.css`.
- Brand motif variables already exist: `--tally-line`, `--tally-cross`.
- Micro-demo (`LandingHeroDemo`) respects reduced motion.

Gaps:
- Many components hardcode raw OKLCH strings inline (examples: `ChallengeCard.tsx`, `PersonalRecords.tsx`, `stats.ts`, `ChallengeDetailView.tsx`).
- Motion is used in many places without a unified reduced-motion policy (ex: `AddEntrySheet.tsx` has scale/height animations and confetti unconditionally).
- Multiple ad-hoc chart colors; not tied to a consistent, calm palette.

### iOS (`tally-ios/`)
- UI is functional but **mostly default SwiftUI styling** (Lists, Forms, default button styles).
- Multiple views use fixed font sizes (`.font(.system(size: 44))`) which does **not** scale well with Dynamic Type.
- No centralized brand colors/typography/spacing; no "Ink + Momentum" surfaces.

### Android (`tally-android/`)
- UI is currently a **scaffold/demo** using default `MaterialTheme` without a custom `colorScheme`/`typography`.
- Screens use basic `TextField`, `Button`, `AlertDialog` without brand styling.
- Accessibility (TalkBack) labels are minimal; no consistent semantics.

---

## 2) The fix: a single Design System + token mapping

### 2.1 Create a shared token source
Create a single token file (source of truth) and generate platform outputs.

Recommended structure:
- `packages/design-tokens/tokens.json` (new) — semantic tokens only
- Generated outputs:
  - Web: CSS variables consumed by Tailwind and components
  - iOS: `TallyDesignSystem` Swift package (Colors/Type/Spacing)
  - Android: `ui.theme` Kotlin files (Color.kt/Type.kt/Theme.kt)

**Semantic tokens (minimum set)**
- Surfaces:
  - `surface.bg`, `surface.card`, `surface.inset`, `surface.border`
- Text:
  - `text.primary`, `text.secondary`, `text.muted`
- Brand:
  - `brand.ink` (tally line), `brand.slash` (tally cross), `brand.focus`
- Status:
  - `status.ahead`, `status.onPace`, `status.behind`
- Shape:
  - `radius.sm/md/lg/xl/2xl`
- Motion:
  - `motion.ui.fast` (120–220ms), `motion.hero` (280–420ms)

### 2.2 Typography spec
Goal: **calm, legible, consistent**.

- Headings: platform default “system” but aligned sizes/weights
- Numbers/stats: **tabular/monospaced digits** everywhere
  - Web: `Geist Mono` via `.geist-mono`
  - iOS: `.monospacedDigit()` for stat numbers
  - Android: `FontFamily.Monospace` for numeric emphasis styles

### 2.3 Motion spec
- Default UI motion: subtle (press/hover, sheet transitions).
- Always respect reduced motion:
  - Web: `prefers-reduced-motion` / `useReducedMotion()`
  - iOS: `UIAccessibility.isReduceMotionEnabled` / SwiftUI `@Environment(\.accessibilityReduceMotion)`
  - Android: system animator duration scale + Compose accessibility checks

---

## 3) Required changes — Web

### 3.1 Replace hardcoded OKLCH values with semantic tokens
**Why:** enforce palette discipline and cross-platform parity.

Add new CSS variables in `tally-web/src/app/globals.css`:
- `--status-ahead`, `--status-on-pace`, `--status-behind`
- `--chart-grid`, `--chart-axis`, `--chart-tooltip-bg`, `--chart-tooltip-border`

Then update components to use these vars (no raw OKLCH strings in TSX):
- `tally-web/src/components/tally/ChallengeCard.tsx`
- `tally-web/src/components/tally/ChallengeDetailView.tsx`
- `tally-web/src/components/tally/PersonalRecords.tsx`
- `tally-web/src/components/tally/OverallStats.tsx`
- `tally-web/src/lib/stats.ts`

### 3.2 Accent discipline
- CTAs/buttons: use **brand slash** (`--tally-cross`) as the primary accent.
- Keep additional colors limited to:
  - per-challenge color (user-selected)
  - status colors (ahead/on-pace/behind)
- Reduce random “chart palette” usage; prefer muted neutrals + the user’s challenge color.

### 3.3 Reduced motion compliance
Update interactive components that animate to gate motion:
- `tally-web/src/components/tally/AddEntrySheet.tsx`
  - If reduced motion: disable scale/height animations and confetti burst; keep haptic optional.
- Any other Framer Motion components should use `useReducedMotion()` and conditional transitions.

### 3.4 Accessibility checks (web)
- Ensure keyboard focus states are visible on all interactive controls.
- Ensure color contrast for:
  - status colors on light/dark surfaces
  - small text on muted backgrounds
- Ensure charts/tooltips have accessible labels (at least `aria-label` for key controls).

---

## 4) Required changes — iOS

### 4.1 Introduce `TallyDesignSystem` (new Swift package)
Add a new SPM package (or module) to centralize:
- `TallyColors` (semantic colors; light/dark)
- `TallyTypography` (TextStyles + helpers)
- `TallySpacing` (8pt grid)
- `TallyComponents`:
  - `TallyCard` (rounded 2xl, subtle border/shadow)
  - `PrimaryButton` / `SecondaryButton`
  - `StatNumber` (monospaced digits)
  - `EmptyState` (icon + title + body + CTA)

### 4.2 Replace hardcoded fonts with Dynamic Type styles
Replace occurrences like:
- `.font(.system(size: 44))`

With semantic styles:
- `.font(.largeTitle).fontWeight(.semibold)` or `.font(.title)`
- For numbers: `.font(.largeTitle).monospacedDigit()`

Files to update (minimum):
- `tally-ios/TallyApp/ChallengesView.swift`
- `tally-ios/TallyApp/CommunityView.swift`
- `tally-ios/TallyApp/LeaderboardView.swift`
- `tally-ios/TallyApp/ChallengeDetailView.swift`

### 4.3 Apply Ink + Momentum surfaces
Replace default `List`/`Form` look where appropriate:
- Use grouped cards on a calm background.
- Keep `List` for long scrolling data, but style row backgrounds and separators to match our card aesthetic.

### 4.4 Motion + delight parity
- Add subtle press animations for primary actions.
- Add a “success” microinteraction for logging an entry:
  - haptic
  - lightweight confetti (or a simple tally-stroke animation)
- Respect Reduce Motion.

### 4.5 Accessibility (iOS)
- Ensure Dynamic Type works across screens.
- Ensure VoiceOver labels on icon-only buttons.
- Ensure sufficient contrast in light/dark.

---

## 5) Required changes — Android

### 5.1 Create a real Material3 theme that matches our tokens
Add a `ui/theme` package with:
- `Color.kt` (semantic brand/status colors)
- `Type.kt` (typography; numeric emphasis uses monospace)
- `Theme.kt` (light/dark `colorScheme`, shapes with 16–24dp rounding)

Then wrap the app with `TallyTheme { ... }` instead of raw `MaterialTheme { ... }`.

Files to touch:
- `tally-android/app/src/main/java/app/tally/MainActivity.kt` (replace `MaterialTheme`)
- Add new files under `tally-android/app/src/main/java/app/tally/ui/theme/`

### 5.2 Replace demo layouts with branded components
- Replace generic `TextField`/`Button` styling with theme-driven components.
- Use calm surfaces (`Surface`, `Card`) instead of plain `Column` on a white background.

### 5.3 Motion + haptics
- Use subtle press states.
- For “entry saved” feedback:
  - haptic (`LocalHapticFeedback`)
  - simple micro-animation (e.g., tally mark stroke)
- Respect system animator duration scale.

### 5.4 Accessibility (Android)
- Ensure `contentDescription` exists for icon-only controls.
- Ensure TalkBack order is sensible.
- Ensure contrast in dark mode.

---

## 6) Parity checklist (definition of done)

### Visual parity
- [ ] One accent color used consistently for primary actions across web/iOS/Android.
- [ ] Cards, borders, and rounding feel like the same product.
- [ ] Status colors are consistent across platforms.

### Interaction parity
- [ ] Logging an entry feels instant and delightful on all platforms.
- [ ] Reduced motion is respected everywhere.

### Accessibility
- [ ] Dynamic Type (iOS) and font scaling (Android) supported.
- [ ] Keyboard/focus (web) supported.
- [ ] Contrast checked for all semantic colors.

---

## 7) Suggested execution order (lowest risk → highest impact)
1. **Tokens**: define semantic tokens and map to web CSS vars.
2. **Web cleanup**: remove hardcoded OKLCH from TSX; enforce reduced motion.
3. **iOS design system**: introduce `TallyDesignSystem` + convert key screens.
4. **Android theme**: introduce `TallyTheme` + convert auth + challenge list flows.
5. Add cross-platform polish: haptics, microinteractions, and a shared empty-state language.
