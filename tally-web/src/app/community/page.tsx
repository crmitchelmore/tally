"use client";

import { useQuery, useMutation } from "convex/react";
import { useUser, UserButton } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft, Search, UserPlus, UserMinus, Users } from "lucide-react";
import { useState } from "react";

export default function CommunityPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  const publicChallenges = useQuery(api.challenges.listPublic, {});
  const followedChallenges = useQuery(
    api.followedChallenges.listByUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const follow = useMutation(api.followedChallenges.follow);
  const unfollow = useMutation(api.followedChallenges.unfollow);

  const validFollowed = followedChallenges?.filter((f): f is NonNullable<typeof f> => f !== null) || [];
  const followedIds = new Set(validFollowed.map((f) => f._id));

  const filteredChallenges = publicChallenges?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleFollow = async (challengeId: string) => {
    if (!user?.id) return;
    if (followedIds.has(challengeId as Id<"challenges">)) {
      await unfollow({ clerkId: user.id, challengeId: challengeId as Id<"challenges"> });
    } else {
      await follow({ clerkId: user.id, challengeId: challengeId as Id<"challenges"> });
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

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
              <h1 className="text-xl font-semibold text-gray-900">Community</h1>
            </div>
            {isSignedIn && <UserButton afterSignOutUrl="/" />}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search public challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Following section */}
        {validFollowed.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Following ({validFollowed.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {validFollowed.map((challenge) => (
                <div
                  key={challenge._id}
                  className="bg-white rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: challenge.color + "20", color: challenge.color }}
                    >
                      {challenge.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{challenge.name}</h3>
                      <p className="text-sm text-gray-500">Target: {challenge.targetNumber}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleFollow(challenge._id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Public challenges */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Public Challenges
          </h2>
          {filteredChallenges === undefined ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-gray-400">Loading challenges...</div>
            </div>
          ) : filteredChallenges.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="mx-auto max-w-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No public challenges</h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? "No challenges match your search. Try a different term."
                    : "There are no public challenges yet. Be the first to create one!"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChallenges.map((challenge) => {
                const isFollowed = followedIds.has(challenge._id);
                const isOwn = challenge.userId === user?.id;
                return (
                  <div
                    key={challenge._id}
                    className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: challenge.color + "20", color: challenge.color }}
                      >
                        {challenge.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{challenge.name}</h3>
                        <p className="text-sm text-gray-500">
                          {challenge.timeframeUnit === "year" 
                            ? `${challenge.targetNumber} in ${challenge.year}`
                            : `${challenge.targetNumber} per month`
                          }
                        </p>
                      </div>
                    </div>
                    {isSignedIn && !isOwn && (
                      <Button
                        size="sm"
                        variant={isFollowed ? "outline" : "default"}
                        onClick={() => handleToggleFollow(challenge._id)}
                        className="w-full"
                      >
                        {isFollowed ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-2" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                    {isOwn && (
                      <p className="text-xs text-gray-400 text-center py-2">Your challenge</p>
                    )}
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
