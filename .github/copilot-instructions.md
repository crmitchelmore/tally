# Copilot Instructions (Tally)

**NEVER STOP TO ASK QUESTIONS** — make the best decision without compromising security or our design philosophy.

Use this philosophy in all product work:
- Tactile: interactions feel like marking paper; clear visual feedback.
- Focused: minimal UI; numbers and progress are central.
- Honest: no gimmicks; show real progress and pace.

Principles to uphold:
- Friendly, playful, fast, and calm.
- Progressive disclosure; reduce cognitive load.
- Subtle motion with reduced-motion support.
- Accessible, high-contrast, readable type and large tap targets.
- Offline-first mindset with clear sync states.

Reference ./design-philosophy.md whenever building anything new to remember the way we do it.

Reference ./tech-stack-requirements.md to pick the right tools and technologies.

## Convex Deployment

Convex functions are deployed **separately** from Vercel. After changing:
- `convex/schema.ts` (data model)
- `convex/*.ts` (mutations/queries)

Run: `npx convex deploy` to sync changes to production.

**CI does NOT auto-deploy Convex** - this is a manual step after schema/mutation changes.

### Convex Workflow

When modifying Convex schema or mutations:
1. Update `convex/schema.ts` with new fields
2. Update `convex/*.ts` mutations to accept/return new fields
3. Update `src/app/api/v1/_lib/convex-server.ts` TypeScript types
4. Update API routes to pass new fields through
5. **Deploy Convex:** `npx convex deploy`
6. Deploy Vercel (automatic via CI or manual)

Common pitfall: Vercel deploys but Convex is stale → 500 errors on new fields.

### Debugging Convex 500 errors
1. Check if schema changes were deployed: `npx convex deploy`
2. Verify mutation args match schema fields
3. Check Convex dashboard logs at https://dashboard.convex.dev

## Available .env secrets

CLERK_SECRET_KEY
CLOUDFLARE_API_TOKEN
CONVEX_DEPLOYMENT
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
IOS_BUNDLE_ID
ANDROID_PACKAGE_NAME
APP_STORE_CONNECT_ISSUER_ID
APP_STORE_CONNECT_KEY_ID
APP_STORE_CONNECT_PRIVATE_KEY_PATH
IOS_PROVISIONING_PROFILE_PATH
IOS_SIGNING_CERT_P12_PATH
NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID
NEXT_PUBLIC_POSTHOG_HOST
NEXT_PUBLIC_POSTHOG_KEY
POSTHOG_ADMIN_TOKEN
TEST_USER_EMAIL
TEST_USER_PASSWORD
VERCEL_API_TOKEN
IOS_SIGNING_CERT_PASSWORD
IOS_KEYCHAIN_PASSWORD
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
ANDROID_KEYSTORE_BASE64
IOS_TEAM_ID
VERCEL_PROJECT_ID
VERCEL_ORG_ID
VERCEL_PROD_URL
HONEYCOMB_API_KEY

