"use client";

import Link from "next/link";
import { TallyMark } from "@/components/ui/tally-mark";
import { UndoToast } from "@/components/ui/undo-toast";
import { ChallengeList } from "@/components/challenges";
import { DashboardHighlights, PersonalRecords, WeeklySummary } from "@/components/stats";
import { FollowedChallengesSection, CommunitySection } from "@/components/community";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useChallenges } from "@/hooks/use-challenges";
import { useStats, useEntries } from "@/hooks/use-stats";
import type { Challenge } from "@/app/api/v1/_lib/types";

interface DeletedChallenge {
  id: string;
  name: string;
}

export default function AppPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
  const [deletedChallenge, setDeletedChallenge] = useState<DeletedChallenge | null>(null);

  // Check for deleted challenge in session storage (from challenge detail page)
  useEffect(() => {
    const stored = sessionStorage.getItem("deletedChallenge");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDeletedChallenge(parsed);
        sessionStorage.removeItem("deletedChallenge");
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Data fetching with SWR - shows cached data immediately
  const isReady = isLoaded && isSignedIn;
  const { 
    challenges, 
    isLoading: challengesLoading, 
    error, 
    createChallenge, 
    refresh: refreshChallenges 
  } = useChallenges(isReady);
  
  const { 
    dashboardStats, 
    personalRecords, 
    isLoading: statsLoading,
    refresh: refreshStats 
  } = useStats(isReady);
  
  const { 
    entries, 
    refresh: refreshEntries 
  } = useEntries(isReady);

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

  // Refresh all data
  const handleRefresh = useCallback(() => {
    refreshChallenges();
    refreshStats();
    refreshEntries();
  }, [refreshChallenges, refreshStats, refreshEntries]);

  // Restore deleted challenge
  const handleRestoreChallenge = useCallback(async () => {
    if (!deletedChallenge) return;
    
    const res = await fetch(`/api/v1/challenges/${deletedChallenge.id}/restore`, {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error("Failed to restore challenge");
    }

    setDeletedChallenge(null);
    handleRefresh();
  }, [deletedChallenge, handleRefresh]);

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
      <section className="py-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}.
            </h1>
            <p className="mt-1 text-base text-muted">
              Your tallies are ready. Create a challenge or log progress below.
            </p>
          </div>
          <button
            onClick={() => setShowWeeklySummary(true)}
            className="flex-shrink-0 px-4 py-2 rounded-xl border border-border text-sm font-medium text-ink hover:bg-border/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Weekly Summary
          </button>
        </div>
      </section>

      {/* Challenges list - shown first when empty for better UX */}
      <ChallengeList
        challenges={challenges}
        loading={challengesLoading}
        error={error}
        onCreateChallenge={createChallenge}
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

      {/* Undo toast for deleted challenge */}
      {deletedChallenge && (
        <UndoToast
          message={`"${deletedChallenge.name}" deleted`}
          onUndo={handleRestoreChallenge}
          onDismiss={() => setDeletedChallenge(null)}
        />
      )}
    </div>
  );
}
