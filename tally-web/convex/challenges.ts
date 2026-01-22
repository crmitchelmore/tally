import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Helper to check if a record is not soft-deleted
function isNotDeleted<T extends { deletedAt?: number }>(doc: T): boolean {
  return doc.deletedAt === undefined;
}

// Helper to convert Convex doc to API format
function toApiFormat(challenge: Doc<"challenges">) {
  return {
    id: challenge._id,
    userId: challenge.userId,
    name: challenge.name,
    target: challenge.target,
    timeframeType: challenge.timeframeType,
    startDate: challenge.startDate,
    endDate: challenge.endDate,
    color: challenge.color,
    icon: challenge.icon,
    isPublic: challenge.isPublic,
    isArchived: challenge.isArchived,
    countType: challenge.countType,
    unitLabel: challenge.unitLabel,
    defaultIncrement: challenge.defaultIncrement,
    createdAt: new Date(challenge.createdAt).toISOString(),
    updatedAt: new Date(challenge.updatedAt || challenge.createdAt).toISOString(),
  };
}

/**
 * List challenges by user ID (excluding soft-deleted)
 */
export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    return challenges.filter(isNotDeleted).map(toApiFormat);
  },
});

/**
 * List active (non-archived) challenges by user ID (excluding soft-deleted)
 */
export const listActive = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const now = new Date().toISOString().split("T")[0];
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_user_archived", (q) =>
        q.eq("userId", args.userId).eq("isArchived", false)
      )
      .collect();
    
    // Filter by end date and exclude soft-deleted
    return challenges
      .filter((c) => isNotDeleted(c) && c.endDate >= now)
      .map(toApiFormat);
  },
});

/**
 * Get public challenges (for community) - excluding soft-deleted
 */
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString().split("T")[0];
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_public", (q) =>
        q.eq("isPublic", true).eq("isArchived", false)
      )
      .collect();
    
    // Filter by end date and exclude soft-deleted
    return challenges
      .filter((c) => isNotDeleted(c) && c.endDate >= now)
      .map(toApiFormat);
  },
});

/**
 * Get a challenge by ID (returns null if soft-deleted)
 */
export const get = query({
  args: { id: v.id("challenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.id);
    if (!challenge || !isNotDeleted(challenge)) return null;
    return toApiFormat(challenge);
  },
});

/**
 * Get a challenge by ID including soft-deleted (for ownership verification)
 */
export const getIncludingDeleted = query({
  args: { id: v.id("challenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.id);
    if (!challenge) return null;
    return {
      ...toApiFormat(challenge),
      deletedAt: challenge.deletedAt,
    };
  },
});

/**
 * Create a new challenge
 */
export const create = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    target: v.number(),
    timeframeType: v.union(v.literal("year"), v.literal("month"), v.literal("custom")),
    startDate: v.string(),
    endDate: v.string(),
    color: v.string(),
    icon: v.string(),
    isPublic: v.boolean(),
    countType: v.optional(v.union(v.literal("simple"), v.literal("sets"), v.literal("custom"))),
    unitLabel: v.optional(v.string()),
    defaultIncrement: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const challengeId = await ctx.db.insert("challenges", {
      userId: args.userId,
      name: args.name,
      target: args.target,
      timeframeType: args.timeframeType,
      startDate: args.startDate,
      endDate: args.endDate,
      color: args.color,
      icon: args.icon,
      isPublic: args.isPublic,
      isArchived: false,
      countType: args.countType,
      unitLabel: args.unitLabel,
      defaultIncrement: args.defaultIncrement,
      createdAt: now,
      updatedAt: now,
    });
    const challenge = await ctx.db.get(challengeId);
    if (!challenge) throw new Error("Failed to create challenge");
    return toApiFormat(challenge);
  },
});

/**
 * Update a challenge
 */
export const update = mutation({
  args: {
    id: v.id("challenges"),
    name: v.optional(v.string()),
    target: v.optional(v.number()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    const challenge = await ctx.db.get(id);
    if (!challenge) throw new Error("Challenge not found");
    return toApiFormat(challenge);
  },
});

/**
 * Soft delete a challenge and cascade to related entries and follows
 */
export const remove = mutation({
  args: { 
    id: v.id("challenges"),
    deletedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Soft delete all entries for this challenge
    const entries = await ctx.db
      .query("entries")
      .withIndex("by_challenge_id", (q) => q.eq("challengeId", args.id))
      .collect();
    
    for (const entry of entries) {
      if (isNotDeleted(entry)) {
        await ctx.db.patch(entry._id, { 
          deletedAt: now,
          deletedBy: args.deletedBy,
        });
      }
    }

    // Soft delete all follows for this challenge
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_challenge_id", (q) => q.eq("challengeId", args.id))
      .collect();
    
    for (const follow of follows) {
      if (isNotDeleted(follow)) {
        await ctx.db.patch(follow._id, { 
          deletedAt: now,
          deletedBy: args.deletedBy,
        });
      }
    }

    // Soft delete the challenge
    await ctx.db.patch(args.id, { 
      deletedAt: now,
      deletedBy: args.deletedBy,
    });
    
    return { success: true, deletedAt: now };
  },
});

/**
 * Restore a soft-deleted challenge and its related entries/follows
 * Validates ownership before restoring
 */
export const restore = mutation({
  args: { 
    id: v.id("challenges"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.id);
    if (!challenge) throw new Error("Challenge not found");
    
    // Validate ownership before any mutation
    if (challenge.userId !== args.userId) {
      throw new Error("Access denied: not owner");
    }
    
    const challengeDeletedAt = challenge.deletedAt;
    if (!challengeDeletedAt) {
      return toApiFormat(challenge); // Already not deleted
    }
    
    // Restore the challenge
    await ctx.db.patch(args.id, { 
      deletedAt: undefined,
      deletedBy: undefined,
    });
    
    // Restore entries that were deleted at the same time (cascade restore)
    const entries = await ctx.db
      .query("entries")
      .withIndex("by_challenge_id", (q) => q.eq("challengeId", args.id))
      .collect();
    
    for (const entry of entries) {
      if (entry.deletedAt === challengeDeletedAt) {
        await ctx.db.patch(entry._id, { 
          deletedAt: undefined,
          deletedBy: undefined,
        });
      }
    }

    // Restore follows that were deleted at the same time
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_challenge_id", (q) => q.eq("challengeId", args.id))
      .collect();
    
    for (const follow of follows) {
      if (follow.deletedAt === challengeDeletedAt) {
        await ctx.db.patch(follow._id, { 
          deletedAt: undefined,
          deletedBy: undefined,
        });
      }
    }
    
    const restored = await ctx.db.get(args.id);
    if (!restored) throw new Error("Challenge not found after restore");
    return toApiFormat(restored);
  },
});
