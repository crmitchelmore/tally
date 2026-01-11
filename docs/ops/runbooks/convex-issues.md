# Runbook: Convex Issues

## Symptoms
- Real-time updates not working
- Data not loading or saving
- "Convex error" in console
- API endpoints returning errors
- Slow queries

## First Response (5 min)

### 1. Check Convex Dashboard
Visit: https://dashboard.convex.dev/

Look for:
- Function errors (red indicators)
- Slow queries in the "Functions" tab
- Database usage spikes

### 2. Check Function Logs

In Convex dashboard:
1. Go to your deployment
2. Click "Logs" tab
3. Filter by error level
4. Check recent function invocations

### 3. Verify Connectivity

```bash
# Test API endpoint
curl -s "https://bright-jackal-396.convex.site/api/v1/challenges" \
  -H "Authorization: Bearer <test-token>" | jq
```

## Common Issues

### Deploy Failed Mid-Way
**Symptom**: Web app shows errors, Convex dashboard shows old schema

**Fix**: Re-run the deploy:
```bash
cd tally-web
bunx convex deploy --cmd-url-env-var-name CONVEX_DEPLOY_KEY
```

### Schema Migration Error
**Symptom**: "Schema validation failed" errors

**Check**:
1. Review `convex/schema.ts` for recent changes
2. Check if existing data conflicts with new schema
3. May need a data migration script

### Function Timeout
**Symptom**: Specific functions failing with timeout

**Fix**:
1. Check the function in Convex dashboard
2. Review query complexity
3. Add pagination or indexes

### Auth Token Issues
**Symptom**: "Unauthenticated" errors when logged in

**Check**:
1. Clerk JWT template in Convex settings
2. `convex/auth.config.ts` matches Clerk setup
3. Token not expired

## Rollback Steps

Convex doesn't have built-in rollback, but you can:

### Option 1: Revert Code
```bash
# Find the last good commit
git log --oneline convex/

# Revert to it
git checkout <good-commit> -- convex/

# Redeploy
cd tally-web
bunx convex deploy
```

### Option 2: Manual Schema Fix
If schema change broke things:
1. Fix schema in `convex/schema.ts`
2. Deploy the fix
3. Run data migration if needed

## Data Recovery

### Export Data
```bash
cd tally-web
bunx convex export --path backup.zip
```

### Import Data
```bash
bunx convex import --table <table-name> backup.zip
```

## Environment Issues

### Wrong Convex URL
**Check**: Verify NEXT_PUBLIC_CONVEX_URL in Vercel:
```bash
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/prj_tXdIJDmRB1qKZyo5Ngat62XoaMgw/env?teamId=team_ifle7fkp7usKufCL8MUCY1As" \
  | jq '.envs[] | select(.key | contains("CONVEX"))'
```

Should show:
- Dev: `bright-jackal-396` deployment
- Prod: Production deployment URL

## Escalation

If issue persists:
1. Convex Discord: https://convex.dev/community
2. Convex Support: support@convex.dev
3. Check @convaboratory on Twitter for status

## Post-Incident

- [ ] Document what broke
- [ ] Add Convex integration tests for the failure case
- [ ] Review function error handling
