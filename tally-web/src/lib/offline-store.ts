"use client";

import type { Challenge, ChallengeStats, Entry, CreateChallengeRequest } from "@/app/api/v1/_lib/types";

const STORAGE_KEYS = {
  challenges: "tally_offline_challenges",
  entries: "tally_offline_entries",
  user: "tally_offline_user",
} as const;

// Generate simple unique IDs for offline use
function generateId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

// Challenge operations
export function getOfflineChallenges(): Challenge[] {
  return getFromStorage<Challenge[]>(STORAGE_KEYS.challenges, []);
}

export function getOfflineChallenge(id: string): Challenge | null {
  const challenges = getOfflineChallenges();
  return challenges.find(c => c.id === id) || null;
}

export function createOfflineChallenge(data: CreateChallengeRequest): Challenge {
  const challenges = getOfflineChallenges();
  const now = new Date().toISOString();
  
  // Calculate timeframe dates
  let startDate: string;
  let endDate: string;
  
  if (data.timeframeType === "custom" && data.startDate && data.endDate) {
    startDate = data.startDate;
    endDate = data.endDate;
  } else if (data.timeframeType === "month") {
    const today = new Date();
    startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];
  } else {
    // Default to year
    const year = new Date().getFullYear();
    startDate = `${year}-01-01`;
    endDate = `${year}-12-31`;
  }
  
  const challenge: Challenge = {
    id: generateId(),
    userId: "offline_user",
    name: data.name,
    target: data.target,
    timeframeType: data.timeframeType,
    startDate,
    endDate,
    color: data.color || "#FF4747",
    icon: data.icon || "tally",
    isPublic: false, // Offline challenges are always private
    isArchived: false,
    countType: data.countType || "simple",
    unitLabel: data.unitLabel || "reps",
    defaultIncrement: data.defaultIncrement || 1,
    createdAt: now,
    updatedAt: now,
  };
  
  challenges.push(challenge);
  setToStorage(STORAGE_KEYS.challenges, challenges);
  return challenge;
}

export function updateOfflineChallenge(id: string, updates: Partial<Challenge>): Challenge | null {
  const challenges = getOfflineChallenges();
  const index = challenges.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  challenges[index] = {
    ...challenges[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  setToStorage(STORAGE_KEYS.challenges, challenges);
  return challenges[index];
}

export function deleteOfflineChallenge(id: string): boolean {
  const challenges = getOfflineChallenges();
  const filtered = challenges.filter(c => c.id !== id);
  if (filtered.length === challenges.length) return false;
  
  setToStorage(STORAGE_KEYS.challenges, filtered);
  
  // Also delete related entries
  const entries = getOfflineEntries();
  const filteredEntries = entries.filter(e => e.challengeId !== id);
  setToStorage(STORAGE_KEYS.entries, filteredEntries);
  
  return true;
}

// Entry operations
export function getOfflineEntries(): Entry[] {
  return getFromStorage<Entry[]>(STORAGE_KEYS.entries, []);
}

export function getOfflineEntriesForChallenge(challengeId: string): Entry[] {
  return getOfflineEntries().filter(e => e.challengeId === challengeId);
}

export function createOfflineEntry(challengeId: string, count: number, date?: string): Entry {
  const entries = getOfflineEntries();
  const now = new Date().toISOString();
  const entryDate = date || now.split("T")[0];
  
  const entry: Entry = {
    id: generateId(),
    challengeId,
    userId: "offline_user",
    count,
    date: entryDate,
    createdAt: now,
    updatedAt: now,
  };
  
  entries.push(entry);
  setToStorage(STORAGE_KEYS.entries, entries);
  return entry;
}

export function deleteOfflineEntry(id: string): boolean {
  const entries = getOfflineEntries();
  const filtered = entries.filter(e => e.id !== id);
  if (filtered.length === entries.length) return false;
  
  setToStorage(STORAGE_KEYS.entries, filtered);
  return true;
}

// Stats calculation
export function getOfflineChallengeStats(challenge: Challenge): ChallengeStats {
  const entries = getOfflineEntriesForChallenge(challenge.id);
  const totalCount = entries.reduce((sum, e) => sum + e.count, 0);
  const remaining = Math.max(0, challenge.target - totalCount);
  
  // Calculate dates
  const start = new Date(challenge.startDate);
  const end = new Date(challenge.endDate);
  const now = new Date();
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Calculate streak
  let streakCurrent = 0;
  const sortedDates = [...new Set(entries.map(e => e.date))].sort().reverse();
  const checkDate = new Date();
  
  for (const date of sortedDates) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (date === dateStr) {
      streakCurrent++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (date < dateStr) {
      break;
    }
  }
  
  // Calculate daily stats
  const dailyAverage = daysElapsed > 0 ? Math.round(totalCount / daysElapsed) : 0;
  const perDayRequired = daysRemaining > 0 ? Math.ceil(remaining / daysRemaining) : 0;
  const currentPace = daysElapsed > 0 ? (totalCount / daysElapsed) * totalDays : 0;
  
  // Determine pace status
  const expectedProgress = (daysElapsed / totalDays) * challenge.target;
  let paceStatus: "ahead" | "on-pace" | "behind" = "on-pace";
  if (totalCount > expectedProgress * 1.05) paceStatus = "ahead";
  else if (totalCount < expectedProgress * 0.95) paceStatus = "behind";
  
  // Find best day
  const countsByDate = entries.reduce((acc, e) => {
    acc[e.date] = (acc[e.date] || 0) + e.count;
    return acc;
  }, {} as Record<string, number>);
  
  let bestDay: { date: string; count: number } | null = null;
  for (const [date, count] of Object.entries(countsByDate)) {
    if (!bestDay || count > bestDay.count) {
      bestDay = { date, count };
    }
  }
  
  return {
    challengeId: challenge.id,
    totalCount,
    remaining,
    daysElapsed,
    daysRemaining,
    perDayRequired,
    currentPace,
    paceStatus,
    streakCurrent,
    streakBest: streakCurrent, // Simplified for offline
    bestDay,
    dailyAverage,
  };
}

// Check if user is in offline mode
export function isOfflineMode(): boolean {
  if (typeof window === "undefined") return false;
  return getFromStorage<boolean>(STORAGE_KEYS.user, false);
}

export function setOfflineMode(enabled: boolean): void {
  setToStorage(STORAGE_KEYS.user, enabled);
}

// Export data for potential sync later
export function exportOfflineData(): { challenges: Challenge[]; entries: Entry[] } {
  return {
    challenges: getOfflineChallenges(),
    entries: getOfflineEntries(),
  };
}

// Clear all offline data
export function clearOfflineData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.challenges);
  localStorage.removeItem(STORAGE_KEYS.entries);
  localStorage.removeItem(STORAGE_KEYS.user);
}
