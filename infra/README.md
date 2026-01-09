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

2. Login to Pulumi (local state):
   ```bash
   pulumi login --local
   ```

3. Set environment variables in root `.env`:
   ```
   CLOUDFLARE_API_TOKEN=xxx
   VERCEL_API_TOKEN=xxx
   ```

## Usage

```bash
cd infra

# Install dependencies
npm install

# Preview changes
export PULUMI_CONFIG_PASSPHRASE="your-passphrase"
pulumi preview

# Apply changes
pulumi up

# View current state
pulumi stack

# Destroy (careful!)
pulumi destroy
```

## Stack Passphrase

The stack is encrypted with passphrase: `tally-infra-2026`

Set this before running pulumi commands:
```bash
export PULUMI_CONFIG_PASSPHRASE="tally-infra-2026"
```

## Adding New Resources

1. Update `index.ts` with new resource definitions
2. Run `pulumi preview` to see changes
3. Run `pulumi up` to apply

## Importing Existing Resources

To import an existing resource:
```typescript
const resource = new cloudflare.DnsRecord("name", {
  // ... config
}, {
  import: "zone_id/record_id",
});
```
