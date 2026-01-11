import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireCurrentUser, getCurrentUser } from "./lib/auth";

export const get = query({
  args: { id: v.id("followedChallenges") },
  handler: async (ctx, args) => {
    const follow = await ctx.db.get(args.id);
    if (!follow) return null;
    
    // Only return if user owns this follow
    const user = await getCurrentUser(ctx);
    if (!user || follow.userId !== user._id) return null;
    
    return follow;
  },
});

export const remove = mutation({
  args: { id: v.id("followedChallenges") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const follow = await ctx.db.get(args.id);
    
    // Only allow deleting own follows
    if (!follow || follow.userId !== user._id) {
      throw new Error("Not authorized");
    }
    
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

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    
    const follows = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
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
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;
    
    const existing = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("challengeId"), args.challengeId))
      .unique();
    
    return existing !== null;
  },
});

export const follow = mutation({
  args: {
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    
    // Verify the challenge exists and is public (can't follow private challenges)
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }
    if (!challenge.isPublic && challenge.userId !== user._id) {
      throw new Error("Cannot follow a private challenge");
    }
    
    // Check if already following
    const existing = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("challengeId"), args.challengeId))
      .unique();
    
    if (existing) {
      return existing._id;
    }
    
    return await ctx.db.insert("followedChallenges", {
      userId: user._id,
      challengeId: args.challengeId,
      followedAt: Date.now(),
    });
  },
});

export const unfollow = mutation({
  args: {
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    
    const existing = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
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
