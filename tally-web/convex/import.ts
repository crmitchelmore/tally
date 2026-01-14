import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireCurrentUser } from "./lib/auth";

/**
 * Check if the current user has any existing data.
 * Used before migration to determine if there's a conflict.
 */
export const checkExistingData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { hasData: false, challengeCount: 0, entryCount: 0 };
    }

    const clerkId = identity.subject;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return { hasData: false, challengeCount: 0, entryCount: 0 };
    }

    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const entries = await ctx.db
      .query("entries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      hasData: challenges.length > 0 || entries.length > 0,
      challengeCount: challenges.length,
      entryCount: entries.length,
    };
  },
});

/**
 * Bulk import challenges and entries.
 * This will clear existing data for the user and replace with imported data.
 */
export const bulkImport = mutation({
  args: {
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
    // Require authentication
    const user = await requireCurrentUser(ctx);
    const userId = user._id;

    // 1. Delete all existing entries for this user
    const existingEntries = await ctx.db
      .query("entries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const entry of existingEntries) {
      await ctx.db.delete(entry._id);
    }

    // 2. Delete all existing challenges for this user
    const existingChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const challenge of existingChallenges) {
      await ctx.db.delete(challenge._id);
    }

    // 3. Delete all follows for this user
    const existingFollows = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const follow of existingFollows) {
      await ctx.db.delete(follow._id);
    }

    // 4. Create new challenges and build ID mapping
    // Map from original challenge ID (string) to new Convex ID
    const challengeIdMap = new Map<string, string>();

    for (const challenge of args.challenges) {
      const newId = await ctx.db.insert("challenges", {
        userId,
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
        userId,
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
  args: {},
  handler: async (ctx) => {
    // Require authentication
    const user = await requireCurrentUser(ctx);
    const userId = user._id;

    // Delete all entries for this user
    const entries = await ctx.db
      .query("entries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }

    // Delete all challenges for this user
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const challenge of challenges) {
      await ctx.db.delete(challenge._id);
    }

    // Delete all follows for this user
    const follows = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
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

/**
 * Migrate local-only data to a synced account.
 * This is specifically for the local-only → synced migration flow.
 *
 * Accepts TallyExportPayload format with UUIDs as IDs.
 * Returns mapping from UUIDs to new Convex IDs.
 */
export const migrateFromLocal = mutation({
  args: {
    schemaVersion: v.string(),
    challenges: v.array(
      v.object({
        id: v.string(), // UUID from local storage
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
        updatedAt: v.number(),
      })
    ),
    entries: v.array(
      v.object({
        id: v.string(), // UUID from local storage
        challengeId: v.string(), // UUID referencing a challenge
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
        updatedAt: v.number(),
      })
    ),
    // Strategy for handling existing cloud data
    strategy: v.optional(
      v.union(
        v.literal("replace"), // Clear existing cloud data, use local
        v.literal("skip") // Skip if cloud has data (fail fast)
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const userId = user._id;
    const strategy = args.strategy ?? "replace";

    // Check for existing data
    const existingChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (existingChallenges.length > 0 && strategy === "skip") {
      return {
        success: false,
        error: "User already has cloud data. Use strategy 'replace' to overwrite.",
        challengesImported: 0,
        entriesImported: 0,
      };
    }

    // If replacing, clear existing data first
    if (strategy === "replace" && existingChallenges.length > 0) {
      // Delete entries
      const existingEntries = await ctx.db
        .query("entries")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      for (const entry of existingEntries) {
        await ctx.db.delete(entry._id);
      }

      // Delete challenges
      for (const challenge of existingChallenges) {
        await ctx.db.delete(challenge._id);
      }

      // Delete follows
      const existingFollows = await ctx.db
        .query("followedChallenges")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      for (const follow of existingFollows) {
        await ctx.db.delete(follow._id);
      }
    }

    // Create challenges and build UUID → Convex ID mapping
    const challengeIdMap = new Map<string, string>();

    for (const challenge of args.challenges) {
      const newId = await ctx.db.insert("challenges", {
        userId,
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
        createdAt: challenge.createdAt,
      });
      challengeIdMap.set(challenge.id, newId);
    }

    // Create entries with mapped challenge IDs
    const entryIdMap = new Map<string, string>();
    let entriesSkipped = 0;

    for (const entry of args.entries) {
      const convexChallengeId = challengeIdMap.get(entry.challengeId);
      if (!convexChallengeId) {
        entriesSkipped++;
        continue;
      }

      const newId = await ctx.db.insert("entries", {
        userId,
        challengeId: convexChallengeId as Id<"challenges">,
        date: entry.date,
        count: entry.count,
        note: entry.note,
        sets: entry.sets,
        feeling: entry.feeling,
        createdAt: entry.createdAt,
      });
      entryIdMap.set(entry.id, newId);
    }

    return {
      success: true,
      challengesImported: args.challenges.length,
      entriesImported: args.entries.length - entriesSkipped,
      entriesSkipped,
      idMappings: {
        challenges: Object.fromEntries(challengeIdMap),
        entries: Object.fromEntries(entryIdMap),
      },
    };
  },
});
