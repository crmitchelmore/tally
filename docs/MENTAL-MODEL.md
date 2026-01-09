# Tally Mental Model

This doc describes how we think about **technology choices**, **app structure**, and **how we build**.

## North Star
Build a **friendly, fun, fast** challenge tracker with **near-instant sync everywhere** (web + iOS + Android), and infrastructure that can be **recreated from scratch** via code.

## Decision Principles (in order)
1. **User value first**: reduce friction, make it delightful, keep it understandable.
2. **Modular-first**: isolate features so teams can iterate without breaking unrelated areas.
3. **Ship safely**: typed APIs, automated checks, repeatable deploys.
4. **Performance is a feature**: keep UI responsive; prefer real-time updates and optimistic UX.
5. **Prefer boring infrastructure, creative UI**: take risks in the experience, not the foundations.

## What tech to use (heuristics)

### Web UI
- Default: **Next.js App Router + React + Tailwind + shadcn/ui** (already adopted).
- Use libraries for “creative flair” when they earn their weight:
  - **Framer Motion** for high-quality interaction + choreography.
  - **Rive/Lottie** for lightweight, expressive animations.
  - **MP4/WebM** product videos for “live product” sections.
- If we want a dedicated marketing build pipeline, we *may* consider **Astro** for a pure-static marketing site, but only if it doesn’t complicate deployments and routing.

### Backend & Data
- **Convex** is the source of truth for data and real-time sync.
- Prefer **one shared domain model** across platforms via shared types/contracts.

### Auth
- **Clerk** is the identity provider; do not hardcode keys.
- Any change to origins/redirects must be handled intentionally (and ideally via IaC).

### Infrastructure
- **Infrastructure as Code always** (Pulumi). No manual dashboard edits.
- The goal is: “clone repo → set env vars → run one command → infra recreated”.

## Modular-first architecture
Think in layers + modules, not a single blob.

### Layers
- **Presentation**: UI + navigation.
- **Domain**: challenge logic, streaks, stats, validation.
- **Data**: Convex queries/mutations/actions + caching strategy.
- **Platform**: auth session, notifications, device-specific APIs.

### Web structure (guideline)
- Organize by **feature modules** (e.g. `challenges/`, `entries/`, `stats/`) with:
  - `components/` (feature-scoped)
  - `hooks/` (feature-scoped)
  - `lib/` (pure functions, domain logic)
- Keep shared UI primitives in a single place (shadcn/ui + shared components).

### iOS structure (guideline)
- Default to **Swift Package Manager (SPM)** for modularity.
- Prefer multiple Swift packages over a single monolith app target.

Suggested packages (example):
- `TallyDesignSystem` (colors, typography, components)
- `TallyDomain` (models + rules)
- `TallyAPI` (Convex HTTP client, DTO mapping)
- `TallyAuth` (Clerk integration)
- `TallyFeatures` (feature modules: Challenges, Entry, Stats)

## Automation mindset
- If it’s repeatable, it should be automated.
- CI should validate: typecheck, unit tests, lint, and basic e2e for auth-critical flows.
- Deploys should be predictable and reversible.

## Fast + instant sync mental model
- UI should feel immediate:
  - optimistic updates where safe
  - real-time subscriptions where valuable
  - graceful loading and offline-tolerant states
- “Latency is UX”: minimize spinners; prefer skeletons and progressive rendering.
