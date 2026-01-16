import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./users";

export const bulkImport = mutation({
  args: {
    clerkId: v.string(),
    challenges: v.array(v.object({
      id: v.string(),
      name: v.string(),
      targetNumber: v.number(),
      color: v.string(),
      icon: v.string(),
      timeframeUnit: v.union(v.literal("year"), v.literal("month"), v.literal("custom")),
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      year: v.number(),
      isPublic: v.boolean(),
      archived: v.boolean(),
      createdAt: v.number(),
    })),
    entries: v.array(v.object({
      challengeId: v.string(),
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
    })),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);

    const existingEntries = await ctx.db
      .query("entries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const entry of existingEntries) {
      await ctx.db.delete(entry._id);
    }

    const existingChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const challenge of existingChallenges) {
      await ctx.db.delete(challenge._id);
    }

    const existingFollows = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const follow of existingFollows) {
      await ctx.db.delete(follow._id);
    }

    const challengeIdMap = new Map<string, string>();

    for (const c of args.challenges) {
      const newId = await ctx.db.insert("challenges", {
        userId: user._id,
        name: c.name,
        targetNumber: c.targetNumber,
        color: c.color,
        icon: c.icon,
        timeframeUnit: c.timeframeUnit,
        startDate: c.startDate,
        endDate: c.endDate,
        year: c.year,
        isPublic: c.isPublic,
        archived: c.archived,
        createdAt: c.createdAt,
      });
      challengeIdMap.set(c.id, newId);
    }

    for (const e of args.entries) {
      const newChallengeId = challengeIdMap.get(e.challengeId);
      if (!newChallengeId) continue;

      await ctx.db.insert("entries", {
        userId: user._id,
        challengeId: newChallengeId as Id<"challenges">,
        date: e.date,
        count: e.count,
        note: e.note,
        sets: e.sets,
        feeling: e.feeling,
        createdAt: e.createdAt,
      });
    }

    return {
      challengesImported: args.challenges.length,
      entriesImported: args.entries.length,
    };
  },
});

export const clearAllData = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);

    const entries = await ctx.db
      .query("entries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }

    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const challenge of challenges) {
      await ctx.db.delete(challenge._id);
    }

    const follows = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const follow of follows) {
      await ctx.db.delete(follow._id);
    }

    return { cleared: true };
  },
});

export const exportData = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);

    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const entries = await ctx.db
      .query("entries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      exportedAt: new Date().toISOString(),
      challenges: challenges.map((c) => ({
        id: c._id,
        name: c.name,
        targetNumber: c.targetNumber,
        color: c.color,
        icon: c.icon,
        timeframeUnit: c.timeframeUnit,
        startDate: c.startDate,
        endDate: c.endDate,
        year: c.year,
        isPublic: c.isPublic,
        archived: c.archived,
        createdAt: c.createdAt,
      })),
      entries: entries.map((e) => ({
        challengeId: e.challengeId,
        date: e.date,
        count: e.count,
        note: e.note,
        sets: e.sets,
        feeling: e.feeling,
        createdAt: e.createdAt,
      })),
    };
  },
});
