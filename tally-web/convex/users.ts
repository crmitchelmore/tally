import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get user by Clerk ID
 */
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user) return null;
    
    // Convert timestamps to ISO strings for API compatibility
    return {
      id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      createdAt: new Date(user.createdAt).toISOString(),
      updatedAt: new Date(user.updatedAt || user.createdAt).toISOString(),
    };
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
    
    // Convert timestamps to ISO strings for API compatibility
    return {
      id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      createdAt: new Date(user.createdAt).toISOString(),
      updatedAt: new Date(user.updatedAt || user.createdAt).toISOString(),
    };
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
    
    // Convert timestamps to ISO strings for API compatibility
    return {
      id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      createdAt: new Date(user.createdAt).toISOString(),
      updatedAt: new Date(user.updatedAt || user.createdAt).toISOString(),
    };
  },
});
