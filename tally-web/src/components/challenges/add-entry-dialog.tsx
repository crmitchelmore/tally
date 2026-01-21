"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Challenge, CountType } from "@/app/api/v1/_lib/types";

export interface AddEntryDialogProps {
  open: boolean;
  challenge: Challenge | null;
  onClose: () => void;
  onSubmit: (challengeId: string, count: number, sets?: number[]) => void;
}

/**
 * Dialog for adding entries to a challenge.
 * Supports simple count and sets/reps modes.
 */
export function AddEntryDialog({ open, challenge, onClose, onSubmit }: AddEntryDialogProps) {
  const [count, setCount] = useState("");
  const [sets, setSets] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  
  const countInputRef = useRef<HTMLInputElement>(null);
  const firstSetRef = useRef<HTMLInputElement>(null);

  // Extract with defaults for backward compatibility
  const countType = challenge?.countType ?? "simple";
  const unitLabel = challenge?.unitLabel ?? "reps";
  const increment = challenge?.defaultIncrement ?? 1;

  // Focus appropriate input on open
  useEffect(() => {
    if (open && challenge) {
      const timer = setTimeout(() => {
        if (countType === "sets") {
          firstSetRef.current?.focus();
        } else {
          countInputRef.current?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, challenge, countType]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  // Reset form on open
  useEffect(() => {
    if (open) {
      setCount("");
      setSets([""]);
    }
  }, [open]);

  const handleAddSet = useCallback(() => {
    setSets(prev => [...prev, ""]);
  }, []);

  const handleRemoveSet = useCallback((index: number) => {
    setSets(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSetChange = useCallback((index: number, value: string) => {
    setSets(prev => prev.map((s, i) => i === index ? value : s));
  }, []);

  const totalFromSets = sets.reduce((sum, s) => sum + (parseInt(s, 10) || 0), 0);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;
    
    setSubmitting(true);
    
    if (challenge.countType === "sets") {
      const setsArray = sets.map(s => parseInt(s, 10) || 0).filter(n => n > 0);
      const total = setsArray.reduce((sum, n) => sum + n, 0);
      if (total > 0) {
        onSubmit(challenge.id, total, setsArray);
      }
    } else {
      const total = parseInt(count, 10) || 0;
      if (total > 0) {
        onSubmit(challenge.id, total);
      }
    }
    
    setSubmitting(false);
    onClose();
  }, [challenge, count, sets, onSubmit, onClose]);

  const handleQuickAdd = useCallback((amount: number) => {
    if (!challenge) return;
    onSubmit(challenge.id, amount);
    onClose();
  }, [challenge, onSubmit, onClose]);

  if (!open || !challenge) return null;

  const isValid = challenge.countType === "sets" 
    ? totalFromSets > 0 
    : (parseInt(count, 10) || 0) > 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-ink/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-entry-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-lg overflow-hidden pointer-events-auto">
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 id="add-entry-title" className="text-lg font-semibold text-ink">
                  Add Entry
                </h2>
                <p className="text-sm text-muted">{challenge.name}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:bg-border/50 transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Quick add buttons */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Quick Add</label>
                <div className="flex gap-2 flex-wrap">
                  {[increment, increment * 5, increment * 10, increment * 25].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleQuickAdd(n)}
                      className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
                    >
                      +{n} {unitLabel}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <label className="block text-sm font-medium text-ink mb-2">Or enter custom amount</label>
                
                {countType === "sets" ? (
                  /* Sets/Reps mode */
                  <div className="space-y-3">
                    {sets.map((setVal, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm text-muted w-16">Set {index + 1}</span>
                        <input
                          ref={index === 0 ? firstSetRef : undefined}
                          type="number"
                          min={0}
                          value={setVal}
                          onChange={(e) => handleSetChange(index, e.target.value)}
                          placeholder="0"
                          className="
                            flex-1 px-3 py-2 rounded-lg
                            bg-paper border border-border
                            text-ink placeholder:text-muted/60 tabular-nums text-center
                            focus:outline-none focus:ring-2 focus:ring-accent
                          "
                        />
                        <span className="text-sm text-muted w-12">{unitLabel}</span>
                        {sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(index)}
                            className="text-muted hover:text-error transition-colors"
                            aria-label="Remove set"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddSet}
                      className="text-sm text-accent hover:underline"
                    >
                      + Add another set
                    </button>
                    {totalFromSets > 0 && (
                      <p className="text-sm font-medium text-ink">
                        Total: {totalFromSets} {unitLabel}
                      </p>
                    )}
                  </div>
                ) : (
                  /* Simple count mode */
                  <div className="flex items-center gap-3">
                    <input
                      ref={countInputRef}
                      type="number"
                      min={1}
                      value={count}
                      onChange={(e) => setCount(e.target.value)}
                      placeholder={String(increment)}
                      className="
                        flex-1 px-4 py-3 rounded-lg text-xl
                        bg-paper border border-border
                        text-ink placeholder:text-muted/60 tabular-nums text-center
                        focus:outline-none focus:ring-2 focus:ring-accent
                      "
                    />
                    <span className="text-muted">{unitLabel}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-ink hover:bg-border/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !isValid}
                className="
                  px-5 py-2 rounded-lg text-sm font-medium
                  bg-accent text-white
                  hover:bg-accent/90 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {submitting ? "Adding..." : "Add Entry"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default AddEntryDialog;
