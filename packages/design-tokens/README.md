# @tally/design-tokens

Cross-platform design tokens for the Tally app, ensuring visual consistency across web, iOS, and Android.

## Overview

This package provides a single source of truth for:
- Brand colors (ink, slash/accent)
- Status colors (ahead, on-pace, behind)
- Chart styling tokens
- Heatmap colors
- Record/stat colors
- Typography guidelines
- Spacing scale
- Border radii
- Motion/animation tokens

## Usage

### Web (CSS Custom Properties)

The tokens are already defined in `tally-web/src/app/globals.css` as CSS custom properties:

```css
:root {
  --tally-line: oklch(0.25 0.02 30);
  --tally-cross: oklch(0.55 0.22 25);
  --status-ahead: oklch(0.45 0.18 145);
  /* etc. */
}
```

### TypeScript Import

```typescript
import { brandColors, statusColors, getStatusColor } from '@tally/design-tokens';

const color = getStatusColor('ahead', isDarkMode);
```

### iOS (Swift)

See `tally-ios/TallyDesignSystem/` for the Swift implementation.

### Android (Kotlin)

See `tally-android/app/src/main/java/app/tally/ui/theme/` for the Kotlin implementation.

## Design Philosophy

Following "Ink + Momentum" direction:
- Neutral base with lots of whitespace
- **One warm accent** (the 5th tally slash) used sparingly
- Subtle tally texture (2–4% opacity)
- Rounded 2xl cards, soft borders, gentle shadows
- Respect `prefers-reduced-motion`

## Token Structure

```json
{
  "colors": {
    "brand": { "ink", "slash", "focus" },
    "status": { "ahead", "onPace", "behind", "streak" },
    "chart": { "grid", "axis", "tooltipBg", "tooltipBorder", "targetLine" },
    "heatmap": { "level0..4" },
    "records": { "bestDay", "streak", "average", "active", "entry", "milestone", "maxReps" }
  },
  "typography": { "fontFamilies", "fontFeatures" },
  "spacing": { "unit", "scale" },
  "radii": { "sm..full" },
  "motion": { "duration", "easing" }
}
```
