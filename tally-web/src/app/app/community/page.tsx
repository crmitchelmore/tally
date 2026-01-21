"use client";

import { useEffect, useState, useCallback } from "react";
import { TallyDisplay } from "@/components/ui/tally-display";

interface PublicChallenge {
  id: string;
  name: string;
  target: number;
  icon: string;
  color: string;
  totalReps: number;
  progress: number;
  followerCount: number;
  isFollowing: boolean;
  isOwner: boolean;
  owner: { id: string; name: string };
}

export default function CommunityPage() {
  const [challenges, setChallenges] = useState<PublicChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const fetchChallenges = useCallback(async () => {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/v1/public/challenges${params}`);
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges || []);
        // Track which ones user is following
        const following = new Set<string>();
        data.challenges?.forEach((c: PublicChallenge) => {
          if (c.isFollowing) following.add(c.id);
        });
        setFollowingIds(following);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const handleFollow = async (challengeId: string) => {
    const isCurrentlyFollowing = followingIds.has(challengeId);
    
    // Optimistic update
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyFollowing) {
        next.delete(challengeId);
      } else {
        next.add(challengeId);
      }
      return next;
    });

    try {
      const res = await fetch("/api/v1/follow", {
        method: isCurrentlyFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });
      if (!res.ok) {
        // Revert on error
        setFollowingIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlyFollowing) {
            next.add(challengeId);
          } else {
            next.delete(challengeId);
          }
          return next;
        });
      }
    } catch {
      // Revert on error
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) {
          next.add(challengeId);
        } else {
          next.delete(challengeId);
        }
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-ink">Community Challenges</h1>
        <p className="text-muted mt-1">Discover and follow public challenges</p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="search"
          placeholder="Search challenges..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 pl-10 rounded-xl border border-border bg-paper text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-2xl p-5 animate-pulse"
            >
              <div className="h-6 w-32 bg-border/50 rounded mb-3" />
              <div className="h-4 w-24 bg-border/50 rounded mb-4" />
              <div className="h-2 w-full bg-border/50 rounded" />
            </div>
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted">
            {search ? "No challenges match your search" : "No public challenges yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-surface border border-border rounded-2xl p-5 hover:border-muted transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ink truncate">{challenge.name}</h3>
                  <p className="text-sm text-muted">by {challenge.owner.name}</p>
                </div>
                {challenge.isOwner ? (
                  <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-muted/10 text-muted">
                    Your Challenge
                  </span>
                ) : (
                  <button
                    onClick={() => handleFollow(challenge.id)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                      ${
                        followingIds.has(challenge.id)
                          ? "bg-accent/10 text-accent border border-accent/30"
                          : "bg-border/50 text-muted hover:bg-border"
                      }
                    `}
                  >
                    {followingIds.has(challenge.id) ? "Following" : "Follow"}
                  </button>
                )}
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted">Progress</span>
                  <span className="text-ink tabular-nums">
                    {challenge.totalReps.toLocaleString()} / {challenge.target.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${Math.min(100, challenge.progress)}%` }}
                  />
                </div>
              </div>

              {/* Tally preview */}
              <div className="flex items-center justify-between">
                <div className="text-ink overflow-x-auto">
                  <TallyDisplay count={challenge.totalReps} size="sm" />
                </div>
                <div className="flex items-center gap-1 text-sm text-muted flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {challenge.followerCount}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
