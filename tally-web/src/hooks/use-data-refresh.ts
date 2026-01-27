"use client";

import { mutate } from "swr";

/**
 * Global data refresh utility.
 * Call this after any data mutation (add/edit/delete entry, create/update challenge)
 * to invalidate all related SWR caches and trigger re-fetches.
 */
export function refreshAllData() {
  // Invalidate all SWR caches related to tally data
  // These keys match the ones used in useChallenges, useStats, useEntries
  mutate("challenges-with-stats");
  mutate("dashboard-stats");
  mutate("all-entries");
}

/**
 * Refresh only challenge-related data (challenges list and stats).
 * Use when a challenge is created, updated, or deleted.
 */
export function refreshChallenges() {
  mutate("challenges-with-stats");
  mutate("dashboard-stats");
}

/**
 * Refresh only entry-related data.
 * Use when entries are added, edited, or deleted.
 */
export function refreshEntries() {
  mutate("challenges-with-stats"); // Stats are embedded in challenges now
  mutate("dashboard-stats");
  mutate("all-entries");
}
