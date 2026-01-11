# Project 10 — Performance & caching (perceived + real)

## Objective
Keep Tally “fast and calm” under real usage: quick loads, instant feedback, and scalable realtime.

## Problems to solve
- Next.js apps can regress via bundle growth, client-side rendering creep, and waterfall fetches.
- Realtime backends can get expensive if queries are overly broad or re-run too often.

## Proposed solution
1. **Performance budgets**
   - Bundle size limits for critical routes.
   - Lighthouse/Next build metrics in CI (non-blocking at first).
2. **Data access discipline**
   - Paginate entries; range queries; avoid unbounded subscriptions.
   - Cache where appropriate (Next.js route-level caching, memoization).
3. **UX performance**
   - Skeletons instead of spinners.
   - Optimistic updates for entry creation.

## Milestones
- M1: Baseline perf metrics for key routes.
- M2: Fix top 3 bundle / waterfall offenders.
- M3: Add budgets + regression alerts.

## Acceptance criteria
- Core routes hit target p95 load and interaction times.
- No unbounded realtime subscriptions in hot paths.
- Perf regressions are caught before production.
