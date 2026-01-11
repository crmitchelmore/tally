import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  requireCurrentUser,
  assertEntryOwner,
  assertChallengeOwner,
  canAccessChallenge,
} from "./lib/auth";

export const get = query({
  args: { id: v.id("entries") },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) return null;
    
    // Verify user can access the challenge this entry belongs to
    const hasAccess = await canAccessChallenge(ctx, entry.challengeId);
    if (!hasAccess) return null;
    
    return entry;
  },
});

export const listByChallenge = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    // Verify access to challenge
    const hasAccess = await canAccessChallenge(ctx, args.challengeId);
    if (!hasAccess) return [];
    
    return await ctx.db
      .query("entries")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();
  },
});

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("entries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    return await ctx.db
      .query("entries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const listByUserDate = query({
  args: { userId: v.id("users"), date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("entries")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .collect();
  },
});

export const listByDateRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("entries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    return entries.filter(
      (e) => e.date >= args.startDate && e.date <= args.endDate
    );
  },
});

export const create = mutation({
  args: {
    challengeId: v.id("challenges"),
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
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireCurrentUser(ctx);
    
    // Verify ownership of the challenge
    await assertChallengeOwner(ctx, args.challengeId);
    
    return await ctx.db.insert("entries", {
      ...args,
      userId: user._id,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("entries"),
    count: v.optional(v.number()),
    note: v.optional(v.string()),
    date: v.optional(v.string()),
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
  },
  handler: async (ctx, args) => {
    // Verify ownership before update
    await assertEntryOwner(ctx, args.id);
    
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

export const remove = mutation({
  args: { id: v.id("entries") },
  handler: async (ctx, args) => {
    // Verify ownership before deletion
    await assertEntryOwner(ctx, args.id);
    await ctx.db.delete(args.id);
  },
});
