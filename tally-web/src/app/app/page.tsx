"use client";

import { useMemo } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useStoreUser, useCurrentUser } from "@/hooks/use-store-user";
import { ChallengeCard } from "@/components/tally/ChallengeCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target, BarChart3 } from "lucide-react";
import Link from "next/link";
import { toChallenges, toEntries } from "@/lib/adapters";

export default function Home() {
  // Sync user to Convex on login
  useStoreUser();
  const { user: convexUser, isLoaded: isUserLoaded } = useCurrentUser();

  // Fetch challenges for current user
  const challengesRaw = useQuery(
    api.challenges.listActive,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  // Fetch all entries for current user
  const entriesRaw = useQuery(
    api.entries.listByUser,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  // Convert Convex documents to application types
  const challenges = useMemo(
    () => (challengesRaw ? toChallenges(challengesRaw) : undefined),
    [challengesRaw]
  );
  const entries = useMemo(
    () => (entriesRaw ? toEntries(entriesRaw) : undefined),
    [entriesRaw]
  );

  const isLoading = !isUserLoaded || challenges === undefined || entries === undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6" />
              <h1 className="text-xl font-bold">Tally</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <SignedIn>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Challenge
              </Button>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            </SignedOut>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <SignedOut>
          <div className="text-center py-20">
            <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-3xl font-bold mb-2">Track Your Progress</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Create challenges, log entries with tally marks, and visualize your journey toward your goals.
            </p>
            <Link href="/sign-in">
              <Button size="lg">Get Started</Button>
            </Link>
          </div>
        </SignedOut>

        <SignedIn>
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : challenges && challenges.length > 0 ? (
            <div className="space-y-8">
              {/* Stats Overview */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Active Challenges
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{challenges.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Entries
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{entries?.length ?? 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Reps
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {entries?.reduce((sum, e) => sum + e.count, 0).toLocaleString() ?? 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Challenge Cards */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Your Challenges</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {challenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      entries={entries ?? []}
                      onClick={() => {
                        console.log("Challenge clicked:", challenge.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No Challenges Yet</h2>
              <p className="text-muted-foreground mb-8">
                Create your first challenge to start tracking your progress!
              </p>
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </div>
          )}
        </SignedIn>
      </main>
    </div>
  );
}
