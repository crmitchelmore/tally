# Project 12 — Mobile platform foundations (iOS/Android)

## Objective
Stand up iOS/Android apps that share contracts, behavior, and telemetry with the web app.

## Constraints
- Local verification may be limited by SDK availability; CI should be the backbone.

## Proposed solution
1. **Shared contracts**
   - Adopt `packages/shared-types` as the API contract.
   - Generate Swift/Kotlin types where needed (or maintain minimal hand-mapped DTOs).
2. **Auth strategy**
   - Clerk on mobile with clear env separation (dev/prod).
3. **Networking and caching**
   - Single networking layer per platform with retry/backoff and offline cache.
4. **Observability**
   - Sentry + OTel-compatible tracing hooks.

## Milestones
- M1: App shells + sign-in + read-only challenges.
- M2: Entry create/update flows.
- M3: Offline-first basics + background sync.

## Acceptance criteria
- Mobile can perform the top 3 user flows end-to-end against dev backend.
- API contract changes are versioned and don’t break clients unexpectedly.
- Telemetry works consistently across platforms.
