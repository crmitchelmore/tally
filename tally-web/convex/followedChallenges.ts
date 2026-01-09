import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { id: v.id("followedChallenges") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: { id: v.id("followedChallenges") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Get the full challenge data for each followed challenge
    const challenges = await Promise.all(
      follows.map(async (follow) => {
        const challenge = await ctx.db.get(follow.challengeId);
        if (!challenge) return null;
        return {
          ...challenge,
          followedAt: follow.followedAt,
        };
      })
    );
    
    return challenges.filter((c) => c !== null);
  },
});

export const isFollowing = query({
  args: {
    userId: v.id("users"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("challengeId"), args.challengeId))
      .unique();
    
    return existing !== null;
  },
});

export const follow = mutation({
  args: {
    userId: v.id("users"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    // Check if already following
    const existing = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("challengeId"), args.challengeId))
      .unique();
    
    if (existing) {
      return existing._id;
    }
    
    return await ctx.db.insert("followedChallenges", {
      userId: args.userId,
      challengeId: args.challengeId,
      followedAt: Date.now(),
    });
  },
});

export const unfollow = mutation({
  args: {
    userId: v.id("users"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("challengeId"), args.challengeId))
      .unique();
    
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getFollowerCount = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query("followedChallenges")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();
    
    return followers.length;
  },
});
