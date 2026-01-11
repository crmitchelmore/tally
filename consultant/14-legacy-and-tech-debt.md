# Project 14 — Legacy containment & technical debt burn-down

## Objective
Prevent legacy prototype code from constraining the production system, and create a safe deletion plan.

## Observed signals
- `legacy/` exists alongside the new Next.js app.

## Problems
- Legacy code increases cognitive load and can confuse CI/packaging.
- Unclear ownership leads to “zombie dependencies” that never get removed.

## Proposed solution
1. **Containment**
   - Ensure legacy is excluded from builds, lint, typecheck, and dependency graphs unless intentionally targeted.
2. **Deletion plan**
   - Inventory what (if anything) is still needed.
   - Migrate remaining assets, then delete in a single PR.
3. **Deprecation guardrails**
   - No new imports from legacy.

## Milestones
- M1: Confirm legacy isn’t referenced by production builds.
- M2: Extract anything still needed.
- M3: Delete legacy and remove dependencies.

## Acceptance criteria
- Removing legacy does not change production behavior.
- CI is faster and the dependency graph is simpler.
