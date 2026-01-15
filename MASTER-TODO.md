# Master To-Do List

NEVER STOP TO ASK QUESTIONS - MAKE THE BEST DECISION WITHOUT COMPROMISING SECURITY OR OUR DESIGN PHILOSPHY (./design-philosophy.md)

## Bootstrapping guidelines (do this first)

### 1) GitHub repository secrets (from local `.env`)
Before any deploy/CI work, copy **all** secret values from the repo-root `.env` into **GitHub → Settings → Secrets and variables → Actions**.

Preferred (scripted, avoids pasting values in UI):
```bash
# From repo root
set -euo pipefail

# Requires GitHub CLI auth (`gh auth status`) and repo admin access.
# IMPORTANT: this reads `.env` locally; it does NOT print secret values.
while IFS='=' read -r key value; do
  [[ -z "${key:-}" ]] && continue
  [[ "$key" =~ ^# ]] && continue
  [[ -z "${value:-}" ]] && continue
  gh secret set "$key" --repo crmitchelmore/tally --body "$value" >/dev/null
  echo "set $key"
done < .env
```

Verify secrets exist (names only):
```bash
gh secret list --repo crmitchelmore/tally
```

**Required secret names (no values):**
- CLERK_SECRET_KEY
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLOUDFLARE_API_TOKEN
- CONVEX_DEPLOYMENT
- IOS_BUNDLE_ID
- ANDROID_PACKAGE_NAME
- APP_STORE_CONNECT_ISSUER_ID
- APP_STORE_CONNECT_KEY_ID
- APP_STORE_CONNECT_PRIVATE_KEY_PATH
- IOS_PROVISIONING_PROFILE_PATH
- IOS_SIGNING_CERT_P12_PATH
- NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID
- NEXT_PUBLIC_POSTHOG_HOST
- NEXT_PUBLIC_POSTHOG_KEY
- POSTHOG_ADMIN_TOKEN
- TEST_USER_EMAIL
- TEST_USER_PASSWORD
- VERCEL_API_TOKEN
- IOS_SIGNING_CERT_PASSWORD
- IOS_KEYCHAIN_PASSWORD
- GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
- ANDROID_KEYSTORE_PASSWORD
- ANDROID_KEY_ALIAS
- ANDROID_KEY_PASSWORD
- ANDROID_KEYSTORE_BASE64
- IOS_TEAM_ID
- HONEYCOMB_API_KEY

### 2) Verify toolchains are available (local + CI)
These are the minimum tools we rely on for building/verifying across platforms.

**Web (Next.js / Bun):**
- `bun`, `node`, `corepack`

**iOS:**
- `xcodebuild`, `xcrun`
- `tuist` (or `xcodegen` depending on the plan)

**Android:**
- `java`/`javac`, `gradle`, `adb`
- Android Emulator (recommended for device-level verification): `emulator` (from Android SDK)

**Infra:**
- `pulumi`, `npm`

Quick check (OK/MISSING):
```bash
for c in bun node corepack xcodebuild xcrun tuist xcodegen java javac gradle adb emulator pulumi npm; do
  printf '%-10s ' "$c"; command -v "$c" >/dev/null 2>&1 && echo OK || echo MISSING;
done
```

### 3) Verify required integrations / automation access
- **GitHub CLI**: `gh auth status` (must have repo admin access to manage secrets/settings).
- **GitHub MCP server** (Copilot CLI built-in): used for Actions/PRs/issues inspection and automation verification.
- **CI/CD**: confirm GitHub Actions are enabled and visible at: https://github.com/crmitchelmore/tally/actions

- [ ] Work through this list end-to-end without stopping between items.
- [ ] After checking any item below, immediately commit.

## Web (plans/web-api)
- [ ] Plan overview (plans/web-api/README.md)
  - [ ] Verify scope and assumptions.
  - [ ] Update Copilot instructions and cross-platform plans with learnings after feature changes.
- [ ] Feature: API client (plans/web-api/feature-api-client.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (none for web; review iOS/Android).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Push live using credentials in .env.
  - [ ] Verify on the remote environment.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Auth (plans/web-api/feature-auth.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (none for web; review iOS/Android).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Push live using credentials in .env.
  - [ ] Verify on the remote environment.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Challenges (plans/web-api/feature-challenges.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (none for web; review iOS/Android).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Push live using credentials in .env.
  - [ ] Verify on the remote environment.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Community (plans/web-api/feature-community.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (none for web; review iOS/Android).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Push live using credentials in .env.
  - [ ] Verify on the remote environment.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Data portability (plans/web-api/feature-data-portability.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (none for web; review iOS/Android).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Push live using credentials in .env.
  - [ ] Verify on the remote environment.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Entries (plans/web-api/feature-entries.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (none for web; review iOS/Android).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Push live using credentials in .env.
  - [ ] Verify on the remote environment.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Leaderboard (plans/web-api/feature-leaderboard.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (none for web; review iOS/Android).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Push live using credentials in .env.
  - [ ] Verify on the remote environment.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Stats (plans/web-api/feature-stats.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (none for web; review iOS/Android).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Push live using credentials in .env.
  - [ ] Verify on the remote environment.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.

## iOS (plans/ios)
- [ ] Plan overview (plans/ios/README.md)
  - [ ] Verify scope and assumptions.
  - [ ] Update Copilot instructions and cross-platform plans with learnings after feature changes.
- [ ] Feature: API client (plans/ios/feature-api-client.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review Android/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Build on simulators using production environments.
  - [ ] Verify on simulators.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Auth (plans/ios/feature-auth.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review Android/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Build on simulators using production environments.
  - [ ] Verify on simulators.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Challenges (plans/ios/feature-challenges.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review Android/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Build on simulators using production environments.
  - [ ] Verify on simulators.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Community (plans/ios/feature-community.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review Android/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Build on simulators using production environments.
  - [ ] Verify on simulators.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Data portability (plans/ios/feature-data-portability.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review Android/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Build on simulators using production environments.
  - [ ] Verify on simulators.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Entries (plans/ios/feature-entries.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review Android/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Build on simulators using production environments.
  - [ ] Verify on simulators.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Leaderboard (plans/ios/feature-leaderboard.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review Android/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Build on simulators using production environments.
  - [ ] Verify on simulators.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Stats (plans/ios/feature-stats.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review Android/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Build on simulators using production environments.
  - [ ] Verify on simulators.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Store upload (pre-release) (plans/ios/feature-store-upload.md)
  - [ ] Prepare App Store Connect metadata and required assets.
  - [ ] Create and upload a signed build to App Store Connect.
  - [ ] Configure TestFlight for internal/external beta.
  - [ ] Submit for (TestFlight/App) review if required.
  - [ ] Wait for approval / address rejections until beta distribution is unblocked.

## Android (plans/android)
- [ ] Plan overview (plans/android/README.md)
  - [ ] Verify scope and assumptions.
  - [ ] Update Copilot instructions and cross-platform plans with learnings after feature changes.
- [ ] Feature: API contract (plans/android/feature-api-contract.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review iOS/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Build on simulators using production environments.
  - [ ] Verify on simulators.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Auth (plans/android/feature-auth.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review iOS/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Build on simulators using production environments.
  - [ ] Verify on simulators.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Challenges (plans/android/feature-challenges.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review iOS/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Build on simulators using production environments.
  - [ ] Verify on simulators.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Community (plans/android/feature-community.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review iOS/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Build on simulators using production environments.
  - [ ] Verify on simulators.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Data portability (plans/android/feature-data-portability.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review iOS/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Build on simulators using production environments.
  - [ ] Verify on simulators.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Entries (plans/android/feature-entries.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review iOS/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Build on simulators using production environments.
  - [ ] Verify on simulators.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Leaderboard (plans/android/feature-leaderboard.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review iOS/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Build on simulators using production environments.
  - [ ] Verify on simulators.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Stats (plans/android/feature-stats.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review iOS/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Build on simulators using production environments.
  - [ ] Verify on simulators.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Store upload (pre-release) (plans/android/feature-store-upload.md)
  - [ ] Prepare Play Console listing metadata, forms, and required assets.
  - [ ] Create and upload a signed AAB to an internal/closed testing track.
  - [ ] Configure beta testing groups/link and verify install on device.
  - [ ] Submit for review if required.
  - [ ] Wait for approval / address rejections until beta distribution is unblocked.

## Landing pages (plans/landing-page)
- [ ] Plan overview (plans/landing-page/README.md)
  - [ ] Verify scope and assumptions.
  - [ ] Update Copilot instructions and cross-platform plans with learnings after feature changes.
- [ ] Feature: CD (deploy early) (plans/landing-page/feature-cd.md)
  - [ ] Ship a hello world landing page + web app to production.
  - [ ] Verify production URL and basic CTA behavior.
- [ ] Feature: App showcase (plans/landing-page/feature-app-showcase.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review iOS/Android/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Feature showcase (plans/landing-page/feature-feature-showcase.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review iOS/Android/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Hero micro demo (plans/landing-page/feature-hero-micro-demo.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review iOS/Android/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: How it works (plans/landing-page/feature-how-it-works.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review iOS/Android/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: iOS + Android pages (plans/landing-page/feature-ios-android-pages.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review iOS/Android/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Live sync demo (plans/landing-page/feature-live-sync-demo.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review iOS/Android/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.
- [ ] Feature: Testimonials + stats (plans/landing-page/feature-testimonials-stats.md)
  - [ ] Design based on design-philosophy.md.
  - [ ] Verify plan against existing implementations on other platforms (review iOS/Android/Web).
  - [ ] Build it out.
  - [ ] Add behavioral tests.
  - [ ] Add unit tests.
  - [ ] Verify with UI tests.
  - [ ] Verify with end-to-end tests.
  - [ ] Add snapshot tests to confirm visuals.
  - [ ] Mark tests complete.
  - [ ] Update Copilot instructions/skills and any affected plans with learnings from this feature.
  - [ ] Update other platform feature plans with any changes.

## Observability (after all apps + landing page)
- [ ] Plan overview (plans/observability/README.md)
- [ ] Feature: Observability (plans/observability/feature-observability.md)
  - [ ] Implement OTel tracing + exporters to Honeycomb.
  - [ ] Implement PostHog events with identical names + properties across platforms.
  - [ ] Standardize structured wide-event logs (queryable context; trace correlation).

## Final project: CI (after everything else)
- [ ] Add CI (lint/build/test and any existing checks).
- [ ] Add preview deploy workflow(s) for PRs (optional, but recommended).
