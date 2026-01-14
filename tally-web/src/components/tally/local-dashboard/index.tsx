"use client";

/**
 * LocalDashboard Component
 *
 * Dashboard for local-only mode using IndexedDB data.
 * Provides the same UX as the synced dashboard but with local storage.
 */

import { useState, useMemo } from "react";
import { useDataStore } from "@/hooks/use-data-store";
import {
  ChallengeCard,
  ChallengeDetailView,
  CreateChallengeDialog,
  AddEntrySheet,
  OverallStats,
  PersonalRecords,
  ExportImportDialog,
} from "@/components/tally";
import { LocalOnlyBanner } from "@/components/tally/mode-indicator";
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
import { Plus, Target, Database, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useMotionPreference } from "@/hooks/use-reduced-motion";
import type { Challenge, Entry, SetData, FeelingType } from "@/types";
import type { ExportedChallenge, ExportedEntry } from "@tally/shared-types";

// Transform ExportedChallenge to Challenge for compatibility with existing components
function toChallenge(c: ExportedChallenge): Challenge {
  return {
    id: c.id,
    userId: "local-user", // Local-only mode doesn't have server-side userId
    name: c.name,
    targetNumber: c.targetNumber,
    year: c.year,
    color: c.color,
    icon: c.icon,
    timeframeUnit: c.timeframeUnit as Challenge["timeframeUnit"],
    startDate: c.startDate,
    endDate: c.endDate,
    isPublic: c.isPublic,
    archived: c.archived,
    createdAt: c.createdAt,
  };
}

// Transform ExportedEntry to Entry for compatibility with existing components
function toEntry(e: ExportedEntry): Entry {
  return {
    id: e.id,
    userId: "local-user", // Local-only mode doesn't have server-side userId
    challengeId: e.challengeId,
    date: e.date,
    count: e.count,
    note: e.note ?? undefined,
    sets: e.sets as SetData[] | undefined,
    feeling: e.feeling as FeelingType | undefined,
    createdAt: e.createdAt,
  };
}

interface LocalDashboardProps {
  onSwitchToLeaderboard: () => void;
  onSwitchToCommunity: () => void;
}

export function LocalDashboard({
  onSwitchToLeaderboard,
  onSwitchToCommunity,
}: LocalDashboardProps) {
  const { shouldAnimate } = useMotionPreference();
  const {
    challenges: rawChallenges,
    entries: rawEntries,
    isLoadingChallenges,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    createEntry,
    updateEntry,
    deleteEntry,
    exportAll,
    importAll,
    clearAll,
  } = useDataStore();

  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(
    null
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [exportImportOpen, setExportImportOpen] = useState(false);

  // Transform data for existing components
  const challenges = useMemo(
    () =>
      rawChallenges?.filter((c) => !c.archived).map(toChallenge) ?? undefined,
    [rawChallenges]
  );
  const entries = useMemo(
    () => rawEntries.map(toEntry),
    [rawEntries]
  );

  const selectedChallenge = selectedChallengeId
    ? challenges?.find((c) => c.id === selectedChallengeId)
    : undefined;

  const isLoading = isLoadingChallenges;

  // Handlers
  const handleCreateChallenge = async (data: {
    name: string;
    targetNumber: number;
    year: number;
    color?: string;
    icon?: string;
    timeframeUnit?: "year" | "month" | "custom";
    startDate?: string;
    endDate?: string;
    isPublic?: boolean;
  }) => {
    await createChallenge({
      name: data.name,
      targetNumber: data.targetNumber,
      year: data.year,
      color: data.color ?? "#3b82f6",
      icon: data.icon ?? "target",
      timeframeUnit: data.timeframeUnit ?? "year",
      startDate: data.startDate,
      endDate: data.endDate,
      isPublic: data.isPublic ?? false,
      archived: false,
    });
    setCreateOpen(false);
    toast.success("Challenge created! 🎯");
  };

  const handleAddEntry = async (
    challengeId: string,
    count: number,
    note?: string,
    date?: string,
    sets?: SetData[],
    feeling?: FeelingType
  ) => {
    await createEntry({
      challengeId,
      date: date || new Date().toISOString().split("T")[0],
      count,
      note,
      sets,
      feeling,
    });
    setAddEntryOpen(false);
    toast.success(`Added ${count} to your count! 🎉`);
  };

  const handleUpdateEntry = async (
    entryId: string,
    count: number,
    note?: string,
    date?: string,
    feeling?: FeelingType
  ) => {
    await updateEntry(entryId, { count, note, date, feeling });
    toast.success("Entry updated! ✏️");
  };

  const handleDeleteEntry = async (entryId: string) => {
    await deleteEntry(entryId);
    toast.success("Entry deleted");
  };

  const handleUpdateChallenge = async (
    challengeId: string,
    updates: Partial<Challenge>
  ) => {
    await updateChallenge(challengeId, {
      name: updates.name,
      targetNumber: updates.targetNumber,
      color: updates.color,
      icon: updates.icon,
      isPublic: updates.isPublic,
      archived: updates.archived,
    });
    if (updates.isPublic !== undefined) {
      toast.success(
        updates.isPublic ? "Challenge is now public! 🌍" : "Challenge is now private 🔒"
      );
    }
  };

  const handleArchiveChallenge = async (challengeId: string) => {
    await updateChallenge(challengeId, { archived: true });
    setSelectedChallengeId(null);
    toast.success("Challenge archived");
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background tally-marks-bg">
        <LocalOnlyBanner />
        <main className="container mx-auto px-4 py-8 pb-28">
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
        </main>
      </div>
    );
  }

  // Challenge detail view
  if (selectedChallenge && challenges && entries) {
    return (
      <div className="min-h-screen bg-background tally-marks-bg">
        <LocalOnlyBanner />
        <main className="container mx-auto px-4 py-8 pb-28">
          <ChallengeDetailView
            challenge={selectedChallenge}
            entries={entries}
            onBack={() => setSelectedChallengeId(null)}
            onAddEntry={handleAddEntry}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
            onUpdateChallenge={handleUpdateChallenge}
            onArchiveChallenge={handleArchiveChallenge}
          />
        </main>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-background tally-marks-bg">
      <LocalOnlyBanner />
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6" />
              <h1 className="text-xl font-bold">Tally</h1>
            </div>
            <Badge variant="secondary" className="text-xs">
              Local Mode
            </Badge>
          </div>
          <div className="flex items-center gap-2">
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
                <DropdownMenuItem onClick={() => setExportImportOpen(true)}>
                  <Database className="h-4 w-4 mr-2" />
                  Backup & Restore
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/sign-up">
              <Button variant="outline" size="sm">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-28">
        {/* Empty state */}
        {(!challenges || challenges.length === 0) && (
          <div className="text-center py-20">
            <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-3xl font-bold mb-2">Start Your First Challenge</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Track your progress with tally marks. Your data is stored locally
              on this device.
            </p>
            <Button size="lg" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Challenge
            </Button>
          </div>
        )}

        {/* Dashboard with challenges */}
        {challenges && challenges.length > 0 && entries && (
          <div className="space-y-8" data-testid="challenges-section">
            {/* Overall Stats */}
            <OverallStats challenges={challenges} entries={entries} />

            {/* Personal Records */}
            <PersonalRecords challenges={challenges} entries={entries} />

            {/* Active Challenges */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">Your Challenges</h2>
                  <Badge variant="secondary">{challenges.length}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Challenge
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {challenges.map((challenge, index) => (
                  <motion.div
                    key={challenge.id}
                    initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
                    animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                    transition={{ delay: index * 0.1 }}
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
        )}
      </main>

      {/* Dialogs */}
      <CreateChallengeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreateChallenge={handleCreateChallenge}
      />

      <AddEntrySheet
        open={addEntryOpen}
        onOpenChange={setAddEntryOpen}
        challenges={challenges || []}
        onAddEntry={handleAddEntry}
      />

      <ExportImportDialog
        open={exportImportOpen}
        onOpenChange={setExportImportOpen}
        challenges={challenges || []}
        entries={entries || []}
        userId="local-user"
        onImport={async (importedChallenges: Challenge[], importedEntries: Entry[]) => {
          // Convert back to exported format and import
          const payload = {
            schemaVersion: "1.0.0" as const,
            exportedAt: new Date().toISOString(),
            source: "web" as const,
            challenges: importedChallenges.map((c) => ({
              id: c.id,
              name: c.name,
              targetNumber: c.targetNumber,
              year: c.year,
              color: c.color,
              icon: c.icon,
              timeframeUnit: c.timeframeUnit ?? "year",
              startDate: c.startDate,
              endDate: c.endDate,
              isPublic: c.isPublic ?? false,
              archived: c.archived,
              createdAt: typeof c.createdAt === "number" ? c.createdAt : Date.parse(c.createdAt),
              updatedAt: Date.now(),
            })),
            entries: importedEntries.map((e) => ({
              id: e.id,
              challengeId: e.challengeId,
              date: e.date,
              count: e.count,
              note: e.note,
              sets: e.sets,
              feeling: e.feeling,
              createdAt: typeof e.createdAt === "number" ? e.createdAt : Date.now(),
              updatedAt: Date.now(),
            })),
          };
          const result = await importAll(payload, { clearExisting: true });
          if (!result.success) {
            throw new Error(result.errors?.join(", ") || "Import failed");
          }
        }}
        onClearAll={clearAll}
      />
    </div>
  );
}
