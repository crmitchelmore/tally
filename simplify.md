# Simplify Tally: migration plan (keep Convex + native mobile)

Date: 2026-01-13

## Goals

- Keep the current product architecture (Convex backend, **native iOS + Android**, Next.js web).
- Reduce operational surface area by:
  - Dropping **Pulumi** (short-term) in favor of **local CLIs + small scripts**.
  - Consolidating observability to **one primary stack**.
  - Avoiding “shadow IaC” (mystery dashboard state) by making every manual step repeatable.

## Non-negotiables / constraints

- ✅ Keep Convex.
- ✅ Keep iOS + Android apps.
- ✅ Keep Vercel + Cloudflare (already in use).
- ❌ Drop Pulumi (and Pulumi-first standards) for now.

---

## Current state (what Pulumi manages today)

From `infra/index.ts` and `docs/IAC.md`, Pulumi currently manages:

- **Cloudflare DNS**
  - `@` A → `76.76.21.21` (Vercel)
  - `www` CNAME → `cname.vercel-dns.com`
  - `_vercel` TXT → domain verification
  - Clerk CNAMEs: `clerk`, `accounts`, `mail` (Clerk proxy subdomains)

- **Vercel**
  - Project config (prod stack)
  - Environment variables (Clerk keys, Convex deployment/URL, Sentry, PostHog, etc.)

- **Clerk config**
  - Redirect URLs (via API calls from Pulumi)

- **Observability + analytics provisioning** (varies)
  - Sentry provisioning plan assumes Pulumi
  - Grafana Cloud (OTel) plan assumes Pulumi
  - PostHog env wiring assumes Pulumi

---

## Target simplified stack (recommended)

### Runtime stack

- Web: **Next.js on Vercel**
- Backend/data: **Convex**
- Auth: **keep Clerk for now** (recommended), or migrate to **Convex Auth** with a gated rollout
- Observability: **Sentry-only** (errors + performance + releases) + platform-native logs

### “Config management” stack (replace Pulumi)

- Vercel: **Vercel CLI** + a repo script that sets env vars & domains
- Cloudflare DNS: **Cloudflare API (curl)** or `wrangler` (one CLI)
- Clerk: Clerk dashboard or Clerk API script (keep small + explicit)
- Sentry: Sentry dashboard + `sentry-cli` where needed for builds (source maps, dSYMs, mapping)

---

## Can we do auth with Convex?

Yes, but with an important nuance:

- **Convex itself** expects authentication to arrive as **validated identity tokens/JWTs** (it doesn’t “magically do passwords” by itself).
- **Convex Auth** is an official library that lets you run auth “inside Convex” (email/password, OAuth via Auth.js ecosystem, magic links/OTP, etc.), but it’s still an auth system you must integrate and operate.
- For **native Swift/Kotlin** apps, the ergonomics are usually better with a dedicated auth provider (Clerk) unless you’re ready to build/own the full OAuth + deep-link + token storage story.

**Recommendation:** keep Clerk now (fastest path for native apps), and consider Convex Auth as a follow-up simplification once mobile auth UX is stable.

Sources: https://docs.convex.dev/auth and https://docs.convex.dev/auth/convex-auth

---

## Phase 0 — Inventory + freeze (1–2 hours)

1. Snapshot current infra state (so we can reproduce without Pulumi):
   - Vercel
     - project settings (rootDirectory, domains)
     - all environment variables per target (development/preview/production)
   - Cloudflare DNS records for `tally-tracker.app`
   - Clerk
     - instances (dev + prod)
     - allowed redirect URLs + frontend API domain settings
   - Sentry
     - projects + DSNs + auth token usage

2. Add a rule: **no infra changes** during Phase 1 migration except through the new scripts.

Acceptance:
- We can rebuild the full “infra config” from the snapshots even if Pulumi is removed.

---

## Phase 1 — Stop using Pulumi (no behavior change) (0.5–1 day)

### 1.1 Disable Pulumi as a dependency

- Stop running `pulumi up` as part of any workflow (if present).
- Treat `infra/` as read-only “legacy source of truth” until Phase 4.

### 1.2 Replace Pulumi-managed Vercel config with Vercel CLI

Create a small set of scripts (shell or node) that do **only**:

- `vercel link` (one-time)
- set env vars for each target
- ensure domains exist

Proposed scripts (names are suggestions):

- `scripts/vercel/link.sh`
- `scripts/vercel/env-push.sh` (reads from root `.env` and maps to Vercel targets)
- `scripts/vercel/domains.sh`

Notes:
- Keep a single mapping table in-repo (keys + which target).
- Never print secret values.

### 1.3 Replace Pulumi-managed Cloudflare DNS with API script

Create:

- `scripts/cloudflare/dns-upsert.sh`

Responsibilities:
- Upsert the minimal DNS records we need:
  - `@` A record → Vercel IP
  - `www` CNAME → Vercel
  - `_vercel` TXT verification
  - Clerk proxy CNAMEs (only if we keep Clerk proxy subdomains)

### 1.4 Replace Pulumi-managed Clerk redirects

Two paths (pick one):

- **Manual (simplest):** document the exact redirect URL list and update via Clerk dashboard.
- **Scripted:** `scripts/clerk/redirects-sync.sh` calling Clerk API with an admin token.

Acceptance:
- New developer can run the scripts and get Vercel + DNS + Clerk configured without touching Pulumi.

Rollback:
- Pulumi stacks remain intact; we can resume Pulumi management if needed.

---

## Phase 2 — Auth strategy (decision gate)

### Option A (recommended): keep Clerk, simplify footprint (0.5 day)

Goal: keep native-mobile-friendly auth, but reduce moving parts.

- Keep Clerk as the identity provider for web + iOS + Android.
- Minimize custom domain/proxy features unless they provide user value.
  - If we don’t need `clerk.tally-tracker.app` / `accounts.*` / `mail.*`, consider reverting to Clerk-hosted domains later (reduces DNS + potential breakage).

Acceptance:
- iOS/Android can authenticate without bespoke OAuth plumbing.

### Option B: migrate to Convex Auth (1–2+ weeks, gated)

Gated rollout plan:

1. Web-only pilot first (replace Clerk on web)
   - Introduce Convex Auth in web
   - Migrate “current user” derivation logic (today it syncs Clerk user into Convex)
   - Update Convex auth helpers to trust Convex Auth identity

2. Mobile feasibility spike (native)
   - Confirm supported flow for Swift/Kotlin:
     - system browser OAuth + deep link callback OR
     - embedded web auth flow + token handoff
   - Implement secure token storage, refresh, logout, and session restoration

3. Only after mobile spike passes: remove Clerk.

Risks:
- Convex Auth is evolving; API changes can cost time.
- Native mobile integration is more work than React web.

Decision gate:
- If mobile auth spike exceeds the planned budget, stop and keep Clerk.

---

## Phase 3 — Observability simplification (0.5–1 day)

### Recommended: Sentry as the single observability tool

Keep:
- **Sentry** for:
  - web errors + performance
  - mobile crashes/ANRs
  - backend (Convex actions / HTTP actions) error reporting

Drop (for now):
- **Grafana Cloud + OTel** (Tempo/Loki/Mimir) and any OTel env vars/log drains.

Use platform-native logs instead:
- Web: Vercel logs
- Backend: Convex dashboard logs
- Mobile: Xcode/Logcat + crash reports in Sentry

Why this is simpler:
- One place to look for user-impacting issues (Sentry).
- No extra tokens, exporters, log drains, dashboards, alert rules.

### Analytics (separate from observability)

Decide explicitly:
- If you need product analytics: keep **PostHog**.
- If you don’t: remove PostHog and rely on lightweight signals (App Store metrics + Vercel analytics).

Feature flags:
- Drop **LaunchDarkly**.
- If we still need flags, consolidate to either:
  - **PostHog feature flags** (if we keep PostHog), or
  - a small “server-driven config” document/table in **Convex**.

Acceptance:
- Sentry is wired across web + iOS + Android + Convex.
- No Grafana/OTel secrets required.

---

## Phase 4 — Repo cleanup (after 1–2 weeks stable)

- Update docs:
  - Deprecate `docs/IAC.md` (replace with “Config via CLI/scripts”)
  - Add a single runbook:
    - how to set DNS
    - how to configure Vercel
    - how to configure auth
    - how to rotate secrets

- Archive or remove `infra/` (optional) once we’ve proven scripts cover everything.

---

## Definition of Done (overall)

- No Pulumi required for day-to-day operations.
- Infra/config is reproducible via scripts + documented manual steps.
- Auth direction is explicit (Clerk retained, or Convex Auth implemented + mobile plan verified).
- Observability is “one pane” (Sentry), with clear guidance on where logs live.
