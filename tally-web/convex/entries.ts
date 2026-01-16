import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./users";

const feelingValidator = v.optional(
  v.union(
    v.literal("very-easy"),
    v.literal("easy"),
    v.literal("moderate"),
    v.literal("hard"),
    v.literal("very-hard")
  )
);

export const create = mutation({
  args: {
    clerkId: v.string(),
    challengeId: v.id("challenges"),
    date: v.string(),
    count: v.number(),
    note: v.optional(v.string()),
    sets: v.optional(v.array(v.object({ reps: v.number() }))),
    feeling: feelingValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);
    
    const today = new Date().toISOString().split("T")[0];
    if (args.date > today) {
      throw new Error("Cannot log entries for future dates");
    }

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || challenge.userId !== user._id) {
      throw new Error("Challenge not found or not owned");
    }

    return await ctx.db.insert("entries", {
      userId: user._id,
      challengeId: args.challengeId,
      date: args.date,
      count: args.count,
      note: args.note,
      sets: args.sets,
      feeling: args.feeling,
      createdAt: Date.now(),
    });
  },
});

export const listByChallenge = query({
  args: { clerkId: v.string(), challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) return [];
    
    if (challenge.userId !== user._id && !challenge.isPublic) {
      return [];
    }

    return await ctx.db
      .query("entries")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();
  },
});

export const listByDate = query({
  args: { clerkId: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);
    return await ctx.db
      .query("entries")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", user._id).eq("date", args.date)
      )
      .collect();
  },
});

export const update = mutation({
  args: {
    clerkId: v.string(),
    entryId: v.id("entries"),
    date: v.optional(v.string()),
    count: v.optional(v.number()),
    note: v.optional(v.string()),
    sets: v.optional(v.array(v.object({ reps: v.number() }))),
    feeling: feelingValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);
    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.userId !== user._id) {
      throw new Error("Entry not found or not owned");
    }

    if (args.date) {
      const today = new Date().toISOString().split("T")[0];
      if (args.date > today) {
        throw new Error("Cannot set entry date to future");
      }
    }

    const updates: Record<string, unknown> = {};
    if (args.date !== undefined) updates.date = args.date;
    if (args.count !== undefined) updates.count = args.count;
    if (args.note !== undefined) updates.note = args.note;
    if (args.sets !== undefined) updates.sets = args.sets;
    if (args.feeling !== undefined) updates.feeling = args.feeling;

    await ctx.db.patch(args.entryId, updates);
  },
});

export const remove = mutation({
  args: { clerkId: v.string(), entryId: v.id("entries") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);
    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.userId !== user._id) {
      throw new Error("Entry not found or not owned");
    }
    await ctx.db.delete(args.entryId);
  },
});
