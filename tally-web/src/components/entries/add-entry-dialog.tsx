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
 * Compact layout to fit on standard viewports.
 */
export function AddEntryDialog({
  challenge,
  open,
  onClose,
  onSubmit,
}: AddEntryDialogProps) {
  const countType = challenge.countType ?? "simple";
  const unitLabel = challenge.unitLabel ?? "marks";
  
  // Use string for count to allow empty input
  const [countStr, setCountStr] = useState("1");
  const [sets, setSets] = useState<string[]>(["1"]);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [feeling, setFeeling] = useState<typeof FEELINGS[number]["value"] | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const countInputRef = useRef<HTMLInputElement>(null);
  const firstSetRef = useRef<HTMLInputElement>(null);

  const count = parseInt(countStr, 10) || 0;
  const setsTotal = sets.reduce((sum, s) => sum + (parseInt(s, 10) || 0), 0);
  const displayCount = countType === "sets" ? setsTotal : count;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
      setCountStr("1");
      setSets(["1"]);
      setDate(new Date().toISOString().split("T")[0]);
      setNote("");
      setFeeling(undefined);
      setError(null);
      setShowSuccess(false);
      setShowOptions(false);
      setTimeout(() => {
        if (countType === "sets") {
          firstSetRef.current?.select();
        } else {
          countInputRef.current?.select();
        }
      }, 50);
    } else {
      dialog.close();
    }
  }, [open, countType]);

  const handleDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const incrementCount = useCallback((delta: number) => {
    setCountStr((c) => String(Math.max(0, (parseInt(c, 10) || 0) + delta)));
  }, []);

  const addSet = useCallback(() => {
    setSets((prev) => [...prev, "1"]);
  }, []);

  const removeSet = useCallback((index: number) => {
    setSets((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  }, []);

  const updateSet = useCallback((index: number, value: string) => {
    setSets((prev) => prev.map((s, i) => i === index ? value : s));
  }, []);

  const incrementSet = useCallback((index: number, delta: number) => {
    setSets((prev) => prev.map((s, i) => 
      i === index ? String(Math.max(0, (parseInt(s, 10) || 0) + delta)) : s
    ));
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const isFutureDate = date > today;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting || isFutureDate || displayCount <= 0) return;

      setIsSubmitting(true);
      setError(null);

      try {
        const numericSets = sets.map(s => parseInt(s, 10) || 0).filter(n => n > 0);
        await onSubmit({
          date,
          count: displayCount,
          sets: countType === "sets" ? numericSets : undefined,
          note: note.trim() || undefined,
          feeling,
        });

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
      <div className="bg-surface rounded-2xl shadow-xl border border-border overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header - compact */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-ink">Add Entry</h2>
            <p className="text-xs text-muted">{challenge.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-border/50 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form - scrollable */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Count input */}
          {countType === "sets" ? (
            <div>
              <label className="block text-sm font-medium text-muted mb-2 text-center">
                Sets & {unitLabel}
              </label>
              <div className="space-y-2">
                {sets.map((setVal, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-muted w-12">Set {idx + 1}</span>
                    <div className="flex items-center gap-1 flex-1">
                      <button type="button" onClick={() => incrementSet(idx, -1)}
                        className="w-7 h-7 rounded-full border border-border text-muted hover:text-ink hover:bg-border/50 text-sm">−</button>
                      <input 
                        ref={idx === 0 ? firstSetRef : undefined}
                        type="number" 
                        min={0} 
                        value={setVal}
                        onChange={(e) => updateSet(idx, e.target.value)}
                        className="w-14 h-8 text-center text-lg font-semibold tabular-nums bg-transparent border-b-2 border-border focus:border-accent text-ink outline-none" />
                      <button type="button" onClick={() => incrementSet(idx, 1)}
                        className="w-7 h-7 rounded-full border border-border text-muted hover:text-ink hover:bg-border/50 text-sm">+</button>
                    </div>
                    {sets.length > 1 && (
                      <button type="button" onClick={() => removeSet(idx)}
                        className="w-7 h-7 rounded-full text-muted hover:text-error text-lg">×</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addSet}
                  className="w-full py-1.5 border border-dashed border-border rounded-lg text-muted hover:text-ink text-xs">+ Add Set</button>
              </div>
              <div className="mt-3 flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-semibold text-ink tabular-nums">{setsTotal}</p>
                  <p className="text-xs text-muted">{unitLabel}</p>
                </div>
                <TallyMark count={Math.min(setsTotal, 25)} size="sm" animated />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <label htmlFor="count" className="block text-sm font-medium text-muted mb-2">
                How many {unitLabel}?
              </label>
              {/* -100, -10, -1 buttons */}
              <div className="flex items-center justify-center gap-1 mb-2">
                <button type="button" onClick={() => incrementCount(-100)}
                  className="w-12 h-8 rounded-lg border border-border text-muted hover:text-ink hover:bg-border/50 text-xs font-medium">
                  −100
                </button>
                <button type="button" onClick={() => incrementCount(-10)}
                  className="w-10 h-8 rounded-lg border border-border text-muted hover:text-ink hover:bg-border/50 text-xs font-medium">
                  −10
                </button>
                <button type="button" onClick={() => incrementCount(-1)}
                  className="w-8 h-8 rounded-lg border border-border text-muted hover:text-ink hover:bg-border/50 text-sm font-medium">
                  −1
                </button>
              </div>
              {/* Main input */}
              <input
                ref={countInputRef}
                id="count"
                type="number"
                min={0}
                max={99999}
                value={countStr}
                onChange={(e) => setCountStr(e.target.value)}
                className="w-28 h-14 text-center text-4xl font-semibold tabular-nums bg-transparent border-b-2 border-border focus:border-accent text-ink outline-none"
              />
              {/* +1, +10, +100 buttons */}
              <div className="flex items-center justify-center gap-1 mt-2">
                <button type="button" onClick={() => incrementCount(1)}
                  className="w-8 h-8 rounded-lg border border-border text-muted hover:text-ink hover:bg-border/50 text-sm font-medium">
                  +1
                </button>
                <button type="button" onClick={() => incrementCount(10)}
                  className="w-10 h-8 rounded-lg border border-border text-muted hover:text-ink hover:bg-border/50 text-xs font-medium">
                  +10
                </button>
                <button type="button" onClick={() => incrementCount(100)}
                  className="w-12 h-8 rounded-lg border border-border text-muted hover:text-ink hover:bg-border/50 text-xs font-medium">
                  +100
                </button>
              </div>
              {/* Tally preview - compact */}
              <div className="mt-3 flex justify-center">
                <TallyMark count={Math.min(count, 25)} size="sm" animated />
              </div>
            </div>
          )}

          {/* Date - inline compact */}
          <div className="flex items-center gap-3">
            <label htmlFor="date" className="text-sm font-medium text-muted whitespace-nowrap">Date</label>
            <input
              id="date"
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm
                ${isFutureDate ? "border-error" : "border-border"}
                bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-accent`}
            />
          </div>
          {isFutureDate && <p className="text-xs text-error">Future dates are not allowed</p>}

          {/* Collapsible options */}
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="w-full flex items-center justify-between py-2 text-sm text-muted hover:text-ink"
          >
            <span>More options</span>
            <svg className={`w-4 h-4 transition-transform ${showOptions ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showOptions && (
            <div className="space-y-4 pt-1">
              {/* Feeling selector - compact */}
              <div>
                <label className="block text-xs font-medium text-muted mb-2">
                  How did it feel?
                </label>
                <div className="flex gap-1.5">
                  {FEELINGS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFeeling(feeling === f.value ? undefined : f.value)}
                      className={`flex-1 py-2 rounded-lg border text-center transition-colors
                        ${feeling === f.value
                          ? "border-accent bg-accent/10 text-ink"
                          : "border-border text-muted hover:border-muted"}`}
                    >
                      <span className="block text-lg">{f.emoji}</span>
                      <span className="block text-[10px] mt-0.5">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Note input - compact */}
              <div>
                <label htmlFor="note" className="block text-xs font-medium text-muted mb-1.5">Note</label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Any thoughts..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-paper text-ink placeholder:text-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-2 rounded-lg bg-error/10 border border-error/20 text-error text-xs">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || isFutureDate}
            className={`w-full py-3 rounded-xl font-semibold text-base transition-all
              ${showSuccess ? "bg-success text-white" : "bg-accent text-white hover:bg-accent/90"}
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : showSuccess ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
