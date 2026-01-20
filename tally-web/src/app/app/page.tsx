"use client";

import Link from "next/link";
import { TallyMark } from "@/components/ui/tally-mark";
import { ChallengeList } from "@/components/challenges";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import type { Challenge, ChallengeStats, CreateChallengeRequest } from "@/app/api/v1/_lib/types";

interface ChallengeWithStats {
  challenge: Challenge;
  stats: ChallengeStats;
}

export default function AppPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [challenges, setChallenges] = useState<ChallengeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch challenges with stats
  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/v1/challenges");
      if (!res.ok) throw new Error("Failed to load challenges");

      const data = await res.json();
      const challengesWithStats: ChallengeWithStats[] = [];

      // Fetch stats for each challenge in parallel
      await Promise.all(
        data.challenges.map(async (challenge: Challenge) => {
          try {
            const statsRes = await fetch(`/api/v1/challenges/${challenge.id}/stats`);
            if (statsRes.ok) {
              const statsData = await statsRes.json();
              challengesWithStats.push({ challenge, stats: statsData.stats });
            }
          } catch {
            // Use default stats if fetch fails
            challengesWithStats.push({
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
            });
          }
        })
      );

      setChallenges(challengesWithStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load challenges");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load challenges on mount (only if signed in)
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchChallenges();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchChallenges]);

  // Create challenge handler
  const handleCreateChallenge = useCallback(async (data: CreateChallengeRequest) => {
    const res = await fetch("/api/v1/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to create challenge");
    }
  }, []);

  // Show signed-out CTA if not authenticated
  if (isLoaded && !isSignedIn) {
    return (
      <div className="space-y-8">
        <section className="text-center py-16">
          <TallyMark count={5} size="lg" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">
            Track what matters.
          </h1>
          <p className="mt-3 text-base text-muted max-w-md mx-auto">
            Create challenges, log entries, and watch your progress unfold with
            calm, tactile tallies.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Get started free
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border font-semibold hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <section className="py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}.
        </h1>
        <p className="mt-1 text-base text-muted">
          Your tallies are ready. Create a challenge or log progress below.
        </p>
      </section>

      {/* Challenges list */}
      <ChallengeList
        challenges={challenges}
        loading={loading}
        error={error}
        onCreateChallenge={handleCreateChallenge}
        onRefresh={fetchChallenges}
      />
    </div>
  );
}
