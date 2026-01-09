import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  calculateStats,
  getChallengeTimeframe,
  getHeatmapColor,
  getPaceMessage,
} from "@/lib/stats";
import type { Challenge, Entry } from "@/types";

describe("stats", () => {
  const challenge: Challenge = {
    id: "c1",
    userId: "u1",
    name: "Push-ups",
    targetNumber: 100,
    year: 2026,
    color: "#000",
    icon: "dumbbell",
    timeframeUnit: "year",
    archived: false,
    createdAt: Date.now(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-09T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes default year timeframe when start/end are missing", () => {
    const tf = getChallengeTimeframe(challenge);
    expect(tf.startDate).toBe("2026-01-01");
    expect(tf.endDate).toBe("2026-12-31");
    expect(tf.totalDays).toBeGreaterThanOrEqual(365);
  });

  it("calculates totals, remaining, and streaks", () => {
    const entries: Entry[] = [
      { id: "e1", userId: "u1", challengeId: "c1", date: "2026-01-08", count: 10 },
      { id: "e2", userId: "u1", challengeId: "c1", date: "2026-01-09", count: 20 },
      { id: "e3", userId: "u1", challengeId: "c1", date: "2026-01-05", count: 5 },
    ];

    const stats = calculateStats(challenge, entries);
    expect(stats.total).toBe(35);
    expect(stats.remaining).toBe(65);
    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBeGreaterThanOrEqual(2);
  });

  it("pace message is stable for each status", () => {
    expect(getPaceMessage({
      total: 0,
      remaining: 0,
      daysLeft: 1,
      requiredPerDay: 0,
      currentStreak: 0,
      longestStreak: 0,
      bestDay: null,
      averagePerDay: 0,
      daysActive: 0,
      paceStatus: "onPace",
      paceOffset: 0,
    })).toContain("on pace");
  });

  it("heatmap color returns a valid string for out-of-range levels", () => {
    expect(getHeatmapColor(-1)).toContain("oklch");
    expect(getHeatmapColor(999)).toContain("oklch");
  });
});
