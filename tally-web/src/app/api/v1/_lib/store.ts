/**
 * In-memory data store for API v1 (will be replaced with Convex later)
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

// In-memory stores
export const users = new Map<string, User>();
export const challenges = new Map<string, Challenge>();
export const entries = new Map<string, Entry>();
export const follows = new Map<string, Follow>();

// ID generation
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// User operations
export function getUserByClerkId(clerkId: string): User | undefined {
  return Array.from(users.values()).find((u) => u.clerkId === clerkId);
}

export function createUser(clerkId: string, email: string, name: string): User {
  const user: User = {
    id: generateId("user"),
    clerkId,
    email,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  users.set(user.id, user);
  return user;
}

export function updateUser(user: User): User {
  user.updatedAt = new Date().toISOString();
  users.set(user.id, user);
  return user;
}

// Challenge operations
export function getChallengesByUserId(userId: string): Challenge[] {
  return Array.from(challenges.values()).filter((c) => c.userId === userId);
}

export function getActiveChallenges(userId: string): Challenge[] {
  const now = new Date().toISOString().split("T")[0];
  return getChallengesByUserId(userId).filter(
    (c) => !c.isArchived && c.endDate >= now
  );
}

export function getChallengeById(id: string): Challenge | undefined {
  return challenges.get(id);
}

export function createChallenge(
  userId: string,
  data: Omit<Challenge, "id" | "userId" | "isArchived" | "createdAt" | "updatedAt">
): Challenge {
  const challenge: Challenge = {
    id: generateId("ch"),
    userId,
    ...data,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  challenges.set(challenge.id, challenge);
  return challenge;
}

export function updateChallenge(challenge: Challenge): Challenge {
  challenge.updatedAt = new Date().toISOString();
  challenges.set(challenge.id, challenge);
  return challenge;
}

export function deleteChallenge(id: string): boolean {
  // Also delete related entries and follows
  Array.from(entries.values())
    .filter((e) => e.challengeId === id)
    .forEach((e) => entries.delete(e.id));
  Array.from(follows.values())
    .filter((f) => f.challengeId === id)
    .forEach((f) => follows.delete(f.id));
  return challenges.delete(id);
}

// Entry operations
export function getEntriesByChallenge(challengeId: string): Entry[] {
  return Array.from(entries.values())
    .filter((e) => e.challengeId === challengeId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getEntriesByUser(userId: string): Entry[] {
  return Array.from(entries.values())
    .filter((e) => e.userId === userId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getEntryById(id: string): Entry | undefined {
  return entries.get(id);
}

export function createEntry(
  userId: string,
  data: Omit<Entry, "id" | "userId" | "createdAt" | "updatedAt">
): Entry {
  const entry: Entry = {
    id: generateId("entry"),
    userId,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  entries.set(entry.id, entry);
  return entry;
}

export function updateEntry(entry: Entry): Entry {
  entry.updatedAt = new Date().toISOString();
  entries.set(entry.id, entry);
  return entry;
}

export function deleteEntry(id: string): boolean {
  return entries.delete(id);
}

// Follow operations
export function getFollowsByUser(userId: string): Follow[] {
  return Array.from(follows.values()).filter((f) => f.userId === userId);
}

export function getFollowerCount(challengeId: string): number {
  return Array.from(follows.values()).filter((f) => f.challengeId === challengeId)
    .length;
}

export function isFollowing(userId: string, challengeId: string): boolean {
  return Array.from(follows.values()).some(
    (f) => f.userId === userId && f.challengeId === challengeId
  );
}

export function createFollow(userId: string, challengeId: string): Follow {
  const follow: Follow = {
    id: generateId("follow"),
    userId,
    challengeId,
    createdAt: new Date().toISOString(),
  };
  follows.set(follow.id, follow);
  return follow;
}

export function deleteFollow(userId: string, challengeId: string): boolean {
  const follow = Array.from(follows.values()).find(
    (f) => f.userId === userId && f.challengeId === challengeId
  );
  if (follow) {
    return follows.delete(follow.id);
  }
  return false;
}

// Public challenges (for community)
export function getPublicChallenges(): Challenge[] {
  const now = new Date().toISOString().split("T")[0];
  return Array.from(challenges.values()).filter(
    (c) => c.isPublic && !c.isArchived && c.endDate >= now
  );
}

// Stats calculation
export function calculateChallengeStats(challenge: Challenge): ChallengeStats {
  const challengeEntries = getEntriesByChallenge(challenge.id);
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

export function calculateDashboardStats(userId: string): DashboardStats {
  const userChallenges = getActiveChallenges(userId);
  const userEntries = getEntriesByUser(userId);
  const today = new Date().toISOString().split("T")[0];

  const totalMarks = userEntries.reduce((sum, e) => sum + e.count, 0);
  const todayCount = userEntries
    .filter((e) => e.date === today)
    .reduce((sum, e) => sum + e.count, 0);

  // Best streak across all challenges
  let bestStreak = 0;
  userChallenges.forEach((c) => {
    const stats = calculateChallengeStats(c);
    if (stats.streakBest > bestStreak) bestStreak = stats.streakBest;
  });

  // Overall pace status
  let paceStatus: "ahead" | "on-pace" | "behind" | "none" = "none";
  if (userChallenges.length > 0) {
    const paceScores: number[] = userChallenges.map((c) => {
      const stats = calculateChallengeStats(c);
      return stats.paceStatus === "ahead"
        ? 1
        : stats.paceStatus === "behind"
        ? -1
        : 0;
    });
    const avgPace =
      paceScores.reduce((a, b) => a + b, 0) / paceScores.length;
    if (avgPace > 0.3) paceStatus = "ahead";
    else if (avgPace < -0.3) paceStatus = "behind";
    else paceStatus = "on-pace";
  }

  return { totalMarks, today: todayCount, bestStreak, overallPaceStatus: paceStatus };
}

export function calculatePersonalRecords(userId: string): PersonalRecords {
  const userEntries = getEntriesByUser(userId);
  const userChallenges = getChallengesByUserId(userId);

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
  userChallenges.forEach((c) => {
    const stats = calculateChallengeStats(c);
    if (stats.streakBest > longestStreak) longestStreak = stats.streakBest;
  });

  // Highest daily average (per challenge)
  let highestDailyAverage: { challengeId: string; average: number } | null = null;
  userChallenges.forEach((c) => {
    const stats = calculateChallengeStats(c);
    if (
      !highestDailyAverage ||
      stats.dailyAverage > highestDailyAverage.average
    ) {
      highestDailyAverage = {
        challengeId: c.id,
        average: stats.dailyAverage,
      };
    }
  });

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

export function exportUserData(userId: string): ExportData {
  const userChallenges = getChallengesByUserId(userId);
  const userEntries = getEntriesByUser(userId);

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    challenges: userChallenges,
    entries: userEntries,
  };
}

export function importUserData(
  userId: string,
  data: ExportData
): { challenges: number; entries: number } {
  // Clear existing data
  clearUserData(userId);

  // Create ID mapping for challenges
  const challengeIdMap = new Map<string, string>();

  // Import challenges
  let challengeCount = 0;
  for (const c of data.challenges) {
    const newChallenge = createChallenge(userId, {
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
      createEntry(userId, {
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

export function clearUserData(userId: string): {
  challenges: number;
  entries: number;
  follows: number;
} {
  // Delete challenges
  const userChallenges = getChallengesByUserId(userId);
  userChallenges.forEach((c) => challenges.delete(c.id));

  // Delete entries
  const userEntries = getEntriesByUser(userId);
  userEntries.forEach((e) => entries.delete(e.id));

  // Delete follows
  const userFollows = getFollowsByUser(userId);
  userFollows.forEach((f) => follows.delete(f.id));

  return {
    challenges: userChallenges.length,
    entries: userEntries.length,
    follows: userFollows.length,
  };
}
