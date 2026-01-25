/**
 * Data store for API v1 - now using Convex backend
 * This file provides a compatibility layer between the original in-memory API
 * and the new Convex backend.
 */
import type {
  User,
  Challenge,
  Entry,
  Follow,
  ChallengeStats,
  DashboardStats,
  PersonalRecords,
} from "./types";
import {
  convexUsers,
  convexChallenges,
  convexEntries,
  convexFollows,
} from "./convex-server";
import type { Id } from "../../../../../convex/_generated/dataModel";

// ID generation (for backward compatibility - Convex generates its own IDs)
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// User operations
export async function getUserByClerkId(clerkId: string): Promise<User | undefined> {
  const user = await convexUsers.getByClerkId(clerkId);
  return user || undefined;
}

export async function createUser(clerkId: string, email: string, name: string): Promise<User> {
  return await convexUsers.create({ clerkId, email, name });
}

export async function updateUser(user: User): Promise<User> {
  return await convexUsers.update({
    id: user.id as Id<"users">,
    email: user.email,
    name: user.name,
  });
}

// Challenge operations
export async function getChallengesByUserId(userId: string): Promise<Challenge[]> {
  return await convexChallenges.listByUser(userId);
}

export async function getActiveChallenges(userId: string): Promise<Challenge[]> {
  return await convexChallenges.listActive(userId);
}

export async function getChallengeById(id: string): Promise<Challenge | undefined> {
  const challenge = await convexChallenges.get(id as Id<"challenges">);
  return challenge || undefined;
}

export async function createChallenge(
  userId: string,
  data: Omit<Challenge, "id" | "userId" | "isArchived" | "createdAt" | "updatedAt">
): Promise<Challenge> {
  return await convexChallenges.create({
    userId,
    ...data,
  });
}

export async function updateChallenge(challenge: Challenge): Promise<Challenge> {
  return await convexChallenges.update({
    id: challenge.id as Id<"challenges">,
    name: challenge.name,
    target: challenge.target,
    color: challenge.color,
    icon: challenge.icon,
    isPublic: challenge.isPublic,
    isArchived: challenge.isArchived,
  });
}

export async function deleteChallenge(id: string): Promise<{ deletedAt: number }> {
  const result = await convexChallenges.remove(id as Id<"challenges">);
  return { deletedAt: result.deletedAt };
}

export async function restoreChallenge(id: string, userId: string): Promise<Challenge> {
  return await convexChallenges.restore(id as Id<"challenges">, userId);
}

// Entry operations
export async function getEntriesByChallenge(challengeId: string): Promise<Entry[]> {
  return await convexEntries.listByChallenge(challengeId);
}

export async function getEntriesByUser(userId: string): Promise<Entry[]> {
  return await convexEntries.listByUser(userId);
}

export async function getEntryById(id: string): Promise<Entry | undefined> {
  const entry = await convexEntries.get(id as Id<"entries">);
  return entry || undefined;
}

export async function createEntry(
  userId: string,
  data: Omit<Entry, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<Entry> {
  return await convexEntries.create({
    userId,
    ...data,
  });
}

export async function updateEntry(entry: Entry): Promise<Entry> {
  return await convexEntries.update({
    id: entry.id as Id<"entries">,
    date: entry.date,
    count: entry.count,
    sets: entry.sets,
    note: entry.note,
    feeling: entry.feeling,
  });
}

export async function deleteEntry(id: string): Promise<{ deletedAt: number }> {
  const result = await convexEntries.remove(id as Id<"entries">);
  return { deletedAt: result.deletedAt };
}

export async function restoreEntry(id: string, userId: string): Promise<Entry> {
  return await convexEntries.restore(id as Id<"entries">, userId);
}

// Follow operations
export async function getFollowsByUser(userId: string): Promise<Follow[]> {
  return await convexFollows.listByUser(userId);
}

export async function getFollowerCount(challengeId: string): Promise<number> {
  return await convexFollows.getFollowerCount(challengeId);
}

export async function isFollowing(userId: string, challengeId: string): Promise<boolean> {
  return await convexFollows.isFollowing(userId, challengeId);
}

export async function createFollow(userId: string, challengeId: string): Promise<Follow> {
  return await convexFollows.follow(userId, challengeId);
}

export async function deleteFollow(userId: string, challengeId: string): Promise<boolean> {
  const result = await convexFollows.unfollow(userId, challengeId);
  return result.success;
}

// Public challenges (for community)
export async function getPublicChallenges(): Promise<Challenge[]> {
  return await convexChallenges.listPublic();
}

// Stats calculation (updated to async for Convex)
export async function calculateChallengeStats(challenge: Challenge): Promise<ChallengeStats> {
  const challengeEntries = await getEntriesByChallenge(challenge.id);
  const totalCount = challengeEntries.reduce((sum, e) => sum + e.count, 0);

  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Days calculation
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  const daysElapsed = Math.max(
    0,
    Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const daysRemaining = Math.max(0, totalDays - daysElapsed);

  // Pace calculations
  const remaining = Math.max(0, challenge.target - totalCount);
  const perDayRequired = daysRemaining > 0 ? remaining / daysRemaining : 0;
  const expectedByNow =
    daysElapsed > 0 ? (challenge.target / totalDays) * daysElapsed : 0;
  const currentPace = daysElapsed > 0 ? totalCount / daysElapsed : 0;

  let paceStatus: "ahead" | "on-pace" | "behind" = "on-pace";
  if (totalCount > expectedByNow * 1.05) paceStatus = "ahead";
  else if (totalCount < expectedByNow * 0.95) paceStatus = "behind";

  // Streak calculations
  const entriesByDate = new Map<string, number>();
  challengeEntries.forEach((e) => {
    entriesByDate.set(e.date, (entriesByDate.get(e.date) || 0) + e.count);
  });

  let streakCurrent = 0;
  let streakBest = 0;
  let currentStreak = 0;
  const sortedDates = Array.from(entriesByDate.keys()).sort();

  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i];
    const prevDate =
      i > 0
        ? new Date(new Date(sortedDates[i - 1]).getTime() + 86400000)
            .toISOString()
            .split("T")[0]
        : null;

    if (prevDate === date || i === 0) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }

    if (currentStreak > streakBest) streakBest = currentStreak;
  }

  // Check if streak is current (includes today or yesterday)
  const yesterday = new Date(now.getTime() - 86400000)
    .toISOString()
    .split("T")[0];
  if (entriesByDate.has(today) || entriesByDate.has(yesterday)) {
    streakCurrent = currentStreak;
  }

  // Best day
  let bestDay: { date: string; count: number } | null = null;
  entriesByDate.forEach((count, date) => {
    if (!bestDay || count > bestDay.count) {
      bestDay = { date, count };
    }
  });

  // Daily average
  const daysWithEntries = entriesByDate.size;
  const dailyAverage = daysWithEntries > 0 ? totalCount / daysWithEntries : 0;

  return {
    challengeId: challenge.id,
    totalCount,
    remaining,
    daysElapsed,
    daysRemaining,
    perDayRequired: Math.ceil(perDayRequired * 10) / 10,
    currentPace: Math.round(currentPace * 10) / 10,
    paceStatus,
    streakCurrent,
    streakBest,
    bestDay,
    dailyAverage: Math.round(dailyAverage * 10) / 10,
  };
}

export async function calculateDashboardStats(userId: string): Promise<DashboardStats> {
  const userChallenges = await getActiveChallenges(userId);
  const userEntries = await getEntriesByUser(userId);
  const today = new Date().toISOString().split("T")[0];

  const totalMarks = userEntries.reduce((sum, e) => sum + e.count, 0);
  const todayCount = userEntries
    .filter((e) => e.date === today)
    .reduce((sum, e) => sum + e.count, 0);

  // Best streak across all challenges
  let bestStreak = 0;
  for (const c of userChallenges) {
    const stats = await calculateChallengeStats(c);
    if (stats.streakBest > bestStreak) bestStreak = stats.streakBest;
  }

  // Overall pace status
  let paceStatus: "ahead" | "on-pace" | "behind" | "none" = "none";
  if (userChallenges.length > 0) {
    const paceScores: number[] = [];
    for (const c of userChallenges) {
      const stats = await calculateChallengeStats(c);
      paceScores.push(
        stats.paceStatus === "ahead"
          ? 1
          : stats.paceStatus === "behind"
          ? -1
          : 0
      );
    }
    const avgPace =
      paceScores.reduce((a, b) => a + b, 0) / paceScores.length;
    if (avgPace > 0.3) paceStatus = "ahead";
    else if (avgPace < -0.3) paceStatus = "behind";
    else paceStatus = "on-pace";
  }

  return { totalMarks, today: todayCount, bestStreak, overallPaceStatus: paceStatus };
}

export async function calculatePersonalRecords(userId: string): Promise<PersonalRecords> {
  const userEntries = await getEntriesByUser(userId);
  const userChallenges = await getChallengesByUserId(userId);

  // Best single day (total across all challenges)
  const dayTotals = new Map<string, number>();
  userEntries.forEach((e) => {
    dayTotals.set(e.date, (dayTotals.get(e.date) || 0) + e.count);
  });

  let bestSingleDay: { date: string; count: number } | null = null;
  dayTotals.forEach((count, date) => {
    if (!bestSingleDay || count > bestSingleDay.count) {
      bestSingleDay = { date, count };
    }
  });

  // Longest streak (across any challenge)
  let longestStreak = 0;
  for (const c of userChallenges) {
    const stats = await calculateChallengeStats(c);
    if (stats.streakBest > longestStreak) longestStreak = stats.streakBest;
  }

  // Highest daily average (per challenge)
  let highestDailyAverage: { challengeId: string; average: number } | null = null;
  for (const c of userChallenges) {
    const stats = await calculateChallengeStats(c);
    if (
      !highestDailyAverage ||
      stats.dailyAverage > highestDailyAverage.average
    ) {
      highestDailyAverage = {
        challengeId: c.id,
        average: stats.dailyAverage,
      };
    }
  }

  // Most active days
  const mostActiveDays = dayTotals.size;

  // Biggest single entry
  let biggestSingleEntry: {
    date: string;
    count: number;
    challengeId: string;
  } | null = null;
  userEntries.forEach((e) => {
    if (!biggestSingleEntry || e.count > biggestSingleEntry.count) {
      biggestSingleEntry = {
        date: e.date,
        count: e.count,
        challengeId: e.challengeId,
      };
    }
  });

  return {
    bestSingleDay,
    longestStreak,
    highestDailyAverage,
    mostActiveDays,
    biggestSingleEntry,
  };
}

// Data export/import
export interface ExportData {
  version: "1.0";
  exportedAt: string;
  challenges: Challenge[];
  entries: Entry[];
}

export async function exportUserData(userId: string): Promise<ExportData> {
  const userChallenges = await getChallengesByUserId(userId);
  const userEntries = await getEntriesByUser(userId);

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    challenges: userChallenges,
    entries: userEntries,
  };
}

export async function importUserData(
  userId: string,
  data: ExportData
): Promise<{ challenges: number; entries: number }> {
  // Clear existing data
  await clearUserData(userId);

  // Create ID mapping for challenges
  const challengeIdMap = new Map<string, string>();

  // Import challenges
  let challengeCount = 0;
  for (const c of data.challenges) {
    const newChallenge = await createChallenge(userId, {
      name: c.name,
      target: c.target,
      timeframeType: c.timeframeType,
      startDate: c.startDate,
      endDate: c.endDate,
      color: c.color,
      icon: c.icon,
      isPublic: c.isPublic,
    });
    challengeIdMap.set(c.id, newChallenge.id);
    challengeCount++;
  }

  // Import entries with mapped challenge IDs
  let entryCount = 0;
  for (const e of data.entries) {
    const newChallengeId = challengeIdMap.get(e.challengeId);
    if (newChallengeId) {
      await createEntry(userId, {
        challengeId: newChallengeId,
        date: e.date,
        count: e.count,
        note: e.note,
        feeling: e.feeling,
      });
      entryCount++;
    }
  }

  return { challenges: challengeCount, entries: entryCount };
}

export async function clearUserData(userId: string): Promise<{
  challenges: number;
  entries: number;
  follows: number;
}> {
  // Get all user data
  const userChallenges = await getChallengesByUserId(userId);
  const userEntries = await getEntriesByUser(userId);
  const userFollows = await getFollowsByUser(userId);

  // Delete challenges (which also deletes related entries and follows)
  for (const c of userChallenges) {
    await deleteChallenge(c.id);
  }

  // Delete any remaining entries (shouldn't be any, but just in case)
  for (const e of userEntries) {
    await deleteEntry(e.id);
  }

  // Delete any remaining follows (shouldn't be any, but just in case)
  for (const f of userFollows) {
    await deleteFollow(userId, f.challengeId);
  }

  return {
    challenges: userChallenges.length,
    entries: userEntries.length,
    follows: userFollows.length,
  };
}
