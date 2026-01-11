# Project 06 — Data architecture & shared API contracts

## Objective
Enable mobile apps cleanly via stable HTTP actions and a shared contract package, while keeping Convex real-time strengths.

## Observed signals (in this repo)
- `packages/shared-types/` exists (good direction).
- Project 2 (“Shared API Layer”) is pending.

## Problems
- Without a contract-first API, iOS/Android will drift in behavior and validation rules.
- Convex queries/mutations are great for web, but mobile often needs explicit HTTP surfaces.

## Proposed solution
1. **Contract-first schema**
   - Define request/response types (Zod or TS + runtime validation) in `packages/shared-types`.
2. **Convex HTTP actions**
   - Expose a minimal REST-ish surface for mobile (auth required):
     - list challenges
     - get challenge
     - upsert entry
     - list entries (range)
3. **Versioning strategy**
   - Add `v1` path prefix and explicit deprecation policy.

## Milestones
- M1: Choose validation strategy (Zod recommended for runtime safety).
- M2: Implement HTTP actions + shared types.
- M3: Add mobile smoke tests (contract tests) in CI.

## Acceptance criteria
- Mobile apps compile against shared types.
- HTTP endpoints validate inputs and enforce authz.
- A breaking API change requires an intentional version bump.
