# Tally Architecture Review

**Date**: 2026-01-11  
**Scope**: Full project analysis for architectural consistency, tooling, and gaps

---

## Executive Summary

Tally is a well-structured multi-platform challenge tracker with solid foundations. The web app is production-ready at tally-tracker.app, with iOS and Android apps scaffolded. Key strengths include comprehensive IaC (Pulumi), proper environment separation, and good documentation. Primary gaps are around shared code consumption, CI pipeline completeness, and mobile app readiness.

### Overall Health: ✅ Good (with noted gaps)

| Area | Status | Notes |
|------|--------|-------|
| Architecture | ✅ Solid | Clean separation, modular design |
| Web App | ✅ Production | Next.js 16 + Convex + Clerk live |
| Infrastructure | ✅ Mature | Pulumi manages all resources |
| Documentation | ✅ Good | CONTEXT.md, docs/, comprehensive |
| iOS App | ⚠️ Scaffolded | Core package ready, app shell only |
| Android App | ⚠️ Scaffolded | Core setup, minimal UI |
| Shared Packages | ⚠️ Defined | Not consumed by web or mobile yet |
| CI/CD | ⚠️ Partial | Web complete, mobile missing |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              tally-tracker.app                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │
│   │  tally-web  │     │  tally-ios  │     │tally-android│                │
│   │  (Next.js)  │     │   (Swift)   │     │  (Kotlin)   │                │
│   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                │
│          │                   │                   │                        │
│          │ Convex React      │ HTTP API          │ HTTP API              │
│          │ Client            │                   │                        │
│          ▼                   ▼                   ▼                        │
│   ┌──────────────────────────────────────────────────────┐               │
│   │                    Convex Backend                     │               │
│   │  • Real-time subscriptions (web)                     │               │
│   │  • HTTP actions (mobile: /api/*)                     │               │
│   │  • LaunchDarkly webhook sync                         │               │
│   └──────────────────────────────────────────────────────┘               │
│                              │                                            │
│                              ▼                                            │
│   ┌──────────────────────────────────────────────────────┐               │
│   │                      Clerk Auth                       │               │
│   │  • Dev instance (pk_test_*) for dev/preview          │               │
│   │  • Prod instance (pk_live_*) for production          │               │
│   └──────────────────────────────────────────────────────┘               │
│                                                                           │
├──────────────────────────────────────────────────────────────────────────┤
│  Observability: Sentry (errors) + Grafana Cloud (OTel traces)            │
│  Feature Flags: LaunchDarkly (client + server-side)                      │
│  Infrastructure: Pulumi → Cloudflare DNS + Vercel + Clerk + Sentry       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Monorepo Structure

### Current Layout

```
tally/
├── tally-web/           # ✅ Next.js 16 web app (production)
├── tally-ios/           # ⚠️ Swift app (scaffolded)
├── tally-android/       # ⚠️ Kotlin app (scaffolded)
├── infra/               # ✅ Pulumi IaC
├── packages/
│   ├── design-tokens/   # ⚠️ Defined but not consumed
│   └── shared-types/    # ⚠️ Defined but not consumed
├── docs/                # ✅ Comprehensive documentation
└── .github/workflows/   # ⚠️ Web CI complete, mobile missing
```

### Monorepo Tooling

| Tool | Purpose | Status |
|------|---------|--------|
| Nx | Task orchestration | ✅ Configured (`nx.json`) |
| Bun | Web package manager | ✅ Used in tally-web |
| npm | Infra package manager | ✅ Used in infra/ |
| Workspaces | Package linking | ✅ Root `package.json` |

### Recommendation: Formalize Nx Integration

The Nx config exists but isn't fully leveraged:
- `tally-ios` and `tally-android` lack `project.json` files
- Affected commands won't properly detect mobile changes
- Consider adding project configs or using Nx cloud for caching

---

## 2. Web App (tally-web/)

### Stack Assessment: ✅ Production-Ready

| Layer | Technology | Version | Status |
|-------|------------|---------|--------|
| Framework | Next.js | 16.1.1 | ✅ Latest |
| React | React | 19.2.3 | ✅ Latest |
| Database | Convex | 1.31.3 | ✅ Current |
| Auth | Clerk | 6.36.7 | ✅ Current |
| Styling | Tailwind CSS | 4.x | ✅ Current |
| UI Library | shadcn/ui | - | ✅ Customized |
| Testing | Vitest + Playwright | 4.x / 1.57 | ✅ Current |
| Error Tracking | Sentry | 10.32.1 | ✅ Current |

### Configuration Files

| File | Purpose | Status |
|------|---------|--------|
| `next.config.ts` | Next.js + Sentry | ✅ Good |
| `tsconfig.json` | TypeScript | ✅ Strict mode |
| `eslint.config.mjs` | Linting | ✅ Next.js config |
| `vitest.config.ts` | Unit tests | ✅ Node env |
| `playwright.config.ts` | E2E tests | ✅ Parallel, Chromium |
| `proxy.ts` | Clerk middleware | ✅ Security headers |
| `.env.local.example` | Env template | ✅ Documented |

### Code Quality

- **No eslint-disable comments** found in src/
- **No @ts-ignore** found in src/
- **No TODO/FIXME** found in src/
- Path aliases (`@/*`) consistently used

### Security Headers (proxy.ts)

✅ Comprehensive security:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Content-Security-Policy (Clerk, Convex, Sentry domains)

### Testing Coverage

| Type | Files | Status |
|------|-------|--------|
| Unit | 5 test files in `src/lib/` | ✅ |
| Integration | 1 Convex test (`import.test.ts`) | ✅ |
| E2E | 5 spec files | ✅ |
| API Smoke | `scripts/api-smoke.ts` | ✅ |

### Gap: Web Types vs Shared Types

**Issue**: `tally-web/src/types/index.ts` duplicates `@tally/shared-types`

| Field | Web Types | Shared Types |
|-------|-----------|--------------|
| ID field | `id: string` | `_id: string` |
| createdAt | `string \| number` | `number` |
| Optional fields | Different | Different |

**Recommendation**: Align web types to consume `@tally/shared-types` with adapters for Convex `_id` → `id` mapping.

---

## 3. Convex Backend

### Schema Analysis: ✅ Well-Designed

```typescript
// Tables with proper indexes
users        → by_clerk_id
challenges   → by_user, by_public, by_user_archived
entries      → by_user, by_challenge, by_user_date, by_challenge_date
followedChallenges → by_user, by_challenge
```

### HTTP API (http.ts): ✅ Complete

All endpoints implemented with:
- ✅ CORS headers
- ✅ Auth via Clerk JWT
- ✅ Proper error responses
- ✅ User ownership validation

| Endpoint | Method | Auth | Status |
|----------|--------|------|--------|
| `/api/auth/user` | POST | ✅ | Get/create user |
| `/api/challenges` | GET/POST | ✅ | CRUD |
| `/api/challenges/{id}` | PATCH | ✅ | Update |
| `/api/entries` | GET/POST | ✅ | CRUD |
| `/api/entries/{id}` | PATCH/DELETE | ✅ | Update/Delete |
| `/api/followed` | GET/POST | ✅ | Follow management |
| `/api/public/challenges` | GET | ❌ | Public read |
| `/api/leaderboard` | GET | ❌ | Public leaderboard |

### LaunchDarkly Integration

- ✅ `@convex-dev/launchdarkly` installed
- ✅ Webhook routes registered in `http.ts`
- ✅ Server-side flag evaluation ready

---

## 4. Infrastructure (Pulumi)

### Managed Resources: ✅ Comprehensive

| Resource | Provider | Status |
|----------|----------|--------|
| DNS Records | Cloudflare | ✅ A, CNAME, TXT |
| Vercel Project | Vercel | ✅ Domains, env vars |
| Clerk Redirects | API (command) | ✅ OAuth URLs |
| Sentry Projects | API (command) | ✅ 4 projects |
| LaunchDarkly | (disabled) | ⚠️ Provider bug |

### Environment Variables in Vercel (via Pulumi)

| Variable | Targets | Status |
|----------|---------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | prod/dev/preview | ✅ |
| `CLERK_SECRET_KEY` | prod/dev/preview | ✅ |
| `CONVEX_DEPLOYMENT` | production | ✅ |
| `NEXT_PUBLIC_CONVEX_URL` | production | ✅ |
| `NEXT_PUBLIC_SENTRY_DSN` | all | ✅ |
| `SENTRY_*` (org, project, auth, env) | all | ✅ |
| `OTEL_*` (service, endpoint, headers) | all | ✅ |
| `NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID` | all | ✅ |

### Gap: LaunchDarkly Provider Disabled

The `@lbrlabs/pulumi-launchdarkly` provider is disabled due to a bug. Resources are managed manually in dashboard.

**Recommendation**: Track provider fix or switch to `pulumi-pulumiverse-launchdarkly`.

### Pulumi Config Completeness

```yaml
# Pulumi.prod.yaml - All secrets encrypted ✅
cloudflare:apiToken
vercel:apiToken
tally-infra:clerkSecretKey
tally-infra:clerkPublishableKey
tally-infra:clerkSecretKeyDev
tally-infra:clerkPublishableKeyDev
tally-infra:convexDeployment
tally-infra:sentryAdminToken
launchdarkly:accessToken
```

**Gap**: Missing from config:
- `grafanaCloudOtlpToken` (set at runtime in CI)
- `launchDarklyClientSideId` (LD provider disabled)

---

## 5. CI/CD (GitHub Actions)

### Workflow Analysis

| Workflow | Purpose | Status |
|----------|---------|--------|
| `pr.yml` | Web lint/build/test + infra preview | ✅ Comprehensive |
| `infra-apply.yml` | Pulumi apply on main | ✅ |
| `e2e-auth.yml` | Auth E2E tests | ✅ |
| `ui-report.yml` | UI snapshot tests | ✅ |
| `codeql.yml` | Security scanning | ✅ |
| `security.yml` | Dependency audit | ✅ |
| `ios.yml` | iOS build | ⚠️ Placeholder |
| `android.yml` | Android build | ⚠️ Placeholder |

### pr.yml Job Flow

```
setup → web (lint/build/test/e2e) → infra (typecheck)
         │                                │
         ▼                                ▼
    deploy-convex ─────────────────► deploy-vercel
         │                                │
         └──── infra-apply ◄──────────────┘
```

### Gap: Mobile CI Not Implemented

Both `ios.yml` and `android.yml` need implementation:

**iOS** (macos-latest runner):
- Install xcodegen
- Generate Xcode project from `project.yml`
- Run `xcodebuild test`
- Build archive for release

**Android** (ubuntu-latest runner):
- Setup Java 17
- Run `./gradlew test`
- Run `./gradlew assembleRelease`

---

## 6. Mobile Apps

### iOS (tally-ios/)

**Structure**: ✅ Proper Swift Package architecture

| Component | Status | Notes |
|-----------|--------|-------|
| `project.yml` | ✅ | XcodeGen project definition |
| `TallyCore` | ✅ | SPM package with LaunchDarkly |
| `TallyApp` | ⚠️ | Shell only, needs UI |
| `TallyDesignSystem` | ❌ | Not created yet |
| Tests | ✅ | TallyCoreTests configured |

**Dependencies** (project.yml):
- Clerk iOS SDK 0.57.0
- Sentry Cocoa 8.40.0
- LaunchDarkly iOS 9.0.0

**Gaps**:
1. `TallyDesignSystem` package missing (mentioned in MENTAL-MODEL.md)
2. No consumption of `@tally/design-tokens`
3. App target has no real UI yet

### Android (tally-android/)

**Structure**: ✅ Proper Gradle/Compose setup

| Component | Status | Notes |
|-----------|--------|-------|
| `build.gradle.kts` | ✅ | Kotlin 2.3.0, Compose, Sentry |
| `app/` | ⚠️ | Shell only |
| `tallycore/` | ✅ | Shared module |
| Nx Integration | ✅ | `@nx/gradle` plugin |

**Dependencies** (app/build.gradle.kts):
- Clerk Android 0.1.30
- LaunchDarkly Android 5.4.0
- Sentry Android (auto-installed by gradle plugin)
- Kotlin Serialization
- Compose BOM 2024.10.00

**Gaps**:
1. `tallycore/` has minimal content
2. No consumption of `@tally/design-tokens`
3. App target has minimal UI

---

## 7. Shared Packages

### @tally/shared-types

**Purpose**: Cross-platform type definitions

| Type | Defined | Used in Web | Used in iOS | Used in Android |
|------|---------|-------------|-------------|-----------------|
| `User` | ✅ | ❌ (duplicate) | ❌ | ❌ |
| `Challenge` | ✅ | ❌ (duplicate) | ❌ | ❌ |
| `Entry` | ✅ | ❌ (duplicate) | ❌ | ❌ |
| `FollowedChallenge` | ✅ | ❌ (duplicate) | ❌ | ❌ |
| `TimeframeUnit` | ✅ | ❌ (duplicate) | ❌ | ❌ |
| `FeelingType` | ✅ | ❌ (duplicate) | ❌ | ❌ |

**Recommendation**: Generate iOS/Android types from `schema.json` and update web to consume from package.

### @tally/design-tokens

**Purpose**: Cross-platform design system values

| Token | Defined | Used in Web | iOS Script | Android Script |
|-------|---------|-------------|------------|----------------|
| `brandColors` | ✅ | ❌ | Exists | Exists |
| `statusColors` | ✅ | ❌ | Exists | Exists |
| `heatmapColors` | ✅ | ❌ | Exists | Exists |
| `spacing` | ✅ | ❌ | Exists | Exists |
| `motion` | ✅ | ❌ | Exists | Exists |

**Recommendation**: 
1. Run generation scripts to produce Swift/Kotlin files
2. Integrate tokens into web Tailwind config
3. Add tokens to CI build pipeline

---

## 8. Environment Configuration

### Environment Mapping

| Environment | Vercel | Clerk | Convex | Sentry | LaunchDarkly |
|-------------|--------|-------|--------|--------|--------------|
| Development | `development` | Dev instance | `dev:bright-jackal-396` | `development` | `dev` |
| Preview | `preview` | Dev instance | `dev:bright-jackal-396` | `preview` | `preview` |
| Production | `production` | Prod instance | `prod:bright-jackal-396` | `production` | `prod` |

**Status**: ✅ Consistent and well-documented in `docs/IAC.md`

### Required GitHub Secrets

| Secret | Purpose | Set? |
|--------|---------|------|
| `PULUMI_ACCESS_TOKEN` | Infra deploys | Required |
| `PULUMI_STACK_NAME` | Stack selection | Optional |
| `VERCEL_TOKEN` | Vercel deploy | Required |
| `VERCEL_PROJECT_ID` | Vercel project | Required |
| `VERCEL_ORG_ID` | Vercel org | Required |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV` | Dev Clerk | Required |
| `CLERK_SECRET_KEY_DEV` | Dev Clerk | Required |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD` | Prod Clerk | Required |
| `CONVEX_DEPLOY_KEY_PROD` | Convex deploy | Required |
| `SENTRY_AUTH_TOKEN` | Source maps | Optional |
| `TEST_USER_EMAIL` | E2E auth | Optional |
| `TEST_USER_PASSWORD` | E2E auth | Optional |
| `GRAFANA_CLOUD_*` | OTel | Optional |

---

## 9. Observability

### Sentry Configuration

| Platform | Project | DSN via | Status |
|----------|---------|---------|--------|
| Web (client) | `javascript-nextjs` | `NEXT_PUBLIC_SENTRY_DSN` | ✅ |
| Web (server) | `javascript-nextjs` | `SENTRY_DSN` | ✅ |
| iOS | `ios` | Build setting | ✅ Configured |
| Android | `android` | BuildConfig | ✅ Configured |
| Convex | `convex-backend` | (pending) | ⚠️ Not wired |

**Web Sentry Features**:
- ✅ Client-side error tracking
- ✅ Server-side error tracking (instrumentation.ts)
- ✅ Source map uploads (CI)
- ✅ Privacy-first replay (maskAllText, blockAllMedia)
- ✅ PII scrubbing (beforeSend hook)

### OpenTelemetry Configuration

| Setting | Value | Status |
|---------|-------|--------|
| Endpoint | Grafana Cloud OTLP | ✅ |
| Protocol | http/protobuf | ✅ |
| Sampler | parentbased_traceidratio | ✅ |
| Sample Rate | 10% prod, 20% preview, 100% dev | ✅ |

**Gap**: OTel not configured for mobile apps yet.

---

## 10. Risk Register

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| LaunchDarkly Pulumi provider broken | Low | High | Use dashboard temporarily |
| Shared packages not consumed | Medium | Certain | Priority integration task |
| Mobile CI not implemented | Medium | Certain | Add workflows before launch |
| Convex has no staging env | Medium | Low | Document dev vs prod usage |
| Type drift between platforms | Medium | Medium | Codegen from shared-types |
| No mobile OTel | Low | Certain | Add before launch |

---

## 11. Recommendations (Prioritized)

### High Priority (Before Mobile Launch)

1. **Implement Mobile CI**
   - Add `ios.yml` with xcodebuild
   - Add `android.yml` with gradle
   - Include in affected detection

2. **Wire Shared Types**
   - Update web to consume `@tally/shared-types`
   - Add adapter layer for Convex `_id` → `id`
   - Generate iOS/Android types from schema

3. **Wire Design Tokens**
   - Run generation scripts
   - Integrate into web Tailwind
   - Import into iOS/Android projects

### Medium Priority (Before Public Launch)

4. **Add Convex Backend Sentry**
   - Create action wrapper with Sentry spans
   - Configure `SENTRY_DSN` in Convex env

5. **Fix LaunchDarkly Pulumi**
   - Track upstream fix or switch providers
   - Import existing resources

6. **Mobile OTel**
   - Add iOS/Android OTel SDKs
   - Configure Grafana Cloud export

### Low Priority (Post-Launch)

7. **Nx Project Configs for Mobile**
   - Add `project.json` to tally-ios, tally-android
   - Enable proper affected detection

8. **Staging Environment**
   - Add Pulumi stack for staging
   - Mirror prod config with separate Convex deployment

---

## 12. Next Actions (Smallest First)

1. ✅ Document current state (this review)
2. ⬜ Run design-tokens generation scripts, verify output
3. ⬜ Add `@tally/shared-types` dependency to tally-web
4. ⬜ Create type adapter in web for Convex compatibility
5. ⬜ Implement `ios.yml` CI workflow
6. ⬜ Implement `android.yml` CI workflow
7. ⬜ Add SENTRY_DSN to Convex environment

---

## Appendix: File Inventory

### Key Configuration Files

| Path | Purpose |
|------|---------|
| `/CONTEXT.md` | Project overview |
| `/package.json` | Root monorepo config |
| `/nx.json` | Nx workspace config |
| `/tally-web/package.json` | Web dependencies |
| `/tally-web/next.config.ts` | Next.js + Sentry |
| `/tally-web/tsconfig.json` | TypeScript config |
| `/tally-web/proxy.ts` | Clerk + security |
| `/tally-web/vitest.config.ts` | Unit test config |
| `/tally-web/playwright.config.ts` | E2E test config |
| `/tally-web/convex/schema.ts` | Database schema |
| `/tally-web/convex/http.ts` | HTTP API |
| `/infra/index.ts` | Pulumi resources |
| `/infra/Pulumi.prod.yaml` | Prod stack config |
| `/tally-ios/project.yml` | XcodeGen project |
| `/tally-ios/TallyCore/Package.swift` | Swift package |
| `/tally-android/build.gradle.kts` | Root gradle |
| `/tally-android/app/build.gradle.kts` | App gradle |
| `/.github/workflows/pr.yml` | Main CI workflow |

### Documentation Files

| Path | Purpose |
|------|---------|
| `/docs/MENTAL-MODEL.md` | Decision principles |
| `/docs/DESIGN-PHILOSOPHY.md` | UX/UI principles |
| `/docs/API.md` | HTTP API reference |
| `/docs/TESTING.md` | Test strategy |
| `/docs/IAC.md` | Infrastructure guide |
| `/docs/LAUNCHDARKLY.md` | Feature flags guide |

---

*Review generated by architecture analysis on 2026-01-11*
