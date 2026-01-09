# PROJECT 6: Marketing Landing Page + App Relocation

## Goal

- Make `https://tally-tracker.app/` a marketing landing page
- Move the authenticated app to `https://tally-tracker.app/app`

## Decision

**Chosen strategy:** landing page on `/`, app on `/app`.

Rationale: no DNS changes, minimal risk, keeps canonical domain for marketing.

## Implementation Summary

- Marketing landing page: `tally-web/src/app/page.tsx`
- App moved to: `tally-web/src/app/app/page.tsx`
- Auth entry points:
  - `/sign-in` redirects to `/app`
  - `/sign-up` redirects to `/app`
- Public informational pages:
  - `/ios`
  - `/android`

## Infrastructure (Pulumi)

No changes required for the `/app` path strategy.

## Verification

### Local (required)

```bash
cd tally-web
bun run build
bun run lint
bun run test
```

### Manual (requires real Clerk credentials)

#### Creating a test user in Clerk

In the **Clerk Dashboard**:
1. Go to **Users → Create user**
2. Create a dedicated test account (email + password)
3. Use that account to sign in to the web app

**Important:** Do **not** store usernames/passwords in git or repo documentation.
- Keep test credentials in a password manager (recommended), or share them out-of-band.
- If you need automation/seeding, use the Clerk Backend API with environment secrets.

#### Smoke test

1. Visit `/` (landing)
2. Click **Open app** → should redirect to Clerk sign-in if unauthenticated
3. Sign in / sign up → should land on `/app`
4. Sign out → should return to `/`

## Project 6 Completion Checklist

- [x] Landing page is served at `/`
- [x] App is served at `/app`
- [x] Auth pages redirect to `/app` after sign-in/sign-up
- [x] Public iOS/Android pages exist and are linked from landing
- [ ] Production verification with real Clerk credentials complete
