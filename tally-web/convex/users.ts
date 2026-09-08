import { requireOwner, requireUserOwner } from "./access";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Helper to check if a record is not soft-deleted
function isNotDeleted<T extends { deletedAt?: number }>(doc: T): boolean {
  return doc.deletedAt === undefined;
}

// Helper to convert user doc to API format
function toApiFormat(user: Doc<"users">) {
  return {
    id: user._id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    dashboardConfig: user.dashboardConfig,
    createdAt: new Date(user.createdAt).toISOString(),
    updatedAt: new Date(user.updatedAt || user.createdAt).toISOString(),
  };
}

/**
 * Get user by Clerk ID (excludes soft-deleted)
 */
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.clerkId);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user || !isNotDeleted(user)) return null;
    
    return toApiFormat(user);
  },
});

/**
 * Create a new user
 */
export const create = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.clerkId);
    const existing = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", args.clerkId)).first();
    if (existing && existing.deletedAt === undefined) return toApiFormat(existing);
    if (existing) throw new Error("Account is deleted");
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      createdAt: now,
      updatedAt: now,
    });
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Failed to create user");
    
    return toApiFormat(user);
  },
});

/**
 * Update a user
 */
export const update = mutation({
  args: {
    id: v.id("users"),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUserOwner(ctx, args.id);
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    const user = await ctx.db.get(id);
    if (!user) throw new Error("User not found");
    
    return toApiFormat(user);
  },
});

/**
 * Soft delete a user
 */
export const remove = mutation({
  args: { 
    id: v.id("users"),
    deletedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUserOwner(ctx, args.id);
    const now = Date.now();
    await ctx.db.patch(args.id, { 
      deletedAt: now,
      deletedBy: args.deletedBy,
    });
    return { success: true, deletedAt: now };
  },
});

/**
 * Restore a soft-deleted user
 */
export const restore = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserOwner(ctx, args.id);
    await ctx.db.patch(args.id, { 
      deletedAt: undefined,
      deletedBy: undefined,
    });
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found after restore");
    return toApiFormat(user);
  },
});

/**
 * Update user preferences (dashboard config, etc.)
 */
export const updatePreferences = mutation({
  args: {
    id: v.id("users"),
  dashboardConfig: v.optional(v.object({
    panels: v.object({
      highlights: v.boolean(),
      personalRecords: v.boolean(),
      progressGraph: v.boolean(),
      burnUpChart: v.boolean(),
      setsStats: v.boolean(),
    }),
    visible: v.optional(v.array(
      v.union(
        v.literal("activeChallenges"),
        v.literal("highlights"),
        v.literal("personalRecords"),
        v.literal("progressGraph"),
        v.literal("burnUpChart")
      )
    )),
    hidden: v.optional(v.array(
      v.union(
        v.literal("activeChallenges"),
        v.literal("highlights"),
        v.literal("personalRecords"),
        v.literal("progressGraph"),
        v.literal("burnUpChart")
      )
    )),
    order: v.optional(v.array(
      v.union(
        v.literal("activeChallenges"),
        v.literal("highlights"),
        v.literal("personalRecords"),
        v.literal("progressGraph"),
        v.literal("burnUpChart")
      )
    )),
  })),
  },
  handler: async (ctx, args) => {
    await requireUserOwner(ctx, args.id);
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    const user = await ctx.db.get(id);
    if (!user) throw new Error("User not found");
    
    return toApiFormat(user);
  },
});

/** Permanent deletion, including records previously moved to Trash. No user ID is accepted from the caller. */
export const deleteOwnAccountData = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");
    const users = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject)).collect();
    const ownerIds = new Set([identity.subject, ...users.map(user => String(user._id))]);
    for (const userId of ownerIds) {
      const challenges = await ctx.db.query("challenges").withIndex("by_user_id", q => q.eq("userId", userId)).collect();
      for (const challenge of challenges) {
        const entries = await ctx.db.query("entries").withIndex("by_challenge_id", q => q.eq("challengeId", String(challenge._id))).collect();
        const follows = await ctx.db.query("follows").withIndex("by_challenge_id", q => q.eq("challengeId", String(challenge._id))).collect();
        const reports = await ctx.db.query("moderationReports").withIndex("by_challenge", q => q.eq("challengeId", challenge._id)).collect();
        for (const record of [...entries, ...follows, ...reports]) await ctx.db.delete(record._id);
        await ctx.db.delete(challenge._id);
      }
      const entries = await ctx.db.query("entries").withIndex("by_user_id", q => q.eq("userId", userId)).collect();
      const follows = await ctx.db.query("follows").withIndex("by_user_id", q => q.eq("userId", userId)).collect();
      for (const record of [...entries, ...follows]) await ctx.db.delete(record._id);
    }
    for (const userId of ownerIds) {
      const reports = await ctx.db.query("moderationReports").withIndex("by_reporter_created", q => q.eq("reporterId", userId)).collect();
      const blocks = await ctx.db.query("userBlocks").withIndex("by_user_blocked", q => q.eq("userId", userId)).collect();
      const blockedBy = await ctx.db.query("userBlocks").withIndex("by_blocked", q => q.eq("blockedUserId", userId)).collect();
      for (const record of [...reports, ...blocks, ...blockedBy]) await ctx.db.delete(record._id);
    }
    for (const user of users) await ctx.db.delete(user._id);
    return { success: true };
  },
});
