# Operations Runbooks

This directory contains incident response runbooks for Tally production systems.

## Quick Reference

| Incident Type | Runbook | First Response |
|--------------|---------|----------------|
| Auth outage | [auth-outage.md](./auth-outage.md) | Check Clerk status |
| Convex issues | [convex-issues.md](./convex-issues.md) | Check Convex dashboard |
| Vercel deploy | [vercel-rollback.md](./vercel-rollback.md) | Rollback via CLI |
| High error rate | [elevated-errors.md](./elevated-errors.md) | Check Sentry |
| Infra changes | [pulumi-rollback.md](./pulumi-rollback.md) | Pulumi stack history |

## Incident Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P1** | Service unavailable | 15 min | Auth down, data loss |
| **P2** | Major feature broken | 1 hour | Can't create entries |
| **P3** | Minor issues | 4 hours | UI glitch, slow perf |
| **P4** | Cosmetic/low impact | Best effort | Typos, minor styling |

## General Response Steps

1. **Acknowledge** - Confirm you're investigating
2. **Assess** - Determine severity and scope
3. **Communicate** - Update stakeholders if P1/P2
4. **Mitigate** - Restore service (rollback if needed)
5. **Root cause** - Investigate after service restored
6. **Follow up** - Create issues for fixes/improvements

## Key Dashboards

- **Sentry**: https://tally-lz.sentry.io/
- **Convex**: https://dashboard.convex.dev/
- **Vercel**: https://vercel.com/tally-tracker/tally-web
- **Clerk**: https://dashboard.clerk.com/

## On-Call Contacts

Currently no formal on-call rotation. For urgent issues:
1. Check the relevant runbook
2. Follow mitigation steps
3. Escalate via team channels if needed
