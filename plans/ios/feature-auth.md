# Feature: Auth (iOS)

## Goal
Provide Clerk-based sign in/up and secure token handling.

## Scope
- Clerk iOS SDK for sign in/up.
- Store JWT securely (Keychain) and refresh as needed.
- Signed-out vs signed-in navigation.
- Call POST /api/v1/auth/user after auth.

## Acceptance criteria
- New users sign up and reach the dashboard.
- API requests include Bearer token.
- Signed-out state is clear and safe.

## Design philosophy integration
- Tactile: immediate feedback with ink-like motion and haptics where available.
- Focused: primary action is obvious; progressive disclosure for details.
- Honest: real totals and pace; no gamified noise.
- Friendly/fast/calm: subtle motion, reduced-motion support, large tap targets.
- Offline-first: local writes with clear sync state and retry.

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
