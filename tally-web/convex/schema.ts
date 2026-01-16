import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  challenges: defineTable({
    userId: v.id("users"),
    name: v.string(),
    targetNumber: v.number(),
    color: v.string(),
    icon: v.string(),
    timeframeUnit: v.union(
      v.literal("year"),
      v.literal("month"),
      v.literal("custom")
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    year: v.number(),
    isPublic: v.boolean(),
    archived: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_public", ["isPublic"]),

  entries: defineTable({
    userId: v.id("users"),
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
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_challenge", ["challengeId"])
    .index("by_user_and_date", ["userId", "date"]),

  followedChallenges: defineTable({
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    followedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_challenge", ["challengeId"])
    .index("by_user_and_challenge", ["userId", "challengeId"]),
});
