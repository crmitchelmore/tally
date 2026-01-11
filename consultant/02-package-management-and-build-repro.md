# Project 02 — Package management consistency & reproducible builds

## Objective
Make builds deterministic across local/CI, reduce dependency drift, and improve supply-chain safety.

## Observed signals (in this repo)
- Root has **`package-lock.json`** (npm) while web uses **`bun.lockb`**; infra also uses npm.
- CI installs root deps with `npm ci` and web deps with `bun install --frozen-lockfile`.

## Problems
- Cross-workspace dependency resolution can drift (especially with Nx plugins and tooling).
- Security scanners and SBOM generation get complicated with multiple lock formats.
- Contributors can accidentally run `npm install` inside `tally-web/` and produce a `package-lock.json` there.

## Proposed solution
1. **Explicit “allowed package manager” checks**
   - CI step that fails if:
     - `tally-web/package-lock.json` exists
     - `infra/bun.lockb` exists
2. **Pin tool versions**
   - Pin Node version (already in workflows) and Bun version (already pinned) **and** document them.
   - Consider `volta` or `.tool-versions` (asdf) if the team wants local parity.
3. **Reproducible builds**
   - Ensure all build-time env vars required for `next build` are set in CI (or explicitly mocked) to avoid hidden “undefined at build” behavior.
   - Ensure Sentry sourcemap upload is optional and never breaks builds.

## Milestones
- M1: Add lockfile guards and a “package manager policy” doc.
- M2: Confirm Nx/tooling dependencies only live where required.
- M3: Add a deterministic “CI parity” doc + one command per workspace.

## Acceptance criteria
- A CI build is byte-for-byte consistent given the same commit and env.
- No accidental lockfiles appear in the wrong workspace.
- Dependency audit tools can be run reliably across workspaces.
