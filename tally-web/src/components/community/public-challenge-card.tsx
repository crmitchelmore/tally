"use client";

import { useState } from "react";
import { TallyMark } from "@/components/ui/tally-mark";
import type { Challenge } from "@/app/api/v1/_lib/types";

interface PublicChallengeWithMeta extends Challenge {
  totalReps: number;
  progress: number;
  followerCount: number;
  isFollowing: boolean;
  owner: { id: string; name: string };
}

export interface PublicChallengeCardProps {
  challenge: PublicChallengeWithMeta;
  onFollow: (challengeId: string) => Promise<void>;
  onUnfollow: (challengeId: string) => Promise<void>;
  className?: string;
}

/**
 * Card for public challenges with follow/unfollow button.
 * Shows real totals, progress, follower count, and owner info.
 */
export function PublicChallengeCard({
  challenge,
  onFollow,
  onUnfollow,
  className = "",
}: PublicChallengeCardProps) {
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(challenge.isFollowing);
  const [followerCount, setFollowerCount] = useState(challenge.followerCount);

  const handleToggleFollow = async () => {
    if (loading) return;

    setLoading(true);
    // Optimistic update
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowerCount((c) => (wasFollowing ? c - 1 : c + 1));

    try {
      if (wasFollowing) {
        await onUnfollow(challenge.id);
      } else {
        await onFollow(challenge.id);
      }
    } catch {
      // Revert on error
      setFollowing(wasFollowing);
      setFollowerCount((c) => (wasFollowing ? c + 1 : c - 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`
        bg-surface border border-border rounded-2xl p-5
        transition-colors
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: challenge.color }}
              aria-hidden="true"
            />
            <h3 className="font-semibold text-ink truncate">{challenge.name}</h3>
          </div>

          {/* Owner */}
          <p className="mt-1 text-sm text-muted truncate">
            by {challenge.owner.name}
          </p>

          {/* Progress text */}
          <p className="mt-2 text-2xl font-semibold text-ink tabular-nums">
            {challenge.totalReps.toLocaleString()}
            <span className="text-muted text-base font-normal">
              {" / "}
              {challenge.target.toLocaleString()}
            </span>
          </p>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${Math.min(100, challenge.progress)}%`,
                backgroundColor: challenge.color,
              }}
            />
          </div>

          {/* Follower count */}
          <p className="mt-2 text-sm text-muted">
            {followerCount} {followerCount === 1 ? "follower" : "followers"}
          </p>
        </div>

        {/* Right: Progress ring */}
        <div className="flex-shrink-0">
          <ProgressRing
            progress={challenge.progress}
            color={challenge.color}
            size={56}
          />
        </div>
      </div>

      {/* Mini tally preview */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-4">
        <TallyMark count={Math.min(challenge.totalReps, 25)} size="sm" />

        {/* Follow button */}
        <button
          onClick={handleToggleFollow}
          disabled={loading}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
            ${
              following
                ? "bg-border/50 text-ink hover:bg-border"
                : "bg-accent text-white hover:bg-accent/90"
            }
            ${loading ? "opacity-50 cursor-not-allowed" : ""}
          `}
          aria-label={following ? "Unfollow challenge" : "Follow challenge"}
        >
          {loading ? (
            <span className="inline-flex items-center gap-1.5">
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </span>
          ) : following ? (
            "Following"
          ) : (
            "Follow"
          )}
        </button>
      </div>
    </div>
  );
}

/** Circular progress ring */
function ProgressRing({
  progress,
  color,
  size = 56,
}: {
  progress: number;
  color: string;
  size?: number;
}) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="transform -rotate-90"
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-border"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-300"
      />
    </svg>
  );
}

export default PublicChallengeCard;
