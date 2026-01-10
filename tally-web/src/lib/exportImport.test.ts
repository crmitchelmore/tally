import { describe, expect, it } from "vitest";
import {
  validateImportData,
  exportToJSON,
  exportToCSV,
  parseImportedJSON,
  parseImportedCSV,
} from "@/lib/exportImport";
import type { Challenge, Entry } from "@/types";

describe("exportImport.validateImportData", () => {
  it("flags duplicate challenge ids and orphaned entries", () => {
    const challenges: Challenge[] = [
      {
        id: "c1",
        userId: "u",
        name: "A",
        targetNumber: 10,
        year: 2026,
        color: "#000",
        icon: "x",
        archived: false,
        createdAt: Date.now(),
      },
      {
        id: "c1",
        userId: "u",
        name: "B",
        targetNumber: 10,
        year: 2026,
        color: "#000",
        icon: "x",
        archived: false,
        createdAt: Date.now(),
      },
    ];

    const entries: Entry[] = [
      { id: "e1", userId: "u", challengeId: "missing", date: "2026-01-01", count: 1 },
    ];

    const result = validateImportData(challenges, entries);
    expect(result.valid).toBe(false);
    expect(result.stats.invalidChallenges).toBeGreaterThan(0);
    expect(result.stats.orphanedEntries).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.type === "error")).toBe(true);
  });

  it("accepts valid challenges and entries", () => {
    const challenges: Challenge[] = [
      {
        id: "c1",
        userId: "u",
        name: "Valid Challenge",
        targetNumber: 100,
        year: 2026,
        color: "#ff0000",
        icon: "star",
        archived: false,
        createdAt: Date.now(),
      },
    ];

    const entries: Entry[] = [
      { id: "e1", userId: "u", challengeId: "c1", date: "2026-01-15", count: 10 },
      { id: "e2", userId: "u", challengeId: "c1", date: "2026-01-16", count: 20 },
    ];

    const result = validateImportData(challenges, entries);
    expect(result.valid).toBe(true);
    expect(result.stats.validChallenges).toBe(1);
    expect(result.stats.validEntries).toBe(2);
    expect(result.warnings.filter((w) => w.type === "error")).toHaveLength(0);
  });

  it("rejects challenges with invalid data", () => {
    const challenges: Challenge[] = [
      {
        id: "c1",
        userId: "u",
        name: "", // invalid: empty name
        targetNumber: 100,
        year: 2026,
        color: "#ff0000",
        icon: "star",
        archived: false,
        createdAt: Date.now(),
      },
      {
        id: "c2",
        userId: "u",
        name: "Valid",
        targetNumber: -5, // invalid: negative target
        year: 2026,
        color: "#ff0000",
        icon: "star",
        archived: false,
        createdAt: Date.now(),
      },
    ];

    const result = validateImportData(challenges, []);
    expect(result.valid).toBe(false);
    expect(result.stats.invalidChallenges).toBe(2);
  });

  it("validates entry date format", () => {
    const challenges: Challenge[] = [
      {
        id: "c1",
        userId: "u",
        name: "Test",
        targetNumber: 100,
        year: 2026,
        color: "#000",
        icon: "x",
        archived: false,
        createdAt: Date.now(),
      },
    ];

    const entries: Entry[] = [
      { id: "e1", userId: "u", challengeId: "c1", date: "invalid-date", count: 10 },
    ];

    const result = validateImportData(challenges, entries);
    expect(result.stats.invalidEntries).toBe(1);
  });

  it("validates entry count is non-negative", () => {
    const challenges: Challenge[] = [
      {
        id: "c1",
        userId: "u",
        name: "Test",
        targetNumber: 100,
        year: 2026,
        color: "#000",
        icon: "x",
        archived: false,
        createdAt: Date.now(),
      },
    ];

    const entries: Entry[] = [
      { id: "e1", userId: "u", challengeId: "c1", date: "2026-01-01", count: -5 },
    ];

    const result = validateImportData(challenges, entries);
    expect(result.stats.invalidEntries).toBe(1);
  });
});

describe("exportToJSON", () => {
  it("exports challenges and entries as JSON", () => {
    const challenges: Challenge[] = [
      {
        id: "c1",
        userId: "u",
        name: "Test",
        targetNumber: 100,
        year: 2026,
        color: "#000",
        icon: "x",
        archived: false,
        createdAt: 1234567890,
      },
    ];

    const entries: Entry[] = [
      { id: "e1", userId: "u", challengeId: "c1", date: "2026-01-01", count: 10 },
    ];

    const json = exportToJSON(challenges, entries, "user123");
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe("1.0");
    expect(parsed.userId).toBe("user123");
    expect(parsed.challenges).toHaveLength(1);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.exportDate).toBeTruthy();
  });

  it("omits userId when not provided", () => {
    const json = exportToJSON([], []);
    const parsed = JSON.parse(json);
    expect(parsed.userId).toBeUndefined();
  });
});

describe("parseImportedJSON", () => {
  it("parses valid JSON export", () => {
    const json = JSON.stringify({
      version: "1.0",
      exportDate: "2026-01-01",
      challenges: [
        { id: "c1", name: "Test", targetNumber: 100, year: 2026 },
      ],
      entries: [
        { id: "e1", challengeId: "c1", date: "2026-01-01", count: 5 },
      ],
    });

    const result = parseImportedJSON(json);
    expect(result.challenges).toHaveLength(1);
    expect(result.entries).toHaveLength(1);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseImportedJSON("not valid json")).toThrow();
  });

  it("throws on missing challenges/entries", () => {
    expect(() => parseImportedJSON('{"version":"1.0"}')).toThrow("missing challenges or entries");
  });
});

describe("exportToCSV and parseImportedCSV", () => {
  it("round-trips challenges and entries through CSV", () => {
    const challenges: Challenge[] = [
      {
        id: "c1",
        userId: "u",
        name: "Push-ups",
        targetNumber: 100,
        year: 2026,
        color: "#ff0000",
        icon: "dumbbell",
        archived: false,
        createdAt: "1234567890",
      },
    ];

    const entries: Entry[] = [
      { id: "e1", userId: "u", challengeId: "c1", date: "2026-01-15", count: 25 },
    ];

    const csv = exportToCSV(challenges, entries);
    const result = parseImportedCSV(csv);

    expect(result.challenges).toHaveLength(1);
    expect(result.challenges[0].name).toBe("Push-ups");
    expect(result.challenges[0].targetNumber).toBe(100);

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].count).toBe(25);
    expect(result.entries[0].date).toBe("2026-01-15");
  });

  it("handles CSV with user ID header", () => {
    const csv = `USER ID: user123

CHALLENGES
ID,Name,Target Number,Year,Color,Icon,Created At,Archived
"c1","Test",100,2026,"#000","star","123",FALSE

ENTRIES
ID,Challenge ID,Date,Count,Note,Sets,Feeling
"e1","c1","2026-01-01",10,"","",""`;

    const result = parseImportedCSV(csv);
    expect(result.challenges).toHaveLength(1);
    expect(result.entries).toHaveLength(1);
  });

  it("handles quotes in notes", () => {
    const challenges: Challenge[] = [
      {
        id: "c1",
        userId: "u",
        name: "Test",
        targetNumber: 100,
        year: 2026,
        color: "#000",
        icon: "x",
        archived: false,
        createdAt: "123",
      },
    ];

    const entries: Entry[] = [
      {
        id: "e1",
        userId: "u",
        challengeId: "c1",
        date: "2026-01-01",
        count: 10,
        note: 'Said "hello" today',
      },
    ];

    const csv = exportToCSV(challenges, entries);
    expect(csv).toContain('""hello""'); // Escaped quotes
  });

  it("returns empty arrays for 'No challenges' / 'No entries'", () => {
    const csv = `CHALLENGES
No challenges

ENTRIES
No entries`;

    const result = parseImportedCSV(csv);
    expect(result.challenges).toHaveLength(0);
    expect(result.entries).toHaveLength(0);
  });
});
