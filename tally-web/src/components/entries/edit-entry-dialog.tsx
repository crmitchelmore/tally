"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TallyMark } from "@/components/ui/tally-mark";
import type { Entry, UpdateEntryRequest } from "@/app/api/v1/_lib/types";

export interface EditEntryDialogProps {
  entry: Entry | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateEntryRequest) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const FEELINGS = [
  { value: "great", label: "Great", icon: "✦" },
  { value: "good", label: "Good", icon: "○" },
  { value: "okay", label: "Okay", icon: "·" },
  { value: "tough", label: "Tough", icon: "—" },
] as const;

/**
 * Dialog for editing an existing entry.
 */
export function EditEntryDialog({
  entry,
  open,
  onClose,
  onSubmit,
  onDelete,
}: EditEntryDialogProps) {
  const [count, setCount] = useState(1);
  const [sets, setSets] = useState<number[]>([]);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [feeling, setFeeling] = useState<typeof FEELINGS[number]["value"] | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Check if this entry uses sets mode
  const useSetsMode = sets.length > 0;

  // Populate form when entry changes
  useEffect(() => {
    if (entry) {
      setCount(entry.count);
      setSets(entry.sets || []);
      setDate(entry.date);
      setNote(entry.note || "");
      setFeeling(entry.feeling);
      setError(null);
      setShowDeleteConfirm(false);
    }
  }, [entry]);

  // Open/close dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && entry) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open, entry]);

  // Handle click outside
  const handleDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  // Quick increment/decrement
  const incrementCount = useCallback((delta: number) => {
    setCount((c) => Math.max(1, c + delta));
  }, []);

  // Validate date (no future dates)
  const today = new Date().toISOString().split("T")[0];
  const isFutureDate = date > today;

  // Update a specific set value
  const updateSetValue = useCallback((index: number, value: number) => {
    setSets((prev) => {
      const newSets = [...prev];
      newSets[index] = Math.max(0, value);
      return newSets;
    });
  }, []);

  // Add a new set (functional update avoids stale state)
  const addSet = useCallback(() => {
    setSets((prev) => {
      const lastValue = prev.length > 0 ? prev[prev.length - 1] : 10;
      return [...prev, lastValue];
    });
  }, []);

  // Remove the last set (functional update)
  const removeSet = useCallback(() => {
    setSets((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  // Compute total from sets when in sets mode
  const computedCount = useSetsMode ? sets.reduce((sum, s) => sum + s, 0) : count;

  // Submit handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!entry || isSubmitting || isFutureDate) return;

      setIsSubmitting(true);
      setError(null);

      try {
        await onSubmit(entry.id, {
          date,
          count: computedCount,
          sets: useSetsMode ? sets : undefined,
          note: note.trim() || undefined,
          feeling,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update entry");
      } finally {
        setIsSubmitting(false);
      }
    },
    [entry, computedCount, sets, useSetsMode, date, note, feeling, isSubmitting, isFutureDate, onSubmit, onClose]
  );

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (!entry || !onDelete || isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onDelete(entry.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [entry, onDelete, isDeleting, onClose]);

  if (!open || !entry) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className="
        fixed inset-0 z-[1400] m-auto
        w-full max-w-md p-0
        bg-transparent backdrop:bg-ink/40 backdrop:backdrop-blur-sm
        open:animate-dialog-in
      "
    >
      <div className="bg-surface rounded-2xl shadow-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Edit Entry</h2>
          <button
            type="button"
            onClick={onClose}
            className="
              w-8 h-8 rounded-full flex items-center justify-center
              text-muted hover:text-ink hover:bg-border/50
              transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
            "
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sets mode or simple count */}
          {useSetsMode ? (
            /* Sets mode - show individual sets */
            <fieldset>
              <legend className="block text-sm font-medium text-muted mb-3">
                Sets ({sets.length} sets = {computedCount} total)
              </legend>
              <div className="space-y-2">
                {sets.map((setVal, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <label htmlFor={`set-${idx}`} className="text-sm text-muted w-12">Set {idx + 1}:</label>
                    <button
                      type="button"
                      onClick={() => updateSetValue(idx, setVal - 1)}
                      className="w-8 h-8 rounded-full border border-border text-muted hover:text-ink hover:bg-border/50 text-lg"
                      aria-label={`Decrease set ${idx + 1}`}
                    >
                      −
                    </button>
                    <input
                      id={`set-${idx}`}
                      type="number"
                      min={0}
                      value={setVal}
                      onChange={(e) => updateSetValue(idx, parseInt(e.target.value) || 0)}
                      className="w-20 h-10 text-center text-lg font-semibold tabular-nums bg-transparent border-b-2 border-border focus:border-accent text-ink outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateSetValue(idx, setVal + 1)}
                      className="w-8 h-8 rounded-full border border-border text-muted hover:text-ink hover:bg-border/50 text-lg"
                      aria-label={`Increase set ${idx + 1}`}
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={addSet}
                  className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted hover:text-ink hover:bg-border/50"
                >
                  + Add Set
                </button>
                {sets.length > 1 && (
                  <button
                    type="button"
                    onClick={removeSet}
                    className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted hover:text-ink hover:bg-border/50"
                  >
                    Remove Last
                  </button>
                )}
              </div>
              <div className="mt-4 flex justify-center">
                <TallyMark count={Math.min(computedCount, 25)} size="md" />
              </div>
            </fieldset>
          ) : (
            /* Simple count mode */
            <div className="text-center">
              <label htmlFor="edit-count" className="block text-sm font-medium text-muted mb-3">
                Count
              </label>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => incrementCount(-5)}
                  className="
                    w-12 h-12 rounded-full border border-border
                    text-muted hover:text-ink hover:bg-border/50
                    transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                    text-lg font-medium
                  "
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => incrementCount(-1)}
                  className="
                    w-10 h-10 rounded-full border border-border
                    text-muted hover:text-ink hover:bg-border/50
                    transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                    text-lg
                  "
                >
                  −
                </button>
                <input
                  id="edit-count"
                  type="number"
                  min={1}
                  max={9999}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="
                    w-24 h-16 text-center text-4xl font-semibold tabular-nums
                    bg-transparent border-b-2 border-border focus:border-accent
                    text-ink outline-none
                  "
                />
                <button
                  type="button"
                  onClick={() => incrementCount(1)}
                  className="
                    w-10 h-10 rounded-full border border-border
                    text-muted hover:text-ink hover:bg-border/50
                    transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                    text-lg
                  "
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => incrementCount(5)}
                  className="
                    w-12 h-12 rounded-full border border-border
                    text-muted hover:text-ink hover:bg-border/50
                    transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                    text-lg font-medium
                  "
                >
                  +5
                </button>
              </div>
              <div className="mt-4 flex justify-center">
                <TallyMark count={Math.min(count, 25)} size="md" />
              </div>
            </div>
          )}

          {/* Date input */}
          <div>
            <label htmlFor="edit-date" className="block text-sm font-medium text-muted mb-2">
              Date
            </label>
            <input
              id="edit-date"
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className={`
                w-full px-4 py-3 rounded-xl border
                ${isFutureDate ? "border-error" : "border-border"}
                bg-paper text-ink
                focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
              `}
            />
            {isFutureDate && (
              <p className="mt-1 text-sm text-error">Future dates are not allowed</p>
            )}
          </div>

          {/* Feeling selector */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              How did it feel?
            </label>
            <div className="flex gap-2">
              {FEELINGS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFeeling(feeling === f.value ? undefined : f.value)}
                  className={`
                    flex-1 py-3 rounded-xl border text-center
                    transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                    ${
                      feeling === f.value
                        ? "border-accent bg-accent/10 text-ink"
                        : "border-border text-muted hover:border-muted"
                    }
                  `}
                >
                  <span className="block text-lg">{f.icon}</span>
                  <span className="block text-xs mt-1">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note input */}
          <div>
            <label htmlFor="edit-note" className="block text-sm font-medium text-muted mb-2">
              Note
            </label>
            <textarea
              id="edit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Any thoughts..."
              className="
                w-full px-4 py-3 rounded-xl border border-border
                bg-paper text-ink placeholder:text-muted/50
                focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                resize-none
              "
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {onDelete && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-3 rounded-xl border border-border text-ink font-medium hover:bg-border/50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 py-3 rounded-xl bg-error text-white font-medium hover:bg-error/90 disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Confirm Delete"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="
                      px-4 py-3 rounded-xl border border-error/30 text-error font-medium
                      hover:bg-error/10 transition-colors
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error
                    "
                  >
                    Delete
                  </button>
                )}
              </>
            )}
            {!showDeleteConfirm && (
              <button
                type="submit"
                disabled={isSubmitting || isFutureDate}
                className="
                  flex-1 py-3 rounded-xl font-semibold
                  bg-accent text-white hover:bg-accent/90
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                "
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </form>
      </div>
    </dialog>
  );
}

export default EditEntryDialog;
