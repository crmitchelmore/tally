# Security Patterns for Tally

This document describes the security patterns and best practices used in Tally's codebase.

## Authentication & Authorization

### Overview

Tally uses a layered security approach:
1. **Clerk** handles authentication (who you are)
2. **Convex auth helpers** handle authorization (what you can do)
3. **Next.js proxy** adds security headers

### Convex Auth Helpers

All authorization logic is centralized in `convex/lib/auth.ts`. **Always use these helpers instead of manual auth checks.**

#### Available Helpers

```typescript
import {
  requireAuth,           // Get authenticated user identity or throw
  getCurrentUser,        // Get current user (null if not logged in)
  requireCurrentUser,    // Get current user or throw
  assertOwner,           // Verify ownership of a resource
  assertChallengeOwner,  // Verify ownership of a challenge
  assertEntryOwner,      // Verify ownership of an entry
  canAccessChallenge,    // Check if user can access a challenge
} from "./lib/auth";
```

#### Usage Patterns

##### Mutations (always require auth)

```typescript
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // ✅ Get authenticated user - throws if not logged in
    const user = await requireCurrentUser(ctx);
    
    return await ctx.db.insert("challenges", {
      ...args,
      userId: user._id,  // Use authenticated user's ID
    });
  },
});
```

##### Updates/Deletes (verify ownership)

```typescript
export const update = mutation({
  args: { id: v.id("challenges"), name: v.string() },
  handler: async (ctx, args) => {
    // ✅ Verify ownership before update
    await assertChallengeOwner(ctx, args.id);
    
    await ctx.db.patch(args.id, { name: args.name });
  },
});
```

##### Queries (graceful handling)

```typescript
export const get = query({
  args: { id: v.id("challenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.id);
    if (!challenge) return null;
    
    // ✅ Check access permissions (returns boolean)
    const hasAccess = await canAccessChallenge(ctx, args.id);
    if (!hasAccess) return null;
    
    return challenge;
  },
});
```

### Anti-Patterns (Don't Do This)

```typescript
// ❌ BAD: Trusting client-provided userId
export const create = mutation({
  args: { userId: v.id("users"), name: v.string() },
  handler: async (ctx, args) => {
    // Attacker can pass any userId!
    return await ctx.db.insert("challenges", args);
  },
});

// ❌ BAD: No ownership check before update
export const update = mutation({
  args: { id: v.id("challenges"), name: v.string() },
  handler: async (ctx, args) => {
    // Anyone can update any challenge!
    await ctx.db.patch(args.id, { name: args.name });
  },
});

// ❌ BAD: Manual auth check (inconsistent)
export const remove = mutation({
  args: { id: v.id("challenges") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not logged in");
    // Missing ownership check!
    await ctx.db.delete(args.id);
  },
});
```

## Security Headers

The Next.js proxy (`src/proxy.ts`) adds the following security headers to all responses:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer info |
| `Permissions-Policy` | `camera=(), microphone=()...` | Disable unused APIs |
| `Strict-Transport-Security` | `max-age=31536000...` | Enforce HTTPS |
| `Content-Security-Policy` | (see below) | Prevent XSS |

### Content Security Policy

The CSP is configured to allow:
- Self-hosted scripts and styles
- Clerk authentication domains
- Convex backend connections
- Sentry error reporting
- LaunchDarkly feature flags

## Secret Management

### Environment Variables

- All secrets stored in `.env` (gitignored)
- Never commit secrets to git
- Use environment-specific variables in CI/CD

### Rotation Schedule

| Secret Type | Rotation Frequency |
|-------------|-------------------|
| LaunchDarkly keys | After any exposure |
| API tokens | Quarterly |
| Deploy keys | Annually |

## Input Validation

All Convex functions use `v` validators for type-safe input validation:

```typescript
export const create = mutation({
  args: {
    name: v.string(),           // Required string
    count: v.number(),          // Required number
    note: v.optional(v.string()), // Optional string
    status: v.union(            // Enum
      v.literal("active"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    // args is fully typed and validated
  },
});
```

## Security Checklist

When adding new features, verify:

- [ ] Mutations use `requireCurrentUser()` for auth
- [ ] Resource access checks use `assertOwner()` or similar
- [ ] No client-provided `userId` in mutations
- [ ] Queries return `null` for unauthorized access (don't throw)
- [ ] Sensitive data isn't logged
- [ ] New environment variables are documented
