# Tally Web App

Next.js (App Router) web client and REST API backed by Convex. Uses Clerk for auth and Bun for tooling.

## Prerequisites
- Bun (required; npm/yarn/pnpm are blocked by preinstall)
- Node.js 20+
- Convex CLI (optional; `npx convex` works for deploy)

## Setup
1. Copy env file and fill required keys:
   ```bash
   cp .env.local.example .env.local
   ```
2. Set at minimum:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CONVEX_URL`
   - `CONVEX_DEPLOYMENT`
3. Install dependencies and run dev server:
   ```bash
   bun install
   bun dev
   ```

## Scripts
- `bun run lint`
- `bun run build`
- `bun run test`
- `bun run test:e2e`

## Architecture
- `src/app/` — App Router pages (landing, auth, app, offline)
- `src/app/api/v1/` — REST API routes (server-side Convex client)
- `convex/` — Convex schema + queries/mutations
- `src/components/` — UI and feature components
- `src/lib/` — telemetry, offline store, Convex provider, debug bridge

## Convex
- Server routes call Convex via `ConvexHttpClient` (`src/app/api/v1/_lib/convex-server.ts`).
- Set `NEXT_PUBLIC_CONVEX_URL` to your deployment.
- After changing `convex/schema.ts` or `convex/*.ts`, run:
  ```bash
  npx convex deploy
  ```
  (Convex deploys separately from Vercel.)

## Offline mode
- `/offline` uses localStorage only (no auto-sync).
- Keys:
  - `tally_offline_challenges`
  - `tally_offline_entries`
  - `tally_offline_user`

## Debug bridge (optional)
Development-only bridge for AI-driven browser automation.
1. Start bridge server:
   ```bash
   npx debug-bridge-cli connect --session tally --port 4000
   ```
2. Open the app:
   ```
   http://localhost:3000?session=tally&port=4000
   ```

## Related docs
- `docs/web-features.md`
- `docs/api-reference.md`
- `DESIGN-PHILOSOPHY.md`
