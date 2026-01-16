"use client";

import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Challenge, Entry } from "@/types";
import { calculateStats, formatPaceStatus } from "@/lib/stats";
import { AddEntrySheet } from "./AddEntrySheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Edit2, Trash2, Archive, X, Calendar } from "lucide-react";
import { useState } from "react";

interface ChallengeDetailViewProps {
  challengeId: Id<"challenges">;
  onClose: () => void;
}

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
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const stats = calculateStats(challenge as Challenge, entries as Entry[]);
  const pace = formatPaceStatus(stats.paceStatus);
  const progress = Math.min(100, (stats.total / challenge.targetNumber) * 100);

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
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              <AddEntrySheet
                challengeId={challengeId}
                trigger={
                  <Button size="sm">Add Entry</Button>
                }
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setEditName(challenge.name); setEditTarget(String(challenge.targetNumber)); setShowEditDialog(true); }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleArchive}
              >
                <Archive className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Challenge header */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ backgroundColor: challenge.color + "20", color: challenge.color }}
          >
            {challenge.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{challenge.name}</h1>
            <p className={`${pace.color} font-medium`}>{pace.text}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-4xl font-bold text-gray-900">{stats.total}</span>
            <span className="text-gray-500">of {challenge.targetNumber}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: challenge.color }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {stats.remaining} remaining • {stats.requiredPerDay.toFixed(1)} per day to stay on pace
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.daysLeft}</p>
            <p className="text-sm text-gray-500">Days left</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.currentStreak}</p>
            <p className="text-sm text-gray-500">Current streak</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.longestStreak}</p>
            <p className="text-sm text-gray-500">Best streak</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.averagePerDay.toFixed(1)}</p>
            <p className="text-sm text-gray-500">Avg/day</p>
          </div>
        </div>

        {/* Entry history */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">History</h2>
          {sortedDates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No entries yet. Add your first entry to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDates.map((date) => (
                <div key={date} className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {new Date(date + "T12:00:00").toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-gray-500 ml-auto">
                      Total: {entriesByDate[date].reduce((sum, e) => sum + e.count, 0)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {entriesByDate[date].map((entry) => (
                      <div
                        key={entry._id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-lg">{entry.count}</span>
                          {entry.sets && entry.sets.length > 0 && (
                            <span className="text-sm text-gray-500">
                              ({entry.sets.map((s, i) => s.reps).join(" + ")})
                            </span>
                          )}
                          {entry.note && (
                            <span className="text-sm text-gray-500">{entry.note}</span>
                          )}
                          {entry.feeling && (
                            <span className="text-lg">
                              {entry.feeling === "very-easy" && "😊"}
                              {entry.feeling === "easy" && "🙂"}
                              {entry.feeling === "moderate" && "😐"}
                              {entry.feeling === "hard" && "😓"}
                              {entry.feeling === "very-hard" && "😤"}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteEntry(entry._id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Challenge</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{challenge.name}&rdquo;? This will also delete all {entries.length} entries. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Challenge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-target">Target</Label>
              <Input
                id="edit-target"
                type="number"
                value={editTarget}
                onChange={(e) => setEditTarget(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
