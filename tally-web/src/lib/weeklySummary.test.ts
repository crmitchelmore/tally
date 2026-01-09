import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { generateWeeklySummary } from "@/lib/weeklySummary";
import type { Challenge, Entry } from "@/types";

describe("weeklySummary", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Friday
    vi.setSystemTime(new Date("2026-01-09T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("generates a deterministic weekly summary", () => {
    const challenges: Challenge[] = [
      {
        id: "c1",
        userId: "u1",
        name: "Push-ups",
        targetNumber: 100,
        year: 2026,
        color: "#000",
        icon: "dumbbell",
        archived: false,
        createdAt: Date.now(),
      },
    ];

    const entries: Entry[] = [
      { id: "e1", userId: "u1", challengeId: "c1", date: "2026-01-05", count: 10 },
      { id: "e2", userId: "u1", challengeId: "c1", date: "2026-01-06", count: 15 },
      { id: "e3", userId: "u1", challengeId: "c1", date: "2026-01-08", count: 20 },
    ];

    const summary = generateWeeklySummary(challenges, entries, 0);
    expect(summary.totalReps).toBe(45);
    expect(summary.entriesLogged).toBe(3);
    expect(summary.bestDay?.count).toBe(20);
    expect(summary.challengeBreakdown[0]?.challengeName).toBe("Push-ups");
  });
});
