"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ChallengeEmptyState } from "@/components/challenges/challenge-empty-state";
import { ChallengeCard } from "@/components/challenges/challenge-card";
import { CreateChallengeDialog } from "@/components/challenges/create-challenge-dialog";
import { DashboardHighlights } from "@/components/stats/dashboard-highlights";
import { AddEntryDialog } from "@/components/entries/add-entry-dialog";
import type { Challenge, ChallengeStats, CreateChallengeRequest, DashboardStats, CreateEntryRequest } from "@/app/api/v1/_lib/types";
import {
  getOfflineChallenges,
  createOfflineChallenge,
  createOfflineEntry,
  setOfflineMode,
  exportOfflineData,
  getOfflineChallengeStats,
  getOfflineEntriesForChallenge,
} from "@/lib/offline-store";

interface ChallengeWithStats {
  challenge: Challenge;
  stats: ChallengeStats;
}

export default function OfflineAppPage() {
  const [challenges, setChallenges] = useState<ChallengeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [entryDialogChallenge, setEntryDialogChallenge] = useState<Challenge | null>(null);

  // Mark as offline mode on mount
  useEffect(() => {
    setOfflineMode(true);
  }, []);

  // Load challenges from localStorage
  const loadChallenges = useCallback(() => {
    const storedChallenges = getOfflineChallenges();
    const withStats = storedChallenges.map(challenge => ({
      challenge,
      stats: getOfflineChallengeStats(challenge),
    }));
    setChallenges(withStats);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  // Compute dashboard stats from challenges
  const dashboardStats: DashboardStats = useMemo(() => {
    const totalMarks = challenges.reduce((sum, c) => sum + c.stats.totalCount, 0);
    const todayStr = new Date().toISOString().split("T")[0];
    const today = challenges.reduce((sum, c) => {
      const entries = getOfflineEntriesForChallenge(c.challenge.id);
      return sum + entries.filter(e => e.date === todayStr).reduce((s, e) => s + e.count, 0);
    }, 0);
    const bestStreak = Math.max(0, ...challenges.map(c => c.stats.streakBest));
    
    // Determine overall pace
    const paces = challenges.map(c => c.stats.paceStatus);
    let overallPaceStatus: "ahead" | "on-pace" | "behind" | "none" = "none";
    if (challenges.length > 0) {
      if (paces.some(p => p === "behind")) overallPaceStatus = "behind";
      else if (paces.every(p => p === "ahead")) overallPaceStatus = "ahead";
      else overallPaceStatus = "on-pace";
    }

    return {
      totalMarks,
      today,
      bestStreak,
      overallPaceStatus,
    };
  }, [challenges]);

  const handleCreateChallenge = useCallback(async (data: CreateChallengeRequest) => {
    createOfflineChallenge(data);
    loadChallenges();
  }, [loadChallenges]);

  const handleQuickAdd = useCallback((challengeId: string) => {
    const challenge = challenges.find(c => c.challenge.id === challengeId)?.challenge;
    if (challenge) {
      setEntryDialogChallenge(challenge);
    }
  }, [challenges]);

  const handleEntrySubmit = useCallback(async (data: Omit<CreateEntryRequest, "challengeId">) => {
    if (entryDialogChallenge) {
      createOfflineEntry(entryDialogChallenge.id, data.count);
      loadChallenges();
    }
  }, [entryDialogChallenge, loadChallenges]);

  const handleExportData = useCallback(() => {
    const data = exportOfflineData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tally-offline-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <section className="dashboard-intro">
        <p className="eyebrow">A little more, every time</p>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="dashboard-title">
                Your Tallies
              </h1>
            </div>
            <p className="text-base text-muted">
              Saved in this browser. Local tallies stay here.{" "}
              <Link href="/sign-in" className="text-accent hover:underline">
                Sign in for synced challenges
              </Link>.
            </p>
          </div>
          {challenges.length > 0 && (
            <button
              onClick={handleExportData}
              className="flex-shrink-0 px-4 py-2 rounded-xl border border-border text-sm font-medium text-ink hover:bg-border/50 transition-colors"
            >
              Export Backup
            </button>
          )}
        </div>
      </section>

      {/* Challenges section */}
      {loading ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-border/50 rounded animate-pulse" />
            <div className="h-10 w-36 bg-border/50 rounded-lg animate-pulse" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-5 animate-pulse">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-24 bg-border/50 rounded" />
                    <div className="h-8 w-32 bg-border/50 rounded" />
                    <div className="h-4 w-20 bg-border/50 rounded" />
                  </div>
                  <div className="w-14 h-14 rounded-full bg-border/50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : challenges.length === 0 ? (
        <ChallengeEmptyState onCreate={() => setCreateDialogOpen(true)} />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-ink">
              Your Challenges
              <span className="text-muted text-base font-normal ml-2">({challenges.length})</span>
            </h2>
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Challenge
            </button>
          </div>

          {/* Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {challenges.map(({ challenge, stats }) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                stats={stats}
                onQuickAdd={handleQuickAdd}
                href={null}
                entries={getOfflineEntriesForChallenge(challenge.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dashboard highlights - only show when user has data */}
      {challenges.length > 0 && (
        <DashboardHighlights stats={dashboardStats} loading={loading} />
      )}

      {/* Create dialog */}
      <CreateChallengeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateChallenge}
      />

      {/* Add entry dialog */}
      {entryDialogChallenge && (
        <AddEntryDialog
          challenge={entryDialogChallenge}
          open={true}
          onClose={() => setEntryDialogChallenge(null)}
          onSubmit={handleEntrySubmit}
        />
      )}
    </div>
  );
}
