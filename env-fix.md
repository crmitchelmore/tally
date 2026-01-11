# Environment Setup Plan

## Goal
Three-tier environment setup with proper GitHub environment isolation:
- **Local**: `localhost:3000` - developer machines
- **Dev**: `dev.tally-tracker.app` - staging environment, deployed on every main push
- **Prod**: `tally-tracker.app` - production, only deployed after E2E passes on dev

## Deployment Flow

```
Push to main
    │
    ▼
┌─────────────────────┐
│  CI Checks          │
│  (lint/build/test)  │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  Deploy to Dev      │
│  • Pulumi dev stack │
│  • Convex dev       │
│  • Vercel → dev.    │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  E2E Tests on Dev   │
│  dev.tally-tracker  │
│  .app               │
└─────────────────────┘
    │ (only if E2E passes)
    ▼
┌─────────────────────┐
│  Deploy to Prod     │
│  • Pulumi prod stack│
│  • Convex prod      │
│  • Vercel prod      │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  E2E Tests on Prod  │
│  (informational)    │
└─────────────────────┘
```

## GitHub Environment Setup

### Secrets Layout

**Repository level (shared):**
- `PULUMI_ACCESS_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SENTRY_AUTH_TOKEN`
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`
- `CLOUDFLARE_API_TOKEN`
- `GRAFANA_CLOUD_ADMIN_TOKEN`
- `GRAFANA_CLOUD_OTLP_TOKEN`

**Development environment:**
- `CLERK_SECRET_KEY_DEV` (dev instance: sk_test_*)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV` (dev instance: pk_test_*)
- `CONVEX_DEPLOY_KEY` (dev deployment key)

**Production environment:**
- `CLERK_SECRET_KEY_PROD` (prod instance: sk_live_*)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD` (prod instance: pk_live_*)
- `CONVEX_DEPLOY_KEY` (prod deployment key)

### Migration Script

Run the migration script to move secrets to environments:

```bash
chmod +x scripts/migrate-github-envs.sh
./scripts/migrate-github-envs.sh
```

The script will:
1. Verify GitHub environments exist
2. Prompt for secret values (can't read existing secrets)
3. Set secrets in the appropriate environment
4. Optionally clean up old `_DEV`/`_PROD` suffixed secrets

### Manual Migration Commands

If you prefer to migrate manually:

```bash
# Development environment
gh secret set CLERK_SECRET_KEY_DEV --env development --body "$DEV_CLERK_SECRET"
gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV --env development --body "$DEV_CLERK_PUB"
gh secret set CONVEX_DEPLOY_KEY --env development --body "$DEV_CONVEX_KEY"

# Production environment
gh secret set CLERK_SECRET_KEY_PROD --env production --body "$PROD_CLERK_SECRET"
gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD --env production --body "$PROD_CLERK_PUB"
gh secret set CONVEX_DEPLOY_KEY --env production --body "$PROD_CONVEX_KEY"
```

## Workflow Files

- `.github/workflows/deploy.yml` - Main CI/CD pipeline
  - Runs on every PR (CI only) and main push (full deploy)
  - Uses `environment:` directive for secret isolation
  - Deploys to dev → E2E → prod

- `.github/workflows/pr.yml` - Legacy workflow (to be deprecated)
- `.github/workflows/dev-deploy.yml` - Manual dev deploy (to be deprecated)

## Current State

| Component | Local | Dev | Prod |
|-----------|-------|-----|------|
| Web App | ✅ `bun run dev` | ✅ `dev.tally-tracker.app` | ✅ `tally-tracker.app` |
| Convex | ✅ `dev:bright-jackal-396` | ✅ Deployed on main push | ✅ Deployed after E2E |
| Clerk | ✅ Dev instance | ✅ Dev instance | ✅ Prod instance |
| Vercel | N/A | ✅ Aliased domain | ✅ Production deploy |
| Pulumi | N/A | ✅ `dev` stack | ✅ `prod` stack |
| E2E Tests | Manual | ✅ Required for prod | ✅ Informational |

## Files

- `scripts/migrate-github-envs.sh` - Migration script
- `.github/workflows/deploy.yml` - New unified pipeline
- `infra/index.ts` - Stack-aware Pulumi config
- `env-fix.md` - This documentation

## Verification Checklist

After migration:
- [ ] Run `gh secret list --env development` - see 3 secrets
- [ ] Run `gh secret list --env production` - see 3 secrets
- [ ] Push to main branch
- [ ] Verify dev deployment succeeds
- [ ] Verify E2E tests run on dev
- [ ] Verify prod deployment only happens after E2E passes
- [ ] Remove old `_DEV`/`_PROD` suffixed secrets
