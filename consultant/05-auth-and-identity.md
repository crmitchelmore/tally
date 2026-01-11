# Project 05 — Auth, identity, and authorization correctness (Clerk + Convex)

## Objective
Guarantee that user identity is consistent across environments and that authorization is enforced server-side.

## Observed signals (in this repo)
- Strong conventions exist in Copilot instructions: never trust client `userId`, use `ctx.auth.getUserIdentity()`.
- Multi-env Clerk keys are used in CI and infra.

## Problems
- Multi-environment auth is a common failure mode: preview builds accidentally using prod keys, or vice versa.
- Authorization bugs usually surface as “data leaks” rather than crashes.

## Proposed solution
1. **Centralize authz invariants**
   - Single Convex auth helper layer that all queries/mutations use.
   - Enforce ownership checks on every mutation.
2. **Environment isolation**
   - Explicit mapping: preview/dev use dev Clerk; prod uses prod Clerk.
   - Ensure the web app exposes the right publishable key per target.
3. **Auditability**
   - Add structured audit logging for privileged mutations (delete/transfer/archive).

## Milestones
- M1: Inventory all Convex mutations and confirm authz patterns.
- M2: Add a small set of “authz regression tests” (Convex-test) for key resources.
- M3: Add audit logging and dashboards.

## Acceptance criteria
- No server mutation accepts userId/ownerId from client without verification.
- Preview cannot accidentally talk to prod Clerk.
- High-risk actions are traceable by user + request id.
