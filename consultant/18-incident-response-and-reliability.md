# Project 18 — Incident response & reliability

## Objective
Be able to safely operate Tally in production with clear runbooks, escalation, and rollback paths.

## Problems to solve
- Without runbooks, incidents are solved ad-hoc and repeatedly.
- Deploy pipelines need rollback guidance (what to do if web deploy succeeds but Convex does not).

## Proposed solution
1. **Runbooks**
   - Auth outage
   - Convex deploy failure
   - Vercel deploy regression
   - Elevated error rate / latency
2. **On-call-lite process**
   - Severity levels, comms template, owner rotation.
3. **Rollback playbooks**
   - Vercel rollback steps.
   - Convex rollback/version pin strategy.
   - Pulumi rollback/stack restore strategy.

## Milestones
- M1: Draft runbooks + place in `docs/ops/runbooks/`.
- M2: Add “release marker” and rollback triggers.
- M3: Do a tabletop exercise.

## Acceptance criteria
- Any incident has a documented first-response checklist.
- Rollback paths exist for all deploy surfaces.
- Post-incident reviews produce actionable follow-ups.
