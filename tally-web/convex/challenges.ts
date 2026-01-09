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
      Object.entries(updates).filter(([, val]) => val !== undefined)
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

export const remove = mutation({
  args: { id: v.id("challenges") },
  handler: async (ctx, args) => {
    // First delete all entries for this challenge
    const entries = await ctx.db
      .query("entries")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.id))
      .collect();
    
    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }
    
    // Delete all follows for this challenge
    const follows = await ctx.db
      .query("followedChallenges")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.id))
      .collect();
    
    for (const follow of follows) {
      await ctx.db.delete(follow._id);
    }
    
    // Delete the challenge
    await ctx.db.delete(args.id);
  },
});
