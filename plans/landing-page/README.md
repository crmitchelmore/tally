# Landing Page Implementation Plan (High Level)

## Stack
- Next.js (App Router) + TypeScript on Vercel
- Media loops (WebM/MP4) with lazy loading
- Progressive enhancement for low-JS environments

## Product ethos
- Calm momentum with tactile ink cues.
- Focused, honest messaging with one clear CTA per section.

## Delivery workflow (repo rules)
- Each feature plan ships as its own PR.
- Repo setting: disable squash merges; allow rebase-only merges.
- Require review approval; after approval use pr-resolver to validate checks before merge.

## Execution prompt (copy/paste)
You are a senior engineer shipping Tally. Your job: execute this plan end-to-end until completed, using the tech stack specified and integrating the Tally design philosophy (tactile, focused, honest; friendly, fast, calm; progressive disclosure; subtle motion with reduced-motion support; accessible and high-contrast; offline-first with clear sync states).
Use the plan sections and feature files in this folder plus /feature-map.md to ensure full parity. Follow the phase order and each feature's "Implementation order" before moving on; update docs if scope changes.

Process rules:
- Deliver each feature as its own Git PR; disable squash merges and use rebase-only merges.
- Make small, incremental commits along the way (clear intent per commit).
- Wait for reviews; after approval, use pr-resolver to validate checks before merge.
- Testing must be behavioral: define scenario-based tests for each feature and ensure they pass.
- Keep a running completion checklist and mark each feature done only when acceptance criteria + behavioral tests pass.
- Automation/pipelines are a separate project and must be done last.

At the end of each feature, summarize what shipped, what remains, and any risks or blockers. Continue until all completion criteria in this plan are met.

## Phases
1. Information architecture, copy, and hero.
2. Feature-led sections + media.
3. Trust signals and app previews.
4. Performance, accessibility, and polish.

## Phase detail (order)
1. IA + copy: finalize narrative, CTAs, and section ordering.
2. Hero micro-demo: build the interactive hero with reduced-motion fallback.
3. Feature-led sections: showcase, how-it-works, live sync, testimonials, app showcase.
4. Platform pages: iOS/Android coming-soon pages and store CTAs.
5. Quality pass: performance, accessibility, and responsive polish.

## Testing focus (behavioral)
- Validate CTA visibility, navigation, and form behavior across breakpoints.
- Verify reduced-motion and keyboard navigation behavior.
- Confirm content renders with JS disabled or slow hydration.
- Check scroll and hover interactions remain smooth on mid-tier devices.

## Completion criteria
- All planned sections shipped with final copy and media.
- Core Web Vitals meet targets (LCP <= 2.5s, INP <= 200ms).
- Reduced-motion, contrast, focus, and keyboard support pass.
- Behavioral test scenarios documented for each section.

## Feature plans
- feature-hero-micro-demo.md
- feature-feature-showcase.md
- feature-how-it-works.md
- feature-testimonials-stats.md
- feature-live-sync-demo.md
- feature-app-showcase.md
- feature-ios-android-pages.md

## Separate project: Automation + pipelines (last)
- CI checks for lint/build, performance budgets, and accessibility audits.
- Preview deployments for content review.
- Release gating and rollback procedures.
