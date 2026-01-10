import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";

// Explicitly import the modules since import.meta.glob doesn't work in vitest node environment
import * as importModule from "./import";
import * as challengesModule from "./challenges";
import * as entriesModule from "./entries";
import * as usersModule from "./users";
import * as followedChallengesModule from "./followedChallenges";
import * as generatedApi from "./_generated/api";
import * as generatedServer from "./_generated/server";

// Build the modules map that convex-test expects
// The library strips extensions and uses prefix from _generated path
// prefix = "./" (everything before "_generated" in "./_generated/api.ts")
// So module "import" is looked up as prefix + "import" = "./import"
const modules: Record<string, () => Promise<unknown>> = {
  "./import.ts": async () => importModule,
  "./challenges.ts": async () => challengesModule,
  "./entries.ts": async () => entriesModule,
  "./users.ts": async () => usersModule,
  "./followedChallenges.ts": async () => followedChallengesModule,
  "./_generated/api.ts": async () => generatedApi,
  "./_generated/server.ts": async () => generatedServer,
};

describe("import mutations", () => {
  describe("bulkImport", () => {
    it("imports challenges and entries, mapping IDs correctly", async () => {
      const t = convexTest(schema, modules);

      // Create a user first
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkId: "test-clerk-id",
          email: "test@example.com",
          createdAt: Date.now(),
        });
      });

      // Import challenges and entries
      const result = await t.mutation(api.import.bulkImport, {
        userId,
        challenges: [
          {
            id: "original-c1",
            name: "Push-ups",
            targetNumber: 100,
            year: 2026,
            color: "#ff0000",
            icon: "dumbbell",
            timeframeUnit: "year",
            isPublic: false,
            archived: false,
          },
          {
            id: "original-c2",
            name: "Running",
            targetNumber: 365,
            year: 2026,
            color: "#00ff00",
            icon: "run",
            timeframeUnit: "year",
            isPublic: true,
            archived: false,
          },
        ],
        entries: [
          { challengeId: "original-c1", date: "2026-01-01", count: 10 },
          { challengeId: "original-c1", date: "2026-01-02", count: 15 },
          { challengeId: "original-c2", date: "2026-01-01", count: 5 },
        ],
      });

      expect(result.challengesCreated).toBe(2);
      expect(result.entriesCreated).toBe(3);

      // Verify challenges were created
      const challenges = await t.run(async (ctx) => {
        return await ctx.db
          .query("challenges")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
      });

      expect(challenges).toHaveLength(2);
      expect(challenges.map((c) => c.name).sort()).toEqual(["Push-ups", "Running"]);

      // Verify entries reference the new challenge IDs
      const entries = await t.run(async (ctx) => {
        return await ctx.db
          .query("entries")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
      });

      expect(entries).toHaveLength(3);
      // All entries should have valid challenge references
      const challengeIds = new Set(challenges.map((c) => c._id));
      for (const entry of entries) {
        expect(challengeIds.has(entry.challengeId)).toBe(true);
      }
    });

    it("clears existing data before importing", async () => {
      const t = convexTest(schema, modules);

      // Create a user with existing data
      const userId = await t.run(async (ctx) => {
        const id = await ctx.db.insert("users", {
          clerkId: "test-clerk-id",
          createdAt: Date.now(),
        });

        // Add existing challenge
        const challengeId = await ctx.db.insert("challenges", {
          userId: id,
          name: "Old Challenge",
          targetNumber: 50,
          year: 2025,
          color: "#000000",
          icon: "star",
          timeframeUnit: "year",
          isPublic: false,
          archived: false,
          createdAt: Date.now(),
        });

        // Add existing entry
        await ctx.db.insert("entries", {
          userId: id,
          challengeId,
          date: "2025-12-01",
          count: 100,
          createdAt: Date.now(),
        });

        return id;
      });

      // Import new data
      await t.mutation(api.import.bulkImport, {
        userId,
        challenges: [
          {
            id: "new-c1",
            name: "New Challenge",
            targetNumber: 200,
            year: 2026,
            color: "#ffffff",
            icon: "heart",
            timeframeUnit: "year",
            isPublic: false,
            archived: false,
          },
        ],
        entries: [],
      });

      // Verify old data is gone
      const challenges = await t.run(async (ctx) => {
        return await ctx.db
          .query("challenges")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
      });

      expect(challenges).toHaveLength(1);
      expect(challenges[0].name).toBe("New Challenge");
    });

    it("skips entries for missing challenges", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkId: "test-clerk-id",
          createdAt: Date.now(),
        });
      });

      const result = await t.mutation(api.import.bulkImport, {
        userId,
        challenges: [
          {
            id: "c1",
            name: "Test",
            targetNumber: 100,
            year: 2026,
            color: "#000",
            icon: "x",
            timeframeUnit: "year",
            isPublic: false,
            archived: false,
          },
        ],
        entries: [
          { challengeId: "c1", date: "2026-01-01", count: 10 }, // Valid
          { challengeId: "missing", date: "2026-01-01", count: 5 }, // Should be skipped
        ],
      });

      expect(result.entriesCreated).toBe(1); // Only 1 entry created
    });
  });

  describe("clearAllData", () => {
    it("deletes all user data", async () => {
      const t = convexTest(schema, modules);

      // Create user with data
      const userId = await t.run(async (ctx) => {
        const id = await ctx.db.insert("users", {
          clerkId: "test-clerk-id",
          createdAt: Date.now(),
        });

        const challengeId = await ctx.db.insert("challenges", {
          userId: id,
          name: "Challenge",
          targetNumber: 100,
          year: 2026,
          color: "#000",
          icon: "x",
          timeframeUnit: "year",
          isPublic: false,
          archived: false,
          createdAt: Date.now(),
        });

        await ctx.db.insert("entries", {
          userId: id,
          challengeId,
          date: "2026-01-01",
          count: 10,
          createdAt: Date.now(),
        });

        await ctx.db.insert("followedChallenges", {
          userId: id,
          challengeId,
          followedAt: Date.now(),
        });

        return id;
      });

      const result = await t.mutation(api.import.clearAllData, { userId });

      expect(result.challengesDeleted).toBe(1);
      expect(result.entriesDeleted).toBe(1);
      expect(result.followsDeleted).toBe(1);

      // Verify everything is gone
      const remainingChallenges = await t.run(async (ctx) => {
        return await ctx.db
          .query("challenges")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
      });
      expect(remainingChallenges).toHaveLength(0);
    });

    it("returns zeros when no data exists", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkId: "empty-user",
          createdAt: Date.now(),
        });
      });

      const result = await t.mutation(api.import.clearAllData, { userId });

      expect(result.challengesDeleted).toBe(0);
      expect(result.entriesDeleted).toBe(0);
      expect(result.followsDeleted).toBe(0);
    });
  });
});
