import { describe, expect, it } from "vitest";
import { validateImportData } from "@/lib/exportImport";
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
});
