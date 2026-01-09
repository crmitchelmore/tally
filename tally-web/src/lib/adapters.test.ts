import { describe, expect, it } from "vitest";
import { toChallenge, toChallenges, toEntry, toEntries, toUser } from "@/lib/adapters";
import type { Doc } from "../../convex/_generated/dataModel";

describe("adapters", () => {
  describe("toChallenge", () => {
    it("converts Convex document to Challenge type", () => {
      const doc = {
        _id: "ch_123" as any,
        _creationTime: Date.now(),
        userId: "u_456" as any,
        name: "Push-ups",
        targetNumber: 1000,
        year: 2026,
        color: "#ff0000",
        icon: "dumbbell",
        timeframeUnit: "year" as const,
        startDate: undefined,
        endDate: undefined,
        isPublic: true,
        archived: false,
        createdAt: Date.now(),
      };

      const result = toChallenge(doc as Doc<"challenges">);

      expect(result.id).toBe("ch_123");
      expect(result.userId).toBe("u_456");
      expect(result.name).toBe("Push-ups");
      expect(result.targetNumber).toBe(1000);
      expect(result.year).toBe(2026);
      expect(result.timeframeUnit).toBe("year");
      expect(result.isPublic).toBe(true);
      expect(result.archived).toBe(false);
    });
  });

  describe("toChallenges", () => {
    it("converts array of documents", () => {
      const docs = [
        {
          _id: "ch_1" as any,
          _creationTime: Date.now(),
          userId: "u_1" as any,
          name: "Test 1",
          targetNumber: 100,
          year: 2026,
          color: "#000",
          icon: "star",
          timeframeUnit: "year" as const,
          isPublic: false,
          archived: false,
          createdAt: Date.now(),
        },
        {
          _id: "ch_2" as any,
          _creationTime: Date.now(),
          userId: "u_1" as any,
          name: "Test 2",
          targetNumber: 200,
          year: 2026,
          color: "#fff",
          icon: "heart",
          timeframeUnit: "month" as const,
          isPublic: true,
          archived: false,
          createdAt: Date.now(),
        },
      ];

      const result = toChallenges(docs as Doc<"challenges">[]);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("ch_1");
      expect(result[1].id).toBe("ch_2");
    });

    it("handles empty array", () => {
      const result = toChallenges([]);
      expect(result).toEqual([]);
    });
  });

  describe("toEntry", () => {
    it("converts Convex entry document", () => {
      const doc = {
        _id: "e_123" as any,
        _creationTime: Date.now(),
        userId: "u_1" as any,
        challengeId: "ch_1" as any,
        date: "2026-01-09",
        count: 50,
        note: "Good session",
        sets: [{ reps: 10 }, { reps: 15 }],
        feeling: "moderate" as const,
        createdAt: Date.now(),
      };

      const result = toEntry(doc as Doc<"entries">);

      expect(result.id).toBe("e_123");
      expect(result.challengeId).toBe("ch_1");
      expect(result.date).toBe("2026-01-09");
      expect(result.count).toBe(50);
      expect(result.note).toBe("Good session");
      expect(result.sets).toEqual([{ reps: 10 }, { reps: 15 }]);
      expect(result.feeling).toBe("moderate");
    });

    it("handles entry without optional fields", () => {
      const doc = {
        _id: "e_456" as any,
        _creationTime: Date.now(),
        userId: "u_1" as any,
        challengeId: "ch_1" as any,
        date: "2026-01-09",
        count: 25,
        createdAt: Date.now(),
      };

      const result = toEntry(doc as Doc<"entries">);

      expect(result.id).toBe("e_456");
      expect(result.note).toBeUndefined();
      expect(result.sets).toBeUndefined();
      expect(result.feeling).toBeUndefined();
    });
  });

  describe("toUser", () => {
    it("converts Convex user document", () => {
      const doc = {
        _id: "u_123" as any,
        _creationTime: Date.now(),
        clerkId: "clerk_abc",
        email: "test@example.com",
        name: "Test User",
        avatarUrl: "https://example.com/avatar.png",
        createdAt: Date.now(),
      };

      const result = toUser(doc as Doc<"users">);

      expect(result.id).toBe("u_123");
      expect(result.clerkId).toBe("clerk_abc");
      expect(result.email).toBe("test@example.com");
      expect(result.name).toBe("Test User");
      expect(result.avatarUrl).toBe("https://example.com/avatar.png");
    });
  });
});
