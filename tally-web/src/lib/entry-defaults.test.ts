import { describe, it, expect } from "vitest";
import {
  calculateInitialValue,
  getLastSetValue,
  calculateSetsStats,
} from "./entry-defaults";
import type { Entry, CountType } from "@/app/api/v1/_lib/types";

// Helper to create mock entries
function createEntry(
  overrides: Partial<Entry> & { date: string; count: number }
): Entry {
  return {
    id: `entry-${Math.random().toString(36).slice(2)}`,
    userId: "user-1",
    challengeId: "challenge-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Get date string for N days ago
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

describe("calculateInitialValue", () => {
  describe("with simple count type", () => {
    it("returns 1 when there are no entries", () => {
      expect(calculateInitialValue([], "simple")).toBe(1);
    });

    it("returns 1 when entries are older than 14 days", () => {
      const entries = [
        createEntry({ date: daysAgo(20), count: 50 }),
        createEntry({ date: daysAgo(30), count: 100 }),
      ];
      expect(calculateInitialValue(entries, "simple")).toBe(1);
    });

    it("calculates average of recent entries rounded to nearest 5", () => {
      const entries = [
        createEntry({ date: daysAgo(1), count: 20 }),
        createEntry({ date: daysAgo(2), count: 22 }),
        createEntry({ date: daysAgo(3), count: 18 }),
      ];
      // avg = 20, should round to 20
      expect(calculateInitialValue(entries, "simple")).toBe(20);
    });

    it("rounds non-round averages to nearest 5", () => {
      const entries = [
        createEntry({ date: daysAgo(1), count: 17 }),
        createEntry({ date: daysAgo(2), count: 18 }),
      ];
      // avg = 17.5, Math.round(17.5/5)*5 = Math.round(3.5)*5 = 4*5 = 20
      expect(calculateInitialValue(entries, "simple")).toBe(20);
    });

    it("ignores entries older than 14 days", () => {
      const entries = [
        createEntry({ date: daysAgo(1), count: 10 }),
        createEntry({ date: daysAgo(20), count: 100 }), // Should be ignored
      ];
      // Only recent entry counts, avg = 10, rounded to 10
      expect(calculateInitialValue(entries, "simple")).toBe(10);
    });

    it("returns at least 1 even when average rounds to 0", () => {
      const entries = [
        createEntry({ date: daysAgo(1), count: 1 }),
        createEntry({ date: daysAgo(2), count: 2 }),
      ];
      // avg = 1.5, nearest 5 = 0, but should be at least 1
      expect(calculateInitialValue(entries, "simple")).toBeGreaterThanOrEqual(1);
    });
  });

  describe("with sets count type", () => {
    it("returns 1 when there are no entries", () => {
      expect(calculateInitialValue([], "sets")).toBe(1);
    });

    it("calculates average of first-set values", () => {
      const entries = [
        createEntry({ date: daysAgo(1), count: 45, sets: [20, 15, 10] }),
        createEntry({ date: daysAgo(2), count: 50, sets: [25, 15, 10] }),
        createEntry({ date: daysAgo(3), count: 40, sets: [18, 12, 10] }),
      ];
      // First sets: 20, 25, 18 → avg = 21, rounded = 21
      expect(calculateInitialValue(entries, "sets")).toBe(21);
    });

    it("falls back to overall average if no sets data", () => {
      const entries = [
        createEntry({ date: daysAgo(1), count: 20 }),
        createEntry({ date: daysAgo(2), count: 30 }),
      ];
      // No sets, falls back to simple avg = 25
      expect(calculateInitialValue(entries, "sets")).toBe(25);
    });

    it("ignores entries without sets when calculating first-set average", () => {
      const entries = [
        createEntry({ date: daysAgo(1), count: 45, sets: [20, 15, 10] }),
        createEntry({ date: daysAgo(2), count: 100 }), // No sets
        createEntry({ date: daysAgo(3), count: 30, sets: [30] }),
      ];
      // First sets: 20, 30 → avg = 25
      expect(calculateInitialValue(entries, "sets")).toBe(25);
    });

    it("defaults to simple count type when not specified", () => {
      const entries = [
        createEntry({ date: daysAgo(1), count: 25 }),
      ];
      expect(calculateInitialValue(entries)).toBe(25);
    });
  });
});

describe("getLastSetValue", () => {
  it("returns '1' for empty array", () => {
    expect(getLastSetValue([])).toBe("1");
  });

  it("returns the last value in array", () => {
    expect(getLastSetValue(["10", "15", "12"])).toBe("12");
  });

  it("returns '1' if last value is invalid", () => {
    expect(getLastSetValue(["10", ""])).toBe("1");
    expect(getLastSetValue(["10", "abc"])).toBe("1");
    expect(getLastSetValue(["10", "0"])).toBe("1");
    expect(getLastSetValue(["10", "-5"])).toBe("1");
  });

  it("handles single-element array", () => {
    expect(getLastSetValue(["25"])).toBe("25");
  });
});

describe("calculateSetsStats", () => {
  it("returns null values when no entries have sets", () => {
    const entries = [
      createEntry({ date: daysAgo(1), count: 20 }),
      createEntry({ date: daysAgo(2), count: 30 }),
    ];
    const result = calculateSetsStats(entries);
    expect(result.bestSet).toBeNull();
    expect(result.avgSetValue).toBeNull();
  });

  it("returns null values for empty entries", () => {
    const result = calculateSetsStats([]);
    expect(result.bestSet).toBeNull();
    expect(result.avgSetValue).toBeNull();
  });

  it("calculates best set from all entries", () => {
    const entries = [
      createEntry({ date: daysAgo(1), count: 45, sets: [20, 15, 10] }),
      createEntry({ date: daysAgo(2), count: 60, sets: [25, 20, 15] }),
      createEntry({ date: daysAgo(3), count: 55, sets: [30, 15, 10] }),
    ];
    const result = calculateSetsStats(entries);
    expect(result.bestSet?.value).toBe(30);
    expect(result.bestSet?.date).toBe(daysAgo(3));
  });

  it("calculates average of all set values", () => {
    const entries = [
      createEntry({ date: daysAgo(1), count: 30, sets: [10, 10, 10] }),
      createEntry({ date: daysAgo(2), count: 40, sets: [20, 20] }),
    ];
    // All sets: 10, 10, 10, 20, 20 → sum = 70, count = 5, avg = 14
    const result = calculateSetsStats(entries);
    expect(result.avgSetValue).toBe(14);
  });

  it("ignores entries without sets", () => {
    const entries = [
      createEntry({ date: daysAgo(1), count: 100 }), // No sets
      createEntry({ date: daysAgo(2), count: 30, sets: [15, 15] }),
    ];
    const result = calculateSetsStats(entries);
    expect(result.bestSet?.value).toBe(15);
    expect(result.avgSetValue).toBe(15);
  });
});
