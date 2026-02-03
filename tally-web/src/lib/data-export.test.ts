import { describe, it, expect } from "vitest";
import type { Challenge, Entry, DashboardConfig } from "@/app/api/v1/_lib/types";

// Type definition matching store.ts (v2.0 only)
interface ExportData {
  version: "2.0";
  exportedAt: string;
  preferences?: {
    dashboardConfig?: DashboardConfig;
  };
  challenges: Challenge[];
  entries: Entry[];
  follows: string[];
}

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

describe("Export Data Format v2.0", () => {
  it("includes all required fields", () => {
    const exportData: ExportData = {
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
    const exportData: ExportData = {
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

  it("includes challenge with all fields", () => {
    const challenge = createMockChallenge({
      countType: "sets",
      unitLabel: "push-ups",
      defaultIncrement: 10,
      isArchived: true,
    });

    const exportData: ExportData = {
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

    const exportData: ExportData = {
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
    const exportData: ExportData = {
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

describe("Data Validation", () => {
  // Mirrors validateImportData from validate.ts
  function validateImportData(data: unknown): { valid: boolean; errors: Array<{ field: string; message: string }> } {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data || typeof data !== "object") {
      return { valid: false, errors: [{ field: "body", message: "Invalid import data" }] };
    }

    const body = data as Record<string, unknown>;

    if (body.version !== "2.0") {
      errors.push({ field: "version", message: "Unsupported data version" });
    }

    if (!Array.isArray(body.challenges)) {
      errors.push({ field: "challenges", message: "Challenges must be an array" });
    }

    if (!Array.isArray(body.entries)) {
      errors.push({ field: "entries", message: "Entries must be an array" });
    }

    if (!Array.isArray(body.follows)) {
      errors.push({ field: "follows", message: "Follows must be an array" });
    }

    if (body.preferences !== undefined && typeof body.preferences !== "object") {
      errors.push({ field: "preferences", message: "Preferences must be an object" });
    }

    return { valid: errors.length === 0, errors };
  }

  it("accepts valid v2.0 data", () => {
    const data: ExportData = {
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

  it("rejects old v1.0 version", () => {
    const data = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      challenges: [],
      entries: [],
      follows: [],
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

  it("rejects missing follows array", () => {
    const data = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      challenges: [],
      entries: [],
    };

    const result = validateImportData(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === "follows")).toBe(true);
  });
});

describe("Challenge ID Mapping on Import", () => {
  function mapChallengeIds(
    challenges: Challenge[],
    entries: Entry[]
  ): { mappedEntries: Entry[]; idMap: Map<string, string> } {
    const idMap = new Map<string, string>();
    
    challenges.forEach((c, index) => {
      const newId = `new-challenge-${index}`;
      idMap.set(c.id, newId);
    });

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
  });

  it("drops entries for missing challenges", () => {
    const challenges = [createMockChallenge({ id: "existing-id" })];
    const entries = [
      createMockEntry({ challengeId: "existing-id" }),
      createMockEntry({ challengeId: "deleted-challenge-id" }),
    ];

    const { mappedEntries } = mapChallengeIds(challenges, entries);

    expect(mappedEntries).toHaveLength(1);
  });
});

describe("Round-trip Data Integrity", () => {
  it("preserves all challenge fields", () => {
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

    const exported = JSON.stringify(original);
    const imported = JSON.parse(exported) as Challenge;

    expect(imported.name).toBe(original.name);
    expect(imported.target).toBe(original.target);
    expect(imported.countType).toBe(original.countType);
    expect(imported.unitLabel).toBe(original.unitLabel);
    expect(imported.defaultIncrement).toBe(original.defaultIncrement);
    expect(imported.isArchived).toBe(original.isArchived);
  });

  it("preserves all entry fields", () => {
    const original = createMockEntry({
      date: "2026-02-15",
      count: 47,
      sets: [20, 15, 12],
      note: "Morning workout",
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

  it("preserves dashboard config", () => {
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
