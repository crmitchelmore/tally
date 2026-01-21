import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

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
 * List follows by user ID
 */
export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    return follows.map(toApiFormat);
  },
});

/**
 * Get follower count for a challenge
 */
export const getFollowerCount = query({
  args: { challengeId: v.string() },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_challenge_id", (q) => q.eq("challengeId", args.challengeId))
      .collect();
    return follows.length;
  },
});

/**
 * Check if a user is following a challenge
 */
export const isFollowing = query({
  args: {
    userId: v.string(),
    challengeId: v.string(),
  },
  handler: async (ctx, args) => {
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_user_challenge", (q) =>
        q.eq("userId", args.userId).eq("challengeId", args.challengeId)
      )
      .first();
    return follow !== null;
  },
});

/**
 * Follow a challenge
 */
export const follow = mutation({
  args: {
    userId: v.string(),
    challengeId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if already following
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_user_challenge", (q) =>
        q.eq("userId", args.userId).eq("challengeId", args.challengeId)
      )
      .first();

    if (existing) {
      return toApiFormat(existing);
    }

    const followId = await ctx.db.insert("follows", {
      userId: args.userId,
      challengeId: args.challengeId,
      createdAt: Date.now(),
    });
    const follow = await ctx.db.get(followId);
    if (!follow) throw new Error("Failed to create follow");
    return toApiFormat(follow);
  },
});

/**
 * Unfollow a challenge
 */
export const unfollow = mutation({
  args: {
    userId: v.string(),
    challengeId: v.string(),
  },
  handler: async (ctx, args) => {
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_user_challenge", (q) =>
        q.eq("userId", args.userId).eq("challengeId", args.challengeId)
      )
      .first();

    if (follow) {
      await ctx.db.delete(follow._id);
      return { success: true };
    }

    return { success: false };
  },
});
