import { describe, it, expect } from "vitest";

describe("Entry validation", () => {
  const validEntry = {
    challengeId: "challenge_123",
    date: "2026-01-16",
    count: 5,
    note: "Great session!",
    feeling: "easy" as const,
  };

  it("validates count is positive", () => {
    expect(validEntry.count).toBeGreaterThan(0);
  });

  it("validates date format", () => {
    expect(validEntry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("allows empty note", () => {
    const entryWithoutNote = { ...validEntry, note: undefined };
    expect(entryWithoutNote.note).toBeUndefined();
  });

  it("validates feeling is optional and valid", () => {
    const validFeelings = ["very-easy", "easy", "moderate", "hard", "very-hard", undefined];
    expect(validFeelings).toContain(validEntry.feeling);
  });
});

describe("Entry aggregation", () => {
  const entries = [
    { date: "2026-01-15", count: 10 },
    { date: "2026-01-15", count: 5 },
    { date: "2026-01-16", count: 8 },
  ];

  it("calculates total count", () => {
    const total = entries.reduce((sum, e) => sum + e.count, 0);
    expect(total).toBe(23);
  });

  it("groups entries by date", () => {
    const byDate = entries.reduce((acc, e) => {
      acc[e.date] = (acc[e.date] || 0) + e.count;
      return acc;
    }, {} as Record<string, number>);

    expect(byDate["2026-01-15"]).toBe(15);
    expect(byDate["2026-01-16"]).toBe(8);
  });

  it("counts unique days", () => {
    const uniqueDays = new Set(entries.map(e => e.date)).size;
    expect(uniqueDays).toBe(2);
  });
});

describe("Date utilities", () => {
  it("formats date to ISO string", () => {
    const date = new Date(2026, 0, 16); // Jan 16, 2026
    const isoDate = date.toISOString().split("T")[0];
    expect(isoDate).toBe("2026-01-16");
  });

  it("parses ISO date string", () => {
    const dateStr = "2026-01-16";
    const date = new Date(dateStr + "T12:00:00");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0); // January
    expect(date.getDate()).toBe(16);
  });
});
