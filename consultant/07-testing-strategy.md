# Project 07 — Testing strategy that actually protects shipping

## Objective
Get high confidence from fast tests, and reserve E2E for a small set of critical journeys.

## Observed signals (in this repo)
- Web uses `vitest`, `playwright`, and has an optional authenticated E2E workflow.
- CI runs lint/build/unit + API smoke + E2E smoke.

## Problems
- E2E flakiness (especially Clerk UI) can consume a lot of engineering time.
- Without clear test boundaries, teams over-rely on slow E2E.

## Proposed solution
1. **Test pyramid with explicit responsibilities**
   - Unit: pure logic, deterministic.
   - Integration: Convex functions + authz.
   - E2E: 3–7 golden flows max.
2. **Stabilize auth E2E**
   - Use dedicated dev Clerk instance + dedicated test user (already implied).
   - Add “skip if secrets missing” (already present in PR checks) consistently.
3. **Quality signals**
   - Track flake rate, test runtime, and failure categories.

## Milestones
- M1: Document test boundaries + standard patterns.
- M2: Add Convex integration tests for authz.
- M3: Reduce E2E suite to golden flows and move the rest down the pyramid.

## Acceptance criteria
- PR checks finish fast and fail only on actionable issues.
- E2E failures are rare and reproducible.
- Authz regressions are caught before prod.
