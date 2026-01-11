# Runbook: Vercel Rollback

## When to Use

- Recent deploy broke production
- Need to quickly restore previous working version
- Deploy succeeded but app is broken

## Quick Rollback (2 min)

### Via Vercel Dashboard (Fastest)

1. Go to: https://vercel.com/tally-tracker/tally-web/deployments
2. Find the last known good deployment
3. Click the three dots menu → "Promote to Production"
4. Confirm

### Via CLI

```bash
# Ensure you're authenticated
vercel whoami

# List recent deployments
vercel ls tally-web --scope=team_ifle7fkp7usKufCL8MUCY1As

# Find the good deployment URL and promote it
vercel promote <deployment-url> --scope=team_ifle7fkp7usKufCL8MUCY1As
```

## Identifying the Bad Deploy

### Check Recent Deployments

```bash
# List with timestamps
vercel ls tally-web --scope=team_ifle7fkp7usKufCL8MUCY1As | head -20
```

### Check Deploy Logs

```bash
# Get logs from specific deployment
vercel logs <deployment-url> --scope=team_ifle7fkp7usKufCL8MUCY1As
```

### Correlate with GitHub

```bash
# Recent commits to main
git log --oneline -10

# Find the commit that was deployed
# (Vercel shows commit SHA in dashboard)
```

## Partial Rollback Scenarios

### Only Web Broken (Convex OK)

Just rollback Vercel:
```bash
vercel promote <good-deployment> --scope=team_ifle7fkp7usKufCL8MUCY1As
```

### Convex Also Changed

Need to coordinate:
1. Rollback Convex first (see [convex-issues.md](./convex-issues.md))
2. Then rollback Vercel
3. Both must be compatible versions

### Environment Variables Changed

If env vars were modified via Pulumi:
1. Rollback Pulumi (see [pulumi-rollback.md](./pulumi-rollback.md))
2. Trigger new Vercel deployment or rollback

## Verifying the Rollback

### Basic Health Check
```bash
curl -s "https://tally-tracker.app/api/health" | jq
```

### Smoke Test
1. Open https://tally-tracker.app
2. Sign in
3. View challenges
4. Create an entry (if safe)

### Check Error Rates
- Sentry: https://tally-lz.sentry.io/
- Look for new errors after rollback

## Preventing Bad Deploys

Our CI pipeline should catch most issues:
1. Lint/build/test in PR
2. Deploy to dev first
3. E2E tests on dev
4. Then deploy to prod
5. E2E tests on prod (non-blocking)

If a bad deploy got through:
- Check if E2E tests passed
- Review what the tests didn't cover
- Add regression tests

## Related Commands

```bash
# Force rebuild current commit
vercel --prod --force --scope=team_ifle7fkp7usKufCL8MUCY1As

# Deploy specific commit
git checkout <commit>
vercel --prod --scope=team_ifle7fkp7usKufCL8MUCY1As

# Inspect deployment
vercel inspect <deployment-url> --scope=team_ifle7fkp7usKufCL8MUCY1As
```

## Post-Incident

- [ ] Identify root cause
- [ ] Add test coverage for the failure
- [ ] Update CI if needed
- [ ] Document in incident log
