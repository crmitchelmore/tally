# Sentry integration plan (Tally)

## Goals

- Add **crash + error monitoring**, **performance monitoring**, and **release health** across **Web (Next.js)**, **Backend (Convex)**, **iOS**, and **Android**.
- Be **IaC-first**: create/configure Sentry org resources **programmatically** (no dashboard clickops).
- Keep privacy sane: default to **no PII**, scrub aggressively, and make session replay opt-in.

## Scope (what we will instrument)

| Surface | What we’ll capture | Sentry project |
|---|---|---|
| Web (Next.js client) | JS exceptions, unhandled rejections, navigation spans, Web Vitals, fetch/XHR breadcrumbs, (optional) Session Replay | `javascript-nextjs` |
| Web (Next.js server/edge) | Server exceptions, route/action timings, outbound fetch spans/breadcrumbs | `javascript-nextjs` (same project) |
| Backend (Convex) | Action failures, HTTP action errors, background job failures, key latency spans | `convex-backend` (new) |
| iOS (Swift/SwiftUI) | Native crashes, app hangs, network breadcrumbs, launch time, key screen transactions | `ios` (new) |
| Android (Kotlin/Compose) | Native crashes, ANRs, network breadcrumbs (OkHttp), launch time, key screen transactions | `android` |

## IaC-first provisioning (Pulumi in `infra/`)

### Why
We already manage SaaS config via Pulumi + `@pulumi/command` (see Clerk redirect URLs in `infra/index.ts`). We’ll do the same for Sentry using `SENTRY_ADMIN_TOKEN` from the root `.env`.

### What we provision via IaC
Provision these Sentry resources **programmatically** (via Sentry REST API calls invoked from Pulumi):

1. **Projects** (idempotent create-if-missing):
   - `javascript-nextjs` (already referenced by wizard)
   - `android` (already referenced by wizard)
   - `ios` (create)
   - `convex-backend` (create)

2. **Environments** (consistent across apps): `development`, `staging`, `production`

3. **Client keys (DSNs)** per project (read/export the DSN we’ll use in apps)

4. **Project-scoped auth tokens** for CI uploads (store as Pulumi secrets):
   - Source maps upload token for `javascript-nextjs`
   - Proguard/R8 mapping upload token for `android`
   - dSYM upload token for `ios`

5. **Alerting (minimum viable)**
   - New issue notifications (Slack/email later)
   - Regressions (new issue spike)
   - Performance degradation (p95 threshold on key transactions)

### Implementation approach (Pulumi)
- Add Sentry section to `infra/index.ts` (or split to `infra/sentry.ts` and import) using `@pulumi/command` to call the Sentry API.
- Read token from Pulumi config (secret):
  - `pulumi config set --secret sentryAdminToken <value from .env:SENTRY_ADMIN_TOKEN>`
- Use `curl` + `jq` in `command.local.Command` resources to:
  - GET-or-POST projects by slug
  - GET project keys to extract DSN
  - POST token(s) with least-privilege scopes for uploads

### Feeding config into runtimes (also IaC)

**Vercel (Next.js)**: managed via Pulumi using `vercel.ProjectEnvironmentVariable` (we already do this for Clerk/Convex).
Set at minimum:

- `NEXT_PUBLIC_SENTRY_DSN` (public DSN)
- `SENTRY_DSN` (server DSN; can be same)
- `SENTRY_ORG=tally-lz`
- `SENTRY_PROJECT=javascript-nextjs`
- `SENTRY_AUTH_TOKEN` (secret; for source map uploads during build)
- `SENTRY_ENVIRONMENT=production` (or set per target)

**Convex**: set env vars programmatically (no dashboard):
- Prefer CI step using Convex CLI (recommended once we formalize deployment):
  - `npx convex env set SENTRY_DSN ...`
  - `npx convex env set SENTRY_ENVIRONMENT production`
- If/when we manage Convex deploy via IaC, wrap CLI calls in Pulumi `command.local.Command` (requires Convex admin/deploy creds).

**iOS/Android**: DSN can be shipped in app config, but upload tokens must be provided only in CI/build environments.
- Keep `SENTRY_AUTH_TOKEN` out of source control; inject via CI secrets.

## Web (Next.js) integration

### Bootstrap
Run exactly:

```bash
npx @sentry/wizard@latest -i nextjs --saas --org tally-lz --project javascript-nextjs
```

### Required code/config outcomes
- `@sentry/nextjs` installed and configured (client + server)
- Source maps upload enabled for production builds
- Release injected (Git SHA or version) so issues group per release

### What to capture (recommended defaults)
- Errors: `100%`
- Performance traces (production): start at `10%` (`SENTRY_TRACES_SAMPLE_RATE=0.1`)
- Session Replay (privacy-first):
  - `replaysSessionSampleRate=0.0`
  - `replaysOnErrorSampleRate=0.1`
  - `maskAllText=true`, `blockAllMedia=true`

### User identity + privacy
- Do **not** send email/name by default.
- Set Sentry user to the Clerk user id only:
  - `Sentry.setUser({ id: clerkId })`
- Add tags for debugging (safe, non-PII): `app=web`, `env`, `release`, `route`.

## Backend (Convex) integration

### Goal
Capture errors that happen inside Convex (not just the client-side symptom) and measure latency for key actions.

### Plan
1. Create a dedicated Sentry project: `convex-backend`.
2. Start by instrumenting **Convex actions / HTTP actions** (Node runtime) with Sentry’s Node SDK.
3. For queries/mutations (if SDK constraints exist), fall back to:
   - Capturing structured error metadata in logs
   - Optionally sending Sentry events via a lightweight envelope POST (only for unexpected errors)

### What to capture
- Uncaught exceptions + rejected promises in actions
- Action names as transaction/span names
- Tags: `app=convex`, `action`, `deployment`, `requestId`
- Breadcrumbs: upstream request metadata (no bodies), external API calls (if any)

## iOS integration

### Bootstrap (Homebrew)
Install tooling:

```bash
brew install getsentry/tools/sentry-cli getsentry/tools/sentry-wizard
```

Then run the wizard (project slug should be `ios`):

```bash
sentry-wizard -i ios --saas --org tally-lz --project ios
```

### What to capture
- Crash reporting: on by default
- App hangs: enable (with sensible thresholds)
- Performance: app start + key screen navigation spans
- Network breadcrumbs: URL + status code (no payloads)

### Symbolication (dSYMs)
- Configure `sentry-cli` dSYM upload in an Xcode build phase.
- Provide `SENTRY_AUTH_TOKEN` only in CI/build environment.

## Android integration

### Bootstrap
Run exactly:

```bash
brew install getsentry/tools/sentry-wizard && sentry-wizard -i android --saas --org tally-lz --project android
```

### What to capture
- Crash reporting + ANRs
- Performance: cold/warm start, key Compose navigation spans
- Network breadcrumbs: OkHttp integration

### Mapping upload (Proguard/R8)
- Use Sentry Gradle plugin to upload mapping files.
- Provide `SENTRY_AUTH_TOKEN` only in CI/build environment.

## Release strategy (shared across all apps)

- **Release identifier**: `tally@<semver>+<gitsha>` (or `<bundleVersion>-<sha>` for mobile).
- Upload artifacts tied to the release:
  - Web: source maps
  - iOS: dSYMs
  - Android: mapping.txt
- Track **release health** (crash-free users/sessions).

## Alerting & dashboards (minimum viable)

Set up (via API/IaC):
- Alerts:
  - New issue in `production` (all projects)
  - Error spike (rate-based)
  - Performance regression (p95 transaction threshold for critical flows)
- Dashboards:
  - Web: p95 route latency + error rate
  - Mobile: crash-free sessions + ANR rate
  - Backend: action error rate + p95 latency

## Rollout order (low risk → high value)

1. **IaC**: provision Sentry projects, DSNs, and upload tokens via Pulumi.
2. **Next.js**: run wizard, wire env vars via Pulumi to Vercel, verify source maps + one forced error.
3. **Convex**: add backend project and minimal action instrumentation, verify an error appears with action tags.
4. **Android**: run wizard, verify crash + mapping upload.
5. **iOS**: run wizard, verify crash + dSYM upload.
6. Tighten sampling + privacy, then enable replay-on-error for web.

## Verification checklist (per platform)

- A test exception appears in the correct **project** and **environment**
- Release is attached and stack traces are **de-minified / symbolicated**
- Tags include `app`, `env`, and `release`
- PII is not present (no emails, no request bodies)
- Performance transactions show up for at least one key flow
