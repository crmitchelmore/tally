# iOS Implementation Plan (High Level)

## Stack
- Swift + SwiftUI
- Swift Package Manager (SPM) for a highly modular architecture:
  - Shared packages (e.g. `TallyCore` for API + models)
  - One package per feature (Entries, Challenges, Stats, etc.)
- Tuist for **generated Xcode projects/workspaces** (define projects in code via `Project.swift`/`Workspace.swift`, don’t hand-edit `.xcodeproj`)
- Clerk auth for iOS and JWT for API calls
- Local persistence for offline-first behavior

## Tooling (install now)
- Install Tuist:
  - Homebrew: `brew tap tuist/tuist && brew install tuist`
  - Or (recommended for pinned versions): `mise x tuist@latest -- tuist init`
- Typical workflow:
  - `tuist init` (once) to bootstrap
  - `tuist generate` to generate the workspace

## Secrets
- `.env` contains all secrets required for this plan.

## Product ethos
- Tactile, focused, honest; friendly, fast, and calm.
- Subtle motion, reduced-motion support, and accessibility first.

## Delivery workflow (repo rules)
- Each feature plan ships as its own PR.
- Repo setting: disable squash merges; allow rebase-only merges.
- Require review approval; after approval use pr-resolver to validate checks before merge.

## Execution prompt (copy/paste)
You are a senior engineer shipping Tally. Your job: execute this plan end-to-end until completed, using the tech stack specified and integrating the Tally design philosophy (tactile, focused, honest; friendly, fast, calm; progressive disclosure; subtle motion with reduced-motion support; accessible and high-contrast; offline-first with clear sync states).
Use the plan sections and feature files in this folder plus /feature-map.md to ensure full parity. Follow the phase order and each feature's "Implementation order" before moving on; update docs if scope changes.

Process rules:
- Deliver each feature as its own Git PR; disable squash merges and use rebase-only merges.
- Make small, incremental commits along the way (clear intent per commit).
- Wait for reviews; after approval, use pr-resolver to validate checks before merge.
- Testing must be behavioral: define scenario-based tests for each feature and ensure they pass.
- Keep a running completion checklist and mark each feature done only when acceptance criteria + behavioral tests pass.
- Automation/pipelines are a separate project and must be done last.

At the end of each feature, summarize what shipped, what remains, and any risks or blockers. Continue until all completion criteria in this plan are met.

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

## Build references
- /Applications/Xcode.app/Contents/PlugIns/IDEIntelligenceChat.framework/Versions/A/Resources/AdditionalDocumentation/Swift-Charts-3D-Visualization.md
- /Applications/Xcode.app/Contents/PlugIns/IDEIntelligenceChat.framework/Versions/A/Resources/AdditionalDocumentation/Swift-Concurrency-Updates.md
- /Applications/Xcode.app/Contents/PlugIns/IDEIntelligenceChat.framework/Versions/A/Resources/AdditionalDocumentation/Swift-InlineArray-Span.md
- /Applications/Xcode.app/Contents/PlugIns/IDEIntelligenceChat.framework/Versions/A/Resources/AdditionalDocumentation/SwiftUI-Implementing-Liquid-Glass-Design.md
- /Applications/Xcode.app/Contents/PlugIns/IDEIntelligenceChat.framework/Versions/A/Resources/AdditionalDocumentation/SwiftUI-New-Toolbar-Features.md
- /Applications/Xcode.app/Contents/PlugIns/IDEIntelligenceChat.framework/Versions/A/Resources/AdditionalDocumentation/SwiftUI-Styled-Text-Editing.md
- /Applications/Xcode.app/Contents/PlugIns/IDEIntelligenceChat.framework/Versions/A/Resources/AdditionalDocumentation/SwiftUI-WebKit-Integration.md

## Feature plans
- feature-auth.md
- feature-api-client.md
- feature-challenges.md
- feature-entries.md
- feature-stats.md
- feature-data-portability.md
- feature-community.md
- feature-leaderboard.md
- feature-store-upload.md

## Separate project: Automation + pipelines (last)
- CI for build/test, device smoke tests, and signing.
- TestFlight and App Store release automation.
- Release gating and rollback procedures.
- App Store deploy management reference: /Users/cm/work/mobile-platform-app-store-connect
