import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  calculateStats,
  getChallengeTimeframe,
  getDaysLeftInTimeframe,
  generateHeatmapData,
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

describe("streak calculations", () => {
  const challenge: Challenge = {
    id: "c1",
    userId: "u1",
    name: "Push-ups",
    targetNumber: 100,
    year: 2026,
    color: "#000",
    icon: "dumbbell",
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

  it("returns 0 streak for empty entries", () => {
    const stats = calculateStats(challenge, []);
    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(0);
  });

  it("counts current streak from today backward", () => {
    const entries: Entry[] = [
      { id: "e1", userId: "u1", challengeId: "c1", date: "2026-01-09", count: 10 },
      { id: "e2", userId: "u1", challengeId: "c1", date: "2026-01-08", count: 10 },
      { id: "e3", userId: "u1", challengeId: "c1", date: "2026-01-07", count: 10 },
    ];
    const stats = calculateStats(challenge, entries);
    expect(stats.currentStreak).toBe(3);
  });

  it("counts current streak from yesterday when no entry today", () => {
    // Streak persists through the day - if yesterday had an entry, streak continues
    const entries: Entry[] = [
      { id: "e1", userId: "u1", challengeId: "c1", date: "2026-01-08", count: 10 },
      { id: "e2", userId: "u1", challengeId: "c1", date: "2026-01-07", count: 10 },
    ];
    const stats = calculateStats(challenge, entries);
    expect(stats.currentStreak).toBe(2); // Yesterday + day before
  });

  it("resets current streak after a gap", () => {
    const entries: Entry[] = [
      { id: "e1", userId: "u1", challengeId: "c1", date: "2026-01-09", count: 10 },
      // Gap on 01-08
      { id: "e2", userId: "u1", challengeId: "c1", date: "2026-01-07", count: 10 },
      { id: "e3", userId: "u1", challengeId: "c1", date: "2026-01-06", count: 10 },
    ];
    const stats = calculateStats(challenge, entries);
    expect(stats.currentStreak).toBe(1); // Only today counts
  });

  it("tracks longest streak separately from current", () => {
    const entries: Entry[] = [
      // Longer old streak
      { id: "e1", userId: "u1", challengeId: "c1", date: "2026-01-01", count: 10 },
      { id: "e2", userId: "u1", challengeId: "c1", date: "2026-01-02", count: 10 },
      { id: "e3", userId: "u1", challengeId: "c1", date: "2026-01-03", count: 10 },
      { id: "e4", userId: "u1", challengeId: "c1", date: "2026-01-04", count: 10 },
      // Gap then current (shorter)
      { id: "e5", userId: "u1", challengeId: "c1", date: "2026-01-09", count: 10 },
    ];
    const stats = calculateStats(challenge, entries);
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(4);
  });

  it("aggregates multiple entries on the same day", () => {
    const entries: Entry[] = [
      { id: "e1", userId: "u1", challengeId: "c1", date: "2026-01-09", count: 5 },
      { id: "e2", userId: "u1", challengeId: "c1", date: "2026-01-09", count: 10 },
    ];
    const stats = calculateStats(challenge, entries);
    expect(stats.total).toBe(15);
    expect(stats.bestDay?.count).toBe(15);
    expect(stats.daysActive).toBe(1);
  });
});

describe("custom timeframe challenges", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses custom start/end dates when provided", () => {
    const challenge: Challenge = {
      id: "c1",
      userId: "u1",
      name: "February Challenge",
      targetNumber: 28,
      year: 2026,
      color: "#000",
      icon: "star",
      startDate: "2026-02-01",
      endDate: "2026-02-28",
      archived: false,
      createdAt: Date.now(),
    };
    
    const tf = getChallengeTimeframe(challenge);
    expect(tf.startDate).toBe("2026-02-01");
    expect(tf.endDate).toBe("2026-02-28");
    expect(tf.totalDays).toBe(28);
  });

  it("calculates days left in custom timeframe", () => {
    const challenge: Challenge = {
      id: "c1",
      userId: "u1",
      name: "February Challenge",
      targetNumber: 28,
      year: 2026,
      color: "#000",
      icon: "star",
      startDate: "2026-02-01",
      endDate: "2026-02-28",
      archived: false,
      createdAt: Date.now(),
    };
    
    const daysLeft = getDaysLeftInTimeframe(challenge);
    expect(daysLeft).toBe(14); // Feb 15 -> Feb 28 = 14 days
  });
});

describe("generateHeatmapData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("generates heatmap for short timeframe", () => {
    const challenge: Challenge = {
      id: "c1",
      userId: "u1",
      name: "Week Challenge",
      targetNumber: 7,
      year: 2026,
      color: "#000",
      icon: "star",
      startDate: "2026-01-05",
      endDate: "2026-01-11",
      archived: false,
      createdAt: Date.now(),
    };

    const entries: Entry[] = [
      { id: "e1", userId: "u1", challengeId: "c1", date: "2026-01-05", count: 1 },
      { id: "e2", userId: "u1", challengeId: "c1", date: "2026-01-07", count: 4 },
    ];

    const heatmap = generateHeatmapData(challenge, entries);
    
    expect(heatmap).toHaveLength(7);
    expect(heatmap[0]).toEqual({ date: "2026-01-05", count: 1, level: 1 });
    expect(heatmap[1]).toEqual({ date: "2026-01-06", count: 0, level: 0 });
    expect(heatmap[2]).toEqual({ date: "2026-01-07", count: 4, level: 4 }); // max count
  });

  it("assigns correct levels based on relative count", () => {
    const challenge: Challenge = {
      id: "c1",
      userId: "u1",
      name: "Test",
      targetNumber: 100,
      year: 2026,
      color: "#000",
      icon: "star",
      startDate: "2026-01-01",
      endDate: "2026-01-05",
      archived: false,
      createdAt: Date.now(),
    };

    const entries: Entry[] = [
      { id: "e1", userId: "u1", challengeId: "c1", date: "2026-01-01", count: 10 }, // ~25% = level 1
      { id: "e2", userId: "u1", challengeId: "c1", date: "2026-01-02", count: 20 }, // ~50% = level 2
      { id: "e3", userId: "u1", challengeId: "c1", date: "2026-01-03", count: 30 }, // ~75% = level 3
      { id: "e4", userId: "u1", challengeId: "c1", date: "2026-01-04", count: 40 }, // 100% = level 4
    ];

    const heatmap = generateHeatmapData(challenge, entries);
    
    expect(heatmap[0].level).toBe(1);
    expect(heatmap[1].level).toBe(2);
    expect(heatmap[2].level).toBe(3);
    expect(heatmap[3].level).toBe(4);
    expect(heatmap[4].level).toBe(0); // no entry
  });
});

describe("pace calculations", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-30T12:00:00Z")); // Mid-year
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks as ahead when progress exceeds expected", () => {
    const challenge: Challenge = {
      id: "c1",
      userId: "u1",
      name: "Test",
      targetNumber: 365, // 1 per day
      year: 2026,
      color: "#000",
      icon: "star",
      archived: false,
      createdAt: Date.now(),
    };

    const entries: Entry[] = [
      { id: "e1", userId: "u1", challengeId: "c1", date: "2026-06-15", count: 200 },
    ];

    const stats = calculateStats(challenge, entries);
    expect(stats.paceStatus).toBe("ahead");
    expect(stats.paceOffset).toBeGreaterThan(0);
  });

  it("marks as behind when progress is below expected", () => {
    const challenge: Challenge = {
      id: "c1",
      userId: "u1",
      name: "Test",
      targetNumber: 365,
      year: 2026,
      color: "#000",
      icon: "star",
      archived: false,
      createdAt: Date.now(),
    };

    const entries: Entry[] = [
      { id: "e1", userId: "u1", challengeId: "c1", date: "2026-06-15", count: 10 },
    ];

    const stats = calculateStats(challenge, entries);
    expect(stats.paceStatus).toBe("behind");
    expect(stats.paceOffset).toBeLessThan(0);
  });

  it("pace message shows catch-up advice when behind", () => {
    const message = getPaceMessage({
      total: 10,
      remaining: 355,
      daysLeft: 185,
      requiredPerDay: 2,
      currentStreak: 0,
      longestStreak: 0,
      bestDay: null,
      averagePerDay: 1,
      daysActive: 10,
      paceStatus: "behind",
      paceOffset: -170,
    });
    expect(message).toContain("extra per day");
  });

  it("pace message shows congrats when ahead", () => {
    const message = getPaceMessage({
      total: 200,
      remaining: 165,
      daysLeft: 185,
      requiredPerDay: 1,
      currentStreak: 5,
      longestStreak: 5,
      bestDay: { date: "2026-06-15", count: 50 },
      averagePerDay: 5,
      daysActive: 40,
      paceStatus: "ahead",
      paceOffset: 20,
    });
    expect(message).toContain("ahead");
  });
});
