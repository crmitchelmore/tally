# iOS Implementation Plan (High Level)

## Stack
- Swift + SwiftUI
- Modular Swift Packages (TallyCore for API + models)
- Clerk auth for iOS and JWT for API calls
- Local persistence for offline-first behavior

## Product ethos
- Tactile, focused, honest; friendly, fast, and calm.
- Subtle motion, reduced-motion support, and accessibility first.

## Delivery workflow (repo rules)
- Each feature plan ships as its own PR.
- Repo setting: disable squash merges; allow rebase-only merges.
- Require review approval; after approval use pr-resolver to validate checks before merge.

## Phases
1. Foundation: app shell, design system, auth, API client, local cache.
2. Core flows: challenges and entries.
3. Insights + data management.
4. Community + leaderboard.
5. Polish: performance, offline sync, accessibility.

## Phase detail (order)
1. Foundation: app shell, design system, auth, API client, local cache.
2. Core flows: challenges and entries, with optimistic UI.
3. Insights + data management: stats, weekly summary, export/import, clear-all.
4. Community + leaderboard: public challenges, follow, real aggregation UI.
5. Polish: offline sync clarity, accessibility, performance, store readiness.

## Testing focus (behavioral)
- End-to-end user journeys for sign-in, create challenge, log entry.
- Offline capture and sync recovery.
- Reduced-motion, Dynamic Type, VoiceOver behavior.
- Error states (expired auth, network failure).

## Completion criteria
- Parity with web feature map for core flows.
- Offline-first UX with clear sync state and retries.
- Accessibility (VoiceOver, Dynamic Type) and performance targets met.
- Behavioral tests documented and passing for each feature.

## Feature plans
- feature-auth.md
- feature-api-client.md
- feature-challenges.md
- feature-entries.md
- feature-stats.md
- feature-data-portability.md
- feature-community.md
- feature-leaderboard.md

## Separate project: Automation + pipelines (last)
- CI for build/test, device smoke tests, and signing.
- TestFlight and App Store release automation.
- Release gating and rollback procedures.
