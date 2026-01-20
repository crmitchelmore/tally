# Android Implementation Plan (High Level)

## Stack
- Kotlin + Jetpack Compose (native)
- Modular architecture (app + core modules)
- Clerk auth for Android and JWT for API calls
- Local persistence for offline-first behavior (Room)

## Local build prerequisites (avoid common blocker)
- Android SDK path must be configured or Gradle will fail:
  - set `ANDROID_HOME` (or `ANDROID_SDK_ROOT`), OR
  - create `local.properties` with `sdk.dir=...` (do not commit `local.properties`).

## Key references (canonical docs)
- Jetpack Compose: https://developer.android.com/jetpack/compose
- Kotlin: https://kotlinlang.org/docs/home.html
- Gradle for Android: https://developer.android.com/build
- Clerk Android quickstart: https://clerk.com/docs/android/getting-started/quickstart
- Clerk Android SDK overview: https://clerk.com/docs/reference/android/overview

## Product ethos
- Tactile, focused, honest; friendly, fast, and calm.
- Subtle motion, reduced-motion support, and accessibility first.

## Visual motif enforcement (tally marks)
- Canonical mark: 4 pencil-like vertical strokes + a red diagonal slash for five.
- Use tally marks alongside key numbers (progress, totals, pace), grouped into fives.
- No emoji/confetti; success feedback is always an ink-stroke tally.

## Delivery workflow (repo rules)
- Each feature plan ships as its own PR.
- Repo setting: disable squash merges; allow rebase-only merges.
- PR reviews are recommended, but not required (no PR-only enforcement).

## Execution prompt (copy/paste)
You are a senior engineer shipping Tally. Your job: execute this plan end-to-end until completed, using the tech stack specified and integrating the Tally design philosophy (tactile, focused, honest; friendly, fast, calm; progressive disclosure; subtle motion with reduced-motion support; accessible and high-contrast; offline-first with clear sync states).
Use the plan sections and feature files in this folder to ensure full parity. Follow the phase order and each feature's "Implementation order" before moving on; update docs if scope changes.

Process rules:
- Deliver each feature as its own Git PR; disable squash merges and use rebase-only merges.
- Make small, incremental commits along the way (clear intent per commit).
- Wait for reviews; after approval, use pr-resolver to validate checks before merge.
- Testing must be behavioral: define scenario-based tests for each feature and ensure they pass.
- Keep a running completion checklist and mark each feature done only when acceptance criteria + behavioral tests pass.
- **CI** is a separate project and must be done last.

At the end of each feature, summarize what shipped, what remains, and any risks or blockers. Before moving on, review the session for anything worth codifying: update the repo Copilot instructions (and any relevant skills) and update any other platform plans impacted by the change. Continue until all completion criteria in this plan are met.

## Phases
1. Foundation: app shell, design system, auth, API client, local cache.
2. Core flows: challenges and entries.
3. Insights + data management.
4. Community.
5. Polish: performance, offline sync, accessibility.

## Phase detail (order)
1. Foundation: app shell, design system, auth, API client, local cache.
2. Core flows: challenges and entries, with optimistic UI.
3. Insights + data management: stats, weekly summary, export/import, clear-all.
4. Community: public challenges, follow, real aggregation UI.
5. Polish: offline sync clarity, accessibility, performance, store readiness.

## Testing focus (behavioral)
- End-to-end user journeys for sign-in, create challenge, log entry.
- Offline capture and sync recovery.
- Reduced-motion, large text, TalkBack behavior.
- Error states (expired auth, network failure).

## Completion criteria
- Parity with web feature map for core flows.
- Offline-first UX with clear sync state and retries.
- Accessibility (TalkBack, large text) and performance targets met.
- Behavioral tests documented and passing for each feature.

## Feature plans
- feature-theme-structure.md
- feature-auth.md
- feature-api-client.md
- feature-challenges.md
- feature-entries.md
- feature-stats.md
- feature-data-portability.md
- feature-community.md
- feature-store-upload.md

## Separate project: CI (last)
- CI for build/test, device smoke tests, and signing.
- Play Console release automation.
- Release gating and rollback procedures.

Key references:
- GitHub Actions quickstart: https://docs.github.com/actions/quickstart
- Workflow syntax: https://docs.github.com/actions/writing-workflows/workflow-syntax-for-github-actions
