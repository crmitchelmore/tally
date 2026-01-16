import { Challenge, Entry, ChallengeStats, PaceStatus } from "@/types";

export function calculateStats(
  challenge: Challenge,
  entries: Entry[]
): ChallengeStats {
  const total = entries.reduce((sum, e) => sum + e.count, 0);
  const remaining = Math.max(0, challenge.targetNumber - total);

  // Calculate days left
  const today = new Date();
  let endDate: Date;
  
  if (challenge.endDate) {
    endDate = new Date(challenge.endDate);
  } else if (challenge.timeframeUnit === "year") {
    endDate = new Date(challenge.year, 11, 31);
  } else {
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  }
  
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const requiredPerDay = daysLeft > 0 ? remaining / daysLeft : remaining;

  // Calculate pace
  let startDate: Date;
  if (challenge.startDate) {
    startDate = new Date(challenge.startDate);
  } else if (challenge.timeframeUnit === "year") {
    startDate = new Date(challenge.year, 0, 1);
  } else {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysPassed = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const expectedTotal = (challenge.targetNumber / totalDays) * daysPassed;
  const paceOffset = total - expectedTotal;
  
  let paceStatus: PaceStatus;
  if (paceOffset > 0) {
    paceStatus = "ahead";
  } else if (paceOffset < -1) {
    paceStatus = "behind";
  } else {
    paceStatus = "onPace";
  }

  // Calculate streaks
  const entryDates = new Set(entries.map((e) => e.date));
  const sortedDates = Array.from(entryDates).sort().reverse();
  
  let currentStreak = 0;
  const tempDate = new Date(today);
  while (true) {
    const dateStr = tempDate.toISOString().split("T")[0];
    if (entryDates.has(dateStr)) {
      currentStreak++;
      tempDate.setDate(tempDate.getDate() - 1);
    } else if (dateStr === today.toISOString().split("T")[0]) {
      tempDate.setDate(tempDate.getDate() - 1);
    } else {
      break;
    }
  }

  let longestStreak = 0;
  let streak = 0;
  let prevDate: Date | null = null;
  
  for (const dateStr of sortedDates.reverse()) {
    const date = new Date(dateStr);
    if (prevDate === null) {
      streak = 1;
    } else {
      const diff = (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else {
        longestStreak = Math.max(longestStreak, streak);
        streak = 1;
      }
    }
    prevDate = date;
  }
  longestStreak = Math.max(longestStreak, streak);

  // Best day
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

  // Average per day
  const daysActive = entryDates.size;
  const averagePerDay = daysActive > 0 ? total / daysActive : 0;

  return {
    total,
    remaining,
    daysLeft,
    requiredPerDay,
    paceStatus,
    paceOffset,
    currentStreak,
    longestStreak,
    bestDay,
    averagePerDay,
    daysActive,
  };
}

export function formatPaceStatus(status: PaceStatus): { text: string; color: string } {
  switch (status) {
    case "ahead":
      return { text: "Ahead", color: "text-emerald-600" };
    case "onPace":
      return { text: "On pace", color: "text-blue-600" };
    case "behind":
      return { text: "Behind", color: "text-amber-600" };
  }
}

export interface DashboardStats {
  totalMarks: number;
  todayTotal: number;
  bestStreak: number;
  aheadChallenges: number;
  bestSingleDay: { date: string; count: number; challengeName?: string } | null;
  highestDailyAverage: { value: number; challengeName?: string } | null;
  mostActiveDays: { value: number; challengeName?: string } | null;
  biggestSingleEntry: { date: string; count: number; challengeName?: string } | null;
  maxRepsInSet: { date: string; reps: number; challengeName?: string } | null;
}

export function calculateDashboardStats(
  challenges: Challenge[],
  entries: Entry[],
  today: string
): DashboardStats {
  const challengeById = new Map<string, Challenge>(
    challenges.map((challenge) => [challenge._id, challenge])
  );
  const totalMarks = entries.reduce((sum, entry) => sum + entry.count, 0);
  const todayTotal = entries.reduce((sum, entry) => (
    entry.date === today ? sum + entry.count : sum
  ), 0);

  const statsByChallenge = challenges.map((challenge) => {
    const challengeEntries = entries.filter((entry) => entry.challengeId === challenge._id);
    return {
      challenge,
      stats: calculateStats(challenge, challengeEntries),
      entries: challengeEntries,
    };
  });

  const bestStreak = statsByChallenge.reduce(
    (max, item) => Math.max(max, item.stats.longestStreak),
    0
  );
  const aheadChallenges = statsByChallenge.reduce(
    (count, item) => count + (item.stats.paceStatus === "ahead" ? 1 : 0),
    0
  );

  let bestSingleDay: DashboardStats["bestSingleDay"] = null;
  let biggestSingleEntry: DashboardStats["biggestSingleEntry"] = null;
  let maxRepsInSet: DashboardStats["maxRepsInSet"] = null;

  const countsByChallengeDate = new Map<string, number>();
  for (const entry of entries) {
    const key = `${entry.challengeId}:${entry.date}`;
    countsByChallengeDate.set(key, (countsByChallengeDate.get(key) || 0) + entry.count);
  }

  for (const [key, count] of countsByChallengeDate.entries()) {
    const [challengeId, date] = key.split(":");
    if (!bestSingleDay || count > bestSingleDay.count) {
      bestSingleDay = {
        date,
        count,
        challengeName: challengeById.get(challengeId)?.name,
      };
    }
  }

  for (const entry of entries) {
    if (!biggestSingleEntry || entry.count > biggestSingleEntry.count) {
      biggestSingleEntry = {
        date: entry.date,
        count: entry.count,
        challengeName: challengeById.get(entry.challengeId)?.name,
      };
    }
    if (entry.sets) {
      for (const set of entry.sets) {
        if (!maxRepsInSet || set.reps > maxRepsInSet.reps) {
          maxRepsInSet = {
            date: entry.date,
            reps: set.reps,
            challengeName: challengeById.get(entry.challengeId)?.name,
          };
        }
      }
    }
  }

  let highestDailyAverage: DashboardStats["highestDailyAverage"] = null;
  let mostActiveDays: DashboardStats["mostActiveDays"] = null;

  for (const item of statsByChallenge) {
    if (!highestDailyAverage || item.stats.averagePerDay > highestDailyAverage.value) {
      highestDailyAverage = {
        value: Number(item.stats.averagePerDay.toFixed(1)),
        challengeName: item.challenge.name,
      };
    }
    if (!mostActiveDays || item.stats.daysActive > mostActiveDays.value) {
      mostActiveDays = {
        value: item.stats.daysActive,
        challengeName: item.challenge.name,
      };
    }
  }

  return {
    totalMarks,
    todayTotal,
    bestStreak,
    aheadChallenges,
    bestSingleDay,
    highestDailyAverage,
    mostActiveDays,
    biggestSingleEntry,
    maxRepsInSet,
  };
}
