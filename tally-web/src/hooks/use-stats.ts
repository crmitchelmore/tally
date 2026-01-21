"use client";

import useSWR from "swr";
import type { DashboardStats, PersonalRecords, Entry } from "@/app/api/v1/_lib/types";

const STATS_CACHE_KEY = "tally_stats_cache";
const ENTRIES_CACHE_KEY = "tally_entries_cache";

interface StatsData {
  dashboard: DashboardStats | null;
  records: PersonalRecords | null;
}

interface CachedStats {
  data: StatsData;
  timestamp: number;
}

interface CachedEntries {
  entries: Entry[];
  timestamp: number;
}

// Get cached stats from localStorage
function getCachedStats(): StatsData | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const cached = localStorage.getItem(STATS_CACHE_KEY);
    if (!cached) return undefined;
    const data: CachedStats = JSON.parse(cached);
    return data.data;
  } catch {
    return undefined;
  }
}

function setCachedStats(data: StatsData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // Ignore
  }
}

// Get cached entries from localStorage
function getCachedEntries(): Entry[] | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const cached = localStorage.getItem(ENTRIES_CACHE_KEY);
    if (!cached) return undefined;
    const data: CachedEntries = JSON.parse(cached);
    return data.entries;
  } catch {
    return undefined;
  }
}

function setCachedEntries(entries: Entry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ENTRIES_CACHE_KEY, JSON.stringify({ entries, timestamp: Date.now() }));
  } catch {
    // Ignore
  }
}

async function fetchStats(): Promise<StatsData> {
  const res = await fetch("/api/v1/stats");
  if (!res.ok) {
    return { dashboard: null, records: null };
  }
  const data = await res.json();
  const result = { dashboard: data.dashboard, records: data.records };
  setCachedStats(result);
  return result;
}

async function fetchEntries(): Promise<Entry[]> {
  const res = await fetch("/api/v1/entries");
  if (!res.ok) return [];
  const data = await res.json();
  const entries = data.entries || [];
  setCachedEntries(entries);
  return entries;
}

export function useStats(enabled = true) {
  const { data, isLoading, mutate } = useSWR<StatsData>(
    enabled ? "dashboard-stats" : null,
    fetchStats,
    {
      fallbackData: getCachedStats(),
      revalidateOnFocus: false,
      dedupingInterval: 2000,
      keepPreviousData: true,
    }
  );
  
  return {
    dashboardStats: data?.dashboard ?? null,
    personalRecords: data?.records ?? null,
    isLoading: isLoading && !data,
    refresh: () => mutate(),
  };
}

export function useEntries(enabled = true) {
  const { data, isLoading, mutate } = useSWR<Entry[]>(
    enabled ? "all-entries" : null,
    fetchEntries,
    {
      fallbackData: getCachedEntries(),
      revalidateOnFocus: false,
      dedupingInterval: 2000,
      keepPreviousData: true,
    }
  );
  
  return {
    entries: data ?? [],
    isLoading: isLoading && !data,
    refresh: () => mutate(),
  };
}
