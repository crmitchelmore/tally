# Runbook: Auth Outage (Clerk)

## Symptoms
- Users cannot sign in or sign up
- "Authentication failed" errors
- Clerk UI/components not loading
- 401/403 errors on protected routes

## First Response (5 min)

### 1. Check Clerk Status
Visit: https://status.clerk.com/

If Clerk has an incident:
- Wait for their resolution
- Consider showing a maintenance banner

### 2. Verify Environment Keys

Check if keys are correct for the environment:

```bash
# Web "dev" deployment is currently disabled (see docs/IAC.md).
# Use a PR preview URL or local dev server instead.

# Prod
curl -s "https://tally-tracker.app/api/health" | jq
```

### 3. Check Vercel Logs

```bash
# Install Vercel CLI if needed
npm i -g vercel

# View recent logs
vercel logs tally-web --scope=team_ifle7fkp7usKufCL8MUCY1As
```

Look for:
- Clerk initialization errors
- Missing environment variables
- Token validation failures

## Common Causes

### Wrong Environment Keys
**Symptom**: Auth works in dev but not prod (or vice versa)

**Fix**: Verify Pulumi config matches the environment:
```bash
cd infra
pulumi config get clerkPublishableKey --stack tally-tracker-org/prod
```

Compare with Vercel:
```bash
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/prj_tXdIJDmRB1qKZyo5Ngat62XoaMgw/env?teamId=team_ifle7fkp7usKufCL8MUCY1As" \
  | jq '.envs[] | select(.key | contains("CLERK"))'
```

### Clerk Redirect URL Missing
**Symptom**: OAuth callback fails with "redirect_uri mismatch"

**Fix**: Add the URL via Pulumi:
```bash
cd infra
# Check current redirects
pulumi stack output clerkRedirects --stack tally-tracker-org/prod

# If missing, update infra/index.ts and apply
pulumi up --stack tally-tracker-org/prod
```

### Middleware Blocking Routes
**Symptom**: 404 on routes that should work

**Check**: Review `tally-web/src/middleware.ts` for route patterns

## Rollback Steps

If a recent deploy caused the issue:

1. **Vercel rollback**:
   ```bash
   # List recent deployments
   vercel ls tally-web --scope=team_ifle7fkp7usKufCL8MUCY1As

   # Promote previous deployment
   vercel promote <deployment-url> --scope=team_ifle7fkp7usKufCL8MUCY1As
   ```

2. **Pulumi rollback** (if infra change):
   See [pulumi-rollback.md](./pulumi-rollback.md)

## Escalation

If issue persists after 15 min:
1. Check Clerk support: https://clerk.com/support
2. Review recent commits touching auth code
3. Escalate to team lead

## Post-Incident

- [ ] Document root cause
- [ ] Create follow-up issues
- [ ] Update this runbook if needed
