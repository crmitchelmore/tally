# Runbook: Pulumi Rollback

## When to Use

- Infrastructure change broke production
- Need to restore previous DNS/domain/env var configuration
- Pulumi update caused unexpected changes

## Understanding Pulumi State

Pulumi maintains state history. You can:
1. View history of changes
2. Rollback to previous state
3. Import resources to fix drift

## Quick Commands

### View Recent History

```bash
cd infra
export PULUMI_ACCESS_TOKEN=<token>
export PATH="$HOME/.pulumi/bin:$PATH"

# List stack history
pulumi stack history --stack tally-tracker-org/prod
```

### Check Current State

```bash
# See what's deployed
pulumi stack --stack tally-tracker-org/prod

# Export current state
pulumi stack export --stack tally-tracker-org/prod > state-backup.json
```

## Rollback Strategies

### Option 1: Revert Code and Re-apply

**Best for**: Config changes, resource modifications

```bash
# Find last good commit
git log --oneline infra/

# Checkout infra/ to that commit
git checkout <good-commit> -- infra/

# Preview the rollback
pulumi preview --stack tally-tracker-org/prod

# Apply it
pulumi up --yes --stack tally-tracker-org/prod
```

### Option 2: Refresh and Fix Drift

**Best for**: Manual changes made outside Pulumi

```bash
# Refresh state from actual cloud resources
pulumi refresh --stack tally-tracker-org/prod

# This shows drift between Pulumi state and actual state
# Then run pulumi up to align
```

### Option 3: Import Missing Resources

**Best for**: Resource was deleted from code but exists

```bash
# Import syntax
pulumi import <type> <name> <id> --stack tally-tracker-org/prod

# Examples:
# Cloudflare DNS record
pulumi import cloudflare:index/dnsRecord:DnsRecord my-record zone_id/record_id

# Vercel domain
pulumi import vercel:index/projectDomain:ProjectDomain my-domain team_id/project_id/domain
```

## Common Issues

### Vercel Environment Variables Wrong

**Symptom**: App can't connect to Clerk/Convex/Sentry

**Check**:
```bash
# View what Pulumi thinks is deployed
pulumi stack output --stack tally-tracker-org/prod

# Compare with actual Vercel
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/prj_tXdIJDmRB1qKZyo5Ngat62XoaMgw/env?teamId=team_ifle7fkp7usKufCL8MUCY1As" \
  | jq '.envs[] | {key, target}'
```

**Fix**: Either refresh or redeploy:
```bash
pulumi refresh --stack tally-tracker-org/prod
pulumi up --yes --stack tally-tracker-org/prod
```

### DNS Records Missing

**Symptom**: Domain not resolving

**Check Cloudflare**:
```bash
# List DNS records via API
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/816559836db3c2e80112bd6aeefd6d27/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq '.result[] | {name, type, content}'
```

**Fix**: Re-run Pulumi or import the record

### Clerk Redirect URLs Missing

**Symptom**: OAuth callbacks fail

**Check**:
```bash
pulumi stack output clerkRedirects --stack tally-tracker-org/prod
```

**Fix**: The Clerk redirect resources use `command.local.Command` - they should self-heal on next `pulumi up`

### Resource "replacement" Needed

**Symptom**: Pulumi wants to delete and recreate a resource

**Caution**: This can cause downtime!

**Safe handling**:
```bash
# Preview first
pulumi preview --stack tally-tracker-org/prod

# If replacement is risky, consider:
# 1. Import the existing resource
# 2. Update code to match existing state
# 3. Or schedule the replacement during maintenance
```

## Emergency: Manual Fixes

If Pulumi is broken and you need immediate fix:

### Vercel Env Vars
1. Go to https://vercel.com/tally-tracker/tally-web/settings/environment-variables
2. Add/update the variable manually
3. Trigger redeploy

### Cloudflare DNS
1. Go to Cloudflare dashboard
2. Navigate to DNS settings
3. Add/update records manually

**Important**: After manual fixes, run `pulumi refresh` to sync state

## Secrets in Pulumi

Secrets are stored encrypted in Pulumi config:

```bash
# View config (secrets will be hidden)
pulumi config --stack tally-tracker-org/prod

# View specific secret
pulumi config get clerkSecretKey --stack tally-tracker-org/prod

# Update a secret
pulumi config set --secret clerkSecretKey <new-value> --stack tally-tracker-org/prod
```

## Post-Incident

- [ ] Document what changed
- [ ] Verify state is consistent with actual resources
- [ ] Add drift detection to CI if not present
- [ ] Update this runbook if new patterns found
