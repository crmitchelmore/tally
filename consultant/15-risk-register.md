# Project 15 — Risk register (program-level)

## Top risks (ranked)

### R1 — Environment credential mix-ups (High)
**Failure mode:** preview/dev uses prod Clerk/Convex/Sentry or vice versa.
- **Mitigation:** explicit env mapping, environment-scoped GitHub secrets, CI assertions.
- **Signal:** authentication works locally but fails in preview; data appears “missing”.

### R2 — Shell-based IaC fragility (High)
**Failure mode:** Pulumi preview/up breaks due to API/jq changes or rate limits.
- **Mitigation:** replace `command.local` with typed providers/dynamic resources; add retries/backoff.

### R3 — Authorization regression (High)
**Failure mode:** mutation trusts client input and leaks/modifies data.
- **Mitigation:** centralized auth helpers + integration tests for ownership/access.

### R4 — E2E instability blocking shipping (Medium)
**Failure mode:** Clerk UI changes break tests; merges get blocked.
- **Mitigation:** keep E2E minimal, use resilient locators, push logic down to integration tests.

### R5 — Dependency drift and supply-chain exposure (Medium)
**Failure mode:** mixed lockfiles and tooling lead to unnoticed vulnerability windows.
- **Mitigation:** strict lockfile policy + dependabot + OSV + SBOM.

### R6 — Observability gaps (Medium)
**Failure mode:** incidents take hours because there’s no correlation from user action → backend.
- **Mitigation:** canonical traces/logging, dashboards, release tagging.

### R7 — Mobile/API divergence (Medium)
**Failure mode:** mobile implements different rules than web.
- **Mitigation:** contract-first API + shared types + versioned HTTP surface.

## Program cadence (recommended)
- Week 1–2: Projects 02, 03, 09
- Week 3–4: Projects 06, 07, 08
- Week 5+: Projects 11–14 in parallel with feature work
