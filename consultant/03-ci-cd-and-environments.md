# Project 03 — CI/CD, environments, and deployment safety

## Objective
Make CI fast, predictable, and aligned with environment boundaries (development/preview/production), while ensuring deploys are atomic and auditable.

## Observed signals (in this repo)
- `PR Checks` workflow runs a comprehensive web job (lint/build/unit/API smoke/E2E smoke) plus infra typecheck/preview.
- Deploy actions are spread across multiple workflows (`pr.yml`, `dev-deploy.yml`, `infra-apply.yml`).
- Some control logic can silently degrade (e.g., “affected projects” computed with error suppression).
- The main pipeline deploys **Infra (Pulumi)**, **Convex**, and **Vercel** with multiple gating jobs.

## Problems
- **Pipeline fragmentation**: multiple workflows can drift (different bun/node versions, env vars, secrets behavior).
- **Silent skipping**: any “best-effort” logic around affected detection or missing secrets can accidentally skip protections.
- **Deploy ordering risk**:
  - Vercel deployment can succeed while Convex deploy fails (or vice versa), producing mismatched client/server contracts.
  - Pulumi changes can modify env vars and redirects; if not applied before app deploy, you can ship broken auth flows.

## Proposed solution
1. **Single canonical workflow graph**
   - PR: validate only.
   - main: validate + deploy (strict ordering) with a single entrypoint.
   - Optional develop: deploy to dev stack.
2. **Make “affected” detection strict**
   - If Nx affected calculation fails, fail the workflow (don’t hide the error).
   - Prefer `nx print-affected`/`nx affected` with explicit base/head for PRs.
3. **Environment + secret contracts**
   - Use GitHub Environments (`development`, `preview`, `production`) with scoped secrets.
   - Add a small “required secrets present” step per job that would otherwise skip.
4. **Deploy atomicity**
   - If Convex deploy is required for a release, make it a hard gate.
   - Consider adding a release marker (commit SHA) written to both Convex and Vercel to verify version alignment.

## Milestones
- M1: Consolidate deploy flows into one workflow (or one reusable workflow called by others).
- M2: Replace silent affected detection with strict logic + clear logs.
- M3: Add environment-scoped secrets + explicit job contracts.
- M4: Add version alignment checks (Convex + Web) and rollback guidance.

## Acceptance criteria
- All deploys run through a single, well-understood workflow per branch.
- No job silently skips critical checks due to suppressed errors.
- Production deploy produces a clear, auditable record: infra version, Convex version, web version.
