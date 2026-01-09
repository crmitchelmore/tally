"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { LeaderboardEntry } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, Target, Medal, Crown, Award } from "lucide-react";
import { motion } from "framer-motion";
import { toChallenges, toEntries } from "@/lib/adapters";
import { startOfWeek, startOfMonth, startOfYear, format } from "date-fns";

interface LeaderboardViewProps {
  userId: Id<"users">;
  onBack: () => void;
}

export function LeaderboardView({ userId, onBack }: LeaderboardViewProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year" | "all">("week");

  // Fetch public challenges and entries
  const publicChallengesRaw = useQuery(api.challenges.listPublic, {});
  const entriesRaw = useQuery(api.entries.listByUser, { userId });

  const publicChallenges = useMemo(
    () => (publicChallengesRaw ? toChallenges(publicChallengesRaw) : []),
    [publicChallengesRaw]
  );

  const isLoading = publicChallengesRaw === undefined;

  // Build leaderboard from public challenges
  const leaderboard: LeaderboardEntry[] = useMemo(() => {
    if (!publicChallenges.length) return [];

    const now = new Date();
    let startDate: Date;
    switch (timeRange) {
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case "month":
        startDate = startOfMonth(now);
        break;
      case "year":
        startDate = startOfYear(now);
        break;
      default:
        startDate = new Date(0);
    }

    // For now, show challenges with mock data since we don't have cross-user entries
    return publicChallenges.map((challenge, index) => ({
      rank: index + 1,
      username: `User ${challenge.userId.slice(0, 6)}`,
      avatarUrl: "",
      userId: challenge.userId,
      challengeId: challenge.id,
      challengeName: challenge.name,
      totalReps: 0, // Would need aggregation across all entries for this challenge
      targetNumber: challenge.targetNumber,
      progress: 0,
      daysActive: 0,
      lastUpdated: new Date().toISOString(),
    })).slice(0, 50);
  }, [publicChallenges, timeRange]);

  const myEntries = leaderboard.filter((entry) => entry.userId === userId);
  const globalLeaderboard = leaderboard;

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-muted-foreground font-bold">#{index + 1}</span>;
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => {
    const isCurrentUser = entry.userId === userId;

    return (
      <motion.div
        key={`${entry.challengeId}-${timeRange}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className={`p-4 ${isCurrentUser ? "border-primary border-2 bg-primary/5" : ""}`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12">{getRankIcon(index)}</div>

            <Avatar className="w-12 h-12">
              <AvatarImage src={entry.avatarUrl} alt={entry.username} />
              <AvatarFallback>{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{entry.username}</p>
                {isCurrentUser && (
                  <Badge variant="secondary" className="text-xs">
                    You
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{entry.challengeName}</p>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold font-mono">{entry.totalReps.toLocaleString()}</p>
              <div className="flex items-center gap-2 justify-end">
                <Badge variant="outline" className="text-xs">
                  {entry.progress.toFixed(0)}%
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {entry.daysActive}d
                </span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background tally-marks-bg">
      <div className="max-w-4xl mx-auto p-4 pb-8">
        <header className="mb-6 mt-4">
          <div className="flex items-center gap-4 mb-4">
            <Button onClick={onBack} variant="ghost" size="sm">
              ← Back
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground text-lg">See how you stack up against the community</p>
        </header>

        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)} className="mb-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading leaderboard...</p>
            </div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Trophy className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No public challenges yet</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Be the first! Make your challenges public to appear on the leaderboard
            </p>
            <Button onClick={onBack}>Go to Dashboard</Button>
          </div>
        ) : (
          <Tabs defaultValue="global" className="space-y-6">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="global" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Global
              </TabsTrigger>
              <TabsTrigger value="mine" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                My Ranks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="global" className="space-y-3">
              {globalLeaderboard.map((entry, index) => renderLeaderboardEntry(entry, index))}
            </TabsContent>

            <TabsContent value="mine" className="space-y-3">
              {myEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                    <Target className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">No public challenges</h2>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    Make your challenges public to see your rankings here
                  </p>
                  <Button onClick={onBack}>Go to Dashboard</Button>
                </div>
              ) : (
                myEntries.map((entry) => {
                  const globalRank = globalLeaderboard.findIndex((e) => e.challengeId === entry.challengeId);
                  return renderLeaderboardEntry(entry, globalRank);
                })
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
