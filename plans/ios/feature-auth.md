# Feature: Auth (iOS)

## Goal
Provide Clerk-based sign in/up and secure token handling.

## Scope
- Clerk iOS SDK for sign in/up.
- Store JWT securely (Keychain) and refresh as needed.
- Signed-out vs signed-in navigation.
- Call POST /api/v1/auth/user after auth.

## Key references (canonical docs)
- Clerk iOS quickstart: https://clerk.com/docs/ios/getting-started/quickstart
- Clerk iOS SDK overview: https://clerk.com/docs/reference/ios/overview
- https://tally-tracker.app/api/clerk-proxy/.well-known/jwks.json JWKS url 
- JWKS public key: 
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv4IT+0UT+TnO6hcRcv45
hguOhvmAeo4QWxzWVcL7YtdqSrCHxBEeDBObziaoH1SFZBbegDe0A7Gddloa5Gpx
Rv94THTuRqz88I2DV14OzEXhvf0QvIpyDKBYRmAq0YQV7P2txr0d3T8iW1Lj7c1b
0oGp0k1tE+muYBy0lV2eztCUNy6WvmbHpH7hc1/Otg3vmuiZJgsKCn5bNp1tKguC
4TOKsWDV9RjMy7IMkWzDTDHbpBPB3OLpdiunkcwsBraceMWwKMTA9ylM4DPnyMBI
jVei3X6P25Q4RcijnbDxcsrtstZvgK4nbyC6QlG/xvDw0ipViGRAOSscZvFCTakn
YwIDAQAB
-----END PUBLIC KEY-----
- Use CLERK_SECRET_KEY to make any configuration changes to clerk.

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

## Architecture notes (SPM)
- Implement as a Swift package (e.g. `TallyFeatureAuth`) and keep the app target as composition glue.
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
