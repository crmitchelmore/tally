# Project 01 — Repository hygiene & developer experience

## Objective
Make the monorepo predictable, safe for multi-agent work, and easy for new contributors to build/run.

## Observed signals (in this repo)
- Root contains **both** `bun.lockb` and `package-lock.json`, and a root `node_modules/` directory exists locally.
- Working tree is commonly non-clean (local edits/untracked workflow/config files show up easily), increasing PR noise.
- Docs and operational notes are spread across root (`*.md`) + `docs/`, making “source of truth” unclear.

## Problems
- Mixed tooling at root increases “works on my machine” drift.
- Contributors may run the wrong package manager in the wrong workspace.
- Hard-to-find operational knowledge slows incident response and onboarding.

## Proposed solution
1. **Workspace boundary rules**
   - Root: Nx only (no runtime deps unless strictly required).
   - `tally-web/`: bun-only.
   - `infra/`: npm-only.
2. **Repo guardrails**
   - Add lightweight checks (pre-commit optional, CI mandatory) that prevent:
     - adding `node_modules/` artifacts
     - adding lockfiles in the wrong workspace
     - committing `.env*` and local Pulumi files
3. **Documentation structure**
   - Consolidate ops docs under `docs/ops/` and product docs under `docs/product/`.
   - Keep root README short: “how to run”, “how to deploy”, “where docs live”.

## Milestones
- M1: Define workspace rules + update README(s) to match.
- M2: CI guardrails for lockfiles / generated artifacts.
- M3: Documentation consolidation + link map.

## Acceptance criteria
- A fresh clone can run web + infra with copy/paste commands.
- CI fails if the wrong lockfile is introduced.
- Docs have a single entry point and no duplicate “truths”.
