# Feature: Auth + user provisioning (web)

## Goal
Make sign up/in seamless and ensure backend user records exist.

## Scope
- Clerk hosted SignIn/SignUp routes.
- Signed-out /app prompt with CTA.
- Clerk proxy route (/__clerk/*) to keep auth on domain.
- POST /api/v1/auth/user for user creation/sync.

## Key references (canonical docs)
- Clerk Next.js quickstart: https://clerk.com/docs/quickstarts/nextjs
- `clerkMiddleware`: https://clerk.com/docs/references/nextjs/clerk-middleware
- Server auth helpers (`auth()`): https://clerk.com/docs/references/nextjs/auth
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
- Redirect url: https://tally-tracker.app/api/clerk-proxy/v1/oauth_callback

## Key implementation notes
- Store clerkId on users.
- Enforce per-user access via Convex auth helpers.
- Redirect back to /app on success.

## Acceptance criteria
- New users can sign up and land in /app with a user record.
- Signed-out users see a clear CTA and cannot access private data.
- API calls with JWT map to the correct userId.

## Design philosophy integration
- Tactile: immediate feedback on actions (optimistic UI, crisp motion).
- Focused: primary action is prominent; progressive disclosure for secondary details.
- Honest: real counts and pace; no gamified noise.
- Friendly/fast/calm: subtle motion, reduced-motion support, readable contrast.
- Offline-first: clear sync state for queued writes and retries.

## Implementation order
1. Define states (loading, empty, error, offline, permission).
2. Build UI layout with design system components.
3. Wire Convex queries/mutations and validation.
4. Add optimistic updates and sync indicators.
5. Accessibility and performance pass.

## Behavioral tests
- Happy path from action to data persistence.
- Offline/slow network queues work and later sync.
- Reduced-motion disables nonessential animation.
- Error and empty states provide clear next actions.
