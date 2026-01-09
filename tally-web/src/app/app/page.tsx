"use client";

import { useMemo, useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useStoreUser, useCurrentUser } from "@/hooks/use-store-user";
import { ChallengeCard, ChallengeDetailView, CreateChallengeDialog } from "@/components/tally";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target, BarChart3 } from "lucide-react";
import Link from "next/link";
import { toChallenges, toEntries } from "@/lib/adapters";
import type { Challenge } from "@/types";

export default function Home() {
  useStoreUser();
  const { user: convexUser, isLoaded: isUserLoaded } = useCurrentUser();

  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const challengesRaw = useQuery(api.challenges.listActive, convexUser ? { userId: convexUser._id } : "skip");
  const entriesRaw = useQuery(api.entries.listByUser, convexUser ? { userId: convexUser._id } : "skip");

  const challenges = useMemo(() => (challengesRaw ? toChallenges(challengesRaw) : undefined), [challengesRaw]);
  const entries = useMemo(() => (entriesRaw ? toEntries(entriesRaw) : undefined), [entriesRaw]);

  const selectedChallenge: Challenge | undefined = selectedChallengeId
    ? challenges?.find((c) => c.id === selectedChallengeId)
    : undefined;

  const isLoading = !isUserLoaded || challenges === undefined || entries === undefined;

  const createChallenge = useMutation(api.challenges.create);
  const updateChallenge = useMutation(api.challenges.update);
  const archiveChallenge = useMutation(api.challenges.archive);

  const createEntry = useMutation(api.entries.create);
  const updateEntry = useMutation(api.entries.update);
  const deleteEntry = useMutation(api.entries.remove);

  return (
    <div className="min-h-screen bg-background">
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
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
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
          ) : selectedChallenge && challenges && entries ? (
            <ChallengeDetailView
              challenge={selectedChallenge}
              entries={entries}
              onBack={() => setSelectedChallengeId(null)}
              onAddEntry={(challengeId, count, note, date, sets, feeling) => {
                if (!convexUser) return;
                void createEntry({
                  userId: convexUser._id,
                  challengeId: challengeId as Id<"challenges">,
                  date,
                  count,
                  note: note || undefined,
                  sets,
                  feeling,
                });
              }}
              onUpdateEntry={(entryId, count, note, date, feeling) => {
                void updateEntry({
                  id: entryId as Id<"entries">,
                  count,
                  note: note || undefined,
                  date,
                  feeling,
                });
              }}
              onDeleteEntry={(entryId) => {
                void deleteEntry({ id: entryId as Id<"entries"> });
              }}
              onUpdateChallenge={(challengeId, updates) => {
                void updateChallenge({
                  id: challengeId as Id<"challenges">,
                  name: updates.name,
                  targetNumber: updates.targetNumber,
                  color: updates.color,
                  icon: updates.icon,
                  isPublic: updates.isPublic,
                  archived: updates.archived,
                });
              }}
              onArchiveChallenge={(challengeId) => {
                void archiveChallenge({ id: challengeId as Id<"challenges"> });
                setSelectedChallengeId(null);
              }}
            />
          ) : challenges && entries && challenges.length > 0 ? (
            <div className="space-y-8">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Challenges</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{challenges.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{entries.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Reps</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{entries.reduce((sum, e) => sum + e.count, 0).toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Your Challenges</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {challenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      entries={entries}
                      onClick={() => setSelectedChallengeId(challenge.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No Challenges Yet</h2>
              <p className="text-muted-foreground mb-8">Create your first challenge to start tracking your progress!</p>
              <Button size="lg" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </div>
          )}
        </SignedIn>
      </main>

      <CreateChallengeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreateChallenge={(challenge) => {
          if (!convexUser) return;
          void (async () => {
            const id = await createChallenge({
              userId: convexUser._id,
              name: challenge.name,
              targetNumber: challenge.targetNumber,
              year: challenge.year,
              color: challenge.color,
              icon: challenge.icon,
              timeframeUnit: (challenge.timeframeUnit ?? "year") as "year" | "month" | "custom",
              startDate: challenge.startDate,
              endDate: challenge.endDate,
              isPublic: challenge.isPublic ?? false,
            });
            setSelectedChallengeId(id);
          })();
        }}
      />
    </div>
  );
}
