# Tally Consultant Directory

This directory contains a set of **improvement projects** identified during a quick repo/config review.

## How to use

- Start with **15-risk-register.md** to see the cross-cutting risks.
- Then pick the highest ROI projects (usually: **02, 03, 07, 09, 08**).
- Each file includes: problem statement, observed signals in this repo, proposed solution, milestones, and acceptance criteria.

## Project list

1. **01-repo-hygiene.md** — make the repo easier to work in (workspace boundaries, generated files, ownership).
2. **02-package-management-and-build-repro.md** — eliminate mixed lockfiles and make builds deterministic.
3. **03-ci-cd-and-environments.md** — simplify CI, tighten environment separation, and make deploys boring.
4. **04-infra-iac-quality.md** — Pulumi stack hygiene, idempotency, and “no shell in IaC” where possible.
5. **05-auth-and-identity.md** — Clerk + middleware patterns, multi-env correctness, least privilege.
6. **06-data-and-api-contracts.md** — Convex authz invariants, HTTP actions for mobile, shared contracts.
7. **07-testing-strategy.md** — stable unit/integration/E2E layering and confidence metrics.
8. **08-observability-and-ops.md** — OTel + Sentry done end-to-end with actionable dashboards.
9. **09-security-and-compliance.md** — secrets, dependencies, supply chain, and hardening.
10. **10-performance-and-caching.md** — perceived perf, caching, and payload discipline.
11. **11-ux-design-system-a11y.md** — design tokens, accessibility, and UI consistency.
12. **12-mobile-platform-plan.md** — iOS/Android foundations and shared types.
13. **13-product-analytics-and-growth.md** — PostHog/LD usage patterns, event taxonomy, experiments.
14. **14-legacy-and-tech-debt.md** — legacy/Spark containment, deletion plan, migration guardrails.
15. **15-risk-register.md** — program-level risks and mitigations.
16. **16-finops-and-cost-control.md** — cost model, budgets, and ingestion guardrails.
17. **17-privacy-and-data-governance.md** — data classification, PII avoidance, retention.
18. **18-incident-response-and-reliability.md** — runbooks, rollback playbooks, on-call-lite process.
