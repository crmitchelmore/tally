# Project 08 — Observability & operations (OTel + Sentry)

## Objective
Make it easy to answer: “what broke, who is affected, and what changed?”

## Observed signals (in this repo)
- Infra provisions Grafana Cloud OTel env vars and Sentry projects/DSNs.
- Web depends on OTel SDK packages and `@sentry/nextjs`.

## Problems
- Observability only works if it’s end-to-end (frontend + server + backend) with consistent correlation ids.
- Without a canonical log line/spans, debugging becomes guesswork.

## Proposed solution
1. **Canonical telemetry model**
   - Trace id propagated across: Next.js request → Convex call → downstream.
   - Standard attributes: user id (hashed), challenge id, environment.
2. **Actionable dashboards**
   - SLOs: p95 latency, error rate, signup success, entry creation success.
   - Alerts tied to user-impacting journeys.
3. **Release correlation**
   - Inject commit SHA/build id into logs and Sentry releases.

## Milestones
- M1: Verify Sentry init (client/server/edge) and OTel init are correct.
- M2: Add key spans around Convex calls and auth flows.
- M3: Build dashboards + alerting runbook.

## Acceptance criteria
- A production incident can be triaged in <10 minutes.
- Errors are grouped, tagged, and correlated to releases.
- Key user journeys have traces and SLIs.
