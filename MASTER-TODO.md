# Master To-Do List

NEVER STOP TO ASK QUESTIONS - MAKE THE BEST DECISION WITHOUT COMPROMISING SECURITY OR OUR DESIGN PHILOSPHY (./design-philosophy.md)

## Bootstrapping guidelines (do this first)

### 1) GitHub repository secrets (from local `.env`)
Before any deploy/CI work, copy **all** secret values from the repo-root `.env` into **GitHub → Settings → Secrets and variables → Actions**.

To test deploys, use the simplest hello world type app if we don't have anything else to deploy.

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
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID
- VERCEL_PROD_URL
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
- Android SDK path must be configured or Gradle will fail:
  - set `ANDROID_HOME` (or `ANDROID_SDK_ROOT`), OR
  - create `local.properties` with `sdk.dir=...` (do not commit `local.properties`).


Quick check (OK/MISSING):
```bash
for c in bun node corepack xcodebuild xcrun tuist xcodegen java javac gradle adb emulator; do
  printf '%-10s ' "$c"; command -v "$c" >/dev/null 2>&1 && echo OK || echo MISSING;
done
```

### 3) Verify required integrations / automation access
- **GitHub CLI**: `gh auth status` (must have repo admin access to manage secrets/settings).
- **GitHub MCP server** (Copilot CLI built-in): used for Actions/PRs/issues inspection and automation verification.
- **CI/CD**: confirm GitHub Actions are enabled and visible at: https://github.com/crmitchelmore/tally/actions

- [ ] Work through this list end-to-end without stopping between items.
- [ ] After checking any item below, immediately commit.

### How to implement and verify each feature

**For all regular features (non-unique items)**: Use [.github/skills/implement-requirement-and-verify.md](.github/skills/implement-requirement-and-verify.md).
This skill guides the entire cycle: design, build, test (behavioral, unit, UI, E2E), deploy, verify, snapshot, mark complete, and update instructions/platforms.

**For unique/special items** (Store upload, CD, Observability): Follow the explicit steps listed under each feature.

---

## Web (plans/web-api)
- [ ] Plan overview (plans/web-api/README.md)
  - [ ] Verify scope and assumptions.
  - [ ] Update Copilot instructions and cross-platform plans with learnings after feature changes.
- [ ] Feature: Theme & structure (plans/web-api/feature-theme-structure.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: API client (plans/web-api/feature-api-client.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Auth (plans/web-api/feature-auth.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Challenges (plans/web-api/feature-challenges.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Community (plans/web-api/feature-community.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Data portability (plans/web-api/feature-data-portability.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Entries (plans/web-api/feature-entries.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Stats (plans/web-api/feature-stats.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md

## iOS (plans/ios)
- [ ] Plan overview (plans/ios/README.md)
  - [ ] Verify scope and assumptions.
  - [ ] Update Copilot instructions and cross-platform plans with learnings after feature changes.
- [ ] Feature: Theme & structure (plans/ios/feature-theme-structure.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: API client (plans/ios/feature-api-client.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Auth (plans/ios/feature-auth.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Challenges (plans/ios/feature-challenges.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Community (plans/ios/feature-community.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Data portability (plans/ios/feature-data-portability.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Entries (plans/ios/feature-entries.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Stats (plans/ios/feature-stats.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
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
- [ ] Feature: Theme & structure (plans/android/feature-theme-structure.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: API contract (plans/android/feature-api-contract.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Auth (plans/android/feature-auth.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Challenges (plans/android/feature-challenges.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Community (plans/android/feature-community.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Data portability (plans/android/feature-data-portability.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Entries (plans/android/feature-entries.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Stats (plans/android/feature-stats.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
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
  - [ ] Configure GitHub Actions workflow for automatic deployment on push to main.
  - [ ] Verify production URL and basic CTA behavior.
- [ ] Feature: App showcase (plans/landing-page/feature-app-showcase.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Feature showcase (plans/landing-page/feature-feature-showcase.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Hero micro demo (plans/landing-page/feature-hero-micro-demo.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: How it works (plans/landing-page/feature-how-it-works.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: iOS + Android pages (plans/landing-page/feature-ios-android-pages.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Live sync demo (plans/landing-page/feature-live-sync-demo.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md
- [ ] Feature: Testimonials + stats (plans/landing-page/feature-testimonials-stats.md)
  - [ ] Use .github/skills/implement-requirement-and-verify.md

## Observability (after all apps + landing page)
- [ ] Plan overview (plans/observability/README.md)
- [ ] Feature: Observability (plans/observability/feature-observability.md)
  - [ ] Implement OTel tracing + exporters to Honeycomb.
  - [ ] Implement PostHog events with identical names + properties across platforms.
  - [ ] Standardize structured wide-event logs (queryable context; trace correlation).

## E2E & UI Tests (after all platform features)

### Web: Playwright tests (covering Cucumber stories)
- [ ] Feature: Playwright E2E tests (plans/web-api/feature-playwright-e2e.md)
  - [ ] Set up Playwright with Bun/Next.js project.
  - [ ] Implement tests for cucumber/01-new-user-onboarding.feature
  - [ ] Implement tests for cucumber/02-offline-user-experience.feature
  - [ ] Implement tests for cucumber/03-challenge-management.feature
  - [ ] Implement tests for cucumber/04-entry-logging.feature
  - [ ] Implement tests for cucumber/05-community-features.feature
  - [ ] Implement tests for cucumber/06-user-registration.feature
  - [ ] Implement tests for cucumber/07-data-portability.feature
  - [ ] Verify all Playwright tests pass locally and in CI.
  - [ ] Run Playwright tests against production deployed web app and verify pass.

### iOS: UI Tests (XCUITest)
- [ ] Feature: iOS UI tests (plans/ios/feature-ui-tests.md)
  - [ ] Set up XCUITest target in Tuist project.
  - [ ] Implement UI tests for onboarding flow.
  - [ ] Implement UI tests for challenge management.
  - [ ] Implement UI tests for entry logging.
  - [ ] Implement UI tests for community features.
  - [ ] Implement UI tests for data portability.
  - [ ] Verify all UI tests pass locally and in CI.

### Android: UI Tests (Espresso / Compose UI Tests)
- [ ] Feature: Android UI tests (plans/android/feature-ui-tests.md)
  - [ ] Set up Espresso/Compose UI test module.
  - [ ] Implement UI tests for onboarding flow.
  - [ ] Implement UI tests for challenge management.
  - [ ] Implement UI tests for entry logging.
  - [ ] Implement UI tests for community features.
  - [ ] Implement UI tests for data portability.
  - [ ] Verify all UI tests pass locally and in CI.

## Final project: CI (after everything else)
- [ ] Add CI (lint/build/test and any existing checks).
- [ ] Add preview deploy workflow(s) for PRs (optional, but recommended).

## Final: Push to GitHub & Resolve Security Issues
- [ ] Feature: GitHub push & security resolution (plans/feature-github-security.md)
  - [ ] Push all changes to GitHub remote.
  - [ ] Review Dependabot alerts and resolve critical/high vulnerabilities.
  - [ ] Review CodeQL/secret scanning alerts and remediate.
  - [ ] Enable branch protection rules on main.
  - [ ] Verify all security issues are resolved or triaged.
