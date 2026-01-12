# Secrets Inventory

This document inventories all secrets/credentials used by Tally and their source of truth.

## Secret Ownership Model

Each secret has exactly ONE source of truth. Other systems that need the secret should derive it from the source.

## Secrets by Service

### Clerk (Authentication)

| Secret | Source of Truth | Used By | Rotation |
|--------|-----------------|---------|----------|
| `CLERK_SECRET_KEY_PROD` | Pulumi config (encrypted) | Vercel, CI | Manual |
| `CLERK_SECRET_KEY_DEV` | Pulumi config (encrypted) | Vercel, CI | Manual |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD` | Pulumi config | Vercel | N/A (public) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV` | Pulumi config | Vercel | N/A (public) |

### Convex (Database)

| Secret | Source of Truth | Used By | Rotation |
|--------|-----------------|---------|----------|
| `CONVEX_DEPLOY_KEY` (prod) | GitHub Secrets (production env) | CI | Manual |
| `CONVEX_DEPLOY_KEY` (dev) | GitHub Secrets (development env) | CI | Manual |
| `NEXT_PUBLIC_CONVEX_URL` | Pulumi config | Vercel | N/A (public) |

### Sentry (Error Tracking)

| Secret | Source of Truth | Used By | Rotation |
|--------|-----------------|---------|----------|
| `SENTRY_AUTH_TOKEN` | Pulumi (generated) | Vercel, CI | Auto-managed |
| `SENTRY_DSN` | Pulumi (derived) | Vercel | N/A (project-specific) |
| `sentryAdminToken` | Pulumi config (encrypted) | Infra | Manual |

### Grafana Cloud (Observability)

| Secret | Source of Truth | Used By | Rotation |
|--------|-----------------|---------|----------|
| `grafanaCloudOtlpToken` | Pulumi config (encrypted) | Vercel | Manual |
| `OTEL_EXPORTER_OTLP_HEADERS` | Pulumi (derived) | Vercel | Derived |

### LaunchDarkly (Feature Flags)

| Secret | Source of Truth | Used By | Rotation |
|--------|-----------------|---------|----------|
| `launchDarklyClientSideId` | Pulumi config | Vercel | N/A (project-specific) |
| `LAUNCHDARKLY_ACCESS_TOKEN` (read-only) | GitHub Secrets | CI (workflow gating) | Manual |

### Vercel (Hosting)

| Secret | Source of Truth | Used By | Rotation |
|--------|-----------------|---------|----------|
| `VERCEL_TOKEN` | GitHub Secrets | CI | Manual |
| `VERCEL_ORG_ID` | GitHub Secrets | CI | N/A (org-specific) |
| `VERCEL_PROJECT_ID` | GitHub Secrets | CI | N/A (project-specific) |

### Cloudflare (DNS)

| Secret | Source of Truth | Used By | Rotation |
|--------|-----------------|---------|----------|
| `CLOUDFLARE_API_TOKEN` | Pulumi config (encrypted) | Infra | Manual |

### Pulumi (Infrastructure)

| Secret | Source of Truth | Used By | Rotation |
|--------|-----------------|---------|----------|
| `PULUMI_ACCESS_TOKEN` | GitHub Secrets | CI | Manual |

## Environment Separation

### GitHub Environments

| Environment | Secrets Scope | Protected |
|-------------|---------------|-----------|
| `development` | Dev Clerk, Dev Convex | No |
| `production` | Prod Clerk, Prod Convex | Yes (requires approval) |

### Pulumi Stacks

| Stack | Purpose | Managed Secrets |
|-------|---------|-----------------|
| `tally-tracker-org/dev` | Dev infrastructure | Dev Clerk keys, Dev Convex URL |
| `tally-tracker-org/prod` | Prod infrastructure | Prod Clerk keys, Prod Convex URL, Sentry, OTel |

## Rotation Procedures

### Clerk Keys
1. Generate new key in Clerk dashboard
2. Update Pulumi config: `pulumi config set --secret clerkSecretKey <new-key>`
3. Run `pulumi up` to propagate to Vercel
4. Verify auth still works
5. Revoke old key in Clerk dashboard

### Convex Deploy Key
1. Generate new key in Convex dashboard
2. Update GitHub Secrets for the environment
3. Trigger a test deployment
4. Revoke old key

### Vercel Token
1. Generate new token in Vercel dashboard
2. Update GitHub Secret `VERCEL_TOKEN`
3. Test a deployment
4. Revoke old token

## Security Rules

### DO
- ✅ Use GitHub Environments to scope secrets
- ✅ Use Pulumi config encryption for infra secrets
- ✅ Rotate secrets after team member leaves
- ✅ Use minimum required scopes for tokens

### DON'T
- ❌ Store secrets in `.env` files in git
- ❌ Log secrets or include in error messages
- ❌ Share prod secrets with PR/preview builds
- ❌ Use the same secret across environments

## Incident Response

If a secret is compromised:
1. **Immediately** rotate the secret
2. Audit usage logs (Clerk/Convex/Vercel dashboards)
3. Check for unauthorized access
4. Update this inventory if rotation procedure changes
5. Document in incident log

## Audit

Last reviewed: 2026-01-11
Next review: 2026-04-11 (quarterly)
