"use client";

import { useState, useEffect, useCallback } from "react";
import { PublicChallengeCard } from "./public-challenge-card";
import type { Challenge } from "@/app/api/v1/_lib/types";

interface PublicChallengeWithMeta extends Challenge {
  totalReps: number;
  progress: number;
  followerCount: number;
  isFollowing: boolean;
  owner: { id: string; name: string };
}

export interface PublicChallengesListProps {
  onRefresh?: () => void;
}

/**
 * List of public challenges with search functionality.
 * Fetches from /api/v1/public/challenges with real aggregation.
 */
export function PublicChallengesList({ onRefresh }: PublicChallengesListProps) {
  const [challenges, setChallenges] = useState<PublicChallengeWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch public challenges
  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const res = await fetch(`/api/v1/public/challenges?${params}`);
      if (!res.ok) throw new Error("Failed to load public challenges");

      const data = await res.json();
      setChallenges(data.challenges || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load challenges");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Follow/unfollow handlers
  const handleFollow = async (challengeId: string) => {
    const res = await fetch("/api/v1/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId }),
    });
    if (!res.ok) throw new Error("Failed to follow challenge");
    onRefresh?.();
  };

  const handleUnfollow = async (challengeId: string) => {
    const res = await fetch("/api/v1/follow", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId }),
    });
    if (!res.ok) throw new Error("Failed to unfollow challenge");
    onRefresh?.();
  };

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-error/10 text-error mb-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-ink font-medium text-sm">{error}</p>
        <button
          onClick={fetchChallenges}
          className="mt-3 px-3 py-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
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
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search public challenges..."
          className="
            w-full pl-9 pr-4 py-2.5
            bg-surface border border-border rounded-xl
            text-sm text-ink placeholder:text-muted
            focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
            transition-colors
          "
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl p-5 animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-24 bg-border/50 rounded" />
                  <div className="h-4 w-16 bg-border/50 rounded" />
                  <div className="h-8 w-32 bg-border/50 rounded" />
                  <div className="h-1.5 w-full bg-border/50 rounded-full" />
                  <div className="h-4 w-20 bg-border/50 rounded" />
                </div>
                <div className="w-14 h-14 rounded-full bg-border/50" />
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-between">
                <div className="h-4 w-16 bg-border/50 rounded" />
                <div className="h-8 w-20 bg-border/50 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && challenges.length === 0 && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-border/30 text-muted mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-ink font-medium">No public challenges</p>
          <p className="text-muted text-sm mt-1">
            {debouncedSearch
              ? "Try a different search term"
              : "Be the first to share a challenge!"}
          </p>
        </div>
      )}

      {/* List */}
      {!loading && challenges.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {challenges.map((challenge) => (
            <PublicChallengeCard
              key={challenge.id}
              challenge={challenge}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PublicChallengesList;
