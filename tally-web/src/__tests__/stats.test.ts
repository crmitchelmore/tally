import { describe, it, expect } from "vitest";
import { calculateStats, formatPaceStatus } from "@/lib/stats";
import { Challenge, Entry } from "@/types";
import { Id } from "../../convex/_generated/dataModel";

describe("calculateStats", () => {
  const mockChallenge: Challenge = {
    _id: "challenge1" as Id<"challenges">,
    userId: "user1" as Id<"users">,
    name: "Test Challenge",
    targetNumber: 100,
    color: "#3B82F6",
    icon: "📚",
    timeframeUnit: "year",
    year: new Date().getFullYear(),
    isPublic: false,
    archived: false,
    createdAt: Date.now(),
  };

  const makeEntry = (id: string, date: string, count: number): Entry => ({
    _id: id as Id<"entries">,
    userId: "u1" as Id<"users">,
    challengeId: "c1" as Id<"challenges">,
    date,
    count,
    createdAt: Date.now(),
  });

  it("calculates total from entries", () => {
    const entries: Entry[] = [
      makeEntry("e1", "2025-01-01", 10),
      makeEntry("e2", "2025-01-02", 20),
    ];

    const stats = calculateStats(mockChallenge, entries);
    expect(stats.total).toBe(30);
    expect(stats.remaining).toBe(70);
  });

  it("calculates remaining correctly", () => {
    const entries: Entry[] = [makeEntry("e1", "2025-01-01", 50)];

    const stats = calculateStats(mockChallenge, entries);
    expect(stats.remaining).toBe(50);
  });

  it("handles empty entries", () => {
    const stats = calculateStats(mockChallenge, []);
    expect(stats.total).toBe(0);
    expect(stats.remaining).toBe(100);
  });

  it("calculates days active", () => {
    const entries: Entry[] = [
      makeEntry("e1", "2025-01-01", 10),
      makeEntry("e2", "2025-01-01", 5),
      makeEntry("e3", "2025-01-02", 20),
    ];

    const stats = calculateStats(mockChallenge, entries);
    expect(stats.daysActive).toBe(2);
  });
});

describe("formatPaceStatus", () => {
  it("formats ahead status", () => {
    const result = formatPaceStatus("ahead");
    expect(result.text).toBe("Ahead");
    expect(result.color).toContain("emerald");
  });

  it("formats onPace status", () => {
    const result = formatPaceStatus("onPace");
    expect(result.text).toBe("On pace");
    expect(result.color).toContain("blue");
  });

  it("formats behind status", () => {
    const result = formatPaceStatus("behind");
    expect(result.text).toBe("Behind");
    expect(result.color).toContain("amber");
  });
});
