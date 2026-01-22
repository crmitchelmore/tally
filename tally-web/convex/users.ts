import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Helper to check if a record is not soft-deleted
function isNotDeleted<T extends { deletedAt?: number }>(doc: T): boolean {
  return doc.deletedAt === undefined;
}

// Helper to convert user doc to API format
function toApiFormat(user: Doc<"users">) {
  return {
    id: user._id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    createdAt: new Date(user.createdAt).toISOString(),
    updatedAt: new Date(user.updatedAt || user.createdAt).toISOString(),
  };
}

/**
 * Get user by Clerk ID (excludes soft-deleted)
 */
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user || !isNotDeleted(user)) return null;
    
    return toApiFormat(user);
  },
});

/**
 * Create a new user
 */
export const create = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      createdAt: now,
      updatedAt: now,
    });
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Failed to create user");
    
    return toApiFormat(user);
  },
});

/**
 * Update a user
 */
export const update = mutation({
  args: {
    id: v.id("users"),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    const user = await ctx.db.get(id);
    if (!user) throw new Error("User not found");
    
    return toApiFormat(user);
  },
});

/**
 * Soft delete a user
 */
export const remove = mutation({
  args: { 
    id: v.id("users"),
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
 * Restore a soft-deleted user
 */
export const restore = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { 
      deletedAt: undefined,
      deletedBy: undefined,
    });
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found after restore");
    return toApiFormat(user);
  },
});
