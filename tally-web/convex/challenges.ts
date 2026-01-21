import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

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
 * List challenges by user ID
 */
export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    return challenges.map(toApiFormat);
  },
});

/**
 * List active (non-archived) challenges by user ID
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
    
    // Filter by end date (challenges that haven't ended yet)
    return challenges
      .filter((c) => c.endDate >= now)
      .map(toApiFormat);
  },
});

/**
 * Get public challenges (for community)
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
    
    // Filter by end date (challenges that haven't ended yet)
    return challenges
      .filter((c) => c.endDate >= now)
      .map(toApiFormat);
  },
});

/**
 * Get a challenge by ID
 */
export const get = query({
  args: { id: v.id("challenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.id);
    return challenge ? toApiFormat(challenge) : null;
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
 * Delete a challenge and all related entries and follows
 */
export const remove = mutation({
  args: { id: v.id("challenges") },
  handler: async (ctx, args) => {
    // Delete all entries for this challenge
    const entries = await ctx.db
      .query("entries")
      .withIndex("by_challenge_id", (q) => q.eq("challengeId", args.id))
      .collect();
    
    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }

    // Delete all follows for this challenge
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_challenge_id", (q) => q.eq("challengeId", args.id))
      .collect();
    
    for (const follow of follows) {
      await ctx.db.delete(follow._id);
    }

    // Delete the challenge
    await ctx.db.delete(args.id);
    
    return { success: true };
  },
});
