# Skill: implement-requirement-and-verify

Purpose: implement any plan/task consistently, with the right design constraints, tests, and verification steps across web/iOS/Android.

Use when:
- implementing any checklist item in `MASTER-TODO.md`
- implementing any `plans/**/feature-*.md`

Checklist:
1) Read the plan + acceptance criteria
   - Identify the smallest shippable slice (thin vertical increment).
   - Confirm any required secrets/integrations exist (names only). Never print secret values.

2) Apply non-negotiables
   - Follow `DESIGN-PHILOSOPHY.md` (tactile, focused, honest; tally motif; reduced-motion; accessibility).
   - No gimmicks (no emoji/confetti). Delight must be ink/tally based.
   - Entry UX must be fast: large tap targets; clear empty/error/offline states.

3) Implement (incremental)
   - Ship the smallest complete loop first (UI → data → persistence), then iterate.
   - Keep changes minimal and composable; avoid cross-feature coupling.

4) Test (use what exists)
   - Behavioral: primary user journeys + offline/slow-network + error states.
   - Unit: core logic (validation, calculations, transforms).
   - UI/snapshot: key screens/components (visual regressions).
   - E2E (if available): sign-in → create challenge → log entry → updated stats.

5) Verify (before deploy)
   - Run existing lint/build/test commands for the platform.
   - Manual smoke: create/update challenge, log entry, confirm tally UI + reduced-motion.

6) Verify in CI + deploy targets (when relevant)
   - Commit sensibly. Push to main. Review the github workflow deploy logs and fix any issues. Use GH cli.
   - If deploy is part of the task: verify build first, deploy, then smoke-check production.

7) Close the loop
   - Update plan docs if learnings changed scope/acceptance criteria.
   - Propagate cross-platform implications to other platform plans.
   - Commit with a clear message once the item is complete.
