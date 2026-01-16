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
- Add **delight** via high-craft ink-stroke motion that feels physical and satisfying (never cringey).
- **Desktop-first responsive (web):** design for wide screens first, then adapt down; avoid “mobile-only UI stretched to desktop”.

### Visual motif (canonical): tally marks
- The **tally mark** is the foundation of the visual identity.
- Canonical form: **4 pencil-like vertical strokes**, then a **diagonal “slash”** for five (often the only warm red accent).
- Tally marks must show up throughout the product where it improves comprehension:
  - subtle background texture (2–4% opacity)
  - alongside key numbers (progress, totals, pace) with grouping into fives
  - success feedback as a new stroke being drawn
- **No emoji/confetti** anywhere as “delight” — the ink is the delight.

### Rolling tallies up
- For large counts, group by fives visually first, then compress (e.g. “3×5 + 2”) while keeping *some* tally representation next to the number.

### Fractal Completion Tallies (core identity system)
> Reference image: `assets/identity/fractal-completion-tallies-reference.png` (source: `/Users/cm/Downloads/5.png`)

**Tag:** `FRACTAL_COMPLETION_TALLIES` — include whenever implementing **entry/visualisation of challenge counts**.

A hierarchical tally-mark icon system that stays intuitive at small sizes by **collapsing detail at exact completion thresholds** (25 / 100 / 1,000 / 10,000).

- **Color system (max 3; cycle by layer)**
  - **C1 (Base detail):** literal tallies / 5-gates
  - **C2 (Mid cap):** **25-cap X overlay**
  - **C3 (High cap):** **100-cap box outline**
  - **Cycling:** for cap layers above C3, cycle back to **C1 → C2 → C3**.

- **Core primitives**
  - **5-gate (value = 5):** four vertical strokes + a diagonal slash.
  - **25-unit (capacity = 25):** 5 positions in an X layout (center, NE/NW/SE/SW); each position holds one 5-gate.
  - **25-cap overlay (exactly 25 only):** when the 25-unit is full, draw a bold **X overlay** across the whole unit in **C2**.
  - **100-unit (capacity = 100):** a 2×2 square of 25-units with visible seams.
  - **100-cap simplification (exactly 100 only):** hide all C1 5-gate detail; show **only** the **X (C2)** + **square outline (C3)**.
  - **1,000-unit (capacity = 1,000):** a row of **10** 100-blocks.
  - **1,000-cap simplification (exactly 1,000 only):** remove the internal X marks; keep the 10 squares and draw **one horizontal line overlay** through all 10 squares (next color in the cycle; typically C1).
  - **10,000-unit (capacity = 10,000):** stack **10 rows** of the 1,000 representation (10×10 macro-grid of 100-block squares).
  - **10,000 closure (exactly 10,000 only):** add a single bold **diagonal closure stroke** across the entire 10×10 block (next color in the cycle; typically C2).

- **Representation by numeric range**
  - **1–24:** show literal tallies / 5-gates in C1 placed into the 25-unit X layout (no cap overlay).
  - **25:** add the C2 X overlay (and only at 25).
  - **26–99:** 2×2 of 25-units; completed 25-units get the C2 overlay; the active unit shows C1 detail.
  - **100:** collapse to **X (C2) + square outline (C3)**; remove all C1 detail.
  - **101–999:** row of up to 10 “100 blocks”; completed blocks show **X (C2) inside square (C3)**; the partial block may expand down to the 25-structure when space allows.
  - **1,000:** collapse to 10 squares + one horizontal line; remove X marks.
  - **1,001–9,999:** stack up to 10 rows; completed rows use the 1,000-cap form; partial rows may expand down a level when space allows.
  - **10,000:** add the diagonal closure stroke (never used for partial progress).

**Non-negotiable rule:** cap marks (X overlays, box outlines, horizontal line, diagonal closure) appear **only** at their exact completion thresholds.

### Color direction
- White “paper” is the default, but pure white may not work well enough.
- Consider a **slightly off-white**, papery background (not yellow).
- The red diagonal slash is the signature accent; use sparingly.

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
- Accent: a single warm **red slash** (the 5th tally stroke) used sparingly for CTAs, highlights, and “count reached” moments.
- Texture: faint tally pattern (opacity 2–4%), never competing with content.
- Desktop-first layout: designed for wide screens with intentional structure, not just scaled-up mobile cards.
- Components: rounded-2xl cards, soft borders, gentle shadows; avoid loud gradients.

### Motion (high-craft, low-noise)
- Prefer **microinteractions** (hover/press, count-up, **ink-stroke draw-in**) over large ambient animation.
- Durations: ~120–220ms for UI, ~280–420ms for hero moments.
- Success feedback is an ink-stroke tally being drawn (no emoji/confetti).
- Always respect reduced-motion (show final marks instantly).

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
