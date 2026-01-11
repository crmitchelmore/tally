# Tally Infrastructure

Infrastructure as Code using [Pulumi](https://www.pulumi.com/) with TypeScript.

## Resources Managed

- **Cloudflare DNS** (tally-tracker.app)
  - Root A record → Vercel
  - WWW CNAME → Vercel
  - Vercel verification TXT record

- **Vercel Domains**
  - tally-tracker.app (primary)
  - www.tally-tracker.app (redirects to root)
  - tally-tracker.com + www.tally-tracker.com (redirect to tally-tracker.app)

- **Vercel Environment Variables**
  - Clerk keys
  - Convex deployment URL
  - LaunchDarkly client ID
  - Sentry DSN, org, project, auth token, environment

- **Sentry Projects** (when `sentryAdminToken` is configured)
  - `javascript-nextjs` - Next.js web app
  - `convex-backend` - Convex backend
  - `ios` - iOS app
  - `android` - Android app

- **LaunchDarkly**
  - Project: `tally`
  - Environments: dev, preview, prod
  - Feature flags

## Prerequisites

1. Install Pulumi CLI:
   ```bash
   curl -fsSL https://get.pulumi.com | sh
   ```

2. Set environment variables (from root `.env`):
   ```bash
   export PULUMI_ACCESS_TOKEN=<token>
   export PATH="$HOME/.pulumi/bin:$PATH"
   ```

## Usage

```bash
cd infra

# Install dependencies
npm install

# Preview changes
pulumi preview

# Apply changes
pulumi up

# View current state
pulumi stack

# Refresh state from cloud
pulumi refresh

# Destroy (careful!)
pulumi destroy
```

## Stack Information

- **Organization**: tally-tracker-org
- **Project**: tally-infra
- **Stack**: prod
- **Backend**: Pulumi Cloud (app.pulumi.com)

## Adding New Resources

1. Update `index.ts` with new resource definitions
2. Run `pulumi preview` to see changes
3. Run `pulumi up` to apply
4. Commit changes to git

## Importing Existing Resources

To import an existing resource:
```bash
pulumi import <provider>:<module>/<resource>:<Resource> <name> <id>

# Examples:
pulumi import cloudflare:index/dnsRecord:DnsRecord my-record zone_id/record_id
pulumi import vercel:index/projectDomain:ProjectDomain my-domain team_id/project_id/domain
```

## Configuration

Secrets are stored encrypted in Pulumi Cloud:
- `cloudflare:apiToken` - Cloudflare API token
- `vercel:apiToken` - Vercel API token
- `tally-infra:clerkSecretKey` - Clerk secret key (used to manage Clerk config + set Vercel env)
- `tally-infra:clerkPublishableKey` - Clerk publishable key (optional; used to set Vercel env)
- `tally-infra:sentryAdminToken` - Sentry admin token (for project/DSN provisioning)
- `tally-infra:launchDarklyClientSideId` - LaunchDarkly client-side ID

To update a secret:
```bash
pulumi config set <key> <value> --secret
```

## Setting Up Sentry

1. Create a Sentry organization (e.g., `tally-lz`) at https://sentry.io
2. Create an admin token at https://sentry.io/settings/auth-tokens/ with scopes:
   - `project:read`, `project:write`
   - `org:read`
   - `project:releases`
3. Set the token in Pulumi:
   ```bash
   pulumi config set --secret sentryAdminToken <your-token>
   ```
4. Run `pulumi up` to provision Sentry projects and configure Vercel env vars
