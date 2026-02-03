import { describe, it, expect } from "vitest";
import type { Challenge, Entry, DashboardConfig } from "@/app/api/v1/_lib/types";

// Type definitions matching store.ts
interface ExportDataV2 {
  version: "2.0";
  exportedAt: string;
  preferences?: {
    dashboardConfig?: DashboardConfig;
  };
  challenges: Challenge[];
  entries: Entry[];
  follows: string[];
}

interface ExportDataV1 {
  version: "1.0";
  exportedAt: string;
  challenges: Challenge[];
  entries: Entry[];
}

type ImportData = ExportDataV2 | ExportDataV1;

// Mock data factories
function createMockChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: `challenge-${Math.random().toString(36).slice(2)}`,
    userId: "user-1",
    name: "Test Challenge",
    target: 1000,
    timeframeType: "year",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    color: "#FF4747",
    icon: "target",
    isPublic: false,
    isArchived: false,
    countType: "simple",
    unitLabel: "reps",
    defaultIncrement: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: `entry-${Math.random().toString(36).slice(2)}`,
    userId: "user-1",
    challengeId: "challenge-1",
    date: "2026-02-03",
    count: 25,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Export Data Format", () => {
  describe("v2.0 format", () => {
    it("includes all required fields", () => {
      const exportData: ExportDataV2 = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        challenges: [],
        entries: [],
        follows: [],
      };

      expect(exportData.version).toBe("2.0");
      expect(exportData.exportedAt).toBeDefined();
      expect(Array.isArray(exportData.challenges)).toBe(true);
      expect(Array.isArray(exportData.entries)).toBe(true);
      expect(Array.isArray(exportData.follows)).toBe(true);
    });

    it("includes preferences with dashboard config", () => {
      const exportData: ExportDataV2 = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        preferences: {
          dashboardConfig: {
            panels: {
              highlights: true,
              personalRecords: true,
              progressGraph: true,
              burnUpChart: true,
              setsStats: true,
            },
            visible: ["activeChallenges", "highlights", "personalRecords"],
            hidden: ["progressGraph", "burnUpChart"],
          },
        },
        challenges: [],
        entries: [],
        follows: [],
      };

      expect(exportData.preferences?.dashboardConfig).toBeDefined();
      expect(exportData.preferences?.dashboardConfig?.visible).toContain("activeChallenges");
      expect(exportData.preferences?.dashboardConfig?.hidden).toContain("progressGraph");
    });

    it("includes challenge with all new fields", () => {
      const challenge = createMockChallenge({
        countType: "sets",
        unitLabel: "push-ups",
        defaultIncrement: 10,
        isArchived: true,
      });

      const exportData: ExportDataV2 = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        challenges: [challenge],
        entries: [],
        follows: [],
      };

      const exportedChallenge = exportData.challenges[0];
      expect(exportedChallenge.countType).toBe("sets");
      expect(exportedChallenge.unitLabel).toBe("push-ups");
      expect(exportedChallenge.defaultIncrement).toBe(10);
      expect(exportedChallenge.isArchived).toBe(true);
    });

    it("includes entry with sets data", () => {
      const entry = createMockEntry({
        sets: [20, 15, 12],
        note: "Good workout",
        feeling: "great",
      });

      const exportData: ExportDataV2 = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        challenges: [],
        entries: [entry],
        follows: [],
      };

      const exportedEntry = exportData.entries[0];
      expect(exportedEntry.sets).toEqual([20, 15, 12]);
      expect(exportedEntry.note).toBe("Good workout");
      expect(exportedEntry.feeling).toBe("great");
    });

    it("includes followed challenge IDs", () => {
      const exportData: ExportDataV2 = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        challenges: [],
        entries: [],
        follows: ["challenge-abc", "challenge-xyz"],
      };

      expect(exportData.follows).toHaveLength(2);
      expect(exportData.follows).toContain("challenge-abc");
    });
  });

  describe("v1.0 backward compatibility", () => {
    it("v1.0 format is valid import data", () => {
      const v1Data: ExportDataV1 = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        challenges: [createMockChallenge()],
        entries: [createMockEntry()],
      };

      expect(v1Data.version).toBe("1.0");
      expect(v1Data.challenges).toHaveLength(1);
      expect(v1Data.entries).toHaveLength(1);
    });

    it("v1.0 data can be imported without preferences/follows", () => {
      const v1Data: ImportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        challenges: [],
        entries: [],
      };

      // v1.0 doesn't have preferences or follows
      expect("preferences" in v1Data).toBe(false);
      expect("follows" in v1Data).toBe(false);
    });
  });
});

describe("Data Validation", () => {
  // Helper to simulate validateImportData logic
  function validateImportData(data: unknown): { valid: boolean; errors: Array<{ field: string; message: string }> } {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data || typeof data !== "object") {
      return { valid: false, errors: [{ field: "body", message: "Invalid import data" }] };
    }

    const body = data as Record<string, unknown>;

    if (body.version !== "1.0" && body.version !== "2.0") {
      errors.push({ field: "version", message: "Unsupported data version" });
    }

    if (!Array.isArray(body.challenges)) {
      errors.push({ field: "challenges", message: "Challenges must be an array" });
    }

    if (!Array.isArray(body.entries)) {
      errors.push({ field: "entries", message: "Entries must be an array" });
    }

    if (body.version === "2.0") {
      if (body.follows !== undefined && !Array.isArray(body.follows)) {
        errors.push({ field: "follows", message: "Follows must be an array" });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  it("accepts valid v2.0 data", () => {
    const data: ExportDataV2 = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      challenges: [],
      entries: [],
      follows: [],
    };

    const result = validateImportData(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts valid v1.0 data", () => {
    const data: ExportDataV1 = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      challenges: [],
      entries: [],
    };

    const result = validateImportData(data);
    expect(result.valid).toBe(true);
  });

  it("rejects unsupported version", () => {
    const data = {
      version: "3.0",
      exportedAt: new Date().toISOString(),
      challenges: [],
      entries: [],
    };

    const result = validateImportData(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === "version")).toBe(true);
  });

  it("rejects missing challenges array", () => {
    const data = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      entries: [],
      follows: [],
    };

    const result = validateImportData(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === "challenges")).toBe(true);
  });

  it("rejects missing entries array", () => {
    const data = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      challenges: [],
      follows: [],
    };

    const result = validateImportData(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === "entries")).toBe(true);
  });

  it("rejects invalid follows (non-array) in v2.0", () => {
    const data = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      challenges: [],
      entries: [],
      follows: "not-an-array",
    };

    const result = validateImportData(data);
    expect(result.valid).toBe(false);
  });
});

describe("Challenge ID Mapping on Import", () => {
  // Simulate the ID mapping logic from importUserData
  function mapChallengeIds(
    challenges: Challenge[],
    entries: Entry[]
  ): { mappedEntries: Entry[]; idMap: Map<string, string> } {
    const idMap = new Map<string, string>();
    
    // Simulate creating new challenges with new IDs
    challenges.forEach((c, index) => {
      const newId = `new-challenge-${index}`;
      idMap.set(c.id, newId);
    });

    // Map entries to new challenge IDs
    const mappedEntries = entries
      .filter(e => idMap.has(e.challengeId))
      .map(e => ({
        ...e,
        challengeId: idMap.get(e.challengeId)!,
      }));

    return { mappedEntries, idMap };
  }

  it("maps old challenge IDs to new IDs", () => {
    const challenges = [
      createMockChallenge({ id: "old-id-1" }),
      createMockChallenge({ id: "old-id-2" }),
    ];

    const { idMap } = mapChallengeIds(challenges, []);

    expect(idMap.get("old-id-1")).toBe("new-challenge-0");
    expect(idMap.get("old-id-2")).toBe("new-challenge-1");
  });

  it("updates entry challengeId references", () => {
    const challenges = [createMockChallenge({ id: "old-challenge-id" })];
    const entries = [
      createMockEntry({ challengeId: "old-challenge-id" }),
      createMockEntry({ challengeId: "old-challenge-id" }),
    ];

    const { mappedEntries } = mapChallengeIds(challenges, entries);

    expect(mappedEntries).toHaveLength(2);
    expect(mappedEntries[0].challengeId).toBe("new-challenge-0");
    expect(mappedEntries[1].challengeId).toBe("new-challenge-0");
  });

  it("drops entries for deleted/missing challenges", () => {
    const challenges = [createMockChallenge({ id: "existing-id" })];
    const entries = [
      createMockEntry({ challengeId: "existing-id" }),
      createMockEntry({ challengeId: "deleted-challenge-id" }), // Should be dropped
    ];

    const { mappedEntries } = mapChallengeIds(challenges, entries);

    expect(mappedEntries).toHaveLength(1);
    expect(mappedEntries[0].challengeId).toBe("new-challenge-0");
  });
});

describe("Round-trip Data Integrity", () => {
  it("preserves all challenge fields through export/import", () => {
    const original = createMockChallenge({
      name: "Test Challenge",
      target: 5000,
      timeframeType: "custom",
      startDate: "2026-03-01",
      endDate: "2026-06-30",
      color: "#00FF00",
      icon: "dumbbell",
      isPublic: true,
      isArchived: true,
      countType: "sets",
      unitLabel: "pull-ups",
      defaultIncrement: 5,
    });

    // Simulate export (JSON serialization)
    const exported = JSON.stringify(original);
    
    // Simulate import (JSON parsing)
    const imported = JSON.parse(exported) as Challenge;

    expect(imported.name).toBe(original.name);
    expect(imported.target).toBe(original.target);
    expect(imported.timeframeType).toBe(original.timeframeType);
    expect(imported.startDate).toBe(original.startDate);
    expect(imported.endDate).toBe(original.endDate);
    expect(imported.color).toBe(original.color);
    expect(imported.icon).toBe(original.icon);
    expect(imported.isPublic).toBe(original.isPublic);
    expect(imported.isArchived).toBe(original.isArchived);
    expect(imported.countType).toBe(original.countType);
    expect(imported.unitLabel).toBe(original.unitLabel);
    expect(imported.defaultIncrement).toBe(original.defaultIncrement);
  });

  it("preserves all entry fields through export/import", () => {
    const original = createMockEntry({
      date: "2026-02-15",
      count: 47,
      sets: [20, 15, 12],
      note: "Morning workout, felt strong",
      feeling: "great",
    });

    const exported = JSON.stringify(original);
    const imported = JSON.parse(exported) as Entry;

    expect(imported.date).toBe(original.date);
    expect(imported.count).toBe(original.count);
    expect(imported.sets).toEqual(original.sets);
    expect(imported.note).toBe(original.note);
    expect(imported.feeling).toBe(original.feeling);
  });

  it("preserves dashboard config through export/import", () => {
    const original: DashboardConfig = {
      panels: {
        highlights: true,
        personalRecords: false,
        progressGraph: true,
        burnUpChart: false,
        setsStats: true,
      },
      visible: ["activeChallenges", "highlights", "progressGraph"],
      hidden: ["personalRecords", "burnUpChart"],
    };

    const exported = JSON.stringify(original);
    const imported = JSON.parse(exported) as DashboardConfig;

    expect(imported.panels).toEqual(original.panels);
    expect(imported.visible).toEqual(original.visible);
    expect(imported.hidden).toEqual(original.hidden);
  });
});
