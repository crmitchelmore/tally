import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getLeaderboard = query({
  args: {
    timeRange: v.union(v.literal("week"), v.literal("month"), v.literal("year"), v.literal("all")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    // Get date range
    const now = new Date();
    let startDate: string | null = null;
    
    if (args.timeRange === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().split("T")[0];
    } else if (args.timeRange === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = monthAgo.toISOString().split("T")[0];
    } else if (args.timeRange === "year") {
      startDate = `${now.getFullYear()}-01-01`;
    }
    
    // Get all entries (with date filter if applicable)
    const entries = await ctx.db.query("entries").collect();
    const filteredEntries = startDate
      ? entries.filter((e) => e.date >= startDate!)
      : entries;
    
    // Aggregate by userId (which is an Id<"users">)
    const userTotals: Record<string, number> = {};
    for (const entry of filteredEntries) {
      const userIdStr = entry.userId as string;
      userTotals[userIdStr] = (userTotals[userIdStr] || 0) + entry.count;
    }
    
    // Get user info and sort
    const leaderboard: Array<{
      rank: number;
      clerkId: string;
      name: string | null;
      avatarUrl: string | null;
      total: number;
    }> = [];
    
    const sortedUsers = Object.entries(userTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
    
    for (let i = 0; i < sortedUsers.length; i++) {
      const [userIdStr, total] = sortedUsers[i];
      const user = await ctx.db.get(userIdStr as Id<"users">);
      
      if (user) {
        leaderboard.push({
          rank: i + 1,
          clerkId: user.clerkId,
          name: user.name || null,
          avatarUrl: user.avatarUrl || null,
          total,
        });
      }
    }
    
    return leaderboard;
  },
});

export const getUserRank = query({
  args: {
    clerkId: v.string(),
    timeRange: v.union(v.literal("week"), v.literal("month"), v.literal("year"), v.literal("all")),
  },
  handler: async (ctx, args) => {
    // First get the user's internal ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user) {
      return { rank: null, total: 0, totalUsers: 0 };
    }
    
    // Get date range
    const now = new Date();
    let startDate: string | null = null;
    
    if (args.timeRange === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().split("T")[0];
    } else if (args.timeRange === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = monthAgo.toISOString().split("T")[0];
    } else if (args.timeRange === "year") {
      startDate = `${now.getFullYear()}-01-01`;
    }
    
    // Get all entries
    const entries = await ctx.db.query("entries").collect();
    const filteredEntries = startDate
      ? entries.filter((e) => e.date >= startDate!)
      : entries;
    
    // Aggregate by userId
    const userTotals: Record<string, number> = {};
    for (const entry of filteredEntries) {
      const userIdStr = entry.userId as string;
      userTotals[userIdStr] = (userTotals[userIdStr] || 0) + entry.count;
    }
    
    // Sort and find rank
    const sortedUsers = Object.entries(userTotals)
      .sort(([, a], [, b]) => b - a);
    
    const userIdStr = user._id as string;
    const userIndex = sortedUsers.findIndex(([id]) => id === userIdStr);
    
    if (userIndex === -1) {
      return { rank: null, total: 0, totalUsers: sortedUsers.length };
    }
    
    return {
      rank: userIndex + 1,
      total: userTotals[userIdStr] || 0,
      totalUsers: sortedUsers.length,
    };
  },
});
