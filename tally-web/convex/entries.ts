import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Helper to convert Convex doc to API format
function toApiFormat(entry: Doc<"entries">) {
  return {
    id: entry._id,
    userId: entry.userId,
    challengeId: entry.challengeId,
    date: entry.date,
    count: entry.count,
    note: entry.note,
    feeling: entry.feeling,
    createdAt: new Date(entry.createdAt).toISOString(),
    updatedAt: new Date(entry.updatedAt || entry.createdAt).toISOString(),
  };
}

/**
 * List entries by challenge ID (sorted by date DESC)
 */
export const listByChallenge = query({
  args: { challengeId: v.string() },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("entries")
      .withIndex("by_challenge_id", (q) => q.eq("challengeId", args.challengeId))
      .collect();
    
    // Sort by date descending
    return entries
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(toApiFormat);
  },
});

/**
 * List entries by user ID (sorted by date DESC)
 */
export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("entries")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Sort by date descending
    return entries
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(toApiFormat);
  },
});

/**
 * Get an entry by ID
 */
export const get = query({
  args: { id: v.id("entries") },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    return entry ? toApiFormat(entry) : null;
  },
});

/**
 * Create a new entry
 */
export const create = mutation({
  args: {
    userId: v.string(),
    challengeId: v.string(),
    date: v.string(),
    count: v.number(),
    note: v.optional(v.string()),
    feeling: v.optional(v.union(
      v.literal("great"),
      v.literal("good"),
      v.literal("okay"),
      v.literal("tough")
    )),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const entryId = await ctx.db.insert("entries", {
      userId: args.userId,
      challengeId: args.challengeId,
      date: args.date,
      count: args.count,
      note: args.note,
      feeling: args.feeling,
      createdAt: now,
      updatedAt: now,
    });
    const entry = await ctx.db.get(entryId);
    if (!entry) throw new Error("Failed to create entry");
    return toApiFormat(entry);
  },
});

/**
 * Update an entry
 */
export const update = mutation({
  args: {
    id: v.id("entries"),
    date: v.optional(v.string()),
    count: v.optional(v.number()),
    note: v.optional(v.string()),
    feeling: v.optional(v.union(
      v.literal("great"),
      v.literal("good"),
      v.literal("okay"),
      v.literal("tough")
    )),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    const entry = await ctx.db.get(id);
    if (!entry) throw new Error("Entry not found");
    return toApiFormat(entry);
  },
});

/**
 * Delete an entry
 */
export const remove = mutation({
  args: { id: v.id("entries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
