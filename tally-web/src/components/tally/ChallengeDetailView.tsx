"use client";

import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Challenge, Entry } from "@/types";
import { calculateStats, formatPaceStatus } from "@/lib/stats";
import { AddEntrySheet } from "./AddEntrySheet";
import { TallyMarks } from "./marks/TallyMarks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface ChallengeDetailViewProps {
  challengeId: Id<"challenges">;
  onClose: () => void;
}

// Simple feeling indicators
const FEELING_SYMBOLS: Record<string, string> = {
  "very-easy": "◉",
  "easy": "○",
  "moderate": "◐",
  "hard": "●",
  "very-hard": "◉",
};

export function ChallengeDetailView({ challengeId, onClose }: ChallengeDetailViewProps) {
  const { user } = useUser();
  const challenge = useQuery(
    api.challenges.get,
    user?.id ? { clerkId: user.id, challengeId } : "skip"
  );
  const entries = useQuery(
    api.entries.listByChallenge,
    user?.id ? { clerkId: user.id, challengeId } : "skip"
  );

  const archiveChallenge = useMutation(api.challenges.archive);
  const removeChallenge = useMutation(api.challenges.remove);
  const updateChallenge = useMutation(api.challenges.update);
  const removeEntry = useMutation(api.entries.remove);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("");

  if (!challenge || !entries) {
    return (
      <div className="fixed inset-0 bg-[var(--paper)] z-50 flex items-center justify-center">
        <div className="text-[var(--ink-muted)]">Loading...</div>
      </div>
    );
  }

  const stats = calculateStats(challenge as Challenge, entries as Entry[]);
  const pace = formatPaceStatus(stats.paceStatus);
  const progress = Math.min(100, (stats.total / challenge.targetNumber) * 100);

  const getStatusColor = () => {
    if (stats.paceStatus === "ahead") return "var(--success)";
    if (stats.paceStatus === "onPace") return "var(--ink)";
    return "var(--slash)";
  };

  const handleArchive = async () => {
    await archiveChallenge({ clerkId: user!.id, challengeId });
    onClose();
  };

  const handleDelete = async () => {
    await removeChallenge({ clerkId: user!.id, challengeId });
    onClose();
  };

  const handleSaveEdit = async () => {
    await updateChallenge({
      clerkId: user!.id,
      challengeId,
      name: editName,
      targetNumber: parseInt(editTarget, 10),
    });
    setShowEditDialog(false);
  };

  const handleDeleteEntry = async (entryId: Id<"entries">) => {
    await removeEntry({ clerkId: user!.id, entryId });
  };

  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, typeof entries>);

  const sortedDates = Object.keys(entriesByDate).sort().reverse();

  return (
    <div className="fixed inset-0 bg-[var(--paper)] paper-texture z-50 overflow-auto">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-[var(--border-light)] z-10">
        <div className="container-medium">
          <div className="flex h-16 items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
            >
              <span className="text-lg">←</span>
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              <AddEntrySheet
                challengeId={challengeId}
                trigger={
                  <button className="btn btn-accent">+ Add Entry</button>
                }
              />
              <button
                onClick={() => { setEditName(challenge.name); setEditTarget(String(challenge.targetNumber)); setShowEditDialog(true); }}
                className="btn btn-secondary"
              >
                Edit
              </button>
              <button
                onClick={handleArchive}
                className="btn btn-secondary"
              >
                Archive
              </button>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="btn btn-secondary text-[var(--danger)] border-[var(--danger)]/20 hover:bg-[var(--danger)]/5"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container-medium py-10">
        {/* Two-column layout on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-10">
          {/* Main column */}
          <div>
            {/* Challenge header */}
            <header className="flex items-start gap-5 mb-10">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0"
                style={{ backgroundColor: challenge.color + "15", color: challenge.color }}
              >
                {challenge.icon}
              </div>
              <div>
                <h1 className="font-display text-3xl text-[var(--ink)] mb-1">{challenge.name}</h1>
                <p style={{ color: getStatusColor() }} className="font-medium">{pace.text}</p>
              </div>
            </header>

            {/* Tally marks visualization */}
            <section className="card mb-8">
              <h2 className="stat-label mb-4">Progress</h2>
              <div className="min-h-[100px] py-4 px-2 bg-[var(--paper-warm)] rounded-lg mb-6 flex items-center">
                {stats.total > 0 ? (
                  <TallyMarks 
                    count={stats.total} 
                    size="lg" 
                    color={challenge.color}
                    maxDisplay={50}
                    animate
                  />
                ) : (
                  <span className="text-[var(--ink-faint)]">No entries yet</span>
                )}
              </div>
              
              <div className="flex items-baseline justify-between mb-3">
                <span className="stat-value">{stats.total}</span>
                <span className="text-[var(--ink-muted)]">of {challenge.targetNumber}</span>
              </div>
              <div className="progress-track h-2">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%`, backgroundColor: challenge.color }}
                />
              </div>
              <p className="text-sm text-[var(--ink-muted)] mt-3">
                {stats.remaining} remaining • {stats.requiredPerDay.toFixed(1)} per day to stay on pace
              </p>
            </section>

            {/* Entry history */}
            <section>
              <h2 className="font-display text-xl text-[var(--ink)] mb-5">History</h2>
              {sortedDates.length === 0 ? (
                <div className="card text-center py-10">
                  <p className="text-[var(--ink-muted)]">No entries yet. Add your first entry to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedDates.map((date) => {
                    const dayEntries = entriesByDate[date];
                    const dayTotal = dayEntries.reduce((sum, e) => sum + e.count, 0);
                    
                    return (
                      <div key={date} className="card">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-light)]">
                          <span className="font-display text-[var(--ink)]">
                            {new Date(date + "T12:00:00").toLocaleDateString(undefined, {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <div className="flex items-center gap-3">
                            <TallyMarks count={dayTotal} size="sm" color={challenge.color} maxDisplay={15} />
                            <span className="text-sm font-medium text-[var(--ink-muted)]">{dayTotal}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {dayEntries.map((entry) => {
                            const entrySets = entry.sets ?? [];

                            return (
                              <div
                                key={entry._id}
                                className="flex items-center justify-between py-2 px-3 bg-[var(--paper-warm)] rounded-lg group"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="font-display text-lg text-[var(--ink)]">{entry.count}</span>
                                  {entrySets.length > 0 && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {entrySets.map((set, index) => (
                                        <div key={`${entry._id}-set-${index}`} className="flex items-center gap-2">
                                          <TallyMarks
                                            count={set.reps}
                                            size="sm"
                                            color={challenge.color}
                                            maxDisplay={15}
                                          />
                                          {index < entrySets.length - 1 && (
                                            <span className="text-[var(--ink-faint)] text-xs">+</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                {entry.note && (
                                  <span className="text-sm text-[var(--ink-muted)] italic">{entry.note}</span>
                                )}
                                {entry.feeling && (
                                  <span className="text-[var(--ink-muted)]" title={entry.feeling}>
                                    {FEELING_SYMBOLS[entry.feeling] || ""}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteEntry(entry._id)}
                                className="text-[var(--ink-faint)] hover:text-[var(--danger)] transition-colors opacity-0 group-hover:opacity-100"
                              >
                                ×
                              </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Stats sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="card text-center">
                <p className="stat-value">{stats.daysLeft}</p>
                <p className="stat-label">Days remaining</p>
              </div>
              <div className="card text-center">
                <p className="stat-value">{stats.currentStreak}</p>
                <p className="stat-label">Current streak</p>
              </div>
              <div className="card text-center">
                <p className="stat-value">{stats.longestStreak}</p>
                <p className="stat-label">Best streak</p>
              </div>
              <div className="card text-center">
                <p className="stat-value">{stats.averagePerDay.toFixed(1)}</p>
                <p className="stat-label">Average per day</p>
              </div>
            </div>
          </aside>
        </div>

        {/* Stats grid (mobile) */}
        <div className="grid grid-cols-2 gap-4 mt-8 lg:hidden">
          <div className="card text-center">
            <p className="stat-value" style={{ fontSize: 'var(--text-2xl)' }}>{stats.daysLeft}</p>
            <p className="stat-label">Days left</p>
          </div>
          <div className="card text-center">
            <p className="stat-value" style={{ fontSize: 'var(--text-2xl)' }}>{stats.currentStreak}</p>
            <p className="stat-label">Streak</p>
          </div>
          <div className="card text-center">
            <p className="stat-value" style={{ fontSize: 'var(--text-2xl)' }}>{stats.longestStreak}</p>
            <p className="stat-label">Best streak</p>
          </div>
          <div className="card text-center">
            <p className="stat-value" style={{ fontSize: 'var(--text-2xl)' }}>{stats.averagePerDay.toFixed(1)}</p>
            <p className="stat-label">Avg/day</p>
          </div>
        </div>
      </main>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-[var(--ink)]">Delete Challenge</DialogTitle>
            <DialogDescription className="text-[var(--ink-muted)]">
              Are you sure you want to delete &ldquo;{challenge.name}&rdquo;? This will also delete all {entries.length} entries. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <button className="btn btn-secondary" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn bg-[var(--danger)] text-white border-[var(--danger)] hover:bg-[var(--danger)]/90"
            >
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-[var(--ink)]">Edit Challenge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="stat-label block mb-2">Name</label>
              <input
                className="input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <label className="stat-label block mb-2">Target</label>
              <input
                className="input"
                type="number"
                value={editTarget}
                onChange={(e) => setEditTarget(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button className="btn btn-secondary" onClick={() => setShowEditDialog(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveEdit}>
              Save Changes
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
