# Tally — Architecture & Tooling Alignment Review (GPT)

**Date:** 2026-01-11  
**Scope:** Repo-wide architecture consistency, tooling configuration, environment setup, and gaps; actionable alignment plan.

---

## Recommendation (what to do next)

**Keep the current “Next.js + Convex + Clerk + Pulumi” architecture and evolve it**, but do three alignment tasks now to reduce drift and confusion:

1) **Declare/contain the legacy Vite/Spark app** (root `/src`, root `vite.config.ts`, root `tsconfig.json`) so it’s clearly “legacy” and not mistaken for the active web app.
2) **Make environment management consistent across local/CI/Vercel** (especially Convex + Clerk + LaunchDarkly + Sentry), and document the single source of truth.
3) **Standardize shared contracts** by making `@tally/shared-types` the canonical API contract for mobile + web (with adapters where Convex-specific fields differ).

This is the smallest path that preserves shipped value (production web) while preventing parallel work from diverging further.

---

## Alternatives considered

### A) Delete legacy Vite/Spark code now
- **Pros:** reduces confusion immediately; fewer toolchains.
- **Cons:** risky if anything still references it (assets, docs, experiments); harder to recover.
- **When to choose:** if you’re certain it’s dead and you want a hard reset.

### B) Keep legacy app indefinitely
- **Pros:** zero work.
- **Cons:** ongoing confusion (two UIs, two tsconfigs, two build stories), accidental CI/config drift.
- **When to choose:** only if you still actively run it for something.

### C) Extract everything into separate repos (web/infra/mobile/packages)
- **Pros:** clean boundaries.
- **Cons:** heavy operational overhead + migration cost; loses monorepo benefits.
- **When to choose:** only if monorepo coordination becomes a major bottleneck.

**Chosen:** evolve in-place (Recommendation), with clear boundaries + canonical contracts.

---

## Current state (what’s actually in the repo)

### Active production surface
- **Web:** `tally-web/` — Next.js 16 (App Router) + React 19, Convex, Clerk; deployed on Vercel.
- **Infra:** `infra/` — Pulumi TS managing Cloudflare DNS + Vercel domains + env vars + Sentry provisioning (+ some Clerk redirect automation).

### In-progress surfaces
- **iOS:** `tally-ios/` — Swift/XcodeGen scaffold; CI workflow exists.
- **Android:** `tally-android/` — Kotlin/Gradle scaffold; CI workflow exists.
- **Shared packages:** `packages/shared-types`, `packages/design-tokens`.

### Legacy / parallel artifacts
- **Root `/src` + root `vite.config.ts` + root `tsconfig.json`** look like the earlier Vite/Spark-based web app.
  - This is the biggest “architectural inconsistency” risk because it implies two web apps.

---

## Architecture overview

### High-level components

```
Users
  │
  ▼
Vercel (Next.js 16) ───────────────────────────────┐
  │                                                │
  │ (Clerk middleware in tally-web/src/proxy.ts)    │
  ▼                                                │
Web UI (App Router: /app)                          │
  │                                                │
  ├─ Convex React client (realtime) ────────────────┤
  │                                                │
  └─ Convex HTTP API (/api/* on convex.site) ───────┘

Mobile (future)
  └─ uses Convex HTTP API + Clerk JWT

Infra (Pulumi)
  ├─ Cloudflare DNS
  ├─ Vercel project env + domains
  ├─ Sentry projects + DSNs
  ├─ Clerk redirect URLs (via Clerk API)
  └─ LaunchDarkly env vars (provider currently disabled)
```

### Responsibility boundaries
- **`tally-web/`** owns product UI/UX, client logic, and Convex functions.
- **`tally-web/convex/*`** owns DB schema + server-side domain invariants.
- **`tally-web/convex/http.ts`** is the mobile/integration boundary (public, versionable surface).
- **`infra/`** owns *all* cloud resources and environment variables for Vercel (and service provisioning).
- **`packages/shared-types`** should be the canonical “contract layer” for API payloads and mobile types.
- **`packages/design-tokens`** should be the canonical “design contract layer” across platforms.

---

## Tooling & configuration review

### Monorepo orchestration (Nx)
- Nx is configured at the repo root (`nx.json`) and projects exist for:
  - `tally-web/project.json` (Next commands)
  - `infra/project.json` (Pulumi commands)
- CI uses `npx nx show projects --affected` in PR checks.

**Gap:** legacy root Vite config + root tsconfig suggest another project, but it is not represented as an Nx project. That’s a consistency smell.

### Package managers
- **Root:** npm (used by CI for Nx + tooling via `npm ci`).
- **Web:** bun (used correctly in `.github/workflows/pr.yml`).
- **Infra:** npm (used correctly in infra workflows).

**Gap:** doc drift: `tally-web/README.md` previously used npm commands; updated to bun.

### CI/CD
- Web CI is comprehensive (lint/build/unit/e2e + API smoke).
- Infra CI includes typecheck + Pulumi preview and apply workflows.
- iOS/Android workflows exist and are “real” (build + test), which is good.

**Potential gap:** PR workflow computes affected projects but does not currently use the `affected_web/affected_infra` outputs to skip jobs (jobs always run). This is fine for reliability, but you can optimize later.

### Security tooling
- Gitleaks + dependency-review + OSV scanner + CodeQL are configured.
- `.gitignore` includes `.env` and `.env*.local`, reducing accidental secret commits.

---

## Environment setup & gaps

### What’s strong
- Clear environment naming standard: `development | preview | production`.
- Clerk dev vs prod separation is explicit.
- Pulumi provisions a lot of env vars to Vercel (Sentry + OTel + Clerk keys, etc.).
- `tally-web/next.config.ts` loads the **root `.env`** for local builds/dev, which supports the “single root .env” workflow.

### Gaps / drift risks (most important)

1) **Convex env vars appear provisioned only for Vercel production in Pulumi**
   - `infra/index.ts` sets `CONVEX_DEPLOYMENT` + `NEXT_PUBLIC_CONVEX_URL` with `targets: ["production"]`.
   - But your standards/docs state dev/preview should use the dev deployment.
   - If preview/development rely on manual Vercel env vars, this violates “no clickops” and can silently drift.

2) **Clerk JWT issuer domain is required for Convex auth**
   - `tally-web/convex/auth.config.ts` requires `CLERK_JWT_ISSUER_DOMAIN`.
   - Ensure it is consistently set for local dev, CI, and Vercel preview/prod.

3) **LaunchDarkly IaC is partially disabled**
   - Pulumi LD provider is commented out due to provider issues.
   - Docs should explicitly acknowledge the exception and define an ownership process (what is managed via IaC vs dashboard).

4) **Two “web apps” exist in the repo**
   - `tally-web/` is real production.
   - root `/src` + root Vite configs look like legacy app code.
   - This increases onboarding time and creates accidental config coupling (e.g. root deps include many UI libs).

---

## Key interfaces / contracts

### 1) Convex DB schema (server contract)
Defined in `tally-web/convex/schema.ts`:
- `users`, `challenges`, `entries`, `followedChallenges`
- Useful indexes exist (`by_user`, `by_user_date`, etc.)

### 2) HTTP API surface (mobile/integration contract)
Defined in `tally-web/convex/http.ts`.

**Current endpoints (v0):**
- Authenticated:
  - `POST /api/auth/user`
  - `GET|POST /api/challenges`
  - `PATCH /api/challenges/{id}`
  - `GET|POST /api/entries`
  - `PATCH|DELETE /api/entries/{id}`
  - `GET|POST /api/followed`
  - `DELETE /api/followed/{idOrChallengeId}`
- Public:
  - `GET /api/public/challenges`
  - `GET /api/leaderboard`

**Recommendation:** before mobile GA, add **explicit API versioning**:
- e.g. `/api/v1/...` (keep `/api/...` as an alias during transition)
- This prevents breaking mobile clients if the contract evolves.

### 3) Shared types (canonical contract)
- `packages/shared-types` provides TS types + `schema.json`.

**Gap:** `tally-web/src/types/index.ts` appears to be a duplicate contract layer.

**Recommendation:** treat `@tally/shared-types` as canonical, and create a small adapter layer in web/mobile:
- Convex docs use `_id` / `Id<...>`; clients want stable `id: string`.
- Standardize on a **client-facing DTO shape** (`id`, `userId`, `challengeId` as strings).

---

## Risks & mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Preview/dev env drift in Vercel | hard-to-debug auth/API failures | High | manage all required env vars via Pulumi for all targets (prod/preview/dev) |
| Two web apps in repo | onboarding + config confusion | High | mark legacy root app as `legacy/` (or document strongly) and remove from primary tooling |
| Contract drift between web/mobile | mobile regressions | Medium | make `@tally/shared-types` canonical; add versioned API |
| LaunchDarkly IaC disabled | configuration drift | Medium | track provider fix + import resources; document exception + audit cadence |
| Observability over-collection | cost/noise | Low-Med | keep sampling (already present), ensure PII scrubbing (already present) |

---

## Next actions (smallest first)

1) **Document and label the legacy Vite/Spark root app** (README + maybe move under `legacy/` when safe).
2) **Audit required env vars** for web/convex in *each* environment:
   - local (`.env` / `tally-web/.env.local`)
   - CI (GitHub secrets)
   - Vercel (Pulumi-provisioned)
3) **Make Pulumi the source of truth for preview/dev Convex + Clerk JWT issuer** (eliminate clickops drift).
4) **Switch web to consume `@tally/shared-types`** and keep Convex/DTO adapters in `tally-web/src/lib/adapters.ts`.
5) **Decide API versioning strategy** (`/api/v1`) and implement a compatibility window.

---

## Appendix: consistency notes

- `tally-web/src/proxy.ts` correctly uses `clerkMiddleware()` (not deprecated `authMiddleware()`), and applies strong security headers + CSP.
- Sentry + OTel instrumentation is present (client/server/edge) and provisioned via Pulumi env vars.
- `tally-web/.env.local.example` is a good local template, but repo-level docs should clearly state whether root `.env` is the preferred workflow.
