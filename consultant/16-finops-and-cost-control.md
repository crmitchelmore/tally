# Project 16 — FinOps & cost control

## Objective
Keep infra costs predictable as usage grows, with clear owners and alerts.

## Problems to solve
- Realtime backends (and analytics/observability) can scale cost non-linearly if queries/log volume are unbounded.
- Without budgets, teams learn about cost spikes after the bill arrives.

## Proposed solution
1. **Cost model & budgets**
   - Define expected cost drivers per service: Vercel (bandwidth/build minutes), Convex (function/query usage), Sentry/Grafana (events/ingest).
   - Configure budget alerts and weekly cost review.
2. **Guardrails**
   - Sampling and rate limits for logs/traces.
   - Limit high-cardinality attributes (user ids as raw values, etc.).
   - Enforce pagination and bounded subscriptions in Convex.
3. **Cost dashboards**
   - One dashboard per environment with unit economics (cost per active user / per entry).

## Milestones
- M1: Identify top cost drivers and add alerts.
- M2: Add telemetry sampling and data-access bounds.
- M3: Track unit economics over time.

## Acceptance criteria
- Cost spikes trigger alerts within hours.
- No unbounded telemetry ingestion.
- Monthly costs remain within a defined envelope for current scale.
