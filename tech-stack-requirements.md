# Tally — Tech Stack Notes (raw)

> Captured as spoken notes; intentionally unrefined.

## Core product choices

- **Auth:** Clerk 
- **Database / backend:** Convex.
- **Web:** Next.js on Vercel, TypeScript.
  - **Package manager + task runner (web): Bun** (`bun install`, `bun run ...`) — **do not use npm/yarn/pnpm** for `tally-web/`.
- **Infrastructure:** Pulumi TypeScript (package manager: **npm**).
- **Domains/DNS:** Cloudflare.

## Landing page (Convex.dev-inspired)

Notes from a quick inspection of https://www.convex.dev/:
- Uses **feature-led sections** with strong, high-signal headings + a “show, don’t tell” media panel.
- Uses a **desktop accordion** pattern (pick a feature → update the media on the right) and a **mobile stacked** card pattern.
- Media is framed consistently (dark container, rounded corners) and is **lazy-loaded**.

What we want to copy for Tally:
- **Live preview media**: short MP4/WebM loops that autoplay muted + loop + playsInline, and pause when offscreen.
  - Desktop: hover-play is OK; don’t rely on hover as the only way to understand.
  - Respect `prefers-reduced-motion` (no autoplay; show poster image instead).
- **Interactive micro-demo**: a tiny embedded “challenge card” showing how logging works (e.g. tap “+1” → tally mark draws → mini chart updates).
  - No auth required; should run entirely client-side with fake/demo data.
  - Keep it lightweight (protect LCP/INP): defer non-critical JS, pre-render the shell, and lazy-load heavier bits.

## Landing page best practices (2025–2026)

- **Core Web Vitals are the constraint**:
  - Target LCP ≤ **2.5s** (75th percentile) and INP ≤ **200ms**.
  - Don’t ship heavy hero JS; interactive demos must stay snappy under real device constraints.
- **Progressive enhancement**:
  - Page should still “work” with JS slow/disabled: clear headline, screenshot/poster, CTA.
  - Micro-demo can hydrate later.
- **Motion + video done right**:
  - Autoplay loops must be `muted loop playsInline` and must respect `prefers-reduced-motion` (show poster / no autoplay).
  - Pause when offscreen (IntersectionObserver) to save CPU/battery.
- **One primary CTA per section**:
  - Avoid choice overload; repeat the same CTA as you scroll.
  - Consider sticky CTA on mobile if it doesn’t obscure content.
- **Trust quickly**:
  - Social proof (quotes, metrics, logos) near the top, but keep it lightweight.
  - Add a “How it works” section that matches the in-app flow (reduce surprise).
- **Fast media**:
  - Use poster-first loading, responsive sources, and a CDN.
  - Prefer WebM + MP4 fallbacks; keep loops short (5–12s) and visually calm.

## Mobile

- **iOS:** Native Swift + SwiftUI.
  - Use Swift Packages.
  - Modularize everything.
- **Android:** Kotlin + Jetpack Compose (native).
  - Modularize with Gradle modules.

## Observability (options to pick from)

Goal: good free tier + supports logs, and ideally OpenTelemetry for traces/spans/metrics.

- **Honeycomb + OpenTelemetry**
  - Pros: excellent tracing/observability UX for debugging complex flows.
  - Cons: may be less log-centric; pricing/limits to evaluate.

## App/Play store patterns

- Use github actions with native apis 


## Infra philosophy

- Prefer simple TypeScript scripts we can run locally + in GitHub Actions.

## Analytics / user tracking

- Previously used PostHog.
- Build philosophy: start minimal (ship product); defer observability + analytics until later.
