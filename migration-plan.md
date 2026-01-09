# Tally App Migration Plan

## Overview

This document outlines the comprehensive plan to migrate the Tally progress tracker from its current Vite + React + GitHub Spark architecture to:

1. **Next.js (Vercel)** - Web application with server-side rendering
2. **shadcn/ui** - Component library (already partially in use)
3. **Convex** - Real-time database backend
4. **Native iOS App** - Swift/SwiftUI
5. **Native Android App** - Kotlin/Jetpack Compose

---

## 📁 Project Documentation

Detailed project guides with TODO lists are in the `docs/migration/` folder:

| Document | Description |
|----------|-------------|
| [docs/migration/README.md](docs/migration/README.md) | **Master TODO List** and Agent Review Checklist |
| [docs/migration/PROJECT-1-NEXTJS.md](docs/migration/PROJECT-1-NEXTJS.md) | Next.js + Vercel + Convex + Clerk (2-3 weeks) |
| [docs/migration/PROJECT-2-API.md](docs/migration/PROJECT-2-API.md) | Shared HTTP API Layer (3-4 days) |
| [docs/migration/PROJECT-3-IOS.md](docs/migration/PROJECT-3-IOS.md) | Native iOS App (3-4 weeks) |
| [docs/migration/PROJECT-4-ANDROID.md](docs/migration/PROJECT-4-ANDROID.md) | Native Android App (3-4 weeks) |
| [docs/migration/PROJECT-5-LAUNCH.md](docs/migration/PROJECT-5-LAUNCH.md) | Cross-Platform Polish & Launch (1-2 weeks) |

**Total Duration: 10-14 weeks**

---

## ⚠️ CRITICAL INSTRUCTIONS

### Continue Until Complete
Each project must be executed to **100% completion** before moving to the next. Do not stop at partial implementation. Every task, subtask, and verification step must pass before the project is considered done.

### TODO List Rules
1. **Never check off an item until it's been tested and verified working**
2. Larger items have sub-item TODO lists - complete ALL sub-items first
3. Only remove a parent item when ALL children are complete and verified
4. Run agent reviews before marking projects complete
5. If issues arise, debug and fix them immediately - do not proceed with unresolved failures

### Agent Reviews Required
Before final launch, run these specialist agents and address ALL their findings:
- broad-researcher, deep-researcher, think-tank-idea-generator
- software-architect, senior-software-engineer, security-engineer
- performance-engineer, testing-engineer, tech-standards
- product-designer, ux-expert, technical-documenter

See [docs/migration/PROJECT-5-LAUNCH.md](docs/migration/PROJECT-5-LAUNCH.md) for full agent review checklist.

---

## 📝 Git Commit Guidelines

**COMMIT SENSIBLY AS YOU GO** - Make frequent, atomic commits with detailed messages for history tracking.

### Format
```
<type>(<scope>): <subject>

<body with details>
```

### Types
- `feat`: New feature
- `fix`: Bug fix  
- `refactor`: Code restructuring
- `docs`: Documentation
- `test`: Tests
- `chore`: Build/tooling

### Examples
```bash
git commit -m "feat(convex): add challenges schema with indexes

- Define challenges table with all fields
- Add indexes for by_user, by_public queries
- Include timeframeUnit union type"

git commit -m "feat(ios): implement CircularProgressView component

- Draw background and progress arcs with Canvas
- Add spring animation for smooth transitions
- Support customizable color and line width"
```

### When to Commit
- ✅ After each subtask completes
- ✅ After verification steps pass
- ✅ Before/after risky changes
- ✅ At natural stopping points

See [docs/migration/README.md](docs/migration/README.md) for full commit guidelines.

---

# PROJECT 1: NEXT.JS + VERCEL WEB MIGRATION

## Project Overview
**Goal**: Migrate the entire Tally web application from Vite + GitHub Spark to Next.js 14 with App Router, deployed on Vercel with Convex as the database.

**Duration**: 2-3 weeks  
**Priority**: HIGH - This is the foundation for all other projects

---

## Task 1.1: Project Initialization

### Objective
Create a new Next.js 14 project with all necessary configurations matching the current app's requirements.

### Detailed Steps

#### Step 1.1.1: Create Next.js Project
```bash
npx create-next-app@latest tally-web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd tally-web
```

#### Step 1.1.2: Install Core Dependencies
```bash
npm install framer-motion recharts date-fns canvas-confetti lucide-react
npm install class-variance-authority clsx tailwind-merge
npm install @tanstack/react-query zod react-hook-form @hookform/resolvers
npm install sonner vaul cmdk embla-carousel-react
npm install uuid
npm install -D @types/canvas-confetti @types/uuid
```

#### Step 1.1.3: Configure Tailwind CSS v4
- Copy `tailwind.config.js` from current project
- Copy CSS variables from `src/index.css` and `src/main.css`
- Update `globals.css` with tally-specific styles

#### Step 1.1.4: Configure Path Aliases
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Expected Results
- [ ] Next.js project runs with `npm run dev`
- [ ] TypeScript compiles without errors
- [ ] Tailwind styles are applied correctly
- [ ] Path aliases resolve correctly (`@/components`, `@/lib`, etc.)

### Verification Steps
```bash
# 1. Start dev server - should show Next.js welcome page
npm run dev

# 2. Build succeeds without errors
npm run build

# 3. Type checking passes
npx tsc --noEmit

# 4. Linting passes
npm run lint
```

### Definition of Done
✅ All 4 verification commands pass without errors  
✅ Browser shows Next.js app at http://localhost:3000  
✅ No TypeScript or ESLint errors

**⚠️ DO NOT PROCEED TO TASK 1.2 UNTIL ALL VERIFICATION STEPS PASS**

---

## Task 1.2: shadcn/ui Component Setup

### Objective
Initialize and install all 45 UI components used in the current application.

### Detailed Steps

#### Step 1.2.1: Initialize shadcn/ui
```bash
npx shadcn@latest init
```
Select options:
- Style: new-york
- Base color: neutral
- CSS variables: yes

#### Step 1.2.2: Install All Components
```bash
npx shadcn@latest add accordion alert alert-dialog aspect-ratio avatar badge breadcrumb button calendar card carousel chart checkbox collapsible command context-menu dialog drawer dropdown-menu form hover-card input input-otp label menubar navigation-menu pagination popover progress radio-group resizable scroll-area select separator sheet sidebar skeleton slider sonner switch table tabs textarea toggle toggle-group tooltip
```

#### Step 1.2.3: Verify Component Installation
Create test file `src/app/test-components/page.tsx`:
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function TestPage() {
  return (
    <div className="p-8 space-y-4">
      <Button>Test Button</Button>
      <Card>
        <CardHeader><CardTitle>Test Card</CardTitle></CardHeader>
        <CardContent>Content</CardContent>
      </Card>
      <Badge>Test Badge</Badge>
    </div>
  )
}
```

#### Step 1.2.4: Copy Custom Theme
- Copy `theme.json` from current project
- Update `components.json` to match current configuration
- Copy custom CSS variables to `globals.css`

### Expected Results
- [ ] All 45 shadcn components installed in `src/components/ui/`
- [ ] Components render correctly with theme
- [ ] No missing dependency errors

### Verification Steps
```bash
# 1. Count installed components (should be 45)
ls -1 src/components/ui/*.tsx | wc -l

# 2. Build succeeds
npm run build

# 3. Test page renders components
# Visit http://localhost:3000/test-components
npm run dev
```

### Definition of Done
✅ 45 component files exist in `src/components/ui/`  
✅ Test page renders all components without errors  
✅ Theme colors match original design (charcoal, off-white, etc.)

**⚠️ DO NOT PROCEED TO TASK 1.3 UNTIL ALL VERIFICATION STEPS PASS**

---

## Task 1.3: Convex Database Setup

### Objective
Set up Convex as the real-time database backend with complete schema and CRUD operations.

### Detailed Steps

#### Step 1.3.1: Install and Initialize Convex
```bash
npm install convex
npx convex dev
```
This will:
- Create a Convex account (if needed)
- Create `convex/` directory
- Generate initial files

#### Step 1.3.2: Create Database Schema
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

#### Step 1.3.3: Create Convex Functions

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

Create `convex/followedChallenges.ts`:
```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const follow = mutation({
  args: {
    userId: v.id("users"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("challengeId"), args.challengeId))
      .unique();
    
    if (existing) return existing._id;
    
    return await ctx.db.insert("followedChallenges", {
      ...args,
      followedAt: Date.now(),
    });
  },
});

export const unfollow = mutation({
  args: {
    userId: v.id("users"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("challengeId"), args.challengeId))
      .unique();
    
    if (record) {
      await ctx.db.delete(record._id);
    }
  },
});
```

#### Step 1.3.4: Configure Convex Provider
Create `src/providers/convex-provider.tsx`:
```tsx
"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

Update `src/app/layout.tsx`:
```tsx
import { ConvexClientProvider } from "@/providers/convex-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
```

### Expected Results
- [ ] Convex dashboard shows all 4 tables (users, challenges, entries, followedChallenges)
- [ ] All indexes created successfully
- [ ] All Convex functions deployed
- [ ] No TypeScript errors in convex/ directory

### Verification Steps
```bash
# 1. Convex dev server running
npx convex dev

# 2. Schema deployed - check Convex dashboard for tables
# Visit https://dashboard.convex.dev

# 3. Functions deployed - test in dashboard
# Try running a query like challenges.listPublic

# 4. TypeScript generation successful
ls convex/_generated/
# Should contain: api.d.ts, api.js, dataModel.d.ts, server.d.ts, server.js
```

### Definition of Done
✅ 4 tables visible in Convex dashboard  
✅ All Convex functions (12+) deployed and accessible  
✅ `convex/_generated/` directory contains type definitions  
✅ No errors in `npx convex dev` output

**⚠️ DO NOT PROCEED TO TASK 1.4 UNTIL ALL VERIFICATION STEPS PASS**

---

## Task 1.4: Authentication with Clerk

### Objective
Set up Clerk authentication with GitHub OAuth and email/password, integrated with Convex.

### Detailed Steps

#### Step 1.4.1: Install Clerk
```bash
npm install @clerk/nextjs
```

#### Step 1.4.2: Configure Clerk
Create `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

#### Step 1.4.3: Set Up Clerk Provider
Update `src/app/layout.tsx`:
```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/providers/convex-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

#### Step 1.4.4: Create Auth Middleware
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

#### Step 1.4.5: Create Sign-In Page
Create `src/app/sign-in/[[...sign-in]]/page.tsx`:
```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignIn />
    </div>
  );
}
```

#### Step 1.4.6: Create Sign-Up Page
Create `src/app/sign-up/[[...sign-up]]/page.tsx`:
```tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignUp />
    </div>
  );
}
```

#### Step 1.4.7: Integrate Clerk with Convex
Install Clerk-Convex integration:
```bash
npm install @clerk/clerk-react
```

Update `convex/auth.config.ts`:
```typescript
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

#### Step 1.4.8: Create User Sync Hook
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

### Expected Results
- [ ] Clerk sign-in/sign-up pages render
- [ ] GitHub OAuth works
- [ ] Email/password authentication works
- [ ] Protected routes redirect to sign-in
- [ ] User synced to Convex on first login

### Verification Steps
```bash
# 1. Start dev server
npm run dev

# 2. Visit sign-in page
# http://localhost:3000/sign-in should show Clerk UI

# 3. Sign in with GitHub
# Should redirect to dashboard after auth

# 4. Check Convex dashboard
# User should appear in users table

# 5. Visit protected route without auth
# http://localhost:3000 should redirect to sign-in
```

### Definition of Done
✅ Sign-in page renders Clerk component  
✅ GitHub OAuth flow completes successfully  
✅ User record created in Convex users table  
✅ Protected routes redirect unauthenticated users  
✅ Session persists across page refreshes

**⚠️ DO NOT PROCEED TO TASK 1.5 UNTIL ALL VERIFICATION STEPS PASS**

---

## Task 1.5: Component Migration

### Objective
Migrate all 22 custom components from the current Vite app to Next.js with Convex integration.

### Detailed Steps

#### Step 1.5.1: Copy Utility Functions
Copy from current project to new project:
- `src/lib/utils.ts`
- `src/lib/stats.ts`
- `src/lib/constants.ts`
- `src/lib/exportImport.ts`
- `src/lib/weeklySummary.ts`

Update imports to use Convex types where needed.

#### Step 1.5.2: Copy Types
Copy `src/types/index.ts` and update for Convex:
```typescript
import { Id } from "../../convex/_generated/dataModel";

export type TimeframeUnit = "year" | "month" | "custom";

export interface Challenge {
  _id: Id<"challenges">;
  userId: Id<"users">;
  name: string;
  targetNumber: number;
  year: number;
  color: string;
  icon: string;
  createdAt: number;
  archived: boolean;
  isPublic: boolean;
  timeframeUnit: TimeframeUnit;
  startDate?: string;
  endDate?: string;
}

// ... rest of types with Convex Id types
```

#### Step 1.5.3: Migrate Visualization Components
Create `src/components/visualization/`:
- `HeatmapCalendar.tsx` - Copy and update imports
- `CircularProgress.tsx` - Copy and update imports
- `TallyMarks.tsx` - Copy and update imports

Add `"use client";` directive to each.

#### Step 1.5.4: Migrate Dashboard Components
Create `src/components/dashboard/`:
- `ChallengeCard.tsx`
- `OverallStats.tsx`
- `PersonalRecords.tsx`

Update to use Convex hooks:
```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function OverallStats({ userId }: { userId: Id<"users"> }) {
  const challenges = useQuery(api.challenges.listActive, { userId });
  const entries = useQuery(api.entries.listByUser, { userId });
  
  if (!challenges || !entries) return <Skeleton />;
  
  // ... rest of component
}
```

#### Step 1.5.5: Migrate Challenge Components
Create `src/components/challenge/`:
- `ChallengeDetailView.tsx`
- `CreateChallengeDialog.tsx`
- `ChallengeSettingsDialog.tsx`

Update mutations:
```tsx
const createChallenge = useMutation(api.challenges.create);
const updateChallenge = useMutation(api.challenges.update);
```

#### Step 1.5.6: Migrate Entry Components
Create `src/components/entry/`:
- `AddEntrySheet.tsx`
- `AddEntryDetailSheet.tsx`
- `EditEntryDialog.tsx`
- `DayEntriesDialog.tsx`

#### Step 1.5.7: Migrate Social Components
Create `src/components/social/`:
- `LeaderboardView.tsx`
- `PublicChallengesView.tsx`
- `FollowedChallengeCard.tsx`

#### Step 1.5.8: Migrate Auth Components
Create `src/components/auth/`:
- `UserProfile.tsx` - Update to use Clerk's `useUser()`

#### Step 1.5.9: Migrate Dialog Components
Create `src/components/dialogs/`:
- `ExportImportDialog.tsx`
- `WeeklySummaryDialog.tsx`

#### Step 1.5.10: Create Main Dashboard Page
Update `src/app/page.tsx`:
```tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useStoreUser } from "@/hooks/use-store-user";
import { ChallengeCard } from "@/components/dashboard/ChallengeCard";
import { OverallStats } from "@/components/dashboard/OverallStats";
// ... other imports

export default function DashboardPage() {
  useStoreUser();
  const { user } = useUser();
  const convexUser = useQuery(api.users.getByClerkId, {
    clerkId: user?.id ?? "",
  });
  
  const challenges = useQuery(
    api.challenges.listActive,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  if (!convexUser || !challenges) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <OverallStats userId={convexUser._id} />
      {/* Challenge grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <ChallengeCard key={challenge._id} challenge={challenge} />
        ))}
      </div>
    </div>
  );
}
```

### Expected Results
- [ ] All 22 components migrated and rendering
- [ ] No TypeScript errors
- [ ] Components fetch data from Convex
- [ ] Mutations update Convex database
- [ ] Real-time updates working

### Verification Steps
```bash
# 1. TypeScript check
npx tsc --noEmit

# 2. Build succeeds
npm run build

# 3. Dev server starts
npm run dev

# 4. Manual testing checklist:
# - [ ] Dashboard loads with challenges
# - [ ] Can create new challenge
# - [ ] Can add entry to challenge
# - [ ] Heatmap calendar renders
# - [ ] Progress ring animates
# - [ ] Can view challenge details
# - [ ] Can edit/delete entries
# - [ ] Weekly summary dialog works
# - [ ] Export/import works
# - [ ] Leaderboard loads public challenges
# - [ ] Community page shows public challenges
```

### Definition of Done
✅ All 22 components exist in `src/components/`  
✅ TypeScript compiles without errors  
✅ All CRUD operations work (create, read, update, delete)  
✅ Real-time updates visible (open 2 tabs, changes sync)  
✅ All manual testing items checked

**⚠️ DO NOT PROCEED TO TASK 1.6 UNTIL ALL VERIFICATION STEPS PASS**

---

## Task 1.6: Real-time Features & Optimistic Updates

### Objective
Implement real-time synchronization and optimistic updates for seamless UX.

### Detailed Steps

#### Step 1.6.1: Enable Optimistic Updates for Entries
```tsx
const createEntry = useMutation(api.entries.create).withOptimisticUpdate(
  (localStore, args) => {
    const existing = localStore.getQuery(api.entries.listByChallenge, {
      challengeId: args.challengeId,
    });
    if (existing) {
      localStore.setQuery(api.entries.listByChallenge, { challengeId: args.challengeId }, [
        ...existing,
        {
          _id: `temp-${Date.now()}` as Id<"entries">,
          ...args,
          createdAt: Date.now(),
        },
      ]);
    }
  }
);
```

#### Step 1.6.2: Add Real-time Leaderboard
The leaderboard should auto-update as entries are added:
```tsx
const publicChallenges = useQuery(api.challenges.listPublic);
// Already real-time via Convex subscriptions
```

#### Step 1.6.3: Add Loading States
Ensure all components handle loading/undefined states gracefully.

### Expected Results
- [ ] Entry additions appear instantly before server confirmation
- [ ] Leaderboard updates when other users add entries
- [ ] No flash of stale content

### Verification Steps
1. Open app in 2 browser windows
2. Add entry in window 1
3. Verify entry appears in window 2 within 1 second
4. Add entry with slow network - verify optimistic update shows immediately

### Definition of Done
✅ Optimistic updates for entry creation  
✅ Real-time sync under 500ms  
✅ No UI flicker during updates

**⚠️ DO NOT PROCEED TO TASK 1.7 UNTIL ALL VERIFICATION STEPS PASS**

---

## Task 1.7: Deployment to Vercel

### Objective
Deploy the application to Vercel with production Convex and Clerk configurations.

### Detailed Steps

#### Step 1.7.1: Prepare for Production
```bash
# 1. Deploy Convex to production
npx convex deploy --prod

# 2. Note production URL from output
```

#### Step 1.7.2: Configure Vercel
1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (production)
   - `CLERK_SECRET_KEY` (production)
   - `NEXT_PUBLIC_CONVEX_URL` (production URL)
   - `CLERK_JWT_ISSUER_DOMAIN`

#### Step 1.7.3: Configure Clerk Production
1. Create production instance in Clerk dashboard
2. Add production domain to allowed origins
3. Configure GitHub OAuth for production

#### Step 1.7.4: Test Production Deployment
```bash
# Build locally first
npm run build

# Deploy to Vercel
vercel --prod
```

### Expected Results
- [ ] App accessible at production URL
- [ ] Authentication works in production
- [ ] Data persists in production Convex
- [ ] No console errors

### Verification Steps
1. Visit production URL
2. Sign in with GitHub
3. Create a challenge
4. Add entries
5. View leaderboard
6. Test in incognito window

### Definition of Done
✅ Production URL accessible  
✅ All features work in production  
✅ Performance metrics acceptable (LCP < 2.5s)  
✅ No errors in Vercel logs

---

# PROJECT 1 COMPLETION CHECKLIST

Before moving to Project 2, verify ALL items:

- [ ] Next.js app deployed to Vercel
- [ ] Convex database operational with all tables
- [ ] Clerk authentication working (GitHub + email)
- [ ] All 22 components migrated and functional
- [ ] Real-time sync working
- [ ] Performance acceptable
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All manual test cases pass

**⚠️ PROJECT 1 IS NOT COMPLETE UNTIL ALL ITEMS ARE CHECKED**

---

## Current Architecture Analysis

### Tech Stack
- **Framework**: Vite + React 19
- **UI Components**: shadcn/ui (new-york style) with Radix primitives
- **Styling**: Tailwind CSS v4
- **State Management**: React useState + GitHub Spark KV storage
- **Authentication**: GitHub OAuth via `@github/spark`
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Data Models
```typescript
// Core Types
- Challenge: { id, userId, name, targetNumber, year, color, icon, timeframeUnit, startDate, endDate, isPublic, archived }
- Entry: { id, userId, challengeId, date, count, note, sets, feeling }
- FollowedChallenge: { challengeId, followedAt }
```

### Key Features
1. User Authentication (GitHub + Email/Password)
2. Challenge Creation with timeframe options
3. Daily Entry Logging with sets/reps tracking
4. Progress Dashboard with stats
5. Heatmap Calendar visualization
6. Circular Progress rings
7. Personal Records tracking
8. Weekly Summary reports
9. Leaderboard & Community features
10. Export/Import functionality

### Components (22 custom + 45 UI components)
- Dashboard: `App.tsx`, `OverallStats.tsx`, `PersonalRecords.tsx`
- Challenge: `ChallengeCard.tsx`, `ChallengeDetailView.tsx`, `CreateChallengeDialog.tsx`
- Entry: `AddEntrySheet.tsx`, `AddEntryDetailSheet.tsx`, `EditEntryDialog.tsx`
- Visualization: `HeatmapCalendar.tsx`, `CircularProgress.tsx`, `TallyMarks.tsx`
- Social: `LeaderboardView.tsx`, `PublicChallengesView.tsx`, `FollowedChallengeCard.tsx`
- Auth: `LoginPage.tsx`, `UserProfile.tsx`
- Dialogs: `ExportImportDialog.tsx`, `WeeklySummaryDialog.tsx`, `DayEntriesDialog.tsx`

---

## Phase 1: Next.js + Vercel Migration (Web)

### 1.1 Project Setup (1-2 days)
- [ ] Create new Next.js 14 project with App Router
  ```bash
  npx create-next-app@latest tally-web --typescript --tailwind --eslint --app --src-dir
  ```
- [ ] Configure Tailwind CSS v4 with existing theme
- [ ] Set up shadcn/ui with existing components.json configuration
- [ ] Configure path aliases (`@/` mappings)
- [ ] Set up Vercel project and deployment pipeline

### 1.2 shadcn/ui Component Migration (1 day)
- [ ] Initialize shadcn/ui in Next.js project
  ```bash
  npx shadcn@latest init
  ```
- [ ] Install all 45 existing UI components:
  ```bash
  npx shadcn@latest add accordion alert alert-dialog aspect-ratio avatar badge breadcrumb button calendar card carousel chart checkbox collapsible command context-menu dialog drawer dropdown-menu form hover-card input input-otp label menubar navigation-menu pagination popover progress radio-group resizable scroll-area select separator sheet sidebar skeleton slider sonner switch table tabs textarea toggle toggle-group tooltip
  ```
- [ ] Copy custom theme configuration (`theme.json`, CSS variables)
- [ ] Migrate `index.css` and `main.css` styles

### 1.3 Convex Database Setup (2-3 days)
- [ ] Install Convex
  ```bash
  npm install convex
  npx convex dev
  ```
- [ ] Create Convex schema (`convex/schema.ts`):
  ```typescript
  import { defineSchema, defineTable } from "convex/server";
  import { v } from "convex/values";

  export default defineSchema({
    users: defineTable({
      clerkId: v.string(),          // Or auth provider ID
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
      timeframeUnit: v.union(v.literal("year"), v.literal("month"), v.literal("custom")),
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
      feeling: v.optional(v.union(
        v.literal("very-easy"),
        v.literal("easy"),
        v.literal("moderate"),
        v.literal("hard"),
        v.literal("very-hard")
      )),
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

- [ ] Create Convex functions (`convex/challenges.ts`, `convex/entries.ts`, etc.):
  ```typescript
  // convex/challenges.ts
  import { mutation, query } from "./_generated/server";
  import { v } from "convex/values";

  export const list = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
      return await ctx.db
        .query("challenges")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("archived"), false))
        .collect();
    },
  });

  export const create = mutation({
    args: {
      userId: v.id("users"),
      name: v.string(),
      targetNumber: v.number(),
      // ... other fields
    },
    handler: async (ctx, args) => {
      return await ctx.db.insert("challenges", {
        ...args,
        archived: false,
        createdAt: Date.now(),
      });
    },
  });
  ```

- [ ] Create Convex hooks for React integration

### 1.4 Authentication Migration (1-2 days)
- [ ] Set up Clerk authentication (recommended for Convex)
  ```bash
  npm install @clerk/nextjs
  ```
- [ ] Configure Clerk with GitHub OAuth provider
- [ ] Add email/password authentication
- [ ] Create auth middleware for protected routes
- [ ] Integrate Clerk with Convex for user management

### 1.5 Component Migration (3-4 days)

#### Server Components (where possible)
- [ ] `app/page.tsx` - Dashboard layout
- [ ] `app/leaderboard/page.tsx` - Leaderboard view
- [ ] `app/community/page.tsx` - Public challenges browser

#### Client Components
- [ ] `components/dashboard/ChallengeCard.tsx`
- [ ] `components/dashboard/OverallStats.tsx`
- [ ] `components/dashboard/PersonalRecords.tsx`
- [ ] `components/challenge/ChallengeDetailView.tsx`
- [ ] `components/challenge/CreateChallengeDialog.tsx`
- [ ] `components/challenge/ChallengeSettingsDialog.tsx`
- [ ] `components/entry/AddEntrySheet.tsx`
- [ ] `components/entry/AddEntryDetailSheet.tsx`
- [ ] `components/entry/EditEntryDialog.tsx`
- [ ] `components/entry/DayEntriesDialog.tsx`
- [ ] `components/visualization/HeatmapCalendar.tsx`
- [ ] `components/visualization/CircularProgress.tsx`
- [ ] `components/visualization/TallyMarks.tsx`
- [ ] `components/social/LeaderboardView.tsx`
- [ ] `components/social/PublicChallengesView.tsx`
- [ ] `components/social/FollowedChallengeCard.tsx`
- [ ] `components/auth/LoginPage.tsx`
- [ ] `components/auth/UserProfile.tsx`
- [ ] `components/dialogs/ExportImportDialog.tsx`
- [ ] `components/dialogs/WeeklySummaryDialog.tsx`

#### Utility Functions
- [ ] `lib/stats.ts` - Statistics calculations
- [ ] `lib/constants.ts` - App constants
- [ ] `lib/exportImport.ts` - Data export/import
- [ ] `lib/weeklySummary.ts` - Weekly summary calculations

### 1.6 Real-time Features (1 day)
- [ ] Implement real-time updates for leaderboard
- [ ] Add real-time sync for followed challenges
- [ ] Set up optimistic updates for entries

### 1.7 Deployment & Testing (1-2 days)
- [ ] Configure Vercel environment variables
- [ ] Set up Convex production deployment
- [ ] Configure Clerk production keys
- [ ] Test all features end-to-end
- [ ] Set up error monitoring (Sentry)
- [ ] Configure analytics

---

## Phase 2: Shared API Layer for Mobile

### 2.1 API Design (2 days)
- [ ] Design REST API endpoints (optional, Convex can be used directly)
- [ ] Document API contracts for mobile apps
- [ ] Create shared TypeScript types package

### 2.2 Convex HTTP API (1 day)
- [ ] Create HTTP actions for mobile authentication
- [ ] Expose necessary endpoints via Convex HTTP routes
- [ ] Set up API authentication tokens

---

## Phase 3: Native iOS App (Swift/SwiftUI)

### 3.1 Project Setup (1 day)
- [ ] Create new Xcode project with SwiftUI
- [ ] Configure project structure:
  ```
  Tally-iOS/
  ├── TallyApp.swift
  ├── Models/
  │   ├── Challenge.swift
  │   ├── Entry.swift
  │   └── User.swift
  ├── Views/
  │   ├── Dashboard/
  │   ├── Challenge/
  │   ├── Entry/
  │   └── Auth/
  ├── ViewModels/
  ├── Services/
  │   ├── ConvexService.swift
  │   └── AuthService.swift
  ├── Components/
  │   ├── HeatmapCalendarView.swift
  │   ├── CircularProgressView.swift
  │   └── TallyMarksView.swift
  └── Resources/
  ```
- [ ] Set up Swift Package Manager dependencies
- [ ] Configure signing and provisioning

### 3.2 Convex iOS SDK Integration (2 days)
- [ ] Install Convex Swift SDK (or create HTTP client)
- [ ] Create `ConvexService` for API communication
- [ ] Implement real-time subscriptions
- [ ] Set up offline data caching with Core Data

### 3.3 Authentication (1-2 days)
- [ ] Integrate Clerk iOS SDK or Apple Sign-In
- [ ] Implement GitHub OAuth flow
- [ ] Create secure token storage (Keychain)
- [ ] Handle session management

### 3.4 Core UI Components (3-4 days)

#### SwiftUI Views
```swift
// Example: ChallengeCardView.swift
struct ChallengeCardView: View {
    let challenge: Challenge
    let entries: [Entry]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: challenge.icon)
                    .foregroundColor(Color(hex: challenge.color))
                Text(challenge.name)
                    .font(.headline)
            }
            
            CircularProgressView(
                progress: calculateProgress(),
                color: Color(hex: challenge.color)
            )
            
            HeatmapCalendarView(
                entries: entries,
                color: Color(hex: challenge.color)
            )
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(radius: 4)
    }
}
```

- [ ] `DashboardView` - Main challenge grid
- [ ] `ChallengeCardView` - Individual challenge display
- [ ] `ChallengeDetailView` - Full challenge details
- [ ] `AddEntryView` - Entry logging sheet
- [ ] `CreateChallengeView` - Challenge creation form
- [ ] `HeatmapCalendarView` - Custom calendar heatmap
- [ ] `CircularProgressView` - Animated progress ring
- [ ] `TallyMarksView` - Animated tally marks
- [ ] `LeaderboardView` - Rankings display
- [ ] `CommunityView` - Public challenges browser
- [ ] `ProfileView` - User settings

### 3.5 Native Features (2 days)
- [ ] Haptic feedback for interactions
- [ ] Local notifications for reminders
- [ ] Widget for home screen
- [ ] Apple Watch companion (optional)
- [ ] Siri Shortcuts integration

### 3.6 Animations & Polish (1-2 days)
- [ ] Confetti animation for entry logging
- [ ] Smooth page transitions
- [ ] Pull-to-refresh
- [ ] Skeleton loading states

### 3.7 Testing & App Store (2 days)
- [ ] Unit tests for ViewModels
- [ ] UI tests for critical flows
- [ ] TestFlight beta distribution
- [ ] App Store Connect setup
- [ ] Privacy policy and terms
- [ ] Screenshots and app preview

---

## Phase 4: Native Android App (Kotlin/Jetpack Compose)

### 4.1 Project Setup (1 day)
- [ ] Create new Android Studio project with Compose
- [ ] Configure project structure:
  ```
  Tally-Android/
  ├── app/
  │   ├── src/main/
  │   │   ├── java/com/tally/
  │   │   │   ├── TallyApplication.kt
  │   │   │   ├── MainActivity.kt
  │   │   │   ├── data/
  │   │   │   │   ├── models/
  │   │   │   │   ├── repository/
  │   │   │   │   └── local/
  │   │   │   ├── ui/
  │   │   │   │   ├── dashboard/
  │   │   │   │   ├── challenge/
  │   │   │   │   ├── entry/
  │   │   │   │   ├── auth/
  │   │   │   │   └── components/
  │   │   │   ├── viewmodel/
  │   │   │   └── di/
  │   │   └── res/
  │   └── build.gradle.kts
  └── build.gradle.kts
  ```
- [ ] Set up Gradle dependencies (Compose, Hilt, Retrofit)
- [ ] Configure ProGuard rules

### 4.2 Convex Android SDK Integration (2 days)
- [ ] Create HTTP client for Convex API
- [ ] Implement `ConvexRepository` with Flow
- [ ] Set up Room database for offline caching
- [ ] Implement DataStore for preferences

### 4.3 Authentication (1-2 days)
- [ ] Integrate Clerk Android SDK or Google Sign-In
- [ ] Implement GitHub OAuth flow
- [ ] Create secure token storage (EncryptedSharedPreferences)
- [ ] Handle session management

### 4.4 Core UI Components (3-4 days)

#### Jetpack Compose Composables
```kotlin
// Example: ChallengeCard.kt
@Composable
fun ChallengeCard(
    challenge: Challenge,
    entries: List<Entry>,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = challenge.icon.toImageVector(),
                    contentDescription = null,
                    tint = Color(challenge.color.toColorInt())
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = challenge.name,
                    style = MaterialTheme.typography.titleMedium
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            CircularProgressIndicator(
                progress = calculateProgress(challenge, entries),
                color = Color(challenge.color.toColorInt())
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            HeatmapCalendar(
                entries = entries,
                color = Color(challenge.color.toColorInt())
            )
        }
    }
}
```

- [ ] `DashboardScreen` - Main challenge grid
- [ ] `ChallengeCard` - Individual challenge display
- [ ] `ChallengeDetailScreen` - Full challenge details
- [ ] `AddEntrySheet` - Entry logging bottom sheet
- [ ] `CreateChallengeDialog` - Challenge creation form
- [ ] `HeatmapCalendar` - Custom canvas calendar
- [ ] `CircularProgress` - Animated progress ring
- [ ] `TallyMarks` - Animated tally marks
- [ ] `LeaderboardScreen` - Rankings display
- [ ] `CommunityScreen` - Public challenges browser
- [ ] `ProfileScreen` - User settings

### 4.5 Native Features (2 days)
- [ ] Haptic feedback for interactions
- [ ] Local notifications (WorkManager)
- [ ] Home screen widget (Glance)
- [ ] Wear OS companion (optional)
- [ ] Quick Settings tile

### 4.6 Animations & Polish (1-2 days)
- [ ] Confetti animation (Konfetti library)
- [ ] Navigation transitions
- [ ] Pull-to-refresh
- [ ] Shimmer loading states

### 4.7 Testing & Play Store (2 days)
- [ ] Unit tests for ViewModels
- [ ] Compose UI tests
- [ ] Internal testing track
- [ ] Play Console setup
- [ ] Privacy policy and terms
- [ ] Screenshots and feature graphic

---

## Phase 5: Cross-Platform Considerations

### 5.1 Data Synchronization
- [ ] Ensure consistent data format across all platforms
- [ ] Implement conflict resolution strategy
- [ ] Handle offline-first with sync on reconnect

### 5.2 Feature Parity
| Feature | Web | iOS | Android |
|---------|-----|-----|---------|
| Authentication | ✓ | ✓ | ✓ |
| Challenge CRUD | ✓ | ✓ | ✓ |
| Entry Logging | ✓ | ✓ | ✓ |
| Heatmap Calendar | ✓ | ✓ | ✓ |
| Circular Progress | ✓ | ✓ | ✓ |
| Tally Animations | ✓ | ✓ | ✓ |
| Leaderboard | ✓ | ✓ | ✓ |
| Community | ✓ | ✓ | ✓ |
| Export/Import | ✓ | ✓ | ✓ |
| Weekly Summary | ✓ | ✓ | ✓ |
| Push Notifications | - | ✓ | ✓ |
| Widgets | - | ✓ | ✓ |
| Haptic Feedback | - | ✓ | ✓ |

### 5.3 Design System
- [ ] Create shared design tokens
- [ ] Document color palette, typography, spacing
- [ ] Maintain consistent iconography

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| **Phase 1: Next.js Migration** | 2-3 weeks | - |
| **Phase 2: Shared API Layer** | 3-4 days | Phase 1 |
| **Phase 3: iOS App** | 3-4 weeks | Phase 2 |
| **Phase 4: Android App** | 3-4 weeks | Phase 2 |
| **Phase 5: Polish & Testing** | 1-2 weeks | Phases 3-4 |

**Total Estimated Duration: 10-14 weeks**

---

## Risk Mitigation

### Technical Risks
1. **Convex Learning Curve**: Allocate extra time for team familiarization
2. **Real-time Sync Complexity**: Start with simpler sync, iterate
3. **Platform-Specific Bugs**: Extensive testing on multiple devices

### Mitigation Strategies
- Create proof-of-concept for Convex integration first
- Use feature flags for gradual rollout
- Maintain the existing Spark app during migration

---

## Success Metrics

1. **Performance**: Page load < 2s, entry logging < 1s
2. **Reliability**: 99.9% uptime, real-time sync < 500ms
3. **User Experience**: App Store rating > 4.5
4. **Adoption**: Mobile installs > 1000 in first month

---

## Post-Launch Roadmap

1. **PWA Support**: Add offline-first PWA capabilities to web
2. **Apple Watch App**: Quick entry logging from wrist
3. **Wear OS App**: Android watch companion
4. **Integrations**: Apple Health, Google Fit, Strava
5. **Social Features**: Challenge friends, group challenges
6. **Premium Features**: Advanced analytics, unlimited challenges

---

## Technical Decisions Log

| Decision | Option Chosen | Rationale |
|----------|---------------|-----------|
| Database | Convex | Real-time, type-safe, serverless |
| Auth | Clerk | Convex integration, multi-provider |
| iOS Framework | SwiftUI | Modern, declarative, native |
| Android Framework | Jetpack Compose | Modern, declarative, native |
| State Management | Built-in (Convex hooks) | Simplified architecture |
| Offline Storage | Core Data / Room | Native, reliable |

---

## File Structure (Next.js Project)

```
tally-web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx
│   │   ├── challenge/[id]/page.tsx
│   │   ├── leaderboard/page.tsx
│   │   └── community/page.tsx
│   ├── api/
│   │   └── [...convex]/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                    # shadcn components
│   ├── dashboard/
│   ├── challenge/
│   ├── entry/
│   ├── visualization/
│   ├── social/
│   └── auth/
├── convex/
│   ├── _generated/
│   ├── schema.ts
│   ├── challenges.ts
│   ├── entries.ts
│   ├── users.ts
│   └── leaderboard.ts
├── lib/
│   ├── utils.ts
│   ├── stats.ts
│   └── constants.ts
├── hooks/
│   └── use-mobile.ts
├── types/
│   └── index.ts
├── public/
├── convex.json
├── next.config.js
├── tailwind.config.ts
├── components.json
└── package.json
```

---

## Getting Started Commands

```bash
# Phase 1: Create Next.js project
npx create-next-app@latest tally-web --typescript --tailwind --eslint --app --src-dir
cd tally-web

# Install Convex
npm install convex
npx convex dev

# Install Clerk
npm install @clerk/nextjs

# Install shadcn/ui
npx shadcn@latest init

# Phase 3: Create iOS project
# Open Xcode → New Project → iOS → App → SwiftUI

# Phase 4: Create Android project  
# Open Android Studio → New Project → Empty Compose Activity
```

---

# PROJECT 2: SHARED API LAYER FOR MOBILE

## Project Overview
**Goal**: Create HTTP endpoints and documentation for mobile app integration with Convex backend.

**Duration**: 3-4 days  
**Priority**: HIGH - Required before iOS and Android development  
**Dependencies**: Project 1 must be 100% complete

---

## Task 2.1: Convex HTTP Actions

### Objective
Create HTTP endpoints that mobile apps can call directly.

### Detailed Steps

#### Step 2.1.1: Create HTTP Routes
Create `convex/http.ts`:
```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Auth endpoint
http.route({
  path: "/api/auth/user",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { clerkId, email, name, avatarUrl } = await request.json();
    const userId = await ctx.runMutation(api.users.getOrCreate, {
      clerkId, email, name, avatarUrl,
    });
    return new Response(JSON.stringify({ userId }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Challenges endpoints
http.route({
  path: "/api/challenges",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return new Response("Missing userId", { status: 400 });
    }
    const challenges = await ctx.runQuery(api.challenges.list, { 
      userId: userId as any 
    });
    return new Response(JSON.stringify(challenges), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/challenges",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const data = await request.json();
    const id = await ctx.runMutation(api.challenges.create, data);
    return new Response(JSON.stringify({ id }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Entries endpoints
http.route({
  path: "/api/entries",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const challengeId = url.searchParams.get("challengeId");
    if (!challengeId) {
      return new Response("Missing challengeId", { status: 400 });
    }
    const entries = await ctx.runQuery(api.entries.listByChallenge, { 
      challengeId: challengeId as any 
    });
    return new Response(JSON.stringify(entries), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/entries",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const data = await request.json();
    const id = await ctx.runMutation(api.entries.create, data);
    return new Response(JSON.stringify({ id }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
```

#### Step 2.1.2: Enable HTTP in Convex Config
Update `convex.json`:
```json
{
  "functions": "convex/",
  "httpRoutes": true
}
```

### Expected Results
- [ ] HTTP endpoints accessible at `https://<deployment>.convex.site/api/*`
- [ ] All CRUD operations available via HTTP
- [ ] Proper error handling and status codes

### Verification Steps
```bash
# 1. Deploy HTTP routes
npx convex deploy

# 2. Test endpoints with curl
curl https://<your-deployment>.convex.site/api/challenges?userId=<test-user-id>

# 3. Test POST endpoint
curl -X POST https://<your-deployment>.convex.site/api/entries \
  -H "Content-Type: application/json" \
  -d '{"userId":"...", "challengeId":"...", "date":"2026-01-09", "count":10}'
```

### Definition of Done
✅ All HTTP endpoints respond correctly  
✅ GET /api/challenges returns user's challenges  
✅ POST /api/entries creates new entry  
✅ Error responses have proper status codes

**⚠️ DO NOT PROCEED TO TASK 2.2 UNTIL ALL VERIFICATION STEPS PASS**

---

## Task 2.2: API Documentation

### Objective
Create comprehensive API documentation for mobile developers.

### Detailed Steps

#### Step 2.2.1: Create API Documentation
Create `docs/API.md` in the repository:
```markdown
# Tally API Documentation

## Base URL
- Development: `https://dev-<id>.convex.site`
- Production: `https://prod-<id>.convex.site`

## Authentication
All requests require a valid Clerk JWT token in the Authorization header:
```
Authorization: Bearer <clerk-jwt-token>
```

## Endpoints

### Users
#### POST /api/auth/user
Create or get existing user.
Request:
{
  "clerkId": "string",
  "email": "string (optional)",
  "name": "string (optional)",
  "avatarUrl": "string (optional)"
}
Response:
{
  "userId": "string (Convex ID)"
}

### Challenges
#### GET /api/challenges?userId={userId}
Get all challenges for a user.

#### POST /api/challenges
Create a new challenge.
Request:
{
  "userId": "string",
  "name": "string",
  "targetNumber": "number",
  "year": "number",
  "color": "string",
  "icon": "string",
  "timeframeUnit": "year" | "month" | "custom",
  "startDate": "string (optional)",
  "endDate": "string (optional)",
  "isPublic": "boolean"
}

### Entries
#### GET /api/entries?challengeId={challengeId}
Get all entries for a challenge.

#### POST /api/entries
Create a new entry.
Request:
{
  "userId": "string",
  "challengeId": "string",
  "date": "string (YYYY-MM-DD)",
  "count": "number",
  "note": "string (optional)",
  "sets": "[{reps: number}] (optional)",
  "feeling": "very-easy" | "easy" | "moderate" | "hard" | "very-hard"
}
```

#### Step 2.2.2: Create Shared Types Package
Create `packages/shared-types/index.ts`:
```typescript
export type TimeframeUnit = "year" | "month" | "custom";
export type FeelingType = "very-easy" | "easy" | "moderate" | "hard" | "very-hard";

export interface Challenge {
  _id: string;
  userId: string;
  name: string;
  targetNumber: number;
  year: number;
  color: string;
  icon: string;
  timeframeUnit: TimeframeUnit;
  startDate?: string;
  endDate?: string;
  isPublic: boolean;
  archived: boolean;
  createdAt: number;
}

export interface Entry {
  _id: string;
  userId: string;
  challengeId: string;
  date: string;
  count: number;
  note?: string;
  sets?: { reps: number }[];
  feeling?: FeelingType;
  createdAt: number;
}

export interface User {
  _id: string;
  clerkId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  createdAt: number;
}
```

### Expected Results
- [ ] API.md documentation complete
- [ ] Shared types package created
- [ ] All endpoints documented with request/response examples

### Verification Steps
1. Review API.md for completeness
2. Test each documented endpoint matches actual behavior
3. Verify types match Convex schema

### Definition of Done
✅ API documentation covers all endpoints  
✅ Request/response examples provided  
✅ Shared types exported and usable

---

# PROJECT 2 COMPLETION CHECKLIST

- [ ] HTTP endpoints deployed and accessible
- [ ] All CRUD operations available via HTTP
- [ ] API documentation complete
- [ ] Shared types package created
- [ ] All endpoints tested with curl

**⚠️ PROJECT 2 IS NOT COMPLETE UNTIL ALL ITEMS ARE CHECKED**

---

# PROJECT 3: NATIVE iOS APP (Swift/SwiftUI)

## Project Overview
**Goal**: Build a native iOS application with full feature parity to the web app.

**Duration**: 3-4 weeks  
**Priority**: HIGH  
**Dependencies**: Projects 1 and 2 must be 100% complete

---

## Task 3.1: Xcode Project Setup

### Objective
Create a new SwiftUI project with proper architecture and dependencies.

### Detailed Steps

#### Step 3.1.1: Create Xcode Project
1. Open Xcode
2. File → New → Project
3. Select: iOS → App
4. Configure:
   - Product Name: Tally
   - Team: Your Apple Developer Team
   - Organization Identifier: com.yourcompany
   - Interface: SwiftUI
   - Language: Swift
   - Storage: None (we'll use Convex)
5. Save to `tally-ios/` directory

#### Step 3.1.2: Set Up Project Structure
Create folders:
```
Tally/
├── App/
│   ├── TallyApp.swift
│   └── ContentView.swift
├── Models/
│   ├── Challenge.swift
│   ├── Entry.swift
│   ├── User.swift
│   └── APIModels.swift
├── Views/
│   ├── Dashboard/
│   │   ├── DashboardView.swift
│   │   ├── ChallengeCardView.swift
│   │   ├── OverallStatsView.swift
│   │   └── PersonalRecordsView.swift
│   ├── Challenge/
│   │   ├── ChallengeDetailView.swift
│   │   ├── CreateChallengeView.swift
│   │   └── ChallengeSettingsView.swift
│   ├── Entry/
│   │   ├── AddEntryView.swift
│   │   ├── EditEntryView.swift
│   │   └── DayEntriesView.swift
│   ├── Social/
│   │   ├── LeaderboardView.swift
│   │   ├── CommunityView.swift
│   │   └── FollowedChallengeCard.swift
│   └── Auth/
│       ├── LoginView.swift
│       └── ProfileView.swift
├── ViewModels/
│   ├── DashboardViewModel.swift
│   ├── ChallengeViewModel.swift
│   ├── EntryViewModel.swift
│   └── AuthViewModel.swift
├── Services/
│   ├── APIService.swift
│   ├── AuthService.swift
│   └── KeychainService.swift
├── Components/
│   ├── HeatmapCalendarView.swift
│   ├── CircularProgressView.swift
│   ├── TallyMarksView.swift
│   └── ConfettiView.swift
├── Utilities/
│   ├── Extensions.swift
│   ├── Constants.swift
│   └── StatsCalculator.swift
└── Resources/
    ├── Assets.xcassets
    └── Localizable.strings
```

#### Step 3.1.3: Add Swift Packages
In Xcode: File → Add Package Dependencies
- Add Clerk iOS SDK: `https://github.com/clerk/clerk-ios`
- Add Alamofire (networking): `https://github.com/Alamofire/Alamofire`
- Add SwiftUI-Confetti: `https://github.com/simibac/ConfettiSwiftUI`

### Expected Results
- [ ] Xcode project compiles without errors
- [ ] All folder structure created
- [ ] Dependencies installed

### Verification Steps
```bash
# 1. Build project in Xcode (Cmd+B)
# Should show "Build Succeeded"

# 2. Run on simulator (Cmd+R)
# Should show blank SwiftUI view

# 3. Check dependencies
# In Xcode: File → Packages → Resolve Package Versions
```

### Definition of Done
✅ Project builds successfully  
✅ All directories created  
✅ Dependencies resolved  
✅ App runs on iOS Simulator

**⚠️ DO NOT PROCEED TO TASK 3.2 UNTIL ALL VERIFICATION STEPS PASS**

---

## Task 3.2: Data Models and API Service

### Objective
Create Swift models matching the Convex schema and implement API communication.

### Detailed Steps

#### Step 3.2.1: Create Data Models
Create `Models/Challenge.swift`:
```swift
import Foundation

enum TimeframeUnit: String, Codable {
    case year, month, custom
}

struct Challenge: Identifiable, Codable {
    let _id: String
    let userId: String
    let name: String
    let targetNumber: Int
    let year: Int
    let color: String
    let icon: String
    let timeframeUnit: TimeframeUnit
    let startDate: String?
    let endDate: String?
    let isPublic: Bool
    let archived: Bool
    let createdAt: Double
    
    var id: String { _id }
}
```

Create `Models/Entry.swift`:
```swift
import Foundation

enum FeelingType: String, Codable {
    case veryEasy = "very-easy"
    case easy
    case moderate
    case hard
    case veryHard = "very-hard"
}

struct EntrySet: Codable {
    let reps: Int
}

struct Entry: Identifiable, Codable {
    let _id: String
    let userId: String
    let challengeId: String
    let date: String
    let count: Int
    let note: String?
    let sets: [EntrySet]?
    let feeling: FeelingType?
    let createdAt: Double
    
    var id: String { _id }
}
```

Create `Models/User.swift`:
```swift
import Foundation

struct User: Identifiable, Codable {
    let _id: String
    let clerkId: String
    let email: String?
    let name: String?
    let avatarUrl: String?
    let createdAt: Double
    
    var id: String { _id }
}
```

#### Step 3.2.2: Create API Service
Create `Services/APIService.swift`:
```swift
import Foundation
import Alamofire

class APIService: ObservableObject {
    static let shared = APIService()
    
    private let baseURL: String
    private var authToken: String?
    
    private init() {
        #if DEBUG
        baseURL = "https://dev-xxx.convex.site"
        #else
        baseURL = "https://prod-xxx.convex.site"
        #endif
    }
    
    func setAuthToken(_ token: String) {
        self.authToken = token
    }
    
    private var headers: HTTPHeaders {
        var headers: HTTPHeaders = ["Content-Type": "application/json"]
        if let token = authToken {
            headers["Authorization"] = "Bearer \(token)"
        }
        return headers
    }
    
    // MARK: - User
    func createOrGetUser(clerkId: String, email: String?, name: String?, avatarUrl: String?) async throws -> String {
        let parameters: [String: Any] = [
            "clerkId": clerkId,
            "email": email as Any,
            "name": name as Any,
            "avatarUrl": avatarUrl as Any
        ]
        
        let response = try await AF.request(
            "\(baseURL)/api/auth/user",
            method: .post,
            parameters: parameters,
            encoding: JSONEncoding.default,
            headers: headers
        ).serializingDecodable([String: String].self).value
        
        guard let userId = response["userId"] else {
            throw APIError.invalidResponse
        }
        return userId
    }
    
    // MARK: - Challenges
    func getChallenges(userId: String) async throws -> [Challenge] {
        return try await AF.request(
            "\(baseURL)/api/challenges",
            parameters: ["userId": userId],
            headers: headers
        ).serializingDecodable([Challenge].self).value
    }
    
    func createChallenge(_ challenge: CreateChallengeRequest) async throws -> String {
        let response = try await AF.request(
            "\(baseURL)/api/challenges",
            method: .post,
            parameters: challenge,
            encoder: JSONParameterEncoder.default,
            headers: headers
        ).serializingDecodable([String: String].self).value
        
        guard let id = response["id"] else {
            throw APIError.invalidResponse
        }
        return id
    }
    
    // MARK: - Entries
    func getEntries(challengeId: String) async throws -> [Entry] {
        return try await AF.request(
            "\(baseURL)/api/entries",
            parameters: ["challengeId": challengeId],
            headers: headers
        ).serializingDecodable([Entry].self).value
    }
    
    func createEntry(_ entry: CreateEntryRequest) async throws -> String {
        let response = try await AF.request(
            "\(baseURL)/api/entries",
            method: .post,
            parameters: entry,
            encoder: JSONParameterEncoder.default,
            headers: headers
        ).serializingDecodable([String: String].self).value
        
        guard let id = response["id"] else {
            throw APIError.invalidResponse
        }
        return id
    }
}

enum APIError: Error {
    case invalidResponse
    case networkError(Error)
}

struct CreateChallengeRequest: Encodable {
    let userId: String
    let name: String
    let targetNumber: Int
    let year: Int
    let color: String
    let icon: String
    let timeframeUnit: TimeframeUnit
    let startDate: String?
    let endDate: String?
    let isPublic: Bool
}

struct CreateEntryRequest: Encodable {
    let userId: String
    let challengeId: String
    let date: String
    let count: Int
    let note: String?
    let sets: [EntrySet]?
    let feeling: FeelingType?
}
```

### Expected Results
- [ ] All models compile without errors
- [ ] APIService methods implemented
- [ ] Network requests work

### Verification Steps
```swift
// Add test in Preview or unit test:
Task {
    do {
        let challenges = try await APIService.shared.getChallenges(userId: "test")
        print("Got \(challenges.count) challenges")
    } catch {
        print("Error: \(error)")
    }
}
```

### Definition of Done
✅ All model files created and compile  
✅ APIService has all CRUD methods  
✅ Network requests succeed (test with real endpoint)

**⚠️ DO NOT PROCEED TO TASK 3.3 UNTIL ALL VERIFICATION STEPS PASS**

---

## Task 3.3: Authentication with Clerk

### Objective
Implement user authentication using Clerk iOS SDK.

### Detailed Steps

#### Step 3.3.1: Configure Clerk
Create `Services/AuthService.swift`:
```swift
import Foundation
import ClerkSDK

@MainActor
class AuthService: ObservableObject {
    static let shared = AuthService()
    
    @Published var isAuthenticated = false
    @Published var user: ClerkUser?
    @Published var convexUserId: String?
    @Published var isLoading = true
    
    private init() {}
    
    func initialize() async {
        // Configure Clerk
        Clerk.configure(publishableKey: "pk_test_xxx")
        
        // Check for existing session
        if let session = Clerk.shared.session {
            self.user = session.user
            self.isAuthenticated = true
            await syncUserToConvex()
        }
        
        self.isLoading = false
    }
    
    func signInWithGitHub() async throws {
        try await Clerk.shared.signIn.create(strategy: .oauth(.github))
        
        if let user = Clerk.shared.user {
            self.user = user
            self.isAuthenticated = true
            await syncUserToConvex()
        }
    }
    
    func signInWithEmail(email: String, password: String) async throws {
        try await Clerk.shared.signIn.create(
            strategy: .password(email, password)
        )
        
        if let user = Clerk.shared.user {
            self.user = user
            self.isAuthenticated = true
            await syncUserToConvex()
        }
    }
    
    func signUp(email: String, password: String) async throws {
        try await Clerk.shared.signUp.create(
            emailAddress: email,
            password: password
        )
        
        // Auto sign in after signup
        try await signInWithEmail(email: email, password: password)
    }
    
    func signOut() async throws {
        try await Clerk.shared.signOut()
        self.user = nil
        self.isAuthenticated = false
        self.convexUserId = nil
    }
    
    private func syncUserToConvex() async {
        guard let user = self.user else { return }
        
        do {
            let userId = try await APIService.shared.createOrGetUser(
                clerkId: user.id,
                email: user.primaryEmailAddress?.emailAddress,
                name: user.fullName,
                avatarUrl: user.imageUrl
            )
            self.convexUserId = userId
            
            // Set auth token for API requests
            if let token = try? await Clerk.shared.session?.getToken() {
                APIService.shared.setAuthToken(token)
            }
        } catch {
            print("Failed to sync user: \(error)")
        }
    }
}
```

#### Step 3.3.2: Create Login View
Create `Views/Auth/LoginView.swift`:
```swift
import SwiftUI

struct LoginView: View {
    @StateObject private var authService = AuthService.shared
    @State private var email = ""
    @State private var password = ""
    @State private var isSignUp = false
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        VStack(spacing: 24) {
            // Logo
            VStack(spacing: 8) {
                TallyLogoView()
                    .frame(width: 80, height: 100)
                Text("Tally")
                    .font(.system(size: 48, weight: .bold))
                Text("Count what matters")
                    .font(.title3)
                    .foregroundColor(.secondary)
            }
            .padding(.top, 60)
            
            Spacer()
            
            // Auth form
            VStack(spacing: 16) {
                TextField("Email", text: $email)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                
                SecureField("Password", text: $password)
                    .textFieldStyle(.roundedBorder)
                
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                
                Button(action: {
                    Task { await handleEmailAuth() }
                }) {
                    if isLoading {
                        ProgressView()
                    } else {
                        Text(isSignUp ? "Create Account" : "Sign In")
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(isLoading || email.isEmpty || password.isEmpty)
                
                Button(isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up") {
                    isSignUp.toggle()
                }
                .font(.caption)
            }
            .padding(.horizontal, 32)
            
            // Divider
            HStack {
                Rectangle().frame(height: 1).foregroundColor(.secondary.opacity(0.3))
                Text("or").foregroundColor(.secondary)
                Rectangle().frame(height: 1).foregroundColor(.secondary.opacity(0.3))
            }
            .padding(.horizontal, 32)
            
            // GitHub Sign In
            Button(action: {
                Task { await handleGitHubAuth() }
            }) {
                HStack {
                    Image(systemName: "chevron.left.forwardslash.chevron.right")
                    Text("Continue with GitHub")
                }
            }
            .buttonStyle(.bordered)
            .disabled(isLoading)
            
            Spacer()
        }
        .padding()
    }
    
    private func handleEmailAuth() async {
        isLoading = true
        errorMessage = nil
        
        do {
            if isSignUp {
                try await authService.signUp(email: email, password: password)
            } else {
                try await authService.signInWithEmail(email: email, password: password)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    private func handleGitHubAuth() async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await authService.signInWithGitHub()
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
}
```

### Expected Results
- [ ] Login view renders
- [ ] GitHub OAuth flow works
- [ ] Email/password auth works
- [ ] User synced to Convex

### Verification Steps
1. Run app on simulator
2. See login screen
3. Sign in with GitHub → Should redirect and authenticate
4. Check Convex dashboard for new user record

### Definition of Done
✅ Login screen displays  
✅ GitHub OAuth completes successfully  
✅ Email/password authentication works  
✅ User appears in Convex users table  
✅ Auth state persists after app restart

**⚠️ DO NOT PROCEED TO TASK 3.4 UNTIL ALL VERIFICATION STEPS PASS**

---

## Task 3.4: Core UI Components

### Objective
Build all custom SwiftUI components matching the web app design.

### Detailed Steps

#### Step 3.4.1: Create Circular Progress View
Create `Components/CircularProgressView.swift`:
```swift
import SwiftUI

struct CircularProgressView: View {
    let progress: Double
    let color: Color
    let lineWidth: CGFloat
    
    init(progress: Double, color: Color, lineWidth: CGFloat = 12) {
        self.progress = min(max(progress, 0), 1)
        self.color = color
        self.lineWidth = lineWidth
    }
    
    var body: some View {
        ZStack {
            // Background circle
            Circle()
                .stroke(color.opacity(0.2), lineWidth: lineWidth)
            
            // Progress circle
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    color,
                    style: StrokeStyle(
                        lineWidth: lineWidth,
                        lineCap: .round
                    )
                )
                .rotationEffect(.degrees(-90))
                .animation(.spring(response: 0.6), value: progress)
        }
    }
}
```

#### Step 3.4.2: Create Heatmap Calendar View
Create `Components/HeatmapCalendarView.swift`:
```swift
import SwiftUI

struct HeatmapCalendarView: View {
    let entries: [Entry]
    let color: Color
    let startDate: Date
    let endDate: Date
    
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 2), count: 7)
    
    var body: some View {
        LazyVGrid(columns: columns, spacing: 2) {
            ForEach(days, id: \.self) { day in
                RoundedRectangle(cornerRadius: 2)
                    .fill(colorForDay(day))
                    .aspectRatio(1, contentMode: .fit)
            }
        }
    }
    
    private var days: [Date] {
        var dates: [Date] = []
        var current = startDate
        while current <= endDate {
            dates.append(current)
            current = Calendar.current.date(byAdding: .day, value: 1, to: current)!
        }
        return dates
    }
    
    private func colorForDay(_ date: Date) -> Color {
        let dateString = ISO8601DateFormatter().string(from: date).prefix(10)
        let dayEntries = entries.filter { $0.date == dateString }
        let total = dayEntries.reduce(0) { $0 + $1.count }
        
        if total == 0 {
            return color.opacity(0.1)
        }
        
        // 5 intensity levels
        let maxCount = entries.map { $0.count }.max() ?? 1
        let intensity = Double(total) / Double(maxCount)
        
        switch intensity {
        case 0..<0.2: return color.opacity(0.2)
        case 0.2..<0.4: return color.opacity(0.4)
        case 0.4..<0.6: return color.opacity(0.6)
        case 0.6..<0.8: return color.opacity(0.8)
        default: return color
        }
    }
}
```

#### Step 3.4.3: Create Tally Marks View
Create `Components/TallyMarksView.swift`:
```swift
import SwiftUI

struct TallyMarksView: View {
    let count: Int
    let color: Color
    
    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<groups, id: \.self) { groupIndex in
                TallyGroupView(
                    count: min(5, count - groupIndex * 5),
                    color: color
                )
            }
        }
    }
    
    private var groups: Int {
        (count + 4) / 5
    }
}

struct TallyGroupView: View {
    let count: Int
    let color: Color
    
    var body: some View {
        ZStack {
            HStack(spacing: 2) {
                ForEach(0..<min(4, count), id: \.self) { _ in
                    Rectangle()
                        .fill(color)
                        .frame(width: 3, height: 24)
                }
            }
            
            if count == 5 {
                Rectangle()
                    .fill(Color.red.opacity(0.8))
                    .frame(width: 30, height: 3)
                    .rotationEffect(.degrees(-20))
            }
        }
    }
}
```

#### Step 3.4.4: Create Challenge Card View
Create `Views/Dashboard/ChallengeCardView.swift`:
```swift
import SwiftUI

struct ChallengeCardView: View {
    let challenge: Challenge
    let entries: [Entry]
    let onTap: () -> Void
    
    private var totalCount: Int {
        entries.filter { $0.challengeId == challenge.id }
            .reduce(0) { $0 + $1.count }
    }
    
    private var progress: Double {
        Double(totalCount) / Double(challenge.targetNumber)
    }
    
    private var challengeColor: Color {
        Color(hex: challenge.color) ?? .blue
    }
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    Image(systemName: challenge.icon)
                        .font(.title2)
                        .foregroundColor(challengeColor)
                    
                    Text(challenge.name)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    if challenge.isPublic {
                        Image(systemName: "globe")
                            .foregroundColor(.secondary)
                    }
                }
                
                // Progress
                HStack(spacing: 16) {
                    CircularProgressView(
                        progress: progress,
                        color: challengeColor
                    )
                    .frame(width: 60, height: 60)
                    
                    VStack(alignment: .leading) {
                        Text("\(totalCount)")
                            .font(.system(size: 32, weight: .bold, design: .monospaced))
                        Text("/ \(challenge.targetNumber)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                
                // Mini heatmap
                HeatmapCalendarView(
                    entries: entries.filter { $0.challengeId == challenge.id },
                    color: challengeColor,
                    startDate: challengeStartDate,
                    endDate: challengeEndDate
                )
                .frame(height: 40)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
        }
        .buttonStyle(.plain)
    }
    
    private var challengeStartDate: Date {
        if let start = challenge.startDate {
            return ISO8601DateFormatter().date(from: start) ?? Date()
        }
        return Calendar.current.date(from: DateComponents(year: challenge.year, month: 1, day: 1))!
    }
    
    private var challengeEndDate: Date {
        if let end = challenge.endDate {
            return ISO8601DateFormatter().date(from: end) ?? Date()
        }
        return Calendar.current.date(from: DateComponents(year: challenge.year, month: 12, day: 31))!
    }
}
```

### Expected Results
- [ ] CircularProgressView animates smoothly
- [ ] HeatmapCalendarView renders correct colors
- [ ] TallyMarksView displays correct count
- [ ] ChallengeCardView shows all data

### Verification Steps
1. Create SwiftUI preview for each component
2. Test with various data inputs
3. Verify animations are smooth (60fps)
4. Test dark mode appearance

### Definition of Done
✅ All 4 components render correctly  
✅ Dark mode support works  
✅ Animations are smooth  
✅ Accessibility labels added

**⚠️ DO NOT PROCEED TO TASK 3.5 UNTIL ALL VERIFICATION STEPS PASS**

---

## Task 3.5: Main Views Implementation

### Objective
Build all main screens: Dashboard, Challenge Detail, Add Entry, Leaderboard, Community.

### Detailed Steps
(Due to length, abbreviated - each view follows similar pattern)

#### Step 3.5.1: Dashboard View
Create `Views/Dashboard/DashboardView.swift` with:
- Header with user profile
- Overall stats
- Personal records
- Challenge grid
- Floating add button

#### Step 3.5.2: Challenge Detail View
Create `Views/Challenge/ChallengeDetailView.swift` with:
- Large heatmap
- Line chart (actual vs pace)
- Stats grid
- Entry history list
- Settings button

#### Step 3.5.3: Add Entry View
Create `Views/Entry/AddEntryView.swift` with:
- Challenge selector
- Large number input
- Quick presets (+1, +5, +10, +50)
- Date picker
- Note field
- Feeling selector
- Confetti on submit

#### Step 3.5.4: Leaderboard View
Create `Views/Social/LeaderboardView.swift`

#### Step 3.5.5: Community View
Create `Views/Social/CommunityView.swift`

### Expected Results
- [ ] All views implemented and navigable
- [ ] Data fetches from Convex API
- [ ] Mutations update data correctly
- [ ] UI matches web app design

### Verification Steps
1. Navigate through all screens
2. Create challenge → verify in Convex
3. Add entry → verify updates
4. Check leaderboard shows data

### Definition of Done
✅ All views render correctly  
✅ Navigation works  
✅ CRUD operations succeed  
✅ Design matches web app

**⚠️ DO NOT PROCEED TO TASK 3.6 UNTIL ALL VERIFICATION STEPS PASS**

---

## Task 3.6: Native Features

### Objective
Implement iOS-specific features: haptics, notifications, widgets.

### Detailed Steps

#### Step 3.6.1: Haptic Feedback
Add haptics to AddEntryView:
```swift
import UIKit

func triggerHaptic(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
    let generator = UIImpactFeedbackGenerator(style: style)
    generator.impactOccurred()
}

// On entry submit:
triggerHaptic(.heavy)
```

#### Step 3.6.2: Local Notifications
Request permission and schedule reminders.

#### Step 3.6.3: Home Screen Widget
Create WidgetKit extension showing today's progress.

### Expected Results
- [ ] Haptics fire on interactions
- [ ] Notifications can be scheduled
- [ ] Widget shows current data

### Verification Steps
1. Add entry → feel haptic
2. Schedule notification → verify it fires
3. Add widget to home screen → shows data

### Definition of Done
✅ Haptics on all interactions  
✅ Notifications working  
✅ Widget displays and updates

**⚠️ DO NOT PROCEED TO TASK 3.7 UNTIL ALL VERIFICATION STEPS PASS**

---

## Task 3.7: Testing & App Store

### Objective
Test thoroughly and prepare for App Store submission.

### Detailed Steps

#### Step 3.7.1: Unit Tests
Test ViewModels:
```swift
func testChallengeProgress() {
    let challenge = Challenge(/* ... */)
    let entries = [Entry(/* ... */)]
    let viewModel = ChallengeViewModel(challenge: challenge, entries: entries)
    
    XCTAssertEqual(viewModel.progress, 0.5)
}
```

#### Step 3.7.2: UI Tests
Test critical flows:
- Login flow
- Create challenge
- Add entry
- View leaderboard

#### Step 3.7.3: TestFlight
1. Archive app
2. Upload to App Store Connect
3. Add internal testers
4. Distribute beta

#### Step 3.7.4: App Store Submission
1. Complete app information
2. Add screenshots (all device sizes)
3. Write description
4. Set pricing (Free)
5. Submit for review

### Expected Results
- [ ] All tests pass
- [ ] TestFlight build available
- [ ] App Store listing complete

### Verification Steps
1. Run all unit tests → 100% pass
2. Run UI tests → all flows complete
3. Install TestFlight build on device
4. Submit to App Store

### Definition of Done
✅ Unit test coverage > 70%  
✅ UI tests for critical paths  
✅ TestFlight build distributed  
✅ App Store submission completed

---

# PROJECT 3 COMPLETION CHECKLIST

- [ ] Xcode project compiles and runs
- [ ] All data models created
- [ ] API integration working
- [ ] Authentication functional
- [ ] All views implemented
- [ ] Native features (haptics, notifications, widget)
- [ ] Tests written and passing
- [ ] TestFlight distributed
- [ ] App Store submission completed

**⚠️ PROJECT 3 IS NOT COMPLETE UNTIL ALL ITEMS ARE CHECKED**

---

# PROJECT 4: NATIVE ANDROID APP (Kotlin/Jetpack Compose)

## Project Overview
**Goal**: Build a native Android application with full feature parity to the web and iOS apps.

**Duration**: 3-4 weeks  
**Priority**: HIGH  
**Dependencies**: Projects 1 and 2 must be 100% complete

---

## Task 4.1: Android Studio Project Setup

### Objective
Create a new Android project with Jetpack Compose and proper architecture.

### Detailed Steps

#### Step 4.1.1: Create Project
1. Open Android Studio
2. New Project → Empty Compose Activity
3. Configure:
   - Name: Tally
   - Package: com.yourcompany.tally
   - Minimum SDK: API 26 (Android 8.0)
   - Build configuration language: Kotlin DSL

#### Step 4.1.2: Configure build.gradle.kts (app)
```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android")
    id("org.jetbrains.kotlin.plugin.serialization")
    kotlin("kapt")
}

android {
    namespace = "com.yourcompany.tally"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.yourcompany.tally"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
}

dependencies {
    // Compose
    implementation(platform("androidx.compose:compose-bom:2024.01.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.navigation:navigation-compose:2.7.6")
    
    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-kotlinx-serialization:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    
    // Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
    
    // Hilt DI
    implementation("com.google.dagger:hilt-android:2.50")
    kapt("com.google.dagger:hilt-compiler:2.50")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")
    
    // Room
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
    
    // DataStore
    implementation("androidx.datastore:datastore-preferences:1.0.0")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    
    // Coil for images
    implementation("io.coil-kt:coil-compose:2.5.0")
    
    // Confetti
    implementation("nl.dionsegijn:konfetti-compose:2.0.4")
}
```

#### Step 4.1.3: Set Up Project Structure
```
app/src/main/java/com/yourcompany/tally/
├── TallyApplication.kt
├── MainActivity.kt
├── di/
│   ├── AppModule.kt
│   └── NetworkModule.kt
├── data/
│   ├── model/
│   │   ├── Challenge.kt
│   │   ├── Entry.kt
│   │   └── User.kt
│   ├── remote/
│   │   ├── TallyApi.kt
│   │   └── dto/
│   ├── local/
│   │   ├── TallyDatabase.kt
│   │   └── dao/
│   └── repository/
│       ├── ChallengeRepository.kt
│       └── EntryRepository.kt
├── ui/
│   ├── navigation/
│   │   └── TallyNavigation.kt
│   ├── theme/
│   │   ├── Theme.kt
│   │   ├── Color.kt
│   │   └── Type.kt
│   ├── dashboard/
│   │   ├── DashboardScreen.kt
│   │   ├── DashboardViewModel.kt
│   │   └── components/
│   ├── challenge/
│   ├── entry/
│   ├── social/
│   └── auth/
└── util/
    ├── Extensions.kt
    └── StatsCalculator.kt
```

### Expected Results
- [ ] Project syncs without errors
- [ ] App builds and runs on emulator
- [ ] Dependencies resolved

### Verification Steps
```bash
# 1. Sync Gradle
# In Android Studio: File → Sync Project with Gradle Files

# 2. Build project
./gradlew assembleDebug

# 3. Run on emulator
# Click Run button or Shift+F10
```

### Definition of Done
✅ Gradle sync successful  
✅ Debug build succeeds  
✅ App runs on Android emulator  
✅ No dependency conflicts

**⚠️ DO NOT PROCEED TO TASK 4.2 UNTIL ALL VERIFICATION STEPS PASS**

---

## Task 4.2: Data Layer Implementation

### Objective
Create data models, API service, and repository pattern.

### Detailed Steps

#### Step 4.2.1: Create Data Models
Create `data/model/Challenge.kt`:
```kotlin
package com.yourcompany.tally.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class TimeframeUnit {
    @SerialName("year") YEAR,
    @SerialName("month") MONTH,
    @SerialName("custom") CUSTOM
}

@Serializable
data class Challenge(
    @SerialName("_id") val id: String,
    val userId: String,
    val name: String,
    val targetNumber: Int,
    val year: Int,
    val color: String,
    val icon: String,
    val timeframeUnit: TimeframeUnit,
    val startDate: String? = null,
    val endDate: String? = null,
    val isPublic: Boolean,
    val archived: Boolean,
    val createdAt: Long
)
```

Create `data/model/Entry.kt`:
```kotlin
@Serializable
enum class FeelingType {
    @SerialName("very-easy") VERY_EASY,
    @SerialName("easy") EASY,
    @SerialName("moderate") MODERATE,
    @SerialName("hard") HARD,
    @SerialName("very-hard") VERY_HARD
}

@Serializable
data class EntrySet(val reps: Int)

@Serializable
data class Entry(
    @SerialName("_id") val id: String,
    val userId: String,
    val challengeId: String,
    val date: String,
    val count: Int,
    val note: String? = null,
    val sets: List<EntrySet>? = null,
    val feeling: FeelingType? = null,
    val createdAt: Long
)
```

#### Step 4.2.2: Create API Service
Create `data/remote/TallyApi.kt`:
```kotlin
interface TallyApi {
    @POST("api/auth/user")
    suspend fun createOrGetUser(@Body request: CreateUserRequest): CreateUserResponse
    
    @GET("api/challenges")
    suspend fun getChallenges(@Query("userId") userId: String): List<Challenge>
    
    @POST("api/challenges")
    suspend fun createChallenge(@Body request: CreateChallengeRequest): CreateChallengeResponse
    
    @GET("api/entries")
    suspend fun getEntries(@Query("challengeId") challengeId: String): List<Entry>
    
    @POST("api/entries")
    suspend fun createEntry(@Body request: CreateEntryRequest): CreateEntryResponse
}
```

#### Step 4.2.3: Create Repository
Create `data/repository/ChallengeRepository.kt`:
```kotlin
@Singleton
class ChallengeRepository @Inject constructor(
    private val api: TallyApi,
    private val database: TallyDatabase
) {
    fun getChallenges(userId: String): Flow<List<Challenge>> = flow {
        // First emit cached data
        val cached = database.challengeDao().getByUser(userId)
        emit(cached)
        
        // Then fetch fresh data
        try {
            val fresh = api.getChallenges(userId)
            database.challengeDao().insertAll(fresh)
            emit(fresh)
        } catch (e: Exception) {
            // Keep cached data on error
        }
    }
    
    suspend fun createChallenge(request: CreateChallengeRequest): String {
        val response = api.createChallenge(request)
        return response.id
    }
}
```

### Expected Results
- [ ] All models compile
- [ ] API interface defined
- [ ] Repository pattern implemented

### Verification Steps
1. Build project → no compile errors
2. Write unit test for repository
3. Test API call in debug build

### Definition of Done
✅ All models created  
✅ API service configured  
✅ Repository with caching  
✅ Unit tests pass

**⚠️ DO NOT PROCEED TO TASK 4.3 UNTIL ALL VERIFICATION STEPS PASS**

---

## Task 4.3: Authentication

### Objective
Implement authentication using Clerk Android SDK or custom solution.

(Similar detailed steps as iOS Task 3.3)

---

## Task 4.4: UI Components

### Objective
Build all Jetpack Compose components matching the design.

### Detailed Steps

#### Step 4.4.1: Create Circular Progress
```kotlin
@Composable
fun CircularProgress(
    progress: Float,
    color: Color,
    modifier: Modifier = Modifier,
    strokeWidth: Dp = 12.dp
) {
    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = spring(dampingRatio = 0.8f)
    )
    
    Canvas(modifier = modifier) {
        // Background arc
        drawArc(
            color = color.copy(alpha = 0.2f),
            startAngle = 0f,
            sweepAngle = 360f,
            useCenter = false,
            style = Stroke(strokeWidth.toPx(), cap = StrokeCap.Round)
        )
        
        // Progress arc
        drawArc(
            color = color,
            startAngle = -90f,
            sweepAngle = 360f * animatedProgress,
            useCenter = false,
            style = Stroke(strokeWidth.toPx(), cap = StrokeCap.Round)
        )
    }
}
```

#### Step 4.4.2: Create Heatmap Calendar
```kotlin
@Composable
fun HeatmapCalendar(
    entries: List<Entry>,
    color: Color,
    startDate: LocalDate,
    endDate: LocalDate,
    modifier: Modifier = Modifier
) {
    val days = remember(startDate, endDate) {
        generateSequence(startDate) { it.plusDays(1) }
            .takeWhile { !it.isAfter(endDate) }
            .toList()
    }
    
    LazyVerticalGrid(
        columns = GridCells.Fixed(7),
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(2.dp),
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        items(days) { day ->
            val intensity = calculateIntensity(entries, day)
            Box(
                modifier = Modifier
                    .aspectRatio(1f)
                    .background(
                        color.copy(alpha = 0.1f + (intensity * 0.9f)),
                        RoundedCornerShape(2.dp)
                    )
            )
        }
    }
}
```

(Continue with remaining components similar to iOS)

---

## Task 4.5: Main Screens

(Dashboard, Challenge Detail, Add Entry, Leaderboard, Community - similar to iOS)

---

## Task 4.6: Native Features

### Detailed Steps

#### Step 4.6.1: Haptic Feedback
```kotlin
@Composable
fun rememberHapticFeedback(): HapticFeedback {
    val view = LocalView.current
    return remember {
        object : HapticFeedback {
            override fun performHapticFeedback(hapticFeedbackType: HapticFeedbackType) {
                view.performHapticFeedback(
                    when (hapticFeedbackType) {
                        HapticFeedbackType.LongPress -> HapticFeedbackConstants.LONG_PRESS
                        HapticFeedbackType.TextHandleMove -> HapticFeedbackConstants.TEXT_HANDLE_MOVE
                    }
                )
            }
        }
    }
}
```

#### Step 4.6.2: Notifications with WorkManager
#### Step 4.6.3: Home Screen Widget with Glance

---

## Task 4.7: Testing & Play Store

### Detailed Steps

#### Step 4.7.1: Unit Tests
```kotlin
@Test
fun `challenge progress calculates correctly`() {
    val challenge = Challenge(targetNumber = 100, /* ... */)
    val entries = listOf(Entry(count = 50, /* ... */))
    
    val progress = calculateProgress(challenge, entries)
    
    assertEquals(0.5f, progress)
}
```

#### Step 4.7.2: Compose UI Tests
```kotlin
@Test
fun dashboardShowsChallenges() {
    composeTestRule.setContent {
        DashboardScreen(challenges = testChallenges)
    }
    
    composeTestRule.onNodeWithText("Push-ups").assertIsDisplayed()
}
```

#### Step 4.7.3: Internal Testing Track
1. Generate signed APK/AAB
2. Upload to Play Console
3. Create internal testing track
4. Add testers

#### Step 4.7.4: Play Store Submission
1. Complete store listing
2. Add screenshots
3. Set content rating
4. Submit for review

### Definition of Done
✅ Unit tests pass  
✅ UI tests pass  
✅ Internal track published  
✅ Play Store submission completed

---

# PROJECT 4 COMPLETION CHECKLIST

- [ ] Android Studio project builds
- [ ] All data models and API
- [ ] Authentication working
- [ ] All UI components built
- [ ] All screens implemented
- [ ] Native features (haptics, notifications, widget)
- [ ] Tests passing
- [ ] Internal testing track
- [ ] Play Store submission

**⚠️ PROJECT 4 IS NOT COMPLETE UNTIL ALL ITEMS ARE CHECKED**

---

# PROJECT 5: CROSS-PLATFORM POLISH & LAUNCH

## Project Overview
**Goal**: Ensure feature parity, fix bugs, and prepare for public launch.

**Duration**: 1-2 weeks  
**Priority**: HIGH  
**Dependencies**: Projects 1-4 must be 100% complete

---

## Task 5.1: Feature Parity Verification

### Objective
Verify all features work identically across web, iOS, and Android.

### Detailed Steps

#### Step 5.1.1: Create Feature Matrix Test
Test each feature on all platforms:

| Feature | Web | iOS | Android | Notes |
|---------|-----|-----|---------|-------|
| GitHub Login | ⬜ | ⬜ | ⬜ | |
| Email Login | ⬜ | ⬜ | ⬜ | |
| Create Challenge | ⬜ | ⬜ | ⬜ | |
| Edit Challenge | ⬜ | ⬜ | ⬜ | |
| Archive Challenge | ⬜ | ⬜ | ⬜ | |
| Add Entry | ⬜ | ⬜ | ⬜ | |
| Edit Entry | ⬜ | ⬜ | ⬜ | |
| Delete Entry | ⬜ | ⬜ | ⬜ | |
| View Heatmap | ⬜ | ⬜ | ⬜ | |
| View Progress | ⬜ | ⬜ | ⬜ | |
| Weekly Summary | ⬜ | ⬜ | ⬜ | |
| Leaderboard | ⬜ | ⬜ | ⬜ | |
| Community | ⬜ | ⬜ | ⬜ | |
| Follow Challenge | ⬜ | ⬜ | ⬜ | |
| Export Data | ⬜ | ⬜ | ⬜ | |
| Import Data | ⬜ | ⬜ | ⬜ | |

### Expected Results
- [ ] All features work on all platforms
- [ ] Data syncs correctly between platforms
- [ ] UI is consistent

### Definition of Done
✅ All matrix items checked  
✅ No platform-specific bugs  
✅ Data syncs within 2 seconds

---

## Task 5.2: Bug Fixes

### Objective
Fix all identified issues from testing.

---

## Task 5.3: Performance Optimization

### Objective
Ensure apps meet performance targets.

### Metrics
- Web: LCP < 2.5s, FID < 100ms
- iOS: Cold start < 2s, 60fps scrolling
- Android: Cold start < 2s, 60fps scrolling

---

## Task 5.4: Launch Preparation

### Detailed Steps

#### Step 5.4.1: Marketing Materials
- [ ] App Store screenshots
- [ ] Play Store screenshots
- [ ] Feature graphic
- [ ] Promo video (optional)

#### Step 5.4.2: Documentation
- [ ] README updated
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Support email

#### Step 5.4.3: Monitoring Setup
- [ ] Sentry error tracking (all platforms)
- [ ] Analytics (web, mobile)
- [ ] Uptime monitoring

---

# PROJECT 5 COMPLETION CHECKLIST

- [ ] Feature parity verified
- [ ] All bugs fixed
- [ ] Performance targets met
- [ ] Marketing materials ready
- [ ] Documentation complete
- [ ] Monitoring configured
- [ ] Web app live on production domain
- [ ] iOS app approved on App Store
- [ ] Android app approved on Play Store

**⚠️ PROJECT 5 IS NOT COMPLETE UNTIL ALL ITEMS ARE CHECKED**

---

# FINAL LAUNCH CHECKLIST

Before announcing public availability:

- [ ] **Web**: https://tally.yourcompany.com accessible
- [ ] **iOS**: Available on App Store
- [ ] **Android**: Available on Play Store
- [ ] **Data**: All platforms share same Convex database
- [ ] **Auth**: Users can sign in on any platform
- [ ] **Sync**: Changes sync across all platforms
- [ ] **Monitoring**: Errors and metrics being tracked
- [ ] **Support**: Support channel ready

---

# SUMMARY

| Project | Duration | Key Deliverable |
|---------|----------|-----------------|
| Project 1 | 2-3 weeks | Next.js web app on Vercel |
| Project 2 | 3-4 days | HTTP API + documentation |
| Project 3 | 3-4 weeks | iOS app on App Store |
| Project 4 | 3-4 weeks | Android app on Play Store |
| Project 5 | 1-2 weeks | Feature parity + launch |

**Total: 10-14 weeks**

> **REMEMBER**: Continue each project until 100% complete. Do not leave any task unfinished. Verify all checklist items before proceeding. Debug and fix issues immediately. The goal is a polished, production-ready product on all platforms.
