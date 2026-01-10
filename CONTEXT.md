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
- **Vercel Dashboard**: https://vercel.com/chris-projects-b617a778/tally-web
- **Convex Dashboard**: https://dashboard.convex.dev
- **Clerk Dashboard**: https://dashboard.clerk.com
- **LaunchDarkly Dashboard**: https://app.launchdarkly.com
- **Pulumi Console**: https://app.pulumi.com/tally-tracker-org/tally-infra/prod

## Directory Structure

```
tally/
├── tally-web/           # Next.js web app
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── components/  # UI components (shadcn + tally)
│   │   ├── hooks/       # React hooks
│   │   ├── lib/         # Utilities
│   │   └── providers/   # Context providers
│   └── convex/          # Convex schema + functions
├── infra/               # Pulumi infrastructure
│   ├── index.ts         # Resource definitions
│   └── Pulumi.prod.yaml # Stack config
├── docs/migration/      # Migration plan documents
└── .github/             # GitHub config + Copilot instructions
```

## Environment Variables

All secrets in root `.env` (gitignored):

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

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

```bash
cd infra
export PULUMI_ACCESS_TOKEN=$(grep PULUMI_ACCESS_TOKEN ../.env | cut -d= -f2)
pulumi preview   # See changes
pulumi up        # Apply changes
```

### Managed Resources

- Cloudflare DNS records (A, CNAME, TXT)
- Vercel project domains and environment variables
- Clerk redirect URLs
- LaunchDarkly project, environments, and flags
- Sentry projects and DSNs (javascript-nextjs, convex-backend, ios, android)

### Environments

| Environment | Vercel Target | Sentry | LaunchDarkly |
|-------------|---------------|--------|--------------|
| `development` | development | development | dev |
| `preview` | preview | preview | preview |
| `production` | production | production | prod |

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
