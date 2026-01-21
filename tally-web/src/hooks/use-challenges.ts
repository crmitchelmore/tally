"use client";

import useSWR from "swr";
import { useCallback, useEffect } from "react";
import type { Challenge, ChallengeStats, CreateChallengeRequest } from "@/app/api/v1/_lib/types";

const CACHE_KEY = "tally_challenges_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface ChallengeWithStats {
  challenge: Challenge;
  stats: ChallengeStats;
}

interface CachedData {
  challenges: ChallengeWithStats[];
  timestamp: number;
}

// Get cached data from localStorage
function getCachedData(): ChallengeWithStats[] | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return undefined;
    const data: CachedData = JSON.parse(cached);
    // Return stale data regardless of age - SWR will revalidate
    return data.challenges;
  } catch {
    return undefined;
  }
}

// Save data to localStorage cache
function setCachedData(challenges: ChallengeWithStats[]): void {
  if (typeof window === "undefined") return;
  try {
    const data: CachedData = { challenges, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore cache write failures
  }
}

// Fetcher that gets challenges + stats in parallel batches
async function fetchChallengesWithStats(): Promise<ChallengeWithStats[]> {
  const res = await fetch("/api/v1/challenges");
  if (!res.ok) throw new Error("Failed to load challenges");
  
  const data = await res.json();
  const challenges: Challenge[] = data.challenges;
  
  // Fetch all stats in parallel
  const statsPromises = challenges.map(async (challenge): Promise<ChallengeWithStats> => {
    try {
      const statsRes = await fetch(`/api/v1/challenges/${challenge.id}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        return { challenge, stats: statsData.stats };
      }
    } catch {
      // Fall through to default stats
    }
    
    // Default stats if fetch fails
    return {
      challenge,
      stats: {
        challengeId: challenge.id,
        totalCount: 0,
        remaining: challenge.target,
        daysElapsed: 0,
        daysRemaining: 365,
        perDayRequired: Math.ceil(challenge.target / 365),
        currentPace: 0,
        paceStatus: "on-pace" as const,
        streakCurrent: 0,
        streakBest: 0,
        bestDay: null,
        dailyAverage: 0,
      },
    };
  });
  
  const result = await Promise.all(statsPromises);
  setCachedData(result);
  return result;
}

export function useChallenges(enabled = true) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ChallengeWithStats[]>(
    enabled ? "challenges-with-stats" : null,
    fetchChallengesWithStats,
    {
      fallbackData: getCachedData(),
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      keepPreviousData: true,
    }
  );
  
  // Create challenge with optimistic update
  const createChallenge = useCallback(async (request: CreateChallengeRequest) => {
    const res = await fetch("/api/v1/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to create challenge");
    }
    
    // Revalidate to get the new challenge
    await mutate();
    return res.json();
  }, [mutate]);
  
  // Refresh data
  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);
  
  return {
    challenges: data ?? [],
    isLoading: isLoading && !data,
    isValidating,
    error: error?.message ?? null,
    createChallenge,
    refresh,
    mutate,
  };
}
