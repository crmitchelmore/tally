"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TallyMark } from "@/components/ui/tally-mark";
import type { Challenge, CreateEntryRequest } from "@/app/api/v1/_lib/types";

export interface AddEntryDialogProps {
  challenge: Challenge;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CreateEntryRequest, "challengeId">) => Promise<void>;
}

const FEELINGS = [
  { value: "great", label: "Great", emoji: "🔥" },
  { value: "good", label: "Good", emoji: "😊" },
  { value: "okay", label: "Okay", emoji: "😐" },
  { value: "tough", label: "Tough", emoji: "😤" },
] as const;

/**
 * Dialog for adding a new entry to a challenge.
 * Fast, tactile UX with large tap targets and ink-stroke feedback.
 * Adapts UI based on challenge countType and defaultIncrement.
 */
export function AddEntryDialog({
  challenge,
  open,
  onClose,
  onSubmit,
}: AddEntryDialogProps) {
  // Get challenge settings
  const defaultIncrement = challenge.defaultIncrement ?? 1;
  const countType = challenge.countType ?? "simple";
  const unitLabel = challenge.unitLabel ?? "marks";
  
  const [count, setCount] = useState(defaultIncrement);
  const [sets, setSets] = useState<number[]>([defaultIncrement]); // For sets mode
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [feeling, setFeeling] = useState<typeof FEELINGS[number]["value"] | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const countInputRef = useRef<HTMLInputElement>(null);

  // Calculate total from sets
  const setsTotal = sets.reduce((sum, s) => sum + s, 0);
  const displayCount = countType === "sets" ? setsTotal : count;

  // Open/close dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
      // Reset form with challenge defaults
      setCount(defaultIncrement);
      setSets([defaultIncrement]);
      setDate(new Date().toISOString().split("T")[0]);
      setNote("");
      setFeeling(undefined);
      setError(null);
      setShowSuccess(false);
      // Focus count input after opening
      setTimeout(() => countInputRef.current?.select(), 50);
    } else {
      dialog.close();
    }
  }, [open, defaultIncrement]);

  // Handle click outside
  const handleDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Quick increment/decrement - uses challenge's defaultIncrement
  const incrementCount = useCallback(
    (delta: number) => {
      setCount((c) => Math.max(1, c + delta));
    },
    []
  );

  // Set manipulation for sets mode
  const addSet = useCallback(() => {
    setSets((prev) => [...prev, defaultIncrement]);
  }, [defaultIncrement]);

  const removeSet = useCallback((index: number) => {
    setSets((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  }, []);

  const updateSet = useCallback((index: number, value: number) => {
    setSets((prev) => prev.map((s, i) => i === index ? Math.max(1, value) : s));
  }, []);

  // Validate date (no future dates)
  const today = new Date().toISOString().split("T")[0];
  const isFutureDate = date > today;

  // Submit handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting || isFutureDate) return;

      setIsSubmitting(true);
      setError(null);

      try {
        await onSubmit({
          date,
          count: displayCount,
          sets: countType === "sets" ? sets : undefined,
          note: note.trim() || undefined,
          feeling,
        });

        // Show success feedback with tally animation
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 600);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add entry");
      } finally {
        setIsSubmitting(false);
      }
    },
    [displayCount, sets, countType, date, note, feeling, isSubmitting, isFutureDate, onSubmit, onClose]
  );

  if (!open) return null;

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
          <div>
            <h2 className="text-lg font-semibold text-ink">Add Entry</h2>
            <p className="text-sm text-muted">{challenge.name}</p>
          </div>
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
          {/* Count input - adapts based on countType */}
          {countType === "sets" ? (
            /* Sets mode - track each set separately */
            <div>
              <label className="block text-sm font-medium text-muted mb-3 text-center">
                Sets & {unitLabel}
              </label>
              <div className="space-y-3">
                {sets.map((setVal, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm text-muted w-16">Set {idx + 1}</span>
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        type="button"
                        onClick={() => updateSet(idx, setVal - defaultIncrement)}
                        className="w-8 h-8 rounded-full border border-border text-muted hover:text-ink hover:bg-border/50 transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={setVal}
                        onChange={(e) => updateSet(idx, parseInt(e.target.value) || 1)}
                        className="w-20 h-10 text-center text-xl font-semibold tabular-nums bg-transparent border-b-2 border-border focus:border-accent text-ink outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateSet(idx, setVal + defaultIncrement)}
                        className="w-8 h-8 rounded-full border border-border text-muted hover:text-ink hover:bg-border/50 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    {sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSet(idx)}
                        className="w-8 h-8 rounded-full text-muted hover:text-error hover:bg-error/10 transition-colors"
                        aria-label="Remove set"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSet}
                  className="w-full py-2 border border-dashed border-border rounded-xl text-muted hover:text-ink hover:border-muted transition-colors text-sm"
                >
                  + Add Set
                </button>
              </div>
              {/* Total display */}
              <div className="mt-4 text-center">
                <p className="text-sm text-muted">Total</p>
                <p className="text-3xl font-semibold text-ink tabular-nums">{setsTotal} <span className="text-base text-muted">{unitLabel}</span></p>
              </div>
              {/* Tally preview */}
              <div className="mt-4 flex justify-center">
                <TallyMark count={Math.min(setsTotal, 25)} size="md" animated />
              </div>
            </div>
          ) : (
            /* Simple count mode */
            <div className="text-center">
              <label htmlFor="count" className="block text-sm font-medium text-muted mb-3">
                How many {unitLabel}?
              </label>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => incrementCount(-defaultIncrement * 5)}
                  className="
                    w-12 h-12 rounded-full border border-border
                    text-muted hover:text-ink hover:bg-border/50
                    transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                    text-lg font-medium
                  "
                  aria-label={`Decrease by ${defaultIncrement * 5}`}
                >
                  -{defaultIncrement * 5}
                </button>
                <button
                  type="button"
                  onClick={() => incrementCount(-defaultIncrement)}
                  className="
                    w-10 h-10 rounded-full border border-border
                    text-muted hover:text-ink hover:bg-border/50
                    transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                    text-lg
                  "
                  aria-label={`Decrease by ${defaultIncrement}`}
                >
                  −
                </button>
                <input
                  ref={countInputRef}
                  id="count"
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
                  onClick={() => incrementCount(defaultIncrement)}
                  className="
                    w-10 h-10 rounded-full border border-border
                    text-muted hover:text-ink hover:bg-border/50
                    transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                    text-lg
                  "
                  aria-label={`Increase by ${defaultIncrement}`}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => incrementCount(defaultIncrement * 5)}
                  className="
                    w-12 h-12 rounded-full border border-border
                    text-muted hover:text-ink hover:bg-border/50
                    transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                    text-lg font-medium
                  "
                  aria-label={`Increase by ${defaultIncrement * 5}`}
                >
                  +{defaultIncrement * 5}
                </button>
              </div>
              {/* Unit label */}
              {unitLabel !== "marks" && (
                <p className="mt-2 text-sm text-muted">{unitLabel}</p>
              )}
              {/* Tally preview */}
              <div className="mt-4 flex justify-center">
                <TallyMark count={Math.min(count, 25)} size="md" animated />
              </div>
            </div>
          )}

          {/* Date input */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-muted mb-2">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className={`
                w-full px-4 py-3 rounded-xl border
                ${isFutureDate ? "border-error" : "border-border"}
                bg-paper text-ink
                focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                transition-colors
              `}
            />
            {isFutureDate && (
              <p className="mt-1 text-sm text-error">Future dates are not allowed</p>
            )}
          </div>

          {/* Feeling selector - progressive disclosure */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              How did it feel? <span className="font-normal">(optional)</span>
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
                  <span className="block text-2xl">{f.emoji}</span>
                  <span className="block text-xs mt-1">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note input - progressive disclosure */}
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-muted mb-2">
              Note <span className="font-normal">(optional)</span>
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Any thoughts about today's progress..."
              className="
                w-full px-4 py-3 rounded-xl border border-border
                bg-paper text-ink placeholder:text-muted/50
                focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                transition-colors resize-none
              "
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || isFutureDate}
            className={`
              w-full py-4 rounded-xl font-semibold text-lg
              transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
              ${
                showSuccess
                  ? "bg-success text-white"
                  : "bg-accent text-white hover:bg-accent/90"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : showSuccess ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Added!
              </span>
            ) : (
              `Add ${displayCount} ${unitLabel}`
            )}
          </button>
        </form>
      </div>
    </dialog>
  );
}

export default AddEntryDialog;
