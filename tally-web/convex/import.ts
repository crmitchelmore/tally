import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Bulk import challenges and entries.
 * This will clear existing data for the user and replace with imported data.
 */
export const bulkImport = mutation({
  args: {
    userId: v.id("users"),
    challenges: v.array(
      v.object({
        id: v.string(), // Original ID from export (used to map entries)
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
      })
    ),
    entries: v.array(
      v.object({
        challengeId: v.string(), // Original challenge ID from export
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
      })
    ),
  },
  handler: async (ctx, args) => {
    // 1. Delete all existing entries for this user
    const existingEntries = await ctx.db
      .query("entries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const entry of existingEntries) {
      await ctx.db.delete(entry._id);
    }

    // 2. Delete all existing challenges for this user
    const existingChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const challenge of existingChallenges) {
      await ctx.db.delete(challenge._id);
    }

    // 3. Delete all follows for this user
    const existingFollows = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const follow of existingFollows) {
      await ctx.db.delete(follow._id);
    }

    // 4. Create new challenges and build ID mapping
    // Map from original challenge ID (string) to new Convex ID
    const challengeIdMap = new Map<string, string>();

    for (const challenge of args.challenges) {
      const newId = await ctx.db.insert("challenges", {
        userId: args.userId,
        name: challenge.name,
        targetNumber: challenge.targetNumber,
        year: challenge.year,
        color: challenge.color,
        icon: challenge.icon,
        timeframeUnit: challenge.timeframeUnit,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        isPublic: challenge.isPublic,
        archived: challenge.archived,
        createdAt: Date.now(),
      });

      challengeIdMap.set(challenge.id, newId);
    }

    // 5. Create new entries with mapped challenge IDs
    let entriesCreated = 0;
    for (const entry of args.entries) {
      const newChallengeIdStr = challengeIdMap.get(entry.challengeId);
      if (!newChallengeIdStr) {
        // Skip entries for challenges that weren't imported
        continue;
      }

      await ctx.db.insert("entries", {
        userId: args.userId,
        challengeId: newChallengeIdStr as Id<"challenges">,
        date: entry.date,
        count: entry.count,
        note: entry.note,
        sets: entry.sets,
        feeling: entry.feeling,
        createdAt: Date.now(),
      });
      entriesCreated++;
    }

    return {
      challengesCreated: args.challenges.length,
      entriesCreated,
    };
  },
});

/**
 * Clear all data for a user.
 */
export const clearAllData = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Delete all entries for this user
    const entries = await ctx.db
      .query("entries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }

    // Delete all challenges for this user
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const challenge of challenges) {
      await ctx.db.delete(challenge._id);
    }

    // Delete all follows for this user
    const follows = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const follow of follows) {
      await ctx.db.delete(follow._id);
    }

    return {
      entriesDeleted: entries.length,
      challengesDeleted: challenges.length,
      followsDeleted: follows.length,
    };
  },
});
