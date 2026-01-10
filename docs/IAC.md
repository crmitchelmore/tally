# Infrastructure as Code (IaC) Standards

This document defines the IaC approach for Tally across all managed resources.

## Principles

1. **Single Source of Truth**: All infrastructure is defined in `infra/index.ts`
2. **No Dashboard Clickops**: Never manually configure resources in provider dashboards
3. **Secrets in Pulumi Config**: Use `pulumi config set --secret` for sensitive values
4. **Environment Consistency**: Use consistent environment names across all services

## Environments

All services use these standardized environment names:

| Environment | Description | When Used |
|-------------|-------------|-----------|
| `development` | Local development | `bun run dev`, local testing |
| `preview` | PR preview deployments | Vercel preview branches |
| `production` | Live production | Main branch, tally-tracker.app |

### Environment Mapping by Service

| Service | Development | Preview | Production |
|---------|-------------|---------|------------|
| Vercel | `development` target | `preview` target | `production` target |
| Sentry | `development` | `preview` | `production` |
| LaunchDarkly | `dev` | `preview` | `prod` |
| Convex | `dev:*` deployment | `dev:*` (same) | `prod:*` deployment |
| Clerk | Test instance | Test instance | Production instance |

## Managed Resources

### DNS (Cloudflare)
- Zone: `tally-tracker.app`
- A record: `@` → Vercel IP
- CNAME: `www` → Vercel
- TXT: `_vercel` → domain verification

### Hosting (Vercel)
- Project: `tally-web`
- Domains: `tally-tracker.app`, `www.tally-tracker.app`
- Environment variables (managed by Pulumi):
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `CONVEX_DEPLOYMENT`
  - `NEXT_PUBLIC_CONVEX_URL`
  - `NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID`
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_DSN`
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
  - `SENTRY_AUTH_TOKEN`
  - `SENTRY_ENVIRONMENT`

### Authentication (Clerk)
- Redirect URLs for OAuth flows
- Managed via API calls from Pulumi

### Feature Flags (LaunchDarkly)
- Project: `tally`
- Environments: `dev`, `preview`, `prod`
- Flags defined in Pulumi

### Error Monitoring (Sentry)
- Organization: `tally-lz`
- Projects:
  - `javascript-nextjs` - Web app
  - `convex-backend` - Backend
  - `ios` - iOS app
  - `android` - Android app

## Pulumi Configuration

### Required Secrets

Set these in Pulumi config (not in `.env` for production):

```bash
cd infra

# Provider tokens
pulumi config set --secret cloudflare:apiToken <token>
pulumi config set --secret vercel:apiToken <token>

# Service secrets
pulumi config set --secret clerkSecretKey <key>
pulumi config set --secret clerkPublishableKey <key>
pulumi config set --secret sentryAdminToken <token>
pulumi config set --secret launchDarklyClientSideId <id>

# Non-secret config
pulumi config set convexDeployment dev:bright-jackal-396
```

### Stack Structure

```
tally-infra/
├── Pulumi.yaml          # Project definition
├── Pulumi.prod.yaml     # Production stack config (encrypted secrets)
├── index.ts             # All resource definitions
├── package.json
└── tsconfig.json
```

Future: May add `Pulumi.staging.yaml` for a staging environment.

## Workflow

### Making Infrastructure Changes

1. Edit `infra/index.ts`
2. Preview: `pulumi preview`
3. Apply: `pulumi up`
4. Commit changes to git

### Adding a New Service

1. Add provider package: `npm install @pulumi/<provider>`
2. Add resources to `index.ts`
3. Add any secrets: `pulumi config set --secret <key> <value>`
4. Export relevant outputs
5. Update this document

### Importing Existing Resources

```bash
pulumi import <type> <name> <id>

# Examples:
pulumi import cloudflare:index/dnsRecord:DnsRecord my-record zone_id/record_id
pulumi import vercel:index/projectDomain:ProjectDomain my-domain team_id/project_id/domain
```

## CI/CD Integration

### GitHub Actions (Future)

For automated infrastructure deployment:

```yaml
# .github/workflows/infra.yml
name: Infrastructure
on:
  push:
    branches: [main]
    paths: ['infra/**']
  pull_request:
    paths: ['infra/**']

jobs:
  preview:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd infra && npm ci
      - uses: pulumi/actions@v5
        with:
          command: preview
          work-dir: infra
          stack-name: tally-tracker-org/tally-infra/prod
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}

  deploy:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd infra && npm ci
      - uses: pulumi/actions@v5
        with:
          command: up
          work-dir: infra
          stack-name: tally-tracker-org/tally-infra/prod
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

### Required GitHub Secrets

- `PULUMI_ACCESS_TOKEN` - Pulumi Cloud access token

Provider tokens (Cloudflare, Vercel, etc.) are stored encrypted in Pulumi config, not GitHub secrets.

## Local Development

For local `pulumi` commands, set tokens from `.env`:

```bash
cd infra
export PULUMI_ACCESS_TOKEN=$(grep PULUMI_ACCESS_TOKEN ../.env | cut -d= -f2)
export PATH="$HOME/.pulumi/bin:$PATH"

pulumi preview
pulumi up
```

## Troubleshooting

### State Drift
If resources were modified outside Pulumi:
```bash
pulumi refresh  # Sync state with actual resources
```

### Import Conflicts
If `pulumi import` fails, the resource may already be in state:
```bash
pulumi state delete <urn>  # Remove from state, then re-import
```

### Secret Rotation
To rotate a secret:
```bash
pulumi config set --secret <key> <new-value>
pulumi up
```
