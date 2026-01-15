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
