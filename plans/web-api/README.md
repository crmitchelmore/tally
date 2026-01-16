# Web + API Implementation Plan (High Level)

## Stack
- Next.js (App Router) + TypeScript on Vercel
- **Bun** for package management and scripts in `tally-web/` (**do not use npm/yarn/pnpm**)
- Convex (database, functions, HTTP API)
- Clerk authentication
- Cloudflare DNS

## Key references (canonical docs)
Web framework (Next.js):
- Routing (App Router): https://nextjs.org/docs/app/building-your-application/routing
- Route Handlers (API endpoints): https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware

Auth (Clerk):
- Next.js quickstart: https://clerk.com/docs/quickstarts/nextjs
- `clerkMiddleware`: https://clerk.com/docs/references/nextjs/clerk-middleware
- Server auth helpers (`auth()`): https://clerk.com/docs/references/nextjs/auth

Backend (Convex):
- Next.js quickstart: https://docs.convex.dev/quickstart/nextjs
- Auth overview: https://docs.convex.dev/auth
- HTTP actions: https://docs.convex.dev/functions/http-actions
- HTTP API: https://docs.convex.dev/http-api/

Tooling/hosting:
- Bun install: https://bun.sh/docs/cli/install
- Bun run: https://bun.sh/docs/cli/run
- Vercel env vars: https://vercel.com/docs/projects/environment-variables
- Vercel deployments: https://vercel.com/docs/deployments/overview

DNS (Cloudflare):
- API tokens: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- DNS records API: https://developers.cloudflare.com/api/resources/dns/subresources/records/

## Product ethos
- Tactile, focused, honest; friendly, fast, and calm.
- Progressive disclosure with subtle motion.
- Offline-first mindset with clear sync states.

## Visual motif enforcement (tally marks)
- Canonical mark: 4 pencil-like vertical strokes + a red diagonal slash for five.
- The motif must show up alongside key numbers (progress, totals, pace), grouped into fives.
- No emoji/confetti; success feedback is always an ink-stroke tally.
- Desktop-first responsive: design for wide screens first, then adapt down.

## Delivery workflow (repo rules)
- Each feature plan ships as its own PR.
- Repo setting: disable squash merges; allow rebase-only merges.
- PR reviews are recommended, but not required (no PR-only enforcement).

## Execution prompt (copy/paste)
You are a senior engineer shipping Tally. Your job: execute this plan end-to-end until completed, using the tech stack specified and integrating the Tally design philosophy (tactile, focused, honest; friendly, fast, calm; progressive disclosure; subtle motion with reduced-motion support; accessible and high-contrast; offline-first with clear sync states).
Use the plan sections and feature files in this folder plus /feature-map.md to ensure full parity. Follow the phase order and each feature's "Implementation order" before moving on; update docs if scope changes.

Process rules:
- For the web app (`tally-web/`), use **Bun**: `bun install`, `bun run dev/build/test/lint` (never `npm install` / `npm run`).
- Deliver each feature as its own Git PR; disable squash merges and use rebase-only merges.
- Make small, incremental commits along the way (clear intent per commit).
- Wait for reviews; after approval, use pr-resolver to validate checks before merge.
- Testing must be behavioral: define scenario-based tests for each feature and ensure they pass.
- Keep a running completion checklist and mark each feature done only when acceptance criteria + behavioral tests pass.
- **CD for the web app must be done early** (hello world → production URL with GitHub Actions automation).
- **CI** is a separate project and must be done last.

At the end of each feature, summarize what shipped, what remains, and any risks or blockers. Before moving on, review the session for anything worth codifying: update the repo Copilot instructions (and any relevant skills) and update any other platform plans impacted by the change. Continue until all completion criteria in this plan are met.

## Phases
1. Foundation: app shell, auth, user provisioning, schema, design system.
2. Core flows: challenges and entries.
3. Insights + data management.
4. Community + API parity.
5. Quality: performance, accessibility, and error handling.

## Phase detail (order)
1. Foundation: app shell, auth, user provisioning, schema, design system, routing.
2. Core flows: challenges and entries with optimistic updates and offline states.
3. Insights + data management: stats, weekly summary, export/import, clear-all.
4. Community + API parity: public challenges, follow, real aggregation, v1 API completion.
5. Quality: performance, accessibility, and error handling.
   - Observability is a separate post-product stage: `plans/observability/`.

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
- feature-api-contract.md
- (post-product) Observability: see `plans/observability/README.md`

## Separate project: CI (last)
- CI for lint/test/build and preview deploys.
- Convex + Vercel release automation and environment promotion.
- Post-merge monitoring, alerting, and rollback runbooks.

Key references:
- GitHub Actions quickstart: https://docs.github.com/actions/quickstart
- Workflow syntax: https://docs.github.com/actions/writing-workflows/workflow-syntax-for-github-actions
