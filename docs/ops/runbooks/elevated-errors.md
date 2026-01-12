# Runbook: Elevated Error Rate

## Symptoms
- Sentry alerts firing
- Users reporting errors
- Error rate spike in dashboards
- Slow response times

## Querying Observability Tools (CLI)

Get tokens from `.env` at repo root:
```bash
# Load tokens
export SENTRY_ADMIN_TOKEN=$(grep SENTRY_ADMIN_TOKEN .env | cut -d= -f2)
export POSTHOG_ADMIN_TOKEN=$(grep POSTHOG_ADMIN_TOKEN .env | cut -d= -f2)
```

### Sentry API
```bash
# Check auth
curl -s -H "Authorization: Bearer $SENTRY_ADMIN_TOKEN" \
  "https://sentry.io/api/0/auth/" | jq '{email, isActive}'

# List recent issues (last 24h)
curl -s -H "Authorization: Bearer $SENTRY_ADMIN_TOKEN" \
  "https://sentry.io/api/0/projects/tally-lz/javascript-nextjs/issues/?query=is:unresolved&statsPeriod=24h&limit=10" | \
  jq '.[] | {id, title, count, firstSeen, lastSeen}'

# Get issue details
curl -s -H "Authorization: Bearer $SENTRY_ADMIN_TOKEN" \
  "https://sentry.io/api/0/issues/{ISSUE_ID}/" | jq '.'

# Get latest events for an issue
curl -s -H "Authorization: Bearer $SENTRY_ADMIN_TOKEN" \
  "https://sentry.io/api/0/issues/{ISSUE_ID}/events/?limit=5" | \
  jq '.[] | {id, message, timestamp, contexts}'
```

### PostHog API
```bash
# Recent events (EU region)
curl -s -H "Authorization: Bearer $POSTHOG_ADMIN_TOKEN" \
  "https://eu.posthog.com/api/projects/@current/events?limit=10" | \
  jq '.results[] | {event, timestamp, distinct_id}'

# Query by event type
curl -s -H "Authorization: Bearer $POSTHOG_ADMIN_TOKEN" \
  "https://eu.posthog.com/api/projects/@current/events?event=\$pageview&limit=10" | \
  jq '.results[] | {event, timestamp}'
```

## First Response (5 min)

### 1. Open Sentry
https://tally-lz.sentry.io/

Check:
- Error rate trend (is it increasing?)
- Top errors by volume
- Affected users count
- Which release introduced it

### 2. Quick Triage

| Question | If Yes |
|----------|--------|
| Errors started after deploy? | Consider rollback |
| All errors same type? | Single root cause |
| Errors from one region? | Infrastructure issue |
| Errors for one user? | Data/account issue |

### 3. Check Dependencies

- **Clerk**: https://status.clerk.com/
- **Convex**: https://dashboard.convex.dev/
- **Vercel**: https://www.vercel-status.com/

## Common Error Patterns

### "Network request failed"
**Likely cause**: Backend unavailable or CORS

**Check**:
```bash
# Test API directly
curl -v "https://bright-jackal-396.convex.site/api/v1/challenges"
```

### "Unauthenticated" errors
**Likely cause**: Auth token issues

**See**: [auth-outage.md](./auth-outage.md)

### "Validation error" spikes
**Likely cause**: Schema mismatch or bad data

**Check**:
- Recent schema changes in `convex/schema.ts`
- Data migration status

### "Rate limit exceeded"
**Likely cause**: Too many requests

**Check**:
- Convex dashboard for function call volume
- Look for infinite loops or polling bugs

### "TypeError" / "Cannot read property"
**Likely cause**: Code bug, usually in new deploy

**Actions**:
1. Check release in Sentry
2. Find the commit
3. Rollback or hotfix

## Investigation Steps

### Find the Pattern

In Sentry:
1. Group errors by release/browser/user
2. Look at stack traces
3. Check breadcrumbs for user journey

### Reproduce Locally

```bash
cd tally-web
bun run dev

# Try to trigger the error
# Check browser console and network tab
```

### Check Logs

```bash
# Vercel function logs
vercel logs tally-web --scope=team_ifle7fkp7usKufCL8MUCY1As

# Filter by time
vercel logs tally-web --since=1h --scope=team_ifle7fkp7usKufCL8MUCY1As
```

## Mitigation Options

### 1. Quick Rollback (if deploy-related)
See [vercel-rollback.md](./vercel-rollback.md)

### 2. Feature Flag (if feature-related)
```javascript
// Disable problematic feature via LaunchDarkly
// Or add runtime check
```

### 3. Hotfix
```bash
# Create hotfix branch
git checkout main
git checkout -b hotfix/error-123

# Make minimal fix
# Test locally
# Push and deploy
```

### 4. Block Bad Requests (if abuse)
Consider adding rate limiting or validation

## Communication

For P1/P2 incidents:
1. Acknowledge in team channel
2. Post status update every 15 min
3. Notify users if service degraded

## Monitoring

### Key Metrics
- Error rate (Sentry)
- Response time (Vercel Analytics)
- Function duration (Convex dashboard)

### Alerting Thresholds
- Error rate > 1% for 5 min
- P95 latency > 3s
- 5xx rate > 0.5%

## Post-Incident

- [ ] Root cause identified
- [ ] Fix deployed or workaround in place
- [ ] Monitoring updated if needed
- [ ] Tests added for regression
- [ ] Incident documented
