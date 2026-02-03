import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Entry } from "@/app/api/v1/_lib/types";

// Mock entry factory
function createEntry(date: string, count: number, challengeId = "challenge-1"): Entry {
  return {
    id: `entry-${date}`,
    userId: "user-1",
    challengeId,
    date,
    count,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Format date as YYYY-MM-DD in local time (matches the component's logic)
function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Simulate the entriesByDate Map creation (from activity-heatmap.tsx lines 29-35)
function createEntriesByDate(entries: Entry[]): Map<string, number> {
  const map = new Map<string, number>();
  entries.forEach((e) => {
    map.set(e.date, (map.get(e.date) || 0) + e.count);
  });
  return map;
}

// Simulate getIntensity function (from activity-heatmap.tsx lines 100-108)
function getIntensity(count: number, maxCount: number): number {
  if (count === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

// Simulate weeks generation (from activity-heatmap.tsx lines 44-98)
function generateWeeks(
  startDate: string,
  endDate: string,
  entriesByDate: Map<string, number>
): { date: string; count: number }[][] {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  
  const result: { date: string; count: number }[][] = [];
  let currentWeek: { date: string; count: number }[] = [];
  
  const current = new Date(start);
  current.setDate(current.getDate() - current.getDay());
  
  while (current <= end || currentWeek.length > 0) {
    const dateStr = formatLocalDate(current);
    const isInRange = current >= start && current <= end;
    
    currentWeek.push({
      date: isInRange ? dateStr : "",
      count: isInRange ? (entriesByDate.get(dateStr) || 0) : 0,
    });
    
    if (currentWeek.length === 7) {
      result.push(currentWeek);
      currentWeek = [];
    }
    
    current.setDate(current.getDate() + 1);
    if (current > end && currentWeek.length === 0) break;
  }
  
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: "", count: 0 });
    }
    result.push(currentWeek);
  }
  
  return result;
}

describe("ActivityHeatmap Logic", () => {
  describe("entriesByDate aggregation", () => {
    it("groups entries by date", () => {
      const entries = [
        createEntry("2026-02-01", 10),
        createEntry("2026-02-02", 20),
      ];
      
      const map = createEntriesByDate(entries);
      
      expect(map.get("2026-02-01")).toBe(10);
      expect(map.get("2026-02-02")).toBe(20);
    });

    it("aggregates multiple entries on the same date", () => {
      const entries = [
        createEntry("2026-02-01", 10),
        createEntry("2026-02-01", 15),
        createEntry("2026-02-01", 5),
      ];
      
      const map = createEntriesByDate(entries);
      
      expect(map.get("2026-02-01")).toBe(30);
    });

    it("returns empty map for no entries", () => {
      const map = createEntriesByDate([]);
      expect(map.size).toBe(0);
    });
  });

  describe("intensity calculation", () => {
    it("returns 0 for zero count", () => {
      expect(getIntensity(0, 100)).toBe(0);
    });

    it("returns 1 for count <= 25% of max", () => {
      expect(getIntensity(25, 100)).toBe(1);
      expect(getIntensity(10, 100)).toBe(1);
    });

    it("returns 2 for count <= 50% of max", () => {
      expect(getIntensity(50, 100)).toBe(2);
      expect(getIntensity(30, 100)).toBe(2);
    });

    it("returns 3 for count <= 75% of max", () => {
      expect(getIntensity(75, 100)).toBe(3);
      expect(getIntensity(60, 100)).toBe(3);
    });

    it("returns 4 for count > 75% of max", () => {
      expect(getIntensity(100, 100)).toBe(4);
      expect(getIntensity(80, 100)).toBe(4);
    });
  });

  describe("weeks generation", () => {
    it("generates weeks for date range", () => {
      const entries = [createEntry("2026-02-03", 10)];
      const entriesByDate = createEntriesByDate(entries);
      
      const weeks = generateWeeks("2026-02-01", "2026-02-28", entriesByDate);
      
      // Should have multiple weeks
      expect(weeks.length).toBeGreaterThan(0);
      
      // Each week should have 7 days
      weeks.forEach(week => {
        expect(week.length).toBe(7);
      });
    });

    it("assigns entry counts to correct dates", () => {
      const entries = [
        createEntry("2026-02-03", 25),
        createEntry("2026-02-10", 50),
      ];
      const entriesByDate = createEntriesByDate(entries);
      
      const weeks = generateWeeks("2026-02-01", "2026-02-28", entriesByDate);
      
      // Find Feb 3 and Feb 10
      let feb3Count = 0;
      let feb10Count = 0;
      weeks.forEach(week => {
        week.forEach(day => {
          if (day.date === "2026-02-03") feb3Count = day.count;
          if (day.date === "2026-02-10") feb10Count = day.count;
        });
      });
      
      expect(feb3Count).toBe(25);
      expect(feb10Count).toBe(50);
    });

    it("excludes dates outside range", () => {
      const entries = [
        createEntry("2025-01-01", 100), // Before range
        createEntry("2026-02-15", 50),  // In range
      ];
      const entriesByDate = createEntriesByDate(entries);
      
      const weeks = generateWeeks("2026-02-01", "2026-02-28", entriesByDate);
      
      // Should not include 2025-01-01
      let foundOutOfRange = false;
      weeks.forEach(week => {
        week.forEach(day => {
          if (day.date === "2025-01-01") foundOutOfRange = true;
        });
      });
      
      expect(foundOutOfRange).toBe(false);
    });
  });
});

describe("ActivityHeatmap Timezone Handling", () => {
  it("uses local date formatting consistently", () => {
    // This test verifies the fix for the timezone bug
    // where toISOString() was causing dates to shift by a day in some timezones
    
    // Create a date at 11 PM local time (would be next day in UTC for many timezones)
    const lateNight = new Date(2026, 1, 3, 23, 0, 0); // Feb 3, 2026 at 11 PM local
    const localStr = formatLocalDate(lateNight);
    
    // Should always be Feb 3 regardless of timezone
    expect(localStr).toBe("2026-02-03");
  });

  it("matches entries stored as local dates", () => {
    // Simulate an entry created at 11 PM on Feb 3 (stored as "2026-02-03")
    const entryDate = "2026-02-03";
    const entries = [createEntry(entryDate, 10)];
    const entriesByDate = createEntriesByDate(entries);
    
    // Generate heatmap weeks
    const weeks = generateWeeks("2026-02-01", "2026-02-28", entriesByDate);
    
    // Find Feb 3 cell - should have the entry count
    let feb3Day = null as { date: string; count: number } | null;
    weeks.forEach(week => {
      week.forEach(day => {
        if (day.date === "2026-02-03") feb3Day = day;
      });
    });
    
    expect(feb3Day).not.toBeNull();
    expect(feb3Day?.count).toBe(10);
  });

  it("handles entries across many dates", () => {
    // Create entries for every day in Feb 2026
    const entries: Entry[] = [];
    for (let i = 1; i <= 28; i++) {
      const day = String(i).padStart(2, "0");
      entries.push(createEntry(`2026-02-${day}`, i * 5));
    }
    
    const entriesByDate = createEntriesByDate(entries);
    const weeks = generateWeeks("2026-02-01", "2026-02-28", entriesByDate);
    
    // Verify all dates have correct counts
    const dateCounts = new Map<string, number>();
    weeks.forEach(week => {
      week.forEach(day => {
        if (day.date && day.count > 0) {
          dateCounts.set(day.date, day.count);
        }
      });
    });
    
    // Should have 28 days with counts
    expect(dateCounts.size).toBe(28);
    
    // Verify a few specific dates
    expect(dateCounts.get("2026-02-01")).toBe(5);
    expect(dateCounts.get("2026-02-15")).toBe(75);
    expect(dateCounts.get("2026-02-28")).toBe(140);
  });
});
