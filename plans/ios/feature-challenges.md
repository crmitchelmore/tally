# Feature: Challenges (iOS)

## Goal
Create and manage challenges with a tactile, focused flow.

## Scope
- Challenge list, detail, and settings views.
- Create flow with timeframe (year | month | custom), color, icon, public toggle.
- Archive and delete actions with confirmation.

## UX notes
- Use SwiftUI sheets/forms and large tap targets.
- Keep numbers front and center.

## Acceptance criteria
- Challenge lifecycle matches web.
- Active filtering matches feature map.

## Design philosophy integration
- Tactile: immediate feedback with ink-like motion and haptics where available.
- Focused: primary action is obvious; progressive disclosure for details.
- Honest: real totals and pace; no gamified noise.
- Friendly/fast/calm: subtle motion, reduced-motion support, large tap targets.
- Offline-first: local writes with clear sync state and retry.

## Architecture notes (SPM)
- Implement as a Swift package (e.g. `TallyFeatureChallenges`) and keep the app target as composition glue.
- Shared types/live in shared packages (e.g. `TallyCore`); avoid feature-to-feature dependencies.

## Implementation order
1. Define screen states (loading, empty, error, offline).
2. Build native UI layout and navigation.
3. Wire API client and local persistence.
4. Add optimistic updates and sync indicators.
5. Accessibility and performance pass.

## Behavioral tests
- Primary flow works end-to-end (create, log, view, update).
- Offline actions queue and sync when online.
- Reduced-motion disables nonessential animation.
- Error and empty states explain next actions.
