"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TallyMark } from "@/components/ui/tally-mark";
import { UndoToast } from "@/components/ui/undo-toast";
import { ActivityHeatmap } from "@/components/challenges/activity-heatmap";
import { AddEntryDialog, EntryList, DayDrilldown, EditEntryDialog } from "@/components/entries";
import { refreshEntries, refreshChallenges } from "@/hooks/use-data-refresh";
import type { Challenge, ChallengeStats, Entry, CreateEntryRequest, UpdateEntryRequest } from "@/app/api/v1/_lib/types";
import { getIconEmoji } from "@/lib/challenge-icons";

interface ChallengeData {
  challenge: Challenge;
  stats: ChallengeStats;
  entries: Entry[];
}

/**
 * Challenge detail page.
 * Shows challenge header with stats, yearly activity heatmap, and settings.
 */
export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeId = params.id as string;

  const [data, setData] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Entry dialog state - check query param for auto-open
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [drilldownDate, setDrilldownDate] = useState<string | null>(null);
  
  // Undo state for deleted entries
  const [deletedEntry, setDeletedEntry] = useState<{ id: string; message: string } | null>(null);

  // Auto-open add entry dialog if requested via query param
  useEffect(() => {
    if (searchParams.get("addEntry") === "true" && data) {
      setShowAddEntry(true);
      // Clear the query param from URL without navigation
      router.replace(`/app/challenges/${challengeId}`, { scroll: false });
    }
  }, [searchParams, data, challengeId, router]);

  // Fetch challenge data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [challengeRes, statsRes, entriesRes] = await Promise.all([
        fetch(`/api/v1/challenges/${challengeId}`),
        fetch(`/api/v1/challenges/${challengeId}/stats`),
        fetch(`/api/v1/entries?challengeId=${challengeId}`),
      ]);

      if (!challengeRes.ok) {
        if (challengeRes.status === 404) throw new Error("Challenge not found");
        if (challengeRes.status === 403) throw new Error("Access denied");
        throw new Error("Failed to load challenge");
      }

      const [challengeData, statsData, entriesData] = await Promise.all([
        challengeRes.json(),
        statsRes.json(),
        entriesRes.json(),
      ]);

      setData({
        challenge: challengeData.challenge,
        stats: statsData.stats,
        entries: entriesData.entries || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load challenge");
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add entry handler
  const handleAddEntry = useCallback(
    async (entryData: Omit<CreateEntryRequest, "challengeId">) => {
      const res = await fetch("/api/v1/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...entryData, challengeId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to add entry");
      }

      // Refresh local data and global SWR caches
      await fetchData();
      refreshEntries();
    },
    [challengeId, fetchData]
  );

  // Edit entry handler
  const handleEditEntry = useCallback(
    async (id: string, entryData: UpdateEntryRequest) => {
      const res = await fetch(`/api/v1/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update entry");
      }

      await fetchData();
      refreshEntries();
    },
    [fetchData]
  );

  // Delete entry handler (with undo support)
  const handleDeleteEntry = useCallback(
    async (id: string) => {
      const entry = data?.entries.find((e) => e.id === id);
      const res = await fetch(`/api/v1/entries/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete entry");
      }

      // Show undo toast
      setDeletedEntry({
        id,
        message: `Entry deleted${entry ? ` (${entry.count} marks)` : ""}`,
      });

      await fetchData();
      refreshEntries();
    },
    [fetchData, data?.entries]
  );

  // Restore entry handler
  const handleRestoreEntry = useCallback(async () => {
    if (!deletedEntry) return;
    
    const res = await fetch(`/api/v1/entries/${deletedEntry.id}/restore`, {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error("Failed to restore entry");
    }

    setDeletedEntry(null);
    await fetchData();
    refreshEntries();
  }, [deletedEntry, fetchData]);

  // Heatmap day click handler
  const handleDayClick = useCallback((date: string) => {
    setDrilldownDate(date);
  }, []);

  // Get entries for drilldown date
  const drilldownEntries = drilldownDate && data
    ? data.entries.filter((e) => e.date === drilldownDate)
    : [];

  // Archive/unarchive
  const handleToggleArchive = async () => {
    if (!data) return;
    try {
      const res = await fetch(`/api/v1/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !data.challenge.isArchived }),
      });
      if (res.ok) {
        fetchData();
        refreshChallenges();
      }
    } catch {
      // Ignore
    }
  };

  // Toggle public/private visibility
  const handleTogglePublic = async () => {
    if (!data) return;
    try {
      const res = await fetch(`/api/v1/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !data.challenge.isPublic }),
      });
      if (res.ok) {
        fetchData();
        refreshChallenges();
      }
    } catch {
      // Ignore
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!data) return;
    const challengeName = data.challenge.name;
    try {
      setDeleting(true);
      const res = await fetch(`/api/v1/challenges/${challengeId}`, { method: "DELETE" });
      if (res.ok) {
        const result = await res.json();
        // Navigate to dashboard with undo info in session storage
        sessionStorage.setItem("deletedChallenge", JSON.stringify({
          id: result.id,
          name: challengeName,
        }));
        router.push("/app");
      }
    } catch {
      // Ignore
    } finally {
      setDeleting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-24 bg-border/50 rounded" />
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="h-8 w-48 bg-border/50 rounded mb-4" />
          <div className="h-24 bg-border/50 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-error/10 text-error mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
          </svg>
        </div>
        <p className="text-ink font-medium">{error}</p>
        <Link href="/app" className="mt-4 inline-block text-sm text-accent hover:text-accent/80">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const { challenge, stats, entries } = data;
  const unitLabel = challenge.unitLabel || "marks";

  const paceColors = {
    ahead: "text-success",
    "on-pace": "text-ink",
    behind: "text-warning",
  };

  const behindBy = Math.ceil((stats.daysElapsed * challenge.target / (new Date(challenge.endDate).getTime() - new Date(challenge.startDate).getTime()) * 86400000) - stats.totalCount);
  const paceMessages = {
    ahead: "You're ahead of pace!",
    "on-pace": "Right on track.",
    behind: `Behind by ${behindBy} ${behindBy === 1 ? unitLabel.replace(/s$/, "") : unitLabel}`,
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/app"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to challenges
      </Link>

      {/* Header card */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              {getIconEmoji(challenge.icon)}
            </span>
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: challenge.color }}
            />
            <h1 className="text-2xl font-semibold text-ink">{challenge.name}</h1>
            {challenge.isArchived && (
              <span className="text-xs text-muted px-2 py-0.5 bg-border/50 rounded-full">
                Archived
              </span>
            )}
            {challenge.isPublic && (
              <span className="text-xs text-muted px-2 py-0.5 bg-border/50 rounded-full">
                Public
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddEntry(true)}
              className="px-4 py-2 rounded-xl font-medium bg-accent text-white hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              + Add Entry
            </button>
            {/* Popover menu */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg text-muted hover:bg-border/50 transition-colors"
                aria-label="Settings"
                aria-expanded={showSettings}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {/* Popover dropdown */}
              {showSettings && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowSettings(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
                    <div className="py-1">
                      <button
                        onClick={() => { handleTogglePublic(); setShowSettings(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-border/30 transition-colors"
                      >
                        <p className="font-medium text-ink text-sm">
                          {challenge.isPublic ? "Make Private" : "Make Public"}
                        </p>
                        <p className="text-xs text-muted">
                          {challenge.isPublic ? "Remove from community" : "Share in community challenges"}
                        </p>
                      </button>
                      <div className="border-t border-border" />
                      <button
                        onClick={() => { handleToggleArchive(); setShowSettings(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-border/30 transition-colors"
                      >
                        <p className="font-medium text-ink text-sm">
                          {challenge.isArchived ? "Unarchive" : "Archive"}
                        </p>
                        <p className="text-xs text-muted">
                          {challenge.isArchived ? "Restore to active list" : "Hide from active challenges"}
                        </p>
                      </button>
                      <div className="border-t border-border" />
                      <button
                        onClick={() => { handleDelete(); setShowSettings(false); }}
                        disabled={deleting}
                        className="w-full text-left px-4 py-3 hover:bg-error/10 transition-colors text-error"
                      >
                        <p className="font-medium text-sm">{deleting ? "Deleting..." : "Delete"}</p>
                        <p className="text-xs opacity-70">Permanently remove</p>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted">Progress</p>
            <p className="text-2xl font-semibold text-ink tabular-nums">
              {stats.totalCount.toLocaleString()}
              <span className="text-muted text-base font-normal"> / {challenge.target.toLocaleString()}</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">Remaining</p>
            <p className="text-2xl font-semibold text-ink tabular-nums">
              {stats.remaining.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">Days left</p>
            <p className="text-2xl font-semibold text-ink tabular-nums">
              {stats.daysRemaining}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">Per day needed</p>
            <p className="text-2xl font-semibold text-ink tabular-nums">
              {stats.perDayRequired.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Pace callout */}
        <div className={`mt-4 p-3 rounded-lg bg-border/30 ${paceColors[stats.paceStatus]}`}>
          <p className="text-sm font-medium">{paceMessages[stats.paceStatus]}</p>
          <p className="text-xs text-muted mt-0.5">
            Current pace: {stats.currentPace}/day · Best day: {stats.bestDay?.count || 0} {(stats.bestDay?.count || 0) === 1 ? unitLabel.replace(/s$/, "") : unitLabel}
          </p>
        </div>

        {/* TallyMark display */}
        <div className="mt-6 flex justify-center">
          <TallyMark count={stats.totalCount} size="lg" />
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Activity</h2>
        <ActivityHeatmap
          entries={entries}
          startDate={challenge.startDate}
          endDate={challenge.endDate}
          color={challenge.color}
          onDayClick={handleDayClick}
          unitLabel={unitLabel}
        />
      </div>

      {/* Streaks and records */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Streaks & Records</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted">Current streak</p>
            <p className="text-xl font-semibold text-ink tabular-nums">{stats.streakCurrent} days</p>
          </div>
          <div>
            <p className="text-sm text-muted">Best streak</p>
            <p className="text-xl font-semibold text-ink tabular-nums">{stats.streakBest} days</p>
          </div>
          <div>
            <p className="text-sm text-muted">Best day</p>
            <p className="text-xl font-semibold text-ink tabular-nums">{stats.bestDay?.count || 0} {(stats.bestDay?.count || 0) === 1 ? unitLabel.replace(/s$/, "") : unitLabel}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Daily average</p>
            <p className="text-xl font-semibold text-ink tabular-nums">{stats.dailyAverage.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* Recent entries */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Recent Entries</h2>
        <EntryList
          entries={entries.slice(0, 20)}
          onEdit={setEditingEntry}
          onDelete={(entry) => handleDeleteEntry(entry.id)}
          unitLabel={unitLabel}
        />
      </div>

      {/* Add entry dialog */}
      <AddEntryDialog
        challenge={challenge}
        open={showAddEntry}
        onClose={() => setShowAddEntry(false)}
        onSubmit={handleAddEntry}
        entries={entries}
      />

      {/* Edit entry dialog */}
      <EditEntryDialog
        entry={editingEntry}
        open={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        onSubmit={handleEditEntry}
        onDelete={handleDeleteEntry}
      />

      {/* Day drilldown */}
      <DayDrilldown
        date={drilldownDate || ""}
        entries={drilldownEntries}
        open={!!drilldownDate}
        onClose={() => setDrilldownDate(null)}
        onEdit={setEditingEntry}
        onDelete={(entry) => handleDeleteEntry(entry.id)}
        onAddEntry={() => {
          setDrilldownDate(null);
          setShowAddEntry(true);
        }}
        unitLabel={unitLabel}
      />

      {/* Undo toast for deleted entry */}
      {deletedEntry && (
        <UndoToast
          message={deletedEntry.message}
          onUndo={handleRestoreEntry}
          onDismiss={() => setDeletedEntry(null)}
        />
      )}
    </div>
  );
}
