# LaunchDarkly integration plan (Tally)

## Goals
- Introduce **feature flags + experiments** consistently across **web (Next.js)**, **iOS (Swift/SwiftUI)**, and **Android (Kotlin/Compose)**.
- Standardise **flag keys**, **contexts/identity**, and **environment strategy** so rollouts are predictable.
- Keep configuration **IaC-first** and secrets handled safely.

## Non-goals
- Turning every UI detail into a flag.
- Storing secrets in git or shipping admin tokens to clients.

---

## 0) LaunchDarkly project + IaC rule
1. Create a LaunchDarkly project and environments (recommended):
   - `dev`, `preview`, `prod`
2. **Infrastructure as Code (IaC) rule**: any provider configuration we control (e.g. Vercel env vars, build-time env, domains/redirects, CI secrets) must be managed via **Pulumi** in `infra/` — avoid manual dashboard edits.
   - Note: LaunchDarkly flag creation/rules are managed in LaunchDarkly itself unless we adopt the LaunchDarkly Terraform provider (optional, see §7).

---

## 1) Secrets + environment variables
### 1.1 Admin/API token (server-side only)
- `LAUNCHDARKLY_ADMIN_TOKEN=...`
  - Store via Pulumi-managed secrets / hosting provider secret env vars.
  - Never expose to client code.

### 1.2 SDK keys (per environment)
LaunchDarkly uses environment-specific SDK keys. Store per-app and per-env:
- Web (server/client as needed):
  - `LAUNCHDARKLY_SERVER_SDK_KEY=...` (server only)
  - `NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID=...` (client-safe identifier)
- iOS:
  - `LAUNCHDARKLY_MOBILE_KEY_IOS=...`
- Android:
  - `LAUNCHDARKLY_MOBILE_KEY_ANDROID=...`

> Key handling for mobile: inject via build configs (xcconfig / Gradle properties / CI secrets), not hardcoded in source.

---

## 2) Flag taxonomy (cross-platform)
### 2.1 Naming
- Use kebab-case, product-oriented keys:
  - `new-onboarding`
  - `community-v2`
  - `streaks-enabled`
  - `entry-note-redesign`

### 2.2 Default rule
- Defaults must be safe (usually **off**).
- A flag should include:
  - owner, expiry/cleanup date, and a short description

### 2.3 Variation types
- Boolean for rollouts (preferred)
- String/JSON only when necessary (e.g. “variant = a|b”)

---

## 3) Identity / context strategy (important)
Use the same stable user identifier everywhere:
- Primary key: `clerkId` (when authenticated)
- Anonymous: a device/session id (web cookie/localStorage; mobile install id)

Context attributes (safe, low-cardinality):
- `platform: web | ios | android`
- `env: dev | preview | prod`
- `appVersion`
- Optional segmentation (careful): `locale`, `timezone`, `country` (if available)

Avoid:
- emails in context unless explicitly required
- high-cardinality fields (free text, IDs beyond user key)

---

## 4) Web (tally-web, Next.js App Router)
### 4.1 Integration approach
Recommended approach:
- **Server-side evaluation** for SSR/edge-sensitive decisions (using server SDK key)
- **Client-side evaluation** for UI toggles (using client-side ID)

### 4.2 Where to wire it
- Create a small `FeatureFlagsProvider` (client) that:
  - initializes LD client with `NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID`
  - identifies when Clerk user is available
  - exposes a typed `useFlag("flag-key")`

- For server components / API routes:
  - use server SDK keyed by `LAUNCHDARKLY_SERVER_SDK_KEY`
  - evaluate flags using the same context shape

### 4.3 Initial flags to add
- `new-onboarding`
- `community-v2`
- `streaks-enabled`

---

## 5) iOS (tally-ios, Swift/SwiftUI)
### 5.1 Integration approach
- Initialize LaunchDarkly early (app startup) with the mobile key.
- Identify the user once authenticated (use `clerkId`), and include `platform/env/appVersion` attributes.

### 5.2 Usage pattern
- Prefer a thin wrapper:
  - `FeatureFlags.isEnabled("streaks-enabled")`
- Ensure flag values update reactively (publish/subscribe) to support live rollouts.

---

## 6) Android (tally-android, Kotlin/Compose)
### 6.1 Integration approach
- Initialize in `Application` with the mobile key.
- Identify after auth with `clerkId` and consistent attributes.

### 6.2 Usage pattern
- Provide a simple flags service + Compose-friendly observable state.

---

## 7) IaC options for LaunchDarkly configuration
### Option A (minimum): Pulumi for app/provider config only
- Use Pulumi to manage:
  - Vercel env vars (web)
  - CI secrets for mobile builds
  - any infra wiring needed for releases
- Manage flags/rules manually in LaunchDarkly UI.

### Option B (strong IaC): manage flags via Terraform provider
- Adopt LaunchDarkly’s Terraform provider to codify:
  - projects/environments
  - flags, variations, targeting rules
- Pulumi can still be the orchestrator (run Terraform via CI) or we keep Terraform separate.

---

## 8) Rollout plan (safe + incremental)
1. **Week 1**: Create project/envs; wire web client evaluation for 1 flag; verify targeting.
2. **Week 2**: Add server-side evaluation where needed; add identity consistency (Clerk).
3. **Week 3**: Add iOS + Android SDKs; verify parity and context attributes.
4. Ongoing: convert risky launches to gradual rollouts; remove stale flags regularly.

---

## 9) Acceptance checks
- Flags can be toggled per environment without deploy.
- Web + mobile all evaluate the same flag keys with consistent user context.
- No admin token is present in client bundles.
- Defaults are safe and rollouts are reversible.
