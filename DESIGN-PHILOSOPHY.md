# Tally Design Philosophy

Tally should feel **friendly, fun, and fast**—a product people enjoy opening every day.

## Motivation (why we’re building Tally)

People want to track what matters, but everyone’s journey is different.

- Some people want to do a **consistent amount every day**.
- Some people want consistency but **don’t want to feel pressured** to hit it *every* day.
- Some people prefer to **batch** (do more on one day, rest on others).
- Some people like to **get ahead of the target** (build a buffer) and then coast.

Tally should support all of these without judgment:
- Track progress toward a target and show pace **without “punishing” missed days**.
- Make it easy to see when you’re **ahead / on pace / behind**, and how much is needed to catch up.
- Celebrate momentum and progress, not perfection.

## Tally — Design Style Notes (raw)

- Lean into **platform-native patterns** for each surface (iOS native, Android native, Web native).
- Core tenets: **speed** and **responsiveness** — touches/actions should feel immediate.
- Add **delight** via “cool animations” that feel good, but stay **classy** (not cringey).
- The **tally mark** (four vertical lines + diagonal cross for five) is the foundation of the visual identity.
- Need a foundational design for **rolling tallies up** into larger counts so it still makes sense at higher numbers.
  - Initially: focus on **visual display** of rolled-up tallies.
  - Later: could become a way of presenting/scaling counts, but prioritize visuals first.
- Color direction:
  - White “paper” is the default, but pure white may not work well enough.
  - Consider a **slightly off-white**, papery background (not yellow).
  - For the “add” picker: start with tally marks on a white background, but that may evolve.

## Experience principles

### Experience qualities

1. **Tactile** - Every interaction should feel like making a physical mark on paper - deliberate, satisfying, and permanent with visual feedback inspired by pen strokes and counting marks.
2. **Focused** - Clean, minimal interface that puts the numbers front and center, avoiding distractions while celebrating the simple act of counting progress.
3. **Honest** - Raw, authentic progress visualization that shows exactly where you are without gamification gimmicks - just you versus your goal.

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

### 4) Offline-first & instant sync everywhere
- The app should work offline by default (reads and writes).
- Always make sync state visible and understandable:
  - Offline (local-only)
  - Changes queued / ready to sync (show the “waiting lines” / queue count)
  - Syncing
  - Up to date
- The same action should appear quickly across devices once connected.
- Communicate issues calmly (no scary error states for normal offline use).

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
The landing page should feel like the product: **calm momentum**—minimal, confident, and a little playful.

### Themes (visual + narrative)
- **Tally marks as a brand motif**: crisp “ink” strokes, the 5th slash as the signature accent.
- **Momentum > motivation**: small wins compounding over time (show this, don’t just say it).
- **Live, fast UI**: subtle, high-craft motion and an interactive micro-demo instead of big claims.

### Top ideas (ranked)
1) **Hero: interactive micro-demo** — a tiny embedded “challenge card” where clicking “+1” draws a tally mark and updates a mini chart (fast, delightful, instantly communicates the product).
2) **Tally-ink background system** — ultra-subtle repeating tally texture + occasional diagonal “slash” accent, using OKLCH tokens (works in light/dark, stays calm).
3) **Bento feature grid** — fewer words, more visual: 3–5 tiles with screenshots/mini-animations (logging, streaks, stats, sync).
4) **Typography-led clarity** — big, bold headline with tight copy, generous whitespace, and one strong CTA path.

### Style direction to adopt (default)
**“Ink + Momentum”**
- Base: neutral UI (current shadcn New York feel), lots of whitespace.
- Accent: a single warm “slash” color (the 5th tally stroke) used sparingly for CTAs and highlights.
- Texture: faint tally pattern (opacity 2–4%), never competing with content.
- Components: rounded-2xl cards, soft borders, gentle shadows; avoid loud gradients.

### Motion (high-craft, low-noise)
- Prefer **microinteractions** (hover/press, count-up, draw-in strokes) over large ambient animation.
- Durations: ~120–220ms for UI, ~280–420ms for hero moments.
- Always respect reduced-motion.

### Experiments (cheap validation)
- **Micro-demo vs. static hero**
  - Hypothesis: a clickable “+1” demo improves understanding and increases sign-up intent.
  - Success metric: +15% CTR to **Create an account** (or **Open app**) from hero.
- **Bento grid vs. text cards**
  - Hypothesis: visual tiles reduce scanning effort and improve scroll completion.
  - Success metric: +10% scroll depth to the final CTA section.
- **Accent discipline (one accent color)**
  - Hypothesis: fewer competing colors improves clarity and CTA conversion.
  - Success metric: +5% CTA conversion; no increase in bounce.

### Risks / assumptions
- Motion must remain subtle; too much animation breaks the “calm + fast” promise.
- The micro-demo must be lightweight (avoid heavy charts/assets) to protect LCP/INP.
- Accessibility is non-negotiable: contrast, focus states, and reduced-motion need to work from day one.
