# Copilot Instructions (Tally)

**NEVER STOP TO ASK QUESTIONS** — make the best decision without compromising security or our design philosophy.

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

Reference ./design-philosophy.md whenever building anything new to remember the way we do it.

Reference ./tech-stack-requirements.md to pick the right tools and technologies.

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

Convex functions are deployed **separately** from Vercel. After changing:
- `convex/schema.ts` (data model)
- `convex/*.ts` (mutations/queries)

Run: `npx convex deploy` to sync changes to production.

**CI does NOT auto-deploy Convex** - this is a manual step after schema/mutation changes.

### Convex Workflow

When modifying Convex schema or mutations:
1. Update `convex/schema.ts` with new fields
2. Update `convex/*.ts` mutations to accept/return new fields
3. Update `src/app/api/v1/_lib/convex-server.ts` TypeScript types
4. Update API routes to pass new fields through
5. **Deploy Convex:** `npx convex deploy`
6. Deploy Vercel (automatic via CI or manual)

Common pitfall: Vercel deploys but Convex is stale → 500 errors on new fields.

### Debugging Convex 500 errors
1. Check if schema changes were deployed: `npx convex deploy`
2. Verify mutation args match schema fields
3. Check Convex dashboard logs at https://dashboard.convex.dev

## UI Reactivity Pattern

After data mutations, ALL related UI must update:

### Web (SWR)
- Use `refreshEntries()` / `refreshChallenges()` from `use-data-refresh.ts`
- These call `mutate()` on all related SWR cache keys

### iOS (Observable)
- Route mutations through `ChallengesManager` (not direct `APIClient` calls)
- `ChallengesManager.createEntry()` / `updateEntry()` / `deleteEntry()` auto-refresh stats
- Dashboard stats refresh happens in `refreshChallengeStats()`

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

- Web app lives in `tally-web/`, iOS in `ios/` and `tally-ios/`, Android in `tally-android/`, and infrastructure in `infra/`.
- **Web app package manager:** use `bun` (not npm/yarn).
- **Infrastructure package manager:** use `npm` (Pulumi compatibility).
- Keep commits scoped by platform unless a change is intentionally cross-platform.

## Infrastructure Guardrails

- **Never** make infrastructure-only changes manually in dashboards; use Pulumi in `infra/`.
- Always run `pulumi preview` before `pulumi up`.
- If a Pulumi resource cannot be deleted due broken delete script/runtime errors, use `pulumi state delete <urn> --yes`, then run `pulumi preview` to confirm expected state.

## Clerk and Environment Rules

- Clerk uses separate dev/prod environments; map dev keys to preview/development and prod keys to production.
- Next.js inlines `NEXT_PUBLIC_*` variables at build time. In CI/build environments, set base keys (for example `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`) and do not rely only on suffixed variants like `_DEV`/`_PROD`.
- Use `clerkMiddleware()` in `proxy.ts` with App Router patterns (not `authMiddleware`).

## Next.js/Vercel Pitfalls

- On Next.js 16, force webpack builds to avoid Turbopack `middleware.js.nft.json` ENOENT failures:
  - `next build --webpack` in scripts, and
  - explicit Vercel `buildCommand` using webpack.
- Middleware matcher exclusions can still behave differently in production routing; if `_next/static/*` gets auth-applied (for example `x-clerk-auth-reason`), include `_next/static(.*)` and `_next/image(.*)` as public route fallbacks.

## Migration and Verification Rules

- For `docs/migration/README.md` feature parity:
  - **Yes** = wired in primary UI and verified
  - **Partial** = code exists but not wired and/or not verified
  - **No** = missing
- If Android SDK / `ANDROID_HOME` is unavailable, keep Android changes minimal and explicitly note not locally verified.
- After changes:
  1. Web: `cd tally-web && bun run build`
  2. Infra: `cd infra && pulumi preview` (and `pulumi up` when applying)
  3. Verify behaviour in the running app/surface

## CI and E2E Guardrails

- E2E workflows marked optional should use `continue-on-error: true`.
- Playwright config uses `E2E_BASE_URL` (not `BASE_URL`) to decide whether tests run against local or deployed targets.
- Clerk UI changes frequently; use resilient selectors (for example exact-name Continue button and `input[name="password"]`), and scope locators to regions when duplicate “Sign in” elements exist.
