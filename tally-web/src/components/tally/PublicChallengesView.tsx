"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { PublicChallenge } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CircularProgress } from "./CircularProgress";
import { Search, Users, TrendingUp, Calendar, UserPlus, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { toChallenges } from "@/lib/adapters";

interface PublicChallengesViewProps {
  userId: Id<"users">;
  onBack: () => void;
}

export function PublicChallengesView({ userId, onBack }: PublicChallengesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch public challenges and followed challenges
  const publicChallengesRaw = useQuery(api.challenges.listPublic, {});
  const followedChallengesRaw = useQuery(api.followedChallenges.listByUser, { userId });

  const followChallenge = useMutation(api.followedChallenges.follow);
  const unfollowChallenge = useMutation(api.followedChallenges.unfollow);

  const isLoading = publicChallengesRaw === undefined;

  const publicChallenges = useMemo(
    () => (publicChallengesRaw ? toChallenges(publicChallengesRaw) : []),
    [publicChallengesRaw]
  );

  const followedChallengeIds = useMemo(
    () => (followedChallengesRaw ? followedChallengesRaw.map((c) => c._id) : []),
    [followedChallengesRaw]
  );

  // Convert to PublicChallenge format for display
  const challenges: PublicChallenge[] = useMemo(
    () =>
      publicChallenges.map((c) => ({
        ...c,
        totalReps: 0, // Would need aggregation
        progress: 0,
        ownerName: undefined,
        ownerAvatarUrl: undefined,
      })),
    [publicChallenges]
  );

  const filteredChallenges = challenges.filter(
    (challenge) =>
      challenge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (challenge.ownerName?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const getDaysRemaining = (challenge: PublicChallenge) => {
    if (challenge.endDate) {
      const now = new Date();
      const end = new Date(challenge.endDate);
      const diff = end.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    const now = new Date();
    const endOfYear = new Date(challenge.year, 11, 31);
    const diff = endOfYear.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const isFollowing = (challengeId: string) => {
    return followedChallengeIds.includes(challengeId as Id<"challenges">);
  };

  const handleToggleFollow = (challenge: PublicChallenge) => {
    if (isFollowing(challenge.id)) {
      void unfollowChallenge({
        challengeId: challenge.id as Id<"challenges">,
      });
      toast.success("Unfollowed challenge", {
        description: `Removed ${challenge.name} from your dashboard`,
      });
    } else {
      void followChallenge({
        challengeId: challenge.id as Id<"challenges">,
      });
      toast.success("Following challenge! 🎯", {
        description: `${challenge.name} will now appear on your dashboard`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background tally-marks-bg">
      <div className="max-w-7xl mx-auto p-4 pb-8">
        <header className="mb-6 mt-4">
          <div className="flex items-center gap-4 mb-4">
            <Button onClick={onBack} variant="ghost" size="sm">
              ← Back
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Public Challenges</h1>
          </div>
          <p className="text-muted-foreground text-lg">Explore challenges from the community</p>
        </header>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search challenges or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading challenges...</p>
            </div>
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Users className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {searchQuery ? "No challenges found" : "No public challenges yet"}
            </h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Be the first! Make your challenges public to share with the community"}
            </p>
            {searchQuery && (
              <Button onClick={() => setSearchQuery("")} variant="outline">
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {filteredChallenges.length} public challenge{filteredChallenges.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredChallenges.map((challenge, index) => {
                const isOwnChallenge = challenge.userId === userId;
                const daysRemaining = getDaysRemaining(challenge);
                const progressPercent = Math.min(challenge.progress || 0, 100);
                const totalReps = challenge.totalReps || 0;

                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`overflow-hidden ${isOwnChallenge ? "border-primary" : ""}`}>
                      <div className="h-2" style={{ backgroundColor: challenge.color }} />

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={challenge.ownerAvatarUrl} alt={challenge.ownerName} />
                              <AvatarFallback>
                                {(challenge.ownerName || "U").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">
                                {challenge.ownerName || `User ${challenge.userId.slice(0, 6)}`}
                              </p>
                              {isOwnChallenge && (
                                <Badge variant="secondary" className="text-xs">
                                  Your challenge
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline">{challenge.year}</Badge>
                        </div>

                        <h3 className="text-2xl font-bold mb-3">{challenge.name}</h3>

                        <div className="flex items-center justify-center mb-4">
                          <CircularProgress
                            value={totalReps}
                            max={challenge.targetNumber}
                            size={140}
                            strokeWidth={12}
                            color={challenge.color}
                          />
                        </div>

                        <div className="text-center mb-4">
                          <p className="text-3xl font-bold font-mono mb-1">
                            {totalReps.toLocaleString()}
                            <span className="text-muted-foreground text-xl">
                              {" "}
                              / {challenge.targetNumber.toLocaleString()}
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground">{progressPercent.toFixed(1)}% complete</p>
                        </div>

                        <div className="flex items-center justify-between text-sm mb-4">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{daysRemaining} days left</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span className="font-semibold">
                              {(totalReps / Math.max(1, 365 - daysRemaining)).toFixed(1)}/day
                            </span>
                          </div>
                        </div>

                        {!isOwnChallenge && (
                          <Button
                            onClick={() => handleToggleFollow(challenge)}
                            variant={isFollowing(challenge.id) ? "secondary" : "default"}
                            className="w-full"
                            size="sm"
                          >
                            {isFollowing(challenge.id) ? (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Following
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Follow
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
