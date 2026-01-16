# Feature: Hero micro-demo

## Goal
Communicate the core loop instantly with a tactile "+1" demo.

## Scope
- Interactive challenge card with a "+1" button.
- Ink-stroke tally animation: 4 pencil-like vertical strokes; the 5th stroke is a red diagonal slash; update mini chart.
- Client-side demo data only; no auth.

## Tally mark visual spec
- **Stroke style**: Pencil-like appearance with natural texture.
- **Build-up sequence**: Draw strokes 1→4 individually; on 5th click, add red diagonal slash across the group.
- **Draw-in duration**: ~150–300ms per stroke for smooth, visible animation.
- **Reduced-motion behavior**: Show instant appearance; no animation.
- **Decorative elements**: No emoji or confetti; keep visual focus on the mark itself.
- **Sizing**: Desktop-first; ensure adequate tap targets for mobile (~44×44px minimum).

## UX + performance
- No heavy JS in hero; hydrate after render.
- Respect prefers-reduced-motion; show static poster.
- Instant response and subtle motion.

## Acceptance criteria
- User understands the product in one interaction.
- Demo remains smooth on mid-tier devices.

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
