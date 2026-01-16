"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Challenge, Entry } from "@/types";
import { Id } from "../../../convex/_generated/dataModel";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CreateChallengeDialog } from "@/components/tally/CreateChallengeDialog";
import { ChallengeCard } from "@/components/tally/ChallengeCard";
import { AddEntrySheet } from "@/components/tally/AddEntrySheet";
import { ChallengeDetailView } from "@/components/tally/ChallengeDetailView";
import { DataPortabilityDialog } from "@/components/tally/DataPortabilityDialog";
import { TallyMarks } from "@/components/tally/marks/TallyMarks";
import { ActivityHeatmap } from "@/components/tally/ActivityHeatmap";
import { calculateDashboardStats } from "@/lib/stats";

export default function AppPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isUserStored, setIsUserStored] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Id<"challenges"> | null>(null);

  const storeUser = useMutation(api.users.getOrCreate);
  const challenges = useQuery(
    api.challenges.listActive,
    isUserStored && user?.id ? { clerkId: user.id } : "skip"
  );
  const entries = useQuery(
    api.entries.listByUser,
    isUserStored && user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      storeUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        name: user.fullName || undefined,
        avatarUrl: user.imageUrl || undefined,
      }).then(() => {
        setIsUserStored(true);
      });
    }
  }, [isLoaded, isSignedIn, user, storeUser]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="text-[var(--ink-muted)]">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--paper)] paper-texture p-6">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <TallyMarks count={5} size="xl" color="var(--ink)" />
          </div>
          <h1 className="font-display text-4xl text-[var(--ink)] mb-4">Welcome to Tally</h1>
          <p className="text-[var(--ink-muted)] text-lg mb-10 text-balance">
            Track your goals with the simple satisfaction of marking progress.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up" className="btn btn-accent px-8 py-4 text-base">
              Create an account
            </Link>
            <Link href="/sign-in" className="btn btn-secondary px-8 py-4 text-base">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show detail view if a challenge is selected
  if (selectedChallenge) {
    return (
      <ChallengeDetailView
        challengeId={selectedChallenge}
        onClose={() => setSelectedChallenge(null)}
      />
    );
  }

   const today = new Date().toISOString().split("T")[0];
   const dashboardStats = challenges && entries
     ? calculateDashboardStats(challenges as Challenge[], entries as Entry[], today)
     : null;
   const currentYear = new Date().getFullYear();

   return (
    <div className="min-h-screen bg-[var(--paper)] paper-texture">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[var(--border-light)] sticky top-0 z-40">
        <div className="container-wide">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <TallyMarks count={5} size="sm" color="var(--ink)" />
              <h1 className="font-display text-xl text-[var(--ink)]">Tally</h1>
            </div>
            <nav className="flex items-center gap-1">
              <Link
                href="/community"
                className="px-3 py-2 text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-warm)] rounded-lg transition-colors text-sm"
              >
                Community
              </Link>
              <Link
                href="/leaderboard"
                className="px-3 py-2 text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-warm)] rounded-lg transition-colors text-sm"
              >
                Leaderboard
              </Link>
              <div className="w-px h-6 bg-[var(--border-light)] mx-2" />
              <DataPortabilityDialog isUserStored={isUserStored} />
              <UserButton 
                afterSignOutUrl="/" 
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container-wide py-12 pb-32">
        {/* Page header */}
        <header className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl text-[var(--ink)] mb-2">Your Challenges</h2>
            <p className="text-[var(--ink-muted)]">
              {challenges?.length === 0 
                ? "Create your first challenge to start tracking."
                : "Track your progress and stay on pace."}
            </p>
          </div>
          <CreateChallengeDialog />
        </header>

        {!isUserStored ? (
          <div className="text-center py-16">
            <div className="text-[var(--ink-muted)]">Setting up your account...</div>
          </div>
        ) : challenges === undefined || entries === undefined ? (
          <div className="text-center py-16">
            <div className="text-[var(--ink-muted)]">Loading challenges...</div>
          </div>
        ) : challenges.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="card">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[var(--paper-warm)] flex items-center justify-center">
                  <TallyMarks count={3} size="md" color="var(--ink-faint)" />
                </div>
              </div>
              <h3 className="font-display text-xl text-[var(--ink)] mb-2">No challenges yet</h3>
              <p className="text-[var(--ink-muted)] mb-6">
                Create your first challenge to start making marks.
              </p>
              <CreateChallengeDialog />
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {dashboardStats && (
              <>
                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  <div className="card">
                    <p className="stat-label flex items-center gap-2">Total marks</p>
                    <p className="stat-value mt-4">{dashboardStats.totalMarks}</p>
                    <p className="text-sm text-[var(--ink-muted)] mt-2">All time</p>
                  </div>
                  <div className="card">
                    <p className="stat-label flex items-center gap-2">Today</p>
                    <p className="stat-value mt-4">{dashboardStats.todayTotal}</p>
                    <p className="text-sm text-[var(--ink-muted)] mt-2">Entries today</p>
                  </div>
                  <div className="card">
                    <p className="stat-label flex items-center gap-2">Best streak</p>
                    <p className="stat-value mt-4">{dashboardStats.bestStreak}</p>
                    <p className="text-sm text-[var(--ink-muted)] mt-2">Days</p>
                  </div>
                  <div className="card">
                    <p className="stat-label flex items-center gap-2">Ahead of pace</p>
                    <p className="stat-value mt-4">{dashboardStats.aheadChallenges}</p>
                    <p className="text-sm text-[var(--ink-muted)] mt-2">
                      of {challenges.length} challenges
                    </p>
                  </div>
                </section>

                <section className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-xl text-[var(--ink)]">Activity</h3>
                      <p className="text-sm text-[var(--ink-muted)]">{currentYear}</p>
                    </div>
                  </div>
                  <ActivityHeatmap
                    entries={entries as Entry[]}
                    year={currentYear}
                    className="mt-6"
                  />
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🏆</span>
                    <h3 className="font-display text-xl text-[var(--ink)]">Personal Records</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div className="card">
                      <p className="stat-label">Best single day</p>
                      <p className="stat-value mt-4">{dashboardStats.bestSingleDay?.count ?? 0}</p>
                      <p className="text-sm text-[var(--ink-muted)] mt-2">
                        {dashboardStats.bestSingleDay
                          ? `${dashboardStats.bestSingleDay.challengeName ?? "Entry"} · ${dashboardStats.bestSingleDay.date}`
                          : "No entries yet"}
                      </p>
                    </div>
                    <div className="card">
                      <p className="stat-label">Longest streak</p>
                      <p className="stat-value mt-4">{dashboardStats.bestStreak}</p>
                      <p className="text-sm text-[var(--ink-muted)] mt-2">
                        {dashboardStats.bestStreak ? "Days" : "No streaks yet"}
                      </p>
                    </div>
                    <div className="card">
                      <p className="stat-label">Highest daily average</p>
                      <p className="stat-value mt-4">{dashboardStats.highestDailyAverage?.value ?? 0}</p>
                      <p className="text-sm text-[var(--ink-muted)] mt-2">
                        {dashboardStats.highestDailyAverage?.challengeName ?? "No data yet"}
                      </p>
                    </div>
                    <div className="card">
                      <p className="stat-label">Most active days</p>
                      <p className="stat-value mt-4">{dashboardStats.mostActiveDays?.value ?? 0}</p>
                      <p className="text-sm text-[var(--ink-muted)] mt-2">
                        {dashboardStats.mostActiveDays?.challengeName ?? "No data yet"}
                      </p>
                    </div>
                    <div className="card">
                      <p className="stat-label">Biggest single entry</p>
                      <p className="stat-value mt-4">{dashboardStats.biggestSingleEntry?.count ?? 0}</p>
                      <p className="text-sm text-[var(--ink-muted)] mt-2">
                        {dashboardStats.biggestSingleEntry
                          ? `${dashboardStats.biggestSingleEntry.challengeName ?? "Entry"} · ${dashboardStats.biggestSingleEntry.date}`
                          : "No entries yet"}
                      </p>
                    </div>
                    <div className="card">
                      <p className="stat-label">Max reps in single set</p>
                      <p className="stat-value mt-4">{dashboardStats.maxRepsInSet?.reps ?? 0}</p>
                      <p className="text-sm text-[var(--ink-muted)] mt-2">
                        {dashboardStats.maxRepsInSet
                          ? `${dashboardStats.maxRepsInSet.challengeName ?? "Entry"} · ${dashboardStats.maxRepsInSet.date}`
                          : "No sets yet"}
                      </p>
                    </div>
                  </div>
                </section>
              </>
            )}

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {challenges.map((challenge) => (
                <ChallengeCard
                  key={challenge._id}
                  challenge={challenge as Challenge}
                  onClick={() => setSelectedChallenge(challenge._id)}
                />
              ))}
            </section>
          </div>
        )}
      </main>

      {/* Floating Add Entry button */}
      {challenges && challenges.length > 0 && <AddEntrySheet />}
    </div>
  );
}
