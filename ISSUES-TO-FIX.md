# Issues Found During E2E Testing

## Critical Issues

### 1. Web build fails locally (debug-bridge-browser)
- **Location**: `tally-web/src/lib/debug-bridge.ts`
- **Problem**: `bun run build` fails because `debug-bridge-browser` isn't installed in this environment
- **Status**: Package is listed in devDependencies, but Bun install is missing or incomplete
- **Fix**: Run `bun install` (or remove the dependency if not needed)

### 2. Mobile API mismatch vs server routes
- **Android** (`TallyApiClient`):
  - Uses snake_case query params (`challenge_id`, `start_date`, `end_date`) but server expects camelCase.
  - Uses `/api/v1/stats/dashboard`, `/api/v1/stats/records`, `/api/v1/data/export`, `/api/v1/data/import` while server uses `/api/v1/stats` and `/api/v1/data`.

## Fixed Issues ✅

### 2. Create Challenge Dialog - Submit Button Cut Off
- **Fixed**: Reduced spacing (py-5→py-4, mb-1.5→mb-1, py-2.5→py-2)

### 3. Create Challenge Button Below Fold on Dashboard  
- **Fixed**: Made empty state more compact (py-16→py-8, smaller icon/text)

## Test Results Summary

### Passing ✅
- Landing page loads with hero, micro-demo, CTAs
- Micro-demo +1 button increments count with tally mark animation
- Clerk sign-in flow works (email → password → dashboard)
- Dashboard shows correct empty state
- Create Challenge dialog opens and is fully visible
- Challenge creation works (shows on dashboard with progress ring)
- Pace indicator shows ("Behind · 344 days left")
- "+ New Challenge" button appears in header after first challenge

### Blocked by In-Memory Store 🔶
Resolved: API store now uses Convex (`src/app/api/v1/_lib/store.ts`).

## Next Steps
1. Re-run E2E tests now that Convex persistence is in place
2. Fix `bun run build` by installing deps
3. Add Playwright tests for cucumber scenarios
