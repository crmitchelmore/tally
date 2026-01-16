import { describe, it, expect } from "vitest";
import { calculateStats, formatPaceStatus } from "@/lib/stats";

describe("calculateStats", () => {
  const mockChallenge = {
    _id: "challenge1",
    userId: "user1",
    name: "Test Challenge",
    targetNumber: 100,
    color: "#3B82F6",
    icon: "📚",
    timeframeUnit: "year" as const,
    year: new Date().getFullYear(),
    isPublic: false,
    archived: false,
    createdAt: Date.now(),
  };

  it("calculates total from entries", () => {
    const entries = [
      { _id: "e1", userId: "u1", challengeId: "c1", date: "2025-01-01", count: 10, createdAt: 1 },
      { _id: "e2", userId: "u1", challengeId: "c1", date: "2025-01-02", count: 20, createdAt: 2 },
    ];

    const stats = calculateStats(mockChallenge as any, entries as any);
    expect(stats.total).toBe(30);
    expect(stats.remaining).toBe(70);
  });

  it("calculates remaining correctly", () => {
    const entries = [
      { _id: "e1", userId: "u1", challengeId: "c1", date: "2025-01-01", count: 50, createdAt: 1 },
    ];

    const stats = calculateStats(mockChallenge as any, entries as any);
    expect(stats.remaining).toBe(50);
  });

  it("handles empty entries", () => {
    const stats = calculateStats(mockChallenge as any, []);
    expect(stats.total).toBe(0);
    expect(stats.remaining).toBe(100);
  });

  it("calculates days active", () => {
    const entries = [
      { _id: "e1", userId: "u1", challengeId: "c1", date: "2025-01-01", count: 10, createdAt: 1 },
      { _id: "e2", userId: "u1", challengeId: "c1", date: "2025-01-01", count: 5, createdAt: 2 },
      { _id: "e3", userId: "u1", challengeId: "c1", date: "2025-01-02", count: 20, createdAt: 3 },
    ];

    const stats = calculateStats(mockChallenge as any, entries as any);
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
