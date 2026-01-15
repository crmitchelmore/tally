# Feature: iOS and Android pages

## Goal
Provide clear "coming soon" pages with app CTAs.

## Scope
- /ios and /android pages with store button placeholders.
- CTA to open the web app.

## Acceptance criteria
- Pages are fast and consistent with brand.

## Design philosophy integration
- Tactile: ink-like micro-interactions on the demo and media transitions.
- Focused: one primary CTA per section and minimal copy density.
- Honest: show real UI or faithful recordings; avoid exaggerated claims.
- Friendly/fast/calm: subtle motion, reduced-motion fallback, high contrast.

## Implementation order
1. Define section states (default, hover, reduced-motion, loading).
2. Build static layout and copy with responsive structure.
3. Add interactive elements and motion with reduced-motion support.
4. Optimize media loading, lazy playback, and asset sizing.
5. Accessibility pass (focus, contrast, keyboard, screen reader labels).

## Behavioral tests
- Primary CTA is visible and works on all breakpoints.
- Reduced-motion shows static media and disables autoplay.
- Core content renders without JS or with slow hydration.
- Scroll and hover interactions remain smooth on mid-tier devices.
