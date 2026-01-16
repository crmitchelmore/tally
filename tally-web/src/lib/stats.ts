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
  let tempDate = new Date(today);
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
