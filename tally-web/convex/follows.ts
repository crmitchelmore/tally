import { requireOwner, requireChallengeOwner } from "./access";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Helper to check if a record is not soft-deleted
function isNotDeleted<T extends { deletedAt?: number }>(doc: T): boolean {
  return doc.deletedAt === undefined;
}

// Helper to convert Convex doc to API format
function toApiFormat(follow: Doc<"follows">) {
  return {
    id: follow._id,
    userId: follow.userId,
    challengeId: follow.challengeId,
    createdAt: new Date(follow.createdAt).toISOString(),
  };
}

/**
 * List follows by user ID (excluding soft-deleted)
 */
export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.userId);
    return [] as ReturnType<typeof toApiFormat>[];
  },
});

/**
 * Get follower count for a challenge (excluding soft-deleted)
 */
export const getFollowerCount = query({
  args: { challengeId: v.string() },
  handler: async (ctx, args) => {
    await requireChallengeOwner(ctx, args.challengeId);
    return 0;
  },
});

/**
 * Check if a user is following a challenge (excluding soft-deleted)
 */
export const isFollowing = query({
  args: {
    userId: v.string(),
    challengeId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.userId);
    return false;
  },
});

/**
 * Follow a challenge (restores if previously soft-deleted, otherwise creates new)
 */
export const follow = mutation({
  args: {
    userId: v.string(),
    challengeId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.userId);
    throw new Error("Community sharing is unavailable");
  },
});

/**
 * Soft delete (unfollow) a challenge
 */
export const unfollow = mutation({
  args: {
    userId: v.string(),
    challengeId: v.string(),
    deletedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.userId);
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_user_challenge", (q) =>
        q.eq("userId", args.userId).eq("challengeId", args.challengeId)
      )
      .first();

    if (follow && isNotDeleted(follow)) {
      const now = Date.now();
      await ctx.db.patch(follow._id, { 
        deletedAt: now,
        deletedBy: args.deletedBy,
      });
      return { success: true, deletedAt: now };
    }

    return { success: false };
  },
});
