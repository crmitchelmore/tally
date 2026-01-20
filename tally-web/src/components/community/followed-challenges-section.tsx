"use client";

import { useState, useEffect, useCallback } from "react";
import { TallyMark } from "@/components/ui/tally-mark";
import type { Challenge } from "@/app/api/v1/_lib/types";

interface FollowedChallengeWithMeta extends Challenge {
  totalReps: number;
  progress: number;
  followerCount: number;
  isFollowing: boolean;
  followedAt: string;
  owner: { id: string; name: string };
}

export interface FollowedChallengesSectionProps {
  onRefresh?: () => void;
}

/**
 * Dashboard section showing followed challenges.
 * Displays real aggregated data from followed public challenges.
 */
export function FollowedChallengesSection({ onRefresh }: FollowedChallengesSectionProps) {
  const [challenges, setChallenges] = useState<FollowedChallengeWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch followed challenges
  const fetchFollowed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/v1/followed");
      if (!res.ok) throw new Error("Failed to load followed challenges");

      const data = await res.json();
      setChallenges(data.challenges || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowed();
  }, [fetchFollowed]);

  // Unfollow handler
  const handleUnfollow = async (challengeId: string) => {
    // Optimistic removal
    setChallenges((prev) => prev.filter((c) => c.id !== challengeId));

    try {
      const res = await fetch("/api/v1/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });
      if (!res.ok) throw new Error("Failed to unfollow");
      onRefresh?.();
    } catch {
      // Revert on error
      fetchFollowed();
    }
  };

  // Don't render section if no followed challenges and not loading
  if (!loading && challenges.length === 0 && !error) {
    return null;
  }

  // Error state (minimal)
  if (error) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">Following</h2>
        <div className="text-center py-6 bg-surface border border-border rounded-2xl">
          <p className="text-muted text-sm">{error}</p>
          <button
            onClick={fetchFollowed}
            className="mt-2 text-xs font-medium text-accent hover:text-accent/80"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  // Loading state
  if (loading) {
    return (
      <section className="space-y-4">
        <div className="h-6 w-24 bg-border/50 rounded animate-pulse" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 bg-surface border border-border rounded-xl p-4 animate-pulse"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-border/50" />
                <div className="h-4 w-20 bg-border/50 rounded" />
              </div>
              <div className="h-6 w-24 bg-border/50 rounded mb-2" />
              <div className="h-1.5 w-full bg-border/50 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-ink">
        Following
        <span className="text-muted text-sm font-normal ml-2">({challenges.length})</span>
      </h2>

      {/* Horizontal scrollable list */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {challenges.map((challenge) => (
          <FollowedChallengeCard
            key={challenge.id}
            challenge={challenge}
            onUnfollow={handleUnfollow}
          />
        ))}
      </div>
    </section>
  );
}

/** Compact card for followed challenges */
function FollowedChallengeCard({
  challenge,
  onUnfollow,
}: {
  challenge: FollowedChallengeWithMeta;
  onUnfollow: (id: string) => void;
}) {
  const [unfollowing, setUnfollowing] = useState(false);

  const handleUnfollow = async () => {
    setUnfollowing(true);
    onUnfollow(challenge.id);
  };

  return (
    <div className="flex-shrink-0 w-72 bg-surface border border-border rounded-xl p-4 group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Name with color indicator */}
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: challenge.color }}
              aria-hidden="true"
            />
            <h3 className="font-medium text-ink text-sm truncate">{challenge.name}</h3>
          </div>

          {/* Owner */}
          <p className="mt-0.5 text-xs text-muted truncate">by {challenge.owner.name}</p>

          {/* Progress */}
          <p className="mt-2 text-lg font-semibold text-ink tabular-nums">
            {challenge.totalReps.toLocaleString()}
            <span className="text-muted text-sm font-normal">
              {" / "}
              {challenge.target.toLocaleString()}
            </span>
          </p>

          {/* Progress bar */}
          <div className="mt-1.5 h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${Math.min(100, challenge.progress)}%`,
                backgroundColor: challenge.color,
              }}
            />
          </div>
        </div>

        {/* Mini tally */}
        <div className="flex-shrink-0 opacity-60">
          <TallyMark count={Math.min(challenge.totalReps, 5)} size="sm" />
        </div>
      </div>

      {/* Footer with unfollow */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted">
          {challenge.followerCount} {challenge.followerCount === 1 ? "follower" : "followers"}
        </span>
        <button
          onClick={handleUnfollow}
          disabled={unfollowing}
          className="
            px-2.5 py-1 rounded text-xs font-medium
            text-muted hover:text-ink hover:bg-border/50
            opacity-0 group-hover:opacity-100 focus:opacity-100
            transition-all
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          Unfollow
        </button>
      </div>
    </div>
  );
}

export default FollowedChallengesSection;
