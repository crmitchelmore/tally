# Tally Project Context

## Overview

Tally is a multi-platform challenge/goal tracking app being migrated from Vite + React + GitHub Spark to a production-ready ecosystem.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         tally-tracker.app                       │
├─────────────────────────────────────────────────────────────────┤
│  Cloudflare DNS  →  Vercel  →  Next.js 16  →  Convex (DB)      │
│                                    ↓                            │
│                              Clerk (Auth)                       │
├─────────────────────────────────────────────────────────────────┤
│  iOS App (Swift)  ───┐                                          │
│                      ├──→  Convex HTTP API  →  Convex DB       │
│  Android (Kotlin) ───┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Location |
|-------|------------|----------|
| Web Frontend | Next.js 16, React 19, Tailwind, shadcn/ui | `tally-web/` |
| Database | Convex (real-time) | `tally-web/convex/` |
| Auth | Clerk | Configured in Pulumi |
| Feature Flags | LaunchDarkly | [docs/LAUNCHDARKLY.md](docs/LAUNCHDARKLY.md) |
| DNS | Cloudflare | Managed by Pulumi |
| Hosting | Vercel | Managed by Pulumi |
| IaC | Pulumi (TypeScript) | `infra/` |
| Package Manager | **Bun** (web), npm (infra) | — |

## Key URLs

- **Production**: https://tally-tracker.app
- **Development**: https://dev.tally-tracker.app
- **Vercel Dashboard**: https://vercel.com/chris-projects-b617a778/tally-web
- **Convex Dashboard**: https://dashboard.convex.dev
- **Clerk Dashboard**: https://dashboard.clerk.com
- **LaunchDarkly Dashboard**: https://app.launchdarkly.com
- **Pulumi Console (prod)**: https://app.pulumi.com/tally-tracker-org/tally-infra/prod
- **Pulumi Console (dev)**: https://app.pulumi.com/tally-tracker-org/tally-infra/dev

## Directory Structure

```
tally/
├── tally-web/           # Next.js web app (production)
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── components/  # UI components (shadcn + tally)
│   │   ├── hooks/       # React hooks
│   │   ├── lib/         # Utilities
│   │   └── providers/   # Context providers
│   └── convex/          # Convex schema + functions
├── tally-ios/           # iOS app (Swift/SwiftUI)
├── tally-android/       # Android app (Kotlin/Compose)
├── packages/
│   ├── shared-types/    # Cross-platform API contract types
│   └── design-tokens/   # Cross-platform design tokens
├── infra/               # Pulumi infrastructure
│   ├── index.ts         # Stack-aware resource definitions
│   ├── Pulumi.yaml      # Project config
│   └── Pulumi.prod.yaml # Prod stack secrets
├── legacy/              # DEPRECATED: Original Vite/Spark prototype
├── docs/migration/      # Migration plan documents
├── env-fix.md           # Environment setup plan/status
└── .github/             # GitHub config + Copilot instructions
    └── workflows/
        ├── pr.yml       # CI checks + prod deploy on main
        └── dev-deploy.yml # Dev deploy on develop branch
```

## Environments

| Environment | URL | Pulumi Stack | Convex | Clerk Instance |
|-------------|-----|--------------|--------|----------------|
| Local | `localhost:3000` | N/A | `dev:bright-jackal-396` | Dev (`pk_test_*`) |
| Dev | `dev.tally-tracker.app` | `dev` | `dev:bright-jackal-396` | Dev (`pk_test_*`) |
| Prod | `tally-tracker.app` | `prod` | `prod:bright-jackal-396` | Prod (`pk_live_*`) |

### Deployment Triggers

- **Prod**: Push to `main` branch → `.github/workflows/pr.yml`
- **Dev**: Push to `develop` branch OR manual → `.github/workflows/dev-deploy.yml`

## Environment Variables

All secrets in root `.env` (gitignored):

```bash
# Clerk (separate dev/prod instances)
# Dev instance (for local dev, CI, E2E tests)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
# Prod instance (for production - also stored in Pulumi config)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD=pk_live_...
CLERK_SECRET_KEY_PROD=sk_live_...

# Convex  
CONVEX_DEPLOYMENT=dev:bright-jackal-396  # For local dev
CONVEX_DEPLOY_KEY=dev:bright-jackal-396|...  # Dev deploy key
CONVEX_DEPLOYMENT_PROD=prod:bright-jackal-396|...  # Prod deploy key

# Infrastructure (Pulumi)
CLOUDFLARE_API_TOKEN=...
VERCEL_API_TOKEN=...
PULUMI_ACCESS_TOKEN=...

# LaunchDarkly (optional)
LAUNCHDARKLY_ACCESS_TOKEN=...  # For Pulumi to manage flags
NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID=...  # For web client
LAUNCHDARKLY_MOBILE_KEY_IOS=...  # For iOS
LAUNCHDARKLY_MOBILE_KEY_ANDROID=...  # For Android

# Sentry (optional)
SENTRY_ADMIN_TOKEN=...  # For Pulumi to manage projects
```

## Infrastructure Management

**ALL infrastructure changes MUST go through Pulumi.** See [docs/IAC.md](docs/IAC.md) for full details.

### Infra change preflight
- Confirm correct stack name via `cd infra && pulumi stack ls`
- Confirm domain ownership before adding any new domain resources
- Don’t create/overwrite `.env` with placeholder/empty secrets; require secrets via `pulumi config set --secret ...`

```bash
cd infra
export PULUMI_ACCESS_TOKEN=$(grep PULUMI_ACCESS_TOKEN ../.env | cut -d= -f2)

# Dev environment
pulumi stack select tally-tracker-org/dev
pulumi preview   # See changes
pulumi up        # Apply changes

# Prod environment
pulumi stack select tally-tracker-org/prod
pulumi preview
pulumi up
```

### Managed Resources

**Prod stack (`tally-tracker-org/prod`):**
- Cloudflare DNS: `@` (A), `www` (CNAME), `_vercel` (TXT)
- Vercel domains: `tally-tracker.app`, `www.tally-tracker.app`
- Vercel env vars: Prod Clerk keys, Convex prod, Sentry, OTel
- Clerk redirect URLs for prod domain
- Sentry projects and DSNs

**Dev stack (`tally-tracker-org/dev`):**
- Cloudflare DNS: `dev` (CNAME)
- Vercel domain: `dev.tally-tracker.app`
- Vercel env vars: Dev Clerk keys, Convex dev
- Clerk redirect URLs for dev domain + localhost

### Environment Variables in Vercel

| Environment | Vercel Target | Sentry Env | Managed By |
|-------------|---------------|------------|------------|
| Development | development | development | Dev stack |
| Preview | preview | preview | Prod stack |
| Production | production | production | Prod stack |

## Development Commands

```bash
# Web development
cd tally-web
bun install
bun run dev          # Start dev server
bun run build        # Production build

# Infrastructure
cd infra
npm install
pulumi up            # Deploy infra changes

# Convex (run from tally-web/)
npx convex dev       # Start Convex dev
npx convex deploy    # Deploy to production
```

## Migration Status

| Project | Status | Description |
|---------|--------|-------------|
| 1. Next.js Web | ✅ Complete | Live at tally-tracker.app |
| 2. Shared API | ⏳ Pending | HTTP actions for mobile |
| 3. iOS App | ⏳ Pending | Native Swift/SwiftUI |
| 4. Android App | ⏳ Pending | Native Kotlin/Compose |
| 5. Launch | ⏳ Pending | Polish + store releases |

## Database Schema (Convex)

```typescript
// Users
users: { clerkId, email, name, avatarUrl, createdAt }

// Challenges  
challenges: { userId, name, targetNumber, year, color, icon, 
              timeframeUnit, startDate, endDate, isPublic, archived }

// Entries
entries: { userId, challengeId, date, count, note, sets, feeling }

// Social
followedChallenges: { userId, challengeId, followedAt }
```

## Authentication Flow

1. User visits site → Clerk checks session
2. If unauthenticated → Redirect to `/sign-in`
3. On successful auth → Clerk syncs user to Convex via `useStoreUser` hook
4. Convex queries use `userId` from synced user

## Key Decisions Made

1. **Clerk over WorkOS**: Better for consumer apps, simpler setup, good free tier
2. **Pulumi over Terraform**: TypeScript matches stack, better for SaaS APIs
3. **Bun over npm**: Faster installs, modern tooling
4. **Cloudflare for DNS**: At-cost pricing, fast DNS, free security features
5. **Local Convex state**: Using dev deployment, will need prod for launch

## Common Issues & Solutions

### Build fails with middleware/proxy conflict
Next.js 16 prefers `proxy.ts` over `middleware.ts`. Use only `proxy.ts`.

### Clerk keys not working
Ensure `.env.local` in `tally-web/` has real keys, not placeholders.

### Pulumi state issues
Run `pulumi refresh` to sync state with actual cloud resources.

## Next Steps (Project 2: Shared API)

1. Create Convex HTTP actions in `tally-web/convex/http.ts`
2. Add API routes for mobile apps
3. Document API endpoints
4. Create shared types package
