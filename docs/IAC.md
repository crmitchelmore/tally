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
| Convex | `dev:bright-jackal-396` | `dev:bright-jackal-396` | `prod:bright-jackal-396` |
| Clerk | Dev instance (`pk_test_*`) | Dev instance (`pk_test_*`) | Prod instance (`pk_live_*`) |

### Clerk Instances

Clerk has separate dev and prod instances to isolate test users from production users:

- **Dev** (`pk_test_*`): Used for local development, CI builds, PR previews, and E2E tests
- **Prod** (`pk_live_*`): Used for production (tally-tracker.app)

**GitHub secrets**:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV` / `CLERK_SECRET_KEY_DEV`: Dev instance keys
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD` / `CLERK_SECRET_KEY_PROD`: Prod instance keys

**Pulumi config** (in `Pulumi.prod.yaml`):
- `clerkPublishableKey` / `clerkSecretKey`: Prod instance keys
- `clerkPublishableKeyDev` / `clerkSecretKeyDev`: Dev instance keys

**Local development**: Uses dev keys from `tally-web/.env.local`

### Convex Deployments

Convex has separate dev and prod deployments:

- **Dev** (`dev:bright-jackal-396`): Used for local development and PR previews
- **Prod** (`prod:bright-jackal-396`): Used for production (tally-tracker.app)

**Deploy keys** (stored as GitHub secrets):
- `CONVEX_DEPLOY_KEY_DEV`: Dev deployment key (for testing/CI)
- `CONVEX_DEPLOY_KEY_PROD`: Prod deployment key (for production deploys)

**Local development**: Uses `CONVEX_DEPLOYMENT=dev:bright-jackal-396` from `.env`

## Managed Resources

### DNS (Cloudflare)
- Zone: `tally-tracker.app`
- A record: `@` → Vercel IP
- CNAME: `www` → Vercel
- TXT: `_vercel` → domain verification

### Hosting (Vercel)
- Project: `tally-web`
- Domains: `tally-tracker.app`, `www.tally-tracker.app`
- Legacy domain: `tally-tracker.com` (and `www`) redirect → `tally-tracker.app` (managed via Pulumi)
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

# Clerk secrets (separate dev/prod instances)
pulumi config set --secret clerkSecretKey <prod-secret-key>       # sk_live_*
pulumi config set --secret clerkPublishableKey <prod-pub-key>     # pk_live_*
pulumi config set --secret clerkSecretKeyDev <dev-secret-key>     # sk_test_*
pulumi config set --secret clerkPublishableKeyDev <dev-pub-key>   # pk_test_*

# Other service secrets
pulumi config set --secret sentryAdminToken <token>
pulumi config set --secret launchDarklyClientSideId <id>

# Non-secret config
pulumi config set convexDeployment prod:bright-jackal-396
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

**Infrastructure (Pulumi)**:
- `PULUMI_ACCESS_TOKEN` - Pulumi Cloud access token
- `PULUMI_STACK_NAME` - Stack name (optional, defaults to `prod`)

**Convex**:
- `CONVEX_DEPLOY_KEY_DEV` - Dev deployment key (optional, for testing)
- `CONVEX_DEPLOY_KEY_PROD` - Prod deployment key (for production deploys)

**Vercel**:
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_PROJECT_ID` - Vercel project ID
- `VERCEL_ORG_ID` - Vercel team/org ID

**Auth & Testing**:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV` - Clerk dev publishable key (for CI/tests)
- `CLERK_SECRET_KEY_DEV` - Clerk dev secret key (for CI/tests)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD` - Clerk prod publishable key (for production deploy)
- `CLERK_SECRET_KEY_PROD` - Clerk prod secret key (stored in Pulumi config)
- `TEST_USER_EMAIL` - Test user email (for E2E auth tests, user in dev Clerk instance)
- `TEST_USER_PASSWORD` - Test user password (for E2E auth tests)

**Monitoring**:
- `SENTRY_AUTH_TOKEN` - Sentry auth token (for source map uploads)
- `SENTRY_DSN_IOS` - Sentry DSN for iOS app (from Pulumi output)
- `SENTRY_DSN_ANDROID` - Sentry DSN for Android app (from Pulumi output)
- `GRAFANA_CLOUD_ADMIN_TOKEN` - Grafana Cloud admin token (optional)
- `GRAFANA_CLOUD_OTLP_TOKEN` - Grafana Cloud OTLP token (optional)

Provider tokens (Cloudflare, Vercel API, Sentry admin, etc.) are stored encrypted in Pulumi config, not GitHub secrets.

## Local Development

For local `pulumi` commands, set tokens from `.env`:

```bash
cd infra
export PULUMI_ACCESS_TOKEN=$(grep PULUMI_ACCESS_TOKEN ../.env | cut -d= -f2)
export PATH="$HOME/.pulumi/bin:$PATH"

pulumi preview
pulumi up
```

## Drift Detection

Infrastructure drift is automatically detected weekly via GitHub Actions (`.github/workflows/infra-drift.yml`).

### How It Works

1. **Schedule**: Runs every Monday at 9am UTC
2. **Process**: Runs `pulumi refresh --diff` on both dev and prod stacks
3. **Alerts**: Creates a GitHub issue if drift is detected

### Manual Drift Check

```bash
cd infra
pulumi refresh --diff --stack tally-tracker-org/prod
```

### Handling Drift

When drift is detected:

1. **Review the diff** - Understand what changed
2. **Decide on action**:
   - Accept drift: `pulumi refresh --yes` (updates state to match reality)
   - Revert drift: `pulumi up` (reverts resources to match desired state)
3. **Document** - If intentional, update IaC code; if accidental, investigate

## Shell-Based Resources (command.local)

Some resources use `command.local.Command` with curl/jq because stable Pulumi providers don't exist:

| Resource | Why command.local | Alternative Considered |
|----------|-------------------|----------------------|
| Clerk redirect URLs | No official Pulumi provider | Dynamic provider (too complex) |
| Sentry projects | Official provider exists but limited | May migrate when provider matures |

### Trade-offs

**Pros:**
- Works today without custom provider development
- Idempotent (checks before create, deletes on destroy)
- Fully visible in Pulumi state

**Cons:**
- Depends on external tools (`curl`, `jq`)
- Fragile if APIs change
- Harder to diff/review than native resources

### Future Migration Path

1. Monitor for official providers (Clerk, improved Sentry)
2. Consider `pulumi.dynamic.Resource` if patterns stabilize
3. Document any API changes that break existing resources

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
