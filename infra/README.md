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

To update a secret:
```bash
pulumi config set <key> <value> --secret
```
