# Tally — Architecture Review (Final)

**Date:** 2026-01-11  
**Scope:** Repo-wide architecture consistency, tooling, environment management, and launch readiness across web/iOS/Android/infra.

---

## Executive summary

Tally’s core architecture (**Next.js 16 + Convex + Clerk**, deployed on Vercel, with **Pulumi** managing infra) is strong and a good foundation to build on. The biggest risks right now are **repo/tooling drift** (a legacy root Vite/Spark app living alongside `tally-web/`), **environment drift** (Convex + Clerk JWT issuer consistency across dev/preview/prod), and **contract drift** (shared packages exist but are not yet the canonical source of truth).

**Overall health:** ✅ Good (with clear, fixable gaps)

---

## Current state (what’s in the repo)

### Active production surface
- **Web:** `tally-web/` — Next.js (App Router) + React + Convex + Clerk; deployed on Vercel.
- **Backend:** `tally-web/convex/*` — Convex schema + mutations/queries + HTTP actions (`convex/http.ts`).
- **Infrastructure:** `infra/` — Pulumi TS managing Cloudflare DNS, Vercel domains/env vars, Sentry provisioning, and some Clerk redirect automation.

### In-progress surfaces
- **iOS:** `tally-ios/` — scaffolded (Swift + XcodeGen + TallyCore package).
- **Android:** `tally-android/` — scaffolded (Kotlin/Compose + modules).
- **Shared packages:** `packages/shared-types`, `packages/design-tokens` — defined but not yet consumed as canonical contracts.

### Legacy / parallel artifacts (highest confusion risk)
- Root **`/src`**, root **`vite.config.ts`**, and root **`tsconfig.json`** appear to be a legacy Vite/Spark web app.
  - This implies “two web apps” in one repo and is currently the biggest architectural inconsistency risk.

---

## Architecture overview

### High-level components and boundaries

- **`tally-web/`** owns product UI/UX and Convex client usage.
- **`tally-web/convex/*`** owns DB schema + server-side invariants.
- **`tally-web/convex/http.ts`** is the mobile/integration boundary (public surface; should be versionable).
- **`infra/`** owns cloud resources and Vercel configuration (avoid clickops).
- **`packages/shared-types`** should become the canonical cross-platform API contract (web + iOS + Android).
- **`packages/design-tokens`** should become the canonical design contract (colors/spacing/motion) across platforms.

---

## What’s working well

- **Web app quality:** production-ready, modern stack, good security posture (CSP + security headers), and a meaningful test suite (unit + e2e + API smoke).
- **Schema design:** Convex tables are indexed appropriately (e.g. `by_user`, `by_user_date`, etc.).
- **Infrastructure maturity:** Pulumi manages DNS + Vercel + Sentry provisioning, reducing configuration drift.
- **Observability (web):** Sentry + OTel sampling strategy is present and provisioned via env vars.

---

## Key gaps / drift risks (prioritized)

1) **Two web apps in the repo (legacy root app vs `tally-web/`)**
   - Impact: onboarding + tooling confusion; accidental config coupling and CI drift.

2) **Environment drift risk for Convex/Clerk across dev/preview/prod**
   - Notable concern: Pulumi appears to set `CONVEX_DEPLOYMENT` / `NEXT_PUBLIC_CONVEX_URL` primarily for **production** targets; if preview/dev relies on manual Vercel env vars, drift is likely.
   - `CLERK_JWT_ISSUER_DOMAIN` is required by Convex auth and must be consistent across local, CI, preview, and prod.

3) **Contract duplication / drift**
   - `tally-web/src/types/index.ts` appears to duplicate `@tally/shared-types`.
   - Convex uses `_id`/`Id<...>` shapes, while clients want stable `id: string` DTOs.

4) **LaunchDarkly IaC partially disabled**
   - The LaunchDarkly Pulumi provider is currently disabled due to diff crashes; resources are managed manually.
   - This is a documented exception, but needs clear ownership and periodic audit until IaC is restored.

5) **Mobile readiness gaps**
   - Apps are scaffolded with dependencies, but primary UI and full CI enforcement are not yet “launch-ready”.
   - OTel is not configured for mobile yet.

---

## Recommendations (smallest safe path)

### High priority (reduce confusion + prevent drift)

1) **Declare/contain the legacy root Vite/Spark app**
   - Clearly mark it as legacy (docs + repo structure), or move it under `legacy/` once confirmed unused.

2) **Make Pulumi the source of truth for required env vars across all targets**
   - Ensure Convex + Clerk JWT issuer values are managed for `development`, `preview`, and `production` (not just prod).
   - Keep the “single root `.env`” local workflow documented and consistent with Vercel/CI.

3) **Make `@tally/shared-types` the canonical contract layer**
   - Adopt it in `tally-web/` and add a small adapter layer for Convex ↔ DTO mapping (e.g. `_id` → `id`).
   - Use `schema.json` as the cross-platform source for mobile type generation.

4) **Add explicit API versioning before mobile GA**
   - Introduce `/api/v1/...` (keep `/api/...` as a compatibility alias during transition).

### Medium priority (launch hardening)

5) **Implement/finish mobile CI workflows**
   - iOS: run XcodeGen + `xcodebuild test`.
   - Android: run Gradle unit tests + assemble.

6) **Wire design tokens into all clients**
   - Generate Swift/Kotlin tokens and integrate into iOS/Android; integrate tokens into web styling/Tailwind.

7) **Add Convex backend Sentry (if desired)**
   - Establish a consistent error/reporting wrapper for actions/mutations and configure DSN in Convex env.

### Low priority (post-launch cleanup)

8) **Formalize Nx projects for mobile (optional)**
   - Add `project.json` for iOS/Android or otherwise ensure affected detection is accurate.

9) **Consider a staging environment (optional)**
   - Only if needed; otherwise keep dev/prod separation as-is and document expectations.

---

## Appendix: current HTTP API surface (Convex `http.ts`)

**Authenticated**
- `POST /api/auth/user`
- `GET|POST /api/challenges`
- `PATCH /api/challenges/{id}`
- `GET|POST /api/entries`
- `PATCH|DELETE /api/entries/{id}`
- `GET|POST /api/followed`
- `DELETE /api/followed/{idOrChallengeId}`

**Public**
- `GET /api/public/challenges`
- `GET /api/leaderboard`
