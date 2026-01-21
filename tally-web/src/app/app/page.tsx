"use client";

import Link from "next/link";
import { TallyMark } from "@/components/ui/tally-mark";
import { ChallengeList } from "@/components/challenges";
import { DashboardHighlights, PersonalRecords, WeeklySummary } from "@/components/stats";
import { DataManagementSection } from "@/components/data";
import { FollowedChallengesSection, CommunitySection } from "@/components/community";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import type { 
  Challenge, 
  ChallengeStats, 
  CreateChallengeRequest,
  DashboardStats,
  PersonalRecords as PersonalRecordsType,
  Entry
} from "@/app/api/v1/_lib/types";

interface ChallengeWithStats {
  challenge: Challenge;
  stats: ChallengeStats;
}

export default function AppPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [challenges, setChallenges] = useState<ChallengeWithStats[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecordsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);

  // Map challenge IDs to names for personal records display
  const challengeNames = useMemo(() => {
    const map = new Map<string, string>();
    challenges.forEach(({ challenge }) => {
      map.set(challenge.id, challenge.name);
    });
    return map;
  }, [challenges]);

  // Map challenges by ID for weekly summary
  const challengesById = useMemo(() => {
    const map = new Map<string, Challenge>();
    challenges.forEach(({ challenge }) => {
      map.set(challenge.id, challenge);
    });
    return map;
  }, [challenges]);

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

  // Fetch dashboard stats and personal records
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await fetch("/api/v1/stats");
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data.dashboard);
        setPersonalRecords(data.records);
      }
    } catch {
      // Stats fetch failure is non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch all entries for weekly summary
  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/entries");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch {
      // Entries fetch failure is non-critical for summary
    }
  }, []);

  // Load data on mount (only if signed in)
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchChallenges();
      fetchStats();
      fetchEntries();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchChallenges, fetchStats, fetchEntries]);

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

  // Refresh handler for stats after challenge/entry changes
  const handleRefresh = useCallback(() => {
    fetchChallenges();
    fetchStats();
    fetchEntries();
  }, [fetchChallenges, fetchStats, fetchEntries]);

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
      {/* Welcome section with weekly summary button */}
      <section className="py-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}.
          </h1>
          <p className="mt-1 text-base text-muted">
            Your tallies are ready. Create a challenge or log progress below.
          </p>
        </div>
        <div className="flex-shrink-0 flex gap-2">
          <DataManagementSection onDataChange={handleRefresh} />
          <button
            onClick={() => setShowWeeklySummary(true)}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-ink hover:bg-border/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Weekly Summary
          </button>
        </div>
      </section>

      {/* Challenges list - shown first when empty for better UX */}
      <ChallengeList
        challenges={challenges}
        loading={loading}
        error={error}
        onCreateChallenge={handleCreateChallenge}
        onRefresh={handleRefresh}
      />

      {/* Dashboard highlights - only show when user has data */}
      {challenges.length > 0 && (
        <>
          <DashboardHighlights stats={dashboardStats} loading={statsLoading} />
          <PersonalRecords 
            records={personalRecords} 
            loading={statsLoading} 
            challengeNames={challengeNames}
          />
        </>
      )}

      {/* Followed challenges */}
      <FollowedChallengesSection onRefresh={handleRefresh} />

      {/* Community section */}
      <CommunitySection onRefresh={handleRefresh} />

      {/* Weekly summary modal */}
      <WeeklySummary
        entries={entries}
        challenges={challengesById}
        open={showWeeklySummary}
        onClose={() => setShowWeeklySummary(false)}
      />
    </div>
  );
}
