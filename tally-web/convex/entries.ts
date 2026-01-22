import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Helper to check if a record is not soft-deleted
function isNotDeleted<T extends { deletedAt?: number }>(doc: T): boolean {
  return doc.deletedAt === undefined;
}

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
 * List entries by challenge ID (sorted by date DESC, excluding soft-deleted)
 */
export const listByChallenge = query({
  args: { challengeId: v.string() },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("entries")
      .withIndex("by_challenge_id", (q) => q.eq("challengeId", args.challengeId))
      .collect();
    
    // Sort by date descending, excluding soft-deleted
    return entries
      .filter(isNotDeleted)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(toApiFormat);
  },
});

/**
 * List entries by user ID (sorted by date DESC, excluding soft-deleted)
 */
export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("entries")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Sort by date descending, excluding soft-deleted
    return entries
      .filter(isNotDeleted)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(toApiFormat);
  },
});

/**
 * Get an entry by ID (returns null if soft-deleted)
 */
export const get = query({
  args: { id: v.id("entries") },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry || !isNotDeleted(entry)) return null;
    return toApiFormat(entry);
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
 * Soft delete an entry
 */
export const remove = mutation({
  args: { 
    id: v.id("entries"),
    deletedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.id, { 
      deletedAt: now,
      deletedBy: args.deletedBy,
    });
    return { success: true, deletedAt: now };
  },
});

/**
 * Restore a soft-deleted entry
 */
export const restore = mutation({
  args: { id: v.id("entries") },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) throw new Error("Entry not found");
    
    await ctx.db.patch(args.id, { 
      deletedAt: undefined,
      deletedBy: undefined,
    });
    
    const restored = await ctx.db.get(args.id);
    if (!restored) throw new Error("Entry not found after restore");
    return toApiFormat(restored);
  },
});
