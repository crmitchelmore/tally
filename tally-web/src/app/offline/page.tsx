"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TallyMark } from "@/components/ui/tally-mark";
import { CreateChallengeDialog } from "@/components/challenges/create-challenge-dialog";
import { AddEntryDialog } from "@/components/challenges/add-entry-dialog";
import type { Challenge, ChallengeStats, CreateChallengeRequest } from "@/app/api/v1/_lib/types";
import {
  getOfflineChallenges,
  createOfflineChallenge,
  deleteOfflineChallenge,
  createOfflineEntry,
  getOfflineChallengeStats,
  setOfflineMode,
  exportOfflineData,
} from "@/lib/offline-store";

interface ChallengeWithStats {
  challenge: Challenge;
  stats: ChallengeStats;
}

export default function OfflineAppPage() {
  const [challenges, setChallenges] = useState<ChallengeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
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

  const handleCreateChallenge = useCallback(async (data: CreateChallengeRequest) => {
    createOfflineChallenge(data);
    loadChallenges();
  }, [loadChallenges]);

  const handleAddEntry = useCallback((challengeId: string, count: number = 1) => {
    createOfflineEntry(challengeId, count);
    loadChallenges();
  }, [loadChallenges]);

  const handleEntryDialogSubmit = useCallback((challengeId: string, count: number, sets?: number[]) => {
    createOfflineEntry(challengeId, count);
    loadChallenges();
  }, [loadChallenges]);

  const handleQuickAdd = useCallback((e: React.MouseEvent, challenge: Challenge) => {
    e.stopPropagation();
    createOfflineEntry(challenge.id, challenge.defaultIncrement || 1);
    loadChallenges();
  }, [loadChallenges]);

  const handleDeleteChallenge = useCallback((challengeId: string) => {
    if (confirm("Delete this challenge? This cannot be undone.")) {
      deleteOfflineChallenge(challengeId);
      loadChallenges();
      setSelectedChallenge(null);
    }
  }, [loadChallenges]);

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

  const selected = selectedChallenge 
    ? challenges.find(c => c.challenge.id === selectedChallenge) 
    : null;

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <TallyMark count={4} size="sm" />
            <span className="font-semibold text-ink">Tally</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">
              Offline Mode
            </span>
            <Link
              href="/sign-in"
              className="text-sm text-accent hover:underline"
            >
              Sign in to sync
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Welcome */}
        <section className="mb-6">
          <h1 className="text-2xl font-semibold text-ink">Your Tallies</h1>
          <p className="text-muted text-sm mt-1">
            Data stored locally on this device. Sign in anytime to sync across devices.
          </p>
        </section>

        {/* Challenge Detail View */}
        {selected ? (
          <div className="space-y-6">
            <button
              onClick={() => setSelectedChallenge(null)}
              className="text-sm text-accent hover:underline flex items-center gap-1"
            >
              ← Back to challenges
            </button>
            
            <div
              className="p-6 rounded-2xl border border-border"
              style={{ borderLeftColor: selected.challenge.color, borderLeftWidth: 4 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-ink">{selected.challenge.name}</h2>
                  <p className="text-muted text-sm">
                    Target: {selected.challenge.target.toLocaleString()} • {selected.stats.daysRemaining} days left
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteChallenge(selected.challenge.id)}
                  className="text-xs text-error hover:underline"
                >
                  Delete
                </button>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold tabular-nums text-ink">
                    {selected.stats.totalCount.toLocaleString()}
                  </span>
                  <span className="text-muted">/ {selected.challenge.target.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round((selected.stats.totalCount / selected.challenge.target) * 100))}%`,
                      backgroundColor: selected.challenge.color,
                    }}
                  />
                </div>
                <p className="text-sm text-muted mt-2">
                  {Math.round((selected.stats.totalCount / selected.challenge.target) * 100)}% complete • {selected.stats.streakCurrent} day streak
                </p>
              </div>

              {/* Quick add */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {[1, 5, 10, 25].map(n => {
                    const amount = n * (selected.challenge.defaultIncrement || 1);
                    return (
                      <button
                        key={n}
                        onClick={() => handleAddEntry(selected.challenge.id, amount)}
                        className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
                      >
                        +{amount} {selected.challenge.unitLabel || ""}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setEntryDialogChallenge(selected.challenge)}
                  className="text-sm text-accent hover:underline"
                >
                  {selected.challenge.countType === "sets" ? "Add sets..." : "Add custom amount..."}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Challenge List */}
            {loading ? (
              <div className="text-center py-12 text-muted">Loading...</div>
            ) : challenges.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-border/30 text-muted mb-4">
                  <TallyMark count={0} size="md" />
                </div>
                <h2 className="text-lg font-semibold text-ink mb-2">No challenges yet</h2>
                <p className="text-muted text-sm mb-4">Create your first challenge to start tracking.</p>
                <button
                  onClick={() => setCreateDialogOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-full font-semibold hover:bg-accent/90 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Challenge
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {challenges.map(({ challenge, stats }) => {
                  const progress = Math.min(100, Math.round((stats.totalCount / challenge.target) * 100));
                  return (
                    <div
                      key={challenge.id}
                      className="relative p-4 rounded-xl border border-border hover:bg-surface transition-colors"
                      style={{ borderLeftColor: challenge.color, borderLeftWidth: 4 }}
                    >
                      <button
                        onClick={() => setSelectedChallenge(challenge.id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between mb-2 pr-14">
                          <h3 className="font-semibold text-ink">{challenge.name}</h3>
                          <span className="text-sm tabular-nums text-muted">
                            {stats.totalCount.toLocaleString()} / {challenge.target.toLocaleString()} {challenge.unitLabel || ""}
                          </span>
                        </div>
                        <div className="h-2 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: challenge.color,
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-muted">
                          <span>{progress}%</span>
                          <span>{stats.daysRemaining} days left</span>
                        </div>
                      </button>
                      
                      {/* Quick add button */}
                      <button
                        onClick={(e) => handleQuickAdd(e, challenge)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-colors shadow-sm"
                        aria-label={`Add ${challenge.defaultIncrement || 1} ${challenge.unitLabel || "reps"}`}
                        title={`+${challenge.defaultIncrement || 1} ${challenge.unitLabel || ""}`}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  );
                })}

                {/* Add new challenge button */}
                <button
                  onClick={() => setCreateDialogOpen(true)}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-border text-muted hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Challenge
                </button>
              </div>
            )}
          </>
        )}

        {/* Export option */}
        {challenges.length > 0 && !selectedChallenge && (
          <div className="mt-8 pt-6 border-t border-border">
            <button
              onClick={handleExportData}
              className="text-sm text-muted hover:text-ink transition-colors"
            >
              Export data as JSON backup
            </button>
          </div>
        )}
      </main>

      {/* Create dialog */}
      <CreateChallengeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateChallenge}
      />

      {/* Add entry dialog */}
      <AddEntryDialog
        open={entryDialogChallenge !== null}
        challenge={entryDialogChallenge}
        onClose={() => setEntryDialogChallenge(null)}
        onSubmit={handleEntryDialogSubmit}
      />
    </div>
  );
}
