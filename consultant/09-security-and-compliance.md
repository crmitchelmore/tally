# Project 09 — Security, secrets, and supply-chain hardening

## Objective
Reduce the probability and blast radius of common failures: secret leaks, dependency compromise, auth misconfig, and data exposure.

## Observed signals (in this repo)
- Security scanning workflows exist (gitleaks, dependency review, OSV).
- Multiple third-party admin tokens are in play (Pulumi, Vercel, Cloudflare, Sentry, Grafana, LaunchDarkly).

## Problems
- Secrets often end up duplicated across GitHub, Vercel, Pulumi, and local `.env`.
- IaC that uses shell/API calls increases the chance of leaking sensitive outputs into logs.

## Proposed solution
1. **Secret ownership model**
   - Source of truth for each secret: GitHub env secret vs Pulumi config vs Vercel env var.
   - Rotate schedule and incident procedure.
2. **Least privilege**
   - Separate tokens per environment with minimum scopes.
   - Protect prod secrets behind GitHub Environments with required reviewers.
3. **Dependency and runtime hardening**
   - Turn on Dependabot grouping and auto-merge for low risk.
   - Add runtime security headers for Next.js (CSP/permissions policy) where compatible.

## Milestones
- M1: Create a secrets inventory and reduce duplication.
- M2: Introduce environment-scoped secrets in GitHub.
- M3: Add hardening headers + validate with CSP report-only.

## Acceptance criteria
- No prod secrets are available to PR workflows.
- Secret rotation is documented and tested.
- Vulnerability findings have a clear SLA and owner.
