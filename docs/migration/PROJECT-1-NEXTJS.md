# PROJECT 1: Next.js + Vercel Migration

## Overview
**Goal**: Migrate the Tally web application from Vite + GitHub Spark to Next.js 14 with App Router, deployed on Vercel with Convex as the database and Clerk for authentication.

**Duration**: 2-3 weeks  
**Priority**: HIGHEST - This is the foundation for all other projects

---

## TODO List

> ⚠️ **IMPORTANT**: Do not check off any item until it has been **tested and verified working**. Run the verification steps for each task before marking complete.

### Task 1.1: Project Initialization
- [ ] Create Next.js 14 project with App Router
  - [ ] Run `npx create-next-app@latest tally-web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
  - [ ] Verify: `npm run dev` shows Next.js welcome page
- [ ] Install core dependencies
  - [ ] Run npm install for all required packages (see detailed steps below)
  - [ ] Verify: `npm ls` shows all packages installed
- [ ] Configure Tailwind CSS v4
  - [ ] Copy tailwind.config.js from current project
  - [ ] Copy CSS variables from src/index.css and src/main.css
  - [ ] Verify: Tailwind classes work in test component
- [ ] Configure path aliases
  - [ ] Update tsconfig.json with `@/*` paths
  - [ ] Verify: Imports like `@/components` resolve correctly
- [ ] **VERIFICATION**: All 4 commands pass
  - [ ] `npm run dev` - starts without errors
  - [ ] `npm run build` - builds successfully
  - [ ] `npx tsc --noEmit` - no TypeScript errors
  - [ ] `npm run lint` - no ESLint errors

### Task 1.2: shadcn/ui Component Setup
- [ ] Initialize shadcn/ui
  - [ ] Run `npx shadcn@latest init`
  - [ ] Select: new-york style, neutral base color, CSS variables yes
  - [ ] Verify: components.json created
- [ ] Install all 45 UI components
  - [ ] Run batch install command (see detailed steps)
  - [ ] Verify: `ls -1 src/components/ui/*.tsx | wc -l` returns 45
- [ ] Copy custom theme configuration
  - [ ] Copy theme.json from current project
  - [ ] Update globals.css with tally-specific styles
  - [ ] Verify: Theme colors match original (charcoal, off-white)
- [ ] Create test page for components
  - [ ] Create src/app/test-components/page.tsx
  - [ ] Test Button, Card, Badge render correctly
  - [ ] Verify: Visit /test-components shows styled components
- [ ] **VERIFICATION**: Component system working
  - [ ] 45 component files exist
  - [ ] Test page renders without errors
  - [ ] Build still passes

### Task 1.3: Convex Database Setup
- [ ] Install and initialize Convex
  - [ ] Run `npm install convex`
  - [ ] Run `npx convex dev`
  - [ ] Verify: Convex dashboard accessible, convex/ directory created
- [ ] Create database schema
  - [ ] Create convex/schema.ts with all 4 tables
  - [ ] Verify: Schema deploys without errors
- [ ] Create users functions
  - [ ] Create convex/users.ts with getOrCreate, getByClerkId
  - [ ] Verify: Functions appear in Convex dashboard
- [ ] Create challenges functions
  - [ ] Create convex/challenges.ts with list, listActive, listPublic, get, create, update, archive
  - [ ] Verify: Functions work in dashboard playground
- [ ] Create entries functions
  - [ ] Create convex/entries.ts with listByChallenge, listByUser, listByUserDate, create, update, remove
  - [ ] Verify: Functions work in dashboard playground
- [ ] Create followedChallenges functions
  - [ ] Create convex/followedChallenges.ts with listByUser, follow, unfollow
  - [ ] Verify: Functions work in dashboard playground
- [ ] Configure Convex provider
  - [ ] Create src/providers/convex-provider.tsx
  - [ ] Update src/app/layout.tsx to wrap with provider
  - [ ] Verify: No errors on app load
- [ ] **VERIFICATION**: Database fully operational
  - [ ] 4 tables visible in Convex dashboard
  - [ ] All 12+ functions deployed
  - [ ] convex/_generated/ contains type definitions
  - [ ] `npx convex dev` runs without errors

### Task 1.4: Authentication with Clerk
- [ ] Install Clerk
  - [ ] Run `npm install @clerk/nextjs`
  - [ ] Verify: Package in node_modules
- [ ] Configure Clerk environment
  - [ ] Create .env.local with Clerk keys
  - [ ] Set up Clerk dashboard with GitHub OAuth
  - [ ] Verify: Environment variables load
- [ ] Set up Clerk provider
  - [ ] Update src/app/layout.tsx with ClerkProvider
  - [ ] Verify: No provider errors
- [ ] Create auth middleware
  - [ ] Create src/middleware.ts with route protection
  - [ ] Verify: Unauthenticated users redirected to sign-in
- [ ] Create sign-in page
  - [ ] Create src/app/sign-in/[[...sign-in]]/page.tsx
  - [ ] Verify: Page renders Clerk SignIn component
- [ ] Create sign-up page
  - [ ] Create src/app/sign-up/[[...sign-up]]/page.tsx
  - [ ] Verify: Page renders Clerk SignUp component
- [ ] Integrate Clerk with Convex
  - [ ] Create convex/auth.config.ts
  - [ ] Verify: JWT validation configured
- [ ] Create user sync hook
  - [ ] Create src/hooks/use-store-user.ts
  - [ ] Verify: User synced to Convex on login
- [ ] **VERIFICATION**: Auth fully working
  - [ ] Sign-in page renders
  - [ ] GitHub OAuth flow completes
  - [ ] User record created in Convex users table
  - [ ] Protected routes redirect unauthenticated users
  - [ ] Session persists across page refreshes

### Task 1.5: Component Migration
- [ ] Copy utility functions
  - [ ] Copy lib/utils.ts, lib/stats.ts, lib/constants.ts
  - [ ] Copy lib/exportImport.ts, lib/weeklySummary.ts
  - [ ] Update imports for Convex types
  - [ ] Verify: No import errors
- [ ] Update types for Convex
  - [ ] Update src/types/index.ts with Convex Id types
  - [ ] Verify: Types compile without errors
- [ ] Migrate visualization components
  - [ ] Migrate HeatmapCalendar.tsx (add "use client")
  - [ ] Migrate CircularProgress.tsx
  - [ ] Migrate TallyMarks.tsx
  - [ ] Verify: Each component renders in isolation
- [ ] Migrate dashboard components
  - [ ] Migrate ChallengeCard.tsx with Convex hooks
  - [ ] Migrate OverallStats.tsx
  - [ ] Migrate PersonalRecords.tsx
  - [ ] Verify: Dashboard shows data from Convex
- [ ] Migrate challenge components
  - [ ] Migrate ChallengeDetailView.tsx
  - [ ] Migrate CreateChallengeDialog.tsx
  - [ ] Migrate ChallengeSettingsDialog.tsx
  - [ ] Verify: Challenge CRUD operations work
- [ ] Migrate entry components
  - [ ] Migrate AddEntrySheet.tsx
  - [ ] Migrate AddEntryDetailSheet.tsx
  - [ ] Migrate EditEntryDialog.tsx
  - [ ] Migrate DayEntriesDialog.tsx
  - [ ] Verify: Entry CRUD operations work
- [ ] Migrate social components
  - [ ] Migrate LeaderboardView.tsx
  - [ ] Migrate PublicChallengesView.tsx
  - [ ] Migrate FollowedChallengeCard.tsx
  - [ ] Verify: Social features load data
- [ ] Migrate auth components
  - [ ] Migrate UserProfile.tsx (use Clerk's useUser)
  - [ ] Verify: Profile shows user info
- [ ] Migrate dialog components
  - [ ] Migrate ExportImportDialog.tsx
  - [ ] Migrate WeeklySummaryDialog.tsx
  - [ ] Verify: Dialogs open and function
- [ ] Create main dashboard page
  - [ ] Update src/app/page.tsx with full dashboard
  - [ ] Verify: Dashboard renders with all sections
- [ ] **VERIFICATION**: All components working
  - [ ] All 22 components exist in src/components/
  - [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
  - [ ] Build succeeds (`npm run build`)
  - [ ] Manual test: Dashboard loads with challenges
  - [ ] Manual test: Can create new challenge
  - [ ] Manual test: Can add entry to challenge
  - [ ] Manual test: Heatmap calendar renders
  - [ ] Manual test: Progress ring animates
  - [ ] Manual test: Can view challenge details
  - [ ] Manual test: Can edit/delete entries
  - [ ] Manual test: Weekly summary dialog works
  - [ ] Manual test: Export/import works
  - [ ] Manual test: Leaderboard loads
  - [ ] Manual test: Community page shows public challenges

### Task 1.6: Real-time Features
- [ ] Enable optimistic updates for entries
  - [ ] Add withOptimisticUpdate to entry mutations
  - [ ] Verify: Entry appears immediately before server confirms
- [ ] Verify real-time leaderboard
  - [ ] Confirm useQuery subscriptions auto-update
  - [ ] Verify: Changes in one tab appear in another
- [ ] Add loading states
  - [ ] Add Skeleton components for loading
  - [ ] Verify: No flash of undefined content
- [ ] **VERIFICATION**: Real-time working
  - [ ] Open app in 2 browser windows
  - [ ] Add entry in window 1
  - [ ] Entry appears in window 2 within 1 second
  - [ ] Optimistic update shows before server confirmation

### Task 1.7: Deployment to Vercel
- [ ] Deploy Convex to production
  - [ ] Run `npx convex deploy --prod`
  - [ ] Note production URL
  - [ ] Verify: Production deployment successful
- [ ] Configure Vercel project
  - [ ] Push code to GitHub
  - [ ] Connect repo to Vercel
  - [ ] Verify: Vercel detects Next.js
- [ ] Set environment variables in Vercel
  - [ ] Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (production)
  - [ ] Add CLERK_SECRET_KEY (production)
  - [ ] Add NEXT_PUBLIC_CONVEX_URL (production)
  - [ ] Verify: All variables set
- [ ] Configure Clerk for production
  - [ ] Create production instance in Clerk
  - [ ] Add production domain to allowed origins
  - [ ] Configure GitHub OAuth for production
  - [ ] Verify: OAuth callback URLs correct
- [ ] Deploy and test
  - [ ] Trigger Vercel deployment
  - [ ] Wait for build to complete
  - [ ] Verify: Production URL accessible
- [ ] **VERIFICATION**: Production deployment working
  - [ ] Visit production URL
  - [ ] Sign in with GitHub
  - [ ] Create a challenge
  - [ ] Add entries
  - [ ] View leaderboard
  - [ ] Test in incognito window
  - [ ] Check Vercel logs for errors
  - [ ] Verify LCP < 2.5s (use Lighthouse)

---

## Project 1 Completion Checklist

**Do not check these until ALL sub-tasks above are complete and verified:**

- [ ] Next.js app deployed to Vercel production URL
- [ ] Convex database operational with all 4 tables
- [ ] Clerk authentication working (GitHub + email)
- [ ] All 22 custom components migrated and functional
- [ ] All 45 shadcn/ui components installed
- [ ] Real-time sync working (< 1 second)
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors
- [ ] Build succeeds
- [ ] All manual test cases pass
- [ ] Performance acceptable (LCP < 2.5s)

---

## Detailed Implementation Steps

### Step 1.1.2: Install Core Dependencies

```bash
npm install framer-motion recharts date-fns canvas-confetti lucide-react
npm install class-variance-authority clsx tailwind-merge
npm install @tanstack/react-query zod react-hook-form @hookform/resolvers
npm install sonner vaul cmdk embla-carousel-react
npm install uuid
npm install -D @types/canvas-confetti @types/uuid
```

### Step 1.2.2: Install All shadcn Components

```bash
npx shadcn@latest add accordion alert alert-dialog aspect-ratio avatar badge breadcrumb button calendar card carousel chart checkbox collapsible command context-menu dialog drawer dropdown-menu form hover-card input input-otp label menubar navigation-menu pagination popover progress radio-group resizable scroll-area select separator sheet sidebar skeleton slider sonner switch table tabs textarea toggle toggle-group tooltip
```

### Step 1.3.2: Convex Schema

Create `convex/schema.ts`:
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  challenges: defineTable({
    userId: v.id("users"),
    name: v.string(),
    targetNumber: v.number(),
    year: v.number(),
    color: v.string(),
    icon: v.string(),
    timeframeUnit: v.union(
      v.literal("year"),
      v.literal("month"),
      v.literal("custom")
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isPublic: v.boolean(),
    archived: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_public", ["isPublic"])
    .index("by_user_archived", ["userId", "archived"]),

  entries: defineTable({
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    date: v.string(),
    count: v.number(),
    note: v.optional(v.string()),
    sets: v.optional(v.array(v.object({ reps: v.number() }))),
    feeling: v.optional(
      v.union(
        v.literal("very-easy"),
        v.literal("easy"),
        v.literal("moderate"),
        v.literal("hard"),
        v.literal("very-hard")
      )
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_challenge", ["challengeId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_challenge_date", ["challengeId", "date"]),

  followedChallenges: defineTable({
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    followedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_challenge", ["challengeId"]),
});
```

### Step 1.3.3: Convex Users Functions

Create `convex/users.ts`:
```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreate = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    
    if (existing) {
      return existing._id;
    }
    
    return await ctx.db.insert("users", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});
```

### Step 1.3.4: Convex Challenges Functions

Create `convex/challenges.ts`:
```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const listActive = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const today = new Date().toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();
    
    return challenges.filter((c) => {
      if (c.archived) return false;
      if (c.endDate) return c.endDate >= today;
      return c.year >= currentYear;
    });
  },
});

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .filter((q) => q.eq(q.field("archived"), false))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("challenges") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    targetNumber: v.number(),
    year: v.number(),
    color: v.string(),
    icon: v.string(),
    timeframeUnit: v.union(
      v.literal("year"),
      v.literal("month"),
      v.literal("custom")
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("challenges", {
      ...args,
      archived: false,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("challenges"),
    name: v.optional(v.string()),
    targetNumber: v.optional(v.number()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

export const archive = mutation({
  args: { id: v.id("challenges") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { archived: true });
  },
});
```

### Step 1.3.5: Convex Entries Functions

Create `convex/entries.ts`:
```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByChallenge = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("entries")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();
  },
});

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("entries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const listByUserDate = query({
  args: { userId: v.id("users"), date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("entries")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    date: v.string(),
    count: v.number(),
    note: v.optional(v.string()),
    sets: v.optional(v.array(v.object({ reps: v.number() }))),
    feeling: v.optional(
      v.union(
        v.literal("very-easy"),
        v.literal("easy"),
        v.literal("moderate"),
        v.literal("hard"),
        v.literal("very-hard")
      )
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("entries", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("entries"),
    count: v.optional(v.number()),
    note: v.optional(v.string()),
    date: v.optional(v.string()),
    feeling: v.optional(
      v.union(
        v.literal("very-easy"),
        v.literal("easy"),
        v.literal("moderate"),
        v.literal("hard"),
        v.literal("very-hard")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

export const remove = mutation({
  args: { id: v.id("entries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
```

### Step 1.4.4: Auth Middleware

Create `src/middleware.ts`:
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### Step 1.4.7: User Sync Hook

Create `src/hooks/use-store-user.ts`:
```typescript
"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export function useStoreUser() {
  const { user, isLoaded } = useUser();
  const storeUser = useMutation(api.users.getOrCreate);

  useEffect(() => {
    if (!isLoaded || !user) return;

    storeUser({
      clerkId: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName ?? undefined,
      avatarUrl: user.imageUrl,
    });
  }, [isLoaded, user, storeUser]);
}
```

---

## Troubleshooting

### Common Issues

**Convex schema deployment fails**
- Check for typos in schema.ts
- Ensure all types are valid Convex values
- Run `npx convex dev` with `--verbose` flag

**Clerk auth not working**
- Verify environment variables are set correctly
- Check Clerk dashboard for OAuth configuration
- Ensure redirect URLs match your domain

**TypeScript errors after migration**
- Update imports to use Convex ID types
- Add "use client" directive to client components
- Check for missing dependencies

**Build fails on Vercel**
- Ensure all environment variables are set in Vercel
- Check that Convex URL points to production
- Review build logs for specific errors
