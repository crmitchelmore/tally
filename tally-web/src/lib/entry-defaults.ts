/**
 * Utilities for calculating smart initial values for new entries.
 * Uses the last 2 weeks of data to suggest starting values.
 */

import type { Entry, CountType } from "@/app/api/v1/_lib/types";

/**
 * Calculate initial value for a new entry based on recent history.
 * 
 * For simple count: returns the average count from the last 14 days, rounded to nearest 5.
 * For sets: returns the average of first-set values from the last 14 days, rounded.
 * 
 * @param entries - All entries for the challenge
 * @param countType - The challenge's count type ("simple" or "sets")
 * @returns The suggested initial value (minimum 1)
 */
export function calculateInitialValue(
  entries: Entry[],
  countType: CountType = "simple"
): number {
  // Filter to last 14 days
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const cutoffDate = twoWeeksAgo.toISOString().split("T")[0];

  const recentEntries = entries.filter((e) => e.date >= cutoffDate);

  if (recentEntries.length === 0) {
    return 1; // Default when no recent history
  }

  if (countType === "sets") {
    // For sets mode: average of first-set values
    const firstSetValues = recentEntries
      .filter((e) => e.sets && e.sets.length > 0)
      .map((e) => e.sets![0]);

    if (firstSetValues.length === 0) {
      // Fallback to overall average if no sets data
      return calculateSimpleAverage(recentEntries);
    }

    const avg = firstSetValues.reduce((a, b) => a + b, 0) / firstSetValues.length;
    return Math.max(1, Math.round(avg));
  }

  // Simple count: average of all counts, rounded to nearest 5
  return calculateSimpleAverage(recentEntries);
}

/**
 * Calculate simple average, rounded to nearest 5.
 */
function calculateSimpleAverage(entries: Entry[]): number {
  if (entries.length === 0) return 1;
  
  const sum = entries.reduce((acc, e) => acc + e.count, 0);
  const avg = sum / entries.length;
  
  // Round to nearest 5 for cleaner numbers
  const rounded = Math.round(avg / 5) * 5;
  return Math.max(1, rounded || Math.round(avg));
}

/**
 * Get the last set value for the "add another set" flow.
 * Returns the value of the most recent set in the provided array.
 * 
 * @param currentSets - The current sets array in the form
 * @returns The last set value as a string (for form state), or "1" if empty
 */
export function getLastSetValue(currentSets: string[]): string {
  if (currentSets.length === 0) return "1";
  const lastValue = parseInt(currentSets[currentSets.length - 1], 10);
  return isNaN(lastValue) || lastValue <= 0 ? "1" : String(lastValue);
}

/**
 * Calculate sets statistics for dashboard display.
 * 
 * @param entries - All entries (may include entries without sets)
 * @returns Object with bestSet and avgSetValue, or null values if no sets data
 */
export function calculateSetsStats(entries: Entry[]): {
  bestSet: { value: number; date: string; entryId: string } | null;
  avgSetValue: number | null;
} {
  // Collect all individual set values with metadata
  const allSets: Array<{ value: number; date: string; entryId: string }> = [];
  
  for (const entry of entries) {
    if (entry.sets && entry.sets.length > 0) {
      for (const setVal of entry.sets) {
        allSets.push({ value: setVal, date: entry.date, entryId: entry.id });
      }
    }
  }

  if (allSets.length === 0) {
    return { bestSet: null, avgSetValue: null };
  }

  // Find best set
  const bestSet = allSets.reduce((best, current) => 
    current.value > best.value ? current : best
  );

  // Calculate average
  const sum = allSets.reduce((acc, s) => acc + s.value, 0);
  const avgSetValue = Math.round((sum / allSets.length) * 10) / 10; // One decimal place

  return { bestSet, avgSetValue };
}
