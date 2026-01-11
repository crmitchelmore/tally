"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useStoreUser, useCurrentUser } from "@/hooks/use-store-user";
import {
  ChallengeCard,
  ChallengeDetailView,
  CreateChallengeDialog,
  AddEntrySheet,
  OverallStats,
  PersonalRecords,
  WeeklySummaryDialog,
  ExportImportDialog,
  LeaderboardView,
  PublicChallengesView,
  FollowedChallengeCard,
} from "@/components/tally";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Target, Calendar, Database, Trophy, Users, LayoutDashboard, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { toChallenges, toEntries, toFollowedChallenges } from "@/lib/adapters";
import type { Challenge, SetData, FeelingType } from "@/types";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useMotionPreference } from "@/hooks/use-reduced-motion";

type ViewMode = "dashboard" | "leaderboard" | "community";

export default function Home() {
  useStoreUser();
  const { user: convexUser, isLoaded: isUserLoaded } = useCurrentUser();
  const { shouldAnimate } = useMotionPreference();

  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [weeklySummaryOpen, setWeeklySummaryOpen] = useState(false);
  const [exportImportOpen, setExportImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");

  const challengesRaw = useQuery(api.challenges.listActive, convexUser ? { userId: convexUser._id } : "skip");
  const entriesRaw = useQuery(api.entries.listByUser, convexUser ? { userId: convexUser._id } : "skip");
  const followedChallengesRaw = useQuery(api.followedChallenges.listByUser, convexUser ? { userId: convexUser._id } : "skip");

  const challenges = useMemo(() => (challengesRaw ? toChallenges(challengesRaw) : undefined), [challengesRaw]);
  const entries = useMemo(() => (entriesRaw ? toEntries(entriesRaw) : undefined), [entriesRaw]);
  const followedChallenges = useMemo(
    () => (followedChallengesRaw ? toFollowedChallenges(followedChallengesRaw) : undefined),
    [followedChallengesRaw]
  );

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

  const unfollowChallenge = useMutation(api.followedChallenges.unfollow);

  const bulkImport = useMutation(api.import.bulkImport);
  const clearAllData = useMutation(api.import.clearAllData);

  const handleAddEntry = (
    challengeId: string,
    count: number,
    note: string,
    date: string,
    sets?: SetData[],
    feeling?: FeelingType
  ) => {
    if (!convexUser) return;
    void createEntry({
      challengeId: challengeId as Id<"challenges">,
      date,
      count,
      note: note || undefined,
      sets: sets?.map((s) => ({ reps: s.reps })),
      feeling,
    });
    toast.success("Entry logged! 🔥", {
      description: `Added ${count} to your challenge`,
    });
  };

  const handleUnfollowChallenge = (challengeId: string, challengeName: string) => {
    if (!convexUser) return;
    void unfollowChallenge({
      challengeId: challengeId as Id<"challenges">,
    });
    toast.success("Unfollowed challenge", {
      description: `Removed ${challengeName} from your dashboard`,
    });
  };

  // Show leaderboard view
  if (viewMode === "leaderboard" && convexUser) {
    return (
      <LeaderboardView
        userId={convexUser._id}
        onBack={() => setViewMode("dashboard")}
      />
    );
  }

  // Show community/public challenges view
  if (viewMode === "community" && convexUser) {
    return (
      <PublicChallengesView
        userId={convexUser._id}
        onBack={() => setViewMode("dashboard")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background tally-marks-bg">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6" />
              <h1 className="text-xl font-bold">Tally</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SignedIn>
              {/* Primary action - Add Entry (always visible when challenges exist) */}
              {challenges && challenges.length > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setAddEntryOpen(true)}
                  aria-label="Add entry"
                >
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Entry</span>
                </Button>
              )}
              
              {/* Secondary actions in dropdown on mobile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" aria-label="More options">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                    <Target className="h-4 w-4 mr-2" />
                    New Challenge
                  </DropdownMenuItem>
                  {challenges && challenges.length > 0 && (
                    <DropdownMenuItem onClick={() => setWeeklySummaryOpen(true)}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Weekly Summary
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setExportImportOpen(true)}>
                    <Database className="h-4 w-4 mr-2" />
                    Backup & Restore
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
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

      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
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
              onAddEntry={handleAddEntry}
              onUpdateEntry={(entryId, count, note, date, feeling) => {
                void updateEntry({
                  id: entryId as Id<"entries">,
                  count,
                  note: note || undefined,
                  date,
                  feeling,
                });
                toast.success("Entry updated! ✏️");
              }}
              onDeleteEntry={(entryId) => {
                void deleteEntry({ id: entryId as Id<"entries"> });
                toast.success("Entry deleted");
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
                if (updates.isPublic !== undefined) {
                  toast.success(updates.isPublic ? "Challenge is now public! 🌍" : "Challenge is now private 🔒");
                }
              }}
              onArchiveChallenge={(challengeId) => {
                void archiveChallenge({ id: challengeId as Id<"challenges"> });
                setSelectedChallengeId(null);
                toast.success("Challenge archived");
              }}
            />
          ) : challenges && entries && challenges.length > 0 ? (
            <div className="space-y-8">
              {/* Overall Stats */}
              <OverallStats challenges={challenges} entries={entries} />

              {/* Personal Records */}
              <PersonalRecords challenges={challenges} entries={entries} />

              {/* Followed Challenges */}
              {followedChallenges && followedChallenges.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold">Following</h2>
                    <Badge variant="secondary">{followedChallenges.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {followedChallenges.map((challenge) => (
                      <FollowedChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        entries={entries}
                        onUnfollow={() => handleUnfollowChallenge(challenge.id, challenge.name)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Your Challenges */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Your Challenges</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {challenges.map((challenge, index) => (
                    <motion.div
                      key={challenge.id}
                      initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={shouldAnimate ? { delay: index * 0.05, duration: 0.3 } : { duration: 0 }}
                    >
                      <ChallengeCard
                        challenge={challenge}
                        entries={entries}
                        onClick={() => setSelectedChallengeId(challenge.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimate ? { duration: 0.3 } : { duration: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Target className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Challenges Yet</h2>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Create your first challenge and start tracking your progress towards greatness
              </p>
              <Button size="lg" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Challenge
              </Button>
            </motion.div>
          )}
        </SignedIn>
      </main>

      {/* AddEntry Sheet */}
      {challenges && (
        <AddEntrySheet
          open={addEntryOpen}
          onOpenChange={setAddEntryOpen}
          challenges={challenges}
          onAddEntry={handleAddEntry}
        />
      )}

      {/* Create Challenge Dialog */}
      <CreateChallengeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreateChallenge={(challenge) => {
          if (!convexUser) return;
          void (async () => {
            const id = await createChallenge({
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
            toast.success("Challenge created! 🎯", {
              description: `Ready to crush ${challenge.targetNumber.toLocaleString()} ${challenge.name}!`,
            });
          })();
        }}
      />

      {/* Weekly Summary Dialog */}
      {challenges && entries && (
        <WeeklySummaryDialog
          open={weeklySummaryOpen}
          onOpenChange={setWeeklySummaryOpen}
          challenges={challenges}
          entries={entries}
        />
      )}

      {/* Export/Import Dialog */}
      {challenges && entries && (
        <ExportImportDialog
          open={exportImportOpen}
          onOpenChange={setExportImportOpen}
          challenges={challenges}
          entries={entries}
          onImport={async (importedChallenges, importedEntries) => {
            if (!convexUser) return;
            try {
              const result = await bulkImport({
                challenges: importedChallenges.map((c) => ({
                  id: c.id,
                  name: c.name,
                  targetNumber: c.targetNumber,
                  year: c.year,
                  color: c.color,
                  icon: c.icon,
                  timeframeUnit: (c.timeframeUnit ?? "year") as "year" | "month" | "custom",
                  startDate: c.startDate,
                  endDate: c.endDate,
                  isPublic: c.isPublic ?? false,
                  archived: c.archived ?? false,
                })),
                entries: importedEntries.map((e) => ({
                  challengeId: e.challengeId,
                  date: e.date,
                  count: e.count,
                  note: e.note,
                  sets: e.sets?.map((s) => ({ reps: s.reps })),
                  feeling: e.feeling,
                })),
              });
              toast.success("Import successful! 🎉", {
                description: `Imported ${result.challengesCreated} challenges and ${result.entriesCreated} entries`,
              });
            } catch (error) {
              toast.error("Import failed", {
                description: error instanceof Error ? error.message : "Unknown error",
              });
            }
          }}
          onClearAll={async () => {
            if (!convexUser) return;
            try {
              const result = await clearAllData({});
              toast.success("All data cleared", {
                description: `Deleted ${result.challengesDeleted} challenges and ${result.entriesDeleted} entries`,
              });
            } catch (error) {
              toast.error("Failed to clear data", {
                description: error instanceof Error ? error.message : "Unknown error",
              });
            }
          }}
          userId={convexUser?._id ?? null}
        />
      )}

      {/* Mobile Bottom Navigation - visible only on small screens */}
      <SignedIn>
        <nav 
          className="fixed bottom-0 left-0 right-0 bg-card border-t md:hidden z-50"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="flex justify-around items-center h-16 px-2">
            <button
              onClick={() => {
                setSelectedChallengeId(null);
                setViewMode("dashboard");
              }}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-colors ${
                viewMode === "dashboard" && !selectedChallengeId
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Dashboard"
              aria-current={viewMode === "dashboard" && !selectedChallengeId ? "page" : undefined}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => setViewMode("community")}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-colors ${
                viewMode === "community"
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Community"
              aria-current={viewMode === "community" ? "page" : undefined}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">Community</span>
            </button>
            <button
              onClick={() => setViewMode("leaderboard")}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-colors ${
                viewMode === "leaderboard"
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Leaderboard"
              aria-current={viewMode === "leaderboard" ? "page" : undefined}
            >
              <Trophy className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">Leaderboard</span>
            </button>
          </div>
        </nav>
      </SignedIn>
    </div>
  );
}
