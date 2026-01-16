"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TallyInput } from "./marks/TallyMarks";
import { FormPanel } from "./FormPanel";
import { Feeling } from "@/types";

// Simple feeling indicators - subtle, not tacky emojis
const FEELINGS: { value: Feeling; label: string; symbol: string }[] = [
  { value: "very-easy", label: "Effortless", symbol: "◉" },
  { value: "easy", label: "Easy", symbol: "○" },
  { value: "moderate", label: "Moderate", symbol: "◐" },
  { value: "hard", label: "Hard", symbol: "●" },
  { value: "very-hard", label: "Tough", symbol: "◉" },
];

interface AddEntrySheetProps {
  challengeId?: Id<"challenges">;
  onAdded?: () => void;
  trigger?: React.ReactNode;
}

export function AddEntrySheet({ challengeId, onAdded, trigger }: AddEntrySheetProps) {
  const { user } = useUser();
  const createEntry = useMutation(api.entries.create);
  const challenges = useQuery(
    api.challenges.listActive,
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useSetsMode, setUseSetsMode] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  
  const [formData, setFormData] = useState({
    challengeId: challengeId || ("" as Id<"challenges"> | ""),
    date: today,
    count: 1,
    note: "",
    feeling: undefined as Feeling | undefined,
    sets: [] as { reps: number }[],
  });

  // Auto-select challenge if only one exists and no challengeId provided
  useEffect(() => {
    if (!challengeId && challenges?.length === 1) {
      setFormData((prev) => ({ ...prev, challengeId: challenges[0]._id }));
    }
  }, [challenges, challengeId]);

  // Reset challengeId when provided as prop
  useEffect(() => {
    if (challengeId) {
      setFormData((prev) => ({ ...prev, challengeId }));
    }
  }, [challengeId]);

  // Calculate total count from sets
  const totalFromSets = formData.sets.reduce((sum, set) => sum + set.reps, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formData.challengeId) return;

    setIsSubmitting(true);
    try {
      const finalCount = useSetsMode ? totalFromSets : formData.count;
      const finalSets = useSetsMode && formData.sets.length > 0 ? formData.sets : undefined;

      await createEntry({
        clerkId: user.id,
        challengeId: formData.challengeId as Id<"challenges">,
        date: formData.date,
        count: finalCount,
        note: formData.note || undefined,
        feeling: formData.feeling,
        sets: finalSets,
      });
      
      // Subtle haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }

      setOpen(false);
      setFormData({
        challengeId: challengeId || "",
        date: today,
        count: 1,
        note: "",
        feeling: undefined,
        sets: [],
      });
      setUseSetsMode(false);
      onAdded?.();
    } catch (error) {
      console.error("Failed to add entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSet = () => {
    setFormData((prev) => ({
      ...prev,
      sets: [...prev.sets, { reps: 10 }],
    }));
  };

  const removeSet = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sets: prev.sets.filter((_, i) => i !== index),
    }));
  };

  const updateSetReps = (index: number, reps: number) => {
    setFormData((prev) => ({
      ...prev,
      sets: prev.sets.map((set, i) => (i === index ? { reps } : set)),
    }));
  };

  const selectedChallenge = challenges?.find((c) => c._id === formData.challengeId);
  const tallyColor = selectedChallenge?.color || "var(--ink)";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <button className="btn btn-accent fixed bottom-8 right-8 shadow-lg z-50 px-5 py-3">
            <span className="text-lg mr-1">+</span> Add Entry
          </button>
        )}
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="max-h-[90vh] overflow-hidden bg-[var(--paper)] border-t border-[var(--border-light)]"
      >
        <FormPanel className="py-6 px-[var(--space-lg)]">
          <SheetHeader className="mb-8">
            <SheetTitle className="font-display text-2xl text-[var(--ink)]">
              Log Entry
            </SheetTitle>
          </SheetHeader>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Challenge selector (if multiple) */}
            {!challengeId && challenges && challenges.length > 1 && (
              <div>
                <label className="stat-label block mb-3">Challenge</label>
                <div className="grid grid-cols-2 gap-3">
                  {challenges.map((challenge) => (
                    <button
                      key={challenge._id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, challengeId: challenge._id }))}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.challengeId === challenge._id
                          ? "border-[var(--ink)] bg-white shadow-sm"
                          : "border-[var(--border-light)] hover:border-[var(--border-medium)] bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{challenge.icon}</span>
                        <span className="font-display text-[var(--ink)]">{challenge.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected challenge display */}
            {selectedChallenge && (
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-[var(--border-light)]">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: selectedChallenge.color + "15" }}
                >
                  {selectedChallenge.icon}
                </div>
                <div>
                  <p className="font-display text-lg text-[var(--ink)]">{selectedChallenge.name}</p>
                  <p className="text-sm text-[var(--ink-muted)]">
                    Target: {selectedChallenge.targetNumber}
                  </p>
                </div>
              </div>
            )}

            {/* Mode toggle */}
            <div className="flex items-center gap-2 justify-center">
              <button
                type="button"
                onClick={() => setUseSetsMode(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !useSetsMode 
                    ? "bg-[var(--ink)] text-[var(--paper)]" 
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
              >
                Count
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseSetsMode(true);
                  if (formData.sets.length === 0) {
                    setFormData((prev) => ({ ...prev, sets: [{ reps: 10 }] }));
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  useSetsMode 
                    ? "bg-[var(--ink)] text-[var(--paper)]" 
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
              >
                Sets & Reps
              </button>
            </div>

            {/* Tally input or Sets input */}
            {!useSetsMode ? (
              <TallyInput
                value={formData.count}
                onChange={(count) => setFormData((prev) => ({ ...prev, count }))}
                max={500}
                color={tallyColor}
                inputLabel="Enter number"
              />
            ) : (
              <div className="space-y-4">
                {formData.sets.map((set, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-[var(--border-light)] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--ink-muted)]">Set {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeSet(index)}
                        className="text-[var(--ink-faint)] hover:text-[var(--danger)] transition-colors"
                      >
                        ×
                      </button>
                    </div>
                    <TallyInput
                      value={set.reps}
                      onChange={(nextValue) => updateSetReps(index, nextValue)}
                      max={500}
                      color={tallyColor}
                      inputLabel="Reps"
                      className="items-stretch"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSet}
                  className="w-full py-3 border-2 border-dashed border-[var(--border-medium)] rounded-lg 
                           text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--ink-muted)] 
                           transition-colors"
                >
                  + Add Set
                </button>
                {formData.sets.length > 0 && (
                  <div className="text-center pt-2">
                    <span className="text-[var(--ink-muted)]">Total: </span>
                    <span className="stat-value" style={{ fontSize: 'var(--text-xl)' }}>
                      {totalFromSets}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Date picker */}
            <div>
              <label className="stat-label block mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                max={today}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="input"
              />
            </div>

            {/* Feeling - subtle, not emoji-heavy */}
            <div>
              <label className="stat-label block mb-3">How did it feel?</label>
              <div className="flex justify-between gap-2">
                {FEELINGS.map((feeling) => (
                  <button
                    key={feeling.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ 
                      ...prev, 
                      feeling: prev.feeling === feeling.value ? undefined : feeling.value 
                    }))}
                    className={`flex-1 py-3 px-2 rounded-lg border transition-all text-center ${
                      formData.feeling === feeling.value
                        ? "border-[var(--ink)] bg-white shadow-sm"
                        : "border-[var(--border-light)] hover:border-[var(--border-medium)] bg-white"
                    }`}
                    title={feeling.label}
                  >
                    <span className="block text-lg mb-1">{feeling.symbol}</span>
                    <span className="text-xs text-[var(--ink-muted)]">{feeling.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="stat-label block mb-2">Note (optional)</label>
              <input
                type="text"
                placeholder="Add a note..."
                value={formData.note}
                onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                className="input"
              />
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              className="btn btn-primary w-full py-4 text-base"
              disabled={isSubmitting || !formData.challengeId || (useSetsMode && totalFromSets === 0) || (!useSetsMode && formData.count === 0)}
            >
              {isSubmitting ? "Logging..." : "Log Entry"}
            </button>
          </form>
        </FormPanel>
      </SheetContent>
    </Sheet>
  );
}
