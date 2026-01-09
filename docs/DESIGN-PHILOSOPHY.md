# Tally Design Philosophy

Tally should feel **friendly, fun, and fast**—a product people enjoy opening every day.

## Experience principles

### 1) Friendly & playful (but not noisy)
- Clear language, simple choices, and small moments of delight.
- Quirky is welcome when it doesn’t reduce clarity.

### 2) Effortless to use
- Default paths should be obvious; minimize setup.
- Reduce cognitive load: fewer screens, fewer decisions, strong defaults.
- Prefer **progressive disclosure**: show the essentials first, details on demand.

### 3) Fast by default
- Treat perceived performance as a core feature.
- Aim for “tap → instant reaction” with optimistic UI when appropriate.
- Use real-time updates so data feels alive and trustworthy.

### 4) Instant sync everywhere
- The same action should appear quickly across devices.
- Make sync status understandable without alarming the user.

### 5) Calm, legible, and accessible
- High contrast, readable type, sensible motion.
- Animations should support comprehension, not distract.

## Visual / interaction style
- Clean base UI with **high-craft motion** where it matters:
  - onboarding/hero moments
  - completion and streak feedback
  - microinteractions that teach the interface
- Motion guidelines:
  - use short durations
  - respect reduced-motion settings
  - avoid layout jank

## Engineering principles that enable the design
- **Modular-first** code so features can be refined independently.
- Shared domain logic so web/iOS/Android stay consistent.
- **IaC + automation** so environments can be rebuilt reliably and quickly.
- Instrument performance and keep the app snappy as features grow.

## Landing page philosophy (marketing)
- The root domain should communicate:
  - what Tally is
  - why it’s different
  - how it feels (video/animation)
  - clear links to iOS/Android
- Marketing should be bold and creative; infrastructure should remain boring and reliable.
