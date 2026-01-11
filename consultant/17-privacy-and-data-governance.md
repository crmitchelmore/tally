# Project 17 — Privacy & data governance

## Objective
Make analytics/telemetry compatible with user trust and future compliance needs.

## Problems to solve
- Analytics/feature flags/telemetry can accidentally collect PII.
- Mobile launch increases scrutiny (store policies, privacy declarations).

## Proposed solution
1. **Data classification**
   - Define what data is PII, what is sensitive, what is operational.
2. **Event hygiene**
   - Ban raw email/name in analytics events.
   - Hash or anonymize identifiers.
3. **Retention and deletion**
   - Document retention per system (Convex, PostHog, Sentry, Grafana).
   - Add “delete account” behavior that also deletes or anonymizes telemetry.

## Milestones
- M1: Data classification + event rules.
- M2: Implement redaction/hashing in analytics and logs.
- M3: Add retention + deletion workflows.

## Acceptance criteria
- No PII in analytics/telemetry by default.
- Retention is documented and enforced.
- Account deletion is end-to-end and verifiable.
