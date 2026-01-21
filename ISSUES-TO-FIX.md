# Issues Found During E2E Testing

## Critical Issues

### 1. Data Not Persisting (Expected - In-Memory Store)
- **Location**: `src/app/api/v1/_lib/store.ts`
- **Problem**: API uses in-memory Maps that reset on each serverless function invocation
- **Status**: Expected - comment says "will be replaced with Convex later"
- **Fix**: Implement Convex database integration

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
- Challenge persistence after page reload
- Entry logging and tracking
- Progress updates over time
- Community features (public challenges)

## Next Steps
1. Implement Convex database integration
2. Re-run E2E tests after persistence is working
3. Add Playwright tests for cucumber scenarios
