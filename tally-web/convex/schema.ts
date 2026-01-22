import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex schema for Tally app
 * Matches the types defined in src/app/api/v1/_lib/types.ts
 * 
 * Note: Using v.number() for timestamps for backward compatibility with existing data,
 * but the API layer will convert to/from ISO strings.
 * Some fields are optional to handle migration from existing data.
 */

export default defineSchema({
  // Users table
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()), // Optional for migration
    avatarUrl: v.optional(v.string()), // From existing data
    // Soft delete fields
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.string()),
  })
    .index("by_clerk_id", ["clerkId"]),

  // Challenges table
  challenges: defineTable({
    userId: v.string(),
    name: v.string(),
    target: v.number(),
    timeframeType: v.union(v.literal("year"), v.literal("month"), v.literal("custom")),
    startDate: v.string(), // ISO date
    endDate: v.string(), // ISO date
    color: v.string(),
    icon: v.string(),
    isPublic: v.boolean(),
    isArchived: v.boolean(),
    // Count configuration (optional for backward compatibility)
    countType: v.optional(v.union(v.literal("simple"), v.literal("sets"), v.literal("custom"))),
    unitLabel: v.optional(v.string()),
    defaultIncrement: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()), // Optional for migration
    // Soft delete fields
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_archived", ["userId", "isArchived"])
    .index("by_public", ["isPublic", "isArchived"]),

  // Entries table
  entries: defineTable({
    userId: v.string(),
    challengeId: v.string(),
    date: v.string(), // ISO date (YYYY-MM-DD)
    count: v.number(),
    sets: v.optional(v.array(v.number())), // Optional sets breakdown
    note: v.optional(v.string()),
    feeling: v.optional(v.union(
      v.literal("great"),
      v.literal("good"),
      v.literal("okay"),
      v.literal("tough")
    )),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()), // Optional for migration
    // Soft delete fields
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_challenge_id", ["challengeId"])
    .index("by_challenge_date", ["challengeId", "date"])
    .index("by_user_date", ["userId", "date"]),

  // Follows table
  follows: defineTable({
    userId: v.string(),
    challengeId: v.string(),
    createdAt: v.number(),
    // Soft delete fields
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_challenge_id", ["challengeId"])
    .index("by_user_challenge", ["userId", "challengeId"]),
});
