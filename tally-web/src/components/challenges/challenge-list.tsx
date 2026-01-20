"use client";

import { useState, useCallback } from "react";
import { ChallengeCard } from "./challenge-card";
import { CreateChallengeDialog } from "./create-challenge-dialog";
import type { Challenge, ChallengeStats, CreateChallengeRequest } from "@/app/api/v1/_lib/types";

interface ChallengeWithStats {
  challenge: Challenge;
  stats: ChallengeStats;
}

export interface ChallengeListProps {
  challenges: ChallengeWithStats[];
  loading?: boolean;
  error?: string | null;
  onCreateChallenge: (data: CreateChallengeRequest) => Promise<void>;
  onRefresh?: () => void;
}

/**
 * Challenge list view for the dashboard.
 * Shows grid of challenge cards with create button and empty/loading/error states.
 */
export function ChallengeList({
  challenges,
  loading = false,
  error = null,
  onCreateChallenge,
  onRefresh,
}: ChallengeListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleCreate = useCallback(async (data: CreateChallengeRequest) => {
    await onCreateChallenge(data);
    onRefresh?.();
  }, [onCreateChallenge, onRefresh]);

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-error/10 text-error mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-ink font-medium">Something went wrong</p>
        <p className="text-muted text-sm mt-1">{error}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-4 px-4 py-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
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
              <div className="mt-4 pt-4 border-t border-border">
                <div className="h-4 w-16 bg-border/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (challenges.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-border/30 text-muted mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-ink">No challenges yet</h2>
        <p className="text-muted mt-2 max-w-sm mx-auto">
          Create your first challenge to start tracking progress with tactile tallies.
        </p>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="
            mt-6 inline-flex items-center gap-2 px-6 py-3
            bg-accent text-white rounded-full
            font-semibold hover:bg-accent/90 transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
          "
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Challenge
        </button>

        <CreateChallengeDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreate}
        />
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink">
          Your Challenges
          <span className="text-muted text-base font-normal ml-2">({challenges.length})</span>
        </h2>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="
            inline-flex items-center gap-2 px-4 py-2
            bg-accent text-white rounded-lg
            text-sm font-medium hover:bg-accent/90 transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
          "
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
          <ChallengeCard key={challenge.id} challenge={challenge} stats={stats} />
        ))}
      </div>

      <CreateChallengeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}

export default ChallengeList;
