# Copilot Instructions (Tally)

Work autonomously. Agents here often run unattended (`scripts/auto-copilot.sh`, `scripts/ralph.sh`), so when something is ambiguous, make the best decision that keeps security and the design philosophy intact, note the assumption, and keep going rather than stopping to ask.

Use this philosophy in all product work:
- Tactile: interactions feel like marking paper; clear visual feedback.
- Focused: minimal UI; numbers and progress are central.
- Honest: no gimmicks; show real progress and pace.

Principles to uphold:
- Friendly, playful, fast, and calm.
- Progressive disclosure; reduce cognitive load.
- Subtle motion with reduced-motion support.
- Accessible, high-contrast, readable type and large tap targets.
- Offline-first mindset with clear sync states.

Reference `DESIGN-PHILOSOPHY.md` (repo root) whenever building anything new to remember the way we do it.

Reference `tech-stack-requirements.md` (repo root) to pick the right tools and technologies.

Task checklists live in `.github/skills/` as plain Markdown (hosts do not auto-load them): `implement-requirement-and-verify.md` for `MASTER-TODO.md` items and `plans/**/feature-*.md`, `feature-map-parity.md` for scope and cross-platform parity, `brand-guidelines.md` for visuals, and `performance-accessibility.md` for motion, media and key flows.

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages. These drive automated version bumps and iOS TestFlight releases.

### Commit types and version impact
| Prefix | Version bump | Example |
|--------|-------------|---------|
| `feat:` | Minor (0.x.0) | `feat(ios): add streak animation` |
| `fix:` | Patch (0.0.x) | `fix: prevent crash on empty challenge` |
| `perf:` | Patch (0.0.x) | `perf(api): reduce response time` |
| `docs:` | No release | `docs: update README` |
| `chore:` | No release | `chore: update dependencies` |
| `ci:` | No release | `ci: add smoke test step` |
| `test:` | No release | `test: add entry edge cases` |
| `refactor:` | No release | `refactor: extract challenge service` |
| `style:` | No release | `style: fix indentation` |
| `build:` | No release | `build: update Tuist config` |
| `!` after type | **Major** (x.0.0) | `feat!: redesign challenge API` |
| `BREAKING CHANGE:` in body | **Major** (x.0.0) | (any type with breaking body) |

### Scopes
Use optional scopes for clarity: `feat(ios):`, `fix(web):`, `fix(android):`, `perf(api):`.

## Release Process

iOS releases are automated via conventional commits:

1. Push to `main` → CI runs (web, iOS, Android build + test)
2. CI passes → auto-release job parses commits since last `ios-v*` tag
3. If releasable commits exist (`feat:`, `fix:`, `perf:`, or breaking) → bumps `ios/VERSION`, creates `ios-v*` tag
4. Tag push → TestFlight workflow builds, signs, and uploads to App Store Connect

**No manual tagging is needed.** Just use the correct conventional commit prefix and push to main.

To force a release for non-standard commit types, use `fix:` or `feat:` prefix as appropriate.

## App Store Connect API

When working with the ASC API (`/v1/builds`):
- `filter[version]` filters by **CFBundleVersion** (build number like `26021158`), NOT marketing version
- `filter[preReleaseVersion.version]` filters by **CFBundleShortVersionString** (marketing version like `1.2.0`)
- Build number in API responses may appear as `attributes.version` or `attributes.buildNumber` — check both
- ASC JWT signing requires ES256 with `dsaEncoding: 'ieee-p1363'`

## Cross-Platform API Contracts

When modifying API endpoints:
1. **Document the response shape** - iOS/Android decoders are strict
2. **Verify all platforms consume the same format** - especially nested objects
3. Web API returns camelCase JSON; do NOT use snake_case conversion on clients

### Common API Formats
- `/api/v1/challenges` returns `{ challenges: [{ challenge: Challenge, stats: ChallengeStats }] }`
- Stats are embedded per-challenge, not fetched separately

### Debugging Decode Errors (iOS/Android)
1. Log raw API response JSON
2. Compare expected model structure vs actual response
3. Check for missing fields, wrong nesting, or case mismatches

## Convex Deployment

Convex functions live in `tally-web/convex/` and deploy separately from the Vercel web app. The **Deploy Production** workflow (`.github/workflows/deploy-production.yml`) runs on every push to `main`: it builds the web app, deploys Convex with `bunx convex deploy` behind the target guard `scripts/verify-convex-target.cjs`, checks the deployed backend with `scripts/verify-backend-capability.cjs`, and only then deploys Vercel. Convex schema and mutation changes ship when they merge to `main`.

### Convex Workflow

When modifying Convex schema or mutations:
1. Update `tally-web/convex/schema.ts` with new fields
2. Update `tally-web/convex/*.ts` mutations to accept/return new fields
3. Update `tally-web/src/app/api/v1/_lib/convex-server.ts` TypeScript types
4. Update API routes to pass new fields through
5. Merge to `main`; Deploy Production deploys Convex before Vercel

Convex deploys before the web release, so keep backend changes additive: the currently deployed web app must keep working against the new schema.

Common pitfall: if the Convex deploy or capability check fails, the web release is blocked; if Convex is stale, new fields return 500 errors.

### Debugging Convex 500 errors
1. Check the latest Deploy Production run: did "Deploy matching Convex backend" and "Verify deployed backend capability" succeed?
2. Verify mutation args match schema fields
3. Check Convex dashboard logs at https://dashboard.convex.dev

## UI Reactivity Pattern

After data mutations, ALL related UI must update:

### Web (SWR)
- Use `refreshEntries()` / `refreshChallenges()` from `tally-web/src/hooks/use-data-refresh.ts`
- These call `mutate()` on all related SWR cache keys

### iOS (Observable)
- Route mutations through `ChallengesManager` (not direct `APIClient` calls)
- `ChallengesManager.addEntry()` / `updateEntry()` / `deleteEntry()` save locally first, update stats optimistically, then sync in the background
- Dashboard summary refresh happens in `refreshDashboardSummary()`

## Available .env secrets

CLERK_SECRET_KEY
CLOUDFLARE_API_TOKEN
CONVEX_DEPLOYMENT
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
IOS_BUNDLE_ID
ANDROID_PACKAGE_NAME
APP_STORE_CONNECT_ISSUER_ID
APP_STORE_CONNECT_KEY_ID
APP_STORE_CONNECT_PRIVATE_KEY_PATH
IOS_PROVISIONING_PROFILE_PATH
IOS_SIGNING_CERT_P12_PATH
NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID
NEXT_PUBLIC_POSTHOG_HOST
NEXT_PUBLIC_POSTHOG_KEY
POSTHOG_ADMIN_TOKEN
TEST_USER_EMAIL
TEST_USER_PASSWORD
VERCEL_API_TOKEN
IOS_SIGNING_CERT_PASSWORD
IOS_KEYCHAIN_PASSWORD
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
ANDROID_KEYSTORE_BASE64
IOS_TEAM_ID
VERCEL_PROJECT_ID
VERCEL_ORG_ID
VERCEL_PROD_URL
HONEYCOMB_API_KEY

## Platform Layout and Tooling

- Web app (Next.js 15, Convex, Clerk) lives in `tally-web/`, the iOS app in `ios/` (Tuist workspace) with a standalone `tally-ios/TallyCore` Swift package, and Android in `tally-android/`. Infrastructure is planned as Pulumi in `infra/`, which does not exist yet.
- **Web app package manager:** use `bun` (not npm/yarn).
- **Infrastructure package manager:** use `npm` in `infra/` (Pulumi compatibility).
- Keep commits scoped by platform unless a change is intentionally cross-platform.

## Infrastructure Guardrails

- **Never** make infrastructure-only changes manually in dashboards; use Pulumi in `infra/`.
- Always run `pulumi preview` before `pulumi up`.
- If a Pulumi resource cannot be deleted due broken delete script/runtime errors, use `pulumi state delete <urn> --yes`, then run `pulumi preview` to confirm expected state.

## Clerk and Environment Rules

- Clerk uses separate dev/prod environments; map dev keys to preview/development and prod keys to production.
- Next.js inlines `NEXT_PUBLIC_*` variables at build time. In CI/build environments, set base keys (for example `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`) and do not rely only on suffixed variants like `_DEV`/`_PROD`.
- Use `clerkMiddleware()` in `tally-web/src/middleware.ts` with App Router patterns (not `authMiddleware`).

## Next.js/Vercel Pitfalls

- The web app is on Next.js 15 and builds with `next build`. When upgrading to Next.js 16, force webpack builds to avoid Turbopack `middleware.js.nft.json` ENOENT failures:
  - `next build --webpack` in scripts, and
  - explicit Vercel `buildCommand` using webpack.
- Middleware matcher exclusions can still behave differently in production routing; if `_next/static/*` gets auth-applied (for example `x-clerk-auth-reason`), include `_next/static(.*)` and `_next/image(.*)` as public route fallbacks.

## Verification Rules

- If Android SDK / `ANDROID_HOME` is unavailable, keep Android changes minimal and explicitly note not locally verified.
- After changes, run the checks for the platforms you touched (these mirror `.github/workflows/ci.yml`):
  1. Web: `cd tally-web && bun run test && bun run lint && bun run build` (CI also runs `bunx tsc --noEmit --incremental false`)
  2. iOS: `cd ios && tuist install && tuist generate --no-open`, then build the `App` scheme of `Tally.xcworkspace` with `xcodebuild`
  3. Android: `cd tally-android && ./gradlew assembleDebug testDebugUnitTest`
  4. Infra (once `infra/` exists): `cd infra && pulumi preview` (and `pulumi up` when applying)
  5. Verify behaviour in the running app/surface

## CI and E2E Guardrails

- E2E workflows marked optional should use `continue-on-error: true`.
- `tally-web/playwright.config.ts` reads `BASE_URL` (default `http://localhost:3000`) as the test target; its `webServer` still starts a local server (`bun run dev`, or `bun run start` under CI).
- Clerk UI changes frequently; use resilient selectors (for example exact-name Continue button and `input[name="password"]`), and scope locators to regions when duplicate “Sign in” elements exist.
