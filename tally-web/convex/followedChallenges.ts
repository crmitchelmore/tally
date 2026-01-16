import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./users";

export const follow = mutation({
  args: { clerkId: v.string(), challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);
    
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }
    if (!challenge.isPublic && challenge.userId !== user._id) {
      throw new Error("Cannot follow private challenge");
    }

    const existing = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user_and_challenge", (q) =>
        q.eq("userId", user._id).eq("challengeId", args.challengeId)
      )
      .first();

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
  args: { clerkId: v.string(), challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);
    
    const existing = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user_and_challenge", (q) =>
        q.eq("userId", user._id).eq("challengeId", args.challengeId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const listByUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);
    const follows = await ctx.db
      .query("followedChallenges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const challenges = await Promise.all(
      follows.map(async (f) => {
        const challenge = await ctx.db.get(f.challengeId);
        return challenge ? { ...challenge, followedAt: f.followedAt } : null;
      })
    );

    return challenges.filter(Boolean);
  },
});

export const getFollowerCount = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("followedChallenges")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();
    return follows.length;
  },
});
