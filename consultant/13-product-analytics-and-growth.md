# Project 13 — Product analytics, feature flags, and growth loops

## Objective
Enable reliable measurement, experimentation, and iteration without harming performance or privacy.

## Observed signals
- PostHog and LaunchDarkly docs exist; LD provider currently disabled in Pulumi.

## Problems
- Without an event taxonomy, analytics becomes noisy and hard to trust.
- Feature flags can create “permanent complexity” unless governed.

## Proposed solution
1. **Event taxonomy**
   - Define canonical events for: signup, challenge created, entry logged, streak milestones, share.
   - Include properties: platform, app version, experiment variants.
2. **Flag governance**
   - Every flag has: owner, expiry date, rollout plan, kill switch.
3. **Privacy posture**
   - Avoid sending PII; hash identifiers.
   - Document data retention and opt-out strategy.

## Milestones
- M1: Event catalog + implementation for top flows.
- M2: Flag governance + cleanup cadence.
- M3: Experiment templates and dashboards.

## Acceptance criteria
- Key metrics are consistent week to week.
- Flags are routinely removed after rollout.
- Analytics doesn’t meaningfully impact app performance.
