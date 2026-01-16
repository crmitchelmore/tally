import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./users";

const challengeFields = {
  name: v.string(),
  targetNumber: v.number(),
  color: v.string(),
  icon: v.string(),
  timeframeUnit: v.union(v.literal("year"), v.literal("month"), v.literal("custom")),
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  year: v.number(),
  isPublic: v.boolean(),
};

export const create = mutation({
  args: { clerkId: v.string(), ...challengeFields },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);
    return await ctx.db.insert("challenges", {
      userId: user._id,
      name: args.name,
      targetNumber: args.targetNumber,
      color: args.color,
      icon: args.icon,
      timeframeUnit: args.timeframeUnit,
      startDate: args.startDate,
      endDate: args.endDate,
      year: args.year,
      isPublic: args.isPublic,
      archived: false,
      createdAt: Date.now(),
    });
  },
});

export const listActive = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);
    const today = new Date().toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();

    const all = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return all.filter((c) => {
      if (c.archived) return false;
      if (c.endDate && c.endDate < today) return false;
      if (!c.endDate && c.year < currentYear) return false;
      return true;
    });
  },
});

export const get = query({
  args: { clerkId: v.string(), challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) return null;
    if (challenge.userId !== user._id && !challenge.isPublic) return null;
    return challenge;
  },
});

export const update = mutation({
  args: {
    clerkId: v.string(),
    challengeId: v.id("challenges"),
    name: v.optional(v.string()),
    targetNumber: v.optional(v.number()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || challenge.userId !== user._id) {
      throw new Error("Challenge not found or not owned");
    }
    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.targetNumber !== undefined) updates.targetNumber = args.targetNumber;
    if (args.color !== undefined) updates.color = args.color;
    if (args.icon !== undefined) updates.icon = args.icon;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
    if (args.archived !== undefined) updates.archived = args.archived;
    await ctx.db.patch(args.challengeId, updates);
  },
});

export const archive = mutation({
  args: { clerkId: v.string(), challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || challenge.userId !== user._id) {
      throw new Error("Challenge not found or not owned");
    }
    await ctx.db.patch(args.challengeId, { archived: true });
  },
});

export const remove = mutation({
  args: { clerkId: v.string(), challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || challenge.userId !== user._id) {
      throw new Error("Challenge not found or not owned");
    }
    const entries = await ctx.db
      .query("entries")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();
    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }
    const follows = await ctx.db
      .query("followedChallenges")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();
    for (const follow of follows) {
      await ctx.db.delete(follow._id);
    }
    await ctx.db.delete(args.challengeId);
  },
});

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();
  },
});
