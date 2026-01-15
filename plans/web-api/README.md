# Web + API Implementation Plan (High Level)

## Stack
- Next.js (App Router) + TypeScript on Vercel
- Convex (database, functions, HTTP API)
- Clerk authentication
- Cloudflare DNS

## Product ethos
- Tactile, focused, honest; friendly, fast, and calm.
- Progressive disclosure with subtle motion.
- Offline-first mindset with clear sync states.

## Delivery workflow (repo rules)
- Each feature plan ships as its own PR.
- Repo setting: disable squash merges; allow rebase-only merges.
- Require review approval; after approval use pr-resolver to validate checks before merge.

## Phases
1. Foundation: app shell, auth, user provisioning, schema, design system.
2. Core flows: challenges and entries.
3. Insights + data management.
4. Community + leaderboard + API parity.
5. Quality: performance, accessibility, observability.

## Phase detail (order)
1. Foundation: app shell, auth, user provisioning, schema, design system, routing.
2. Core flows: challenges and entries with optimistic updates and offline states.
3. Insights + data management: stats, weekly summary, export/import, clear-all.
4. Community + leaderboard + API parity: public challenges, follow, real aggregation, v1 API completion.
5. Quality: performance, accessibility, observability, and error handling.

## Testing focus (behavioral)
- Scenario-based tests for sign-in, challenge lifecycle, and entry logging.
- Offline/slow-network behavior and sync recovery.
- Accessibility behaviors: reduced-motion, focus order, and screen reader labels.
- Regression tests for data import/export and public views.

## Completion criteria
- Feature map parity for web app and API v1 contract.
- Offline-first UX with clear sync states and retry behavior.
- Accessibility and performance targets met.
- Behavioral tests defined and passing for each feature.

## Feature plans
- feature-auth.md
- feature-challenges.md
- feature-entries.md
- feature-stats.md
- feature-data-portability.md
- feature-community.md
- feature-leaderboard.md
- feature-api-contract.md
- feature-analytics-observability.md

## Separate project: Automation + pipelines (last)
- CI for lint/test/build and preview deploys.
- Convex + Vercel release automation and environment promotion.
- Post-merge monitoring, alerting, and rollback runbooks.
