# Web + API Implementation Plan (High Level)

## Stack
- Next.js (App Router) + TypeScript on Vercel
- **Bun** for package management and scripts in `tally-web/` (**do not use npm/yarn/pnpm**)
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
- **CD for the web app must be done early** (hello world → production URL).
- **CI** is a separate project and must be done last.

At the end of each feature, summarize what shipped, what remains, and any risks or blockers. Before moving on, review the session for anything worth codifying: update the repo Copilot instructions (and any relevant skills) and update any other platform plans impacted by the change. Continue until all completion criteria in this plan are met.

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

## Separate project: CI (last)
- CI for lint/test/build and preview deploys.
- Convex + Vercel release automation and environment promotion.
- Post-merge monitoring, alerting, and rollback runbooks.
