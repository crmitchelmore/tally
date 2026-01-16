"use client";

import { useQuery } from "convex/react";
import { useUser, UserButton } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";
import { useState } from "react";

type TimeRange = "week" | "month" | "year" | "all";

export default function LeaderboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  const leaderboard = useQuery(api.leaderboard.getLeaderboard, { timeRange, limit: 50 });
  const userRank = useQuery(
    api.leaderboard.getUserRank,
    user?.id ? { clerkId: user.id, timeRange } : "skip"
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-gray-500">{rank}</span>;
  };

  const timeRangeLabels: Record<TimeRange, string> = {
    week: "This Week",
    month: "This Month",
    year: "This Year",
    all: "All Time",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/app" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Leaderboard</h1>
            </div>
            {isSignedIn && <UserButton afterSignOutUrl="/" />}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Time range selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(["week", "month", "year", "all"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              size="sm"
              variant={timeRange === range ? "default" : "outline"}
              onClick={() => setTimeRange(range)}
              className="whitespace-nowrap"
            >
              {timeRangeLabels[range]}
            </Button>
          ))}
        </div>

        {/* User's rank card */}
        {userRank && userRank.rank !== null && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-6">
            <p className="text-sm opacity-80 mb-1">Your Rank</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">#{userRank.rank}</span>
              <span className="text-lg opacity-80">of {userRank.totalUsers}</span>
            </div>
            <p className="text-sm mt-2 opacity-80">
              {userRank.total.toLocaleString()} total entries
            </p>
          </div>
        )}

        {/* Leaderboard list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {leaderboard === undefined ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-gray-400">Loading leaderboard...</div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 px-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No entries yet</h3>
              <p className="text-gray-600">
                Be the first to log an entry and claim the top spot!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {leaderboard.map((entry) => {
                const isCurrentUser = entry.clerkId === user?.id;
                return (
                  <div
                    key={entry.clerkId}
                    className={`flex items-center gap-4 p-4 ${
                      isCurrentUser ? "bg-indigo-50" : ""
                    }`}
                  >
                    <div className="w-8 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      {entry.avatarUrl ? (
                        <img
                          src={entry.avatarUrl}
                          alt=""
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                          {entry.name?.charAt(0) || "?"}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {entry.name || "Anonymous"}
                          {isCurrentUser && (
                            <span className="text-indigo-600 text-sm ml-2">(You)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{entry.total.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">entries</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
