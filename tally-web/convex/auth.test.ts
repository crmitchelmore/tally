/**
 * Authorization Regression Tests
 *
 * These tests verify that our auth helpers correctly enforce ownership
 * and access control across all mutations and queries.
 *
 * Security scenarios covered:
 * - Owner vs non-owner mutation access
 * - Public vs private challenge visibility
 * - Follower access to followed challenges
 * - Unauthenticated access attempts
 */
import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Explicitly import modules for convex-test
import * as challengesModule from "./challenges";
import * as entriesModule from "./entries";
import * as usersModule from "./users";
import * as followedChallengesModule from "./followedChallenges";
import * as importModule from "./import";
import * as generatedApi from "./_generated/api";
import * as generatedServer from "./_generated/server";
import * as authLib from "./lib/auth";

const modules: Record<string, () => Promise<unknown>> = {
  "./challenges.ts": async () => challengesModule,
  "./entries.ts": async () => entriesModule,
  "./users.ts": async () => usersModule,
  "./followedChallenges.ts": async () => followedChallengesModule,
  "./import.ts": async () => importModule,
  "./lib/auth.ts": async () => authLib,
  "./_generated/api.ts": async () => generatedApi,
  "./_generated/server.ts": async () => generatedServer,
};

// Helper to create a test user
async function createTestUser(
  t: ReturnType<typeof convexTest>,
  clerkId: string,
  email = `${clerkId}@test.com`
): Promise<Id<"users">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      clerkId,
      email,
      createdAt: Date.now(),
    });
  });
}

// Helper to create a challenge directly in DB
async function createTestChallenge(
  t: ReturnType<typeof convexTest>,
  userId: Id<"users">,
  overrides: Partial<{
    name: string;
    isPublic: boolean;
    archived: boolean;
  }> = {}
): Promise<Id<"challenges">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("challenges", {
      userId,
      name: overrides.name ?? "Test Challenge",
      targetNumber: 100,
      year: 2026,
      color: "#ff0000",
      icon: "star",
      timeframeUnit: "year",
      isPublic: overrides.isPublic ?? false,
      archived: overrides.archived ?? false,
      createdAt: Date.now(),
    });
  });
}

// Helper to create an entry directly in DB
async function createTestEntry(
  t: ReturnType<typeof convexTest>,
  userId: Id<"users">,
  challengeId: Id<"challenges">,
  date = "2026-01-01"
): Promise<Id<"entries">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("entries", {
      userId,
      challengeId,
      date,
      count: 10,
      createdAt: Date.now(),
    });
  });
}

describe("Challenge Authorization", () => {
  describe("create", () => {
    it("authenticated user can create a challenge", async () => {
      const t = convexTest(schema, modules);
      await createTestUser(t, "alice");

      const challengeId = await t
        .withIdentity({ subject: "alice" })
        .mutation(api.challenges.create, {
          name: "My Challenge",
          targetNumber: 100,
          year: 2026,
          color: "#ff0000",
          icon: "star",
          timeframeUnit: "year",
          isPublic: false,
        });

      expect(challengeId).toBeDefined();
    });

    it("unauthenticated user cannot create a challenge", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.mutation(api.challenges.create, {
          name: "My Challenge",
          targetNumber: 100,
          year: 2026,
          color: "#ff0000",
          icon: "star",
          timeframeUnit: "year",
          isPublic: false,
        })
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("owner can update their own challenge", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "alice");
      const challengeId = await createTestChallenge(t, userId, {
        name: "Original",
      });

      await t
        .withIdentity({ subject: "alice" })
        .mutation(api.challenges.update, {
          id: challengeId,
          name: "Updated",
        });

      const challenge = await t.run(async (ctx) => ctx.db.get(challengeId));
      expect(challenge?.name).toBe("Updated");
    });

    it("non-owner cannot update another user's challenge", async () => {
      const t = convexTest(schema, modules);
      const aliceId = await createTestUser(t, "alice");
      await createTestUser(t, "bob");
      const challengeId = await createTestChallenge(t, aliceId);

      await expect(
        t.withIdentity({ subject: "bob" }).mutation(api.challenges.update, {
          id: challengeId,
          name: "Hacked!",
        })
      ).rejects.toThrow();
    });

    it("unauthenticated user cannot update any challenge", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "alice");
      const challengeId = await createTestChallenge(t, userId);

      await expect(
        t.mutation(api.challenges.update, {
          id: challengeId,
          name: "Hacked!",
        })
      ).rejects.toThrow();
    });
  });

  describe("archive", () => {
    it("owner can archive their own challenge", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "alice");
      const challengeId = await createTestChallenge(t, userId);

      await t
        .withIdentity({ subject: "alice" })
        .mutation(api.challenges.archive, { id: challengeId });

      const challenge = await t.run(async (ctx) => ctx.db.get(challengeId));
      expect(challenge?.archived).toBe(true);
    });

    it("non-owner cannot archive another user's challenge", async () => {
      const t = convexTest(schema, modules);
      const aliceId = await createTestUser(t, "alice");
      await createTestUser(t, "bob");
      const challengeId = await createTestChallenge(t, aliceId);

      await expect(
        t.withIdentity({ subject: "bob" }).mutation(api.challenges.archive, {
          id: challengeId,
        })
      ).rejects.toThrow();
    });
  });

  describe("remove", () => {
    it("owner can delete their own challenge", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "alice");
      const challengeId = await createTestChallenge(t, userId);

      await t
        .withIdentity({ subject: "alice" })
        .mutation(api.challenges.remove, { id: challengeId });

      const challenge = await t.run(async (ctx) => ctx.db.get(challengeId));
      expect(challenge).toBeNull();
    });

    it("non-owner cannot delete another user's challenge", async () => {
      const t = convexTest(schema, modules);
      const aliceId = await createTestUser(t, "alice");
      await createTestUser(t, "bob");
      const challengeId = await createTestChallenge(t, aliceId);

      await expect(
        t.withIdentity({ subject: "bob" }).mutation(api.challenges.remove, {
          id: challengeId,
        })
      ).rejects.toThrow();

      // Verify challenge still exists
      const challenge = await t.run(async (ctx) => ctx.db.get(challengeId));
      expect(challenge).not.toBeNull();
    });
  });

  describe("get (read access)", () => {
    it("owner can view their own private challenge", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "alice");
      const challengeId = await createTestChallenge(t, userId, {
        isPublic: false,
      });

      const challenge = await t
        .withIdentity({ subject: "alice" })
        .query(api.challenges.get, { id: challengeId });

      expect(challenge).not.toBeNull();
      expect(challenge?.name).toBe("Test Challenge");
    });

    it("anyone can view a public challenge", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "alice");
      const challengeId = await createTestChallenge(t, userId, {
        isPublic: true,
      });

      // Anonymous user can view public challenge
      const challenge = await t.query(api.challenges.get, { id: challengeId });
      expect(challenge).not.toBeNull();
    });

    it("non-owner cannot view private challenge", async () => {
      const t = convexTest(schema, modules);
      const aliceId = await createTestUser(t, "alice");
      await createTestUser(t, "bob");
      const challengeId = await createTestChallenge(t, aliceId, {
        isPublic: false,
      });

      const challenge = await t
        .withIdentity({ subject: "bob" })
        .query(api.challenges.get, { id: challengeId });

      expect(challenge).toBeNull();
    });

    it("follower can view followed private challenge", async () => {
      const t = convexTest(schema, modules);
      const aliceId = await createTestUser(t, "alice");
      const bobId = await createTestUser(t, "bob");
      const challengeId = await createTestChallenge(t, aliceId, {
        isPublic: false,
      });

      // Bob follows Alice's challenge
      await t.run(async (ctx) => {
        await ctx.db.insert("followedChallenges", {
          userId: bobId,
          challengeId,
          followedAt: Date.now(),
        });
      });

      const challenge = await t
        .withIdentity({ subject: "bob" })
        .query(api.challenges.get, { id: challengeId });

      expect(challenge).not.toBeNull();
    });
  });
});

describe("Entry Authorization", () => {
  describe("create", () => {
    it("owner can create entry for their own challenge", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "alice");
      const challengeId = await createTestChallenge(t, userId);

      const entryId = await t
        .withIdentity({ subject: "alice" })
        .mutation(api.entries.create, {
          challengeId,
          date: "2026-01-01",
          count: 10,
        });

      expect(entryId).toBeDefined();
    });

    it("non-owner cannot create entry for another user's challenge", async () => {
      const t = convexTest(schema, modules);
      const aliceId = await createTestUser(t, "alice");
      await createTestUser(t, "bob");
      const challengeId = await createTestChallenge(t, aliceId);

      await expect(
        t.withIdentity({ subject: "bob" }).mutation(api.entries.create, {
          challengeId,
          date: "2026-01-01",
          count: 10,
        })
      ).rejects.toThrow();
    });

    it("unauthenticated user cannot create entries", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "alice");
      const challengeId = await createTestChallenge(t, userId);

      await expect(
        t.mutation(api.entries.create, {
          challengeId,
          date: "2026-01-01",
          count: 10,
        })
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("owner can update their own entry", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "alice");
      const challengeId = await createTestChallenge(t, userId);
      const entryId = await createTestEntry(t, userId, challengeId);

      await t.withIdentity({ subject: "alice" }).mutation(api.entries.update, {
        id: entryId,
        count: 20,
      });

      const entry = await t.run(async (ctx) => ctx.db.get(entryId));
      expect(entry?.count).toBe(20);
    });

    it("non-owner cannot update another user's entry", async () => {
      const t = convexTest(schema, modules);
      const aliceId = await createTestUser(t, "alice");
      await createTestUser(t, "bob");
      const challengeId = await createTestChallenge(t, aliceId);
      const entryId = await createTestEntry(t, aliceId, challengeId);

      await expect(
        t.withIdentity({ subject: "bob" }).mutation(api.entries.update, {
          id: entryId,
          count: 999,
        })
      ).rejects.toThrow();
    });
  });

  describe("remove", () => {
    it("owner can delete their own entry", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "alice");
      const challengeId = await createTestChallenge(t, userId);
      const entryId = await createTestEntry(t, userId, challengeId);

      await t
        .withIdentity({ subject: "alice" })
        .mutation(api.entries.remove, { id: entryId });

      const entry = await t.run(async (ctx) => ctx.db.get(entryId));
      expect(entry).toBeNull();
    });

    it("non-owner cannot delete another user's entry", async () => {
      const t = convexTest(schema, modules);
      const aliceId = await createTestUser(t, "alice");
      await createTestUser(t, "bob");
      const challengeId = await createTestChallenge(t, aliceId);
      const entryId = await createTestEntry(t, aliceId, challengeId);

      await expect(
        t.withIdentity({ subject: "bob" }).mutation(api.entries.remove, {
          id: entryId,
        })
      ).rejects.toThrow();

      // Verify entry still exists
      const entry = await t.run(async (ctx) => ctx.db.get(entryId));
      expect(entry).not.toBeNull();
    });
  });

  describe("get (read access)", () => {
    it("owner can view their own entry", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "alice");
      const challengeId = await createTestChallenge(t, userId, {
        isPublic: false,
      });
      const entryId = await createTestEntry(t, userId, challengeId);

      const entry = await t
        .withIdentity({ subject: "alice" })
        .query(api.entries.get, { id: entryId });

      expect(entry).not.toBeNull();
    });

    it("anyone can view entry for public challenge", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "alice");
      const challengeId = await createTestChallenge(t, userId, {
        isPublic: true,
      });
      const entryId = await createTestEntry(t, userId, challengeId);

      // Anonymous user can view
      const entry = await t.query(api.entries.get, { id: entryId });
      expect(entry).not.toBeNull();
    });

    it("non-owner cannot view entry for private challenge", async () => {
      const t = convexTest(schema, modules);
      const aliceId = await createTestUser(t, "alice");
      await createTestUser(t, "bob");
      const challengeId = await createTestChallenge(t, aliceId, {
        isPublic: false,
      });
      const entryId = await createTestEntry(t, aliceId, challengeId);

      const entry = await t
        .withIdentity({ subject: "bob" })
        .query(api.entries.get, { id: entryId });

      expect(entry).toBeNull();
    });
  });

  describe("listByChallenge", () => {
    it("returns entries for public challenge", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "alice");
      const challengeId = await createTestChallenge(t, userId, {
        isPublic: true,
      });
      await createTestEntry(t, userId, challengeId, "2026-01-01");
      await createTestEntry(t, userId, challengeId, "2026-01-02");

      const entries = await t.query(api.entries.listByChallenge, {
        challengeId,
      });
      expect(entries).toHaveLength(2);
    });

    it("returns empty array for private challenge when not owner", async () => {
      const t = convexTest(schema, modules);
      const aliceId = await createTestUser(t, "alice");
      await createTestUser(t, "bob");
      const challengeId = await createTestChallenge(t, aliceId, {
        isPublic: false,
      });
      await createTestEntry(t, aliceId, challengeId);

      const entries = await t
        .withIdentity({ subject: "bob" })
        .query(api.entries.listByChallenge, { challengeId });

      expect(entries).toHaveLength(0);
    });
  });
});

describe("Auth Error Types", () => {
  it("throws UnauthenticatedError for missing auth", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.challenges.create, {
        name: "Test",
        targetNumber: 100,
        year: 2026,
        color: "#000",
        icon: "x",
        timeframeUnit: "year",
        isPublic: false,
      })
    ).rejects.toThrow("Authentication required");
  });

  it("throws UnauthorizedError for ownership violation", async () => {
    const t = convexTest(schema, modules);
    const aliceId = await createTestUser(t, "alice");
    await createTestUser(t, "bob");
    const challengeId = await createTestChallenge(t, aliceId);

    await expect(
      t.withIdentity({ subject: "bob" }).mutation(api.challenges.update, {
        id: challengeId,
        name: "Hacked",
      })
    ).rejects.toThrow("Not authorized");
  });
});
